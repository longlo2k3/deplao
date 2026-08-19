# fb-message-status-ticks Specification

## Purpose
TBD - created by archiving change fb-message-status-ticks. Update Purpose after archive.
## Requirements
### Requirement: Đánh dấu delivered riêng cho Facebook

Hệ thống SHALL có `DatabaseService.markFBThreadDelivered(ownerZaloId, threadId, watermarkTs)`: sweep các tin của owner (is_sent=1, channel facebook, timestamp ≤ watermarkTs, delivered_at IS NULL, is_seen=0) set `delivered_at` — KHÔNG đụng `is_seen`.

#### Scenario: Delivered receipt tới

```
Given tin X (owner đã gửi, delivered_at NULL) và receipt watermark W ≥ timestamp X
When markFBThreadDelivered(owner, thread, W) chạy
Then X.delivered_at được set, is_seen vẫn 0
```

#### Scenario: Tin đã seen không bị chạm

```
Given tin X đã is_seen=1
When markFBThreadDelivered chạy
Then X không thay đổi
```

### Requirement: markFBThreadSeen không xóa delivered_at

`markFBThreadSeen` SHALL giữ nguyên `delivered_at` nếu đã có (dùng COALESCE), không ghi đè thời điểm delivered.

#### Scenario: Seen sau delivered

```
Given tin X có delivered_at = T1
When markFBThreadSeen chạy (seen tại T2 > T1)
Then delivered_at vẫn = T1, is_seen=1, seen_at=T2
```

### Requirement: Xử lý MQTT delivery receipt đúng loại

`handleDeliveryReceipt` SHALL gọi `markFBThreadDelivered` với watermark và emit `fb:onDelivered` — KHÔNG còn emit `fb:onSeen` cho delivered.

#### Scenario: MQTT deliveredReceipt đến

```
Given delta deliveredReceiptMessageId (actor ≠ self)
When handleDeliveryReceipt xử lý
Then markFBThreadDelivered(thread, watermark) được gọi
And emit fb:onDelivered {fbAccountId, threadId, timestamp}
And KHÔNG emit fb:onSeen
```

### Requirement: Xử lý E2EE receipts

`e2eeReceipt` event SHALL parse type: `delivered` → `markFBThreadDelivered` + emit `fb:onDelivered`; `read` → `markFBThreadSeen` + emit `fb:onReadReceipt` (như handleReadReceipt). Bỏ qua receipt của chính mình (sender == own fbId).

#### Scenario: E2EE delivered receipt

```
Given e2eeReceipt {type:'delivered', chat, sender≠self}
When FacebookService xử lý
Then markFBThreadDelivered(thread) + fb:onDelivered
```

#### Scenario: E2EE read receipt

```
Given e2eeReceipt {type:'read', chat, sender≠self}
When FacebookService xử lý
Then markFBThreadSeen(thread, sender) + fb:onReadReceipt
```

#### Scenario: Receipt của chính mình

```
Given e2eeReceipt sender == own fbId
When xử lý
Then bỏ qua hoàn toàn (không DB, không emit)
```

### Requirement: UI cập nhật delivered từ fb:onDelivered

Renderer SHALL nhận `fb:onDelivered` (preload whitelist + ipc.ts type) và gọi `chatStore.markMessageDelivered(fbAccountId, threadId, '', [], false)`.

#### Scenario: fb:onDelivered đến renderer

```
Given event fb:onDelivered {fbAccountId, threadId}
When useChatEvents xử lý
Then chatStore.markMessageDelivered được gọi, message objects có delivered_at
```

### Requirement: File bubbles hiển thị đúng trạng thái FB

`getStatusDisplay` cho Facebook SHALL: `is_seen===1` → "✓✓ Đã xem"; else `delivered_at` → "✓✓ Đã nhận"; else is_sent → "✓ Đã gửi".

#### Scenario: Tin đã xem

```
Given FB message is_seen=1
Then text = "✓✓ Đã xem"
```

#### Scenario: Tin đã nhận chưa đọc

```
Given FB message delivered_at != null, is_seen=0
Then text = "✓✓ Đã nhận"
```

#### Scenario: Tin mới gửi

```
Given FB message is_sent=1, delivered_at null
Then text = "✓ Đã gửi"
```

