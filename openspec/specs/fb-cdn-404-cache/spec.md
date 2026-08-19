# fb-cdn-404-cache Specification

## Purpose
TBD - created by archiving change fb-cdn-404-cache. Update Purpose after archive.
## Requirements
### Requirement: Negative cache cho CDN 404

`tryFetchCdnRedirect` SHALL cache userId có kết quả 404 trong 30 phút (module-level Map `cdnFailCache`); khi cache còn hiệu lực, trả `null` ngay không gửi request và không log.

#### Scenario: CDN trả 404

```
Given HEAD /picture trả status 404 cho userId X
When tryFetchCdnRedirect(X) được gọi lần sau trong 30 phút
Then trả null ngay, không request, không log
```

#### Scenario: Network error tạm thời

```
Given request fail do timeout (không phải 404)
When tryFetchCdnRedirect gọi lại sau 1 phút
Then vẫn thử request lại (không cache lỗi tạm thời)
```

### Requirement: Log 404 chỉ một lần

Khi phát hiện 404 lần đầu cho một userId, hệ thống SHALL log debug đúng 1 dòng; các lần sau trong window cache không log.

#### Scenario: Spam log chấm dứt

```
Given user X 404 liên tục
When nhận 10 tin nhắn từ X
Then chỉ 1 dòng log 404 (lần đầu), không spam
```

