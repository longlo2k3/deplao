## Task 1: Ghi âm ưu tiên `audio/mp4` (m4a)
- File: `src/ui/components/chat/MessageInput.tsx` (khu `handleVoiceToggle`, ~line 2322)
- Acceptance: mimeType = `audio/mp4` nếu isTypeSupported; ext = `m4a` khi ghi mp4; fallback webm + ext `webm`
- Test: tsc renderer exit 0; log/check file tạm có đuôi `.m4a` sau khi ghi âm

## Task 2: Fix extract `fileUrl` (flat)
- File: `src/ui/components/chat/MessageInput.tsx` (~line 2388)
- Acceptance: `uploadRes?.fileUrl` fallback `normalUrl/hdUrl/url/href`; chỉ lỗi khi rỗng
- Test: tsc renderer exit 0; verify bằng log khi gửi thành công

## Task 3: Verify + Archive
- `npx tsc --noEmit -p tsconfig.electron.json` + renderer 0 lỗi; build `npm run build:ui` (hoặc script tương đương) OK
- Thủ công: ghi âm → gửi Zalo User + Group; nghe được trên web + mobile; không còn `Tham số không hợp lệ`
- Archive `fix-zalo-voice-send` + cập nhật task_plan.md / progress.md