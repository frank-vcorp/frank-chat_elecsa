import { Timestamp } from 'firebase/firestore';

export type Role = 'admin' | 'agent' | 'ai';
export type AgentStatus = 'online' | 'offline' | 'busy';

export interface Agent {
    id: string;
    name: string;
    email: string;
    role: Role;
    avatarUrl?: string;
    isOnline: boolean;
}

export interface Contact {
    id: string; // PhoneNumber
    name: string;
    phoneNumber: string;
    createdAt: Timestamp;
    lastSeen: Timestamp;
}

export type ConversationStatus = 'open' | 'resolved' | 'pending' | 'closed';

export interface Conversation {
    id: string;
    contactId: string;
    assignedTo?: string; // Agent ID
    status: ConversationStatus;
    lastMessage: string;
    lastMessageAt: Timestamp;
    unreadCount: number;
    needsHuman?: boolean;
    tags?: string[];
}

export type SenderType = 'agent' | 'contact' | 'system';
export type ContentType = 'text' | 'image' | 'file';
export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    senderType: SenderType;
    content: string;
    contentType: ContentType;
    mediaUrl?: string;
    createdAt: Timestamp;
    status: MessageStatus;
}
