## Why

Tin nhắn Facebook hiển thị sai tên + avatar: group chat hiện raw UID thay vì tên thành viên, có khi hiện tên của chính user đang login (scraper regex match nhầm `"NAME":"..."` trong page config), contact row bị ghi với sai owner key (UUID vs facebook_id) nên vô hình sau restart, và lookup contact không filter theo account nên account B lấy nhầm avatar/name của account A.

## What Changes

- **Persist participant info từ GraphQL thread list**: `parseThreadNodes` có sẵn `all_participants → messaging_actor` (id, name, big_image_src, profile_picture) — khi `getThreadList`/`saveFBThreads` chạy, upsert mọi participant vào `contacts` với `owner_zalo_id = facebook_id` (numeric)
- **FB group members vào group cache UI**: bỏ chặn `if (isNonZalo) return` trong group-member load của `ChatWindow` cho FB; lưu vào `page_group_member` qua `saveGroupMembers` (owner = facebook_id)
- **IPC `fb:getUserInfoFacebookHtml` dùng đúng owner key**: owner_zalo_id = facebook_id numeric (từ DB account), không phải UUID
- **Hết cross-contamination**: `checkAndFetchUserInfo` + `saveFBMessage` contact update thêm `AND owner_zalo_id = ?`
- **Scraper đáng tin hơn**: tên ưu tiên `og:title` (strip ` | Facebook`), sau đó `NAME` JSON; avatar thứ tự: img 168px → `profile_pic_uri` → CDN `/picture` → mbasic (bỏ "last scontent" khỏi vị trí ưu tiên — dễ lấy nhầm ảnh quảng cáo)
- **Enrichment UI không failure-sticky**: `requestedMemberInfoRef` được clear trong `finally`; `updateContactProfile` dùng đúng owner key
- **E2EE senderId=0 không fetch garbage**: bridge giữ senderID=0 cho JID không numeric; TS skip fetch profile khi senderID=0, dùng participant info từ thread nếu có

## Capabilities

### New Capabilities
- `fb-contact-identity`: Đồng bộ tên + avatar contact Facebook từ các nguồn đáng tin (GraphQL thread participants, profile HTML) và hiển thị đúng trong chat

### Modified Capabilities
<!-- none - chưa có spec chính thức nào liên quan -->

## Impact

- `src/services/facebook/FacebookService.ts`: `checkAndFetchUserInfo` (1619), `handleIncomingMessage` contact update, `saveFBThreads` flow
- `src/services/facebook/FacebookThreadManager.ts`: `parseThreadNodes` (104) — expose participants
- `src/services/facebook/FacebookSession.ts`: `getUserInfoFacebookHtml` (225) — parse tên/avatar
- `electron/ipc/facebookIpc.ts`: `fb:getUserInfoFacebookHtml` (383) — owner key
- `src/ui/components/chat/ChatWindow.tsx`: group-member load (1195), enrichment (1361-1402)
- `src/bridge-e2ee/bridge/events.go`: E2EE senderID parse (733-736) — build lại bridge exe
- `src/services/database/DatabaseService.ts`: lookup queries thêm owner filter
- Không đổi schema DB (dùng table `contacts` + `page_group_member` sẵn có)
