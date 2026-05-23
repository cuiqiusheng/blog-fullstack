import { useState } from 'react';
import { Button, Card, Drawer, Typography } from 'antd';
import { HistoryOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  ChatComposer,
  ChatThread,
  TopicSidebar,
  useChatSessionController,
} from '@/features/ai-chat';
import { useMobile } from '@/shared/hooks';
import './ai.css';

const { Text } = Typography;

export function AiChatPageV2() {
  const { t } = useTranslation();
  const controller = useChatSessionController();
  const isMobile = useMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleSelectSession = (id: string) => {
    controller.selectSession(id);
    setDrawerOpen(false);
  };

  const handleCreateNew = () => {
    controller.createNewSession();
    setDrawerOpen(false);
  };

  const sidebarNode = (
    <TopicSidebar
      bordered={!isMobile}
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
      onSelect={handleSelectSession}
      onCreateNew={handleCreateNew}
      onArchive={sessionId => {
        void controller.archiveSession(sessionId);
      }}
      onDelete={sessionId => {
        void controller.deleteSession(sessionId);
      }}
    />
  );

  const chatArea = (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? 8 : 16,
        minWidth: 0,
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
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
        model={controller.model}
        userLabel={t('ai.chat.user')}
        assistantLabel={t('ai.chat.assistant')}
        compactBubble={isMobile}
      />
      <ChatComposer
        value={controller.input}
        loading={controller.phase === 'streaming'}
        placeholder={t('ai.chat.inputPlaceholder')}
        sendText={t('ai.chat.send')}
        compact={isMobile}
        onChange={controller.setInput}
        onSend={() => {
          void controller.send();
        }}
      />
    </div>
  );

  if (isMobile) {
    return (
      <div className="ai-chat-mobile">
        <div className="ai-chat-mobile__toolbar">
          <Button type="text" icon={<HistoryOutlined />} onClick={() => setDrawerOpen(true)} />
          <Text strong ellipsis className="ai-chat-mobile__title">
            {controller.activeSessionTitle || t('ai.chat.title')}
          </Text>
          <Button type="text" icon={<PlusOutlined />} onClick={handleCreateNew} />
        </div>
        {chatArea}
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          placement="left"
          width={300}
          styles={{ body: { padding: 0 } }}
          title={t('ai.chat.title')}
        >
          {sidebarNode}
        </Drawer>
      </div>
    );
  }

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
          <div style={{ width: 300, flexShrink: 0 }}>{sidebarNode}</div>
          {chatArea}
        </div>
      </Card>
    </div>
  );
}
