# Progress: fix-chat-ordering-timestamps

## Checkpoints

| Date | Status | Note |
|---|---|---|
| 2026-08-18 | ✅ Spec | OpenSpec change `fix-chat-ordering-timestamps` (2 capabilities: outgoing-order, timestamp-gap), user confirmed (Gate G1) |
| 2026-08-18 | ✅ Planning | task_plan.md + findings.md + progress.md tạo xong (Gate G2) |
| 2026-08-18 | ✅ Implementation | T1-T6 xong, TDD đủ (libtest messageMerge 11/11), tsc 0 lỗi |
| 2026-08-18 | 🔄 Verify | chờ user test UI trên app dev |

## T1. MessageItem.send_seq + gán seq cho temp
- **Trạng thái**: ✅ done
- **Verification evidence**: `MessageItem.send_seq?: number` (chatStore ~119); module counter `nextSendSeq`; `assignSendSeq` gán seq cho outgoing temp (test 3 case PASS)

## T2. Sort comparator (timestamp, send_seq)
- **Trạng thái**: ✅ done
- **Verification evidence**: `sortMessages` trong `src/ui/lib/chat/messageMerge.ts`; dùng ở `addMessage` + `prependMessages` (test 3 case PASS)

## T3. Self-dedup: kế thừa ordering + chỉ xoá 1 temp
- **Trạng thái**: ✅ done
- **Verification evidence**: `mergeMessage` pure — real echo kế thừa send_seq + ts client từ temp (Strategy 1 real_msg_id, Strategy 2 content chỉ xoá 1 temp đầu); echo ngược thứ tự vẫn đúng (test 5 case PASS). Bonus: no-op duplicate trả `state` như cũ (tránh re-render thừa).

## T4. Export MSG_TIME_GAP_MS
- **Trạng thái**: ✅ done
- **Verification evidence**: `messageParser.ts` export `MSG_TIME_GAP_MS = 5 * 60 * 1000`; import OK

## T5. ChatWindow: tách showTime / showSenderName
- **Trạng thái**: ✅ done, 🔄 chờ user test UI
- **Verification evidence**: `showTime = !prevMsg || gap >= MSG_TIME_GAP_MS` (bỏ sender-change); `showSenderName` riêng (đổi sender || gap) dùng ở group-name (2996); import hằng số chung

## T6. QuickChatModal dùng hằng số chung
- **Trạng thái**: ✅ done
- **Verification evidence**: package-shared `MSG_TIME_GAP_MS`, bỏ inline `5 * 60 * 1000`; hành vi không đổi

## T7. Verify toàn diện + archive
- **Trạng thái**: 🔄 chờ UI test + archive
- **Verification evidence**: `tsc -p tsconfig.json --noEmit` EXIT 0 (fix kèm lỗi có sẵn GlobalSearchPanel thiếu import type `Channel`); `tsc -p tsconfig.electron.json --noEmit` EXIT 0; `npx jest` 11/11 PASS (2026-08-18)