import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArchiveChatSessionDocument,
  ChatMessageStatus,
  ChatRole,
  ChatSessionDocument,
  ChatSessionStreamDocument,
  ChatSessionsDocument,
  DeleteChatSessionDocument,
  SendChatMessageDocument,
  StartChatSessionDocument,
} from '@/graphql/codegen';
import { chatThreadReducer, initialChatThreadState } from './reducer';
import type { UiChatMessage } from './types';

function mapMessage(row: {
  id?: string;
  role?: ChatRole;
  status?: ChatMessageStatus;
  content?: string;
  createdAt?: string;
}): UiChatMessage | null {
  if (
    typeof row.id !== 'string' ||
    !row.status ||
    typeof row.content !== 'string' ||
    typeof row.createdAt !== 'string' ||
    (row.role !== ChatRole.User && row.role !== ChatRole.Assistant)
  ) {
    return null;
  }
  return {
    id: row.id,
    role: row.role,
    status: row.status,
    content: row.content,
    createdAt: row.createdAt,
  };
}

function areMessagesEqual(left: UiChatMessage[], right: UiChatMessage[]) {
  if (left.length !== right.length) {
    return false;
  }
  for (let index = 0; index < left.length; index += 1) {
    const a = left[index];
    const b = right[index];
    if (
      a.id !== b.id ||
      a.role !== b.role ||
      a.status !== b.status ||
      a.content !== b.content ||
      a.createdAt !== b.createdAt
    ) {
      return false;
    }
  }
  return true;
}

export function useChatSessionController() {
  const { topicId } = useParams<{ topicId?: string }>();
  const navigate = useNavigate();
  const apolloClient = useApolloClient();

  const [input, setInput] = useState('');
  const [actionPendingId, setActionPendingId] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState<string | null>(null);
  const [state, dispatch] = useReducer(chatThreadReducer, initialChatThreadState);
  const activeStreamRef = useRef<{ unsubscribe: () => void } | null>(null);
  const processedEventRef = useRef<Set<string>>(new Set());
  const messageViewportRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);

  const [startChatSession] = useMutation(StartChatSessionDocument);
  const [sendChatMessage] = useMutation(SendChatMessageDocument);
  const [archiveSessionMutation] = useMutation(ArchiveChatSessionDocument);
  const [deleteSessionMutation] = useMutation(DeleteChatSessionDocument);

  const {
    data: sessionsData,
    loading: sessionsLoading,
    refetch: refetchSessions,
  } = useQuery(ChatSessionsDocument, {
    variables: { limit: 100, offset: 0 },
    fetchPolicy: 'cache-and-network',
  });
  const sessionQueryVariables = useMemo(
    () => ({ id: topicId ?? '', limit: 200, offset: 0 }),
    [topicId],
  );

  const { data: sessionData, loading: sessionLoading } = useQuery(ChatSessionDocument, {
    variables: sessionQueryVariables,
    skip: !topicId,
    // Reduce duplicate traffic when revisiting sessions.
    fetchPolicy: 'cache-and-network',
  });

  const sessions = useMemo(() => sessionsData?.chatSessions ?? [], [sessionsData?.chatSessions]);

  useEffect(() => {
    // Cleanup is only tied to route/session switching, not to data refresh.
    activeStreamRef.current?.unsubscribe();
    activeStreamRef.current = null;
    processedEventRef.current.clear();
    if (!topicId) {
      dispatch({ type: 'RESET_IDLE' });
      return;
    }
  }, [topicId]);

  useEffect(() => {
    if (!topicId) {
      return;
    }
    const row = sessionData?.chatSession;
    if (!row || row.id !== topicId) {
      return;
    }
    const incomingMessages = (row.messages ?? [])
      .map(mapMessage)
      .filter(Boolean) as UiChatMessage[];

    // Ignore stale snapshots from query/cache that would roll back optimistic local thread state.
    if (state.activeSessionId === row.id) {
      if (state.phase === 'streaming') {
        return;
      }
      if (state.messages.length > 0) {
        const incomingIds = new Set(incomingMessages.map(message => message.id));
        const incomingContainsAllLocal = state.messages.every(message =>
          incomingIds.has(message.id),
        );
        if (!incomingContainsAllLocal || incomingMessages.length < state.messages.length) {
          return;
        }
      }
      if (areMessagesEqual(state.messages, incomingMessages)) {
        return;
      }
    }

    dispatch({
      type: 'HYDRATE_SESSION',
      sessionId: row.id,
      messages: incomingMessages,
    });
  }, [topicId, sessionData?.chatSession, state.activeSessionId, state.messages, state.phase]);

  useEffect(() => {
    if (state.phase !== 'streaming') {
      return;
    }
    if (!shouldAutoScrollRef.current) {
      return;
    }
    const viewport = messageViewportRef.current;
    if (!viewport) {
      return;
    }
    const task = window.requestAnimationFrame(() => {
      viewport.scrollTop = viewport.scrollHeight;
    });
    return () => window.cancelAnimationFrame(task);
  }, [state.messages, state.phase]);

  useEffect(() => {
    const viewport = messageViewportRef.current;
    if (!viewport) {
      return;
    }
    const detectAutoScroll = () => {
      const distanceToBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      // Resume auto-scroll when user returns close to the bottom.
      shouldAutoScrollRef.current = distanceToBottom <= 24;
    };
    viewport.addEventListener('scroll', detectAutoScroll);
    return () => {
      viewport.removeEventListener('scroll', detectAutoScroll);
    };
  }, [topicId]);

  useEffect(() => {
    if (state.phase === 'streaming') {
      shouldAutoScrollRef.current = true;
    }
  }, [state.phase, state.activeSessionId]);

  useEffect(
    () => () => {
      activeStreamRef.current?.unsubscribe();
      activeStreamRef.current = null;
      processedEventRef.current.clear();
    },
    [],
  );

  const selectSession = (sessionId: string) => {
    if (sessionId === topicId) {
      return;
    }
    navigate(`/ai/${sessionId}`);
  };

  const createNewSession = () => {
    navigate('/ai');
  };

  const send = async () => {
    const content = input.trim();
    if (!content || state.phase === 'streaming') {
      return;
    }
    dispatch({ type: 'SET_ERROR', error: null });

    let sessionId = topicId;
    if (!sessionId) {
      dispatch({ type: 'SET_PHASE', phase: 'hydrating' });
      const started = await startChatSession({
        variables: {
          input: {},
        },
      });
      const createdId = started.data?.startChatSession.id;
      if (!createdId) {
        dispatch({ type: 'SET_ERROR', error: 'Failed to create chat session' });
        return;
      }
      sessionId = createdId;
      navigate(`/ai/${createdId}`);
      await refetchSessions();
    }

    const result = await sendChatMessage({
      variables: {
        sessionId,
        content,
      },
    });
    const payload = result.data?.sendChatMessage;
    if (!payload) {
      dispatch({ type: 'SET_ERROR', error: 'Failed to send chat message' });
      return;
    }

    const userMessage = mapMessage(payload.userMessage);
    const assistantMessage = mapMessage(payload.assistantMessage);
    if (!userMessage || !assistantMessage) {
      dispatch({ type: 'SET_ERROR', error: 'Invalid chat message payload' });
      return;
    }
    setInput('');
    dispatch({
      type: 'APPEND_SEND_RESULT',
      sessionId,
      userMessage,
      assistantMessage,
    });

    activeStreamRef.current?.unsubscribe();
    processedEventRef.current.clear();
    const streamSub = apolloClient
      .subscribe({
        query: ChatSessionStreamDocument,
        variables: {
          sessionId,
          messageId: assistantMessage.id,
        },
      })
      .subscribe({
        next: ({ data }) => {
          const event = data?.chatSessionStream;
          if (!event) {
            return;
          }
          if (processedEventRef.current.has(event.eventId)) {
            return;
          }
          processedEventRef.current.add(event.eventId);

          if (event.type === 'MESSAGE_CHUNK') {
            dispatch({
              type: 'APPEND_CHUNK',
              messageId: event.messageId,
              chunk: event.chunk,
              createdAt: event.createdAt,
            });
            console.log('event.model', event.model);
            setCurrentModel(event.model ?? null);
            return;
          }
          if (event.type === 'MESSAGE_COMPLETED') {
            dispatch({
              type: 'FINALIZE_STREAM',
              messageId: event.messageId,
              status: ChatMessageStatus.Completed,
            });
            void refetchSessions();
            streamSub.unsubscribe();
            activeStreamRef.current = null;
            return;
          }
          if (event.type === 'MESSAGE_FAILED') {
            dispatch({
              type: 'FINALIZE_STREAM',
              messageId: event.messageId,
              status: ChatMessageStatus.Failed,
              error: event.error ?? 'Stream failed',
            });
            streamSub.unsubscribe();
            activeStreamRef.current = null;
          }
        },
        error: streamError => {
          dispatch({
            type: 'SET_ERROR',
            error: streamError instanceof Error ? streamError.message : 'Stream failed',
          });
          dispatch({
            type: 'SET_PHASE',
            phase: 'ready',
          });
          activeStreamRef.current = null;
        },
      });
    activeStreamRef.current = streamSub;
  };

  const archiveSession = async (sessionId: string) => {
    if (actionPendingId) {
      return;
    }
    setActionPendingId(sessionId);
    try {
      await archiveSessionMutation({
        variables: { sessionId },
      });
      if (topicId === sessionId) {
        activeStreamRef.current?.unsubscribe();
        activeStreamRef.current = null;
        processedEventRef.current.clear();
        navigate('/ai');
      }
      await refetchSessions();
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        error: error instanceof Error ? error.message : 'Failed to archive session',
      });
    } finally {
      setActionPendingId(null);
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (actionPendingId) {
      return;
    }
    setActionPendingId(sessionId);
    try {
      const result = await deleteSessionMutation({
        variables: { sessionId },
      });
      if (!result.data?.deleteChatSession) {
        throw new Error('Failed to delete session');
      }
      if (topicId === sessionId) {
        activeStreamRef.current?.unsubscribe();
        activeStreamRef.current = null;
        processedEventRef.current.clear();
        navigate('/ai');
      }
      await refetchSessions();
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        error: error instanceof Error ? error.message : 'Failed to delete session',
      });
    } finally {
      setActionPendingId(null);
    }
  };

  return {
    sessions,
    sessionsLoading,
    actionPendingId,
    activeSessionId: topicId ?? null,
    activeSessionTitle: sessionData?.chatSession?.title ?? '',
    messages: state.messages,
    model: currentModel,
    input,
    setInput,
    phase: state.phase,
    error: state.error,
    topicLoading: sessionLoading && state.messages.length === 0,
    messageViewportRef,
    selectSession,
    createNewSession,
    archiveSession,
    deleteSession,
    send,
  };
}
