import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [conversations, setConversations] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    api.get('/chat/conversations').then(d => {
      setConversations(d.conversations || []);
      // If oracle_card_admin, show conversations list; if user, auto-select admin
      if (user?.role === 'user' && d.conversations?.length > 0) {
        setSelectedPartner(d.conversations[0].partner);
      }
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (selectedPartner) {
      loadMessages(selectedPartner.id);
    }
  }, [selectedPartner]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async (partnerId) => {
    try {
      const data = await api.get(`/chat/messages/${partnerId}`);
      setMessages(data.messages || []);
    } catch {
      setMessages([]);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    try {
      const data = await api.post('/chat/messages', {
        recipient_id: selectedPartner?.id,
        content: content.trim(),
      });
      setMessages(prev => [...prev, data.message]);
      setContent('');
    } catch (err) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  const isAdmin = ['oracle_card_admin', 'app_admin', 'app_owner_admin'].includes(user?.role);

  return (
    <div style={{ display: 'flex', gap: '1rem', height: 'calc(100vh - 200px)', minHeight: 400 }}>
      {/* Conversation list (shown for admins or when there are conversations) */}
      {(isAdmin || conversations.length > 1) && (
        <div style={{
          width: 240,
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius)',
          overflowY: 'auto',
          padding: '0.5rem',
        }}>
          <h3 style={{ fontSize: '0.9rem', padding: '0.5rem', opacity: 0.7 }}>Conversations</h3>
          {conversations.map(c => (
            <button key={c.partner?.id} onClick={() => setSelectedPartner(c.partner)}
              style={{
                width: '100%',
                background: selectedPartner?.id === c.partner?.id ? 'rgba(107, 70, 193, 0.15)' : 'transparent',
                border: 'none',
                color: 'var(--color-text)',
                padding: '0.75rem',
                borderRadius: 'var(--radius)',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', background: 'var(--color-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: 'white', flexShrink: 0,
              }}>
                {c.partner?.display_name?.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{c.partner?.display_name}</div>
                {c.unread_count > 0 && (
                  <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>{c.unread_count} new</span>
                )}
              </div>
            </button>
          ))}
          {conversations.length === 0 && (
            <p className="text-sm text-muted" style={{ padding: '0.5rem' }}>No conversations yet</p>
          )}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--color-surface)', borderRadius: 'var(--radius)' }}>
        {/* Header */}
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ fontSize: '1rem' }}>
            {selectedPartner ? selectedPartner.display_name : 'Chat'}
          </h3>
        </div>

        {/* Messages area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          {messages.length === 0 && (
            <div className="empty-state">
              <p className="text-muted">
                {selectedPartner ? 'No messages yet. Send a message to start the conversation.' : 'Select a conversation or send a new message.'}
              </p>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} style={{
              display: 'flex',
              justifyContent: msg.sender_id === user?.id ? 'flex-end' : 'flex-start',
              marginBottom: '0.75rem',
            }}>
              <div style={{
                maxWidth: '70%',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius)',
                background: msg.sender_id === user?.id ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                color: msg.sender_id === user?.id ? 'white' : 'var(--color-text)',
              }}>
                <p style={{ fontSize: '0.9rem' }}>{msg.content}</p>
                <p style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '0.25rem' }}>
                  {new Date(msg.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} style={{
          padding: '0.75rem 1rem',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          gap: '0.5rem',
        }}>
          <input type="text" value={content} onChange={e => setContent(e.target.value)}
            placeholder="Type a message..." style={{ flex: 1 }} />
          <button type="submit" className="btn btn-primary" disabled={sending || !content.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
