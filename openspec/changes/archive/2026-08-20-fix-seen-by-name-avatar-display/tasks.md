# Tasks: seen-by-name-avatar-display

## 1. Helper resolveSeenName dùng chung

- [x] File: `src/ui/components/chat/ChatWindow.tsx` (cạnh getContact/getGroupMember ~448)
- [x] Acceptance: trả `{ name, avatar }` — tên = alias → display_name/displayName hợp lệ (khác uid, không phải số); avatar = toLocalMediaUrl(gm.avatar || ct.avatar_url) || ''
- [x] Test: tsc electron + renderer (8192MB heap)

## 2. Block 1-1 seen tick

- [x] File: `ChatWindow.tsx` (~3507)
- [x] Acceptance: viewerName không bao giờ = raw uid/UUID; fallback getFriendlyUserName; .charAt(0) trên tên đã resolve
- [ ] Test: UI

## 3. Block group "Tên: Đã xem" + avatar stack

- [x] File: `ChatWindow.tsx` (~3548)
- [x] Acceptance: xoá `contactList[uid]` (index sai); dùng resolveSeenName; label không chứa uuid; fallback tên thân thiện
- [ ] Test: UI group Zalo

## 4. Bottom bar "Đã xem"

- [x] File: `ChatWindow.tsx` (~3736)
- [x] Acceptance: 3 nhánh thay bằng resolveSeenName; name fallback getFriendlyUserName (không uid); avatar qua toLocalMediaUrl
- [ ] Test: UI

## 5. Verify + archive

- [x] tsc electron 0 lỗi mới + tsc renderer 0 lỗi (NODE_OPTIONS heap 8192)
- [ ] Test thủ công 4 block seen (1-1, group, bottom bar, chưa có avatar)
- [ ] `openspec archive 2026-08-20-fix-seen-by-name-avatar-display -y` (+ task_plan.md/progress.md cập nhật)