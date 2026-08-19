# Tasks: fix-chat-ordering-timestamps

## 1. MessageItem + send_seq

- [x] File: `src/ui/store/chatStore.ts`
- [x] Acceptance: `MessageItem` có `send_seq?: number`; outgoing temp nhận `send_seq` tăng dần trong `addMessage`
- [x] Test: unit test `assignSendSeq` (3 case) PASS

## 2. Sort comparator có tiebreaker

- [x] File: `src/ui/store/chatStore.ts` (456, 470 → `sortMessages` từ messageMerge)
- [x] Acceptance: `addMessage` và `prependMessages` sort theo `(timestamp, send_seq)`; tin không send_seq xếp sau
- [x] Test: unit test `sortMessages` (3 case) PASS

## 3. Self-dedup kế thừa ordering + xoá 1 temp

- [x] File: `src/ui/store/chatStore.ts` (logic chuyển sang `src/ui/lib/chat/messageMerge.ts`)
- [x] Acceptance: real echo thay temp giữ `send_seq` + ts client; Strategy 2 chỉ xoá 1 temp khớp đầu tiên
- [x] Test: unit test `mergeMessage` (5 case) PASS — echo ngược thứ tự vẫn đúng thứ tự gửi

## 4. Hằng số MSG_TIME_GAP_MS

- [x] File: `src/ui/lib/chat/messageParser.ts`
- [x] Acceptance: export `MSG_TIME_GAP_MS = 5 * 60 * 1000`
- [x] Test: compile + import OK

## 5. ChatWindow: tách showTime / showSenderName

- [x] File: `src/ui/components/chat/ChatWindow.tsx` (2751-2753, 2996)
- [x] Acceptance: `showTime` = first || gap ≥ 5 phút (không sender-change); `showSenderName` = đổi sender || gap; dùng hằng số import
- [x] Test: code review + chờ user test UI

## 6. QuickChatModal đồng bộ hằng số

- [x] File: `src/ui/components/chat/QuickChatModal.tsx` (677)
- [x] Acceptance: dùng `MSG_TIME_GAP_MS` import chung, hành vi không đổi
- [x] Test: compile OK

## 7. Verify toàn diện

- [x] `npx tsc -p tsconfig.json --noEmit` — 0 lỗi (fix kèm lỗi có sẵn `GlobalSearchPanel.tsx` thiếu import type `Channel`)
- [x] `tsc -p tsconfig.electron.json --noEmit` — 0 lỗi
- [x] `npx jest` — 11/11 PASS
- [ ] User test UI: gửi nhanh 3 tin → đúng thứ tự; timestamp chỉ hiện khi gap ≥ 5 phút; group vẫn hiện tên người gửi
- [ ] Cập nhật `progress.md` + archive change
