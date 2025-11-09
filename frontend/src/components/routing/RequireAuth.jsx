import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import userAPI from '../../../services/userAPI';

export default function RequireAuth({ children }) {
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const isLogin = sessionStorage.getItem('isLogin') === 'true';

  useEffect(() => {
    // if not logged in locally, no need to hydrate
    if (!isLogin) {
      setChecking(false);
      return;
    }
    // if logged in but role missing, try to hydrate profile
    const role = sessionStorage.getItem('role');
    if (role) {
      setChecking(false);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const res = await userAPI.getProfile();
        if (!mounted) return;
        const r = (res?.data?.user?.role || '').toString().toLowerCase();
        if (r) sessionStorage.setItem('role', r);
      } catch (err) {
        console.warn('RequireAuth: failed to hydrate profile', err);
      } finally {
        if (mounted) setChecking(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isLogin]);

  if (checking) return null; // or a spinner

  if (!isLogin) {
    return <Navigate to="/education" replace state={{ from: location }} />;
  }
  return children;
}
