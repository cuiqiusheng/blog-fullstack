import { Alert, Empty, Spin, Typography } from 'antd';
import dayjs from 'dayjs';
import { ChatRole } from '@/graphql/codegen';
import { MarkdownRenderer } from '@blog-fullstack/markdown-renderer';
import type { UiChatMessage } from './types';
const { Paragraph, Text } = Typography;

interface ChatThreadProps {
  title: string;
  subtitle: string;
  error: string | null;
  loading: boolean;
  hasActiveSession: boolean;
  emptyHint: string;
  pickHint: string;
  messages: UiChatMessage[];
  model: string | null;
  viewportRef: React.RefObject<HTMLDivElement | null>;
  userLabel: string;
  assistantLabel: string;
  /** Wider message bubbles for narrow screens. */
  compactBubble?: boolean;
}

export function ChatThread(props: ChatThreadProps) {
  const {
    title,
    subtitle,
    error,
    loading,
    hasActiveSession,
    emptyHint,
    pickHint,
    messages,
    model,
    viewportRef,
    userLabel,
    assistantLabel,
    compactBubble = false,
  } = props;

  const subtitleText = model ? `${subtitle} ${model}` : subtitle;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        minWidth: 0,
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <Text type="secondary">{title ? `${title} · ${subtitleText}` : subtitleText}</Text>
      {error ? <Alert type="error" message={error} showIcon /> : null}
      <div
        ref={viewportRef}
        style={{
          border: '1px solid #f0f0f0',
          borderRadius: 8,
          padding: 12,
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
        }}
      >
        {!hasActiveSession ? (
          <Empty description={pickHint} />
        ) : loading && messages.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
            <Spin />
          </div>
        ) : messages.length === 0 ? (
          <Text type="secondary">{emptyHint}</Text>
        ) : (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((message, index) => (
              <div
                key={`${message.id}-${message.role}-${index}`}
                style={{
                  display: 'flex',
                  justifyContent: message.role === ChatRole.User ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: compactBubble ? '92%' : '80%',
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
                      {message.role === ChatRole.User ? userLabel : assistantLabel}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(message.createdAt).format('HH:mm')}
                    </Text>
                  </div>
                  {message.role === ChatRole.Assistant ? (
                    <MarkdownRenderer content={message.content} className="ai-chat-markdown" />
                  ) : (
                    <Paragraph style={{ marginBottom: 0, marginTop: 0, whiteSpace: 'pre-wrap' }}>
                      {message.content}
                    </Paragraph>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
