## Why

Log spam: `[FacebookSession] tryFetchCdnRedirect failed for 100080982064448: Request failed with status code 404` lặp lại nhiều lần/phút. Nguyên nhân: một số user FB không có avatar CDN resolve được (404 vĩnh viễn) nhưng mỗi lần nhận tin nhắn / enrich lại gọi lại HEAD request + fallback, mỗi lần log 2 dòng debug. Vừa spam log vừa lãng phí request.

## What Changes

- **Negative cache 404** trong `FacebookSession.ts`: Map `cdnFailCache` (userId → timestamp). Khi `tryFetchCdnRedirect` nhận 404 → lưu cache 30 phút; trong window đó trả `null` ngay không request, không log.
- Network error (timeout/ECONNRESET...) không cache (tạm thời, cần retry).
- Log 404 chỉ 1 lần (lần đầu phát hiện), các lần sau im lặng.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `facebook-session`: getUserInfoFacebookHtml / avatar fetch không spam request+log khi CDN 404