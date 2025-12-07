import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Section from '../../../components/ui/Section';
import Card from '../../../components/ui/Card';
import FilePreview from '../../../components/ui/FilePreview';
import DashedDivider from '../../../components/ui/DashedDivider';
import userAPI from '../../../../services/userAPI';
import toFullUrl from '../../../utils/FullURLFile';
import fmtDate from '../../../utils/FormatDate';
import useTitle from '../../../hooks/useTitle';
import '../../..//assets/styles/pages/ProjectDetail.css';

export default function QuestionDetail() {
  const { projectId, questionId } = useParams();
  const location = useLocation();
  const initialQuestion = location.state?.question || null;

  const [question, setQuestion] = useState(initialQuestion);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [answersLoading, setAnswersLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filePreviewInvalid, setFilePreviewInvalid] = useState(false);
  const [filePreviewError, setFilePreviewError] = useState('');
  const [oclText, setOclText] = useState('');
  const titleText = question?.title || 'Question';
  useTitle(titleText);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const currentUserId = Number(sessionStorage.getItem('userId'));

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        if (!question) {
          const res = await userAPI.listQuestionsForProject(projectId);
          if (mounted && res?.success) {
            const found = (res.data || []).find((q) => String(q.id) === String(questionId));
            setQuestion(found || null);
          }
        }
      } catch (err) {
        console.error('Fetch question error', err);
        if (mounted)
          setError(err?.response?.data?.message || err.message || 'Failed to load question');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [projectId, questionId, question]);

  const fetchAnswers = async () => {
    setAnswersLoading(true);
    try {
      const res = await userAPI.listAnswersForQuestion(questionId);
      let ans = res?.success ? res.data || [] : [];

      // Prefer contributor object when backend includes it; otherwise fetch users
      if (ans.some((a) => !!a.contributor)) {
        ans = ans.map((a) => ({
          ...a,
          user: a.user || a.contributor || null,
          user_id: Number(a.contributor?.id || a.user?.id || a.contributor_id || a.user_id || null),
        }));
      } else {
        const idsToFetch = Array.from(
          new Set(
            ans
              .map((a) => a.contributor_id || a.user_id)
              .filter((v) => v !== undefined && v !== null)
          )
        );

        if (idsToFetch.length > 0) {
          const userFetches = idsToFetch.map((id) =>
            userAPI
              .getUserById(id)
              .then((r) => {
                if (!r) return null;
                if (r.success && r.data) return r.data;
                if (r.data && r.data.id) return r.data;
                if (r.id) return r;
                return null;
              })
              .catch(() => null)
          );
          const users = await Promise.all(userFetches);
          const userMap = {};
          idsToFetch.forEach((id, idx) => {
            if (users[idx]) userMap[id] = users[idx];
          });

          ans = ans.map((a) => {
            const uid = a.contributor_id || a.user_id || (a.user && a.user.id) || null;
            return {
              ...a,
              user: a.user || userMap[uid] || null,
              user_id: Number(a.user_id || a.contributor_id || (a.user && a.user.id) || null),
            };
          });
        }
      }

      setAnswers(ans);
    } catch (err) {
      console.error('Fetch answers error', err);
    } finally {
      setAnswersLoading(false);
    }
  };

  useEffect(() => {
    fetchAnswers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId]);

  // Validate model preview: detect if the URL returns HTML (index.html) instead of the raw file
  useEffect(() => {
    let mounted = true;
    setFilePreviewInvalid(false);
    setFilePreviewError('');
    if (!question?.uml_use_file_path) return undefined;

    (async () => {
      try {
        const url = toFullUrl(question.uml_use_file_path);
        const resp = await fetch(url, { method: 'GET' });
        const txt = await resp.text();
        if (!mounted) return;
        const snippet = (txt || '').trim().slice(0, 200).toLowerCase();
        if (snippet.startsWith('<!doctype') || snippet.includes('<html')) {
          setFilePreviewInvalid(true);
          setFilePreviewError(
            'Preview returned HTML (likely index.html). The file URL may be incorrect or the server may be routing to the app.'
          );
        } else {
          setFilePreviewInvalid(false);
          setFilePreviewError('');
        }
      } catch (err) {
        if (!mounted) return;
        setFilePreviewInvalid(true);
        setFilePreviewError('Failed to fetch preview: ' + (err?.message || 'network error'));
      }
    })();

    return () => {
      mounted = false;
    };
  }, [question?.uml_use_file_path]);

  const handleSubmit = async () => {
    if (!oclText.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        ocl_text: oclText.trim(),
        comment_text: commentText.trim() || undefined,
      };
      const res = await userAPI.submitConstraintAnswer(questionId, payload);
      if (res?.success) {
        setOclText('');
        setCommentText('');
        await fetchAnswers();
      }
    } catch (err) {
      console.error('Submit answer error', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAnswerStatus = async (answerId, status) => {
    try {
      await userAPI.updateConstraintAnswerStatus(answerId, status);
      await fetchAnswers();
    } catch (err) {
      console.error('Update status error', err);
    }
  };

  return (
    <Section>
      <Card>
        {loading && <div>Loading question...</div>}
        {error && <div className="text-error">{error}</div>}
        {!loading && !error && (
          <div className="question-detail">
            <div className="question-detail-grid">
              <div className="question-detail-main">
                {question?.question_text && (
                  <div style={{ marginTop: 8 }} className="question-text">
                    <h3>Question</h3>
                    <div style={{ whiteSpace: 'pre-line' }}>{question.question_text}</div>
                  </div>
                )}
                {/* model preview moved to the right column for OCL projects */}
                <DashedDivider />

                <div style={{ marginTop: 16 }}>
                  <h3>Submit OCL</h3>
                  <textarea
                    value={oclText}
                    onChange={(e) => setOclText(e.target.value)}
                    rows={8}
                    style={{ width: '100%', fontFamily: 'monospace' }}
                    placeholder="Enter OCL text here"
                  />
                  <div style={{ marginTop: 8 }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleSubmit}
                      disabled={submitting}
                    >
                      {submitting ? 'Submitting...' : 'Submit OCL'}
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: 24 }}>
                  <h3>Answers</h3>
                  {answersLoading && <div>Loading answers...</div>}
                  {!answersLoading && answers.length === 0 && <div>No answers yet.</div>}
                  {!answersLoading && answers.length > 0 && (
                    <div className="answers-list">
                      {answers.map((a) => (
                        <div key={a.id} className="contribution-comment-item">
                          <div className="contribution-comment-avatar">
                            {a.user?.avatar_url ? (
                              <img src={toFullUrl(a.user.avatar_url)} alt={a.user?.full_name} />
                            ) : (
                              <div className="contribution-comment-avatar-placeholder">
                                {a.user?.full_name?.charAt(0) || '?'}
                              </div>
                            )}
                          </div>
                          <div className="contribution-comment-content">
                            <div className="contribution-comment-header">
                              <span className="contribution-comment-author">
                                {a.user?.full_name || a.user?.email || 'Unknown'}
                                {Number(a.user_id) === currentUserId && (
                                  <span className="contribution-comment-you"> (You)</span>
                                )}
                              </span>
                              <span className="contribution-comment-date">
                                {fmtDate(a.created_at)}
                              </span>
                            </div>
                            <div className="contribution-comment-text">
                              <pre style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>
                                {a.ocl_text}
                              </pre>
                              {a.comment_text && (
                                <div style={{ marginTop: 8 }}>{a.comment_text}</div>
                              )}
                            </div>

                            {(a.status === 'PENDING' || a.status === 'REJECTED') && (
                              <div style={{ marginTop: 8 }}>
                                <button
                                  className="btn btn-outline btn-sm"
                                  onClick={() => handleUpdateAnswerStatus(a.id, 'APPROVED')}
                                >
                                  Approve
                                </button>
                                <button
                                  className="btn btn-outline btn-sm"
                                  style={{ marginLeft: 8 }}
                                  onClick={() => handleUpdateAnswerStatus(a.id, 'REJECTED')}
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="question-detail-divider" />

              <div className="question-detail-side">
                {question?.uml_use_file_path && (
                  <div style={{ marginBottom: 12 }}>
                    <h3>Model</h3>
                    {filePreviewInvalid ? (
                      <div className="text-error">{filePreviewError}</div>
                    ) : (
                      <FilePreview
                        url={toFullUrl(question.uml_use_file_path)}
                        filename={question.uml_use_file_path}
                        filePath={question.uml_use_file_path}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>
    </Section>
  );
}
