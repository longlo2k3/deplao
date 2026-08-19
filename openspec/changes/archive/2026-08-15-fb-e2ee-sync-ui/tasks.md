# Tasks: fb-e2ee-sync-ui

## 1. Preload: whitelist fb:onE2EEStatus + expose 2 invoke

- [x] File: `electron/preload.ts` (707-816 whitelist, 451-506 expose)
- [x] Acceptance: event vào whitelist; `fb.getE2EEStatus` + `fb.retryE2EE` invoke hoạt động
- [x] Test: tsc electron 0 lỗi; devtools console gọi được

## 2. IPC: handler fb:retryE2EE

- [x] File: `electron/ipc/facebookIpc.ts` (cạnh 1261)
- [x] Acceptance: gọi `service.retryE2EE()`; trả {success} / {success:false,error}
- [x] Test: script electron invoke qua ipcMain không khả thi — verify bằng UI test

## 3. Store: e2eeStatus field + action

- [x] File: `src/ui/store/accountStore.ts`
- [x] Acceptance: AccountInfo.e2eeStatus + setE2EEStatus(accountId, status)
- [x] Test: tsc renderer 0 lỗi

## 4. useChatEvents: update store từ fb:onE2EEStatus

- [x] File: `src/ui/hooks/useChatEvents.ts` (507-519)
- [x] Acceptance: setE2EEStatus với status nhận được
- [x] Test: log store khi event tới

## 5. AccountCard: badge + nút "Đồng bộ lại" + tooltip

- [x] File: `src/ui/components/dashboard/AccountCard.tsx`
- [x] Acceptance:
  - [x] Badge 4 trạng thái (xanh/vàng/đỏ/xám)
  - [x] Nút "Đồng bộ lại" gọi fb.retryE2EE + loading + notification
  - [x] Tooltip "không cần mã PIN"
  - [x] Mount → getE2EEStatus
- [x] Test: UI test thủ công

## 6. ipc.ts types + verify + archive

- [x] File: `src/ui/lib/ipc.ts`
- [x] `tsc -p tsconfig.electron.json` + typecheck renderer 0 lỗi
- [x] Restart app → badge xanh "E2EE đã kết nối"; bấm "Đồng bộ lại" OK
- [ ] `openspec archive fb-e2ee-sync-ui`