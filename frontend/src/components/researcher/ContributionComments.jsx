import React, { useEffect, useState, useCallback } from 'react';
import userAPI from '../../../services/userAPI';
import { useNotifications } from '../../contexts/NotificationContext';
import fmtDate from '../../utils/FormatDate';
import toFullUrl from '../../utils/FullURLFile';
import '../../assets/styles/components/researcher/ContributionComments.css';

export default function ContributionComments({ contributionId, projectStatus }) {
  const { push } = useNotifications();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currentUserId = Number(sessionStorage.getItem('userId'));
  const role = (sessionStorage.getItem('role') || '').toString().toLowerCase();

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userAPI.getContributionComments(contributionId);
      if (res?.success && Array.isArray(res.data)) {
        setComments(res.data);
      }
    } catch (err) {
      console.error('Fetch comments error:', err);
    } finally {
      setLoading(false);
    }
  }, [contributionId]);

  useEffect(() => {
    fetchComments();
  }, [contributionId, fetchComments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (projectStatus === 'CLOSED') {
      push({ title: 'Error', body: 'Project is closed — commenting is disabled' });
      return;
    }
    if (!commentText.trim()) {
      push({ title: 'Error', body: 'Please enter a comment' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await userAPI.addContributionComment(contributionId, {
        comment_text: commentText.trim(),
      });
      if (res?.success) {
        push({ title: 'Success', body: 'Comment added successfully' });
        setCommentText('');
        await fetchComments();
      }
    } catch (err) {
      console.error('Add comment error:', err);
      push({
        title: 'Error',
        body: err?.response?.data?.message || 'Failed to add comment',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!commentId) return;
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      const res = await userAPI.deleteContributionComment(contributionId, commentId);
      if (res?.success) {
        push({ title: 'Success', body: 'Comment deleted' });
        await fetchComments();
      }
    } catch (err) {
      console.error('Delete comment error:', err);
      push({ title: 'Error', body: err?.response?.data?.message || 'Failed to delete comment' });
    }
  };

  return (
    <div className="contribution-comments-container">
      <h3>Comments ({comments.length})</h3>

      {loading && <div className="contribution-comments-loading">Loading comments...</div>}

      {!loading && comments.length === 0 && (
        <div className="contribution-comments-empty">No comments yet. Be the first to comment!</div>
      )}

      {!loading && comments.length > 0 && (
        <div className="contribution-comments-list">
          {comments.map((comment) => (
            <div key={comment.id} className="contribution-comment-item">
              <div className="contribution-comment-avatar">
                {comment.user?.avatar_url ? (
                  <img src={toFullUrl(comment.user.avatar_url)} alt={comment.user.full_name} />
                ) : (
                  <div className="contribution-comment-avatar-placeholder">
                    {comment.user?.full_name?.charAt(0) || '?'}
                  </div>
                )}
              </div>
              <div className="contribution-comment-content">
                <div className="contribution-comment-header">
                  <span className="contribution-comment-author">
                    {comment.user?.full_name || 'Unknown'}
                    {comment.user_id === currentUserId && (
                      <span className="contribution-comment-you"> (You)</span>
                    )}
                  </span>
                  <span className="contribution-comment-date">{fmtDate(comment.created_at)}</span>
                  {(comment.user_id === currentUserId ||
                    role === 'admin' ||
                    role === 'researcher') && (
                    <span
                      role="button"
                      aria-label="Delete comment"
                      title="Delete comment"
                      style={{ marginLeft: 8, color: 'red', cursor: 'pointer' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteComment(comment.id);
                      }}
                    >
                      <i className="fa-solid fa-trash" />
                    </span>
                  )}
                </div>
                <div className="contribution-comment-text">{comment.comment_text}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <form className="contribution-comment-form" onSubmit={handleSubmit}>
        <h4>Add a Comment</h4>
        <textarea
          className="contribution-comment-textarea"
          placeholder={
            projectStatus === 'CLOSED'
              ? 'Project closed — commenting disabled'
              : 'Write your comment here...'
          }
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          disabled={submitting || projectStatus === 'CLOSED'}
          rows={3}
        />
        <div className="contribution-comment-form-button">
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={submitting || !commentText.trim() || projectStatus === 'CLOSED'}
          >
            {submitting ? 'Commenting...' : 'Comment'}
          </button>
        </div>
      </form>
    </div>
  );
}
