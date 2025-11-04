import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Section from '../../../components/ui/Section';
import Card from '../../../components/ui/Card';
import userAPI from '../../../../services/userAPI';
import '../../../assets/styles/ui.css';
import '../../../assets/styles/pages/ClassDetail.css';
import CreateAssignmentForm from '../../../components/teacher/CreateAssignmentForm';
import { usePageInfo } from '../../../contexts/PageInfoContext';
import { useNotifications } from '../../../contexts/NotificationContext';

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

        const assignRes = await userAPI.getAssignmentsByCourse(courseId);
        if (!mounted) return;
        if (assignRes?.success && Array.isArray(assignRes.data)) setAssignments(assignRes.data);
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

  const publishAssignment = async (assignmentId) => {
    try {
      const res = await userAPI.patchAssignmentStatus(assignmentId, 'published');
      if (res?.success) {
        setAssignments((s) => s.map(x => (x.assignment_id || x.id) === assignmentId ? res.data : x));
        push({ title: 'Success', body: 'Assignment published.' });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Failed to publish assignment.';
      try { push({ title: 'Error', body: msg }); } catch (_) { }
    }
  }

  const cancelAssignment = async (a) => {
    if (!confirm('Delete this assignment?')) return;
    try {
      const idv = a.assignment_id || a.id;
      const res = await userAPI.deleteAssignment(idv);
      if (res?.success) {
        setAssignments((s) => s.filter(x => (x.assignment_id || x.id) !== idv));
        push({ title: 'Success', body: 'Assignment deleted.' });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Failed to delete assignment.';
      try { push({ title: 'Error', body: msg }); } catch (_) { }
    }
  }

  const updateAssignment = async (a) => {
    setEditingAssignment(a);
    setAssignmentModalOpen(true);
  }

  return (
    <Section title={`Assignments — ${classInfo?.name || ''}`}>
      <Card>
        <div className="class-detail__panel">
          <div className="flex-between">
            <h4 className="no-margin">Assignments</h4>
            <div className='create-button-section'>
              <button className="btn btn-primary btn-sm" onClick={() => setAssignmentModalOpen(true)}>New Assignment</button>
            </div>
          </div>
          {!loading && !error && assignments.length === 0 && <div>No assignments.</div>}
          {!loading && !error && assignments.length > 0 && (
            <ul className="class-detail__list">
              {assignments.map(a => (
                <li key={a.assignment_id || a.id} className="class-detail__list-item">
                  <div className="flex-between full-width">
                    <div className="clickable" onClick={() => navigate(`/education/teacher/classes/${id}/courses/${courseIdState}/assignments/${a.assignment_id || a.id}`)}>
                      <div className="font-700 truncate">{a.title}</div>
                      <small>{a.courses?.[0]?.assignment_course?.due_date ? `Due: ${new Date(a.courses[0].assignment_course.due_date).toLocaleString()}` : ''}</small>
                    </div>
                    <div className="display-flex gap-8 ml-12">
                      {a.status === 'draft' ? (
                        <>
                          <button className="btn btn-icon" title="Publish" onClick={() => publishAssignment(a.assignment_id || a.id)}>
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
        onClose={() => { setAssignmentModalOpen(false); setEditingAssignment(null); }}
        defaultCourseId={courseIdState}
        assignment={editingAssignment}
        onCreated={(newAssignment) => {
          if (newAssignment) setAssignments((s) => [newAssignment, ...s]);
        }}
        onUpdated={(updated) => {
          if (updated) setAssignments((s) => s.map(x => (x.assignment_id || x.id) === (updated.assignment_id || updated.id) ? updated : x));
          setEditingAssignment(null);
        }}
      />
    </Section>
  );
}
