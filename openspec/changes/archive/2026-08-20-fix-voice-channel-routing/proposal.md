## Why

Gửi ghi âm (voice) thất bại trên **Facebook** (user phản hồi "Vẫn đang lỗi ở fb"), và sẽ thất bại
trên Telegram vì cùng lý do. `recorder.onstop` trong `MessageInput.tsx` (dòng ~2336-2401) **hardcode
luồng gửi Zalo cho mọi kênh**:

- `2384` `messageQueue.enqueue({ ..., channel: 'zalo' })` — hardcode channel
- `2387` `ipc.zalo?.uploadVoiceFile({ ... })` — gọi Zalo IPC kể cả khi account là Facebook/Telegram
- `2390` `ipc.zalo?.sendVoice({ ... })` — tương tự
- `2391` `extractMsgIdFromResponse(sendRes, 'zalo')` — parse theo shape Zalo

→ Tài khoản Facebook bị đưa vào `ZaloService` → gửi fail. Nền tảng đã có sẵn đường gửi audio cho
các kênh khác: `facebookIpc.ts:547` `fb:sendAttachment` với `fileType:'audio'` (`sendE2EEAudio` cho
1:1; upload + `typeAttachment:'audio'` cho nhóm, facebookIpc.ts:676-690); Telegram adapter
`TelegramBotAdapter.sendAttachment`/`TelegramUserAdapter.sendAttachment` nhận biết m4a/mp3/wav/ogg
→ gửi audio. Chỉ thiếu nhánh routing tại nơi sản xuất ghi âm.

## What Changes

- **Routing theo kênh** trong `recorder.onstop` (chuẩn pattern đã có ~10 chỗ khác trong component:
  `const ch = activeContact?.channel || CHANNEL.ZALO`):
  - `ch === 'zalo'` → giữ nguyên 2-step hiện có (uploadVoiceFile → sendVoice; m4a đã fix ở
    `fix-zalo-voice-send`).
  - ngược lại → `channelIpc.sendAttachment(ch, { accountId, threadId, threadType, filePath,
    fileType: 'audio', ...(quote? { quote } : {}) })`.
- **Sửa hardcode channel** trong `enqueue`: `channel: ch` thay vì `'zalo'`.
- **Sửa `extractMsgIdFromResponse`** truyền đúng `ch` (FB có nhánh riêng `res.messageId`).

## Capabilities

### New Capabilities
- `voice-recording-channel-routing`: Gửi ghi âm theo đúng channel (Zalo/Facebook/Telegram) thay vì hardcode Zalo

### Modified Capabilities
<!-- none -->

## Impact

- `src/ui/components/chat/MessageInput.tsx` — chỉ `recorder.onstop` (~dòng 2336-2395)
- Không đổi service / electron / adapter / store / DB