/** Contact unified - Zalo + Facebook */
export interface Contact {
    id?: number;
    owner_zalo_id: string;
    contact_id: string;
    display_name: string;
    alias?: string;
    avatar_url: string;
    phone?: string;
    is_friend: number;
    contact_type: string;
    unread_count: number;
    last_message?: string;
    last_message_time?: number;
    is_muted?: number;
    mute_until?: number;
    is_in_others?: number;
    gender?: number | null;
    birthday?: string | null;
    channel?: string;
}

/** Friend list */
export interface Friend {
    id?: number;
    owner_zalo_id: string;
    user_id: string;
    display_name: string;
    avatar: string;
    phone: string;
    updated_at: number;
}

/** Member of page/Zalo group */
export interface PageGroupMember {
    id?: number;
    owner_zalo_id: string;
    group_id: string;
    member_id: string;
    display_name: string;
    avatar: string;
    role: number;
    updated_at: number;
}

/** Friend request */
export interface FriendRequest {
    id?: number;
    owner_zalo_id: string;
    user_id: string;
    display_name: string;
    avatar: string;
    phone: string;
    direction: 'sent' | 'received';
    msg: string;
    created_at: number;
    updated_at: number;
}

/** Link được chia sẻ trong hội thoại */
export interface Link {
    id?: number;
    owner_zalo_id: string;
    thread_id: string;
    msg_id: string;
    url: string;
    title: string;
    domain: string;
    thumb_url: string;
    timestamp: number;
}
