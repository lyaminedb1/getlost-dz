import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'

const POLL_MS = 12_000

export default function useNotifications() {
  const { user } = useAuth()
  const [unread, setUnread] = useState(0)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const timer = useRef(null)

  // Poll unread count
  const fetchCount = useCallback(async () => {
    if (!user) return
    try {
      const data = await api('/notifications/count')
      setUnread(data.unread)
    } catch {}
  }, [user])

  useEffect(() => {
    if (!user) { setUnread(0); setItems([]); return }
    fetchCount()
    timer.current = setInterval(fetchCount, POLL_MS)
    return () => clearInterval(timer.current)
  }, [user, fetchCount])

  // Fetch list (on dropdown open)
  const fetchList = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await api('/notifications?per_page=30')
      setItems(data.notifications)
    } catch {}
    setLoading(false)
  }, [user])

  // Mark one as read
  const markRead = useCallback(async (id) => {
    try {
      await api(`/notifications/${id}/read`, { method: 'PATCH' })
      setItems(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      setUnread(c => Math.max(0, c - 1))
    } catch {}
  }, [])

  // Mark all as read
  const markAllRead = useCallback(async () => {
    try {
      await api('/notifications/read-all', { method: 'PATCH' })
      setItems(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })))
      setUnread(0)
    } catch {}
  }, [])

  return { unread, items, loading, fetchList, markRead, markAllRead, refetch: fetchCount }
}
