import { useState, useRef, useEffect } from 'react'
import useNotifications from '../hooks/useNotifications'

const ICONS = { new_booking: '📋', booking_status: '✅', new_message: '💬', new_offer: '📦', new_user: '👤', new_review: '⭐' }
const COLORS = { new_booking: '#0DB9A8', booking_status: '#F59E0B', new_message: '#3B82F6', new_offer: '#8B5CF6', new_user: '#059669', new_review: '#F59E0B' }

function timeAgo(d) {
  const s = (Date.now() - new Date(d).getTime()) / 1000
  if (s < 60) return "à l'instant"
  if (s < 3600) return `il y a ${Math.floor(s / 60)}min`
  if (s < 86400) return `il y a ${Math.floor(s / 3600)}h`
  if (s < 604800) return `il y a ${Math.floor(s / 86400)}j`
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function NotificationBell({ onNavigate }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const { unread, items, loading, fetchList, markRead, markAllRead } = useNotifications()

  useEffect(() => { if (open) fetchList() }, [open, fetchList])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const handleClick = (n) => {
    if (!n.read_at) markRead(n.id)
    if (n.link && onNavigate) onNavigate(n.link)
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Notifications"
        style={{
          position: 'relative', background: 'none', border: 'none', color: 'var(--navy)',
          cursor: 'pointer', padding: 8, borderRadius: 8, display: 'flex',
          alignItems: 'center', justifyContent: 'center', transition: 'background .2s'
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(13,185,168,.08)'}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
      >
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2, background: '#EF4444', color: '#fff',
            fontSize: 10, fontWeight: 700, fontFamily: 'Poppins,sans-serif', lineHeight: 1,
            minWidth: 17, height: 17, borderRadius: 9, display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: '0 4px', boxShadow: '0 0 0 2px #fff'
          }}>
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="notif-dropdown" style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: 360,
          maxHeight: 440, background: '#fff', borderRadius: 14,
          boxShadow: '0 12px 40px rgba(11,35,64,.18), 0 0 0 1px rgba(11,35,64,.06)',
          zIndex: 9999, overflow: 'hidden', display: 'flex', flexDirection: 'column',
          fontFamily: 'Nunito,sans-serif'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '13px 16px', borderBottom: '1px solid #f0f0f0'
          }}>
            <span style={{ fontFamily: 'Poppins,sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--navy)' }}>
              Notifications
            </span>
            {unread > 0 && (
              <button onClick={markAllRead} style={{
                background: 'none', border: 'none', color: 'var(--teal)', fontSize: 12,
                fontWeight: 600, cursor: 'pointer', padding: '4px 8px', borderRadius: 6
              }}>
                Tout marquer lu
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading && items.length === 0 && (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                Chargement…
              </div>
            )}
            {!loading && items.length === 0 && (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                Aucune notification
              </div>
            )}
            {items.map(n => (
              <button key={n.id} onClick={() => handleClick(n)} style={{
                display: 'flex', alignItems: 'flex-start', gap: 11, width: '100%',
                padding: '11px 16px', border: 'none', borderBottom: '1px solid #f7f7f7',
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                background: n.read_at ? 'transparent' : 'rgba(13,185,168,.05)',
                transition: 'background .15s'
              }}
                onMouseEnter={e => { if (n.read_at) e.currentTarget.style.background = '#fafafa' }}
                onMouseLeave={e => { e.currentTarget.style.background = n.read_at ? 'transparent' : 'rgba(13,185,168,.05)' }}
              >
                {/* Icon */}
                <span style={{
                  flexShrink: 0, width: 34, height: 34, borderRadius: 9, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 15,
                  background: (COLORS[n.type] || '#0DB9A8') + '18',
                  opacity: n.read_at ? 0.5 : 1
                }}>
                  {ICONS[n.type] || '🔔'}
                </span>
                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {!n.read_at && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--teal)', flexShrink: 0 }} />}
                    {n.title}
                  </div>
                  {n.body && (
                    <div style={{
                      fontSize: 12, color: '#64748b', marginTop: 2,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                      {n.body}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
                    {timeAgo(n.created_at)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
