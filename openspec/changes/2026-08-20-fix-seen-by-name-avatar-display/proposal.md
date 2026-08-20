## Why

Khi xem trạng thái "người đã xem tin nhắn" (seen-by), UI hiển thị **UUID / raw id** thay vì tên người xem, và avatar fallback là **ký tự đầu của UUID**. Nguyên nhân:

1. `ChatWindow.tsx:3538` dùng `contactList[uid]` — index **array** (contacts[accountId]) bằng string uid → luôn `undefined` → `nameByUid[uid] = uid` → dòng "Tên: Đã xem" trong nhóm luôn hiện raw id.
2. Các fallback cuối `|| uid` / `|| viewerUid` tại 3498, 3549, 3729/3732/3733 hiện raw id khi chưa resolve được tên.
3. Avatar fallback `.charAt(0)` tại 3510, 3567, 3750 lấy ký tự đầu của name (raw id) → hiện số/ký tự đầu UUID.
4. `u.avatar` (3747) không qua `toLocalMediaUrl` nên ảnh path local không load → rơi xuống fallback ký tự.

## What Changes

- **Fix lookup tên người xem**: dùng `contactList.find(c => c.contact_id === uid)` (đã có `getContact(uid)`/`getGroupMember(uid)`) thay cho index array sai.
- **Không hiển thị raw id/UUID**: gom 3 block seen-by dùng chung 1 helper resolve tên/avatar (tương tự pattern `resolveName` typing 3670–3677): ưu tiên `alias` → `display_name`/`displayName` hợp lệ (khác uid, không phải chuỗi số) → channel-friendly name; NẾU vẫn rỗng → tên thân thiện theo channel (`getFriendlyUserName`) thay vì uid.
- **Avatar**: đảm bảo mọi avatar path đi qua `toLocalMediaUrl`; nếu không có avatar → hiển thị ký tự đầu của **tên thân thiện** (không phải uid).
- **Scope**: 3 block `ChatWindow.tsx`: 1-1 seen tick (3470–3514), group "Tên: Đã xem" + avatar stack (3528–3575), bottom bar "Đã xem" (3715–3763).

## Capabilities

### New Capabilities
- `seen-by-name-avatar-display`: Hiển thị tên + avatar đúng của người đã xem tin nhắn, không lộ raw id/UUID

### Modified Capabilities
<!-- none -->

## Impact

- `src/ui/components/chat/ChatWindow.tsx` — 3 block seen-by (3492–3575, 3715–3763), tái sử dụng helper resolveName sẵn có
- Không đổi backend / store / DB