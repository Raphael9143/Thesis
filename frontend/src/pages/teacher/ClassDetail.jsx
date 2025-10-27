import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import userAPI from '../../../services/userAPI';
import '../../assets/styles/ui.css';

export default function ClassDetailPage() {
  const { id, courseId: routeCourseId } = useParams(); // class id and optional course id
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [exams, setExams] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <Section title={classInfo?.name || 'Class'} subtitle={classInfo ? `${classInfo.code} • ${classInfo.semester} ${classInfo.year}` : 'Class details'}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Course contents</h3>
          <div>
            <button className="btn" onClick={() => navigate('/education/teacher/classes')}>Back</button>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          {loading && <div>Loading contents...</div>}
          {error && <div className="text-error">{error}</div>}

          {!loading && !error && (
            <div style={{ display: 'grid', gap: 18 }}>
              <section>
                <h4>Lectures</h4>
                {lectures.length === 0 ? <div>No lectures.</div> : (
                  <ul>
                    {lectures.map(l => (
                      <li key={l.id} style={{ padding: 8, borderBottom: '1px solid #eee', cursor: 'pointer' }} onClick={() => navigate(`/education/teacher/classes/${id}/courses/${courseId}/lectures/${l.id}`)}>
                        <div style={{ fontWeight: 600 }}>{l.title}</div>
                        <div style={{ color: '#6b7280' }}>{new Date(l.publish_date).toLocaleString()}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h4>Assignments</h4>
                {assignments.length === 0 ? <div>No assignments.</div> : (
                  <ul>
                    {assignments.map(a => (
                      <li key={a.assignment_id} style={{ padding: 8, borderBottom: '1px solid #eee', cursor: 'pointer' }} onClick={() => navigate(`/education/teacher/classes/${id}/courses/${courseId}/assignments/${a.assignment_id}`)}>
                        <div style={{ fontWeight: 600 }}>{a.title}</div>
                        <div style={{ color: '#6b7280' }}>{a.courses?.[0]?.assignment_course?.due_date ? `Due: ${new Date(a.courses[0].assignment_course.due_date).toLocaleString()}` : ''}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h4>Exams</h4>
                {exams.length === 0 ? <div>No exams.</div> : (
                  <ul>
                    {exams.map(ex => (
                      <li key={ex.id} style={{ padding: 8, borderBottom: '1px solid #eee', cursor: 'pointer' }} onClick={() => navigate(`/education/teacher/classes/${id}/courses/${courseId}/exams/${ex.id}`)}>
                        <div style={{ fontWeight: 600 }}>{ex.title}</div>
                        <div style={{ color: '#6b7280' }}>{ex.start_time ? `${new Date(ex.start_time).toLocaleString()} - ${new Date(ex.end_time).toLocaleString()}` : ''}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </div>
      </Card>
    </Section>
  );
}
