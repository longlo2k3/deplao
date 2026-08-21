## Task 1: Branch routing theo channel trong recorder.onstop
- File: `src/ui/components/chat/MessageInput.tsx` (~2336-2401)
- Acceptance: `ch = activeContact?.channel || CHANNEL.ZALO`; Zalo giữ 2-step; FB/TG → `channelIpc.sendAttachment({fileType:'audio'})`; enqueue `channel: ch`; `extractMsgIdFromResponse(res, ch)`
- Test: tsc renderer exit 0

## Task 2: Verify + Archive
- tsc electron + renderer 0 lỗi; `npm run build:renderer` OK; reload app
- Thủ công: ghi âm gửi Zalo user+group, Facebook 1:1+nhóm, Telegram bot+user — thành công, không gọi ipc.zalo cho FB/TG
- Archive `fix-voice-channel-routing` + cập nhật task_plan.md / progress.md