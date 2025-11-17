import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TimelineEvent {
  id: string;
  date: string;
  description: string;
  links?: {
    depositions?: number[];
    exhibits?: number[];
    legal_theories?: number[];
  };
}

interface TimelineDisplayProps {
  caseId: string; // Assuming a caseId to fetch timeline data
  refreshTrigger: boolean; // New prop to trigger data refresh
}

const TimelineDisplay: React.FC<TimelineDisplayProps> = ({ caseId, refreshTrigger }) => {
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  useEffect(() => {
    // Simulate fetching data from a backend API
    const fetchTimelineData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/timeline/${caseId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setTimelineEvents(data.sort((a: TimelineEvent, b: TimelineEvent) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTimelineData();
  }, [caseId, refreshTrigger]); // Add refreshTrigger to dependency array

  if (loading) {
    return <div className="text-text-secondary">Loading timeline...</div>;
  }

  if (error) {
    return <div className="text-accent-red">Error: {error}</div>;
  }

  return (
    <div className="cds-card-cinematic p-6">
      <h3 className="text-xl font-bold text-text-primary mb-4">Case Timeline</h3>
      <div className="relative border-l-2 border-border-default pl-8">
        {timelineEvents.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="mb-8 flex items-start relative"
          >
            <div className="absolute -left-3 w-6 h-6 rounded-full bg-accent-cyan border-2 border-background-canvas flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-background-canvas"></div>
            </div>
            <div className="flex-grow">
              <p className="text-sm text-text-tertiary">{event.date}</p>
              <p
                className="text-text-primary font-medium cursor-pointer hover:text-accent-blue transition-colors"
                onClick={() => setSelectedEvent(event)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedEvent(event);
                  }
                }}
              >
                {event.description}
              </p>
              {selectedEvent?.id === event.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-2 p-3 bg-background-panel rounded-md text-sm text-text-secondary"
                >
                  <p><strong>Details:</strong> {event.description}</p>
                  {event.links && (
                    <div className="mt-2">
                      {event.links.depositions && event.links.depositions.length > 0 && (
                        <p><strong>Depositions:</strong> {event.links.depositions.join(', ')}</p>
                      )}
                      {event.links.exhibits && event.links.exhibits.length > 0 && (
                        <p><strong>Exhibits:</strong> {event.links.exhibits.join(', ')}</p>
                      )}
                      {event.links.legal_theories && event.links.legal_theories.length > 0 && (
                        <p><strong>Legal Theories:</strong> {event.links.legal_theories.join(', ')}</p>
                      )}
                    </div>
                  )}
                  {/* Placeholder for document/citation previewer/popout */}
                  <button className="mt-3 c-btn text-xs">View Related Documents</button>
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TimelineDisplay;
