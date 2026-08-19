## Why

Trạng thái tin nhắn FB hiển thị sai/thiếu: tin gửi không bao giờ hiện ✓✓ (Đã nhận) hay ✓✓✓ (Đã xem). Nguyên nhân (đã explore):

- MQTT `deliveredReceipt` bị xử lý sai thành "seen" (`handleDeliveryReceipt` → emit `fb:onSeen`), không ghi delivered vào DB.
- E2EE receipts (`e2eeReceipt`) bị drop hoàn toàn — không parse type delivered/read.
- Chỉ có `markFBThreadSeen` set đồng thời `delivered_at` + `is_seen` — không bao giờ có trạng thái delivered riêng.
- `getStatusDisplay` hardcode FB = "✓ Đã gửi".

## What Changes

- **DB**: thêm `markFBThreadDelivered(ownerZaloId, threadId, watermarkTs)` — sweep-to-anchor chỉ set `delivered_at` (giữ `is_seen=0`); `markFBThreadSeen` không clobber `delivered_at` đã có.
- **MQTT delivery receipt** (`handleDeliveryReceipt`): thay vì emit `fb:onSeen` → `markFBThreadDelivered` + emit `fb:onDelivered`.
- **E2EE receipts** (`e2eeReceipt` case): parse type — `delivered` → `markFBThreadDelivered` + `fb:onDelivered`; `read` → `markFBThreadSeen` + `fb:onReadReceipt` (giống handleReadReceipt).
- **UI**: `useChatEvents` thêm handler `fb:onDelivered` → `chatStore.markMessageDelivered` (đã có, dùng chung được — filter theo is_sent/sender_id/delivered_at IS NULL). Preload whitelist + ipc.ts type.
- **File bubbles**: `getStatusDisplay` FB → `is_seen===1` → "✓✓ Đã xem"; `delivered_at` → "✓✓ Đã nhận"; else "✓ Đã gửi".
- ChatWindow text ticks đã đọc `delivered_at`/`is_seen` — không cần sửa.

Không làm (scope ngoài): `markReadOnServer` (stub — chỉ ảnh hưởng phía đối phương), MQTT `readReceipts` delta parsing (bridge đã lo), group delivered chi tiết per-uid.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `facebook-messaging`: delivery/read status persisted + hiển thị đúng ticks
- `facebook-session`: (không đổi)
- `ui-chat`: ticks hiển thị delivered/seen cho FB