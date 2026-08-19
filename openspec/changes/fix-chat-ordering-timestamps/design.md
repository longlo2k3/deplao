# Design: fix-chat-ordering-timestamps

## Context

Hai bug độc lập, cùng vùng UI chat store + render. Không đổi schema DB / IPC / backend.

## Bug 1 — outgoing-order

### Root cause (đã xác minh trong code)

| # | Cơ chế | Vị trí |
|---|--------|--------|
| 1 | Sort chỉ theo `timestamp`, không tiebreaker → stable sort đóng băng theo thứ tự echo đến khi ts bằng nhau | `chatStore.ts:456` |
| 2 | Real echo mang ts server ≠ ts client của temp → bubble dịch vị trí khi thay thế | `chatStore.ts:427–451` |
| 3 | Strategy 2 (content match) filter **toàn bộ** temp trùng text → mất bubble giữa chừng | `chatStore.ts:446–449` |
| 4 | Retry dùng `queue.unshift` → real của tin retry có ts server lớn hơn, sort xuống cuối | `MessageQueue.ts:348` (giảm thiểu nhờ #2) |

### Giải pháp

**D1. `MessageItem.send_seq: number`** (field optional mới, chỉ ở runtime, không persist DB).

**D2. Counter monotonic toàn cục** trong `chatStore.ts` (module-level `let nextSendSeq = 0`):
- Trong `addMessage`, nếu message là outgoing temp (`is_sent === 1 && msg_id.startsWith('temp_')` và chưa có `send_seq`) → gán `send_seq = ++nextSendSeq`. Bao phủ mọi đường gửi đi qua store (MessageInput, QuickChatModal, forward, useChat).

**D3. Kế thừa ordering khi real thay thế temp**:
- Trong nhánh self-dedup (`message.is_sent === 1 && !temp_`), khi tìm thấy temp khớp:
  - Strategy 1 (`real_msg_id` match): capture temp đó, `realMsg.send_seq = temp.send_seq`, và `realMsg.timestamp = temp.timestamp` (giữ vị trí client).
  - Strategy 2 (content match): chỉ xoá **1 temp khớp đầu tiên**, capture send_seq + timestamp tương tự.
- Lý do giữ ts client: `timestamp` của outgoing là thời điểm người dùng bấm gửi (đúng trực giác); ts server chỉ khác vài ms hoặc lệch đồng hồ → giữ ts client chống bubble "nhảy". Lưu ý: sau reload (history từ DB), outgoing dùng ts server — chấp nhận sai lệch nhỏ này.

**D4. Sort comparator mới** (áp dụng `addMessage:456` + `prependMessages:470`):
```ts
const sortMsgs = (a: MessageItem, b: MessageItem) =>
  (a.timestamp || 0) - (b.timestamp || 0) ||
  (a.send_seq ?? Number.MAX_SAFE_INTEGER) - (b.send_seq ?? Number.MAX_SAFE_INTEGER);
```

**D5. Không đổi** retry `unshift` trong MessageQueue — nhờ D3, bubble giữ vị trí cũ; thứ tự server thực tế của tin retry là điều không thể kiểm soát (tin đã fail, gửi lại muộn hơn). Ghi nhận là hành vi chấp nhận được.

### Sequence (2 tin A,B gửi nhanh, echo ngược thứ tự)

```
UI:      tempA(ts=1000, seq=1), tempB(ts=1001, seq=2)   → mảng [A,B]
Echo B:  match tempB → remove tempB, realB(ts=1001, seq=2) → [tempA, realB], sort(ts,seq) → [A,B]
Echo A:  match tempA → remove tempA, realA(ts=1000, seq=1) → [realB, realA], sort → [A,B] ✓
```

## Bug 2 — timestamp-gap

### Root cause (đã xác minh)

`ChatWindow.tsx:2751–2753` — `showTime = !prevMsg || gap > 30min || prevMsg.sender_id !== msg.sender_id`. Điều kiện sender-change bắn sau hầu hết tin (gửi/nhận xen kẽ) → timestamp hiện liên tục. `showTime` còn được dùng lại ở `2996` cho tên người gửi trong group.

### Giải pháp

**D6. Hằng số dùng chung** `MSG_TIME_GAP_MS = 5 * 60 * 1000` (khớp ngưỡng đang dùng ở `QuickChatModal.tsx:677`). Đặt trong module shared để tránh circular import (ChatWindow ↔ QuickChatModal): `src/ui/lib/chat/messageParser.ts` (module đã dùng chung, export thêm `MSG_TIME_GAP_MS`).

**D7. Tách 2 quy tắc** trong `renderItem`:
```ts
const showTime = !prevMsg || (msg.timestamp - prevMsg.timestamp > MSG_TIME_GAP_MS);
const showSenderName = !isSent && msg.thread_type === 1 &&
  (!prevMsg || prevMsg.sender_id !== msg.sender_id || msg.timestamp - prevMsg.timestamp > MSG_TIME_GAP_MS);
```
- `showTime` → dùng ở pill timestamp (2782, 2906).
- `showSenderName` → thay `showTime` ở điều kiện tên group (2996).
- QuickChatModal (677) đổi sang import hằng số chung (đồng bộ, không đổi hành vi).

## Files

| File | Thay đổi |
|---|---|
| `src/ui/store/chatStore.ts` | `MessageItem.send_seq`, counter, D3, D4 (sort 456/470), Strategy 2 xoá 1 temp |
| `src/ui/lib/chat/messageParser.ts` | export `MSG_TIME_GAP_MS` |
| `src/ui/components/chat/ChatWindow.tsx` | D7 (2751–2753, 2996), import hằng số |
| `src/ui/components/chat/QuickChatModal.tsx` | dùng `MSG_TIME_GAP_MS` (677) |

## Rollback

Thay đổi cục bộ trong UI layer, không đụng DB/backend → revert các file trên là đủ. Không migration, không data migration.

## Risks

- **Circular import**: tránh bằng cách để hằng số ở `messageParser.ts` (không import ngược lại ChatWindow/QuickChatModal).
- **Sort tiebreaker khi trộn outgoing + incoming cùng ts**: incoming không có `send_seq` → xếp sau outgoing cùng ts (hợp lý vì outgoing được tạo trước).
- **Giữ ts client**: sai lệch nhỏ sau reload từ DB; chỉ ảnh hưởng vị trí tương đối trong vài ms/giây — chấp nhận.
