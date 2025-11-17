import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Tabs from '../../components/ui/Tabs';
import AllContributions from './AllContributions';
import MyContributions from './MyContributions';
import StatusContributions from './StatusContributions';

export default function ContributionHistory() {
  const [activeSubTab, setActiveSubTab] = useState('pending');
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
          { value: 'pending', label: 'Pending' },
          { value: 'needs_edit', label: 'Needs Edit' },
          { value: 'accepted', label: 'Accepted' },
          { value: 'rejected', label: 'Rejected' },
          { value: 'all', label: 'All' },
          { value: 'mine', label: 'My Contributions' },
        ]}
        activeTab={activeSubTab}
        onChange={handleTabChange}
      />

      <div className="contribution-history-content">
        {activeSubTab === 'pending' && <StatusContributions status="PENDING" />}
        {activeSubTab === 'needs_edit' && <StatusContributions status="NEEDS_EDIT" />}
        {activeSubTab === 'accepted' && <StatusContributions status="ACCEPTED" />}
        {activeSubTab === 'rejected' && <StatusContributions status="REJECTED" />}
        {activeSubTab === 'all' && <AllContributions />}
        {activeSubTab === 'mine' && <MyContributions />}
      </div>
    </div>
  );
}
