# Proposal: fix-chat-ordering-timestamps

## Why

Hai lỗi trải nghiệm trong cửa sổ chat:

1. **Tin nhắn gửi đi bị nhảy lộn thứ tự.** Khi gửi nhanh 2–3 tin liên tiếp, bubble đôi khi bị xáo trộn (tin B hiện trên tin A). Nguyên nhân gốc: `chatStore.addMessage` sort mảng chỉ theo `timestamp`, không có key phụ. Tin real (echo từ server) có `timestamp` = đồng hồ server, thường **bằng nhau tới từng mili-giây** khi gửi nhanh; sort ổn định (stable sort) lúc đó giữ thứ tự theo **thứ tự echo đến**, không phải thứ tự người dùng gửi. Kèm theo: Strategy 2 (content match) xoá **toàn bộ** temp trùng text, và temp giữ `timestamp` client trong khi real mang `timestamp` server → bubble có thể dịch chuyển vị trí.

2. **Timestamp hiển thị quá thường xuyên.** Mỗi lần đổi chiều tin (gửi → nhận), điều kiện `prevMsg.sender_id !== msg.sender_id` trong `showTime` bắn true → sau hầu như mỗi tin nhắn đều có pill thời gian, phá vỡ ý định "chỉ hiện khi có khoảng thời gian đủ lâu" (ngưỡng 30 phút sẵn có bị vô hiệu bởi điều kiện sender-change).

## What Changes

### Capability 1 — `outgoing-order`: giữ thứ tự gửi cho tin nhắn đi

- **Key ordering bền vững (`send_seq`)**: mỗi tin nhắn đi (temp) nhận một số thứ tự tăng dần theo thời điểm người dùng tạo tin. Khi echo real đến và thay thế temp, `send_seq` (và timestamp client) được **kế thừa** từ temp sang real.
- **Sort có tiebreaker**: mọi sort mảng tin nhắn (add, prepend) dùng `(timestamp, send_seq)` — hết xáo trộn khi timestamp bằng nhau.
- **Content-match chỉ xoá 1 temp**: Strategy 2 xoá đúng **1** temp khớp đầu tiên thay vì toàn bộ → gửi 2 tin trùng text không còn biến mất bubble giữa chừng.
- Không đổi schema DB, không đổi API server.

### Capability 2 — `timestamp-gap`: timestamp chỉ hiện khi có khoảng cách thời gian

- Đổi rule `showTime` trong `ChatWindow.renderItem`: **bỏ điều kiện sender-change**, chỉ còn `first message OR gap > 5 phút` (đồng nhất với `QuickChatModal` vốn đã đúng).
- Tách điều kiện hiển thị tên người gửi trong group chat thành biến riêng (`showSenderName`) dựa trên **đổi sender OR gap thời gian** — giữ nguyên hành vi tên nhóm, không bị ảnh hưởng bởi việc sửa timestamp.
- Rút ngưỡng thành hằng số dùng chung (`MSG_TIME_GAP_MS = 5 * 60 * 1000`).

## Capabilities

### New Capabilities
- `outgoing-order`: Ổn định thứ tự hiển thị tin nhắn đi theo thứ tự gửi, bất kể thứ tự echo đến / trùng timestamp / retry.
- `timestamp-gap`: Timestamp separator chỉ hiện khi khoảng cách giữa các tin ≥ 5 phút.

### Modified Capabilities
<!-- none -->

## Impact

- `src/ui/store/chatStore.ts`: `MessageItem.send_seq`, counter monotonic, `addMessage` self-replace kế thừa `send_seq`+ts client, sort comparator mới (456, 470), Strategy 2 chỉ xoá 1 temp (427–451).
- `src/ui/components/chat/ChatWindow.tsx`: rule `showTime` (2751–2753), tách `showSenderName` (2996), hằng số `MSG_TIME_GAP_MS`.
- `src/ui/components/chat/QuickChatModal.tsx`: (tùy chọn) dùng chung hằng số `MSG_TIME_GAP_MS` (677).
- Không đổi: schema DB, IPC, backend service, bridge.
