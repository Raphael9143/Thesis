import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Section from '../../../components/ui/Section';
import Card from '../../../components/ui/Card';
import userAPI from '../../../../services/userAPI';
import '../../../assets/styles/ui.css';
import '../../../assets/styles/pages/ClassDetail.css';
import CreateLectureForm from '../../../components/teacher/CreateLectureForm';
import { useNotifications } from '../../../contexts/NotificationContext';
import useTitle from '../../../hooks/useTitle';

export default function LecturesList() {
  const { id, courseId: routeCourseId } = useParams();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courseIdState, setCourseIdState] = useState(routeCourseId || null);
  const [lectureModalOpen, setLectureModalOpen] = useState(false);
  const [editingLecture, setEditingLecture] = useState(null);
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
          // Title for this view will be handled by useClassCourseTitle / useTitle hooks
        }

        const courseId = routeCourseId || (cls?.success && cls.data && (cls.data.course_id || cls.data.courseId)) || id;
        setCourseIdState(courseId);

        const lectRes = await userAPI.getLecturesByCourse(courseId);
        if (!mounted) return;
        if (lectRes?.success && Array.isArray(lectRes.data)) setLectures(lectRes.data);
      } catch (err) {
        if (!mounted) return;
        const msg = err?.response?.data?.message || err.message || 'Server error';
        try {
          push({ title: 'Error', body: msg });
        } catch (pushErr) {
          console.warn('Notification push error', pushErr);
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

  useTitle(`Lectures - ${classInfo?.name || (routeCourseId ? 'Course' : '')}`);

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
      } catch (pushErr) {
        console.warn('Notification push error', pushErr);
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
      } catch (pushErr) {
        console.warn('Notification push error', pushErr);
      }
    }
  };

  const updateLecture = async (l) => {
    setEditingLecture(l);
    setLectureModalOpen(true);
  };

  return (
    <Section>
      <Card>
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
    </Section>
  );
}
