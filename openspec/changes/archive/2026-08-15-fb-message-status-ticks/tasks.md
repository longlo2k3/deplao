# Tasks: fb-message-status-ticks

## 1. DB layer

- [x] File: `src/services/database/DatabaseService.ts`
- [x] Thêm `markFBThreadDelivered(ownerZaloId, threadId, watermarkTs)` — sweep is_sent=1 & channel='facebook' & delivered_at IS NULL & is_seen=0, set delivered_at
- [x] `markFBThreadSeen`: `delivered_at = COALESCE(delivered_at, ?)`
- [x] Test: tsc electron

## 2. Main process — receipts

- [x] File: `src/services/facebook/FacebookService.ts`
- [x] `handleDeliveryReceipt`: markFBThreadDelivered + emit `fb:onDelivered` (bỏ fb:onSeen)
- [x] `e2eeReceipt` case: parse type delivered/read → mark + emit; skip self receipts
- [x] Test: tsc electron

## 3. Renderer — event

- [x] Files: `electron/preload.ts` (whitelist), `src/ui/lib/ipc.ts` (type), `src/ui/hooks/useChatEvents.ts` (handler → chatStore.markMessageDelivered)
- [x] Test: tsc renderer (chấp nhận GlobalSearchPanel pre-existing)

## 4. UI ticks

- [x] File: `src/ui/lib/mediaResolver.ts` — getStatusDisplay FB: seen → "✓✓ Đã xem"; delivered_at → "✓✓ Đã nhận"; else "✓ Đã gửi"
- [x] Test: tsc renderer

## 5. Verify + archive

- [x] Restart app; test 1-1: gửi → đối phương nhận → "✓✓ Đã nhận"; đọc → "✓✓ Đã xem"
- [x] Kiểm tra DB delivered_at/is_seen riêng biệt
- [x] `openspec archive fb-message-status-ticks -y`
