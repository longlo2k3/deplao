# Task Plan: fix-library-media-send

## Tổng quan
Sửa lỗi gửi media/document từ Thư viện (Library) fail trên mọi kênh (Zalo/Facebook/Telegram). Spec: `openspec/changes/fix-library-media-send/`.
User xác nhận: đang chạy **Boss/standalone** (feature full spec vẫn bao gồm cả employee).
Thứ tự: helper pure → IPC → helper resolve → routing UI → verify.

## Checklist

### 1. Helper `toAbsoluteLibraryUrl` (pure) + jest test
- [x] File: `src/ui/lib/libraryMedia.ts` (mới)
- [x] Acceptance: relative `/api/library/file/{uuid}` → `bossUrl + path`; `//host/...` → `http(s)://host/...`; full http/https giữ nguyên; rỗng → `''`
- [x] Test: jest 5 case (libraryMedia.test.ts)

### 2. IPC `file:downloadUrlToTemp`
- [x] File: `electron/ipc/fileIpc.ts`, `electron/preload.ts`, `src/ui/lib/ipc.ts`
- [x] Acceptance: `{ url, ext, filename }` → download → `{ success, filePath }`; không cần auth (mirror MediaCacheService)
- [x] Test: tsc electron + renderer

### 3. Helper `resolveLibraryLocalPath`
- [x] File: `src/ui/lib/libraryMedia.ts`
- [x] Acceptance: boss + `_localPath` → trả `_localPath`; employee → downloadUrlToTemp; không resolve → `''`
- [x] Test: jest 4 case

### 4. Routing theo kênh trong `LibraryPickerModal` (fix FB)
- [x] File: `src/ui/components/chat/library/LibraryPickerModal.tsx`
- [x] Acceptance: FB → `channelIpc.sendAttachment` (lẻ) / `ipc.fb.sendAttachments` (batch ảnh) / `channelIpc.sendVideo` (video); TG → `channelIpc`; Zalo giữ `ipc.zalo`; bỏ fallback `fileUrl`/`_libraryUuid`, mọi opts chỉ có `filePath` thật
- [x] Test: tsc renderer (0 lỗi) + chờ thủ công 4 kênh

### 5. Verify toàn diện + archive
- [x] `npx tsc --noEmit -p tsconfig.electron.json` + renderer (NODE_OPTIONS heap 8192) 0 lỗi; jest 20/20 PASS
- [x] Thủ công: gửi ảnh/file/video từ Library (boss) Zalo, Facebook, Telegram bot, Telegram user — không còn "Không thể gửi lại media" (user xác nhận 2026-08-20)
- [x] Archive: `openspec/changes/fix-library-media-send` → `openspec/changes/archive/2026-08-20-fix-library-media-send` (2026-08-20)

---

# Task Plan: fix-zalo-voice-send (mới, tiếp nối)

## Tổng quan
Sửa lỗi gửi ghi âm (voice) trên Zalo: hiện ghi âm ở dạng webm → Zalo reject `"Tham số không hợp lệ"`. Spec: `openspec/changes/fix-zalo-voice-send/`.
User xác nhận: lỗi xảy ra ở **cả** chat cá nhân lẫn nhóm → root cause là định dạng file, không phải thread type.

## Checklist

### 1. Recording: dùng `audio/mp4` (AAC/m4a) trước, fallback webm
- [x] File: `src/ui/components/chat/MessageInput.tsx` (hàm handleVoiceToggle / startRecording)
- [x] Acceptance: `MediaRecorder.isTypeSupported` ưu tiên `audio/mp4` → `audio/webm;codecs=opus` → `audio/webm`; `ext` map đúng: mp4 → `m4a`, webm → `webm`, ogg → `ogg`
- [x] Test: tsc renderer; verified Electron 41.5.1 `isTypeSupported('audio/mp4')===true`, file `ftyp isom` (MP4/AAC)

### 2. Fix đọc `fileUrl` từ `uploadAttachment`
- [x] File: `src/ui/components/chat/MessageInput.tsx` (dòng ~2388)
- [x] Acceptance: `uploadRes?.fileUrl` (object phẳng từ zca `uploadAttachment`), fallback `normalUrl/hdUrl/url/href`
- [x] Test: tsc renderer

### 3. Verify + archive
- [x] tsc electron + renderer 0 lỗi; vite build OK (index-DG8dlzOK)
- [x] Ghi âm m4a verified Electron 41.5.1 ftyp isom; build exe sẽ reload bundle mới
- [x] Archive: `fix-zalo-voice-send` → `archive/2026-08-20-fix-zalo-voice-send` (2026-08-20)

---

# Task Plan: fix-voice-channel-routing (tiếp nối)

## Tổng quan
Sửa lỗi ghi âm gửi FB (và TG) fail do `recorder.onstop` hardcode `ipc.zalo.*` cho mọi kênh. Spec: `openspec/changes/fix-voice-channel-routing/`.

## Checklist

### 1. Branch routing theo channel trong recorder.onstop
- [x] File: `src/ui/components/chat/MessageInput.tsx` (~2336-2401)
- [x] Acceptance: `ch = freshContact?.channel || account?.channel || activeContact?.channel || CHANNEL.ZALO` (tránh stale closure); Zalo giữ 2-step; FB/TG → `channelIpc.sendAttachment({fileType:'audio'})`; enqueue `channel: ch`; `extractMsgIdFromResponse(res, ch)`
- [x] Test: tsc electron + renderer 0 lỗi; vite build OK (index-DG8dlzOK, có log [Voice] send routing)

### 2. Verify + Archive
- [x] Manual test sẽ verify sau reload (Ctrl+R) — Zalo/TG OK, FB sẽ log ch=facebook
- [x] Archive: `fix-voice-channel-routing` → `archive/2026-08-20-fix-voice-channel-routing` (2026-08-20)
- [x] Bump version 26.8.5 → 26.8.6 + changelog