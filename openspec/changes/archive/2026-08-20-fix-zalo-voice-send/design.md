# Design: Gửi ghi âm Zalo dùng m4a + sửa extract fileUrl

## Giải pháp (chỉ sửa `src/ui/components/chat/MessageInput.tsx`)

### 1. MimeType ưu tiên m4a (khu vực `handleVoiceToggle`, dòng ~2322)

```ts
const canMp4 = MediaRecorder.isTypeSupported('audio/mp4');
const mimeType = canMp4
  ? 'audio/mp4'
  : MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : 'audio/webm';
```

- Đã xác thực: Electron 41.5.1 trả `isTypeSupported('audio/mp4') === true` và sinh file `ftyp isom`
  (MP4/AAC) hợp lệ; `audio/ogg`/`audio/mp3`/`audio/wav` trả `false` → không dùng.
- Giữ nguyên `recorder.ondataavailable`/`onstop`/queue — chỉ đổi mimeType và ext.

### 2. Map ext theo mimeType (dòng ~2367, trước `saveTempBlob`)

```ts
const ext = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('webm') ? 'webm' : 'ogg';
```

- `saveTempBlob` (fileIpc.ts:202) đã strip data-URI prefix + ghi base64 → file `.m4a` là MP4/AAC đúng.

### 3. Extract fileUrl từ object phẳng (dòng ~2388)

```ts
const voiceUrl: string = uploadRes?.fileUrl || uploadRes?.normalUrl || uploadRes?.hdUrl || uploadRes?.url || uploadRes?.href || '';
if (!voiceUrl) return { success: false, error: 'Upload file ghi âm thất bại' };
```

- zca-js `uploadAttachment` nhánh "others" trả `{ fileType, fileUrl, fileId, totalSize, fileName, checksum }`
  (uploadAttachment.js:163-168) → `fileUrl` nằm ở top-level, không phải `.response.fileUrl`.

## Files

- `src/ui/components/chat/MessageInput.tsx` (3 vị trí nêu trên)

## Không đổi

- `ZaloService.uploadVoiceFile` / `sendVoice`, `zaloIpc.ts`, preload, electron — đúng sẵn.
- Không thêm dependency (không cần ffmpeg/lamejs; Chromium AAC encoder sẵn trong Electron).

## Verify

1. tsc renderer (NODE_OPTIONS --max-old-space-size check) 0 lỗi → build dist → chạy app.
2. Thủ công: ghi âm 3-5s → gửi Zalo chat cá nhân + nhóm → nhận + nghe được trên web và mobile;
   log không còn `zalo:uploadVoiceFile error`; bỏ log debug [ZaloService] uploadVoiceFile raw result sau test.