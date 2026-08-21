# Design: Routing ghi âm theo channel

## Giải pháp (chỉ `src/ui/components/chat/MessageInput.tsx`, `recorder.onstop` ~2336-2401)

### 1. Xác định channel (đầu `recorder.onstop`)

```ts
const ch = activeContact?.channel || CHANNEL.ZALO;
```

(khớp pattern `const ch = activeContact?.channel || CHANNEL.ZALO;` đang dùng ở dòng 924/954/1514/…)

### 2. Branch trong `sendFn` của `messageQueue.enqueue`

```ts
sendFn: async () => {
  try {
    if (((ch as string) || CHANNEL.ZALO) === CHANNEL.ZALO) {
      // Zalo — 2 bước hiện có (đã fix m4a + fileUrl)
      const uploadRes = await ipc.zalo?.uploadVoiceFile?.({ auth, voicePath: saveRes.filePath, threadId: activeThreadId, type: activeThreadType });
      const voiceUrl: string = uploadRes?.fileUrl || uploadRes?.normalUrl || uploadRes?.hdUrl || uploadRes?.url || uploadRes?.href || '';
      if (!voiceUrl) return { success: false, error: 'Upload file ghi âm thất bại' };
      const sendRes = await ipc.zalo?.sendVoice({ auth, options: { voiceUrl }, threadId: activeThreadId, type: activeThreadType, ...(quotePayload ? { quote: quotePayload } : {}) });
      return { success: true, ...extractMsgIdFromResponse(sendRes, ch) };
    }

    // Facebook / Telegram — qua adapter (fileType:'audio')
    const res = await channelIpc.sendAttachment(ch as any, {
      accountId: activeAccountId!, threadId: activeThreadId, threadType: activeThreadType,
      filePath: saveRes.filePath, fileType: 'audio',
      ...(quotePayload ? { quote: quotePayload } : {}),
    });
    return { success: res?.success ?? false, ...extractMsgIdFromResponse(res, ch), error: res?.error };
  } catch (err: any) { return { success: false, error: err?.message || String(err) }; }
}
```

### 3. Channel trong enqueue

```ts
messageQueue.enqueue({ tempId, zaloId, threadId, threadType, channel: ch as any, sendFn, ... });
```

## Files

- `src/ui/components/chat/MessageInput.tsx`

## Không đổi

- `ZaloService` / `zaloIpc` / `facebookIpc` / adapters / preload — nền tảng đã đủ.
- Ghi âm vẫn là m4a (AAC) từ `fix-zalo-voice-send` — FB `sendE2EEAudio`/TG adapter nhận m4a OK.

## Verify

1. tsc electron + renderer 0 lỗi → vite build → reload app.
2. Thủ công: ghi âm → gửi Zalo (user + group), Facebook (1:1 + nhóm), Telegram bot + user.
   Không còn gọi `ipc.zalo.*` cho FB/TG (log), không còn `Tham số không hợp lệ`.