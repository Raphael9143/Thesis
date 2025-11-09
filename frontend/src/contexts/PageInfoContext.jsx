import React, { createContext, useContext, useState } from 'react';

const PageInfoContext = createContext({
  title: '',
  setTitle: () => {},
  showCourseNav: true,
  toggleCourseNav: () => {},
});

export function PageInfoProvider({ children }) {
  const [title, setTitle] = useState('');
  const [showCourseNav, setShowCourseNav] = useState(true);
  const toggleCourseNav = () => setShowCourseNav((s) => !s);
  return (
    <PageInfoContext.Provider value={{ title, setTitle, showCourseNav, toggleCourseNav }}>
      {children}
    </PageInfoContext.Provider>
  );
}

export function usePageInfo() {
  return useContext(PageInfoContext);
}

export default PageInfoContext;
