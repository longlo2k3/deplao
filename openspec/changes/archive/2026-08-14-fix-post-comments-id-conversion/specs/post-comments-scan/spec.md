# post-comments-scan

## ADDED Requirements

### Requirement: Chấp nhận post ID thô

Khi người dùng truyền vào post ID là số thuần (vd `2517468658747082`), `scanPostComments` SHALL convert to relay feedback ID = base64(`feedback:<postId>`) trước khi gửi GraphQL request.

#### Scenario: Group post có bình luận

```
Given post id "2517468658747082" (bài trong group, có 2 bình luận)
When quét bình luận
Then trả về 2 items với commentId, authorName, body
```

### Requirement: Chấp nhận group post feedback ID

ID dạng `123_456` (postId_commentId của GroupPost) SHALL be converted to relay feedback ID = base64(`feedback:123_456`).

#### Scenario: Group post feedback ID có bình luận

```
Given feedback id "2517468658747082_2517498475410767"
When quét bình luận
Then request dùng base64("feedback:2517468658747082_2517498475410767") và trả về comments nếu có
```

### Requirement: Giữ nguyên ID đã là relay

ID chứa `:` (relay ID như `feedback:...`, `comment:...`) hoặc đã encode base64 SHALL be used as-is without conversion.

#### Scenario: ID base64 feedback giữ nguyên

```
Given id "ZmVlZGJhY2s6MTAxMTcwMjU4NDcwMTI5MDE=" (= feedback:10117025847012901)
When quét bình luận
Then dùng nguyên ID, trả về comments (10 items post zuck)
```

### Requirement: Tự retry khi node không phải Feedback

Khi request với ID thô trả về node `Post`/`GroupPost` (0 items), service SHALL retry once với relay feedback ID trước khi trả kết quả cuối.

#### Scenario: ID thô GroupPost retry thành công

```
Given post id "2517468658747082" gọi với ID thô trả node GroupPost không có comments
When kết quả items=0 và node không phải Feedback
Then retry 1 lần với base64("feedback:2517468658747082") → 2 items
```

### Requirement: Batch áp dụng cùng conversion

`scanPostCommentsBatch` SHALL convert each ID (theo các rule trên) trước khi gọi `scanPostComments`.

#### Scenario: Batch với nhiều dạng ID

```
Given postIds = ["2517468658747082", "ZmVlZGJhY2s6MTAxMTcwMjU4NDcwMTI5MDE="]
When quét batch
Then mỗi ID convert đúng dạng và trả items gộp
```

### Requirement: Post không có bình luận không phải lỗi

Post id hợp lệ nhưng chưa có bình luận SHALL return success=true, items=[] (không phải error).

#### Scenario: Post không comment

```
Given post id hợp lệ không có bình luận
When quét bình luận
Then success=true, items=[]
```