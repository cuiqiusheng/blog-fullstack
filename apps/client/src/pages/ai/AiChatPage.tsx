import { useEffect, useRef, useState } from 'react';
import { useApolloClient } from '@apollo/client/react';
import { Alert, Button, Card, Input, Typography } from 'antd';
import { AiChatStreamDocument, ChatRole } from '@/graphql/codegen';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { MarkdownRenderer } from '@blog-fullstack/markdown-renderer';
import './ai.css';

const { Paragraph, Text } = Typography;

interface ChatMessage {
  role: ChatRole.User | ChatRole.Assistant;
  content: string;
  createdAt: string;
}

export function AiChatPage() {
  const { t } = useTranslation();
  const apolloClient = useApolloClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const activeStreamRef = useRef<{ unsubscribe: () => void } | null>(null);
  const activeStreamIdRef = useRef<string | null>(null);
  const processedSeqRef = useRef<Set<number>>(new Set());
  const messageViewportRef = useRef<HTMLDivElement | null>(null);

  const scrollMessagesToBottom = () => {
    const viewport = messageViewportRef.current;
    if (!viewport) {
      return;
    }
    viewport.scrollTop = viewport.scrollHeight;
  };

  useEffect(
    () => () => {
      activeStreamRef.current?.unsubscribe();
      activeStreamRef.current = null;
      activeStreamIdRef.current = null;
      processedSeqRef.current.clear();
    },
    [],
  );

  useEffect(() => {
    if (!loading) {
      return;
    }
    const taskId = window.requestAnimationFrame(() => {
      scrollMessagesToBottom();
    });
    return () => {
      window.cancelAnimationFrame(taskId);
    };
  }, [messages, loading]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || loading) {
      return;
    }

    setError(null);
    const userMessage: ChatMessage = {
      role: ChatRole.User,
      content,
      createdAt: new Date().toISOString(),
    };
    const assistantMessage: ChatMessage = {
      role: ChatRole.Assistant,
      content: '',
      createdAt: new Date().toISOString(),
    };
    const nextMessages: ChatMessage[] = [...messages, userMessage, assistantMessage];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const payload = [...messages, userMessage].map(message => ({
        role: message.role,
        content: message.content,
      }));

      activeStreamRef.current?.unsubscribe();
      const assistantIndex = nextMessages.length - 1;
      const streamId = `${Date.now()}-${Math.random()}`;
      activeStreamIdRef.current = streamId;
      processedSeqRef.current = new Set<number>();
      const streamSub = apolloClient
        .subscribe({
          query: AiChatStreamDocument,
          variables: {
            messages: payload,
          },
        })
        .subscribe({
          next: result => {
            const event = result.data?.aiChatStream;
            if (!event || activeStreamIdRef.current !== streamId) {
              return;
            }
            if (processedSeqRef.current.has(event.seq)) {
              return;
            }
            processedSeqRef.current.add(event.seq);
            if (event.error) {
              setError(event.error);
            }
            setMessages(current => {
              const target = current[assistantIndex];
              if (!target || target.role !== ChatRole.Assistant) {
                return current;
              }
              return current.map((message, index) => {
                if (index !== assistantIndex) {
                  return message;
                }
                return {
                  ...message,
                  content: `${message.content}${event.chunk}`,
                  createdAt: event.createdAt,
                };
              });
            });
            if (event.done) {
              setLoading(false);
              streamSub.unsubscribe();
              if (activeStreamIdRef.current === streamId) {
                activeStreamRef.current = null;
                activeStreamIdRef.current = null;
                processedSeqRef.current.clear();
              }
            }
          },
          error: streamError => {
            setError(
              streamError instanceof Error ? streamError.message : t('ai.chat.requestFailed'),
            );
            setLoading(false);
            if (activeStreamIdRef.current === streamId) {
              activeStreamRef.current = null;
              activeStreamIdRef.current = null;
              processedSeqRef.current.clear();
            }
          },
          complete: () => {
            setLoading(false);
            if (activeStreamIdRef.current === streamId) {
              activeStreamRef.current = null;
              activeStreamIdRef.current = null;
              processedSeqRef.current.clear();
            }
          },
        });
      activeStreamRef.current = streamSub;
    } catch (e) {
      const message = e instanceof Error ? e.message : t('ai.chat.requestFailed');
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 860,
        margin: '0 auto',
        width: '100%',
        // AppLayout: Header 64px + Content vertical padding 24px * 2
        height: 'calc(100dvh - 64px - 48px)',
        minHeight: 520,
      }}
    >
      <Card
        title={t('ai.chat.title')}
        style={{ height: '100%' }}
        bodyStyle={{
          height: 'calc(100% - 56px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            height: '100%',
          }}
        >
          <Text type="secondary">{t('ai.chat.subtitle')}</Text>
          {error ? <Alert type="error" message={error} showIcon /> : null}
          <div
            ref={messageViewportRef}
            style={{
              border: '1px solid #f0f0f0',
              borderRadius: 8,
              padding: 12,
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
            }}
          >
            {messages.length === 0 ? (
              <Text type="secondary">{t('ai.chat.empty')}</Text>
            ) : (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    style={{
                      display: 'flex',
                      justifyContent: message.role === ChatRole.User ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '80%',
                        borderRadius: 12,
                        padding: '8px 12px',
                        background:
                          message.role === ChatRole.User
                            ? 'rgba(22, 119, 255, 0.12)'
                            : 'rgba(0, 0, 0, 0.04)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          gap: 8,
                          alignItems: 'center',
                          marginBottom: 4,
                        }}
                      >
                        <Text strong style={{ fontSize: 12 }}>
                          {message.role === ChatRole.User
                            ? t('ai.chat.user')
                            : t('ai.chat.assistant')}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(message.createdAt).format('HH:mm')}
                        </Text>
                      </div>
                      {message.role === ChatRole.Assistant ? (
                        <MarkdownRenderer content={message.content} className="ai-chat-markdown" />
                      ) : (
                        <Paragraph
                          style={{ marginBottom: 0, marginTop: 0, whiteSpace: 'pre-wrap' }}
                        >
                          {message.content}
                        </Paragraph>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Input.TextArea
            value={input}
            rows={4}
            placeholder={t('ai.chat.inputPlaceholder')}
            onChange={event => setInput(event.target.value)}
            onPressEnter={event => {
              if (!event.shiftKey) {
                event.preventDefault();
                void handleSend();
              }
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="primary" loading={loading} onClick={() => void handleSend()}>
              {t('ai.chat.send')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
