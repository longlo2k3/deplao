/**
 * TelegramBotAdapter.ts - Integration adapter cho Telegram Bot API
 * 
 * Lưu botToken encrypted, validate qua getMe, gửi tin nhắn qua sendMessage.
 * Dùng chung cho: notify.telegram node + trigger.telegramCommand (Phase 1C).
 */

import axios from 'axios';
import { IntegrationAdapter, IntegrationConfig, TestResult } from '../IntegrationAdapter';
import Logger from '../../../utils/Logger';

const TELEGRAM_API = 'https://api.telegram.org';
const REQUEST_TIMEOUT = 10000;

export class TelegramBotAdapter extends IntegrationAdapter {
  readonly type = 'telegram_bot';
  readonly name = 'Telegram Bot';

  constructor(config: IntegrationConfig) {
    super(config);
  }

  private get botToken(): string {
    return this.config.credentials?.botToken || '';
  }

  private get apiBase(): string {
    return `${TELEGRAM_API}/bot${this.botToken}`;
  }

  /**
   * Validate bot token bằng cách gọi getMe
   */
  async testConnection(): Promise<TestResult> {
    if (!this.botToken) {
      return { success: false, message: 'Thiếu Bot Token' };
    }

    try {
      const res = await axios.get(`${this.apiBase}/getMe`, { timeout: REQUEST_TIMEOUT });
      if (res.data?.ok) {
        const bot = res.data.result;
        return {
          success: true,
          message: `Kết nối thành công! Bot: @${bot.username} (${bot.first_name})`,
        };
      }
      return { success: false, message: 'Token không hợp lệ' };
    } catch (err: any) {
      const msg = err.response?.data?.description || err.message || 'Lỗi kết nối';
      return { success: false, message: `Lỗi: ${msg}` };
    }
  }

  /**
   * Gửi tin nhắn qua Telegram Bot API
   */
  async executeAction(action: string, params: Record<string, any>): Promise<any> {
    switch (action) {
      case 'sendMessage':
        return this.sendMessage(params.chatId, params.text, params.parseMode);
      case 'getMe':
        return this.getMe();
      case 'getUpdates':
        return this.getUpdates(params.offset, params.limit, params.timeout);
      default:
        throw new Error(`Action không hỗ trợ: ${action}`);
    }
  }

  /**
   * Gửi tin nhắn
   */
  async sendMessage(chatId: string, text: string, parseMode?: string): Promise<any> {
    const payload: Record<string, any> = {
      chat_id: chatId,
      text,
    };
    if (parseMode) payload.parse_mode = parseMode;

    const res = await axios.post(`${this.apiBase}/sendMessage`, payload, { timeout: REQUEST_TIMEOUT });
    return {
      success: true,
      messageId: res.data.result?.message_id || '',
    };
  }

  /**
   * Lấy thông tin bot
   */
  async getMe(): Promise<any> {
    const res = await axios.get(`${this.apiBase}/getMe`, { timeout: REQUEST_TIMEOUT });
    return res.data?.result;
  }

  /**
   * Lấy updates (dùng cho polling)
   */
  async getUpdates(offset?: number, limit?: number, timeout?: number): Promise<any[]> {
    const params: Record<string, any> = {};
    if (offset !== undefined) params.offset = offset;
    if (limit !== undefined) params.limit = limit;
    if (timeout !== undefined) params.timeout = timeout;

    const res = await axios.get(`${this.apiBase}/getUpdates`, {
      params,
      timeout: (timeout || 30) * 1000 + 5000, // timeout + 5s buffer
    });

    return res.data?.result || [];
  }
}
