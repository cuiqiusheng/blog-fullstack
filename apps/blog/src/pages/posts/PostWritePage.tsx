import { useRef, useState } from 'react';
import { Alert, Button, Collapse, Input, Space, Card, App, Spin, Tooltip } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@apollo/client/react';
import { Editor, type TableBubbleLabels, type ToolbarLabels } from '@blog-fullstack/editor';
import { MarkdownRenderer } from '@blog-fullstack/markdown-renderer';
import { uploadImage } from '@/lib/upload';
import {
  CreatePostDocument,
  UpdatePostDocument,
  PostDocument,
  PostsDocument,
  PostsTotalDocument,
  PostStatus,
  PostVisibility,
} from '@/graphql/codegen';
import { useCurrentUser } from '@/shared/hooks';
import './postWrite.css';

const PREVIEW_LONG_PRESS_MS = 500;

export function PostWritePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const { currentUser } = useCurrentUser();

  const toolbarLabels: ToolbarLabels = {
    heading1: t('editor.heading1'),
    heading2: t('editor.heading2'),
    heading3: t('editor.heading3'),
    bold: t('editor.bold'),
    italic: t('editor.italic'),
    strikethrough: t('editor.strikethrough'),
    inlineCode: t('editor.inlineCode'),
    bulletList: t('editor.bulletList'),
    orderedList: t('editor.orderedList'),
    taskList: t('editor.taskList'),
    blockquote: t('editor.blockquote'),
    codeBlock: t('editor.codeBlock'),
    horizontalRule: t('editor.horizontalRule'),
    insertImage: t('editor.insertImage'),
    insertLink: t('editor.insertLink'),
    insertTable: t('editor.insertTable'),
    undo: t('editor.undo'),
    redo: t('editor.redo'),
  };

  const tableBubbleLabels: TableBubbleLabels = {
    tableContextToolbar: t('editor.tableContextToolbar'),
    addRowBefore: t('editor.tableAddRowBefore'),
    addRowAfter: t('editor.tableAddRowAfter'),
    addColumnBefore: t('editor.tableAddColumnBefore'),
    addColumnAfter: t('editor.tableAddColumnAfter'),
    deleteRow: t('editor.tableDeleteRow'),
    deleteColumn: t('editor.tableDeleteColumn'),
    deleteTable: t('editor.tableDeleteTable'),
  };

  const { data: postData, loading: postLoading } = useQuery(PostDocument, {
    variables: { id: id ?? '' },
    skip: !isEditMode,
  });

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState('');
  const [subtopic, setSubtopic] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [privatePublishUnlocked, setPrivatePublishUnlocked] = useState(false);
  const [initializedFor, setInitializedFor] = useState<string | null>(null);
  const previewLongPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextPreviewToggleRef = useRef(false);

  const clearPreviewLongPress = () => {
    if (previewLongPressTimerRef.current != null) {
      clearTimeout(previewLongPressTimerRef.current);
      previewLongPressTimerRef.current = null;
    }
  };

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
    refetchQueries: [
      ...refetchQueries,
      ...(id ? [{ query: PostDocument, variables: { id } }] : []),
    ],
    awaitRefetchQueries: true,
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

  const buildCreateInput = (status: PostStatus, visibility?: PostVisibility) => ({
    title: title.trim(),
    content,
    ...(topic.trim() && { topic: topic.trim() }),
    ...(subtopic.trim() && { subtopic: subtopic.trim() }),
    status,
    ...(visibility && { visibility }),
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
    const keepPrivate = existingPost?.visibility === PostVisibility.Private;
    try {
      if (isEditMode) {
        await updatePost({
          variables: {
            id: id!,
            input: {
              ...buildUpdateInput(PostStatus.Published),
              ...(keepPrivate ? { visibility: PostVisibility.Private } : {}),
            },
          },
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

  const handlePublishPrivate = async () => {
    if (!validate()) return;
    try {
      const { data: published } = await createPost({
        variables: {
          input: buildCreateInput(PostStatus.Published, PostVisibility.Private),
        },
      });
      message.success(t('posts.write.published'));
      navigate(`/posts/${published?.createPost.id}`);
    } catch {
      message.error(t('posts.write.saveFailed'));
    }
  };

  const handleUpdatePublishedPrivate = async () => {
    if (!validate()) return;
    try {
      await updatePost({ variables: { id: id!, input: buildUpdateInput() } });
      message.success(t('posts.write.updated'));
      navigate(`/posts/${id}`);
    } catch {
      message.error(t('posts.write.saveFailed'));
    }
  };

  const handleMakePublic = async () => {
    if (!validate()) return;
    try {
      await updatePost({
        variables: {
          id: id!,
          input: { ...buildUpdateInput(), visibility: PostVisibility.Public },
        },
      });
      message.success(t('posts.write.madePublicSuccess'));
      navigate(`/posts/${id}`);
    } catch {
      message.error(t('posts.write.saveFailed'));
    }
  };

  const openMakePublicConfirm = () => {
    modal.confirm({
      title: t('posts.write.makePublicConfirmTitle'),
      content: t('posts.write.makePublicConfirmContent'),
      okText: t('posts.write.makePublicOk'),
      cancelText: t('common.cancel'),
      onOk: () => handleMakePublic(),
    });
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
      if (existingPost?.visibility === PostVisibility.Private) {
        return (
          <>
            <Tooltip title={t('posts.write.saveAsPrivateTooltip')}>
              <Button onClick={handleUpdatePublishedPrivate} loading={saving}>
                {t('posts.write.saveAsPrivate')}
              </Button>
            </Tooltip>
            <Button type="primary" onClick={openMakePublicConfirm} loading={saving}>
              {t('posts.write.makePublic')}
            </Button>
          </>
        );
      }
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
        {!isEditMode && privatePublishUnlocked && (
          <Tooltip title={t('posts.write.privatePublishTooltip')}>
            <Button onClick={handlePublishPrivate} loading={saving}>
              {t('posts.write.publishPrivate')}
            </Button>
          </Tooltip>
        )}
      </>
    );
  };

  return (
    <div className="post-write">
      <div className="post-write__header">
        <Button onClick={() => navigate(isEditMode ? `/posts/${id}` : '/posts')}>
          {isEditMode ? t('posts.write.cancelEdit') : t('posts.detail.backToList')}
        </Button>
        <Space>
          <Button
            onClick={e => {
              if (skipNextPreviewToggleRef.current) {
                skipNextPreviewToggleRef.current = false;
                return;
              }
              if (e.shiftKey) {
                e.preventDefault();
                setPrivatePublishUnlocked(true);
                return;
              }
              setShowPreview(v => !v);
            }}
            onTouchStart={() => {
              clearPreviewLongPress();
              previewLongPressTimerRef.current = setTimeout(() => {
                previewLongPressTimerRef.current = null;
                setPrivatePublishUnlocked(true);
                skipNextPreviewToggleRef.current = true;
              }, PREVIEW_LONG_PRESS_MS);
            }}
            onTouchEnd={clearPreviewLongPress}
            onTouchCancel={clearPreviewLongPress}
          >
            {t('posts.write.preview')}
          </Button>
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
          toolbarLabels={toolbarLabels}
          tableBubbleLabels={tableBubbleLabels}
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
