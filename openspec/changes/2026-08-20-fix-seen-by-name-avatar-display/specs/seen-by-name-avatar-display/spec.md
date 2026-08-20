# seen-by-name-avatar-display

## ADDED Requirements

### Requirement: Resolve tên người đã xem từ contact/member, không hiển thị raw id/UUID

UI SHALL resolve tên người xem theo thứ tự: (1) contact `alias`, (2) contact `display_name` hoặc group member `displayName` nếu là tên hợp lệ (khác uid và không phải chuỗi số thuần), (3) tên thân thiện theo channel (`getFriendlyUserName`). UI SHALL NOT hiển thị raw `uid`/`seenUids[0]`/`activeThreadId` làm tên.

#### Scenario: Nhóm — người xem có trong contact list (bản đầy đủ)

```
Given seenUids=["12345"], contactList chứa contact_id="12345" display_name="Nguyễn Văn A"
When render dòng "Tên: Đã xem"
Then hiển thị "Nguyễn Văn A: Đã xem" (không phải "12345: Đã xem")
```

#### Scenario: Nhóm — người xem là thành viên group

```
Given seenUids=["987"], contact không có nhưng group member userId="987" displayName="Minh"
When render dòng "Tên: Đã xem"
Then hiển thị "Minh: Đã xem"
```

#### Scenario: Không resolve được tên

```
Given seenUids=["abc-123"], không tìm thấy contact/member, channel=zalo
When render
Then hiển thị "Người dùng" (không phải "abc-123")
```

#### Scenario: 1-1 — tick seen không có contact của người xem

```
Given mở chat 1-1, seenUids=["uuid-x"], viewer contact không có display_name
When render avatar seen
Then title "Đã xem bởi Người dùng" (không phải "Đã xem bởi uuid-x")
```

### Requirement: Avatar người đã xem chỉ fallback bằng chữ cái đầu của tên hợp lệ

Khi người xem chưa có ảnh, UI SHALL hiển thị vòng tròn chứa ký tự đầu (viết hoa) của tên đã resolve (không phải ký tự đầu của uid). Mọi ảnh avatar SHALL được bọc qua `toLocalMediaUrl` trước khi set `src`.

#### Scenario: Avatar fallback khi không có ảnh

```
Given seenUids=["u123"], resolve được tên "Nguyễn Văn A", không có avatar_url
When render avatar stack / tick seen / bottom bar
Then hiển thị vòng tròn chữ "N" (không phải "u")
```

#### Scenario: Ảnh avatar path local luôn đi qua toLocalMediaUrl

```
Given member.avatar = "D:\\....\\avatar.jpg" (path local)
When render bottom bar "Đã xem"
Then src = toLocalMediaUrl(member.avatar) (tải được, không rơi xuống fallback ký tự)
```