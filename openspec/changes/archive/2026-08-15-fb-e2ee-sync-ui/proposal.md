## Why

User không biết tin nhắn FB đồng bộ thế nào và tưởng có mã PIN cần nhập. Thực tế: không có PIN (messagix/mautrix không có API PIN); sync chạy tự động khi connect. Nhưng renderer **mù hoàn toàn** về trạng thái E2EE: `fb:getE2EEStatus`/`fb:toggleE2EE` không expose preload, event `fb:onE2EEStatus` không trong whitelist → user không thấy trạng thái sync, không có cách retry khi bị miss tin, không có nơi giải thích "không cần PIN".

## What Changes

- **Expose qua preload**:
  - Whitelist event `fb:onE2EEStatus` (preload.ts whitelist ~707-816)
  - Expose invoke `fb.getE2EEStatus` + `fb.retryE2EE` mới
- **IPC mới `fb:retryE2EE`**: gọi `service.retryE2EE()` (restart bridge E2EE — nhẹ, không đụng MQTT) — dùng cho nút "Đồng bộ lại"
- **Account store**: field `e2eeStatus` ('disconnected' | 'connecting' | 'connected' | 'error') + action set
- **useChatEvents**: nhận `fb:onE2EEStatus` → update store (hiện chỉ console.log)
- **AccountCard (FB account)**: badge trạng thái E2EE:
  - `connected` → "🔒 E2EE đã kết nối" (xanh)
  - `connecting` → "Đang đồng bộ E2EE…" (vàng, pulse)
  - `error` → "⚠ E2EE lỗi" (đỏ) + nút retry
  - `disconnected` → "E2EE chưa kết nối" (xám)
  - Nút "Đồng bộ lại" luôn hiển thị (cạnh badge) → gọi `fb.retryE2EE`
  - Tooltip/text nhỏ: "Tin nhắn E2EE đồng bộ tự động — không cần mã PIN"
- Không thay đổi cơ chế sync backend (device persist đã hoạt động)

## Capabilities

### New Capabilities
- `fb-e2ee-sync-status`: Hiển thị trạng thái đồng bộ E2EE Facebook trong UI + nút đồng bộ lại + làm rõ không có mã PIN

### Modified Capabilities
<!-- none -->

## Impact

- `electron/preload.ts`: whitelist + expose 2 invoke
- `electron/ipc/facebookIpc.ts`: thêm handler `fb:retryE2EE`
- `src/ui/hooks/useChatEvents.ts`: update store từ fb:onE2EEStatus
- `src/ui/store/useAccountStore.ts`: field e2eeStatus
- `src/ui/components/dashboard/AccountCard.tsx`: badge + nút + tooltip
- `src/ui/lib/ipc.ts`: type fb.getE2EEStatus/retryE2EE
- Không đổi backend service (retryE2EE đã tồn tại, status API đã tồn tại)