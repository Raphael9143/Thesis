import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Section from '../../../components/ui/Section';
import Card from '../../../components/ui/Card';
import Tabs from '../../../components/ui/Tabs';
import userAPI from '../../../../services/userAPI';
import '../../../assets/styles/ui.css';
import useTitle from '../../../hooks/useTitle';
import { useNotifications } from '../../../contexts/NotificationContext';
import GradeSubmissionModal from '../../../components/teacher/GradeSubmissionModal';
import Modal from '../../../components/ui/Modal';
import FilePreview from '../../../components/ui/FilePreview';
import toFullUrl from '../../../utils/FullURLFile';

export default function StudentSubmissions() {
  const { courseId, studentId } = useParams();
  const [kind, setKind] = useState('assignments'); // 'assignments' or 'exams'
  const [items, setItems] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [exams, setExams] = useState([]);
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [selectedForGrade, setSelectedForGrade] = useState(null);
  // preview handled in modal instead of navigation
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewFilename, setPreviewFilename] = useState(null);
  const [previewFilePath, setPreviewFilePath] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailTab, setDetailTab] = useState('problem'); // 'problem' | 'submission'
  const { push } = useNotifications();

  useTitle('Student submissions');

  useEffect(() => {
    let mounted = true;
    const loadItems = async () => {
      setLoading(true);
      setError(null);
      try {
        // Backend returns combined list with `kind` field (assignment or exam)
        const params = { course: courseId };
        const res = await userAPI.getStudentAssignments(studentId, params);
        if (!mounted) return;
        if (res?.success && Array.isArray(res.data)) {
          const all = res.data;
          const a = all.filter((it) => (it.kind || 'assignment') === 'assignment');
          const e = all.filter((it) => (it.kind || '') === 'exam');
          setAssignments(a);
          setExams(e);
          setItems(kind === 'assignments' ? a : e);
        } else {
          setAssignments([]);
          setExams([]);
          setItems([]);
        }
      } catch (err) {
        if (!mounted) return;
        const msg = err?.response?.data?.message || err.message || 'Failed to load submissions';
        setError(msg);
        try {
          push({ title: 'Error', body: msg });
        } catch (pushErr) {
          console.warn('Notification push error', pushErr);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadItems();
    return () => {
      mounted = false;
    };
  }, [courseId, studentId, kind, push]);

  // update items when kind changes
  useEffect(() => {
    setItems(kind === 'assignments' ? assignments : exams);
  }, [kind, assignments, exams]);

  const handleOpenGrade = async (it) => {
    // fetch submissions for this activity and find the submission for this student
    const itemKind = it.kind || kind || 'assignment';
    try {
      setLoading(true);
      let res;
      if (itemKind === 'assignment') res = await userAPI.getSubmissionsByAssignmentId(it.id);
      else res = await userAPI.getSubmissionsByExamId(it.id);
      if (res?.success && Array.isArray(res.data)) {
        const subs = res.data;
        const found = subs.find(
          (s) =>
            Number(s.student?.student_id) === Number(studentId) ||
            Number(s.student?.user?.id) === Number(studentId) ||
            Number(s.student_id) === Number(studentId)
        );
        if (found) {
          setSelectedForGrade(found);
          setGradeModalOpen(true);
        } else {
          try {
            push({ title: 'Info', body: 'No submission found for this student.' });
          } catch (pushErr) {
            console.warn('Notification push error', pushErr);
          }
        }
      } else {
        try {
          push({ title: 'Error', body: res?.message || 'Failed to fetch submissions.' });
        } catch (pushErr) {
          console.warn('Notification push error', pushErr);
        }
      }
    } catch (err) {
      try {
        push({
          title: 'Error',
          body: err?.response?.data?.message || err.message || 'Failed to fetch submissions.',
        });
      } catch (pushErr) {
        console.warn('Notification push error', pushErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const openDetailFor = async (it) => {
    setDetailTab('problem');
    setLoading(true);
    try {
      // fetch full resource (assignment/exam) so we have answer_attachment
      const itemKind = it.kind || kind || 'assignment';
      let rres;
      if (itemKind === 'assignment') rres = await userAPI.getAssignmentById(it.id);
      else rres = await userAPI.getExamById(it.id);
      if (rres?.success) {
        setSelectedItem(rres.data);
      } else {
        // fallback to the summary item
        setSelectedItem(it);
      }
    } catch (err) {
      console.warn('Failed to load full resource for detail view', err);
      setSelectedItem(it);
    } finally {
      setLoading(false);
    }
  };

  const onGraded = async () => {
    // refresh the student's assignment/exam list after grading
    try {
      setLoading(true);
      const params = { course: courseId };
      const res = await userAPI.getStudentAssignments(studentId, params);
      if (res?.success && Array.isArray(res.data)) {
        const all = res.data;
        const a = all.filter((it2) => (it2.kind || 'assignment') === 'assignment');
        const e = all.filter((it2) => (it2.kind || '') === 'exam');
        setAssignments(a);
        setExams(e);
        setItems(kind === 'assignments' ? a : e);
      }
    } catch (refreshErr) {
      console.warn('Failed to refresh student assignments after grading', refreshErr);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section>
      <Card>
        <Tabs
          tabs={[
            { value: 'assignments', label: 'Assignments' },
            { value: 'exams', label: 'Exams' },
          ]}
          activeTab={kind}
          onChange={(v) => setKind(v)}
        />

        {loading && <div>Loading {kind}...</div>}
        {error && <div className="text-error">{error}</div>}

        {!loading && !error && items.length === 0 && (
          <div>No {kind} found for this student in this course.</div>
        )}

        {!loading && !error && !selectedItem && items.length > 0 && (
          <table className="table students-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Due</th>
                <th>Submissions</th>
                <th>Graded</th>
                <th>Preview</th>
                <th>Download</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={`${it.kind}-${it.id}-${idx}`}>
                  <td style={{ width: 48 }}>{idx + 1}</td>
                  <td>
                    <a
                      className="score-btn"
                      onClick={() => {
                        openDetailFor(it);
                      }}
                    >
                      {it.title}
                    </a>
                  </td>
                  <td>{it.due_date ? new Date(it.due_date).toLocaleString() : '-'}</td>
                  <td>
                    {typeof it.submissions_count !== 'undefined'
                      ? `${it.submissions_count}/${it.attempt_limit}`
                      : '-'}
                  </td>
                  <td>
                    <a className="score-btn" onClick={() => handleOpenGrade(it)}>
                      {typeof it.score !== 'undefined' && it.score !== null
                        ? `${String(it.score)}`
                        : 'Not graded'}
                    </a>
                  </td>
                  <td>
                    {it.attachment ? (
                      <a
                        className="score-btn"
                        onClick={() => {
                          setPreviewUrl(toFullUrl(it.attachment));
                          setPreviewFilename(it.attachment);
                          setPreviewFilePath(it.attachment);
                          setPreviewOpen(true);
                        }}
                      >
                        Preview
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    {it.attachment ? (
                      <a href={toFullUrl(it.attachment)} target="_blank" rel="noreferrer">
                        Download
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {selectedItem && (
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{selectedItem.title}</h3>
              <div>
                <button className="btn btn-signin" onClick={() => setSelectedItem(null)}>
                  Back
                </button>
              </div>
            </div>
            <Tabs
              tabs={[
                { value: 'problem', label: 'Problem' },
                { value: 'answer', label: 'Answer' },
              ]}
              activeTab={detailTab}
              onChange={setDetailTab}
            />

            {detailTab === 'problem' && (
              <div className="preview-body mb-8">
                <div dangerouslySetInnerHTML={{ __html: selectedItem.description || '' }} />
                {selectedItem.attachment && (
                  <div className="mt-8 file-preview-wrapper">
                    <FilePreview
                      url={selectedItem.attachment}
                      filename={selectedItem.attachment}
                      filePath={selectedItem.attachment}
                    />
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        <GradeSubmissionModal
          open={gradeModalOpen}
          onClose={() => setGradeModalOpen(false)}
          submission={selectedForGrade}
          onGraded={onGraded}
        />
        <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="File preview">
          <FilePreview url={previewUrl} filename={previewFilename} filePath={previewFilePath} />
        </Modal>
        {/* Model/file preview moved to dedicated page /file/preview */}
      </Card>
    </Section>
  );
}
