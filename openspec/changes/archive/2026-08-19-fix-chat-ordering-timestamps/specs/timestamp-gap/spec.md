# timestamp-gap

## ADDED Requirements

### Requirement: Timestamp chỉ hiện khi có khoảng cách thời gian đủ lớn

Pill thời gian (floating separator) giữa các tin nhắn SHALL chỉ hiển thị khi: tin nhắn là tin đầu tiên trong danh sách, HOẶC chênh lệch `timestamp` với tin kế trước **≥ 5 phút**. Không hiển thị khi chỉ vì đổi chiều gửi/nhận hoặc đổi sender.

#### Scenario: Gửi/nhận xen kẽ trong < 5 phút không hiện timestamp

```
Given tin nhắn A lúc 10:00:00 (gửi), tin B lúc 10:02:00 (nhận), tin C lúc 10:04:00 (gửi)
When renderItem chạy cho từng tin
Then không có pill timestamp nào được hiển thị giữa A-B và B-C
```

#### Scenario: Khoảng cách ≥ 5 phút hiện timestamp

```
Given tin D lúc 10:05:00 và tin E lúc 10:12:00
When renderItem chạy cho tin E
Then pill timestamp của tin E được hiển thị
```

#### Scenario: Tin đầu tiên luôn hiện timestamp

```
Given danh sách tin nhắn có ít nhất 1 tin
When renderItem chạy cho tin đầu tiên
Then pill timestamp của tin đầu tiên được hiển thị
```

### Requirement: Tên người gửi trong group giữ hành vi cũ

Trong group chat (thread_type=1), tên người gửi trên bubble SHALL hiển thị lại khi **đổi sender** giữa 2 tin liên tiếp HOẶC khi có khoảng cách thời gian ≥ 5 phút. Hành vi này độc lập với quy tắc timestamp.

#### Scenario: Đổi người gửi trong group vẫn hiện tên

```
Given group chat, tin từ user X lúc 10:00, tin từ user Y lúc 10:01 (cùng < 5 phút)
When renderItem chạy cho tin của Y
Then hiển thị tên của Y (dù không hiện pill timestamp)
```

#### Scenario: Cùng người gửi liên tiếp không lặp tên

```
Given group chat, tin 1 và tin 2 cùng từ user X trong < 5 phút
When renderItem chạy cho tin 2
Then không lặp lại tên của X (trừ khi có gap ≥ 5 phút)
```
