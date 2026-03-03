import { useState } from 'react';
import { Alert, Button, Collapse, Input, Space, Card, App, Spin } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@apollo/client/react';
import { Editor } from '@blog-fullstack/editor';
import { MarkdownRenderer } from '@blog-fullstack/markdown-renderer';
import { uploadImage } from '@/lib/upload';
import {
  CreatePostDocument,
  UpdatePostDocument,
  PostDocument,
  PostsDocument,
  PostsTotalDocument,
  PostStatus,
} from '@/graphql/codegen';
import { useCurrentUser } from '@/shared/hooks';
import './postWrite.css';

export function PostWritePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const { currentUser } = useCurrentUser();

  const { data: postData, loading: postLoading } = useQuery(PostDocument, {
    variables: { id: id ?? '' },
    skip: !isEditMode,
  });

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState('');
  const [subtopic, setSubtopic] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [initializedFor, setInitializedFor] = useState<string | null>(null);

  if (isEditMode && postData?.post && initializedFor !== id) {
    setInitializedFor(id!);
    setTitle(postData.post.title);
    setContent(postData.post.content);
    setTopic(postData.post.topic ?? '');
    setSubtopic(postData.post.subtopic ?? '');
  }

  const refetchQueries = [PostsDocument, PostsTotalDocument];

  const [createPost, { loading: createLoading }] = useMutation(CreatePostDocument, {
    refetchQueries,
  });
  const [updatePost, { loading: updateLoading }] = useMutation(UpdatePostDocument, {
    refetchQueries,
  });

  const saving = createLoading || updateLoading;
  const existingPost = postData?.post;
  const existingStatus = existingPost?.status;
  const isAuthor = !isEditMode || (existingPost && currentUser?.id === existingPost.author.id);

  if (isEditMode && postLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
        <Spin />
      </div>
    );
  }

  if (isEditMode && !existingPost) {
    return <Alert type="error" message={t('posts.write.notFound')} showIcon />;
  }

  if (isEditMode && !isAuthor) {
    return <Alert type="warning" message={t('posts.write.notAuthor')} showIcon />;
  }

  const validate = () => {
    if (!title.trim()) {
      message.warning(t('posts.write.titleRequired'));
      return false;
    }
    if (!content.trim()) {
      message.warning(t('posts.write.contentRequired'));
      return false;
    }
    return true;
  };

  const buildCreateInput = (status: PostStatus) => ({
    title: title.trim(),
    content,
    ...(topic.trim() && { topic: topic.trim() }),
    ...(subtopic.trim() && { subtopic: subtopic.trim() }),
    status,
  });

  const buildUpdateInput = (status?: PostStatus) => ({
    title: title.trim(),
    content,
    topic: topic.trim() || null,
    subtopic: subtopic.trim() || null,
    ...(status && { status }),
  });

  const handleSaveDraft = async () => {
    if (!validate()) return;
    try {
      if (isEditMode) {
        await updatePost({ variables: { id: id!, input: buildUpdateInput() } });
        message.success(t('posts.write.updated'));
        navigate(`/posts/${id}`);
      } else {
        const { data: created } = await createPost({
          variables: { input: buildCreateInput(PostStatus.Draft) },
        });
        message.success(t('posts.write.draftSaved'));
        navigate(`/posts/${created?.createPost.id}`);
      }
    } catch {
      message.error(t('posts.write.saveFailed'));
    }
  };

  const handlePublish = async () => {
    if (!validate()) return;
    try {
      if (isEditMode) {
        await updatePost({
          variables: { id: id!, input: buildUpdateInput(PostStatus.Published) },
        });
        message.success(t('posts.write.published'));
        navigate(`/posts/${id}`);
      } else {
        const { data: published } = await createPost({
          variables: { input: buildCreateInput(PostStatus.Published) },
        });
        message.success(t('posts.write.published'));
        navigate(`/posts/${published?.createPost.id}`);
      }
    } catch {
      message.error(t('posts.write.saveFailed'));
    }
  };

  const handleUpdate = async () => {
    if (!validate()) return;
    try {
      await updatePost({ variables: { id: id!, input: buildUpdateInput() } });
      message.success(t('posts.write.updated'));
      navigate(`/posts/${id}`);
    } catch {
      message.error(t('posts.write.saveFailed'));
    }
  };

  const renderActions = () => {
    if (isEditMode && existingStatus === PostStatus.Published) {
      return (
        <Button type="primary" onClick={handleUpdate} loading={saving}>
          {t('posts.write.update')}
        </Button>
      );
    }

    return (
      <>
        <Button onClick={handleSaveDraft} loading={saving}>
          {isEditMode ? t('posts.write.save') : t('posts.write.saveDraft')}
        </Button>
        <Button type="primary" onClick={handlePublish} loading={saving}>
          {t('posts.write.publish')}
        </Button>
      </>
    );
  };

  return (
    <div className="post-write">
      <div className="post-write__header">
        <Button onClick={() => navigate('/posts')}>{t('posts.detail.backToList')}</Button>
        <Space>
          <Button onClick={() => setShowPreview(v => !v)}>{t('posts.write.preview')}</Button>
          {renderActions()}
        </Space>
      </div>

      <input
        className="post-write__title-input"
        placeholder={t('posts.write.titlePlaceholder')}
        value={title}
        onChange={e => setTitle(e.target.value)}
        autoFocus
      />

      <Collapse
        className="post-write__metadata"
        size="small"
        items={[
          {
            key: 'metadata',
            label: t('posts.write.metadata'),
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input
                  placeholder={t('posts.write.topicPlaceholder')}
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                />
                <Input
                  placeholder={t('posts.write.subtopicPlaceholder')}
                  value={subtopic}
                  onChange={e => setSubtopic(e.target.value)}
                />
              </Space>
            ),
          },
        ]}
      />

      <div className="post-write__editor">
        <Editor
          content={content}
          onChange={setContent}
          onImageUpload={uploadImage}
          placeholder={t('posts.write.editorPlaceholder')}
        />
      </div>

      {showPreview && (
        <Card
          className="post-write__preview"
          title={title || t('posts.write.titlePlaceholder')}
          size="small"
        >
          <MarkdownRenderer content={content} className="post-markdown" />
        </Card>
      )}
    </div>
  );
}
