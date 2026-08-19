/**
 * FacebookCreateNotes.ts
 * Port từ Python _messaging/_createNotes.py
 * Tạo và chia sẻ Messenger Notes (24h)
 */

import axios from 'axios';
import { FBSessionData } from './FacebookTypes';
import { buildFormData, rateLimitDelay } from './FacebookUtils';
import Logger from '../../utils/Logger';

const GRAPHQL_URL = 'https://www.facebook.com/webgraphql/mutation/';

/**
 * Tạo Messenger Note mới (N2)
 * Notes là tin nhắn tự hủy sau 24h, hiển thị ở đầu inbox.
 */
export async function createNote(
  dataFB: FBSessionData,
  text: string,
  backgroundColor?: string,
  textColor?: string,
  httpsAgent?: any
): Promise<{ success: boolean; noteId?: string; error?: string }> {
  await rateLimitDelay();

  const form = buildFormData(dataFB, {
    friendlyName: 'CometCreateNoteMutation',
    docId: '7370547589079803',
  });

  form['variables'] = JSON.stringify({
    data: {
      note_text: text,
      background_color: backgroundColor || '#FFC300',
      text_color: textColor || '#000000',
      client_mutation_id: '1',
      actor_id: dataFB.FacebookID,
    }
  });
  form['dpr'] = '1';

  try {
    const formBody = new URLSearchParams(form).toString();
    const response = await axios.post(GRAPHQL_URL, formBody, {
      headers: {
        'Host': 'www.facebook.com',
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Origin': 'https://www.facebook.com',
        'Referer': 'https://www.facebook.com/',
        'Cookie': dataFB.cookieFacebook,
      },
      timeout: 30000,      ...(httpsAgent ? { httpsAgent } : {}),    });

    const parsed = JSON.parse(response.data.replace(/^for\s*\(;;\);/, '').trim());
    const noteId = parsed?.data?.note_create?.note?.id;
    return { success: true, noteId: noteId ? String(noteId) : undefined };
  } catch (err: any) {
    Logger.error(`[FacebookCreateNotes] createNote error: ${err.message}`);
    return { success: false, error: err.message };
  }
}
