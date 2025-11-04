import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Section from '../../../components/ui/Section';
import Card from '../../../components/ui/Card';
import userAPI from '../../../../services/userAPI';
import '../../../assets/styles/ui.css';
import { usePageInfo } from '../../../contexts/PageInfoContext';
import { useNotifications } from '../../../contexts/NotificationContext';

export default function StudentsList() {
  const { id } = useParams(); // id is class id
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setTitle: setPageTitle } = usePageInfo();
  const { push } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await userAPI.getStudentsByClass(id);
        if (!mounted) return;
        if (res?.success && Array.isArray(res.data)) {
          setStudents(res.data);
        } else {
          setStudents([]);
        }
        try { setPageTitle('Students'); } catch (_) {}
      } catch (err) {
        if (!mounted) return;
        const msg = err?.response?.data?.message || err.message || 'Failed to load students';
        setError(msg);
        try { push({ title: 'Error', body: msg }); } catch (_) {}
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  return (
    <Section title="Students">
      <Card>
        {loading && <div>Loading students...</div>}
        {error && <div className="text-error">{error}</div>}
        {!loading && !error && students.length === 0 && <div>No students enrolled.</div>}
        {!loading && !error && students.length > 0 && (
          <table className="table students-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, idx) => (
                <tr key={s.classStudentId || s.id}>
                  <td style={{ width: 48 }}>{idx + 1}</td>
                  <td>
                    <button className="link-button" onClick={() => navigate(`/education/users/${s.id}`)}>
                      {s.student_name}
                    </button>
                  </td>
                  <td style={{ width: 140 }}>
                    <div className="display-flex gap-8">
                      <button
                        className="btn btn-icon"
                        title="View submissions"
                        onClick={() => navigate(`/education/teacher/classes/${id}/students/${s.id}/submissions`)}
                      >
                        <i className="fa fa-eye" />
                      </button>
                      <button
                        className="btn btn-icon"
                        title="Remove from class"
                        onClick={() => {}}
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
      </Card>
    </Section>
  );
}
