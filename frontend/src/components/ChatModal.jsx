import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import { B, Spin } from '../utils/styles.jsx'

export default function ChatModal({ booking, onClose }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)
  const pollRef = useRef(null)

  const load = async () => {
    try {
      const data = await api(`/bookings/${booking.id}/messages`)
      setMessages(data.messages || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => {
    load()
    pollRef.current = setInterval(load, 10000)
    return () => clearInterval(pollRef.current)
  }, [booking.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      await api(`/bookings/${booking.id}/messages`, { method: 'POST', body: { content: text.trim() } })
      setText('')
      await load()
    } catch (e) { console.error(e) }
    setSending(false)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const fmt = (ts) => {
    if (!ts) return ''
    const d = new Date(ts)
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) + ' ' +
           d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,35,64,.6)', backdropFilter: 'blur(8px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div className="chat-modal-inner" style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 520, height: '80vh', maxHeight: 600, display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(11,35,64,.2)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#0B2340,#0DB9A8)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: '#fff', fontFamily: 'Nunito', fontWeight: 900, fontSize: 16 }}>💬 Conversation</div>
            <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 12, marginTop: 2 }}>{booking.offer_title || booking.title}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.2)', border: 'none', borderRadius: 50, width: 32, height: 32, color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, background: '#F7FAFA' }}>
          {loading ? (
            <div style={{ textAlign: 'center', paddingTop: 40 }}><Spin /></div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--muted)', marginTop: 60 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
              <div style={{ fontWeight: 700 }}>Aucun message pour l'instant</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Commencez la conversation !</div>
            </div>
          ) : messages.map(m => {
            const mine = m.sender_id === user.id
            return (
              <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3, fontWeight: 600 }}>
                  {mine ? 'Vous' : m.sender_name} · {fmt(m.created_at)}
                </div>
                <div style={{
                  maxWidth: '75%', padding: '10px 14px', borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: mine ? 'linear-gradient(135deg,#0B2340,#0DB9A8)' : '#fff',
                  color: mine ? '#fff' : '#0B2340',
                  boxShadow: '0 2px 8px rgba(11,35,64,.1)',
                  fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word'
                }}>
                  {m.content}
                </div>
                {!mine && !m.read_at && (
                  <div style={{ fontSize: 10, color: '#0DB9A8', marginTop: 2, fontWeight: 700 }}>● Non lu</div>
                )}
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '12px 16px', background: '#fff', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            style={{ flex: 1, border: '2px solid #E2E8F0', borderRadius: 16, padding: '10px 14px', fontSize: 14, resize: 'none', outline: 'none', fontFamily: 'Poppins', lineHeight: 1.5, maxHeight: 100, minHeight: 44 }}
            placeholder="Écrivez votre message... (Entrée pour envoyer)"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
          />
          <button
            onClick={send}
            disabled={sending || !text.trim()}
            style={{ ...B.pri, padding: '10px 18px', borderRadius: 16, fontSize: 18, minWidth: 48, opacity: (!text.trim() || sending) ? 0.5 : 1 }}
          >
            {sending ? '...' : '➤'}
          </button>
        </div>
      </div>
    </div>
  )
}
