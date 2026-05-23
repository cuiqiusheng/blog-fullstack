import { Button, Dropdown, List, Popconfirm, Space, Spin, Typography } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';

const { Text } = Typography;

export interface TopicSidebarItem {
  id: string;
  title: string;
  updatedAt: string;
}

interface TopicSidebarProps {
  loading: boolean;
  items: TopicSidebarItem[];
  activeId: string | null;
  actionPendingId: string | null;
  /** Show outer border and border-radius. Default `true`. Set `false` when rendered inside a Drawer. */
  bordered?: boolean;
  emptyText: string;
  historyTitle: string;
  newText: string;
  archiveText: string;
  deleteText: string;
  archiveConfirmText: string;
  deleteConfirmText: string;
  onSelect: (id: string) => void;
  onCreateNew: () => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TopicSidebar(props: TopicSidebarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const {
    loading,
    items,
    activeId,
    actionPendingId,
    bordered = true,
    emptyText,
    historyTitle,
    newText,
    archiveText,
    deleteText,
    archiveConfirmText,
    deleteConfirmText,
    onSelect,
    onCreateNew,
    onArchive,
    onDelete,
  } = props;

  return (
    <div
      style={{
        ...(bordered && { border: '1px solid #f0f0f0', borderRadius: 8 }),
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        height: '100%',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text strong>{historyTitle}</Text>
        <Button size="small" onClick={onCreateNew}>
          {newText}
        </Button>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
            <Spin size="small" />
          </div>
        ) : (
          <List
            dataSource={items}
            rowKey="id"
            locale={{ emptyText }}
            renderItem={item => (
              <List.Item
                onMouseEnter={() => {
                  setHoveredId(item.id);
                }}
                onMouseLeave={() => {
                  setHoveredId(null);
                }}
                onClick={() => {
                  onSelect(item.id);
                }}
                style={{
                  cursor: 'pointer',
                  borderRadius: 8,
                  padding: '8px 10px',
                  marginBottom: 6,
                  border:
                    item.id === activeId
                      ? '1px solid rgba(22, 119, 255, 0.5)'
                      : '1px solid transparent',
                  background:
                    item.id === activeId ? 'rgba(22, 119, 255, 0.08)' : 'rgba(0, 0, 0, 0.01)',
                }}
              >
                <List.Item.Meta
                  title={<Text ellipsis>{item.title}</Text>}
                  description={dayjs(item.updatedAt).format('YYYY-MM-DD HH:mm')}
                />
                <Dropdown
                  trigger={['click']}
                  placement="bottomRight"
                  dropdownRender={() => (
                    <Space
                      direction="vertical"
                      size={4}
                      style={{
                        background: '#fff',
                        border: '1px solid #f0f0f0',
                        borderRadius: 8,
                        padding: 6,
                        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.08)',
                      }}
                      onClick={event => event.stopPropagation()}
                    >
                      <Popconfirm
                        title={archiveConfirmText}
                        onConfirm={event => {
                          event?.stopPropagation();
                          onArchive(item.id);
                        }}
                      >
                        <Button
                          size="small"
                          type="text"
                          block
                          loading={actionPendingId === item.id}
                          onClick={event => {
                            event.stopPropagation();
                          }}
                        >
                          {archiveText}
                        </Button>
                      </Popconfirm>
                      <Popconfirm
                        title={deleteConfirmText}
                        okButtonProps={{ danger: true }}
                        onConfirm={event => {
                          event?.stopPropagation();
                          onDelete(item.id);
                        }}
                      >
                        <Button
                          size="small"
                          type="text"
                          danger
                          block
                          loading={actionPendingId === item.id}
                          onClick={event => {
                            event.stopPropagation();
                          }}
                        >
                          {deleteText}
                        </Button>
                      </Popconfirm>
                    </Space>
                  )}
                >
                  <Button
                    size="small"
                    type="text"
                    loading={actionPendingId === item.id}
                    style={{
                      visibility:
                        hoveredId === item.id || item.id === activeId || actionPendingId === item.id
                          ? 'visible'
                          : 'hidden',
                    }}
                    onClick={event => {
                      event.stopPropagation();
                    }}
                  >
                    ...
                  </Button>
                </Dropdown>
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );
}
