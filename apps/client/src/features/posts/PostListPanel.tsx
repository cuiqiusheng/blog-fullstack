import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { Card, Empty, Input, List, Pagination, Select, Space, Tag, Typography } from 'antd';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { createExcerpt, estimateReadMinutes } from '@blog-fullstack/content-utils';
import {
  PostsDocument,
  PostsTotalDocument,
  PostStatus,
  PostSortField,
  SortDirection,
} from '@/graphql/codegen';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

export interface PostListPanelProps {
  mode: 'all' | 'mine';
  title: string;
}

const PAGE_SIZE = 10;

const statusOptions = [
  { value: PostStatus.Published, labelKey: 'posts.status.published' },
  { value: PostStatus.Draft, labelKey: 'posts.status.draft' },
  { value: PostStatus.Archived, labelKey: 'posts.status.archived' },
];

const sortFieldOptions = [
  { value: PostSortField.CreatedAt, labelKey: 'posts.filter.sortByCreatedAt' },
  { value: PostSortField.UpdatedAt, labelKey: 'posts.filter.sortByUpdatedAt' },
  { value: PostSortField.Subtopic, labelKey: 'posts.filter.sortBySubtopic' },
];

const sortDirectionOptions = [
  { value: SortDirection.Asc, labelKey: 'posts.filter.sortDirectionAsc' },
  { value: SortDirection.Desc, labelKey: 'posts.filter.sortDirectionDesc' },
];

function statusColor(status: PostStatus): string {
  switch (status) {
    case PostStatus.Published:
      return 'green';
    case PostStatus.Draft:
      return 'orange';
    default:
      return 'default';
  }
}

export function PostListPanel({ mode, title }: PostListPanelProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramPrefix = mode === 'mine' ? 'mine' : 'all';
  const pageKey = `${paramPrefix}Page`;
  const searchKey = `${paramPrefix}Search`;
  const topicKey = `${paramPrefix}Topic`;
  const subtopicKey = `${paramPrefix}Subtopic`;
  const statusKey = `${paramPrefix}Status`;
  const sortByKey = `${paramPrefix}SortBy`;
  const sortDirectionKey = `${paramPrefix}SortDirection`;

  const [search, setSearch] = useState(() => searchParams.get(searchKey) ?? '');
  const [topic, setTopic] = useState(() => searchParams.get(topicKey) ?? '');
  const [subtopic, setSubtopic] = useState(() => searchParams.get(subtopicKey) ?? '');
  const [topicInput, setTopicInput] = useState(() => searchParams.get(topicKey) ?? '');
  const [subtopicInput, setSubtopicInput] = useState(() => searchParams.get(subtopicKey) ?? '');
  const [status, setStatus] = useState<PostStatus | undefined>(() => {
    const value = searchParams.get(statusKey);
    if (
      value === PostStatus.Published ||
      value === PostStatus.Draft ||
      value === PostStatus.Archived
    ) {
      return value;
    }
    return PostStatus.Published;
  });
  const [sortBy, setSortBy] = useState<PostSortField | undefined>(() => {
    const value = searchParams.get(sortByKey);
    if (
      value === PostSortField.CreatedAt ||
      value === PostSortField.UpdatedAt ||
      value === PostSortField.Subtopic
    ) {
      return value;
    }
    return undefined;
  });
  const [sortDirection, setSortDirection] = useState<SortDirection | undefined>(() => {
    const value = searchParams.get(sortDirectionKey);
    if (value === SortDirection.Asc || value === SortDirection.Desc) {
      return value;
    }
    return undefined;
  });
  const [page, setPage] = useState(() => {
    const raw = Number(searchParams.get(pageKey) ?? 1);
    return Number.isFinite(raw) && raw > 0 ? raw : 1;
  });

  const applyParams = (patch: {
    page?: number;
    search?: string;
    topic?: string;
    subtopic?: string;
    status?: PostStatus | undefined;
    sortBy?: PostSortField | undefined;
    sortDirection?: SortDirection | undefined;
  }) => {
    const next = new URLSearchParams(searchParams);
    const nextPage = patch.page ?? page;
    const nextSearch = patch.search ?? search;
    const nextTopic = patch.topic ?? topic;
    const nextSubtopic = patch.subtopic ?? subtopic;
    const nextStatus = Object.prototype.hasOwnProperty.call(patch, 'status')
      ? patch.status
      : status;
    const nextSortBy = Object.prototype.hasOwnProperty.call(patch, 'sortBy')
      ? patch.sortBy
      : sortBy;
    const nextSortDirection = Object.prototype.hasOwnProperty.call(patch, 'sortDirection')
      ? patch.sortDirection
      : sortDirection;

    if (nextPage > 1) {
      next.set(pageKey, String(nextPage));
    } else {
      next.delete(pageKey);
    }
    if (nextSearch) {
      next.set(searchKey, nextSearch);
    } else {
      next.delete(searchKey);
    }
    if (nextTopic) {
      next.set(topicKey, nextTopic);
    } else {
      next.delete(topicKey);
    }
    if (nextSubtopic) {
      next.set(subtopicKey, nextSubtopic);
    } else {
      next.delete(subtopicKey);
    }
    if (nextStatus) {
      next.set(statusKey, nextStatus);
    } else {
      next.delete(statusKey);
    }
    if (nextSortBy) {
      next.set(sortByKey, nextSortBy);
    } else {
      next.delete(sortByKey);
    }
    if (nextSortDirection) {
      next.set(sortDirectionKey, nextSortDirection);
    } else {
      next.delete(sortDirectionKey);
    }
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const normalizedTopic = topicInput.trim();
      const normalizedSubtopic = subtopicInput.trim();
      if (normalizedTopic === topic && normalizedSubtopic === subtopic) {
        return;
      }
      setPage(1);
      setTopic(normalizedTopic);
      setSubtopic(normalizedSubtopic);
      const next = new URLSearchParams(searchParams);
      if (search) {
        next.set(searchKey, search);
      } else {
        next.delete(searchKey);
      }
      if (normalizedTopic) {
        next.set(topicKey, normalizedTopic);
      } else {
        next.delete(topicKey);
      }
      if (normalizedSubtopic) {
        next.set(subtopicKey, normalizedSubtopic);
      } else {
        next.delete(subtopicKey);
      }
      if (status) {
        next.set(statusKey, status);
      } else {
        next.delete(statusKey);
      }
      if (sortBy) {
        next.set(sortByKey, sortBy);
      } else {
        next.delete(sortByKey);
      }
      if (sortDirection) {
        next.set(sortDirectionKey, sortDirection);
      } else {
        next.delete(sortDirectionKey);
      }
      next.delete(pageKey);
      if (next.toString() !== searchParams.toString()) {
        setSearchParams(next, { replace: true });
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [
    topicInput,
    subtopicInput,
    topic,
    subtopic,
    search,
    status,
    sortBy,
    sortDirection,
    pageKey,
    searchKey,
    topicKey,
    subtopicKey,
    statusKey,
    sortByKey,
    sortDirectionKey,
    searchParams,
    setSearchParams,
  ]);

  const offset = (page - 1) * PAGE_SIZE;
  const baseVariables = useMemo(
    () => ({
      mine: mode === 'mine',
      topic: topic || undefined,
      subtopic: subtopic || undefined,
      search: search || undefined,
      status,
      sortBy,
      sortDirection,
    }),
    [mode, topic, subtopic, search, status, sortBy, sortDirection],
  );

  const { data, loading } = useQuery(PostsDocument, {
    variables: {
      ...baseVariables,
      limit: PAGE_SIZE,
      offset,
    },
    fetchPolicy: 'cache-and-network',
  });

  const { data: totalData } = useQuery(PostsTotalDocument, {
    variables: baseVariables,
    fetchPolicy: 'cache-and-network',
  });

  return (
    <Card title={title}>
      <div style={{ marginBottom: 12 }}>
        <Text type="secondary">
          {t('posts.meta.totalCount', { count: totalData?.postsTotal ?? 0 })}
        </Text>
      </div>
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder={t('posts.filter.searchPlaceholder')}
          allowClear
          style={{ width: 240 }}
          onSearch={value => {
            const nextSearch = value.trim();
            setPage(1);
            setSearch(nextSearch);
            applyParams({ page: 1, search: nextSearch });
          }}
        />
        <Input
          placeholder={t('posts.filter.topic')}
          allowClear
          value={topicInput}
          style={{ width: 160 }}
          onChange={event => {
            setTopicInput(event.target.value);
          }}
        />
        <Input
          placeholder={t('posts.filter.subtopic')}
          allowClear
          value={subtopicInput}
          style={{ width: 160 }}
          onChange={event => {
            setSubtopicInput(event.target.value);
          }}
        />
        <Select<PostStatus | undefined>
          allowClear
          placeholder={`${t('posts.filter.status')} (${t('posts.filter.allStatus')})`}
          style={{ width: 180 }}
          value={status}
          onChange={value => {
            setPage(1);
            setStatus(value);
            applyParams({ page: 1, status: value });
          }}
          options={statusOptions.map(option => ({
            value: option.value,
            label: t(option.labelKey),
          }))}
        />
        <Select<PostSortField | undefined>
          allowClear
          placeholder={t('posts.filter.sortBy')}
          style={{ width: 180 }}
          value={sortBy}
          onChange={value => {
            setPage(1);
            setSortBy(value);
            applyParams({ page: 1, sortBy: value });
          }}
          options={sortFieldOptions.map(option => ({
            value: option.value,
            label: t(option.labelKey),
          }))}
        />
        <Select<SortDirection | undefined>
          allowClear
          placeholder={t('posts.filter.sortDirection')}
          style={{ width: 160 }}
          value={sortDirection}
          onChange={value => {
            setPage(1);
            setSortDirection(value);
            applyParams({ page: 1, sortDirection: value });
          }}
          options={sortDirectionOptions.map(option => ({
            value: option.value,
            label: t(option.labelKey),
          }))}
        />
      </Space>

      <List
        loading={loading}
        dataSource={data?.posts ?? []}
        locale={{ emptyText: <Empty description={t('posts.empty')} /> }}
        renderItem={item => (
          <List.Item>
            <List.Item.Meta
              title={
                <Space size={8} wrap>
                  {item.seriesOrder != null ? (
                    <Tag color="blue">
                      {t('posts.meta.seriesOrder', { order: item.seriesOrder })}
                    </Tag>
                  ) : null}
                  <Link
                    to={`/posts/${item.id}?from=${encodeURIComponent(`${location.pathname}${location.search}`)}`}
                  >
                    {item.title}
                  </Link>
                </Space>
              }
              description={
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text type="secondary">{createExcerpt(item.content, 160)}</Text>
                  <Space wrap size={[8, 4]}>
                    <Tag color={statusColor(item.status)}>
                      {t(`posts.status.${item.status.toLowerCase()}`)}
                    </Tag>
                    {item.topic ? <Tag>{item.topic}</Tag> : null}
                    {item.subtopic ? <Tag>{item.subtopic}</Tag> : null}
                    <Text type="secondary">
                      {t('posts.meta.author')}: {item.author.email}
                    </Text>
                    <Text type="secondary">
                      {t('posts.meta.createdAt')}:{' '}
                      {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
                    </Text>
                    <Text type="secondary">
                      {t('posts.meta.readTime')}: {estimateReadMinutes(item.content)}{' '}
                      {t('posts.meta.minuteUnit')}
                    </Text>
                  </Space>
                </Space>
              }
            />
          </List.Item>
        )}
      />

      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Pagination
          current={page}
          total={totalData?.postsTotal ?? 0}
          pageSize={PAGE_SIZE}
          showSizeChanger={false}
          onChange={nextPage => {
            setPage(nextPage);
            applyParams({ page: nextPage });
          }}
        />
      </div>
    </Card>
  );
}
