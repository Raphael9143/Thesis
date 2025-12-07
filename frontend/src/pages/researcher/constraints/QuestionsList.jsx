import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Section from '../../../components/ui/Section';
import userAPI from '../../../../services/userAPI';
import '../../..//assets/styles/pages/ProjectDetail.css';
import '../../..//assets/styles/components/ContributionCard.css';

export default function QuestionsList({ refreshKey }) {
  const { projectId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [participantCounts, setParticipantCounts] = useState({});
  const [answerCounts, setAnswerCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await userAPI.listQuestionsForProject(projectId);
        if (mounted) {
          if (res?.success) {
            setQuestions(res.data || []);
            // fetch participant counts for each question
            const qs = res.data || [];
            if (Array.isArray(qs) && qs.length > 0) {
              const ids = qs.map((q) => q.id);
              const participantPromises = ids.map((id) =>
                userAPI
                  .getQuestionParticipantCount(id)
                  .then((r) => {
                    if (!r) return 0;
                    if (r.success && r.data && typeof r.data.participant_count === 'number')
                      return r.data.participant_count;
                    if (r.data && typeof r.data.participant_count === 'number')
                      return r.data.participant_count;
                    return 0;
                  })
                  .catch(() => 0)
              );

              const answerPromises = ids.map((id) =>
                userAPI
                  .getQuestionAnswerCount(id)
                  .then((r) => {
                    if (!r) return 0;
                    if (r.success && r.data && typeof r.data.answer_count === 'number')
                      return r.data.answer_count;
                    if (r.data && typeof r.data.answer_count === 'number')
                      return r.data.answer_count;
                    return 0;
                  })
                  .catch(() => 0)
              );

              Promise.all([Promise.all(participantPromises), Promise.all(answerPromises)]).then(
                ([pCounts, aCounts]) => {
                  const pMap = {};
                  const aMap = {};
                  ids.forEach((id, idx) => {
                    pMap[id] = pCounts[idx] || 0;
                    aMap[id] = aCounts[idx] || 0;
                  });
                  setParticipantCounts(pMap);
                  setAnswerCounts(aMap);
                }
              );
            }
          } else setQuestions([]);
        }
      } catch (err) {
        if (!mounted) return;
        console.error('Fetch questions error', err);
        setError(err?.response?.data?.message || err.message || 'Failed to load questions');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [projectId, refreshKey]);

  return (
    <Section>
      <h2>Questions</h2>
      {loading && <div>Loading questions...</div>}
      {error && <div className="text-error">{error}</div>}
      {!loading && !error && (
        <div className="contributions-list">
          {questions.length === 0 && <div>No questions yet.</div>}
          {questions.map((q) => (
            <div
              key={q.id}
              className="contribution-card"
              onClick={() =>
                navigate(`/researcher/projects/${projectId}/questions/${q.id}`, {
                  state: { question: q },
                })
              }
              style={{ cursor: 'pointer' }}
            >
              <div className="contribution-card-header">
                <h3 className="contribution-card-title">{q.title}</h3>
              </div>
              {q.description && (
                <p className="contribution-card-description">
                  {q.description.length > 300 ? q.description.slice(0, 300) + '…' : q.description}
                </p>
              )}
              <div className="contribution-card-meta">
                <span className="contribution-card-date">
                  <i className="fa fa-calendar" /> {new Date(q.created_at).toLocaleDateString()}
                </span>
                <span className="contribution-card-contributor" style={{ marginLeft: 12 }}>
                  {participantCounts[q.id] === 1
                    ? '1 contributor has joined'
                    : `${participantCounts[q.id] || 0} contributors have joined!`}
                </span>
                <span className="contribution-card-contributor" style={{ marginLeft: 12 }}>
                  {answerCounts[q.id] === 1
                    ? '1 answer for this problem!'
                    : `${answerCounts[q.id] || 0} answers for this problem!`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
