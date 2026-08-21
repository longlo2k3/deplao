# Findings: fix-library-media-send

## Bug — gửi media từ Library fail mọi kênh, UI "Không thể gửi lại media"

### Nguyên nhân gốc (đã xác nhận bằng đọc code)

1. **Routing sai kênh cho Facebook** — `LibraryPickerModal.tsx` chỉ nhận biết `isTg` (Telegram) vs "Zalo: existing flow":
   - `sendItem` (384-436): FB account → `isTg=false` → rơi vào nhánh Zalo → `ipc.zalo.sendImage/sendFile` / `channelIpc.sendVideo('zalo', …)` → fail vì account FB không phải account Zalo.
   - `handleSendSelected` image-batch (448-506), video/file loop (509-564), `handleDirectFile` (598-676): cùng pattern sai.
   - Pattern ĐÚNG đã có sẵn ở `MessageInput.tsx:1514-1528, 2116-2132`: TG → `channelIpc`, FB → `channelIpc`/`ipc.fb`, Zalo → `ipc.zalo`.

2. **Fallback `fileUrl`/`_libraryUuid` là dead code** — khi thiếu `_localPath`, UI set `opts.fileUrl` + `opts._libraryUuid`
   (LibraryPickerModal.tsx:485, 491, 551, 557) nhưng handler `zalo:sendImage/sendImages/sendFile/sendVideo`
   (`zaloIpc.ts:196-218`) **bỏ qua** các field này, chỉ đọc `p.filePath` → `resolveAbsolutePath('')` → `readFileSync` ENOENT.
   - Ở boss/standalone `_localPath` luôn có (path thật trên máy) → bug này chỉ ảnh hưởng employee mode.
   - Employee: `libraryIpc.ts:47` / `LibraryHandler.ts:194` trả path trên **máy Boss** → không tồn tại local → fail.

3. **Kết quả**: message `send_status=failed/timeout` → `ChatWindow.tsx:3475` hiện **"Không thể gửi lại media"** (media không cho retry).

### Giải pháp chốt

- Mọi luồng gửi từ Library routing theo channel giống MessageInput: TG → `channelIpc`, FB → `channelIpc`/`ipc.fb`, Zalo → `ipc.zalo`. Cho `sendItem`, image-batch, video/file loop, `handleDirectFile`.
- `resolveLibraryLocalPath(item)`: boss dùng `_localPath`; employee/no-path → download `fileUrl` về temp qua IPC mới `file:downloadUrlToTemp` (mirror `file:saveTempBlob` + `MediaCacheService.downloadToCache`, Boss serve library file không cần auth — `HttpRelayService.ts:1285`).
- Bỏ fallback `fileUrl`/`_libraryUuid`; mọi opts gửi luôn có `filePath` thật.
- Không đổi store / DB / zaloIpc / channelHelper / adapters.

### Sequence lỗi FB hiện tại

```
LibraryPickerModal: channel=facebook, isTg=false
→ nhánh "Zalo: existing flow"
→ ipc.zalo.sendImage({ filePath: <path>, auth:<zalo-missing> })
→ zaloIpc: resolveZaloId(auth FB) fail / service Zalo không tồn tại cho account FB
→ send fail → send_status 'failed' → ChatWindow "Không thể gửi lại media"
```