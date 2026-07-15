'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../../store/useAppStore';
import './support.scss';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'support';
  timestamp: Date;
}

export default function SupportPage() {
  const { t, language } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: language === 'fa'
        ? 'سلام! چطور می‌تونم کمکتون کنم؟'
        : 'Hi! How can I help you?',
      sender: 'support',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        text: language === 'fa'
          ? 'پیام شما دریافت شد. تیم پشتیبانی به زودی پاسخ خواهد داد.'
          : 'Your message has been received. Our support team will respond shortly.',
        sender: 'support',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, reply]);
    }, 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="support-page">
      <header className="support-header">
        <h1>{language === 'fa' ? 'پشتیبانی' : 'Support'}</h1>
      </header>

      <div className="support-chat-container">
        <div className="support-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`support-message ${msg.sender}`}>
              <div className="support-message-bubble">
                {msg.text}
              </div>
              <span className="support-message-time">
                {msg.timestamp.toLocaleTimeString(language === 'fa' ? 'fa-IR' : 'en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="support-input-bar">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={language === 'fa' ? 'پیام خود را بنویسید...' : 'Type your message...'}
            className="support-input"
          />
          <button className="support-send-btn" onClick={sendMessage} disabled={!input.trim()}>
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
