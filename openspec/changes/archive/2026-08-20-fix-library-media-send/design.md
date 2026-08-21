# Design: Fix gửi media từ Thư viện trên mọi kênh

## Giải pháp

### 1. Helper resolve local path (`src/ui/lib/libraryMedia.ts`, mới)

```ts
/** Chuẩn hoá fileUrl thành URL tuyệt đối */
export function toAbsoluteLibraryUrl(fileUrl: string, bossUrl: string): string {
  if (!fileUrl) return '';
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
  if (fileUrl.startsWith('//')) return `${bossUrl.startsWith('https') ? 'https' : 'http'}:${fileUrl}`;
  if (fileUrl.startsWith('/')) {
    const base = (bossUrl || '').replace(/\/+$/, '');
    return base ? `${base}${fileUrl}` : '';
  }
  return fileUrl;
}

/** Trả về path local khả dụng trên máy hiện tại để gửi */
export async function resolveLibraryLocalPath(item: { _localPath?: string; fileUrl?: string; name?: string }, opts: { bossUrl: string; isEmployee: boolean }): Promise<string> {
  // Boss/standalone: _localPath là path thật trên máy
  if (!opts.isEmployee && item._localPath) return item._localPath;

  // Employee / thiếu local path: tải Boss file về temp
  const url = toAbsoluteLibraryUrl(item.fileUrl || '', opts.bossUrl);
  if (!url) return '';
  const ext = (item.name?.split('.').pop() || 'bin');
  const res = await ipc.file?.downloadUrlToTemp?.({ url, ext, filename: item.name });
  return res?.success ? (res.filePath || '') : '';
}
```

- `isEmployee` lấy từ `useEmployeeStore.getState().mode === 'employee'`; `bossUrl` từ `employeeStore.bossUrl`.
- Chỉ `resolveLibraryLocalPath` phụ thuộc `ipc`; `toAbsoluteLibraryUrl` là hàm thuần → test được.

### 2. IPC mới `file:downloadUrlToTemp` (electron/ipc/fileIpc.ts + preload + ipc.ts)

Mirror `file:saveTempBlob` (fileIpc.ts:202-…): nhận `{ url, ext, filename }`, dùng `fetch` (Node,
không CORS) download → ghi vào `tmp` dir → trả `{ success, filePath }`. Không cần auth — Boss
serve library file qua tunnel (`HttpRelayService.ts:1285-1298`, "không cần auth"). Tương tự
`MediaCacheService.downloadToCache` (MediaCacheService.ts:188).

### 3. Routing theo kênh trong `LibraryPickerModal.tsx`

Thay cụm "Telegram vs Zalo" bằng 3 nhánh đúng chuẩn `MessageInput`:

| Channel | Ảnh (batch/lẻ) | Video | File |
|---|---|---|---|
| Telegram | `channelIpc.sendAttachment` (từng ảnh) | `channelIpc.sendVideo` | `channelIpc.sendAttachment` |
| Facebook | lẻ `channelIpc.sendAttachment`; batch `ipc.fb.sendAttachments` | `channelIpc.sendVideo` | `channelIpc.sendAttachment` |
| Zalo | lẻ `ipc.zalo.sendImage`; batch `ipc.zalo.sendImages` | `ipc.file.getVideoMeta` + `channelIpc.sendVideo('zalo',…)` | `ipc.zalo.sendFile` |

- Mọi branch dùng `filePath = await resolveLibraryLocalPath(item)` — **không còn** `opts.fileUrl`/`opts._libraryUuid`.
- Preview batch ảnh & attachments: dùng path đã resolve; employee dùng `item.fileUrl` cho hiển thị.
- Áp dụng cho: `sendItem` (384-436), image-batch (448-506), video/file loop (509-564), `handleDirectFile` (598-676).
- Giữ nguyên `messageQueue.enqueue`, `generateTempId`, `extractMsgIdFromResponse`, `addMessage` flow.

## Files

| File | Change |
|---|---|
| `src/ui/lib/libraryMedia.ts` | mới: `toAbsoluteLibraryUrl`, `resolveLibraryLocalPath` |
| `src/ui/components/chat/library/LibraryPickerModal.tsx` | routing 3 nhánh + resolve local path + bỏ fallback dead |
| `electron/ipc/fileIpc.ts` | handler `file:downloadUrlToTemp` |
| `electron/preload.ts` | expose `file.downloadUrlToTemp` |
| `src/ui/lib/ipc.ts` | type cho `file.downloadUrlToTemp` |

## Verification

- `npx tsc --noEmit -p tsconfig.electron.json` 0 lỗi mới
- Renderer: `npx tsc --noEmit` (hoặc script chuẩn dự án, NODE_OPTIONS heap 8192)
- Jest: `toAbsoluteLibraryUrl` (relative / `//host` / full / rỗng)
- Thủ công (boss): gửi ảnh/file/video từ Library sang Zalo, Facebook, Telegram bot, Telegram user
