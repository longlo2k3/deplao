/**
 * FacebookBlock.ts
 * Port từ Python _features/_facebook/_block.py
 * Block/unblock user trên Facebook Messenger
 */

import axios from 'axios';
import { FBSessionData } from './FacebookTypes';
import { buildFormData, buildPostConfig, rateLimitDelay } from './FacebookUtils';
import Logger from '../../utils/Logger';

const GRAPHQL_URL = 'https://www.facebook.com/webgraphql/mutation/';

/**
 * Chặn người dùng trên Facebook Messenger (N4)
 */
export async function blockUser(
  dataFB: FBSessionData,
  userId: string,
  httpsAgent?: any
): Promise<{ success: boolean; error?: string }> {
  await rateLimitDelay();

  const form = buildFormData(dataFB, {
    friendlyName: 'CometUserBlockMutation',
    docId: '5222223392500896',
  });

  form['variables'] = JSON.stringify({
    data: {
      user_id: String(userId),
      client_mutation_id: '1',
      actor_id: dataFB.FacebookID,
    }
  });
  form['dpr'] = '1';

  try {
    const formBody = new URLSearchParams(form).toString();
    await axios.post(GRAPHQL_URL, formBody, {
      headers: {
        'Host': 'www.facebook.com',
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Origin': 'https://www.facebook.com',
        'Referer': 'https://www.facebook.com/',
        'Cookie': dataFB.cookieFacebook,
      },
      timeout: 30000,
      ...(httpsAgent ? { httpsAgent } : {}),
    });
    return { success: true };
  } catch (err: any) {
    Logger.error(`[FacebookBlock] blockUser error: ${err.message}`);
    return { success: false, error: err.message };
  }
}

/**
 * Bỏ chặn người dùng trên Facebook Messenger (N4)
 */
export async function unblockUser(
  dataFB: FBSessionData,
  userId: string,
  httpsAgent?: any
): Promise<{ success: boolean; error?: string }> {
  await rateLimitDelay();

  const form = buildFormData(dataFB, {
    friendlyName: 'CometUserUnblockMutation',
    docId: '5930977328125598',
  });

  form['variables'] = JSON.stringify({
    data: {
      user_id: String(userId),
      client_mutation_id: '1',
      actor_id: dataFB.FacebookID,
    }
  });
  form['dpr'] = '1';

  try {
    const formBody = new URLSearchParams(form).toString();
    await axios.post(GRAPHQL_URL, formBody, {
      headers: {
        'Host': 'www.facebook.com',
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Origin': 'https://www.facebook.com',
        'Referer': 'https://www.facebook.com/',
        'Cookie': dataFB.cookieFacebook,
      },
      timeout: 30000,
      ...(httpsAgent ? { httpsAgent } : {}),
    });
    return { success: true };
  } catch (err: any) {
    Logger.error(`[FacebookBlock] unblockUser error: ${err.message}`);
    return { success: false, error: err.message };
  }
}
