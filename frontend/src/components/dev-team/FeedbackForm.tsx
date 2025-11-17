import React, { useState } from 'react';

const FeedbackForm: React.FC = () => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subject, message, contact }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to submit feedback: ${response.statusText}`);
      }

      setSubmitStatus('success');
      setSubject('');
      setMessage('');
      setContact('');
    } catch (error: any) {
      console.error('Feedback submission failed:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="cds-card-cinematic p-6 mt-8">
      <h3 className="text-xl font-bold text-text-primary mb-4">Submit Feature Request or Bug Report</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-text-secondary">Subject</label>
          <input
            type="text"
            id="subject"
            className="cds-input-cinematic mt-1 block w-full"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-text-secondary">Details</label>
          <textarea
            id="message"
            rows={5}
            className="cds-input-cinematic mt-1 block w-full"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            disabled={isSubmitting}
          ></textarea>
        </div>
        <div>
          <label htmlFor="contact" className="block text-sm font-medium text-text-secondary">Contact Email (Optional)</label>
          <input
            type="email"
            id="contact"
            className="cds-input-cinematic mt-1 block w-full"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <button
          type="submit"
          className="c-btn shimmer-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </button>
        {submitStatus === 'success' && (
          <p className="text-accent-green mt-2">Thank you for your feedback! We'll review it shortly.</p>
        )}
        {submitStatus === 'error' && (
          <p className="text-accent-red mt-2">Failed to submit feedback. Please try again.</p>
        )}
      </form>
    </div>
  );
};

export default FeedbackForm;
