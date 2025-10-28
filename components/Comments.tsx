'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

interface Reply {
    id: string;
    text: string;
    authorId: string;
    authorName: string;
    authorPhoto: string;
    createdAt: any;
    isDeleted?: boolean;
    isEdited?: boolean;
}

interface Comment {
    id: string;
    text: string;
    authorId: string;
    authorName: string;
    authorPhoto: string;
    createdAt: any;
    replies: Reply[];
    isDeleted?: boolean;
    isEdited?: boolean;
}

interface CommentsProps {
    profileUserId: string;
}

export default function Comments({ profileUserId }: CommentsProps) {
    const { isDark } = useTheme();
    const [user, setUser] = useState<any>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

    // 수정 상태
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');

    // 로그인 상태 확인
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    // 댓글 실시간 불러오기
    useEffect(() => {
        const commentsRef = collection(db, 'users', profileUserId, 'comments');
        const q = query(commentsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const commentsList: Comment[] = [];
            snapshot.forEach((doc) => {
                commentsList.push({
                    id: doc.id,
                    ...doc.data() as Omit<Comment, 'id'>
                });
            });
            setComments(commentsList);
        });

        return () => unsubscribe();
    }, [profileUserId]);

    // 댓글 작성
    const handleAddComment = async () => {
        if (!user) {
            alert('로그인이 필요합니다!');
            return;
        }
        if (!newComment.trim()) {
            alert('댓글 내용을 입력해주세요!');
            return;
        }

        try {
            const commentsRef = collection(db, 'users', profileUserId, 'comments');
            await addDoc(commentsRef, {
                text: newComment,
                authorId: user.uid,
                authorName: user.displayName || '익명',
                authorPhoto: user.photoURL || '',
                createdAt: new Date(),
                replies: [],
                isDeleted: false,
                isEdited: false
            });

            setNewComment('');
        } catch (error) {
            console.error('댓글 작성 실패:', error);
            alert('댓글 작성에 실패했습니다.');
        }
    };

    // 댓글 수정
    const handleEditComment = async (commentId: string) => {
        if (!editText.trim()) {
            alert('댓글 내용을 입력해주세요!');
            return;
        }

        try {
            const commentRef = doc(db, 'users', profileUserId, 'comments', commentId);
            await updateDoc(commentRef, {
                text: editText,
                isEdited: true
            });

            setEditingCommentId(null);
            setEditText('');
        } catch (error) {
            console.error('댓글 수정 실패:', error);
            alert('댓글 수정에 실패했습니다.');
        }
    };

    // 댓글 삭제
    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('댓글을 삭제하시겠습니까?')) return;

        try {
            const commentRef = doc(db, 'users', profileUserId, 'comments', commentId);
            await updateDoc(commentRef, {
                text: '',
                isDeleted: true
            });
        } catch (error) {
            console.error('댓글 삭제 실패:', error);
            alert('댓글 삭제에 실패했습니다.');
        }
    };

    // 대댓글 작성
    const handleAddReply = async (commentId: string) => {
        if (!user) {
            alert('로그인이 필요합니다!');
            return;
        }
        if (!replyText.trim()) {
            alert('답글 내용을 입력해주세요!');
            return;
        }

        try {
            const comment = comments.find(c => c.id === commentId);
            if (!comment) return;

            const newReply: Reply = {
                id: Date.now().toString(),
                text: replyText,
                authorId: user.uid,
                authorName: user.displayName || '익명',
                authorPhoto: user.photoURL || '',
                createdAt: new Date(),
                isDeleted: false,
                isEdited: false
            };

            const commentRef = doc(db, 'users', profileUserId, 'comments', commentId);
            await updateDoc(commentRef, {
                replies: [...comment.replies, newReply]
            });

            setReplyText('');
            setReplyingTo(null);

            // 대댓글 작성 후 자동으로 펼치기
            setExpandedComments(prev => new Set([...prev, commentId]));
        } catch (error) {
            console.error('답글 작성 실패:', error);
            alert('답글 작성에 실패했습니다.');
        }
    };

    // 대댓글 수정
    const handleEditReply = async (commentId: string, replyId: string) => {
        if (!editText.trim()) {
            alert('답글 내용을 입력해주세요!');
            return;
        }

        try {
            const comment = comments.find(c => c.id === commentId);
            if (!comment) return;

            const updatedReplies = comment.replies.map(reply =>
                reply.id === replyId
                    ? { ...reply, text: editText, isEdited: true }
                    : reply
            );

            const commentRef = doc(db, 'users', profileUserId, 'comments', commentId);
            await updateDoc(commentRef, {
                replies: updatedReplies
            });

            setEditingReplyId(null);
            setEditText('');
        } catch (error) {
            console.error('답글 수정 실패:', error);
            alert('답글 수정에 실패했습니다.');
        }
    };

    // 대댓글 삭제
    const handleDeleteReply = async (commentId: string, replyId: string) => {
        if (!confirm('답글을 삭제하시겠습니까?')) return;

        try {
            const comment = comments.find(c => c.id === commentId);
            if (!comment) return;

            const updatedReplies = comment.replies.map(reply =>
                reply.id === replyId
                    ? { ...reply, text: '', isDeleted: true }
                    : reply
            );

            const commentRef = doc(db, 'users', profileUserId, 'comments', commentId);
            await updateDoc(commentRef, {
                replies: updatedReplies
            });
        } catch (error) {
            console.error('답글 삭제 실패:', error);
            alert('답글 삭제에 실패했습니다.');
        }
    };

    // 대댓글 접기/펼치기
    const toggleReplies = (commentId: string) => {
        setExpandedComments(prev => {
            const newSet = new Set(prev);
            if (newSet.has(commentId)) {
                newSet.delete(commentId);
            } else {
                newSet.add(commentId);
            }
            return newSet;
        });
    };

    // 날짜 포맷
    const formatDate = (date: any) => {
        if (!date) return '';
        const d = date.toDate ? date.toDate() : new Date(date);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return '방금 전';
        if (minutes < 60) return `${minutes}분 전`;
        if (hours < 24) return `${hours}시간 전`;
        if (days < 7) return `${days}일 전`;
        return d.toLocaleDateString('ko-KR');
    };

    return (
        <div className={`mt-12 rounded-2xl p-8 ${
            isDark
                ? 'bg-gray-900 border border-gray-800'
                : 'bg-white border border-gray-200'
        }`}>
            <h2 className={`text-2xl font-bold mb-6 ${
                isDark ? 'text-white' : 'text-gray-900'
            }`}>
                방명록 ({comments.length})
            </h2>

            {/* 댓글 작성 */}
            {user ? (
                <div className="mb-8">
                    <div className="flex gap-3">
                        <img
                            src={user.photoURL || '/default-avatar.png'}
                            alt={user.displayName}
                            className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
              <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="댓글을 남겨보세요..."
                  className={`w-full px-4 py-3 rounded-lg resize-none transition-colors ${
                      isDark
                          ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  } border focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  rows={3}
              />
                            <div className="flex justify-end mt-2">
                                <button
                                    onClick={handleAddComment}
                                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    댓글 작성
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className={`mb-8 text-center py-6 rounded-lg ${
                    isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-600'
                }`}>
                    로그인하고 댓글을 남겨보세요!
                </div>
            )}

            {/* 댓글 목록 */}
            <div className="space-y-6">
                {comments.length === 0 ? (
                    <div className={`text-center py-8 ${
                        isDark ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                        아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id}>
                            {/* 댓글 */}
                            <div className="flex gap-3">
                                <img
                                    src={comment.authorPhoto || '/default-avatar.png'}
                                    alt={comment.authorName}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                                <div className="flex-1">
                                    <div className={`p-4 rounded-lg ${
                                        isDark ? 'bg-gray-800' : 'bg-gray-50'
                                    }`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                        <span className={`font-semibold ${
                            isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                          {comment.authorName}
                        </span>
                                                {comment.isEdited && !comment.isDeleted && (
                                                    <span className={`text-xs ${
                                                        isDark ? 'text-gray-500' : 'text-gray-500'
                                                    }`}>
                            (수정됨)
                          </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                        <span className={`text-sm ${
                            isDark ? 'text-gray-500' : 'text-gray-500'
                        }`}>
                          {formatDate(comment.createdAt)}
                        </span>
                                                {/* 수정/삭제 버튼 (작성자만) */}
                                                {user && user.uid === comment.authorId && !comment.isDeleted && (
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => {
                                                                setEditingCommentId(comment.id);
                                                                setEditText(comment.text);
                                                            }}
                                                            className={`text-xs px-2 py-1 rounded transition-colors ${
                                                                isDark
                                                                    ? 'text-gray-400 hover:text-purple-400 hover:bg-gray-700'
                                                                    : 'text-gray-600 hover:text-purple-600 hover:bg-gray-200'
                                                            }`}
                                                        >
                                                            수정
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteComment(comment.id)}
                                                            className={`text-xs px-2 py-1 rounded transition-colors ${
                                                                isDark
                                                                    ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700'
                                                                    : 'text-gray-600 hover:text-red-600 hover:bg-gray-200'
                                                            }`}
                                                        >
                                                            삭제
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* 수정 모드 */}
                                        {editingCommentId === comment.id ? (
                                            <div>
                        <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg resize-none transition-colors ${
                                isDark
                                    ? 'bg-gray-900 border-gray-700 text-white'
                                    : 'bg-white border-gray-300 text-gray-900'
                            } border focus:outline-none focus:ring-2 focus:ring-purple-500`}
                            rows={3}
                        />
                                                <div className="flex gap-2 mt-2">
                                                    <button
                                                        onClick={() => handleEditComment(comment.id)}
                                                        className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm transition-colors"
                                                    >
                                                        저장
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingCommentId(null);
                                                            setEditText('');
                                                        }}
                                                        className={`px-4 py-1.5 rounded-lg font-medium text-sm transition-colors ${
                                                            isDark
                                                                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                                                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                                                        }`}
                                                    >
                                                        취소
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className={`${
                                                comment.isDeleted
                                                    ? (isDark ? 'text-gray-600 italic' : 'text-gray-400 italic')
                                                    : (isDark ? 'text-gray-300' : 'text-gray-700')
                                            }`}>
                                                {comment.isDeleted ? '삭제된 댓글입니다.' : comment.text}
                                            </p>
                                        )}
                                    </div>

                                    {/* 답글 버튼 */}
                                    {!comment.isDeleted && (
                                        <div className="flex items-center gap-4 mt-2 ml-2">
                                            <button
                                                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                                className={`text-sm font-medium transition-colors ${
                                                    isDark
                                                        ? 'text-gray-400 hover:text-purple-400'
                                                        : 'text-gray-600 hover:text-purple-600'
                                                }`}
                                            >
                                                답글
                                            </button>
                                            {comment.replies.length > 0 && (
                                                <button
                                                    onClick={() => toggleReplies(comment.id)}
                                                    className={`text-sm font-medium transition-colors ${
                                                        isDark
                                                            ? 'text-gray-400 hover:text-purple-400'
                                                            : 'text-gray-600 hover:text-purple-600'
                                                    }`}
                                                >
                                                    {expandedComments.has(comment.id)
                                                        ? `답글 ${comment.replies.length}개 숨기기`
                                                        : `답글 ${comment.replies.length}개 보기`}
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* 답글 작성 폼 */}
                                    {replyingTo === comment.id && user && (
                                        <div className="mt-3 ml-4 flex gap-2">
                                            <img
                                                src={user.photoURL || '/default-avatar.png'}
                                                alt={user.displayName}
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                            <div className="flex-1">
                        <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="답글을 입력하세요..."
                            className={`w-full px-3 py-2 rounded-lg resize-none text-sm transition-colors ${
                                isDark
                                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                            } border focus:outline-none focus:ring-2 focus:ring-purple-500`}
                            rows={2}
                        />
                                                <div className="flex gap-2 mt-2">
                                                    <button
                                                        onClick={() => handleAddReply(comment.id)}
                                                        className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm transition-colors"
                                                    >
                                                        답글 작성
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setReplyingTo(null);
                                                            setReplyText('');
                                                        }}
                                                        className={`px-4 py-1.5 rounded-lg font-medium text-sm transition-colors ${
                                                            isDark
                                                                ? 'bg-gray-800 hover:bg-gray-700 text-white'
                                                                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                                                        }`}
                                                    >
                                                        취소
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 대댓글 목록 */}
                                    {expandedComments.has(comment.id) && comment.replies.length > 0 && (
                                        <div className="mt-4 ml-4 space-y-3">
                                            {comment.replies.map((reply) => (
                                                <div key={reply.id} className="flex gap-2">
                                                    <img
                                                        src={reply.authorPhoto || '/default-avatar.png'}
                                                        alt={reply.authorName}
                                                        className="w-8 h-8 rounded-full object-cover"
                                                    />
                                                    <div className="flex-1">
                                                        <div className={`p-3 rounded-lg ${
                                                            isDark ? 'bg-gray-800' : 'bg-gray-50'
                                                        }`}>
                                                            <div className="flex items-center justify-between mb-1">
                                                                <div className="flex items-center gap-2">
                                  <span className={`font-semibold text-sm ${
                                      isDark ? 'text-white' : 'text-gray-900'
                                  }`}>
                                    {reply.authorName}
                                  </span>
                                                                    {reply.isEdited && !reply.isDeleted && (
                                                                        <span className={`text-xs ${
                                                                            isDark ? 'text-gray-500' : 'text-gray-500'
                                                                        }`}>
                                      (수정됨)
                                    </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                  <span className={`text-xs ${
                                      isDark ? 'text-gray-500' : 'text-gray-500'
                                  }`}>
                                    {formatDate(reply.createdAt)}
                                  </span>
                                                                    {/* 답글 수정/삭제 버튼 */}
                                                                    {user && user.uid === reply.authorId && !reply.isDeleted && (
                                                                        <div className="flex gap-1">
                                                                            <button
                                                                                onClick={() => {
                                                                                    setEditingReplyId(reply.id);
                                                                                    setEditText(reply.text);
                                                                                }}
                                                                                className={`text-xs px-2 py-0.5 rounded transition-colors ${
                                                                                    isDark
                                                                                        ? 'text-gray-400 hover:text-purple-400 hover:bg-gray-700'
                                                                                        : 'text-gray-600 hover:text-purple-600 hover:bg-gray-200'
                                                                                }`}
                                                                            >
                                                                                수정
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDeleteReply(comment.id, reply.id)}
                                                                                className={`text-xs px-2 py-0.5 rounded transition-colors ${
                                                                                    isDark
                                                                                        ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700'
                                                                                        : 'text-gray-600 hover:text-red-600 hover:bg-gray-200'
                                                                                }`}
                                                                            >
                                                                                삭제
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* 답글 수정 모드 */}
                                                            {editingReplyId === reply.id ? (
                                                                <div>
                                  <textarea
                                      value={editText}
                                      onChange={(e) => setEditText(e.target.value)}
                                      className={`w-full px-3 py-2 rounded-lg resize-none text-sm transition-colors ${
                                          isDark
                                              ? 'bg-gray-900 border-gray-700 text-white'
                                              : 'bg-white border-gray-300 text-gray-900'
                                      } border focus:outline-none focus:ring-2 focus:ring-purple-500`}
                                      rows={2}
                                  />
                                                                    <div className="flex gap-2 mt-2">
                                                                        <button
                                                                            onClick={() => handleEditReply(comment.id, reply.id)}
                                                                            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-xs transition-colors"
                                                                        >
                                                                            저장
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                setEditingReplyId(null);
                                                                                setEditText('');
                                                                            }}
                                                                            className={`px-3 py-1 rounded-lg font-medium text-xs transition-colors ${
                                                                                isDark
                                                                                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                                                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                                                                            }`}
                                                                        >
                                                                            취소
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <p className={`text-sm ${
                                                                    reply.isDeleted
                                                                        ? (isDark ? 'text-gray-600 italic' : 'text-gray-400 italic')
                                                                        : (isDark ? 'text-gray-300' : 'text-gray-700')
                                                                }`}>
                                                                    {reply.isDeleted ? '삭제된 답글입니다.' : reply.text}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}