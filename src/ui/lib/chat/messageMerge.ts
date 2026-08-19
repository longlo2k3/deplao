/**
 * messageMerge.ts — Pure helpers for chat message store ordering & dedup.
 *
 * Tách khỏi chatStore để unit-test được. Logic:
 *   - `send_seq`: số thứ tự tăng dần của tin nhắn ĐI (temp) → giữ thứ tự gửi
 *     ngay cả khi echo real đến ngược thứ tự / trùng timestamp.
 *   - Real self echo kế thừa send_seq + timestamp client từ temp khớp.
 *   - Content-match chỉ xoá 1 temp khớp đầu tiên (tránh mất bubble trùng text).
 */

import type { MessageItem } from '@/store/chatStore';

/**
 * Gán `send_seq` tăng dần cho outgoing temp message (pure, trả thêm seq tiếp theo).
 * Chỉ gán cho tin nhắn ĐI chưa có real id (`temp_*`) — real/incoming không gán.
 */
export function assignSendSeq<T extends MessageItem>(msg: T, next: number): { msg: T; next: number } {
  if (msg.is_sent === 1 && msg.msg_id.startsWith('temp_') && msg.send_seq == null) {
    return { msg: { ...msg, send_seq: next }, next: next + 1 };
  }
  return { msg, next };
}

/**
 * Sort comparator ổn định: timestamp ASC, tiebreak bằng send_seq ASC.
 * Tin không có send_seq (incoming) xếp sau tin có seq cùng timestamp.
 */
export function sortMessages(a: MessageItem, b: MessageItem): number {
  return (
    (a.timestamp || 0) - (b.timestamp || 0) ||
    (a.send_seq ?? Number.MAX_SAFE_INTEGER) - (b.send_seq ?? Number.MAX_SAFE_INTEGER)
  );
}

const extractDedupText = (c: string): string => {
  try {
    const p = JSON.parse(c);
    if (p?.action === 'rtf' && typeof p.title === 'string') return p.title;
    if (typeof p === 'string') return p;
  } catch {}
  return c;
};

/** Real self message kế thừa ordering + timestamp client từ temp khớp. */
function inheritTempOrdering(message: MessageItem, temp?: MessageItem): MessageItem {
  if (!temp) return message;
  return {
    ...message,
    send_seq: temp.send_seq,
    timestamp: temp.timestamp,
  };
}

/**
 * Merge 1 message vào mảng hiện có (pure, trả mảng mới).
 *
 * - Dedup theo msg_id (giữ các nhánh merge quote_data/attachments/handled_by_employee).
 * - Real self message (is_sent=1, không phải temp): thay temp khớp
 *   (Strategy 1: real_msg_id; Strategy 2: content — chỉ xoá 1 temp đầu tiên),
 *   kế thừa send_seq + timestamp của temp.
 * - Luôn sort theo (timestamp, send_seq).
 */
export function mergeMessage(existing: MessageItem[], message: MessageItem): MessageItem[] {
  // ── Dedup by msg_id ────────────────────────────────────────────────────
  const dupIdx = existing.findIndex((m) => String(m.msg_id) === String(message.msg_id));
  if (dupIdx >= 0) {
    const existingMsg = existing[dupIdx];
    if (message.handled_by_employee && !existingMsg.handled_by_employee) {
      const merged = { ...existingMsg, handled_by_employee: message.handled_by_employee };
      const newMessages = [...existing];
      newMessages[dupIdx] = merged;
      return newMessages;
    }
    if (message.quote_data && !existingMsg.quote_data) {
      const merged = { ...existingMsg, quote_data: message.quote_data };
      const newMessages = [...existing];
      newMessages[dupIdx] = merged;
      return newMessages;
    }
    const existingAttachments = existingMsg.attachments ? (typeof existingMsg.attachments === 'string' ? existingMsg.attachments : JSON.stringify(existingMsg.attachments)) : '';
    const newAttachments = message.attachments ? (typeof message.attachments === 'string' ? message.attachments : JSON.stringify(message.attachments)) : '';
    const existingHasAttachments = existingAttachments && existingAttachments !== '[]' && existingAttachments !== '""';
    const newHasAttachments = newAttachments && newAttachments !== '[]' && newAttachments !== '""';
    const needsMerge = (newHasAttachments && !existingHasAttachments) || (message.msg_type && message.msg_type !== existingMsg.msg_type);
    if (needsMerge) {
      const merged = {
        ...existingMsg,
        ...(newHasAttachments ? { attachments: message.attachments, local_paths: message.local_paths || existingMsg.local_paths } : {}),
        ...(message.msg_type && message.msg_type !== existingMsg.msg_type ? { msg_type: message.msg_type } : {}),
      };
      const newMessages = [...existing];
      newMessages[dupIdx] = merged;
      return newMessages;
    }
    return existing;
  }

  // ── Real self message → thay temp khớp ────────────────────────────────
  let filtered = existing;
  let replacement = message;
  if (message.is_sent === 1 && !message.msg_id.startsWith('temp_')) {
    const incomingMsgId = String(message.msg_id);
    const incomingText = extractDedupText(message.content);

    // Strategy 1: match bằng real_msg_id
    const matchedByRealId = existing.find(
      (m) => m.msg_id.startsWith('temp_') && m.is_sent === 1 && m.real_msg_id === incomingMsgId
    );
    if (matchedByRealId) {
      filtered = existing.filter((m) => m !== matchedByRealId);
      replacement = inheritTempOrdering(message, matchedByRealId);
      // TEMP-DIAG: real echo matched by real_msg_id
      console.log(`[MSGORDER] REAL-byRealId msgId=${incomingMsgId} tempSeq=${matchedByRealId.send_seq} tempTs=${matchedByRealId.timestamp} newTs=${message.timestamp}`);
    } else {
      // Strategy 2 (fallback): match bằng content — chỉ xoá 1 temp khớp ĐẦU TIÊN
      const matchIdx = existing.findIndex(
        (m) => m.msg_id.startsWith('temp_') && m.is_sent === 1 && extractDedupText(m.content) === incomingText
      );
      if (matchIdx >= 0) {
        const matchedTemp = existing[matchIdx];
        filtered = existing.filter((_, i) => i !== matchIdx);
        replacement = inheritTempOrdering(message, matchedTemp);
        // TEMP-DIAG: real echo matched by content (may be ambiguous for identical text)
        console.log(`[MSGORDER] REAL-byContent msgId=${incomingMsgId} tempIdx=${matchIdx} tempSeq=${matchedTemp.send_seq} tempTs=${matchedTemp.timestamp} newTs=${message.timestamp} tempCount=${existing.filter(m => m.msg_id?.startsWith?.('temp_')).length}`);
      } else {
        // TEMP-DIAG: real echo NOT matched → append + res-sort
        console.log(`[MSGORDER] REAL-NOT-MATCHED msgId=${incomingMsgId} ts=${message.timestamp} pendingTemps=${existing.filter(m => m.msg_id?.startsWith?.('temp_') && m.is_sent === 1).length}`);
      }
    }
  }

  const updated = [...filtered, replacement];
  return updated.sort(sortMessages);
}
