import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { App, Button, Card, Empty, Input, List, Typography } from 'antd';
import { useSearchParams } from 'react-router-dom';
import {
  CommentsDocument,
  CommentsTotalDocument,
  CreateCommentDocument,
  DeleteCommentDocument,
  PostDocument,
} from '@/graphql/codegen';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/shared/hooks';
import { COMMENTS_PAGE_SIZE } from './commentTypes';
import { CommentItem } from './CommentItem';

const { Title } = Typography;
const { TextArea } = Input;

interface CommentSectionProps {
  postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const { currentUser } = useCurrentUser();
  const [searchParams] = useSearchParams();
  const highlightCommentId = searchParams.get('commentId');
  const [commentText, setCommentText] = useState('');
  const [commentPage, setCommentPage] = useState(1);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyHint, setReplyHint] = useState('');

  const prevHighlightRef = useRef(highlightCommentId);

  const {
    data: commentsData,
    loading: commentsLoading,
    refetch: refetchComments,
  } = useQuery(CommentsDocument, {
    variables: {
      postId,
      limit: COMMENTS_PAGE_SIZE,
      offset: (commentPage - 1) * COMMENTS_PAGE_SIZE,
    },
    fetchPolicy: 'cache-and-network',
  });
  const { data: commentsTotalData, refetch: refetchTotal } = useQuery(CommentsTotalDocument, {
    variables: { postId },
    fetchPolicy: 'cache-and-network',
  });

  useEffect(() => {
    if (highlightCommentId && highlightCommentId !== prevHighlightRef.current) {
      refetchComments();
      refetchTotal();
    }
    prevHighlightRef.current = highlightCommentId;
  }, [highlightCommentId, refetchComments, refetchTotal]);

  const commentRefetchQueries = [
    {
      query: CommentsDocument,
      variables: {
        postId,
        limit: COMMENTS_PAGE_SIZE,
        offset: (commentPage - 1) * COMMENTS_PAGE_SIZE,
      },
    },
    { query: CommentsTotalDocument, variables: { postId } },
    { query: PostDocument, variables: { id: postId } },
  ];

  const [createComment, { loading: submittingComment }] = useMutation(CreateCommentDocument, {
    refetchQueries: commentRefetchQueries,
  });
  const [deleteComment] = useMutation(DeleteCommentDocument, {
    refetchQueries: commentRefetchQueries,
    awaitRefetchQueries: true,
  });

  const handleSubmitComment = async () => {
    const content = commentText.trim();
    if (!content) return;
    try {
      await createComment({ variables: { postId, content } });
      setCommentText('');
      setCommentPage(1);
      message.success(t('interaction.commentCreated'));
    } catch {
      message.error(t('interaction.commentFailed'));
    }
  };

  const handleSubmitReply = async (parentId: string): Promise<boolean> => {
    const content = replyText.trim();
    if (!content) return false;
    try {
      await createComment({ variables: { postId, content, parentId } });
      setReplyText('');
      setReplyingTo(null);
      setReplyHint('');
      message.success(t('interaction.commentCreated'));
      return true;
    } catch {
      message.error(t('interaction.commentFailed'));
      return false;
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment({ variables: { id: commentId } });
      message.success(t('interaction.commentDeleted'));
    } catch {
      message.error(t('interaction.commentFailed'));
    }
  };

  const handleSetReplyingTo = (commentId: string | null, authorName?: string) => {
    setReplyingTo(commentId);
    setReplyText('');
    setReplyHint(authorName ? t('interaction.replyTo', { name: authorName }) : '');
  };

  return (
    <Card style={{ marginTop: 16 }}>
      <Title level={5} style={{ marginTop: 0 }}>
        {t('interaction.comment')} ({commentsTotalData?.commentsTotal ?? 0})
      </Title>

      <div style={{ marginBottom: 16 }}>
        <TextArea
          rows={3}
          value={commentText}
          onChange={e => setCommentText(e.target.value)}
          placeholder={t('interaction.commentPlaceholder')}
          maxLength={2000}
        />
        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="primary"
            onClick={handleSubmitComment}
            loading={submittingComment}
            disabled={!commentText.trim()}
          >
            {t('interaction.submitComment')}
          </Button>
        </div>
      </div>

      <List
        loading={commentsLoading}
        dataSource={commentsData?.comments ?? []}
        locale={{ emptyText: <Empty description={t('interaction.noComments')} /> }}
        pagination={
          (commentsTotalData?.commentsTotal ?? 0) > COMMENTS_PAGE_SIZE
            ? {
                current: commentPage,
                total: commentsTotalData?.commentsTotal ?? 0,
                pageSize: COMMENTS_PAGE_SIZE,
                onChange: setCommentPage,
                size: 'small',
              }
            : false
        }
        renderItem={comment => (
          <CommentItem
            key={comment.id}
            comment={comment}
            currentUserId={currentUser?.id}
            highlightCommentId={highlightCommentId}
            replyingTo={replyingTo}
            replyText={replyText}
            replyHint={replyHint}
            submittingReply={submittingComment}
            onSetReplyingTo={handleSetReplyingTo}
            onSetReplyText={setReplyText}
            onSubmitReply={handleSubmitReply}
            onDeleteComment={handleDeleteComment}
            t={t}
          />
        )}
      />
    </Card>
  );
}
