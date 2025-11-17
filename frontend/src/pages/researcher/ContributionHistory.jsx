import React, { useState } from 'react';
import Tabs from '../../components/ui/Tabs';
import AllContributions from './AllContributions';
import MyContributions from './MyContributions';

export default function ContributionHistory() {
  const [activeSubTab, setActiveSubTab] = useState('all');

  return (
    <div className="contribution-history-container">
      <Tabs
        tabs={[
          { value: 'all', label: 'All Contributions' },
          { value: 'mine', label: 'My Contributions' },
        ]}
        activeTab={activeSubTab}
        onChange={setActiveSubTab}
      />

      <div className="contribution-history-content">
        {activeSubTab === 'all' && <AllContributions />}
        {activeSubTab === 'mine' && <MyContributions />}
      </div>
    </div>
  );
}
