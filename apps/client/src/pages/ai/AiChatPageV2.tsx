import { Card } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  ChatComposer,
  ChatThread,
  TopicSidebar,
  useChatSessionController,
} from '@/features/ai-chat';
import './ai.css';

export function AiChatPageV2() {
  const { t } = useTranslation();
  const controller = useChatSessionController();

  return (
    <div
      style={{
        maxWidth: 1120,
        margin: '0 auto',
        width: '100%',
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
            flexDirection: 'row',
            gap: 16,
            height: '100%',
          }}
        >
          <TopicSidebar
            loading={controller.sessionsLoading}
            items={controller.sessions.map(item => ({
              id: item.id,
              title: item.title,
              updatedAt: item.lastMessageAt ?? item.updatedAt,
            }))}
            activeId={controller.activeSessionId}
            actionPendingId={controller.actionPendingId}
            emptyText={t('ai.chat.emptyTopic')}
            historyTitle={t('ai.chat.history')}
            newText={t('ai.chat.new')}
            archiveText={t('ai.chat.archive')}
            deleteText={t('ai.chat.delete')}
            archiveConfirmText={t('ai.chat.archiveConfirm')}
            deleteConfirmText={t('ai.chat.deleteConfirm')}
            onSelect={controller.selectSession}
            onCreateNew={controller.createNewSession}
            onArchive={sessionId => {
              void controller.archiveSession(sessionId);
            }}
            onDelete={sessionId => {
              void controller.deleteSession(sessionId);
            }}
          />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <ChatThread
              title={controller.activeSessionTitle}
              subtitle={t('ai.chat.subtitle')}
              error={controller.error}
              loading={controller.topicLoading}
              hasActiveSession={Boolean(controller.activeSessionId)}
              emptyHint={t('ai.chat.empty')}
              pickHint={t('ai.chat.pickOrStart')}
              messages={controller.messages}
              viewportRef={controller.messageViewportRef}
              userLabel={t('ai.chat.user')}
              assistantLabel={t('ai.chat.assistant')}
            />
            <ChatComposer
              value={controller.input}
              loading={controller.phase === 'streaming'}
              placeholder={t('ai.chat.inputPlaceholder')}
              sendText={t('ai.chat.send')}
              onChange={controller.setInput}
              onSend={() => {
                void controller.send();
              }}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
