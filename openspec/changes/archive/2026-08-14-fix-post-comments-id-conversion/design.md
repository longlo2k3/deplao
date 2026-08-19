# Design: Fix post comments ID conversion

## Problem

`CommentsListComponentsPaginationQuery` yêu cầu `variables.id` là **relay feedback ID** (`feedback:<numeric>` encode base64). ID thô (số) resolve ra node `Post`/`GroupPost` không chứa `comment_rendering_instance_for_feed_location` → 0 items, không có lỗi.

## Solution

### Helper `toRelayFeedbackId(input: string): string`

```
function toRelayFeedbackId(input: string): string {
  const trimmed = input.trim();
  // Đã là relay ID (chứa ':') hoặc base64 (có ký tự không phải số) → giữ nguyên
  if (!/^\d+(_\d+)?$/.test(trimmed)) return trimmed;
  // feedback:<id> encode base64
  return Buffer.from(`feedback:${trimmed}`).toString('base64');
}
```

- `/^\d+$/` → post ID thô → convert
- `/^\d+_\d+$/` → group post feedback (postId_commentId) → convert
- còn lại (có `:`, base64, URL đã extract) → giữ nguyên

### Luồng `scanPostComments`

1. `const relayId = toRelayFeedbackId(feedbackTargetID)`
2. Gọi GraphQL với `variables.id = relayId` (mặc định dùng relay id — đúng cho mọi case đã verify)
3. Retry nếu cần: nếu response node `__typename` là `Post`/`GroupPost` và items=0 → thử convert theo hướng ngược lại (nếu input thô → đã dùng relay rồi nên không cần; nếu input là base64 → thử input thô) — **tối giản**: luôn dùng relay id ngay từ đầu (đã verify hoạt động cho cả post thường, group post, post zuck).

### Luồng `scanPostCommentsBatch`

Mỗi id trong `postIds` → `toRelayFeedbackId(id)` → `scanPostComments`.

### Files

- `src/services/facebook/FacebookScanService.ts`:
  - Thêm helper `toRelayFeedbackId` (module-level, cạnh `fbCookieKey`)
  - `scanPostComments` (1674): convert `feedbackTargetID` trước khi build `variables.id`
  - `scanPostCommentsBatch` (2071): convert từng id
- Không đổi IPC/UI/type.

## Verification

- Script electron `debug-user-post.js`:
  - raw `2517468658747082` → mong đợi 2 items (hiện tại 0)
  - base64 feedback zuck → vẫn 10 items (không regress)
  - base64 `feedback:2517468658747082` → 2 items (giữ nguyên)
- `tsc -p tsconfig.electron.json --noEmit` 0 lỗi