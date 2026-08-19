# fb-e2ee-sync-status

## ADDED Requirements

### Requirement: Expose fb:onE2EEStatus qua preload

Event `fb:onE2EEStatus` SHALL be in preload whitelist để renderer nhận được trạng thái E2EE thay đổi theo thời gian thực.

#### Scenario: Bridge E2EE connect thành công

```
Given bridge E2EE emit fb:onE2EEStatus {status:"connected"}
When preload whitelist có fb:onE2EEStatus
Then useChatEvents nhận event và cập nhật store e2eeStatus="connected"
```

### Requirement: Expose fb.getE2EEStatus + fb.retryE2EE invoke

Preload SHALL expose `fb.getE2EEStatus({accountId})` và `fb.retryE2EE({accountId})` cho renderer.

#### Scenario: UI hỏi trạng thái lúc mount

```
Given AccountCard mount cho account FB
When gọi ipc.fb.getE2EEStatus({accountId})
Then trả về {status, connected, available} từ service
```

#### Scenario: User bấm "Đồng bộ lại"

```
Given user bấm nút "Đồng bộ lại"
When gọi ipc.fb.retryE2EE({accountId})
Then service.retryE2EE() chạy (restart bridge, không đụng MQTT) và trả success
```

### Requirement: IPC fb:retryE2EE

Handler `fb:retryE2EE` SHALL call `service.retryE2EE()` và trả `{success}` hoặc `{success:false, error}`.

#### Scenario: Bridge đang lỗi

```
Given service.retryE2EE() throw lỗi
When gọi fb:retryE2EE
Then trả {success:false, error:"..."} và UI hiển thị lỗi
```

### Requirement: AccountCard hiển thị trạng thái E2EE

AccountCard cho account Facebook SHALL hiển thị badge E2EE theo `e2eeStatus`: connected → "E2EE đã kết nối" (xanh), connecting → "Đang đồng bộ…" (vàng pulse), error → "E2EE lỗi" (đỏ), disconnected → "E2EE chưa kết nối" (xám).

#### Scenario: E2EE connected

```
Given store e2eeStatus="connected" cho account FB
When AccountCard render
Then hiển thị badge xanh "🔒 E2EE đã kết nối"
```

#### Scenario: E2EE error

```
Given store e2eeStatus="error"
When AccountCard render
Then hiển thị badge đỏ "E2EE lỗi" kèm nút retry
```

### Requirement: Nút "Đồng bộ lại" + làm rõ không có PIN

AccountCard SHALL hiển thị nút "Đồng bộ lại" (gọi retryE2EE) và text giải thích "Đồng bộ tự động — không cần mã PIN".

#### Scenario: Bấm nút khi E2EE chưa kết nối

```
Given badge E2EE disconnected/xám
When bấm "Đồng bộ lại"
Then gọi fb.retryE2EE, hiển thị spinner trong lúc chạy, badge chuyển connecting → connected
```

#### Scenario: Tooltip giải thích

```
Given user hover badge E2EE
Then hiển thị "Tin nhắn E2EE đồng bộ tự động qua thiết bị đã lưu — không cần mã PIN"
```