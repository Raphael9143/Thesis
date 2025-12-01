import React, { useState } from 'react';
import Modal from '../../components/ui/Modal';
import userAPI from '../../../services/userAPI';
import { useNotifications } from '../../contexts/NotificationContext';
import '../../assets/styles/components/teacher/CreateClassModal.css';

const JoinClassModal = ({ open, onClose, onJoined }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { push } = useNotifications();

  const submit = async () => {
    if (!code || !code.trim()) {
      push({ title: 'Error', body: 'Please enter the class code' });
      return;
    }
    setLoading(true);
    try {
      const res = await userAPI.joinClass(code.trim());
      if (res?.success) {
        push({ title: 'Success', body: 'Joined class successfully' });
        onJoined?.(res.data);
        onClose?.();
      } else {
        push({ title: 'Error', body: res?.message || 'Failed to join class' });
      }
    } catch (err) {
      console.error('Join class error', err);
      push({ title: 'Error', body: err?.response?.data?.message || err.message || 'Server error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Join class">
      <div className="create-class-modal">
        <div className="input-group">
          <input
            className="auth-input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Enter class code (e.g. UML101)"
            style={{ width: '100%' }}
          />
        </div>

        <div className="modal-footer" style={{ marginTop: 12, justifyContent: 'center' }}>
          <button className="btn btn-primary btn-sm" onClick={submit} disabled={loading}>
            {loading ? 'Joining...' : 'Join class'}
          </button>
          <button className="btn btn-outline btn-sm" onClick={onClose} disabled={loading}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default JoinClassModal;
