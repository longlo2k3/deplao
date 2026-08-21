# Progress: fix-library-media-send

## Checkpoints

| Date | Status | Note |
|---|---|---|
| 2026-08-20 | ✅ Spec | OpenSpec change `fix-library-media-send` (2 capabilities: library-send-channel-routing, library-file-local-resolution). Gate G1: user xác nhận spec + chạy ở **Boss/standalone** |
| 2026-08-20 | ✅ Planning | task_plan.md + findings.md + progress.md tạo xong (Gate G2) |
| 2026-08-20 | ✅ Implementation | T1-T4 xong: helper pure `toAbsoluteLibraryUrl` + `resolveLibraryLocalPath`, IPC `file:downloadUrlToTemp`, routing 3 nhánh (TG/FB/Zalo) cho `sendItem`/image-batch/video-file/`handleDirectFile`; bỏ fallback dead `fileUrl`/`_libraryUuid` |
| 2026-08-20 | ✅ Verify (auto) | jest 20/20 PASS (libraryMedia 9/9 + messageMerge 11/11); tsc electron EXIT 0; tsc renderer EXIT 0 |
| 2026-08-20 | ✅ Manual test | User xác nhận gửi ảnh/file/video từ Library OK trên Zalo, Facebook, Telegram bot, Telegram user |
| 2026-08-20 | ✅ Archived | `fix-library-media-send` → `archive/2026-08-20-fix-library-media-send` |

---

# Change mới: fix-zalo-voice-send

## Checkpoints

| Date | Status | Note |
|---|---|---|
| 2026-08-20 | 🔄 Spec | User report: gửi ghi âm Zalo vẫn lỗi `"Tham số không hợp lệ"` ở cả chat cá nhân + nhóm. Root cause: ghi âm webm, Zalo chỉ nhận voice qua uploadAttachment ở định dạng aac/mp3/m4a/wav/ogg. Kèm bug phụ: đọc `uploadRes?.response?.fileUrl` sai shape (phải `uploadRes?.fileUrl`) |

## Root cause (tóm tắt)
1. MediaRecorder ghi `audio/webm;codecs=opus` → `.webm` → Zalo `asyncfile/upload` reject `"Tham số không hợp lệ"` (openzca chỉ hỗ trợ aac/mp3/m4a/wav/ogg). Electron 41.5.1 hỗ trợ `audio/mp4` (AAC/m4a) → dùng luôn m4a.
2. Extract URL: `MessageInput.tsx:2388` đọc `.response.fileUrl` nhưng uploadAttachment trả object phẳng `{fileUrl,...}`.

---

# Change mới: fix-voice-channel-routing

## Checkpoints

| Date | Status | Note |
|---|---|---|
| 2026-08-20 | 🔄 Spec | User report: ghi âm gửi FB vẫn lỗi. Root cause: `recorder.onstop` hardcode `ipc.zalo.*` + `channel:'zalo'` cho mọi kênh (MessageInput.tsx:2384-2394) → FB/TG fail. Nền tảng đã có `fb:sendAttachment(fileType:'audio')` + adapter TG. Spec gồm capability `voice-recording-channel-routing` |
| 2026-08-20 | ✅ Implementation | Branch theo `ch = activeContact?.channel || CHANNEL.ZALO`: Zalo giữ 2-step; FB/TG → `channelIpc.sendAttachment({fileType:'audio'})`; enqueue `channel: ch`; `extractMsgIdFromResponse(res, ch)` |
| 2026-08-20 | ✅ Verify (auto) | tsc electron EXIT 0; tsc renderer EXIT 0; vite build OK (1m6s) |
| 2026-08-20 | ✅ Verify (auto) | tsc electron+renderer 0 lỗi; vite build OK (DG8dlzOK) |
| 2026-08-20 | ✅ Archived | `fix-zalo-voice-send` + `fix-voice-channel-routing` → archive (26.8.6) |

## Root cause (tóm tắt)
`recorder.onstop` (MessageInput.tsx:2336-2401) hardcode đường gửi Zalo cho mọi kênh:
- `channel: 'zalo'` trong `messageQueue.enqueue`
- luôn gọi `ipc.zalo.uploadVoiceFile` + `ipc.zalo.sendVoice` (kể cả account FB/TG)
→ tài khoản FB/TG bị đưa vào ZaloService → fail. Fix: route theo `activeContact.channel`.

## Root cause (tóm tắt)
1. Routing chỉ phân biệt Telegram vs Zalo → **Facebook rơi vào nhánh Zalo** (`ipc.zalo.*`) → fail.
2. Fallback `fileUrl`/`_libraryUuid` là dead code (zaloIpc bỏ qua) → employee/no-path ENOENT.
→ send_status failed → UI "Không thể gửi lại media".