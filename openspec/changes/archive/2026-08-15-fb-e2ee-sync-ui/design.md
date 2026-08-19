# Design: FB E2EE sync status UI

## Giải pháp

Toàn bộ backend đã có sẵn (`retryE2EE()`, `getE2EEStatus()`, event `fb:onE2EEStatus` emit) — chỉ cần nối dây preload + UI.

### 1. preload.ts

- Whitelist (mảng ~707-816): thêm `'fb:onE2EEStatus'` sau `'fb:onContactUpdate'`
- Expose (khu vực invoke fb ~451-506): thêm
  ```
  getE2EEStatus: (params) => ipcRenderer.invoke('fb:getE2EEStatus', params),
  retryE2EE: (params) => ipcRenderer.invoke('fb:retryE2EE', params),
  ```

### 2. facebookIpc.ts

Thêm handler `fb:retryE2EE` (cạnh fb:toggleE2EE 1261):
```
ipcMain.handle('fb:retryE2EE', async (_event, params: { accountId: string }) => {
  const internalId = resolveInternalId(params.accountId);
  const service = FacebookConnectionManager.get(internalId);
  if (!service) return { success: false, error: 'Tài khoản chưa kết nối' };
  try {
    await service.retryE2EE();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
```

### 3. useAccountStore.ts

- Field `e2eeStatus?: string` trên AccountInfo + action `setE2EEStatus(accountId, status)`

### 4. useChatEvents.ts (507-519)

Thay console.log bằng:
```
useAccountStore.getState().setE2EEStatus(data.fbAccountId, data.status);
```
Map fbAccountId (numeric) → account (tìm theo facebook_id hoặc zalo_id — xem cách updateContact làm: updateContact(dữ liệu fbAccountId numeric, ...) — store map qua facebook_id).

### 5. AccountCard.tsx

- useEffect mount: gọi `ipc.fb?.getE2EEStatus({accountId})` → set store
- Badge E2EE (đặt cạnh statusBadge, chỉ cho isFacebookAcc):
  - state `e2eeStatus = useAccountStore(s => s.accounts.find(a => a.zalo_id === acc.zalo_id)?.e2eeStatus)`
  - label/cls theo 4 trạng thái (spec REQ-4)
- Nút "Đồng bộ lại": button nhỏ (icon refresh) cạnh badge → gọi `ipc.fb?.retryE2EE({accountId})` với loading state + notification kết quả
- Tooltip: title="Tin nhắn E2EE đồng bộ tự động qua thiết bị đã lưu — không cần mã PIN"

### 6. ipc.ts (src/ui/lib)

Thêm type vào fb interface: `getE2EEStatus`, `retryE2EE`

## Files

| File | Change |
|---|---|
| `electron/preload.ts` | whitelist + 2 expose |
| `electron/ipc/facebookIpc.ts` | handler fb:retryE2EE |
| `src/ui/store/useAccountStore.ts` | e2eeStatus field + action |
| `src/ui/hooks/useChatEvents.ts` | update store |
| `src/ui/components/dashboard/AccountCard.tsx` | badge + nút + tooltip |
| `src/ui/lib/ipc.ts` | type |

## Verification

- tsc 0 lỗi (cả electron + renderer typecheck)
- Restart app → AccountCard FB hiển thị "🔒 E2EE đã kết nối" khi bridge connect (log: `E2EE bridge ready`)
- Bấm "Đồng bộ lại" → log retryE2EE chạy, badge chuyển connecting → connected
- Test lỗi: tắt binary bridge tạm → badge đỏ + nút retry hoạt động