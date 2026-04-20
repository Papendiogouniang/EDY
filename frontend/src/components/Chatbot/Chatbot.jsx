import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../../utils/api';
import DunisLogo from '../DunisLogo/DunisLogo';
import ReactMarkdown from 'react-markdown';
import { FiSend, FiX, FiLoader } from 'react-icons/fi';
import './Chatbot.css';

const QUICK = [
  "How do I submit an assignment?",
  "Explain what a quiz attempt limit means.",
  "How do I earn a certificate?",
  "When is my next live class?",
];

export default function Chatbot({ onClose, userRole }) {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: `Hello! I'm **DUNIS Assistant** 🎓\n\nI'm here to help you with your courses, assignments, and academic journey at DUNIS Africa.\n\n*All courses at DUNIS are taught in English. How can I assist you today?*`
  }]);
  const [input, setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    const next = [...messages, { role: 'user', content: msg }];
    setMessages(next);
    setLoading(true);
    try {
      const history = next.slice(1, -1).map(m => ({ role: m.role, content: m.content }));
      const res = await sendChatMessage({ message: msg, history });
      setMessages(p => [...p, { role: 'assistant', content: res.data.message }]);
    } catch {
      setMessages(p => [...p, { role: 'assistant', content: '❌ Service temporarily unavailable. Please try again.' }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="chatbot">
      <div className="chat-header">
        <div className="chat-identity">
          <div className="chat-avatar-logo">
            <DunisLogo size="xs" variant="white" />
          </div>
          <div>
            <h3>DUNIS Assistant</h3>
            <span className="chat-status"><span className="status-dot" /> Online · English & French</span>
          </div>
        </div>
        <button className="chat-close" onClick={onClose}><FiX size={18} /></button>
      </div>

      <div className="chat-body">
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg ${m.role}`}>
            {m.role === 'assistant' && <div className="msg-bot-icon">🤖</div>}
            <div className="msg-bubble"><ReactMarkdown>{m.content}</ReactMarkdown></div>
          </div>
        ))}
        {loading && (
          <div className="chat-msg assistant">
            <div className="msg-bot-icon">🤖</div>
            <div className="msg-bubble typing"><span/><span/><span/></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && (
        <div className="chat-quick">
          {QUICK.map((q,i) => <button key={i} onClick={() => send(q)} className="quick-chip">{q}</button>)}
        </div>
      )}

      <div className="chat-input-row">
        <textarea
          ref={inputRef}
          className="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask anything..."
          rows={1}
          disabled={loading}
        />
        <button className="send-btn btn btn-gold btn-sm" onClick={() => send()} disabled={!input.trim() || loading}>
          {loading ? <FiLoader size={16} className="spin" /> : <FiSend size={16} />}
        </button>
      </div>
    </div>
  );
}
