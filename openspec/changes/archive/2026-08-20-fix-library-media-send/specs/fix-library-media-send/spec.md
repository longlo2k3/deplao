# fix-library-media-send

## ADDED Requirements

### Requirement: Gửi media từ Library theo đúng kênh (Telegram/Facebook/Zalo)

`LibraryPickerModal` SHALL chọn đường gửi theo channel của account: Telegram → `channelIpc.sendAttachment`/`channelIpc.sendVideo`; Facebook → `channelIpc.sendAttachment`/`channelIpc.sendVideo` (lẻ) hoặc `ipc.fb.sendAttachments` (batch ảnh); Zalo → `ipc.zalo.sendImage/sendImages/sendFile` và 3-step video qua `channelIpc.sendVideo('zalo', …)`. UI SHALL NOT gọi `ipc.zalo.*` cho account Facebook hay Telegram.

#### Scenario: Gửi file từ Library sang Facebook (1:1)

```
Given account channel = facebook, chọn 1 file từ Library
When bấm "Gửi"
Then gọi channelIpc.sendAttachment(channel='facebook', filePath=<resolved>) (không gọi ipc.zalo.sendFile)
And message thành công, không hiện "Không thể gửi lại media"
```

#### Scenario: Gửi nhiều ảnh từ Library sang Facebook

```
Given account channel = facebook, chọn >1 ảnh từ Library
When bấm "Gửi"
Then gọi ipc.fb.sendAttachments({ filePaths }) (không gọi ipc.zalo.sendImages)
And thành công
```

#### Scenario: Gửi video từ Library sang Telegram

```
Given account channel = telegram_user, chọn 1 video từ Library
When bấm "Gửi"
Then gọi channelIpc.sendVideo(channel, { filePath })
And thành công
```

#### Scenario: Gửi ảnh từ Library sang Zalo (không regression)

```
Given account channel = zalo, chọn 1 ảnh từ Library
When bấm "Gửi"
Then gọi ipc.zalo.sendImage({ filePath }) (đúng flow cũ, không đổi)
And thành công
```

### Requirement: File gửi từ Library luôn có local path khả dụng trên máy gửi

Trước khi gửi, UI SHALL resolve local path qua `resolveLibraryLocalPath(item)`: boss/standalone dùng `_localPath`; employee hoặc thiếu `_localPath` → tải file từ Boss (`fileUrl`) về temp qua `file:downloadUrlToTemp` rồi dùng path temp. Mọi send opts SHALL có `filePath` thật; UI SHALL NOT truyền `fileUrl`/`_libraryUuid` làm dữ liệu gửi.

#### Scenario: Employee gửi file từ Library (Boss path không tồn tại local)

```
Given mode = employee, item._localPath = "D:\\boss\\media\\...\\file.pdf" (path trên máy Boss), item.fileUrl = "https://boss/api/library/file/{uuid}"
When bấm "Gửi"
Then tải fileUrl về temp (file:downloadUrlToTemp) và gửi bằng path temp
And thành công, không lỗi ENOENT/readFileSync
```

#### Scenario: Boss gửi file từ Library (fast path)

```
Given mode = boss, item._localPath = "D:\\...\\media\\...\\img.jpg" (path hợp lệ local)
When bấm "Gửi"
Then dùng thẳng _localPath (không download)
And thành công
```

#### Scenario: Không resolve được local path

```
Given không có _localPath, không có fileUrl hợp lệ (bossUrl rỗng)
When bấm "Gửi"
Then skip item đó, không gọi send, không crash (console.warn + message giữ trạng thái pending/failed rõ ràng)
```
