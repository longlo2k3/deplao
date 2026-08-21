## Why

Khi gửi file media/document từ Thư viện Media (Library) tới một cuộc trò chuyện, tin nhắn thất bại
("Gửi không được / gửi fail") và UI hiện **"Không thể gửi lại media"** (`ChatWindow.tsx:3475`).
Lỗi xảy ra trên **mọi kênh** (Zalo, Facebook, Telegram Bot, Telegram User). Nguyên nhân gốc:

1. **Routing sai kênh cho Facebook** — `LibraryPickerModal.tsx` chỉ phân nhánh `isTg` (Telegram) vs
   "Zalo: existing flow". Facebook **rơi vào nhánh Zalo** → gọi `ipc.zalo.sendImage/sendFile/sendVideo`
   → thất bại vì account Facebook không phải account Zalo. (Pattern đúng đã có sẵn ở
   `MessageInput.tsx:1514-1528, 2116-2132`: Telegram → `channelIpc`, FB → `channelIpc`/`ipc.fb`, Zalo → `ipc.zalo`.)

2. **File không có local path trên máy gửi** — `_localPath` trả về từ `libraryIpc.ts:47` /
   `LibraryHandler.ts:194` là **path tuyệt đối trên máy Boss**, không tồn tại trên máy Employee.
   Fallback `opts.fileUrl` + `opts._libraryUuid` (LibraryPickerModal.tsx:485, 491, 551, 557) là **dead code**:
   các handler `zalo:sendImage/sendImages/sendFile/sendVideo` (`zaloIpc.ts:196-218`) **bỏ qua** `fileUrl`,
   chỉ đọc `p.filePath` → `resolveAbsolutePath('')` → `readFileSync` ENOENT → gửi fail.

## What Changes

- **Routing theo kênh đúng chuẩn `MessageInput`**: mọi luồng gửi từ Library (`sendItem`,
  `handleSendSelected` image-batch + video/file loop, `handleDirectFile`) chọn theo channel:
  Telegram → `channelIpc`, Facebook → `channelIpc` (lẻ) / `ipc.fb.sendAttachments` (batch ảnh),
  Zalo → `ipc.zalo` (giữ nguyên 3-step video, batch ảnh).
- **Đảm bảo file thật sự có local path trước khi gửi** (mới): helper `resolveLibraryLocalPath(item)`
  trả về path local khả dụng trên máy hiện tại —
  Boss/standalone dùng `_localPath`; employee hoặc thiếu `_localPath` → tải file từ Boss về temp
  qua IPC mới `file:downloadUrlToTemp` (mirror `file:saveTempBlob`, dùng `fetch` như `MediaCacheService`).
- **Bỏ fallback dead `fileUrl`/`_libraryUuid`** trong send opts; mọi opts gửi luôn có `filePath` thật.
- Preview/attachments của message dùng path local đã resolve (employee dùng `fileUrl` để hiển thị).

## Capabilities

### New Capabilities
- `library-send-channel-routing`: Gửi media từ Library đúng kênh (Telegram/Facebook/Zalo) như MessageInput
- `library-file-local-resolution`: Resolve path local khả dụng (Boss path hoặc download Boss→temp) trước khi gửi

### Modified Capabilities
<!-- none -->

## Impact

- `src/ui/components/chat/library/LibraryPickerModal.tsx` — routing 3 luồng gửi + gọi resolver
- `src/ui/lib/libraryMedia.ts` (mới) — `resolveLibraryLocalPath` + `toAbsoluteLibraryUrl`
- `electron/ipc/fileIpc.ts` — handler mới `file:downloadUrlToTemp`
- `electron/preload.ts` + `src/ui/lib/ipc.ts` — expose `file.downloadUrlToTemp`
- Không đổi store / DB / channelHelper / adapters
