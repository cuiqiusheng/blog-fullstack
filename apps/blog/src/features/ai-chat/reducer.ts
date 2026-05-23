import { ChatMessageStatus } from '@/graphql/codegen';
import type { ChatThreadState, UiChatMessage } from './types';

type Action =
  | { type: 'RESET_IDLE' }
  | {
      type: 'HYDRATE_SESSION';
      sessionId: string;
      messages: UiChatMessage[];
    }
  | {
      type: 'APPEND_SEND_RESULT';
      sessionId: string;
      userMessage: UiChatMessage;
      assistantMessage: UiChatMessage;
    }
  | {
      type: 'APPEND_CHUNK';
      messageId: string;
      chunk: string;
      createdAt: string;
    }
  | {
      type: 'FINALIZE_STREAM';
      messageId: string;
      status: ChatMessageStatus;
      error?: string | null;
    }
  | { type: 'SET_PHASE'; phase: ChatThreadState['phase'] }
  | { type: 'SET_ERROR'; error: string | null };

export const initialChatThreadState: ChatThreadState = {
  activeSessionId: null,
  messages: [],
  phase: 'idle',
  error: null,
  streamingMessageId: null,
};

export function chatThreadReducer(state: ChatThreadState, action: Action): ChatThreadState {
  switch (action.type) {
    case 'RESET_IDLE':
      return {
        ...initialChatThreadState,
      };
    case 'HYDRATE_SESSION':
      return {
        ...state,
        activeSessionId: action.sessionId,
        messages: action.messages,
        phase: 'ready',
        error: null,
        streamingMessageId: null,
      };
    case 'APPEND_SEND_RESULT':
      return {
        ...state,
        activeSessionId: action.sessionId,
        messages: [...state.messages, action.userMessage, action.assistantMessage],
        phase: 'streaming',
        error: null,
        streamingMessageId: action.assistantMessage.id,
      };
    case 'APPEND_CHUNK':
      return {
        ...state,
        messages: state.messages.map(message => {
          if (message.id !== action.messageId) {
            return message;
          }
          return {
            ...message,
            content: `${message.content}${action.chunk}`,
            createdAt: action.createdAt,
          };
        }),
      };
    case 'FINALIZE_STREAM':
      return {
        ...state,
        messages: state.messages.map(message => {
          if (message.id !== action.messageId) {
            return message;
          }
          return {
            ...message,
            status: action.status,
          };
        }),
        phase: action.status === ChatMessageStatus.Failed ? 'error' : 'ready',
        error:
          action.error ?? (action.status === ChatMessageStatus.Failed ? 'Stream failed' : null),
        streamingMessageId: null,
      };
    case 'SET_PHASE':
      return {
        ...state,
        phase: action.phase,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.error,
        phase: action.error ? 'error' : state.phase,
      };
    default:
      return state;
  }
}
