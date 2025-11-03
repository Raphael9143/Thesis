import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Section from '../../components/ui/Section';
import { usePageInfo } from '../../contexts/PageInfoContext';
import Card from '../../components/ui/Card';
import userAPI from '../../../services/userAPI';
import '../../assets/styles/ui.css';
import '../../assets/styles/pages/ClassDetail.css';

export default function StudentClassDetailPage() {
	const { id, courseId: routeCourseId } = useParams();
	const navigate = useNavigate();
	const [classInfo, setClassInfo] = useState(null);
	const [lectures, setLectures] = useState([]);
	const [exams, setExams] = useState([]);
	const [assignments, setAssignments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [courseIdState, setCourseIdState] = useState(routeCourseId || null);
	const { setTitle: setPageTitle } = usePageInfo();

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
							if (courseRes?.success && courseRes.data) {
								setPageTitle(courseRes.data.name || courseRes.data.title || courseRes.data.course_name || 'Course');
							} else {
								setPageTitle(cls.data.name || 'Class');
							}
						} else {
							setPageTitle(cls.data.name || 'Class');
						}
					} catch (_) {
						try { setPageTitle(cls.data.name || 'Class'); } catch (_) {}
					}
				}

				const courseId = routeCourseId || ((cls?.success && cls.data && (cls.data.course_id || cls.data.courseId || cls.data.courseId === 0 ? (cls.data.course_id || cls.data.courseId) : null)) || id);
				setCourseIdState(courseId);

				const [lectRes, examRes, assignRes] = await Promise.all([
					userAPI.getLecturesByCourse(courseId),
					userAPI.getExamsByCourse(courseId),
					userAPI.getAssignmentsByCourse(courseId),
				]);

				if (!mounted) return;
				if (lectRes?.success && Array.isArray(lectRes.data)) setLectures(lectRes.data);
				// If we don't yet have the course title, try fetching courses for the class and find matching course name
				try {
					if (routeCourseId) {
						const coursesRes = await userAPI.getCoursesByClass(id);
						if (coursesRes?.success && Array.isArray(coursesRes.data)) {
							const found = coursesRes.data.find(c => (c.id || c.course_id || c.courseId) == routeCourseId);
							if (found) setPageTitle(found.name || found.title || found.course_name || found.code || 'Course');
						}
					}
				} catch (_) {}
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
		<Section title={classInfo?.name || 'Class'}>
			<Card>
				<div className="class-detail">
					<div className="class-detail__sections">
						<div className="class-detail__panel">
							<h4>Lectures</h4>
							{loading && <div>Loading contents...</div>}
							{error && <div className="text-error">{error}</div>}
							{!loading && !error && lectures.length === 0 && <div>No lectures.</div>}
							{!loading && !error && lectures.length > 0 && (
								<ul className="class-detail__list">
									{lectures.map(l => (
										<li key={l.id} className="class-detail__list-item">
											<div className="class-detail__list-row">
												<div className="class-detail__item-click" onClick={() => navigate(`/education/student/classes/${id}/courses/${courseIdState}/lectures/${l.id}`)}>
													<div className="class-detail__item-title">{l.title}</div>
													<small>{l.publish_date ? new Date(l.publish_date).toLocaleString() : ''}</small>
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
										<li key={a.assignment_id} className="class-detail__list-item" onClick={() => navigate(`/education/student/classes/${id}/courses/${courseIdState}/assignments/${a.assignment_id}`)}>
											<div className="class-detail__item-title">{a.title}</div>
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
										<li key={ex.id} className="class-detail__list-item" onClick={() => navigate(`/education/student/classes/${id}/courses/${courseIdState}/exams/${ex.id}`)}>
											<div className="class-detail__item-title">{ex.title}</div>
											<small>{ex.start_date ? `${new Date(ex.start_date).toLocaleString()} - ${new Date(ex.end_date).toLocaleString()}` : ''}</small>
										</li>
									))}
									</ul>
								)}
						</div>
					</div>
				</div>
			</Card>
		</Section>
	);
}
