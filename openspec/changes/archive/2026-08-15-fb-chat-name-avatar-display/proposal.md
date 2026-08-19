## Why

Trong khung chat FB, khi contact chưa có tên (còn ~6 contacts rỗng, UID cũ 2023-2024), UI hiển thị số UID dài (vd `61575399695977`) làm tên người gửi, header chat, info panel. User yêu cầu: hạn chế hiển thị UID + hiển thị đúng tên và avatar. Enrichment hiện chỉ chạy cho **group chat** (ChatWindow effect 1273 `if (!isGroup) return`) — với 1-1 FB sender lạ không bao giờ được enrich.

## What Changes

- **Không hiện UID**: thay mọi fallback cuối cùng `|| contact_id` / `|| userId` / `|| activeThreadId` trong khung chat bằng tên thân thiện theo channel (`getFriendlyUserName`) — FB: "Người dùng Facebook", Telegram: "Người dùng Telegram", còn lại: "Người dùng". Áp dụng: ChatWindow bubble name, ChatHeader, ConversationInfo, GroupInfoPanel.
- **Enrich 1-1 FB**: mở rộng effect ChatWindow 1273 chạy cho cả chat 1-1 FB khi contact rỗng tên — fetch `fb:getUserInfoFacebookHtml` → updateContact + groupInfoCache (reuse branch FB hiện có).
- **Dùng tên từ tin nhắn**: fallback `msg.sender_name` (nếu có, không phải chuỗi số) trước tên thân thiện.
- **Helper chung** `getFriendlyUserName(channel)` trong `src/ui/lib/channelHelper.ts`.

## Capabilities

### New Capabilities
- `fb-chat-name-display`: Hiển thị tên/avatar đúng trong khung chat FB, không hiện UID

### Modified Capabilities
<!-- none -->

## Impact

- `src/ui/lib/channelHelper.ts` — helper getFriendlyUserName
- `src/ui/components/chat/ChatWindow.tsx` — fallback 2762 + effect 1273 mở rộng 1-1
- `src/ui/components/chat/ChatHeader.tsx` — 599
- `src/ui/components/chat/ConversationInfo.tsx` — 86
- `src/ui/components/chat/GroupInfoPanel.tsx` — 1189, 1226
- Không đổi backend (checkAndFetchUserInfo đã tồn tại)