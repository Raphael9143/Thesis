import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Section from '../../../components/ui/Section';
import Card from '../../../components/ui/Card';
import userAPI from '../../../../services/userAPI';
import '../../../assets/styles/ui.css';
import { useNotifications } from '../../../contexts/NotificationContext';
import useTitle from '../../../hooks/useTitle';
import '../../../assets/styles/components/teacher/course/StudentList.css';
import AddStudentsModal from '../../../components/teacher/AddStudentsModal';

export default function StudentsList() {
  const { id, courseId } = useParams(); // id is class id, courseId available from parent route
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // page title handled by useTitle below
  const { push } = useNotifications();
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const [addModalOpen, setAddModalOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const pageParam = Number(searchParams.get('page')) || 1;
        const res = await userAPI.getStudentsByClass(id, { page: pageParam });
        if (!mounted) return;
        // Expecting response like: { success: true, pagination: {...}, data: [...] }
        if (res?.success && Array.isArray(res.data)) {
          setStudents(res.data);
          if (res.pagination) {
            setPagination({
              page: res.pagination.page || pageParam,
              pageSize: res.pagination.pageSize || (res.pagination.pageSize === 0 ? 0 : 20),
              total: res.pagination.total || 0,
              totalPages: res.pagination.totalPages || 1,
            });
          } else {
            setPagination({
              page: pageParam,
              pageSize: res.data.length || 20,
              total: res.data.length || 0,
              totalPages: 1,
            });
          }
        } else {
          setStudents([]);
          setPagination({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
        }
        // title handled via hook below
      } catch (err) {
        if (!mounted) return;
        const msg = err?.response?.data?.message || err.message || 'Failed to load students';
        setError(msg);
        try {
          push({ title: 'Error', body: msg });
        } catch (pushErr) {
          console.warn('Notification push error', pushErr);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, searchParams, push]);

  useTitle('Students');

  const refreshStudents = async () => {
    try {
      const pageParam = Number(searchParams.get('page')) || 1;
      const res = await userAPI.getStudentsByClass(id, { page: pageParam });
      if (res?.success && Array.isArray(res.data)) {
        setStudents(res.data);
        if (res.pagination) {
          setPagination({
            page: res.pagination.page || pageParam,
            pageSize: res.pagination.pageSize || (res.pagination.pageSize === 0 ? 0 : 20),
            total: res.pagination.total || 0,
            totalPages: res.pagination.totalPages || 1,
          });
        }
      }
    } catch (err) {
      console.warn('refreshStudents failed', err);
    }
  };

  const removeStudentFromClass = async (s) => {
    try {
      const ok = window.confirm('Remove this student from the class?');
      if (!ok) return;
      // send delete request with student id array
      const res = await userAPI.removeStudentsFromClass(id, { studentIds: [s.id] });
      if (res?.success) {
        // remove from UI list
        setStudents((prev) => prev.filter((x) => (x.classStudentId || x.id) !== (s.classStudentId || s.id)));
        push({ title: 'Removed', body: 'Student removed from class' });
      } else {
        push({ title: 'Error', body: res?.message || 'Failed to remove student' });
      }
    } catch (err) {
      console.error('Remove student error', err);
      push({
        title: 'Error',
        body: err?.response?.data?.message || err.message || 'Server error',
      });
    }
  };

  return (
    <Section>
      <Card>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button className="btn btn-primary" onClick={() => setAddModalOpen(true)}>
            Add student
          </button>
        </div>
        {loading && <div>Loading students...</div>}
        {error && <div className="text-error">{error}</div>}
        {!loading && !error && students.length === 0 && <div>No students enrolled.</div>}
        {!loading && !error && students.length > 0 && (
          <table className="table students-table">
            <thead>
              <tr>
                <th className="table-header index">Index</th>
                <th className="table-header code">Student Code</th>
                <th className="table-header name">Name</th>
                <th className="table-header actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, idx) => (
                <tr key={s.classStudentId || s.id}>
                  <td style={{ width: 48 }} className="table-cell index">
                    {(pagination.page - 1) * pagination.pageSize + idx + 1}
                  </td>
                  <td className="table-cell code" style={{ width: 120 }}>
                    {s.student_code || '-'}
                  </td>
                  <td className="table-cell name">
                    <p>{s.student_name}</p>
                  </td>
                  <td style={{ width: 140 }} className="table-cell actions">
                    <div className="display-flex gap-8">
                      <button
                        className="btn btn-icon"
                        title="View submissions"
                        onClick={() =>
                          navigate(`/education/teacher/classes/${id}/courses/${courseId}/students/${s.id}/submissions`)
                        }
                      >
                        <i className="fa fa-eye" />
                      </button>
                      <button
                        className="btn btn-icon"
                        title="Remove from class"
                        onClick={() => removeStudentFromClass(s)}
                      >
                        <i className="fa fa-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && !error && pagination.totalPages > 1 && (
          <div className="pagination" style={{ marginTop: 12 }}>
            <div className="pagination-indexes">
              <button
                className="pagination-prev"
                disabled={pagination.page <= 1}
                onClick={() => setSearchParams({ page: String(Math.max(1, pagination.page - 1)) })}
              >
                <i className="fa-solid fa-backward"></i>
              </button>

              {Array.from({ length: pagination.totalPages }).map((_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    className={`pagination-button ${p === pagination.page ? 'focus' : ''}`}
                    onClick={() => setSearchParams({ page: String(p) })}
                    style={{ marginLeft: 6 }}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                className="pagination-next"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() =>
                  setSearchParams({
                    page: String(Math.min(pagination.totalPages, pagination.page + 1)),
                  })
                }
                style={{ marginLeft: 8 }}
              >
                <i className="fa-solid fa-forward"></i>
              </button>
            </div>
            <div className="pagination-info">
              <span style={{ marginLeft: 12 }}>
                Page {pagination.page} / {pagination.totalPages} - {pagination.total} students
              </span>
            </div>
          </div>
        )}
      </Card>
      <AddStudentsModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        classId={id}
        onAdded={async () => {
          await refreshStudents();
        }}
      />
    </Section>
  );
}
