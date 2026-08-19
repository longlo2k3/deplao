# Design: Fix FB name/avatar

## Problem summary

4 root cause: (1) thread participants không được persist → group chat hiện UID; (2) owner key không nhất quán (UUID vs facebook_id) → contact vô hình; (3) lookup không filter owner → cross-account contamination; (4) scraper regex yếu → tên/avatar sai.

## Solution

### 1. Persist participants khi refresh thread list

- `FacebookThreadManager.ts` `parseThreadNodes`: build thêm `participants: { id, name, avatarUrl }[]` cho mỗi thread (từ `all_participants.edges[].node.messaging_actor`) → thêm field vào `FBThread` (hoặc attach vào result).
- `FacebookService.ts` sau `saveFBThreads` (nơi gọi `parseThreadNodes` + save): với mỗi thread, upsert từng participant vào `contacts`:
  ```
  INSERT INTO contacts (owner_zalo_id, contact_id, display_name, avatar_url, is_friend, contact_type, unread_count, last_message, last_message_time, channel)
  VALUES (fbId, pid, name, avatar, 0, 'user', 0, '', 0, 'facebook')
  ON CONFLICT(owner_zalo_id, contact_id) DO UPDATE SET
    display_name = COALESCE(NULLIF(excluded.display_name,''), contacts.display_name),
    avatar_url = COALESCE(excluded.avatar_url, contacts.avatar_url)
  ```
  (KHÔNG ghi đè tên đã có bằng rỗng; avatar thay nếu mới.)
- Đồng thời nếu thread là group (`type==='group'`) → `saveGroupMembers(fbId, threadId, members)` vào `page_group_member` (memberId=pid, displayName=name, avatar, role=0).

### 2. UI group cache cho FB

- `ChatWindow.tsx` group-member load effect (1126-1195): bỏ early-return `if (isNonZalo(acc.channel)) return;` cho FB; thêm nhánh FB:
  ```
  if (isFacebook(acc.channel)) {
    const members = await DataAccessor.getGroupMembers({ zaloId: fbId, groupId });
    // đã có trong DB cache từ bước 1 (group > 1-1)
    if (members?.length) buildAndSetGroupInfo(members.map(...));
  }
  ```
  Lưu ý: `getGroupMembers` hiện query theo `owner_zalo_id` = accountId (UUID). DataAccessor.getGroupMembers dùng `zaloId` param — cần truyền **facebook_id numeric** (lấy từ acc.facebook_id nếu có, hoặc qua helper). Kiểm tra DataAccessor signature; nếu cần thêm fallback lookup theo cả UUID thì dùng facebook_id.
- Mapping: `getGroupMember(msg.sender_id)` (ChatWindow:441-446) match theo `member_id` → OK khi member lưu đúng.

### 3. IPC owner key

- `facebookIpc.ts` `fb:getUserInfoFacebookHtml` (383): lấy `acc = db.getFBAccounts().find(a => a.id === accountId)` → `fbId = acc.facebook_id`; dùng `fbId` làm owner (thay `internalId`).

### 4. Owner filter chống contamination

- `FacebookService.ts` `checkAndFetchUserInfo` (1623-1626): thêm `AND owner_zalo_id = ?` (fbId).
- `saveFBMessage` contact update (`DatabaseService.ts` ~7903/7956): thêm owner filter vào lookup/upsert contact.
- Các lookup khác trong `handleIncomingMessage` (551, 657, 770) nếu query contacts → thêm owner filter.

### 5. Scraper cải thiện

- `FacebookSession.ts` `getUserInfoFacebookHtml`:
  - Tên: ưu tiên `<meta property="og:title" content="...">` → strip ` | Facebook`/` - Facebook` suffix; fallback h1→div; fallback `"NAME":"..."` như cũ (lấy match đầu tiên có vẻ là page config — giữ vì og:title sẽ chạy trước).
  - Avatar thứ tự: img 168px → `profile_pic_uri` → CDN `/picture` (tryFetchCdnRedirect) → mbasic → **cuối cùng** mới "last scontent".

### 6. Enrichment UI không sticky + đúng owner

- `ChatWindow.tsx` (1361-1402): bọc `load()` trong try/finally → `requestedMemberInfoRef.current.delete(senderKey)` ở finally (để retry lần sau).
- `updateContactProfile` (1393): `zaloId` phải là **facebook_id** (thay `activeAccountId` UUID) — lấy từ `useAccountStore` account (acc.facebook_id || acc.id).

### 7. E2EE senderId=0

- `bridge/events.go` (733-736): giữ parse như cũ (senderID=0 khi JID không numeric).
- `FacebookService.ts` `handleE2EEMessage` (1373): nếu `senderID===0` → skip `checkAndFetchUserInfo`; dùng `participantId` (thread participant mapping nếu có) cho sender_id; nếu không có → sender_id = `msg.senderId` string gốc nhưng không fetch profile.
- Rebuild bridge: `npm run build:bridge-e2ee` → `src/bridge-e2ee/build/fbchat-bridge-e2ee.exe`.

## Files

| File | Change |
|---|---|
| `src/services/facebook/FacebookThreadManager.ts` | expose participants trong parseThreadNodes |
| `src/services/facebook/FacebookService.ts` | persist participants → contacts/page_group_member; owner filter; senderId=0 guard |
| `src/services/facebook/FacebookSession.ts` | og:title + avatar order |
| `electron/ipc/facebookIpc.ts` | owner = facebook_id |
| `src/ui/components/chat/ChatWindow.tsx` | FB group load + finally clear + updateContactProfile owner |
| `src/bridge-e2ee/bridge/events.go` | (giữ nguyên parse, TS guard) + rebuild |
| `src/services/database/DatabaseService.ts` | owner filter trong contact lookup |

## Verification

- Script electron debug:
  - `parseThreadNodes` với cookie thật → participants có name/avatar → persist contacts đúng owner numeric
  - `getUserInfoFacebookHtml` với user bất kỳ → name từ og:title (không phải tên user login), avatar URL hợp lệ
  - E2EE bridge nhận message page agent → không log fetch "0"
- UI: mở group "Box NRO" → tên thành viên đúng thay vì UID
- `tsc -p tsconfig.electron.json` 0 lỗi; bridge build OK
