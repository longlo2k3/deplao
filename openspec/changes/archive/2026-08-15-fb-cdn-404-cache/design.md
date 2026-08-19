# Design: Negative cache CDN 404

## Giải pháp

Trong `src/services/facebook/FacebookSession.ts`:

```ts
// Module-level negative cache: userId -> timestamp 404 gần nhất
const cdnFailCache = new Map<string, number>();
const CDN_FAIL_404_TTL = 30 * 60 * 1000;
```

`tryFetchCdnRedirect` (317):

```ts
async function tryFetchCdnRedirect(cookie, userId, httpsAgent?) {
  const now = Date.now();
  const lastFail = cdnFailCache.get(userId);
  if (lastFail && now - lastFail < CDN_FAIL_404_TTL) return null;

  try { ...existing HEAD maxRedirects:0... }
  catch (err: any) {
    if (err.response?.headers?.location) return err.response.headers.location;
    if (err?.response?.status === 404) {
      cdnFailCache.set(userId, now);
      Logger.debug(`[FacebookSession] tryFetchCdnRedirect 404 for ${userId} (cached 30m)`);
    } else {
      Logger.debug(`[FacebookSession] tryFetchCdnRedirect failed for ${userId}: ${err.message}`);
    }
  }

  try { ...existing fallback HEAD maxRedirects:5... }
  catch (err: any) {
    if (err?.response?.status === 404) {
      cdnFailCache.set(userId, now);
      Logger.debug(`[FacebookSession] tryFetchCdnRedirect fallback 404 for ${userId} (cached 30m)`);
    } else {
      Logger.debug(`[FacebookSession] tryFetchCdnRedirect fallback failed for ${userId}: ${err.message}`);
    }
  }
  return null;
}
```

Chỉ 404 mới cache (vĩnh viễn); timeout/network không cache để retry tự nhiên.

## Files

| File | Change |
|---|---|
| `src/services/facebook/FacebookSession.ts` | Map + TTL + 2 catch branch |

## Verification

- tsc electron 0 lỗi
- Restart app → user 404 (100080982064448) chỉ log 1 dòng; không còn spam
- User có avatar thật vẫn fetch bình thường (không cache nhầm)