import React, { useState, useCallback } from 'react';
import TimelineDisplay from '@/components/timeline/TimelineDisplay';
import TimelineEventCreator from '@/components/timeline/TimelineEventCreator';

const TimelinePage: React.FC = () => {
  // You would typically get the caseId from the URL parameters or a global state
  const caseId = "example-case-123"; 
  const [refreshTimeline, setRefreshTimeline] = useState(false);

  const handleEventCreated = useCallback(() => {
    setRefreshTimeline(prev => !prev); // Toggle state to trigger re-fetch in TimelineDisplay
  }, []);

  return (
    <div className="cds-main-cinematic">
      <h1 className="text-3xl font-bold text-text-primary mb-4">Case Timeline</h1>
      <TimelineDisplay caseId={caseId} refreshTrigger={refreshTimeline} />
      <TimelineEventCreator caseId={caseId} onEventCreated={handleEventCreated} />
    </div>
  );
};

export default TimelinePage;
