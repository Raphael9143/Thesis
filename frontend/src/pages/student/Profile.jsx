import React, { useEffect, useState } from 'react';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import FormField from '../../components/ui/FormField';
import NotificationPopup from '../../components/ui/NotificationPopup';
import userAPI from '../../../services/userAPI';
import '../../assets/styles/pages/teacher/profile.css';

export default function StudentProfile() {
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
	const [studentCode, setStudentCode] = useState('');
	const [major, setMajor] = useState('');
	const [year, setYear] = useState('');

	useEffect(() => {
		const load = async () => {
			setLoading(true);
			setError('');
			try {
				const res = await userAPI.getStudentProfile();
				if (res?.success) {
					setProfile(res.data);
					const p = res.data;
					setFullName(p.full_name || '');
					setDob(p.dob ? String(p.dob).substring(0, 10) : '');
					setGender((p.gender || '').toString().toUpperCase());
					setAvatarUrl(p.avatar_url || '');
					setPhoneNumber(p.phone_number || '');
					setAddress(p.address || '');
					setStudentCode(p.student_code || '');
					setMajor(p.major || '');
					setYear(p.year != null ? String(p.year) : '');
				} else {
					const msg = res?.message || 'Failed to load profile';
					setError(msg);
					setNotifyMsg(msg);
					setNotifyType('error');
					setNotifyOpen(true);
				}
			} catch (e) {
				const msg = e?.response?.data?.message || 'Failed to load profile';
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
			// Student-specific update (student_code stays read-only)
			await userAPI.updateStudentProfile({
				major,
				year: year ? Number(year) : undefined,
			});
			const res = await userAPI.getStudentProfile();
			if (res?.success) {
				setProfile(res.data);
				setEditing(false);
				setNotifyMsg('Profile updated successfully');
				setNotifyType('success');
				setNotifyOpen(true);
				// Update session storage for navbar display
				try {
					sessionStorage.setItem('full_name', fullName || res.data.full_name || '');
					sessionStorage.setItem('avatar_url', avatarUrl || res.data.avatar_url || '');
				} catch { }
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
		<Section title="Student Profile" subtitle="Your account details">
			{loading && <Card>Loading...</Card>}
			{profile && !loading && (
				<div className="profile student-profile">
					<Card title="Enrolled classes" className="teacher-profile__courses">
						{Array.isArray(profile.enrolled_classes) && profile.enrolled_classes.length > 0 ? (
							<ul>
								{profile.enrolled_classes.map((c) => (
									<li key={c}>Class #{c}</li>
								))}
							</ul>
						) : (
							<p>No classes yet.</p>
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
										<button
											className="btn btn-signin cancel-btn"
											onClick={() => {
												setEditing(false);
												setFullName(profile.full_name || '');
												setDob(profile.dob ? String(profile.dob).substring(0, 10) : '');
												setGender((profile.gender || '').toString().toUpperCase());
												setAvatarUrl(profile.avatar_url || '');
												setPhoneNumber(profile.phone_number || '');
												setAddress(profile.address || '');
												setStudentCode(profile.student_code || '');
												setMajor(profile.major || '');
												setYear(profile.year != null ? String(profile.year) : '');
											}}
										>
											Cancel
										</button>
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
										<FormField label="Student Code" value={studentCode} readOnly />
										<FormField label="Major" value={major} onChange={(e) => setMajor(e.target.value)} />
									</div>
									<div className="form-row">
										<FormField label="Year" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
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
										<FormField label="Student Code" value={profile.student_code || ''} readOnly />
										<FormField label="Major" value={profile.major || ''} readOnly />
									</div>
									<div className="form-row">
										<FormField label="Year" value={String(profile.year ?? '')} readOnly />
										<FormField label="Completed Assignments" value={String(profile.completed_assignments ?? '0')} readOnly />
									</div>
								</div>
							)}
						</div>
					</section>

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
