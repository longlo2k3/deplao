# Task Plan: fix-chat-ordering-timestamps

## Tổng quan
Fix 2 bug UI chat: (1) tin nhắn gửi bị lộn thứ tự, (2) timestamp hiện quá nhiều. Spec: `openspec/changes/fix-chat-ordering-timestamps/`.
Thứ tự: store (dữ liệu) → shared constant → render → verify.

## Checklist

### 1. MessageItem.send_seq + gán seq cho temp
- File: `src/ui/store/chatStore.ts` (interface MessageItem ~72, addMessage ~365)
- Acceptance: field `send_seq?: number`; outgoing temp (`is_sent===1 && msg_id.startsWith('temp_')`) nhận `++nextSendSeq` (module counter) khi chưa có
- Test: unit test — add 3 temp → seq 1,2,3 đúng thứ tự

### 2. Sort comparator (timestamp, send_seq)
- File: `src/ui/store/chatStore.ts` (456 addMessage, 470 prependMessages)
- Acceptance: `(a.ts-b.ts) || (a.seq??MAX)-(b.seq??MAX)`; tin không seq xếp sau
- Test: unit test — ts bằng nhau, seq khác → thứ tự đúng; không seq xếp cuối

### 3. Self-dedup: kế thừa ordering + chỉ xoá 1 temp
- File: `src/ui/store/chatStore.ts` (427-451)
- Acceptance: real echo thay temp giữ `send_seq` + ts client; Strategy 2 xoá đúng 1 temp khớp đầu tiên
- Test: unit test — 2 temp trùng text + 2 echo tuần tự → đúng 2 real + đúng thứ tự; echo ngược thứ tự vẫn đúng (nhờ seq)

### 4. Export MSG_TIME_GAP_MS
- File: `src/ui/lib/chat/messageParser.ts`
- Acceptance: `export const MSG_TIME_GAP_MS = 5 * 60 * 1000`
- Test: import OK, compile

### 5. ChatWindow: tách showTime / showSenderName
- File: `src/ui/components/chat/ChatWindow.tsx` (2751-2753, 2996)
- Acceptance: `showTime = !prevMsg || gap >= MSG_TIME_GAP_MS` (bỏ sender-change); `showSenderName = !isSent && thread_type===1 && (đổi sender || gap)`; dùng hằng số import
- Test: code review + user test UI (timestamp chỉ hiện khi gap ≥ 5 phút; group vẫn hiện tên)

### 6. QuickChatModal dùng hằng số chung
- File: `src/ui/components/chat/QuickChatModal.tsx` (677)
- Acceptance: thay inline `5 * 60 * 1000` bằng `MSG_TIME_GAP_MS` import; hành vi không đổi
- Test: compile

### 7. Verify toàn diện + archive
- `npx tsc -p tsconfig.json --noEmit` + `tsc -p tsconfig.electron.json` 0 lỗi
- `npx jest` unit tests mới PASS
- User test UI: gửi nhanh 3 tin đúng thứ tự; timestamp gap 5 phút; group tên đúng
- Cập nhật progress.md + archive change (openspec/changes/archive/YYYY-MM-DD-fix-chat-ordering-timestamps)

## File structure mapping
| File | Trách nhiệm |
|---|---|
| chatStore.ts | send_seq, counter, sort comparator, dedup strategy |
| messageParser.ts | hằng số MSG_TIME_GAP_MS |
| ChatWindow.tsx | showTime/showSenderName tách biệt |
| QuickChatModal.tsx | dùng hằng số chung |

## Test strategy
- Backend-free: toàn bộ fix nằm UI store/render → unit test jest (jest.config.js có sẵn) cho chatStore logic (T1-T3) là đủ
- UI: test thủ công qua app dev (nhờ user)
- Không cần script electron (không đụng backend)

## Rủi ro / Rollback
- Circular import → hằng số ở module shared, không import ngược
- Revert = revert 4 file UI, không migration
- Retry unshift (MessageQueue) giữ nguyên — bubble ổn định nhờ giữ ts client
