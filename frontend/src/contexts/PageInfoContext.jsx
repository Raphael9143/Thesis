import React, { createContext, useContext, useState } from 'react';

const PageInfoContext = createContext({
  title: '',
  setTitle: () => {},
});

export function PageInfoProvider({ children }) {
  const [title, setTitle] = useState('');
  return (
    <PageInfoContext.Provider value={{ title, setTitle }}>
      {children}
    </PageInfoContext.Provider>
  );
}

export function usePageInfo() {
  return useContext(PageInfoContext);
}

export default PageInfoContext;
