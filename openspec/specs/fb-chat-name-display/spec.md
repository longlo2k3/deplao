# fb-chat-name-display Specification

## Purpose
TBD - created by archiving change fb-chat-name-avatar-display. Update Purpose after archive.
## Requirements
### Requirement: Fallback tên không hiển thị UID

Trong khung chat, khi không có tên contact/member/sender, UI SHALL hiển thị tên thân thiện theo channel (`getFriendlyUserName`: FB → "Người dùng Facebook", Telegram → "Người dùng Telegram", khác → "Người dùng") thay vì UID/contact_id/sender_id. Áp dụng: bubble sender name (ChatWindow 2762), header chat (ChatHeader 599), conversation info (ConversationInfo 86), group member list (GroupInfoPanel 1189/1226).

#### Scenario: Bubble tin nhắn group FB từ sender chưa có tên

```
Given contact và group member đều không có display_name, channel=facebook
When render bubble
Then tên hiển thị là "Người dùng Facebook" (không phải số UID)
```

#### Scenario: Header chat 1-1 FB chưa có tên

```
Given mở chat 1-1 FB với contact display_name rỗng
When ChatHeader render
Then hiển thị "Người dùng Facebook" (không phải activeThreadId)
```

#### Scenario: Group info panel thành viên thiếu tên

```
Given thành viên group FB có displayName rỗng
When GroupInfoPanel render
Then hiển thị "Thành viên" (không phải userId)
```

### Requirement: Enrich tên/avatar cho chat 1-1 FB

Effect fetch sender info (ChatWindow 1273) SHALL chạy cả cho chat 1-1 Facebook khi contact display_name rỗng: gọi `fb:getUserInfoFacebookHtml` cho sender, cập nhật contact store + DB (`updateContactProfile`).

#### Scenario: Mở chat 1-1 FB với contact rỗng tên

```
Given mở chat 1-1 FB, contact có display_name=""
When effect chạy
Then gọi getUserInfoFacebookHtml(senderId) và updateContact display_name/avatar_url
```

#### Scenario: Sender đã có đủ tên + avatar

```
Given contact có display_name hợp lệ + avatar_url
When effect chạy
Then bỏ qua (không fetch lại)
```

### Requirement: Fallback từ tên trong tin nhắn

Khi hiển thị tên người gửi, UI SHALL dùng `msg.sender_name` (nếu tồn tại và không phải chuỗi số thuần) trước tên thân thiện mặc định.

#### Scenario: Tin nhắn có sender_name hợp lệ

```
Given msg.sender_name="Nguyễn Văn A" và contact không có tên
When render bubble
Then hiển thị "Nguyễn Văn A"
```

#### Scenario: sender_name là số (UID)

```
Given msg.sender_name="61575399695977"
When render bubble
Then bỏ qua sender_name, hiển thị tên thân thiện theo channel
```

