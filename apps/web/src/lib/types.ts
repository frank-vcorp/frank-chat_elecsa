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
  // IMPL-20260513-04: Ventana activa de sesión WA con el agente
  waSessionOpenUntil?: Timestamp; // Expiración de ventana activa WA (now+24h tras respuesta del agente)
  lastAgentInboundAt?: Timestamp; // Timestamp del último mensaje entrante del agente vía WA
  lastAgentInboundText?: string;  // Texto saneado del último mensaje entrante (máx 200 chars)
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
  // ARCH-20260428-01: Agente asignado por nombre y badge WA
  assignedToName?: string;
  waCanalizado?: boolean;
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
  mediaMimeType?: string | null;
  createdAt: Timestamp;
  status: MessageStatus;
}

// IMPL-20260513-03: Log operativo de avisos WhatsApp a agentes humanos
export type WaDeliveryMode = "template" | "session";
export type WaTriggerSource = "handoff_auto" | "manual_assignment";
export type WaLogStatus = "attempted" | "sent" | "failed";

/** Un documento por intento de aviso principal al agente. Colección: agent_wa_logs */
export interface AgentWaLog {
  eventId: string;
  conversationId: string;
  agentId: string;
  agentName: string;
  agentWhatsappMasked: string; // Solo últimos 4 dígitos visibles
  branch: string;
  triggerSource: WaTriggerSource;
  messageKind: "primary_alert";
  intendedDeliveryMode: WaDeliveryMode;
  effectiveDeliveryMode: WaDeliveryMode;
  templateSid?: string | null;
  status: WaLogStatus;
  attemptedAt: Timestamp;
  resolvedAt?: Timestamp | null;
  errorCode?: string | null;
  errorMessage?: string | null;
}
