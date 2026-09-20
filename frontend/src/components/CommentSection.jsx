// frontend/src/components/CommentSection.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { FiSend, FiTrash2, FiCornerDownRight } from 'react-icons/fi';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { toast } from 'react-toastify';
import {
  getComments,
  createComment,
  replyComment,
  getReplies,
  deleteComment,
  toggleCommentLike
} from '../api/postApi.js';
import { useSocket } from '../context/SocketContext.jsx';

export default function CommentSection({ postId, postAuthorId, currentUser }) {
  const [comments, setComments] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // New comment input
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reply states
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Replies map & expanded states: commentId -> Array of replies
  const [repliesMap, setRepliesMap] = useState({});
  const [expandedReplies, setExpandedReplies] = useState({});
  const [loadingReplies, setLoadingReplies] = useState({});

  // Tránh nhân đôi dữ liệu giữa HTTP response và Socket.IO
  const handledCommentIdsRef = useRef(new Set());
  const handledReplyIdsRef = useRef(new Set());

  const socket = useSocket();
  const currentUserId = (currentUser?._id || currentUser?.userId || currentUser?.id)?.toString();
  const postAuthorStr = (postAuthorId?._id || postAuthorId)?.toString();

  // ── 1. Fetch danh sách bình luận ban đầu ─────────────────────────────────
  const fetchInitialComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getComments(postId, { page: 1, limit: 5 });
      if (res.success) {
        setComments(res.data || []);
        setHasMore(res.pagination?.hasMore || false);
        setPage(1);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchInitialComments();
  }, [fetchInitialComments]);

  // ── 2. Xem thêm bình luận (Pagination) ──────────────────────────────────
  const handleLoadMoreComments = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await getComments(postId, { page: nextPage, limit: 5 });
      if (res.success) {
        setComments((prev) => {
          const existingIds = new Set(prev.map((c) => c._id));
          const newUnique = (res.data || []).filter((c) => !existingIds.has(c._id));
          return [...prev, ...newUnique];
        });
        setPage(nextPage);
        setHasMore(res.pagination?.hasMore || false);
      }
    } catch (error) {
      toast.error('Không thể tải thêm bình luận');
    } finally {
      setIsLoadingMore(false);
    }
  };

  // ── 3. Real-time Socket sync ─────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleNewComment = (payload) => {
      if (payload.postId === postId && payload.comment) {
        const commentId = payload.comment._id;
        if (handledCommentIdsRef.current.has(commentId)) return;
        handledCommentIdsRef.current.add(commentId);

        setComments((prev) => {
          if (prev.some((c) => c._id === commentId)) return prev;
          return [payload.comment, ...prev];
        });
      }
    };

    const handleNewReply = (payload) => {
      if (payload.postId === postId && payload.reply) {
        const parentId = payload.parentCommentId;
        const replyId = payload.reply._id;

        const alreadyHandled = handledReplyIdsRef.current.has(replyId);
        handledReplyIdsRef.current.add(replyId);

        // Chỉ tăng count ở comment cha nếu chưa được xử lý
        if (!alreadyHandled) {
          setComments((prev) =>
            prev.map((c) =>
              c._id === parentId
                ? { ...c, repliesCount: (c.repliesCount || 0) + 1 }
                : c
            )
          );
        }

        // Chèn vào danh sách replies nếu mục replies đang mở hoặc đã có danh sách
        setRepliesMap((prev) => {
          const currentList = prev[parentId] || [];
          if (currentList.some((r) => r._id === replyId)) return prev;
          return {
            ...prev,
            [parentId]: [...currentList, payload.reply]
          };
        });
      }
    };

    const handleCommentDeleted = (payload) => {
      if (payload.postId === postId) {
        if (payload.parentCommentId) {
          // Xóa câu trả lời con
          setRepliesMap((prev) => ({
            ...prev,
            [payload.parentCommentId]: (prev[payload.parentCommentId] || []).filter(
              (r) => r._id !== payload.commentId
            )
          }));
          // Giảm repliesCount ở comment cha
          setComments((prev) =>
            prev.map((c) =>
              c._id === payload.parentCommentId
                ? { ...c, repliesCount: Math.max(0, (c.repliesCount || 1) - 1) }
                : c
            )
          );
        } else {
          // Xóa comment gốc
          setComments((prev) => prev.filter((c) => c._id !== payload.commentId));
        }
      }
    };

    socket.on('newComment', handleNewComment);
    socket.on('newReply', handleNewReply);
    socket.on('commentDeleted', handleCommentDeleted);

    return () => {
      socket.off('newComment', handleNewComment);
      socket.off('newReply', handleNewReply);
      socket.off('commentDeleted', handleCommentDeleted);
    };
  }, [socket, postId]);

  // ── 4. Tạo bình luận gốc mới ────────────────────────────────────────────
  const handleCreateComment = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.info('Vui lòng đăng nhập để bình luận!');
      return;
    }
    const trimmed = newCommentText.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      const res = await createComment(postId, trimmed);
      if (res.success && res.data) {
        handledCommentIdsRef.current.add(res.data._id);
        setComments((prev) => {
          if (prev.some((c) => c._id === res.data._id)) return prev;
          return [res.data, ...prev];
        });
        setNewCommentText('');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể gửi bình luận');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── 5. Mở và tải danh sách replies ───────────────────────────────────────
  const handleToggleReplies = async (commentId) => {
    const isCurrentlyOpen = expandedReplies[commentId];
    if (isCurrentlyOpen) {
      setExpandedReplies((prev) => ({ ...prev, [commentId]: false }));
      return;
    }

    setExpandedReplies((prev) => ({ ...prev, [commentId]: true }));
    if (!repliesMap[commentId]) {
      setLoadingReplies((prev) => ({ ...prev, [commentId]: true }));
      try {
        const res = await getReplies(postId, commentId);
        if (res.success) {
          setRepliesMap((prev) => ({
            ...prev,
            [commentId]: res.data || []
          }));
        }
      } catch (error) {
        toast.error('Không thể tải các câu trả lời');
      } finally {
        setLoadingReplies((prev) => ({ ...prev, [commentId]: false }));
      }
    }
  };

  // ── 6. Gửi câu trả lời ──────────────────────────────────────────────────
  const handleSendReply = async (commentId) => {
    if (!currentUser) {
      toast.info('Vui lòng đăng nhập để trả lời bình luận!');
      return;
    }
    const trimmed = replyText.trim();
    if (!trimmed) return;

    setIsSubmittingReply(true);
    try {
      const res = await replyComment(postId, commentId, trimmed);
      if (res.success && res.data) {
        const replyId = res.data._id;
        const alreadyHandled = handledReplyIdsRef.current.has(replyId);
        handledReplyIdsRef.current.add(replyId);

        setRepliesMap((prev) => {
          const currentList = prev[commentId] || [];
          if (currentList.some((r) => r._id === replyId)) return prev;
          return {
            ...prev,
            [commentId]: [...currentList, res.data]
          };
        });
        setExpandedReplies((prev) => ({ ...prev, [commentId]: true }));

        if (!alreadyHandled) {
          setComments((prev) =>
            prev.map((c) =>
              c._id === commentId
                ? { ...c, repliesCount: (c.repliesCount || 0) + 1 }
                : c
            )
          );
        }

        setReplyText('');
        setReplyingToId(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể gửi câu trả lời');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // ── 7. Like / Unlike bình luận ──────────────────────────────────────────
  const handleLikeComment = async (commentId, isReply = false, parentId = null) => {
    if (!currentUser) {
      toast.info('Vui lòng đăng nhập để thích bình luận!');
      return;
    }

    if (!isReply) {
      // Optimistic update cho comment gốc
      setComments((prev) =>
        prev.map((c) => {
          if (c._id === commentId) {
            const nextLiked = !c.isLiked;
            return {
              ...c,
              isLiked: nextLiked,
              likesCount: Math.max(0, (c.likesCount || 0) + (nextLiked ? 1 : -1))
            };
          }
          return c;
        })
      );
    } else if (parentId) {
      // Optimistic update cho reply
      setRepliesMap((prev) => ({
        ...prev,
        [parentId]: (prev[parentId] || []).map((r) => {
          if (r._id === commentId) {
            const nextLiked = !r.isLiked;
            return {
              ...r,
              isLiked: nextLiked,
              likesCount: Math.max(0, (r.likesCount || 0) + (nextLiked ? 1 : -1))
            };
          }
          return r;
        })
      }));
    }

    try {
      const res = await toggleCommentLike(postId, commentId);
      if (res.success && res.data) {
        const { liked, likesCount } = res.data;
        if (!isReply) {
          setComments((prev) =>
            prev.map((c) =>
              c._id === commentId ? { ...c, isLiked: liked, likesCount } : c
            )
          );
        } else if (parentId) {
          setRepliesMap((prev) => ({
            ...prev,
            [parentId]: (prev[parentId] || []).map((r) =>
              r._id === commentId ? { ...r, isLiked: liked, likesCount } : r
            )
          }));
        }
      }
    } catch (error) {
      toast.error('Không thể thao tác like');
    }
  };

  // ── 8. Xóa bình luận ────────────────────────────────────────────────────
  const handleDeleteComment = async (commentId, parentId = null) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này không?')) return;

    try {
      const res = await deleteComment(postId, commentId);
      if (res.success) {
        if (!parentId) {
          setComments((prev) => prev.filter((c) => c._id !== commentId));
        } else {
          setRepliesMap((prev) => ({
            ...prev,
            [parentId]: (prev[parentId] || []).filter((r) => r._id !== commentId)
          }));
          setComments((prev) =>
            prev.map((c) =>
              c._id === parentId
                ? { ...c, repliesCount: Math.max(0, (c.repliesCount || 1) - 1) }
                : c
            )
          );
        }
        toast.success('Đã xóa bình luận');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xóa bình luận');
    }
  };

  // Helper check permission
  const canDelete = (authorId) => {
    const authorStr = (authorId?._id || authorId)?.toString();
    const isAuthor = authorStr === currentUserId;
    const isPostOwner = postAuthorStr === currentUserId;
    const isAdmin = ['moderator', 'system_admin'].includes(currentUser?.role);
    return isAuthor || isPostOwner || isAdmin;
  };

  const getDisplayName = (author) => {
    return author?.fullName || author?.username || 'Thành viên';
  };

  const getAvatarLetter = (author) => {
    const name = getDisplayName(author);
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="comment-section-wrapper">
      {/* ── Form nhập bình luận mới ── */}
      <form className="new-comment-form" onSubmit={handleCreateComment}>
        <div className="user-avatar-small">
          {currentUser?.avatarUrl ? (
            <img src={currentUser.avatarUrl} alt="Avatar" className="avatar-img-sm" />
          ) : (
            <span className="avatar-letter-sm">
              {currentUser?.fullName?.charAt(0)?.toUpperCase() ||
                currentUser?.username?.charAt(0)?.toUpperCase() ||
                'U'}
            </span>
          )}
        </div>

        <div className="comment-input-container">
          <input
            type="text"
            className="comment-input"
            placeholder={
              currentUser ? 'Viết bình luận công khai...' : 'Đăng nhập để viết bình luận...'
            }
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            disabled={!currentUser || isSubmitting}
          />
          <button
            type="submit"
            className="send-comment-btn"
            disabled={!currentUser || !newCommentText.trim() || isSubmitting}
            aria-label="Gửi bình luận"
          >
            <FiSend />
          </button>
        </div>
      </form>

      {/* ── Danh sách bình luận ── */}
      <div className="comments-display-list">
        {isLoading ? (
          <div className="comments-loading">Đang tải bình luận...</div>
        ) : comments.length === 0 ? (
          <div className="no-comments-msg">Chưa có bình luận nào. Hãy là người đầu tiên!</div>
        ) : (
          comments.map((comment) => {
            const author = comment.authorId;
            const isReplyingThis = replyingToId === comment._id;
            const replies = repliesMap[comment._id] || [];
            const isRepliesExpanded = Boolean(expandedReplies[comment._id]);
            const isRepliesLoading = Boolean(loadingReplies[comment._id]);
            const repliesCount = comment.repliesCount || 0;

            return (
              <div key={comment._id} className="comment-thread-item">
                {/* Bình luận gốc */}
                <div className="comment-main-row">
                  <div className="comment-avatar-container">
                    {author?.avatarUrl ? (
                      <img src={author.avatarUrl} alt="Avatar" className="avatar-img-sm" />
                    ) : (
                      <span className="avatar-letter-sm">{getAvatarLetter(author)}</span>
                    )}
                  </div>

                  <div className="comment-body-col">
                    <div className="comment-bubble">
                      <span className="comment-author-name">{getDisplayName(author)}</span>
                      <p className="comment-text-content">{comment.content}</p>
                    </div>

                    {/* Hàng hành động dưới bubble */}
                    <div className="comment-meta-actions">
                      <button
                        type="button"
                        className={`meta-btn like-btn ${comment.isLiked ? 'liked' : ''}`}
                        onClick={() => handleLikeComment(comment._id, false)}
                      >
                        {comment.isLiked ? <FaHeart className="inline-heart" /> : <FaRegHeart className="inline-heart" />}
                        <span>{comment.likesCount > 0 ? `${comment.likesCount} Thích` : 'Thích'}</span>
                      </button>

                      <button
                        type="button"
                        className="meta-btn reply-btn"
                        onClick={() => {
                          if (!currentUser) {
                            toast.info('Vui lòng đăng nhập để trả lời!');
                            return;
                          }
                          setReplyingToId(isReplyingThis ? null : comment._id);
                          setReplyText(`@${getDisplayName(author)} `);
                        }}
                      >
                        Trả lời
                      </button>

                      <span className="comment-time">
                        {comment.createdAt
                          ? formatDistanceToNow(new Date(comment.createdAt), {
                            addSuffix: true,
                            locale: vi
                          })
                          : ''}
                      </span>

                      {canDelete(author) && (
                        <button
                          type="button"
                          className="meta-btn delete-btn"
                          title="Xóa bình luận"
                          onClick={() => handleDeleteComment(comment._id)}
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </div>

                    {/* Nút xem câu trả lời nếu có */}
                    {repliesCount > 0 && (
                      <div className="replies-toggle-row">
                        <button
                          type="button"
                          className="view-replies-btn"
                          onClick={() => handleToggleReplies(comment._id)}
                        >
                          <FiCornerDownRight className="corner-icon" />
                          <span>
                            {isRepliesExpanded
                              ? 'Ẩn câu trả lời'
                              : `Xem ${repliesCount} câu trả lời`}
                          </span>
                        </button>
                      </div>
                    )}

                    {/* Danh sách Replies con */}
                    {isRepliesExpanded && (
                      <div className="nested-replies-list">
                        {isRepliesLoading ? (
                          <div className="replies-loading">Đang tải câu trả lời...</div>
                        ) : (
                          replies.map((reply) => {
                            const replyAuthor = reply.authorId;
                            return (
                              <div key={reply._id} className="reply-item-row">
                                <div className="reply-avatar-container">
                                  {replyAuthor?.avatarUrl ? (
                                    <img
                                      src={replyAuthor.avatarUrl}
                                      alt="Avatar"
                                      className="avatar-img-xs"
                                    />
                                  ) : (
                                    <span className="avatar-letter-xs">
                                      {getAvatarLetter(replyAuthor)}
                                    </span>
                                  )}
                                </div>

                                <div className="reply-body-col">
                                  <div className="reply-bubble">
                                    <span className="comment-author-name">
                                      {getDisplayName(replyAuthor)}
                                    </span>
                                    <p className="comment-text-content">{reply.content}</p>
                                  </div>

                                  <div className="comment-meta-actions">
                                    <button
                                      type="button"
                                      className={`meta-btn like-btn ${reply.isLiked ? 'liked' : ''}`}
                                      onClick={() =>
                                        handleLikeComment(reply._id, true, comment._id)
                                      }
                                    >
                                      {reply.isLiked ? (
                                        <FaHeart className="inline-heart" />
                                      ) : (
                                        <FaRegHeart className="inline-heart" />
                                      )}
                                      <span>
                                        {reply.likesCount > 0
                                          ? `${reply.likesCount} Thích`
                                          : 'Thích'}
                                      </span>
                                    </button>

                                    <button
                                      type="button"
                                      className="meta-btn reply-btn"
                                      onClick={() => {
                                        setReplyingToId(comment._id);
                                        setReplyText(`@${getDisplayName(replyAuthor)} `);
                                      }}
                                    >
                                      Trả lời
                                    </button>

                                    <span className="comment-time">
                                      {reply.createdAt
                                        ? formatDistanceToNow(new Date(reply.createdAt), {
                                          addSuffix: true,
                                          locale: vi
                                        })
                                        : ''}
                                    </span>

                                    {canDelete(replyAuthor) && (
                                      <button
                                        type="button"
                                        className="meta-btn delete-btn"
                                        title="Xóa câu trả lời"
                                        onClick={() =>
                                          handleDeleteComment(reply._id, comment._id)
                                        }
                                      >
                                        <FiTrash2 />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* Form gửi câu trả lời (Reply input) */}
                    {isReplyingThis && (
                      <div className="inline-reply-input-box">
                        <div className="reply-avatar-container">
                          {currentUser?.avatarUrl ? (
                            <img
                              src={currentUser.avatarUrl}
                              alt="Avatar"
                              className="avatar-img-xs"
                            />
                          ) : (
                            <span className="avatar-letter-xs">
                              {currentUser?.fullName?.charAt(0)?.toUpperCase() ||
                                currentUser?.username?.charAt(0)?.toUpperCase() ||
                                'U'}
                            </span>
                          )}
                        </div>
                        <div className="reply-input-wrapper">
                          <input
                            type="text"
                            className="reply-input"
                            placeholder="Viết câu trả lời..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSendReply(comment._id);
                              }
                            }}
                            autoFocus
                            disabled={isSubmittingReply}
                          />
                          <button
                            type="button"
                            className="reply-submit-btn"
                            disabled={!replyText.trim() || isSubmittingReply}
                            onClick={() => handleSendReply(comment._id)}
                          >
                            <FiSend />
                          </button>
                          <button
                            type="button"
                            className="reply-cancel-btn"
                            onClick={() => {
                              setReplyingToId(null);
                              setReplyText('');
                            }}
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Nút Xem thêm bình luận */}
        {hasMore && (
          <div className="load-more-comments-container">
            <button
              type="button"
              className="load-more-comments-btn"
              onClick={handleLoadMoreComments}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? 'Đang tải...' : 'Xem thêm bình luận'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
