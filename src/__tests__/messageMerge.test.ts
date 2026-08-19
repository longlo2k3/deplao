import { assignSendSeq, mergeMessage, sortMessages } from '@/lib/chat/messageMerge';
import type { MessageItem } from '@/store/chatStore';

const base = (over: Partial<MessageItem>): MessageItem => ({
  msg_id: 'm1',
  owner_zalo_id: '1',
  thread_id: 't1',
  thread_type: 0,
  sender_id: '1',
  content: 'hello',
  msg_type: 'text',
  timestamp: 1000,
  is_sent: 1,
  status: 'sending',
  ...over,
});

describe('assignSendSeq', () => {
  it('assigns incremental seq to outgoing temp messages', () => {
    let seq = 0;
    const { msg: a, next } = assignSendSeq(base({ msg_id: 'temp_1' }), seq);
    expect(a.send_seq).toBe(0);
    const { msg: b, next: next2 } = assignSendSeq(base({ msg_id: 'temp_2' }), next);
    expect(b.send_seq).toBe(1);
    expect(next2).toBe(2);
  });

  it('does not assign seq to real or incoming messages', () => {
    const real = assignSendSeq(base({ msg_id: 'real_1' }), 0);
    expect(real.msg.send_seq).toBeUndefined();
    const incoming = assignSendSeq(base({ msg_id: 'temp_1', is_sent: 0 }), 0);
    expect(incoming.msg.send_seq).toBeUndefined();
  });

  it('does not overwrite existing seq', () => {
    const { msg } = assignSendSeq(base({ msg_id: 'temp_1', send_seq: 7 }), 0);
    expect(msg.send_seq).toBe(7);
  });
});

describe('sortMessages', () => {
  it('sorts by timestamp', () => {
    const list = [base({ timestamp: 200 }), base({ timestamp: 100 }), base({ timestamp: 150 })];
    expect(list.sort(sortMessages).map(m => m.timestamp)).toEqual([100, 150, 200]);
  });

  it('uses send_seq as tiebreaker when timestamps equal', () => {
    const list = [
      base({ msg_id: 'B', timestamp: 100, send_seq: 2 }),
      base({ msg_id: 'A', timestamp: 100, send_seq: 1 }),
    ];
    expect(list.sort(sortMessages).map(m => m.msg_id)).toEqual(['A', 'B']);
  });

  it('messages without send_seq sort after messages with same timestamp + seq', () => {
    const list = [
      base({ msg_id: 'noSeq', timestamp: 100 }),
      base({ msg_id: 'withSeq', timestamp: 100, send_seq: 1 }),
    ];
    expect(list.sort(sortMessages).map(m => m.msg_id)).toEqual(['withSeq', 'noSeq']);
  });
});

describe('mergeMessage — outgoing ordering', () => {
  it('keeps send order even when real echoes arrive out of order', () => {
    // Gửi A trước, B sau → temp A(seq 0), temp B(seq 1)
    let seq = 0;
    const { msg: tempA, next: n1 } = assignSendSeq(base({ msg_id: 'temp_A', content: 'AAA', timestamp: 1000 }), seq);
    const { msg: tempB, next: n2 } = assignSendSeq(base({ msg_id: 'temp_B', content: 'BBB', timestamp: 1001 }), n1);
    seq = n2;

    let list = mergeMessage([], tempA);
    list = mergeMessage(list, tempB);
    expect(list.map(m => m.msg_id)).toEqual(['temp_A', 'temp_B']);

    // Echo của B đến trước (real ts server bằng nhau: 1000)
    const realB = base({ msg_id: 'real_B', content: 'BBB', is_sent: 1, timestamp: 1000, send_status: 'sent' });
    list = mergeMessage(list, realB);
    expect(list.map(m => m.msg_id)).toEqual(['temp_A', 'real_B']);
    expect(list[1].send_seq).toBe(1);

    // Echo của A đến sau
    const realA = base({ msg_id: 'real_A', content: 'AAA', is_sent: 1, timestamp: 1000, send_status: 'sent' });
    list = mergeMessage(list, realA);
    expect(list.map(m => m.msg_id)).toEqual(['real_A', 'real_B']);
  });

  it('carries temp send_seq and client timestamp onto the real message', () => {
    const temp = base({ msg_id: 'temp_X', content: 'X', timestamp: 5000, send_seq: 3 });
    let list = mergeMessage([], temp);
    const real = base({ msg_id: 'real_X', content: 'X', is_sent: 1, timestamp: 9999, send_status: 'sent' });
    list = mergeMessage(list, real);
    expect(list[0].msg_id).toBe('real_X');
    expect(list[0].send_seq).toBe(3);
    expect(list[0].timestamp).toBe(5000);
  });

  it('removes only the first matching temp when content matches (identical text)', () => {
    const t1 = base({ msg_id: 'temp_1', content: 'xin chào', timestamp: 1000, send_seq: 0 });
    const t2 = base({ msg_id: 'temp_2', content: 'xin chào', timestamp: 1001, send_seq: 1 });
    let list = mergeMessage([], t1);
    list = mergeMessage(list, t2);
    expect(list.length).toBe(2);

    // Echo 1 xoá đúng 1 temp đầu tiên (real_1 thay temp_1, giữ vị trí ts 1000)
    const r1 = base({ msg_id: 'real_1', content: 'xin chào', is_sent: 1, timestamp: 1000, send_status: 'sent' });
    list = mergeMessage(list, r1);
    expect(list.length).toBe(2);
    expect(list.map(m => m.msg_id)).toEqual(['real_1', 'temp_2']);

    // Echo 2 thay nốt temp còn lại
    const r2 = base({ msg_id: 'real_2', content: 'xin chào', is_sent: 1, timestamp: 1001, send_status: 'sent' });
    list = mergeMessage(list, r2);
    expect(list.length).toBe(2);
    expect(list.map(m => m.msg_id)).toEqual(['real_1', 'real_2']);
  });

  it('replaces temp by real_msg_id when available', () => {
    const temp = base({ msg_id: 'temp_Y', content: 'Y', timestamp: 2000, send_seq: 1, real_msg_id: 'api_1' });
    let list = mergeMessage([], temp);
    const real = base({ msg_id: 'api_1', content: 'Y', is_sent: 1, timestamp: 2000, send_status: 'sent' });
    list = mergeMessage(list, real);
    expect(list.map(m => m.msg_id)).toEqual(['api_1']);
    expect(list[0].send_seq).toBe(1);
  });

  it('deduplicates by msg_id (duplicate real returns unchanged list)', () => {
    const real = base({ msg_id: 'real_dup', content: 'D', is_sent: 1, timestamp: 3000 });
    const list = mergeMessage([real], { ...real });
    expect(list.length).toBe(1);
  });
});
