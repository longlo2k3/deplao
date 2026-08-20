# Design: Hiển thị tên/avatar đúng của người đã xem tin nhắn

## Giải pháp

Tất cả thay đổi nằm trong `src/ui/components/chat/ChatWindow.tsx`, tái sử dụng helper có sẵn:

- `getContact(uid)` (433) — Map O(1) từ contactList
- `getGroupMember(uid)` (446) — Map O(1) từ groupMembers
- pattern `resolveName` typing (3670–3677) + `getFriendlyUserName` (channelHelper.ts:56)

### 1. Helper resolve tên người xem (dùng chung 3 block)

```ts
const resolveSeenName = (uid: string): { name: string; avatar: string } => {
  const ct = getContact(uid);
  const gm = getGroupMember(uid);
  const name = ct?.alias
    || (ct?.display_name && ct.display_name !== uid && !/^-?\d+$/.test(ct.display_name) ? ct.display_name : undefined)
    || (gm?.displayName && gm.displayName !== uid && !/^-?\d+$/.test(gm.displayName) ? gm.displayName : undefined)
    || '';
  const avatar = toLocalMediaUrl(gm?.avatar || ct?.avatar_url || '');
  return { name, avatar };
};
```

- Nếu tên resolve được → dùng tên thật (tên người xem hiển thị "Tên: Đã xem", title, alt).
- Nếu không resolve được → đoạn gọi dùng `getFriendlyUserName(channel)` cho tên hiển thị → **không bao giờ lộ raw uid/UUID**.
- Avatar: ưu tiên member avatar → contact avatar, **luôn qua `toLocalMediaUrl`**.

### 2. Block 1-1 seen tick (3492–3514)

- Giữ `threadContact` ưu tiên (avatar contact thread). Fallback `viewerUid` bị xoá:
  `viewerName = threadContact?.alias || threadContact?.display_name || getFriendlyUserName(channel)`.
- `viewerAvatar = toLocalMediaUrl(threadContact?.avatar_url || '')`.
- `.charAt(0)` fallback dùng `viewerName` (tên thân thiện, không phải uid).

### 3. Block group "Tên: Đã xem" + avatar stack (3528–3575)

- Xoá `contactList[uid]` (index sai). Dùng `resolveSeenName(uid)`.
- `label`: nối tên đã resolve; nếu trống → mỗi uid hiển thị `getFriendlyUserName(channel)`. Khi **một số** uid resolve được và một số không → tooltip/label dùng tên thật cho uid có tên, tên thân thiện cho uid rỗng (không hiện uuid).
- Avatar stack: `url` từ resolveSeenName; `name` fallback tên thân thiện.

### 4. Bottom bar "Đã xem" (3715–3763)

- Thay 3 nhánh (member / contact / fallback uid) bằng `resolveSeenName(uid)`.
- `name`: alias → display_name hợp lệ → tên thân thiện (`getFriendlyUserName`) theo channel của thread (dùng `resolveAccountChannel` có sẵn).
- `avatar`: QUA `toLocalMediaUrl` (sửa lỗi thiếu bọc tại 3747).

## Files

| File | Change |
|---|---|
| `src/ui/components/chat/ChatWindow.tsx` | +resolveSeenName helper; sửa 3 block seen-by |

## Verification

- `npx tsc --noEmit -p tsconfig.electron.json` (hoặc script chuẩn của dự án) 0 lỗi mới
- Test các path code hiện có liên quan seen: `src/ui/store/chatStore.ts`, `EventBroadcaster`, `useZaloEvents` không đổi
- Kiểm tra UI: group Zalo nhận tin → seen → "Tên: Đã xem" đúng, avatar stack không lộ số/UUID; 1-1 avatar tick; bottom bar "Đã xem"