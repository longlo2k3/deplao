# fix-zalo-voice-send

## ADDED Requirements

### Requirement: Ghi âm Zalo dùng container m4a (AAC) thay vì webm

Khi bắt đầu ghi âm trong chat Zalo, `MessageInput` SHALL chọn `MediaRecorder` mimeType theo thứ tự ưu tiên dùng `MediaRecorder.isTypeSupported`: `audio/mp4` trước, rồi `audio/webm;codecs=opus`, rồi `audio/webm`. Extension file tạm SHALL map theo mimeType đã chọn (mp4 → `m4a`, webm → `webm`, ogg → `ogg`) khi gọi `ipc.file.saveTempBlob`.

#### Scenario: Ghi âm trên máy hỗ trợ audio/mp4 (Electron/Chromium)

```
Given MediaRecorder.isTypeSupported('audio/mp4') === true
When bắt đầu ghi âm
Then mimeType = 'audio/mp4'
And file tạm có đuôi .m4a khi gửi
```

#### Scenario: Máy không hỗ trợ audio/mp4 (fallback giữ nguyên webm)

```
Given MediaRecorder.isTypeSupported('audio/mp4') === false
When bắt đầu ghi âm
Then mimeType = 'audio/webm;codecs=opus' (nếu có) hoặc 'audio/webm'
And ext = 'webm'
```

### Requirement: Đọc fileUrl từ kết quả uploadAttachment (object phẳng)

Sau khi gọi `ipc.zalo.uploadVoiceFile`, UI SHALL lấy URL âm thanh từ `uploadRes?.fileUrl` (object phẳng do zca-js `uploadAttachment` trả về), fallback lần lượt `uploadRes?.normalUrl` / `uploadRes?.hdUrl` / `uploadRes?.url` / `uploadRes?.href`. Chỉ khi tất cả rỗng mới trả lỗi "Upload file ghi âm thất bại". UI SHALL NOT đọc `uploadRes?.response?.fileUrl`.

#### Scenario: Upload thành công (others → fileUrl)

```
Given uploadRes = { fileType: 'others', fileUrl: 'https://dlcdn.zalo...', fileId: 123, ... }
When xử lý kết quả upload
Then voiceUrl = uploadRes.fileUrl
And gọi ipc.zalo.sendVoice({ options: { voiceUrl }, ... })
```

#### Scenario: uploadAttachment kết quả rỗng

```
Given uploadRes = {} hoặc không có URL nào
When xử lý kết quả upload
Then trả { success: false, error: 'Upload file ghi âm thất bại' }
```