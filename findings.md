# Findings: fix-chat-ordering-timestamps

## Bug 1 — outgoing-order (tin gửi lộn thứ tự)

### Nguyên nhân gốc (đã xác nhận bằng đọc code)

1. **Sort chỉ theo `timestamp`, không tiebreaker** — `chatStore.ts:456` (addMessage) + `470` (prependMessages): `updated.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))`. JS sort ổn định → khi 2 tin real có server ts **bằng nhau tới từng ms** (gửi nhanh), thứ tự cuối = **thứ tự echo đến store**, không phải thứ tự người dùng gửi. Echo trả ngược (B trước A) → B hiện trên A vĩnh viễn.
2. **Real echo mang ts server ≠ ts client của temp** — temp tạo bằng `Date.now()` client (MessageInput.tsx:1997); real echo dùng `parseInt(msg.data?.ts)` server (useZaloEvents.ts:1034). Sai lệch vài ms/giây (lệch đồng hồ) → bubble **dịch chuyển vị trí** khi temp→real, biểu hiện "nhảy".
3. **Strategy 2 (content match) xoá TOÀN BỘ temp trùng text** — `chatStore.ts:446-449`: filter xoá hết temp có `extractDedupText(content) === incomingText`. Gửi 2 tin cùng nội dung → echo đầu xoá luôn cả 2 temp → UI giữa chừng chỉ còn 1 bubble; 2 real re-append theo thứ tự echo.
4. **Retry dùng `queue.unshift`** — `MessageQueue.ts:348`: tin fail retry được gửi SAU các tin đứng sau nó trong queue → real của nó có ts server lớn hơn → sort xuống cuối, temp vốn ở đúng vị trí bị "nhảy" xuống. (Giảm thiểu nhờ giữ ts client khi thay temp.)
5. **Race echo đến trước IPC resolve** — `MessageQueue.ts:300-307` set `real_msg_id` sau khi promise API resolve; MQTT echo có thể đến trước → Strategy 1 (real_msg_id match) fail → rơi xuống Strategy 2 (content). Đây là lý do Strategy 2 phải tồn tại và phải sửa cho đúng (chỉ xoá 1 temp).

### Sequence bug (2 tin A,B gửi nhanh, echo ngược)

```
tempA(ts=1000), tempB(ts=1001)          → [A,B] ✓
echo B trước: remove tempB → [A, realB(ts_server=B)], sort → vị trí ts
echo A sau: remove tempA → [realB, realA], sort bằng ts → [B,A] ✗ LỘN
```

### Giải pháp chốt

- `send_seq` monotonic trên MessageItem (module counter trong chatStore) — gán mọi outgoing temp trong `addMessage`.
- Real echo kế thừa `send_seq` + ts client từ temp khớp.
- Sort `(timestamp, send_seq)`, tin không seq xếp sau (Number.MAX_SAFE_INTEGER).
- Strategy 2 chỉ xoá **1** temp khớp đầu tiên.
- Không đổi MessageQueue retry (chấp nhận), không đổi schema DB/IPC/backend.

## Bug 2 — timestamp-gap (timestamp hiện quá nhiều)

### Nguyên nhân gốc

`ChatWindow.tsx:2751-2753`:
```ts
const showTime = !prevMsg ||
  (msg.timestamp - prevMsg.timestamp > 30 * 60 * 1000) ||
  prevMsg.sender_id !== msg.sender_id;   // ← BUG: bắn sau hầu hết tin
```
Điều kiện sender-change bắn true mỗi lần đổi chiều gửi/nhận (sender = self vs contact) → pill timestamp hiện sau gần như mọi tin, vô hiệu hoá ngưỡng 30 phút. `showTime` còn được tái sử dụng ở `2996` cho tên người gửi group — phải tách riêng.

### Tham chiếu đúng đã có

- `QuickChatModal.tsx:677`: `showTime = idx === 0 || gap > 5 * 60 * 1000` — đã đúng rule mong muốn.
- Ngưỡng dùng chung: `5 * 60 * 1000` (5 phút).

### Giải pháp chốt

- `MSG_TIME_GAP_MS = 5 * 60 * 1000` export từ `src/ui/lib/chat/messageParser.ts` (module shared, tránh circular import).
- `showTime` = `!prevMsg || gap ≥ MSG_TIME_GAP_MS`.
- `showSenderName` = `!isSent && thread_type===1 && (đổi sender || gap)` — giữ hành vi group.

## Ràng buộc

- Không đổi schema DB, IPC, backend, bridge.
- Tránh circular import (hằng số để ở module shared, không import ngược ChatWindow/QuickChatModal).
- Sau reload history từ DB, outgoing dùng ts server (sai lệch nhỏ vs ts client) — chấp nhận.
