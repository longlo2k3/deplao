# Design: Hiển thị tên/avatar đúng trong khung chat FB

## Giải pháp

### 1. Helper chung — `src/ui/lib/channelHelper.ts`

```ts
export function getFriendlyUserName(channel?: Channel): string {
  if (isFacebook(channel)) return 'Người dùng Facebook';
  if (isTelegram(channel) || isTelegramUser(channel) || isTelegramBot(channel)) return 'Người dùng Telegram';
  return 'Người dùng';
}
```

### 2. ChatWindow.tsx

- **2762**: `displayName = preferredContactName || groupMember?.displayName || contactName || msg.sender_name_valid || getFriendlyUserName(channel)` — thêm `msg.sender_name` (guard: non-empty, khác sender_id, không phải `/^-?\d+$/`)
- **1273 effect**: bỏ `if (!isGroup) return` — thay bằng: group → như cũ (all senders); 1-1 FB → chỉ enrich khi threadContact display_name rỗng (senderId = sender của message đầu tiên khác is_sent)
- Tách branch FB 1385-1432 thành hàm `fetchFbSenderInfo(senderId)` để dùng chung cho group + 1-1

### 3. ChatHeader.tsx (599)

`const displayName = contact?.alias || contact?.display_name || activeThreadId` → `... || getFriendlyUserName(accountChannel)` (kiểm tra biến channel đã có trong file — dùng resolveAccountChannel nếu cần)

### 4. ConversationInfo.tsx (86)

Tương tự → `getFriendlyUserName(channel)`.

### 5. GroupInfoPanel.tsx (1189, 1226)

`m.displayName || m.userId` → `m.displayName || 'Thành viên'` (2 chỗ: list + context menu).

## Files

| File | Change |
|---|---|
| `src/ui/lib/channelHelper.ts` | +getFriendlyUserName |
| `src/ui/components/chat/ChatWindow.tsx` | fallback 2762 + effect 1273 mở rộng + refactor fetchFbSenderInfo |
| `src/ui/components/chat/ChatHeader.tsx` | 599 |
| `src/ui/components/chat/ConversationInfo.tsx` | 86 |
| `src/ui/components/chat/GroupInfoPanel.tsx` | 1189, 1226 |

## Verification

- tsc renderer 0 lỗi (ngoài lỗi pre-existing GlobalSearchPanel:666)
- Mở group FB có thành viên chưa có tên → hiển thị "Người dùng Facebook", sau 1-2s enrich xong → tên thật + avatar
- Mở chat 1-1 FB rỗng tên → tương tự
- Header chat rỗng tên → "Người dùng Facebook"