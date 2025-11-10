import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Section from '../../../components/ui/Section';
import Card from '../../../components/ui/Card';
import userAPI from '../../../../services/userAPI';
import '../../../assets/styles/ui.css';
import '../../../assets/styles/pages/ClassDetail.css';
import CreateAssignmentForm from '../../../components/teacher/CreateAssignmentForm';
import { useNotifications } from '../../../contexts/NotificationContext';
import useTitle from '../../../hooks/useTitle';

export default function AssignmentsList() {
  const { id, courseId: routeCourseId } = useParams();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courseIdState, setCourseIdState] = useState(routeCourseId || null);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  // prefer hook-based title handling
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
          // title will be handled by hooks below
        }

        const courseId = routeCourseId || (cls?.success && cls.data && (cls.data.course_id || cls.data.courseId)) || id;
        setCourseIdState(courseId);

        const assignRes = await userAPI.getAssignmentsByCourse(courseId);
        if (!mounted) return;
        if (assignRes?.success && Array.isArray(assignRes.data)) setAssignments(assignRes.data);
      } catch (err) {
        if (!mounted) return;
        const msg = err?.response?.data?.message || err.message || 'Server error';
        try {
          push({ title: 'Error', body: msg });
        } catch (err) {
          console.error('Notification push error', err);
          setError(msg);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, push, routeCourseId]);

  // Set section title. If routeCourseId is present, fall back to a generic 'Course' label.
  useTitle(`Assignments - ${classInfo?.name || (routeCourseId ? 'Course' : '')}`);

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
      const idv = a.assignment_id || a.id;
      const res = await userAPI.deleteAssignment(idv);
      if (res?.success) {
        setAssignments((s) => s.filter((x) => (x.assignment_id || x.id) !== idv));
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

  return (
    <Section>
      <Card>
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
      </Card>
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
    </Section>
  );
}
