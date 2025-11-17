import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface TimelineEventCreatorProps {
  caseId: string;
  onEventCreated: () => void; // Callback to refresh timeline after event creation
}

const TimelineEventCreator: React.FC<TimelineEventCreatorProps> = ({ caseId, onEventCreated }) => {
  const [eventText, setEventText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/timeline/${caseId}/event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ event_text: eventText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to add event: ${response.statusText}`);
      }

      const result = await response.json();
      setMessage({ type: 'success', text: `Timeline event "${result.description}" added successfully!` });
      setEventText('');
      onEventCreated(); // Notify parent to refresh timeline
    } catch (error: any) {
      console.error('Failed to add timeline event:', error);
      setMessage({ type: 'error', text: `Failed to add event: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="cds-card-cinematic p-6 mt-8"
    >
      <h3 className="text-xl font-bold text-text-primary mb-4">Add New Timeline Event</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="eventText" className="block text-sm font-medium text-text-secondary">
            Event Description (e.g., "YYYY-MM-DD description [dep:ID] [ex:ID] [theory:ID]")
          </label>
          <textarea
            id="eventText"
            rows={3}
            className="cds-input-cinematic mt-1 block w-full"
            value={eventText}
            onChange={(e) => setEventText(e.target.value)}
            placeholder="e.g., 2023-01-15 Initial client meeting [dep:1] [ex:101]"
            required
            disabled={isLoading}
          ></textarea>
        </div>
        <button
          type="submit"
          className="c-btn shimmer-btn"
          disabled={isLoading || !eventText.trim()}
        >
          {isLoading ? 'Adding Event...' : 'Add Event to Timeline'}
        </button>
        {message && (
          <div className={`p-3 rounded-md ${message.type === 'success' ? 'bg-accent-green/20 text-accent-green border border-accent-green/40' : 'bg-accent-red/20 text-accent-red border border-accent-red/40'}`}>
            {message.text}
          </div>
        )}
      </form>
    </motion.div>
  );
};

export default TimelineEventCreator;
