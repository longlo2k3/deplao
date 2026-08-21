import { toAbsoluteLibraryUrl, resolveLibraryLocalPath } from '@/lib/libraryMedia';

describe('toAbsoluteLibraryUrl', () => {
  it('keeps full http/https URL as-is', () => {
    expect(toAbsoluteLibraryUrl('https://boss/api/library/file/abc', 'http://192.168.1.5:9900')).toBe('https://boss/api/library/file/abc');
    expect(toAbsoluteLibraryUrl('http://host/x', '')).toBe('http://host/x');
  });

  it('prepends bossUrl to protocol-relative //host URLs', () => {
    expect(toAbsoluteLibraryUrl('//192.168.1.5:9900/api/library/file/abc', 'http://192.168.1.5:9900')).toBe('http://192.168.1.5:9900/api/library/file/abc');
  });

  it('uses https scheme when bossUrl is https', () => {
    expect(toAbsoluteLibraryUrl('//boss/api/library/file/abc', 'https://boss')).toBe('https://boss/api/library/file/abc');
  });

  it('prepends bossUrl to relative /api paths', () => {
    expect(toAbsoluteLibraryUrl('/api/library/file/abc', 'http://192.168.1.5:9900')).toBe('http://192.168.1.5:9900/api/library/file/abc');
  });

  it('returns empty for empty input or relative path without bossUrl', () => {
    expect(toAbsoluteLibraryUrl('', 'http://host')).toBe('');
    expect(toAbsoluteLibraryUrl('/api/library/file/abc', '')).toBe('');
  });
});

describe('resolveLibraryLocalPath', () => {
  const item = { _localPath: 'D:\\boss\\media\\x\\img.jpg', fileUrl: '/api/library/file/abc', name: 'img.jpg' };

  it('uses _localPath directly in boss mode', async () => {
    const download = jest.fn(async () => '');
    const result = await resolveLibraryLocalPath(item, { isEmployee: false, bossUrl: '', download });
    expect(result).toBe('D:\\boss\\media\\x\\img.jpg');
    expect(download).not.toHaveBeenCalled();
  });

  it('downloads via fileUrl in employee mode', async () => {
    const download = jest.fn(async (_url: string) => 'C:\\tmp\\deplao-library\\img.jpg');
    const result = await resolveLibraryLocalPath(
      { _localPath: 'D:\\boss\\media\\x\\img.jpg', fileUrl: '//192.168.1.5:9900/api/library/file/abc', name: 'img.jpg' },
      { isEmployee: true, bossUrl: 'http://192.168.1.5:9900', download },
    );
    expect(result).toBe('C:\\tmp\\deplao-library\\img.jpg');
    expect(download).toHaveBeenCalledWith('http://192.168.1.5:9900/api/library/file/abc', 'img.jpg');
  });

  it('downloads when _localPath is missing even in boss mode', async () => {
    const download = jest.fn(async () => 'C:\\tmp\\x.pdf');
    const result = await resolveLibraryLocalPath(
      { fileUrl: '//192.168.1.5:9900/api/library/file/xyz', name: 'doc.pdf' },
      { isEmployee: false, bossUrl: 'http://192.168.1.5:9900', download },
    );
    expect(result).toBe('C:\\tmp\\x.pdf');
    expect(download).toHaveBeenCalledWith('http://192.168.1.5:9900/api/library/file/xyz', 'doc.pdf');
  });

  it('returns empty when nothing resolvable', async () => {
    const result = await resolveLibraryLocalPath(
      { name: 'a.png' },
      { isEmployee: true, bossUrl: '', download: jest.fn() },
    );
    expect(result).toBe('');
  });
});