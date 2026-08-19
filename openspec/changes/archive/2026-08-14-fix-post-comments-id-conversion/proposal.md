## Why

Tab "Quét bình luận bài viết" không quét được bình luận khi người dùng nhập post ID thô (ví dụ `2517468658747082`). Đã tái hiện: `scanPostComments` với ID thô trả về `success=true, items=0` vì GraphQL query `CommentsListComponentsPaginationQuery` chỉ trả comments khi `id` là **relay feedback ID** (`feedback:<postId>` dạng base64). Với ID thô, FB trả node `GroupPost`/`Post` không có `comment_rendering_instance_for_feed_location` → 0 bình luận → UI hiển thị "Chưa có dữ liệu" mà không có lỗi.

## What Changes

- `FacebookScanService.scanPostComments`: tự chuyển đổi ID đầu vào sang relay feedback ID trước khi gửi GraphQL:
  - ID thuần số (vd `2517468658747082`) → base64(`feedback:<id>`)
  - ID dạng `123_456` (group post feedback) → base64(`feedback:123_456`)
  - ID đã là relay/base64 (chứa `:` hoặc ký tự base64) → dùng nguyên
- `FacebookScanService.scanPostCommentsBatch`: áp dụng cùng conversion cho từng ID
- Nếu response node không phải `Feedback` (vẫn 0 items) → tự retry 1 lần với relay feedback ID
- Không thay đổi API IPC/UI — fix nằm trong service layer

## Capabilities

### New Capabilities
- `post-comments-scan`: Quét bình luận bài viết Facebook từ post ID thô, tự xử lý chuyển đổi relay feedback ID

### Modified Capabilities
<!-- none - chưa có openspec/specs chính thức nào -->

## Impact

- `src/services/facebook/FacebookScanService.ts`: `scanPostComments` (1674), `scanPostCommentsBatch` (2071)
- Không ảnh hưởng IPC handlers, UI, hay các scan type khác
- Test verify: script electron debug với post `2517468658747082` (group post, 2 comments) và post zuck base64 (10 comments)
