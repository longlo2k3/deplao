# Tasks: fix-post-comments-id-conversion

## 1. Add `toRelayFeedbackId` helper

- [x] File: `src/services/facebook/FacebookScanService.ts` (module-level, cạnh `fbCookieKey`)
- [x] Acceptance: hàm convert ID số thuần / `123_456` → base64(`feedback:<id>`); giữ nguyên ID chứa `:` hoặc base64
- [x] Test: verify qua script electron (xem task 3)

## 2. Apply conversion in scanPostComments + scanPostCommentsBatch

- [x] File: `src/services/facebook/FacebookScanService.ts` (1674, 2071)
- [x] Acceptance:
  - [x] `scanPostComments` dùng relay feedback ID cho `variables.id`
  - [x] `scanPostCommentsBatch` convert từng id trước khi gọi (thừa hưởng qua scanPostComments)
  - [x] Không đổi signature/return type
- [x] Test: `tsc -p tsconfig.electron.json --noEmit` 0 lỗi

## 3. Verify end-to-end

- [x] File: `C:\Users\Admin\AppData\Local\Temp\opencode\debug-user-post.js` (script electron debug)
- [x] Acceptance:
  - [x] raw `2517468658747082` → success=true, items=2 (trước đây 0)
  - [x] base64 `feedback:2517468658747082` → items=2
  - [x] base64 zuck `ZmVlZGJhY2s6MTAxMTcwMjU4NDcwMTI5MDE=` → items=10 (không regress)
  - [x] group members `1242309506256283` → items=10 (không regress)
- [x] Test: chạy script qua electron, in kết quả

## 4. Archive

- [x] Chạy `openspec archive fix-post-comments-id-conversion` sau khi verify pass
- [x] Cập nhật checkbox tất cả task