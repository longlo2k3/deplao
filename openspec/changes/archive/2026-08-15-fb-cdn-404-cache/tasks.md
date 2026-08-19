# Tasks: fb-cdn-404-cache

## 1. Negative cache trong tryFetchCdnRedirect

- [x] File: `src/services/facebook/FacebookSession.ts` (317)
- [x] Acceptance:
  - [x] `cdnFailCache` Map + TTL 30 phút
  - [x] Cache khi status 404 (cả main + fallback), return null ngay khi cache active
  - [x] Network error không cache
  - [x] Log 404 chỉ 1 lần per user
- [x] Test: tsc electron; restart app, theo dõi log user 100080982064448

## 2. Verify + archive

- [x] Log hết spam (max 1 dòng 404/user)
- [x] Avatar user khác vẫn tải được
- [x] `openspec archive fb-cdn-404-cache -y`
