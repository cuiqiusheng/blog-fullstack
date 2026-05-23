import type { ChatMessageStatus, ChatRole } from '@/graphql/codegen';

export interface UiChatMessage {
  id: string;
  role: ChatRole.User | ChatRole.Assistant;
  status: ChatMessageStatus;
  content: string;
  createdAt: string;
}

export type ChatPhase = 'idle' | 'hydrating' | 'ready' | 'streaming' | 'error';

export interface ChatThreadState {
  activeSessionId: string | null;
  messages: UiChatMessage[];
  phase: ChatPhase;
  error: string | null;
  streamingMessageId: string | null;
}
