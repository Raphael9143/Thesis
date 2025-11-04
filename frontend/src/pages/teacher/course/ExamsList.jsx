import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Section from '../../../components/ui/Section';
import Card from '../../../components/ui/Card';
import userAPI from '../../../../services/userAPI';
import '../../../assets/styles/ui.css';
import '../../../assets/styles/pages/ClassDetail.css';
import CreateExamForm from '../../../components/teacher/CreateExamForm';
import { usePageInfo } from '../../../contexts/PageInfoContext';
import { useNotifications } from '../../../contexts/NotificationContext';

export default function ExamsList() {
  const { id, courseId: routeCourseId } = useParams();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState(null);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courseIdState, setCourseIdState] = useState(routeCourseId || null);
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const { setTitle: setPageTitle } = usePageInfo();
  const { push } = useNotifications();

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const cls = await userAPI.getClassById(id);
        if (!mounted) return;
        if (cls?.success && cls.data) {
          setClassInfo(cls.data);
          try {
            if (routeCourseId) {
              const courseRes = await userAPI.getCourseById(routeCourseId);
              if (courseRes?.success && courseRes.data) setPageTitle(courseRes.data.name || 'Course');
              else setPageTitle(cls.data.name || 'Class');
            } else setPageTitle(cls.data.name || 'Class');
          } catch (_) { try { setPageTitle(cls.data.name || 'Class'); } catch(_) {} }
        }

        const courseId = routeCourseId || ((cls?.success && cls.data && (cls.data.course_id || cls.data.courseId)) || id);
        setCourseIdState(courseId);

        const examRes = await userAPI.getExamsByCourse(courseId);
        if (!mounted) return;
        if (examRes?.success && Array.isArray(examRes.data)) setExams(examRes.data);
      } catch (err) {
        if (!mounted) return;
        const msg = err?.response?.data?.message || err.message || 'Server error';
        try { push({ title: 'Error', body: msg }); } catch (_) {}
        setError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const publishExam = async (examId) => {
    try {
      const res = await userAPI.patchExamStatus(examId, 'published');
      if (res?.success) {
        setExams((s) => s.map(x => (x.id === examId ? res.data : x)));
        push({ title: 'Success', body: 'Exam published.' });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Failed to publish exam.';
      try { push({ title: 'Error', body: msg }); } catch (_) { }
    }
  }

  const cancelExam = async (e) => {
    if (!confirm('Delete this exam?')) return;
    try {
      const idv = e.id || e.exam_id;
      const res = await userAPI.deleteExam(idv);
      if (res?.success) {
        setExams((s) => s.filter(x => (x.id || x.exam_id) !== idv));
        push({ title: 'Success', body: 'Exam deleted.' });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Failed to delete exam.';
      try { push({ title: 'Error', body: msg }); } catch (_) { }
    }
  }

  const updateExam = async (e) => {
    setEditingExam(e);
    setExamModalOpen(true);
  }

  return (
    <Section title={`Exams — ${classInfo?.name || ''}`}>
      <Card>
        <div className="class-detail__panel">
          <div className="flex-between">
            <h4 className="no-margin">Exams</h4>
            <div className='create-button-section'>
              <button className="btn btn-primary btn-sm" onClick={() => setExamModalOpen(true)}>New Exam</button>
            </div>
          </div>
          {!loading && !error && exams.length === 0 && <div>No exams.</div>}
          {!loading && !error && exams.length > 0 && (
            <ul className="class-detail__list">
              {exams.map(ex => (
                <li key={ex.id || ex.exam_id} className="class-detail__list-item">
                  <div className="flex-between full-width">
                    <div className="clickable" onClick={() => navigate(`/education/teacher/classes/${id}/courses/${courseIdState}/exams/${ex.id || ex.exam_id}`)}>
                      <div className="font-700 truncate">{ex.title}</div>
                    </div>
                    <div className="display-flex gap-8 ml-12">
                      {ex.status === 'draft' ? (
                        <>
                          <button className="btn btn-icon" title="Publish" onClick={() => publishExam(ex.id || ex.exam_id)}>
                            <i className="fa fa-paper-plane" />
                          </button>
                          <button className="btn btn-icon" title="Delete" onClick={() => cancelExam(ex)}>
                            <i className="fa fa-times" />
                          </button>
                          <button className="btn btn-icon" title="Update" onClick={() => updateExam(ex)}>
                            <i className="fa fa-edit" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-icon" title="Delete" onClick={() => cancelExam(ex)}>
                            <i className="fa fa-times" />
                          </button>
                          <button className="btn btn-icon" title="Update" onClick={() => updateExam(ex)}>
                            <i className="fa fa-edit" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
      <CreateExamForm
        open={examModalOpen}
        onClose={() => { setExamModalOpen(false); setEditingExam(null); }}
        defaultCourseId={courseIdState}
        exam={editingExam}
        onCreated={(newExam) => {
          if (newExam) setExams((s) => [newExam, ...s]);
        }}
        onUpdated={(updated) => {
          if (updated) setExams((s) => s.map(x => (x.id || x.exam_id) === (updated.id || updated.exam_id) ? updated : x));
          setEditingExam(null);
        }}
      />
    </Section>
  );
}
