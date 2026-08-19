# Design: fb-message-status-ticks

## 1. DatabaseService.markFBThreadDelivered (mới, cạnh markFBThreadSeen ~3250)

```ts
public markFBThreadDelivered(ownerZaloId: string, threadId: string, watermarkTs: number): void {
  if (!this.initialized || !threadId || !ownerZaloId) return;
  try {
    const threadIdRaw = String(threadId).replace(/@.*$/, '');
    const ts = watermarkTs || Date.now();
    const now = Date.now();
    this.run(
      `UPDATE messages SET delivered_at = ?
       WHERE owner_zalo_id = ? AND thread_id = ? AND timestamp <= ?
         AND sender_id = ? AND is_sent = 1 AND channel = 'facebook'
         AND delivered_at IS NULL AND is_seen = 0`,
      [now, ownerZaloId, threadIdRaw, ts, ownerZaloId]
    );
  } catch (error: any) {
    Logger.error(`[DatabaseService] markFBThreadDelivered error: ${error.message}`);
  }
}
```

## 2. markFBThreadSeen — COALESCE delivered_at (3243)

`delivered_at = ?` → `delivered_at = COALESCE(delivered_at, ?)` (param [now, now, ...] → [now, now, now?]) — params: `[now, now, JSON.stringify(merged), row.msg_id, ownerZaloId]` → `[now, now, now, JSON.stringify(merged), row.msg_id, ownerZaloId]`.

## 3. FacebookService.handleDeliveryReceipt (874-887)

```ts
private handleDeliveryReceipt(data: any): void {
  if (!data?.threadId || !data?.actorFbId) return;
  if (data.actorFbId === this.getFacebookId()) return;
  const fbId = this.getFacebookId();
  const watermark = data.timestampMs || Date.now();
  try {
    DatabaseService.getInstance().markFBThreadDelivered(fbId, String(data.threadId), watermark);
  } catch (err: any) {
    Logger.warn(`[FacebookService:${this.accountId}] markFBThreadDelivered error: ${err.message}`);
  }
  EventBroadcaster.emit('fb:onDelivered', {
    fbAccountId: fbId,
    threadId: String(data.threadId),
    timestamp: watermark,
  });
}
```

## 4. FacebookService e2eeReceipt (1261-1264)

```ts
case 'e2eeReceipt': {
  const stripJid = (id: string) => id.replace(/@.*$/, '');
  const threadId = data.chat ? stripJid(String(data.chat)) : '';
  const sender = data.sender ? stripJid(String(data.sender)) : '';
  const fbId = this.getFacebookId();
  if (!threadId || !sender || sender === fbId) break;
  const type = String(data.type || '').toLowerCase();
  const ts = Date.now();
  try {
    const db = DatabaseService.getInstance();
    if (type === 'read') {
      db.markFBThreadSeen(fbId, threadId, ts, sender);
      EventBroadcaster.emit('fb:onReadReceipt', { fbAccountId: fbId, threadId, readerId: sender, timestamp: ts });
    } else if (type === 'delivered') {
      db.markFBThreadDelivered(fbId, threadId, ts);
      EventBroadcaster.emit('fb:onDelivered', { fbAccountId: fbId, threadId, timestamp: ts });
    }
  } catch (err: any) {
    Logger.warn(`[FacebookService:${this.accountId}] e2eeReceipt error: ${err.message}`);
  }
  break;
}
```

Cần verify field names của bridge events (data.chat / data.sender / data.type) — xem `src/bridge-e2ee/bridge/events.go`.

## 5. UI — useChatEvents (sau fb:onSeen block 489)

```ts
const unsubDelivered = ipc.on?.('fb:onDelivered', (data: {
  fbAccountId: string; threadId: string; timestamp: number;
}) => {
  if (!data?.fbAccountId || !data?.threadId) return;
  useChatStore.getState().markMessageDelivered(data.fbAccountId, String(data.threadId).replace(/@.*$/, ''), '', [], false);
});
if (unsubDelivered) unsubscribers.push(unsubDelivered);
```

## 6. preload whitelist + ipc.ts

- `electron/preload.ts`: thêm `'fb:onDelivered'` vào whitelist.
- `src/ui/lib/ipc.ts`: thêm event type `fb:onDelivered`.

## 7. mediaResolver.getStatusDisplay (302-308)

```ts
if (isFacebook(msg.channel)) {
  if (msg.is_seen === 1 && isSelf) {
    return { text: '✓✓ Đã xem', showCheckmark: true };
  }
  if (msg.is_sent === 1 || isSelf) {
    const delivered = (msg as any).delivered_at;
    return { text: delivered ? '✓✓ Đã nhận' : '✓ Đã gửi', showCheckmark: true };
  }
  return { text: '', showCheckmark: false };
}
```

## Files

| File | Change |
|---|---|
| `src/services/database/DatabaseService.ts` | + markFBThreadDelivered; markFBThreadSeen COALESCE |
| `src/services/facebook/FacebookService.ts` | handleDeliveryReceipt; e2eeReceipt case |
| `src/ui/hooks/useChatEvents.ts` | + fb:onDelivered handler |
| `electron/preload.ts` | whitelist + fb:onDelivered |
| `src/ui/lib/ipc.ts` | event type |
| `src/ui/lib/mediaResolver.ts` | getStatusDisplay FB |

## Verification

- tsc electron + renderer 0 lỗi (trừ GlobalSearchPanel pre-existing)
- Test 1-1: gửi tin FB → đối phương nhận → tick ✓✓ Đã nhận (MQTT delivered); đối phương đọc → ✓✓ Đã xem (e2eeReceipt/bridge read)
- DB: query messages xem delivered_at/is_seen được set riêng
- Không có regression Zalo (markFBThreadSeen tham số cẩn thận)