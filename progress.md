# Progress: fix-chat-ordering-timestamps

## Checkpoints

| Date | Status | Note |
|---|---|---|
| 2026-08-18 | ✅ Spec | OpenSpec change `fix-chat-ordering-timestamps` (2 capabilities: outgoing-order, timestamp-gap), user confirmed (Gate G1) |
| 2026-08-18 | ✅ Planning | task_plan.md + findings.md + progress.md tạo xong (Gate G2) |
| 2026-08-18 | ✅ Implementation | T1-T6 xong, TDD đủ (libtest messageMerge 11/11), tsc 0 lỗi |
| 2026-08-19 | ✅ Debug by evidence | Runtime log xác nhận ordering đúng (FB burst + Zalo echo); tìm root cause bug tên → raw contact_id làm tên sidebar |
| 2026-08-19 | ✅ Verify | Fix T8 (name display) + gỡ TEMP-DIAG; tsc EXIT 0; jest 11/11 PASS |
| 2026-08-19 | ✅ Build | `production` → `Deplao-Setup-26.8.3.exe` (165.8 MB) tại `dist-electron-build/` |

## T7. Verify toàn diện + archive
- **Trạng thái**: ✅ done (evidence runtime)
- **Verification evidence**: thêm TEMP-DIAG (messageMerge, useChatEvents, ChatWindow, ChatHeader) + `ELECTRON_ENABLE_LOGGING=1`, user reproduce → log chứng minh:
  - **Ordering FB**: 4 tin "hi/A/B/C" → temp `seq 0..3`; echo in-place giữ vị trí 14→17 + giữ send_seq; RENDER cuối Chuẩn; reload DB trả newest-first, `.reverse()` + ChatWindow sort đúng
  - **Ordering Zalo**: 19 echo khớp `REAL-byRealId`, kế thừa `tempTs` (client ms) — thứ tự đúng
  - **Bug tên**: Header fallback đúng ("Người dùng Facebook"); SIDEBAR hiện raw contact_id khi display_name rỗng → root cause

## T8. Fix hiển thị tên contact chưa có display_name
- **Trạng thái**: ✅ done
- **Verification evidence**: `ConversationList` `convoName` fallback (`getFriendlyUserName` / "Nhóm mới"), avatar 'U'; `ForwardMessageModal` + `GroupModals` fallback `getFriendlyUserName(c.channel)` thay c.contact_id; header đã đúng từ trước. tsc EXIT 0; jest 11/11 PASS; TEMP-DIAG đã gỡ.