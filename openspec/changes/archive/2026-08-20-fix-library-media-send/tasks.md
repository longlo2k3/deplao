# Tasks: fix-library-media-send

## 1. Helper `toAbsoluteLibraryUrl` (pure) + test

- [ ] File: `src/ui/lib/libraryMedia.ts` (mới)
- [ ] Acceptance: relative `/api/library/file/{uuid}` → `bossUrl + path`; `//host/...` → `http(s)://host/...`; full http/https giữ nguyên; rỗng → `''`
- [ ] Test: jest unit cho 4 case

## 2. IPC `file:downloadUrlToTemp`

- [ ] File: `electron/ipc/fileIpc.ts` (handler), `electron/preload.ts`, `src/ui/lib/ipc.ts` (type)
- [ ] Acceptance: `{ url, ext, filename }` → download → `{ success, filePath }`; file tồn tại trong tmp
- [ ] Test: tsc electron + tsc renderer

## 3. Helper `resolveLibraryLocalPath`

- [ ] File: `src/ui/lib/libraryMedia.ts`
- [ ] Acceptance: boss + `_localPath` → trả `_localPath`; employee → downloadUrlToTemp; không resolve được → `''`
- [ ] Test: tsc renderer

## 4. Routing theo kênh trong `LibraryPickerModal`

- [ ] File: `src/ui/components/chat/library/LibraryPickerModal.tsx`
- [ ] Acceptance: FB gửi qua `channelIpc`/`ipc.fb`; TG qua `channelIpc`; Zalo giữ `ipc.zalo`; mọi opts chỉ có `filePath` thật (bỏ `fileUrl`/`_libraryUuid`)
- [ ] Test: tsc renderer + thủ công 4 kênh

## 5. Verify + archive

- [ ] tsc electron 0 lỗi mới + tsc renderer 0 lỗi
- [ ] Thủ công: gửi ảnh/file/video từ Library (boss mode) trên Zalo, Facebook, Telegram bot, Telegram user — không còn "Không thể gửi lại media"
- [ ] `openspec archive fix-library-media-send -y` (+ task_plan.md/progress.md cập nhật)
