# outgoing-order

## ADDED Requirements

### Requirement: Gửi đi nhanh giữ nguyên thứ tự hiển thị

Khi người dùng gửi nhiều tin nhắn đi liên tiếp (cùng thread, bất kỳ kênh nào), danh sách tin nhắn trong store SHALL hiển thị chúng **theo thứ tự người dùng tạo/gửi**, không phải theo thứ tự echo trả về hoặc timestamp trùng nhau.

#### Scenario: Gửi nhanh 2 tin, echo trả về ngược thứ tự

```
Given thread có 0 tin, người dùng gửi A rồi gửi B (A trước B)
And echo của B đến store trước echo của A
When cả hai echo được merge vào store
Then thứ tự hiển thị là A rồi đến B
```

#### Scenario: Gửi 3 tin nhanh cùng timestamp server

```
Given người dùng gửi A, B, C trong cùng vài mili-giây (server ts giống nhau)
When cả 3 real message được thêm vào store
Then thứ tự hiển thị vẫn là A, B, C theo đúng thứ tự gửi
```

### Requirement: Echo real kế thừa thứ tự của temp

Khi một real message (is_sent=1) khớp với temp message (qua `real_msg_id` hoặc content), message thay thế SHALL giữ key ordering (`send_seq`) và timestamp client của temp gốc, để bubble không dịch chuyển vị trí trong luồng hội thoại.

#### Scenario: Real echo thay thế temp

```
Given temp T có timestamp client = T_client, send_seq = 5
When real message R (timestamp server ≠ T_client) được addMessage và khớp với T
Then R giữ timestamp = T_client và send_seq = 5
And bubble hiển thị đúng vị trí cũ của T
```

### Requirement: Sort luôn có tiebreaker

Mọi thao tác sắp xếp mảng tin nhắn trong store (`addMessage`, `prependMessages`) SHALL sắp theo `timestamp ASC`, và khi timestamp bằng nhau sắp theo `send_seq ASC` (tin không có `send_seq` xếp sau tin có).

#### Scenario: Timestamp bằng nhau nhưng send_seq khác

```
Given tin A (ts=100, send_seq=1) và tin B (ts=100, send_seq=2) cùng trong mảng
When mảng được sort
Then A đứng trước B
```

### Requirement: Content-match chỉ xoá 1 temp

Khi real self message fallback khớp bằng nội dung (không có `real_msg_id`), nó SHALL xoá **đúng một** temp khớp sớm nhất trong mảng, không xoá toàn bộ các temp trùng nội dung.

#### Scenario: Gửi 2 tin trùng text, echo lần lượt

```
Given temp A và temp B cùng nội dung "xin chào"
When echo real 1 "xin chào" được addMessage (fallback content match)
Then chỉ temp A (đầu tiên) bị xoá, temp B vẫn hiển thị
And echo real 2 "xin chào" đến sau đó
Then temp B được thay thế, không còn bubble trùng
```
