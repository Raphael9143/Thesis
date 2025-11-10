import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Section from '../../../components/ui/Section';
import Card from '../../../components/ui/Card';
import userAPI from '../../../../services/userAPI';
import '../../../assets/styles/ui.css';
import '../../../assets/styles/pages/ClassDetail.css';
import CreateLectureForm from '../../../components/teacher/CreateLectureForm';
import CreateAssignmentForm from '../../../components/teacher/CreateAssignmentForm';
import CreateExamForm from '../../../components/teacher/CreateExamForm';
import { useNotifications } from '../../../contexts/NotificationContext';
import useTitle from '../../../hooks/useTitle';

export default function CourseOverview() {
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
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
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
          // title handled by hooks later
        }

        const courseId =
          routeCourseId ||
          (cls?.success &&
            cls.data &&
            (cls.data.course_id || cls.data.courseId || cls.data.courseId === 0
              ? cls.data.course_id || cls.data.courseId
              : null)) ||
          id;
        setCourseIdState(courseId);

        const [lectRes, examRes, assignRes] = await Promise.all([
          userAPI.getLecturesByCourse(courseId),
          userAPI.getExamsByCourse(courseId),
          userAPI.getAssignmentsByCourse(courseId),
        ]);

        if (!mounted) return;
        if (lectRes?.success && Array.isArray(lectRes.data)) setLectures(lectRes.data);
        // Title resolution for course/class will be handled by hooks
        if (examRes?.success && Array.isArray(examRes.data)) setExams(examRes.data);
        if (assignRes?.success && Array.isArray(assignRes.data)) setAssignments(assignRes.data);
      } catch (err) {
        if (!mounted) return;
        const msg = err?.response?.data?.message || err.message || 'Server error';
        try {
          push({ title: 'Error', body: msg });
        } catch (err) {
          console.error('Notification push error', err);
        }
        setError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, push, routeCourseId]);

  // Use only useTitle; if a routeCourseId is present, prefer the generic 'Course' fallback.
  useTitle(classInfo?.name || (routeCourseId ? 'Course' : 'Class'));

  const publishLecture = async (lectureId) => {
    try {
      const res = await userAPI.patchLectureStatus(lectureId, 'published');
      if (res?.success) {
        setLectures((s) => s.map((x) => (x.id === lectureId ? res.data : x)));
        push({ title: 'Success', body: 'Lecture published.' });
      }
    } catch (error) {
      const msg = error?.response?.data?.message || error.message || 'Failed to publish lecture.';
      try {
        push({ title: 'Error', body: msg });
      } catch (err) {
        console.error('Notification push error', err);
      }
    }
  };

  const cancelLecture = async (l) => {
    if (!confirm('Delete this lecture?')) return;
    try {
      const res = await userAPI.deleteLecture(l.id);
      if (res?.success) {
        setLectures((s) => s.filter((x) => x.id !== l.id));
        push({ title: 'Success', body: 'Lecture deleted.' });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Failed to delete lecture.';
      try {
        push({ title: 'Error', body: msg });
      } catch (err) {
        console.error('Notification push error', err);
      }
    }
  };

  const updateLecture = async (l) => {
    setEditingLecture(l);
    setLectureModalOpen(true);
  };

  const publishAssignment = async (assignmentId) => {
    try {
      const res = await userAPI.patchAssignmentStatus(assignmentId, 'published');
      if (res?.success) {
        setAssignments((s) => s.map((x) => ((x.assignment_id || x.id) === assignmentId ? res.data : x)));
        push({ title: 'Success', body: 'Assignment published.' });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Failed to publish assignment.';
      try {
        push({ title: 'Error', body: msg });
      } catch (err) {
        console.error('Notification push error', err);
      }
    }
  };

  const cancelAssignment = async (a) => {
    if (!confirm('Delete this assignment?')) return;
    try {
      const id = a.assignment_id || a.id;
      const res = await userAPI.deleteAssignment(id);
      if (res?.success) {
        setAssignments((s) => s.filter((x) => (x.assignment_id || x.id) !== id));
        push({ title: 'Success', body: 'Assignment deleted.' });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Failed to delete assignment.';
      try {
        push({ title: 'Error', body: msg });
      } catch (err) {
        console.error('Notification push error', err);
      }
    }
  };

  const updateAssignment = async (a) => {
    setEditingAssignment(a);
    setAssignmentModalOpen(true);
  };

  const publishExam = async (examId) => {
    try {
      const res = await userAPI.patchExamStatus(examId, 'published');
      if (res?.success) {
        setExams((s) => s.map((x) => (x.id === examId ? res.data : x)));
        push({ title: 'Success', body: 'Exam published.' });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Failed to publish exam.';
      try {
        push({ title: 'Error', body: msg });
      } catch (err) {
        console.error('Notification push error', err);
      }
    }
  };

  const cancelExam = async (e) => {
    if (!confirm('Delete this exam?')) return;
    try {
      const id = e.id || e.exam_id;
      const res = await userAPI.deleteExam(id);
      if (res?.success) {
        setExams((s) => s.filter((x) => (x.id || x.exam_id) !== id));
        push({ title: 'Success', body: 'Exam deleted.' });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Failed to delete exam.';
      try {
        push({ title: 'Error', body: msg });
      } catch (err) {
        console.error('Notification push error', err);
      }
    }
  };

  const updateExam = async (e) => {
    setEditingExam(e);
    setExamModalOpen(true);
  };

  return (
    <Section>
      <Card>
        <div className="class-detail">
          <div className="class-detail__sections">
            <div className="class-detail__panel">
              <div className="flex-between">
                <h4 className="no-margin">Lectures</h4>
                <div className="create-button-section">
                  <button className="btn btn-primary btn-sm" onClick={() => setLectureModalOpen(true)}>
                    New Lecture
                  </button>
                </div>
              </div>
              {loading && <div>Loading contents...</div>}
              {error && <div className="text-error">{error}</div>}
              {!loading && !error && lectures.length === 0 && <div>No lectures.</div>}
              {!loading && !error && lectures.length > 0 && (
                <ul className="class-detail__list">
                  {lectures.map((l) => (
                    <li key={l.id} className="class-detail__list-item">
                      <div className="flex-between full-width">
                        <div
                          className="clickable"
                          onClick={() =>
                            navigate(`/education/teacher/classes/${id}/courses/${courseIdState}/lectures/${l.id}`)
                          }
                        >
                          <div className="font-700 truncate">{l.title}</div>
                        </div>
                        <div className="display-flex gap-8 ml-12">
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
              <div className="flex-between">
                <h4 className="no-margin">Assignments</h4>
                <div className="create-button-section">
                  <button className="btn btn-primary btn-sm" onClick={() => setAssignmentModalOpen(true)}>
                    New Assignment
                  </button>
                </div>
              </div>
              {!loading && !error && assignments.length === 0 && <div>No assignments.</div>}
              {!loading && !error && assignments.length > 0 && (
                <ul className="class-detail__list">
                  {assignments.map((a) => (
                    <li key={a.assignment_id || a.id} className="class-detail__list-item">
                      <div className="flex-between full-width">
                        <div
                          className="clickable"
                          onClick={() =>
                            navigate(
                              `/education/teacher/classes/${id}/courses/${courseIdState}/assignments/${a.assignment_id || a.id}`
                            )
                          }
                        >
                          <div className="font-700 truncate">{a.title}</div>
                          <small>
                            {a.courses?.[0]?.assignment_course?.due_date
                              ? `Due: ${new Date(a.courses[0].assignment_course.due_date).toLocaleString()}`
                              : ''}
                          </small>
                        </div>
                        <div className="display-flex gap-8 ml-12">
                          {a.status === 'draft' ? (
                            <>
                              <button
                                className="btn btn-icon"
                                title="Publish"
                                onClick={() => publishAssignment(a.assignment_id || a.id)}
                              >
                                <i className="fa fa-paper-plane" />
                              </button>
                              <button className="btn btn-icon" title="Delete" onClick={() => cancelAssignment(a)}>
                                <i className="fa fa-times" />
                              </button>
                              <button className="btn btn-icon" title="Update" onClick={() => updateAssignment(a)}>
                                <i className="fa fa-edit" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button className="btn btn-icon" title="Delete" onClick={() => cancelAssignment(a)}>
                                <i className="fa fa-times" />
                              </button>
                              <button className="btn btn-icon" title="Update" onClick={() => updateAssignment(a)}>
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
              <div className="flex-between">
                <h4>Exams</h4>
                <div className="create-button-section">
                  <button className="btn btn-primary btn-sm" onClick={() => setExamModalOpen(true)}>
                    New Exam
                  </button>
                </div>
              </div>
              {!loading && !error && exams.length === 0 && <div>No exams.</div>}
              {!loading && !error && exams.length > 0 && (
                <ul className="class-detail__list">
                  {exams.map((ex) => (
                    <li key={ex.id || ex.exam_id} className="class-detail__list-item">
                      <div className="flex-between full-width">
                        <div
                          className="clickable"
                          onClick={() =>
                            navigate(
                              `/education/teacher/classes/${id}/courses/${courseIdState}/exams/${ex.id || ex.exam_id}`
                            )
                          }
                        >
                          <div className="font-700 truncate">{ex.title}</div>
                        </div>
                        <div className="display-flex gap-8 ml-12">
                          {ex.status === 'draft' ? (
                            <>
                              <button
                                className="btn btn-icon"
                                title="Publish"
                                onClick={() => publishExam(ex.id || ex.exam_id)}
                              >
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
          </div>
        </div>
      </Card>
      <CreateLectureForm
        open={lectureModalOpen}
        onClose={() => {
          setLectureModalOpen(false);
          setEditingLecture(null);
        }}
        defaultCourseId={courseIdState}
        defaultClassId={id}
        lecture={editingLecture}
        onCreated={(newLecture) => {
          if (newLecture) setLectures((s) => [newLecture, ...s]);
        }}
        onUpdated={(updated) => {
          if (updated) setLectures((s) => s.map((x) => (x.id === updated.id ? updated : x)));
        }}
      />
      <CreateAssignmentForm
        open={assignmentModalOpen}
        onClose={() => {
          setAssignmentModalOpen(false);
          setEditingAssignment(null);
        }}
        defaultCourseId={courseIdState}
        assignment={editingAssignment}
        onCreated={(newAssignment) => {
          if (newAssignment) setAssignments((s) => [newAssignment, ...s]);
        }}
        onUpdated={(updated) => {
          if (updated)
            setAssignments((s) =>
              s.map((x) => ((x.assignment_id || x.id) === (updated.assignment_id || updated.id) ? updated : x))
            );
          setEditingAssignment(null);
        }}
      />
      <CreateExamForm
        open={examModalOpen}
        onClose={() => {
          setExamModalOpen(false);
          setEditingExam(null);
        }}
        defaultCourseId={courseIdState}
        exam={editingExam}
        onCreated={(newExam) => {
          if (newExam) setExams((s) => [newExam, ...s]);
        }}
        onUpdated={(updated) => {
          if (updated)
            setExams((s) => s.map((x) => ((x.id || x.exam_id) === (updated.id || updated.exam_id) ? updated : x)));
          setEditingExam(null);
        }}
      />
    </Section>
  );
}
