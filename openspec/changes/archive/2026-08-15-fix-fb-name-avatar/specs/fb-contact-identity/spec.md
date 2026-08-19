# fb-contact-identity

## ADDED Requirements

### Requirement: Persist participant info từ GraphQL thread list

Khi `getThreadList`/`saveFBThreads` chạy, mọi participant `messaging_actor` trong `parseThreadNodes` SHALL be upserted vào bảng `contacts` với `owner_zalo_id = facebook_id` (numeric) và `channel='facebook'`.

#### Scenario: Thread list chứa participant chưa có contact

```
Given getThreadList trả 3 participants (id, name, big_image_src.uri)
When saveFBThreads chạy
Then contacts có 3 row mới với owner_zalo_id = "100056964890740", display_name = name, avatar_url = uri
```

#### Scenario: Participant đã có contact không bị ghi đè tên

```
Given participant đã có contact với display_name đầy đủ
When saveFBThreads chạy lại
Then display_name giữ nguyên nếu khác, không bị ghi rỗng
```

### Requirement: FB group members vào group cache UI

Chat window FB SHALL load + lưu group members vào `page_group_member` (owner = facebook_id) và hiển thị tên/avatar thành viên thay vì UID.

#### Scenario: Mở chat group FB có members trong DB

```
Given thread group "Box NRO" có page_group_member đã lưu (owner=fbId)
When mở chat
Then bubble hiển thị displayName của từng sender thay vì UID
```

### Requirement: IPC fb:getUserInfoFacebookHtml dùng đúng owner key

Handler SHALL use `owner_zalo_id = facebook_id` (numeric, từ DB account) cho cả INSERT và UPDATE contacts.

#### Scenario: UI fetch info sender lạ

```
Given accountId uuid "f20f9ce2..." có facebook_id "100056964890740"
When ipc.fb.getUserInfoFacebookHtml({accountId, userId:"12345"})
Then contacts row có owner_zalo_id="100056964890740" (không phải UUID)
Then UI lookup bằng numeric id tìm được row này
```

### Requirement: Contact lookup filter theo owner

Mọi lookup/update contact của FB service (checkAndFetchUserInfo, saveFBMessage) SHALL include `AND owner_zalo_id = ?` để không lấy nhầm contact của account khác.

#### Scenario: Hai account có chung contact id

```
Given account A và B cùng có contact_id "12345" với tên khác nhau
When account B nhận message từ "12345"
Then tên hiển thị là tên trong account B, không phải account A
```

### Requirement: Scraper tên/avatar đáng tin

`getUserInfoFacebookHtml` SHALL parse tên từ `og:title` trước (strip suffix " | Facebook"), avatar theo thứ tự: img 168px → profile_pic_uri → CDN /picture → mbasic.

#### Scenario: Profile page không có h1, có og:title

```
Given HTML có <meta property="og:title" content="Nguyễn Văn A | Facebook">
When getUserInfoFacebookHtml("...", "12345")
Then name = "Nguyễn Văn A" (không phải tên user đang login)
```

### Requirement: Enrichment UI không failure-sticky

Khi fetch sender info thất bại, `requestedMemberInfoRef` SHALL be cleared (finally) để có thể retry; `updateContactProfile` SHALL dùng owner key facebook_id.

#### Scenario: Scrape fail tạm thời rồi thành công

```
Given lần đầu getUserInfoFacebookHtml fail (timeout)
When nhận tin nhắn mới từ cùng sender
Then hệ thống fetch lại (không bị chặn vĩnh viễn bởi requestedMemberInfoRef)
```

### Requirement: E2EE senderId=0 không fetch garbage

Khi bridge gửi senderID=0 (JID không numeric, vd `4:...` page agent), TS SHALL skip fetch profile và hiển thị participant info từ thread nếu có.

#### Scenario: Tin nhắn từ page agent JID

```
Given E2EE message có e.Info.Sender.User = "4:123"
When handleE2EEMessage xử lý
Then không fetch profile user "0"; tên hiển thị từ thread participant nếu có, ngược lại để rỗng tạm
```

### Requirement: parseThreadNodes expose participants

`parseThreadNodes` SHALL include participant list (id, name, avatar) trong output để caller persist.

#### Scenario: Thread group có 5 participants

```
Given thread group có 5 edges all_participants
When parseThreadNodes chạy
Then output chứa danh sách 5 participants kèm name + avatar uri
```