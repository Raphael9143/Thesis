import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Tabs from '../../components/ui/Tabs';
import AllContributions from './AllContributions';
import MyContributions from './MyContributions';

export default function ContributionHistory() {
  const [activeSubTab, setActiveSubTab] = useState('all');
  const [, setSearchParams] = useSearchParams();

  const handleTabChange = (newTab) => {
    setActiveSubTab(newTab);
    // Reset to page 1 when switching tabs
    setSearchParams({ page: 1 });
  };

  return (
    <div className="contribution-history-container">
      <Tabs
        tabs={[
          { value: 'all', label: 'All Contributions' },
          { value: 'mine', label: 'My Contributions' },
        ]}
        activeTab={activeSubTab}
        onChange={handleTabChange}
      />

      <div className="contribution-history-content">
        {activeSubTab === 'all' && <AllContributions />}
        {activeSubTab === 'mine' && <MyContributions />}
      </div>
    </div>
  );
}
