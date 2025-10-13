import React, { useEffect, useState } from 'react';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import FormField from '../../components/ui/FormField';
import NotificationPopup from '../../components/ui/NotificationPopup';
import userAPI from '../../../services/userAPI';
import '../../assets/styles/pages/teacher/profile.css';

export default function TeacherProfile() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [profile, setProfile] = useState(null);
	const [editing, setEditing] = useState(false);

	// notifications
	const [notifyOpen, setNotifyOpen] = useState(false);
	const [notifyMsg, setNotifyMsg] = useState('');
	const [notifyType, setNotifyType] = useState('error');

	// editable state
	const [fullName, setFullName] = useState('');
	const [dob, setDob] = useState('');
	const [gender, setGender] = useState('');
	const [avatarUrl, setAvatarUrl] = useState('');
	const [phoneNumber, setPhoneNumber] = useState('');
	const [address, setAddress] = useState('');
	const [teacherCode, setTeacherCode] = useState('');
	const [department, setDepartment] = useState('');
	const [researchPapers, setResearchPapers] = useState(''); // multiline textarea, comma or newline separated

	useEffect(() => {
		const load = async () => {
			setLoading(true);
			setError('');
			try {
				const res = await userAPI.getTeacherProfile();
				if (res?.success) {
					setProfile(res.data);
					const p = res.data;
					setFullName(p.full_name || '');
					setDob(p.dob ? String(p.dob).substring(0, 10) : '');
					setGender((p.gender || '').toString().toUpperCase());
					setAvatarUrl(p.avatar_url || '');
					setPhoneNumber(p.phone_number || '');
					setAddress(p.address || '');
					setTeacherCode(p.teacher_code || '');
					setDepartment(p.department || '');
					const papers = Array.isArray(p.research_papers) ? p.research_papers.join('\n') : '';
					setResearchPapers(papers);
				} else {
					setError(res?.message || 'Failed to load profile');
				}
			} catch (e) {
				const msg = e?.response?.data?.message || 'Please fill in all the fields correctly!';
				setError(msg);
				setNotifyMsg(msg);
				setNotifyType('error');
				setNotifyOpen(true);
			} finally {
				setLoading(false);
			}
		};
		load();
	}, []);

	const onSave = async () => {
		setLoading(true);
		setError('');
		try {
			// Primary auth profile update
			await userAPI.updateProfile({
				full_name: fullName,
				dob,
				gender: (gender || '').toString().toUpperCase(),
				avatar_url: avatarUrl,
				phone_number: phoneNumber,
				address,
			});
			const paperList = researchPapers
				.split(/\r?\n/)
				.map(s => s.trim())
				.filter(Boolean);
			// Do not allow updating teacher_code from UI; keep it immutable
			await userAPI.updateTeacherProfile({
				department,
				research_papers: paperList,
			});
			const res = await userAPI.getTeacherProfile();
			if (res?.success) {
				setProfile(res.data);
				setEditing(false);
			}
		} catch (e) {
			const msg = e?.response?.data?.message || 'Failed to update profile';
			setError(msg);
			setNotifyMsg(msg);
			setNotifyType('error');
			setNotifyOpen(true);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Section title="Teacher Profile" subtitle="Your account details">
			{loading && <Card>Loading...</Card>}
			{/* Errors are shown via NotificationPopup */}
			{profile && !loading && (
				<div className="profile teacher-profile">
					<Card title="Courses taught" className="teacher-profile__courses">
						{Array.isArray(profile.courses_taught) && profile.courses_taught.length > 0 ? (
							<ul>
								{profile.courses_taught.map((c) => (
									<li key={c}>Course #{c}</li>
								))}
							</ul>
						) : (
							<p>No courses yet.</p>
						)}
					</Card>
					<section className="profile-card">
						<div className="profile-body">
							<div className="profile-info">
								<div className="profile-info-section">
									<img
										src={(editing ? avatarUrl : profile.avatar_url) || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(profile.full_name || 'User')}
										alt="Profile"
										className="profile-pic"
									/>
									<div>
										<h3>{editing ? fullName : profile.full_name}</h3>
										<p>{profile.email}</p>
									</div>
								</div>
								{!editing ? (
									<div className="edit-actions-btns">
										<button className="btn btn-primary edit-btn" onClick={() => setEditing(true)}>Edit</button>
									</div>
								) : (
									<div className="edit-actions-btns">
										<button className="btn btn-signin cancel-btn" onClick={() => {
											setEditing(false);
											setFullName(profile.full_name || '');
											setDob(profile.dob ? String(profile.dob).substring(0, 10) : '');
											setGender((profile.gender || '').toString().toUpperCase());
											setAvatarUrl(profile.avatar_url || '');
											setPhoneNumber(profile.phone_number || '');
											setAddress(profile.address || '');
											setTeacherCode(profile.teacher_code || '');
											setDepartment(profile.department || '');
											setResearchPapers(Array.isArray(profile.research_papers) ? profile.research_papers.join('\n') : '');
										}}>Cancel</button>
										<button className="btn btn-primary save-btn" onClick={onSave}>Save</button>
									</div>
								)}
							</div>

							{editing && (
								<form className="profile-form" onSubmit={(e) => { e.preventDefault(); onSave(); }}>
									<div className="form-row">
										<FormField label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
									</div>

									<div className="form-row">
										<FormField label="Date of Birth" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
										<FormField label="Gender" value={gender} onChange={(e) => setGender(e.target.value)} options={[{ value: '', label: 'Select' }, { value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }, { value: 'OTHER', label: 'Other' }]} />
									</div>

									<div className="form-row">
										<FormField label="Phone Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
										<FormField label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
									</div>

									<div className="form-row">
										<FormField label="Teacher Code" value={teacherCode} readOnly />
										<FormField label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} />
									</div>
								</form>
							)}

							{!editing && (
								<div className="profile-form" style={{ marginTop: 20 }}>
									<div className="form-row">
										<FormField label="Full Name" value={profile.full_name || ''} readOnly />
									</div>
									<div className="form-row">
										<FormField label="Date of Birth" value={profile.dob ? String(profile.dob).substring(0, 10) : ''} readOnly />
										<FormField label="Gender" value={(profile.gender || '').toString()} readOnly />
									</div>
									<div className="form-row">
										<FormField label="Phone Number" value={profile.phone_number || ''} readOnly />
										<FormField label="Address" value={profile.address || ''} readOnly />
									</div>
									<div className="form-row">
										<FormField label="Teacher Code" value={profile.teacher_code || ''} readOnly />
										<FormField label="Department" value={profile.department || ''} readOnly />
									</div>
								</div>
							)}
						</div>
					</section>

					{/* Notification popup for errors */}
					<NotificationPopup
						message={notifyMsg}
						open={notifyOpen}
						type={notifyType}
						onClose={() => setNotifyOpen(false)}
					/>
				</div>
			)}
		</Section>
	);
}
