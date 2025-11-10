import { useEffect } from 'react';
import { usePageInfo } from '../contexts/PageInfoContext';

// Simple hook to set the page title from any component
export default function useTitle(title) {
  const { setTitle } = usePageInfo();
  useEffect(() => {
    if (!setTitle) return;
    setTitle(title || '');
  }, [setTitle, title]);
}
