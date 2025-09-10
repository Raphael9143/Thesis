import { useState } from 'react';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import './App.css';

function App() {
  const [tab, setTab] = useState('login');

  return (
    <div className="app-container">
      <div className="tab-nav">
        <button className={tab === 'login' ? 'active' : ''} onClick={() => setTab('login')}>Đăng nhập</button>
        <button className={tab === 'register' ? 'active' : ''} onClick={() => setTab('register')}>Đăng ký</button>
      </div>
      <div className="tab-content">
        {tab === 'login' ? <LoginPage /> : <RegisterPage />}
      </div>
    </div>
  );
}

export default App;
