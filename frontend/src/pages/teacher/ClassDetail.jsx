import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import userAPI from '../../../services/userAPI';
import '../../assets/styles/ui.css';
import '../../assets/styles/pages/teacher/ClassDetail.css';
import CreateLectureForm from '../../components/teacher/CreateLectureForm';

export default function ClassDetailPage() {
  const { id, courseId: routeCourseId } = useParams();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [exams, setExams] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courseIdState, setCourseIdState] = useState(routeCourseId || null);
  const [lectureModalOpen, setLectureModalOpen] = useState(false);
  const [editingLecture, setEditingLecture] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        // fetch class details to get course id if available
        const cls = await userAPI.getClassById(id);
        if (!mounted) return;
        if (cls?.success && cls.data) {
          setClassInfo(cls.data);
        }

        // determine course id: prefer route param, then cls.data.course_id or cls.data.courseId, else fall back to id
        const courseId = routeCourseId || ((cls?.success && cls.data && (cls.data.course_id || cls.data.courseId || cls.data.courseId === 0 ? (cls.data.course_id || cls.data.courseId) : null)) || id);
        setCourseIdState(courseId);

        // fetch lectures, exams, assignments in parallel
        const [lectRes, examRes, assignRes] = await Promise.all([
          userAPI.getLecturesByCourse(courseId),
          userAPI.getExamsByCourse(courseId),
          userAPI.getAssignmentsByCourse(courseId),
        ]);

        if (!mounted) return;
        if (lectRes?.success && Array.isArray(lectRes.data)) setLectures(lectRes.data);
        if (examRes?.success && Array.isArray(examRes.data)) setExams(examRes.data);
        if (assignRes?.success && Array.isArray(assignRes.data)) setAssignments(assignRes.data);
      } catch (err) {
        console.error('Failed to load class detail', err);
        if (!mounted) return;
        setError(err?.response?.data?.message || err.message || 'Server error');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const publishLecture = async (lectureId) => {
    try {
      const res = await userAPI.patchLectureStatus(lectureId, 'published');
      if (res?.success) {
        setLectures((s) => s.map(x => x.id === lectureId ? res.data : x));
      }
    } catch (error) {
      console.error('publish lecture error', error);
    }
  }

  const cancelLecture = async (l) => {
    if (!confirm('Delete this lecture?')) return;
    try {
      const res = await userAPI.deleteLecture(l.id);
      if (res?.success) setLectures((s) => s.filter(x => x.id !== l.id));
    } catch (err) {
      console.error('delete error', err);
    }
  }

  const updateLecture = async (l) => {
    setEditingLecture(l);
    setLectureModalOpen(true);
  }

  return (
    <Section title={classInfo?.name || 'Class'}>
      <Card>
        <div className="class-detail">
          <div className="class-detail__sections">
            <div className="class-detail__panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0 }}>Lectures</h4>
                <div>
                  <button className="btn btn-primary btn-sm" onClick={() => setLectureModalOpen(true)}>New Lecture</button>
                </div>
              </div>
              {loading && <div>Loading contents...</div>}
              {error && <div className="text-error">{error}</div>}
              {!loading && !error && lectures.length === 0 && <div>No lectures.</div>}
              {!loading && !error && lectures.length > 0 && (
                <ul className="class-detail__list">
                  {lectures.map(l => (
                    <li key={l.id} className="class-detail__list-item">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <div style={{ cursor: 'pointer' }} onClick={() => navigate(`/education/teacher/classes/${id}/courses/${courseIdState}/lectures/${l.id}`)}>
                          <div style={{ fontWeight: 700 }}>{l.title}</div>
                          <small>{l.publish_date ? new Date(l.publish_date).toLocaleString() : ''}</small>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginLeft: 12 }}>
                          {l.status === 'draft' ? (
                            <>
                              <button className="btn btn-icon" title="Publish" onClick={() => publishLecture(l.id)}>
                                <i className="fa fa-paper-plane" />
                              </button>
                              <button className="btn btn-icon" title="Delete" onClick={() => cancelLecture(l)}>
                                <i className="fa fa-times" />
                              </button>
                              <button className="btn btn-icon" title="Update" onClick={() => updateLecture(l)}>
                                <i className="fa fa-edit" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button className="btn btn-icon" title="Delete" onClick={() => cancelLecture(l)}>
                                <i className="fa fa-times" />
                              </button>
                              <button className="btn btn-icon" title="Update" onClick={() => updateLecture(l)}>
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

            <div className="class-detail__panel">
              <h4>Assignments</h4>
              {!loading && !error && assignments.length === 0 && <div>No assignments.</div>}
              {!loading && !error && assignments.length > 0 && (
                <ul className="class-detail__list">
                  {assignments.map(a => (
                    <li key={a.assignment_id} className="class-detail__list-item" onClick={() => navigate(`/education/teacher/classes/${id}/courses/${courseIdState}/assignments/${a.assignment_id}`)}>
                      <div style={{ fontWeight: 700 }}>{a.title}</div>
                      <small>{a.courses?.[0]?.assignment_course?.due_date ? `Due: ${new Date(a.courses[0].assignment_course.due_date).toLocaleString()}` : ''}</small>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="class-detail__panel">
              <h4>Exams</h4>
              {!loading && !error && exams.length === 0 && <div>No exams.</div>}
              {!loading && !error && exams.length > 0 && (
                <ul className="class-detail__list">
                  {exams.map(ex => (
                    <li key={ex.id} className="class-detail__list-item" onClick={() => navigate(`/education/teacher/classes/${id}/courses/${courseIdState}/exams/${ex.id}`)}>
                      <div style={{ fontWeight: 700 }}>{ex.title}</div>
                      <small>{ex.start_time ? `${new Date(ex.start_time).toLocaleString()} - ${new Date(ex.end_time).toLocaleString()}` : ''}</small>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </Card>
      <CreateLectureForm
        open={lectureModalOpen}
        onClose={() => { setLectureModalOpen(false); setEditingLecture(null); }}
        defaultCourseId={courseIdState}
        defaultClassId={id}
        lecture={editingLecture}
        onCreated={(newLecture) => {
          if (newLecture) setLectures((s) => [newLecture, ...s]);
        }}
        onUpdated={(updated) => {
          if (updated) setLectures((s) => s.map(x => x.id === updated.id ? updated : x));
        }}
      />
    </Section>
  );
}
