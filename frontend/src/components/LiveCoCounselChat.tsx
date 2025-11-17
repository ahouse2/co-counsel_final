import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

interface LiveCoCounselChatProps {
  speak: (text: string) => void;
}

export function LiveCoCounselChat({ speak }: LiveCoCounselChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'ai', text: 'Hello, how can I assist you today?' },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.sender === 'ai') {
      speak(lastMessage.text);
    }
  }, [messages, speak]);

  const handleSendMessage = useCallback(async () => {
    if (inputMessage.trim() === '') return;

    const userMessage: ChatMessage = { id: Date.now().toString(), sender: 'user', text: inputMessage };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputMessage('');
    setIsSending(true);
    setError(null);

    try {
      const agentId = 'co-counsel-agent'; 
      const sessionId = uuidv4(); // Generate a new session ID for each interaction
      const response = await fetch(`/api/agents/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          session_id: sessionId,
          prompt: inputMessage,
          agent_name: agentId 
        }),
      });

      if (!response.ok) {
        throw new Error(`Agent run failed: ${response.statusText}`);
      }

      const result = await response.json();
      const aiResponse: ChatMessage = { id: Date.now().toString(), sender: 'ai', text: result.response }; // Assuming response has a 'response' field
      setMessages((prevMessages) => [...prevMessages, aiResponse]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  }, [inputMessage]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
      className="panel-shell co-counsel" // Use co-counsel class for overall panel styling
    >
      <header>
        <h2 className="text-text-primary">Live Co-Counsel Chat</h2>
        <p className="panel-subtitle text-text-secondary">Real-time collaboration with your AI co-counsel.</p>
      </header>
      <div className="chat-interface">
        <div className="chat-messages">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={`chat-message ${message.sender}`}
              >
                <span className="sender-label">{message.sender === 'user' ? 'You' : 'Co-Counsel'}:</span> {message.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div className="chat-input-area">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !isSending) {
                handleSendMessage();
              }
            }}
            placeholder="Type your message..."
            className="cds-input-cinematic chat-input"
            disabled={isSending}
          />
          <button onClick={handleSendMessage} className="cds-btn-accent send-button" disabled={isSending}>
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
        {error && <p className="text-accent-red text-sm mt-2">Error: {error}</p>}
      </div>
    </motion.div>
  );
}
