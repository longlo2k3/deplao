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
- [x] User test UI + runtime evidence (log `deplao-dev.log`):
  - FB burst "hi/A/B/C": thứ tự đúng trên RENDER (pos 14→17), echo in-place giữ `send_seq` + vị trí; DB trả newest-first, ConversationList `.reverse()` + ChatWindow giữ thứ tự chuẩn
  - Zalo 19 echo: khớp Strategy 1 `real_msg_id`, kế thừa `tempTs` client — thứ tự đúng
  - Bug tên (bước 2): contact mới chưa có `display_name` → sidebar hiện raw `contact_id` (UUID) + badge tài khoản sale trong Gộp trang → **đã fix tại T8**
- [ ] Cập nhật `progress.md` + archive change

## 8. Fix hiển thị tên contact chưa có display_name (phát hiện khi verify)

- [x] File: `src/ui/components/chat/ConversationList.tsx` (import `getFriendlyUserName`; `convoName` fallback: group → "Nhóm mới", user → `getFriendlyUserName(channel)`; avatar fallback chữ "U")
- [x] File: `src/ui/components/chat/ForwardMessageModal.tsx`, `GroupModals.tsx` — fallback `getFriendlyUserName(c.channel)` thay `c.contact_id`
- [x] Acceptance: không còn hiển thị raw contact_id/UUID làm tên hội thoại; header đã fallback đúng từ trước
- [x] Test: tsc EXIT 0; jest 11/11 PASS
- [x] Gỡ toàn bộ TEMP-DIAG log sau khi chẩn đoán xong
