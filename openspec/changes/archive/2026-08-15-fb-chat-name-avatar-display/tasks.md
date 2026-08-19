# Tasks: fb-chat-name-avatar-display

## 1. Helper getFriendlyUserName

- [x] File: `src/ui/lib/channelHelper.ts`
- [x] Acceptance: trả "Người dùng Facebook"/"Người dùng Telegram"/"Người dùng" theo channel
- [x] Test: tsc renderer

## 2. ChatWindow: fallback bubble name + sender_name

- [x] File: `src/ui/components/chat/ChatWindow.tsx` (2762)
- [x] Acceptance: `displayName` không bao giờ = sender_id; dùng msg.sender_name hợp lệ; cuối cùng getFriendlyUserName(channel)
- [x] Test: UI test group FB

## 3. ChatWindow: enrich chat 1-1 FB

- [x] File: `src/ui/components/chat/ChatWindow.tsx` (1273-1432)
- [x] Acceptance: 1-1 FB với contact rỗng tên → fetch getUserInfoFacebookHtml → updateContact + DB
- [x] Test: mở chat 1-1 FB rỗng tên → tên/avatar điền sau ~2s

## 4. ChatHeader + ConversationInfo fallback

- [x] Files: `src/ui/components/chat/ChatHeader.tsx` (599), `ConversationInfo.tsx` (86)
- [x] Acceptance: không hiện activeThreadId khi rỗng tên
- [x] Test: UI test

## 5. GroupInfoPanel fallback

- [x] File: `src/ui/components/chat/GroupInfoPanel.tsx` (1189, 1226)
- [x] Acceptance: thành viên rỗng tên → "Thành viên"
- [x] Test: UI test

## 6. Verify + archive

- [x] tsc renderer (chỉ còn lỗi pre-existing GlobalSearchPanel:666)
- [x] Test thủ công: group + 1-1 FB, header, info panel
- [x] `openspec archive fb-chat-name-avatar-display -y`
