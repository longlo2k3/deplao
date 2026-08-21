## Why

Gửi ghi âm (voice) trong chat Zalo luôn thất bại. Log (dist-electron, build hiện tại):

```
[zaloIpc] zalo:uploadVoiceFile error: Error: uploadVoiceFile error: Tham số không hợp lệ
    at ZaloService.uploadVoiceFile (ZaloService.js:1146)
```

User xác nhận lỗi xảy ra ở **cả chat cá nhân (User) lẫn nhóm (Group)** → loại trừ nguyên nhân
thread-type (khác issue #248 "video gửi nhóm lỗi"). Root cause:

1. **Sai định dạng ghi âm.** `MessageInput.tsx:2322-2324` chọn `MediaRecorder` ưu tiên
   `audio/webm;codecs=opus` → blob `.webm` (container **EBML/Matroska**, magic `1A 45 DF A3`).
   Luồng gửi `MessageInput.tsx:2387` gọi `ipc.zalo.uploadVoiceFile` → `ZaloService.uploadVoiceFile`
   (ZaloService.ts:1297) → `api.uploadAttachment([voicePath], ...)` → chunk upload tới Zalo
   `asyncfile/upload` **bị server từ chối** với `"Tham số không hợp lệ"`.
   Đối chiếu openzca (tool zca-js trưởng thành, cùng `uploadAttachment` → `fileUrl` → `sendVoice`),
   voice local CHỈ hỗ trợ `.aac / .mp3 / .m4a / .wav / .ogg` — **không có webm**.
   Đã xác thực bằng test thật trên Electron 41.5.1 (Chromium 146): ưu tiên ghi `audio/mp4`
   → file `.m4a` hợp lệ (MP4 `ftyp isom`, AAC-LC, 14.5KB/1.2s@64kbps) — đúng định dạng gốc Zalo
   (`sendVoice` dùng `m4aUrl`). Electron này KHÔNG hỗ trợ `audio/ogg`, `audio/mp3`, `audio/wav`.

2. **Đọc `fileUrl` sai shape.** `MessageInput.tsx:2388` đọc `uploadRes?.response?.fileUrl || ...`,
   nhưng `uploadAttachment` (zca-js) trả object **phẳng** `{ fileType, fileUrl, fileId, fileName,
   totalSize, checksum }` cho nhánh "others" → `voiceUrl` luôn rỗng → nhỡ upload thành công cũng
   báo `"Upload file ghi âm thất bại"`. Đúng ra phải là `uploadRes?.fileUrl`.

## What Changes

- **Ghi âm bằng `audio/mp4` (AAC → `.m4a`), fallback webm.** Thứ tự `MediaRecorder.isTypeSupported`:
  `audio/mp4` → `audio/webm;codecs=opus` → `audio/webm`. Map `ext` đúng theo mime mới:
  mp4 → `m4a`, webm → `webm`, ogg → `ogg`. `saveTempBlob` vẫn giữ nguyên (đã strip data-URI prefix).
- **Fix extract `fileUrl`:** đọc `uploadRes?.fileUrl` (flat), fallback `normalUrl/hdUrl/url/href` →
  chỉ báo "Upload file ghi âm thất bại" khi thật sự rỗng.
- Không đổi `ZaloService.uploadVoiceFile`/`sendVoice`/IPC `zaloIpc` — chúng đúng sẵn; chỉ đổi nơi
  sản xuất file và nơi đọc URL.

## Capabilities

### New Capabilities
- `zalo-voice-m4a-recording`: Ghi âm Zalo dùng container m4a (AAC) thay vì webm để Zalo chấp nhận upload
- `zalo-voice-fileurl-extract`: Đọc `fileUrl` từ kết quả `uploadAttachment` (object phẳng) trước khi `sendVoice`

### Modified Capabilities
<!-- none -->

## Impact

- `src/ui/components/chat/MessageInput.tsx` — mimeType selection (~3 dòng) + ext map (1 dòng) + extract URL (1 dòng)
- Không đổi electron / store / DB / services / adapters
- Không thêm dependency mới