# fix-voice-channel-routing

## ADDED Requirements

### Requirement: Ghi âm được gửi theo đúng channel của account

Khi kết thúc ghi âm (`recorder.onstop`), `MessageInput` SHALL xác định channel từ
`activeContact?.channel || CHANNEL.ZALO` và route:
- Zalo → vẫn dùng 2 bước `ipc.zalo.uploadVoiceFile` (lấy `uploadRes.fileUrl`) → `ipc.zalo.sendVoice`.
- Facebook / Telegram (bot + user) → `channelIpc.sendAttachment(ch, { accountId, threadId,
  threadType, filePath, fileType: 'audio', quote? })`.

`messageQueue.enqueue` SHALL ghi `channel: ch` (không hardcode `'zalo'`); kết quả gửi SHALL parse
qua `extractMsgIdFromResponse(res, ch)` với đúng channel.

#### Scenario: Ghi âm gửi sang Facebook (1:1 E2EE)

```
Given account channel = facebook, activeThreadType = 0 (user)
When ghi âm xong
Then ch = 'facebook'
And gọi channelIpc.sendAttachment('facebook', { threadId, threadType: 0, filePath, fileType: 'audio' })
And FacebookAdapter pass typeChat='user' → fb:sendAttachment → sendE2EEAudio
And thành công, không gọi ipc.zalo.*
```

#### Scenario: Ghi âm gửi sang Facebook (nhóm)

```
Given account channel = facebook, activeThreadType = 1 (group)
When ghi âm xong
Then ch = 'facebook'
And channelIpc.sendAttachment('facebook', { threadId, threadType: 1, fileType: 'audio' })
And fb:sendAttachment upload attachment → gửi typeAttachment='audio'
And thành công
```

#### Scenario: Ghi âm gửi Zalo (không regression, happy path m4a)

```
Given account channel = zalo
When ghi âm xong
Then ch = 'zalo'
And giữ nguyên ipc.zalo.uploadVoiceFile → ipc.zalo.sendVoice ({ voiceUrl = uploadRes.fileUrl })
And thành công
```

#### Scenario: Ghi âm gửi Telegram (bot/user)

```
Given account channel = telegram_bot hoặc telegram_user
When ghi âm xong
Then ch = kênh tương ứng, filePath = file .m4a
And channelIpc.sendAttachment(ch, { fileType: 'audio' }) → adapter gửi audio
And thành công (không gọi ipc.zalo.*)
```