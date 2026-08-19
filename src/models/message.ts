/** Tin nhắn unified - Zalo + Facebook */
export interface Message {
    id?: number;
    msg_id: string;
    cli_msg_id?: string;
    owner_zalo_id: string;
    thread_id: string;
    thread_type: number;
    sender_id: string;
    content: string;
    msg_type: string;
    timestamp: number;
    is_sent: number;
    attachments?: string;
    local_paths?: string;
    status: string;
    quote_data?: string;
    handled_by_employee?: string | null;
    channel?: string;
    reactions?: string;
    is_recalled?: number;
    recalled_content?: string | null;
    deleted_by?: string | null;
    /** Đã được người nhận xem (Zalo seen) — 1 = đã xem */
    is_seen?: number;
    /** JSON array của uid những người đã xem (nhóm) */
    seen_uids?: string;
    /** epoch ms thời điểm seen lần đầu */
    seen_at?: number;
    /** epoch ms thời điểm delivered (máy người nhận nhận được, chưa đọc) */
    delivered_at?: number;
    /** ID of the message being replied to (Facebook/others) */
    reply_to_id?: string | null;
    topic_id?: string | null;
}

/** Draft tin nhắn đang soạn dở */
export interface MessageDraft {
    id?: number;
    owner_zalo_id: string;
    thread_id: string;
    content: string;
    updated_at: number;
}
