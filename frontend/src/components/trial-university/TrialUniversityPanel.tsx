import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Lesson {
  id: string;
  title: string;
  summary: string;
  progress: number;
  icon: string;
  video_url?: string; // Added video_url
}

export function TrialUniversityPanel() {
  const [lessons, setLessons] = useState<Lesson[]>([]); // State to store fetched lessons
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const response = await fetch('/trial-university/lessons');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Lesson[] = await response.json();
        setLessons(data);
        setLoading(false);
      } catch (e: any) {
        setError(e.message);
        setLoading(false);
      }
    };

    fetchLessons();
  }, []);

  const selectedLesson = lessons.find(l => l.id === selectedLessonId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
      className="trial-university" // Use the predefined trial-university style
    >
      <header>
        <h2 className="text-text-primary">Trial University</h2>
        <p className="panel-subtitle text-text-secondary">Learn and master trial strategies with interactive modules.</p>
      </header>
      {loading && <p className="text-text-secondary text-center">Loading lessons...</p>}
      {error && <p className="text-accent-red text-center">Error: {error}</p>}
      {!loading && !error && (
        <>
          <div className="holoscreen-container">
            <div className="holoscreen-content">
              {/* Main content area for selected lesson video/details */}
              {selectedLesson ? (
                <div className="selected-lesson-detail">
                  <h3 className="text-text-primary">{selectedLesson.title}</h3>
                  <p className="text-text-secondary">{selectedLesson.summary}</p>
                  {selectedLesson.video_url && (
                    <div className="video-player-wrapper">
                      <iframe
                        width="100%"
                        height="315"
                        src={selectedLesson.video_url}
                        title={selectedLesson.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  )}
                  {!selectedLesson.video_url && (
                    <div className="video-player-placeholder">No video available for this lesson.</div>
                  )}
                </div>
              ) : (
                <div className="holoscreen-placeholder">
                  Select a module to begin your learning journey.
                </div>
              )}
            </div>
          </div>

          <div className="module-carousel">
            {lessons.map((lesson) => (
              <motion.div
                key={lesson.id}
                className={`module-card ${selectedLessonId === lesson.id ? 'selected' : ''}`}
                whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(0, 255, 255, 0.7)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedLessonId(lesson.id)}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <div className="neon-accent"></div>
                <div className="module-content">
                  <i className={`${lesson.icon} module-icon`}></i>
                  <h3 className="text-text-primary">{lesson.title}</h3>
                  <p className="text-text-secondary">{lesson.summary}</p>
                  <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${lesson.progress}%` }}>
                      <div className="progress-glow"></div>
                    </div>
                    <span className="progress-text">{lesson.progress}% Complete</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}
