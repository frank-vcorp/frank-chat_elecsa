import { Timestamp } from "firebase/firestore";

export type Role = "admin" | "supervisor" | "agent" | "ai";
export type AgentStatus = "online" | "offline" | "busy";

// Sucursales de ELECSA
export type BranchId =
  | "guadalajara"
  | "coahuila"
  | "leon"
  | "queretaro"
  | "toluca"
  | "monterrey"
  | "centro"
  | "armas"
  | "veracruz"
  | "slp"
  | "puebla"
  | "general"; // Para agentes que ven todas las sucursales

export interface Agent {
  id: string;
  name: string;
  email: string;
  role: Role;
  branch?: BranchId; // Sucursal principal (compatibilidad)
  branches?: BranchId[]; // Múltiples sucursales asignadas
  avatarUrl?: string;
  isOnline: boolean;
  active?: boolean; // Si el agente puede acceder al sistema
  whatsapp?: string; // Número de WhatsApp del agente
  mustChangePassword?: boolean; // Si debe cambiar contraseña en primer login
}

export interface Contact {
  id: string; // PhoneNumber
  name: string;
  phoneNumber: string;
  createdAt: Timestamp;
  lastSeen: Timestamp;
}

export type ConversationStatus = "open" | "resolved" | "pending" | "closed";

/** Fuente del nombre visible de la conversación. Prioridad: manual > whatsapp > phone */
export type DisplayNameSource = "manual" | "whatsapp" | "phone";

export interface Conversation {
  id: string;
  contactId: string;
  assignedTo?: string; // Agent ID or 'ai' or 'human'
  branch?: BranchId; // Sucursal detectada para routing
  status: ConversationStatus;
  lastMessage: string;
  lastMessageAt: Timestamp;
  unreadCount: number;
  needsHuman?: boolean;
  tags?: string[];
  summary?: string;
  summarizedAt?: Timestamp;
  // IMPL-20260409-01: Nombre visible de conversación (SPEC-ARCH-20260409-11)
  displayName?: string;
  displayNameSource?: DisplayNameSource;
  // IMPL-20260409-02: Fecha real de cierre (SPEC-ARCH-20260409-15)
  closedAt?: Timestamp;
}

export type SenderType = "agent" | "contact" | "system";
export type ContentType =
  | "text"
  | "image"
  | "file"
  | "video"
  | "audio"
  | "document";
export type MessageStatus = "sent" | "delivered" | "read";

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
