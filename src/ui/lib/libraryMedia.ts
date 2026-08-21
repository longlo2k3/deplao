/**
 * libraryMedia - Resolve local file path khả dụng để gửi media từ Thư viện.
 *
 * - Boss/standalone: `_localPath` là path thật trên máy → dùng thẳng.
 * - Employee hoặc thiếu `_localPath`: `_localPath` là path trên máy Boss,
 *   không tồn tại local → phải tải file từ Boss (`fileUrl`) về temp rồi gửi.
 */

export interface LibraryDownloadFn {
  (url: string, filename?: string): Promise<string>;
}

export interface ResolveLibraryLocalDeps {
  isEmployee: boolean;
  bossUrl: string;
  download?: LibraryDownloadFn;
}

/**
 * Chuẩn hoá fileUrl của library item thành URL tuyệt đối.
 */
export function toAbsoluteLibraryUrl(fileUrl: string, bossUrl: string): string {
  if (!fileUrl) return '';
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
  if (fileUrl.startsWith('//')) {
    const scheme = /^https:/i.test(bossUrl) ? 'https' : 'http';
    return `${scheme}:${fileUrl}`;
  }
  if (fileUrl.startsWith('/')) {
    const base = (bossUrl || '').replace(/\/+$/, '');
    return base ? `${base}${fileUrl}` : '';
  }
  return fileUrl;
}

/**
 * Trả về local path khả dụng trên máy hiện tại để gửi, hoặc '' nếu không thể.
 *
 * @param item - Library item (`_localPath`, `fileUrl`, `name`)
 * @param deps - mode + bossUrl + hàm download (được inject từ call site để test)
 */
export async function resolveLibraryLocalPath(
  item: { _localPath?: string; fileUrl?: string; name?: string },
  deps: ResolveLibraryLocalDeps,
): Promise<string> {
  if (!deps.isEmployee && item._localPath) return item._localPath;

  const url = toAbsoluteLibraryUrl(item.fileUrl || '', deps.bossUrl);
  if (!url || !deps.download) return '';
  return deps.download(url, item.name);
}