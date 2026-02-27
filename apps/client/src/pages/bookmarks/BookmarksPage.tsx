import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { App, Button, Card, Empty, List, Pagination, Space, Tag, Typography } from 'antd';
import { StarFilled, LikeOutlined, MessageOutlined } from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import { createExcerpt } from '@blog-fullstack/content-utils';
import {
  MyBookmarksDocument,
  MyBookmarksTotalDocument,
  ToggleBookmarkDocument,
} from '@/graphql/codegen';
import { useTranslation } from 'react-i18next';

const { Text, Title } = Typography;
const PAGE_SIZE = 10;

export function BookmarksPage() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const location = useLocation();
  const [page, setPage] = useState(1);

  const { data, loading } = useQuery(MyBookmarksDocument, {
    variables: { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE },
    fetchPolicy: 'cache-and-network',
  });
  const { data: totalData } = useQuery(MyBookmarksTotalDocument, {
    fetchPolicy: 'cache-and-network',
  });

  const [toggleBookmark] = useMutation(ToggleBookmarkDocument, {
    refetchQueries: [MyBookmarksDocument, MyBookmarksTotalDocument],
  });

  const handleUnbookmark = async (postId: string) => {
    await toggleBookmark({ variables: { postId } });
    message.success(t('interaction.unbookmarkSuccess'));
  };

  return (
    <Card>
      <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}>
        {t('bookmarks.pageTitle')}
      </Title>
      <div style={{ marginBottom: 12 }}>
        <Text type="secondary">
          {t('posts.meta.totalCount', { count: totalData?.myBookmarksTotal ?? 0 })}
        </Text>
      </div>

      <List
        loading={loading}
        dataSource={data?.myBookmarks ?? []}
        locale={{ emptyText: <Empty description={t('bookmarks.empty')} /> }}
        renderItem={item => (
          <List.Item
            actions={[
              <Button
                key="unbookmark"
                type="link"
                size="small"
                icon={<StarFilled style={{ color: '#faad14' }} />}
                onClick={() => handleUnbookmark(item.id)}
              >
                {t('interaction.unbookmark')}
              </Button>,
            ]}
          >
            <List.Item.Meta
              title={
                <Link
                  to={`/posts/${item.id}?from=${encodeURIComponent(`${location.pathname}${location.search}`)}`}
                >
                  {item.title}
                </Link>
              }
              description={
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text type="secondary">{createExcerpt(item.content, 160)}</Text>
                  <Space wrap size={[8, 4]}>
                    {item.topic ? <Tag>{item.topic}</Tag> : null}
                    {item.subtopic ? <Tag>{item.subtopic}</Tag> : null}
                    <Text type="secondary">
                      {item.author.nickname || item.author.email.split('@')[0]}
                    </Text>
                    <Text type="secondary">{dayjs(item.createdAt).format('YYYY-MM-DD')}</Text>
                    {item.interactionInfo && (
                      <>
                        <Text type="secondary">
                          <LikeOutlined /> {item.interactionInfo.likeCount}
                        </Text>
                        <Text type="secondary">
                          <MessageOutlined /> {item.interactionInfo.commentCount}
                        </Text>
                      </>
                    )}
                  </Space>
                </Space>
              }
            />
          </List.Item>
        )}
      />

      {(totalData?.myBookmarksTotal ?? 0) > PAGE_SIZE && (
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <Pagination
            current={page}
            total={totalData?.myBookmarksTotal ?? 0}
            pageSize={PAGE_SIZE}
            showSizeChanger={false}
            onChange={setPage}
          />
        </div>
      )}
    </Card>
  );
}
