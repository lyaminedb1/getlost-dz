import { useState, useEffect } from 'react'
import { api } from '../api'
import { B, INP, Card } from '../utils/styles.jsx'

const STATUSES = {
  flight: [['pending', 'En attente'], ['done', 'Achete']],
  hotel: [['pending', 'En attente'], ['done', 'Reserve']],
  insurance: [['pending', 'En attente'], ['done', 'Reservee']],
  activities: [['pending', 'En attente'], ['done', 'Confirme']],
  guides: [['pending', 'En attente'], ['done', 'Confirme'], ['na', 'Pas necessaire']],
}

const GROUP_TYPES = ['', 'famille', 'amis', 'couple', 'solo', 'groupe']

export default function BookingChecklist({ bookingId, onClose }) {
  const [cl, setCl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api(`/bookings/${bookingId}/checklist`).then(d => { setCl(d); setLoading(false) }).catch(() => setLoading(false))
  }, [bookingId])

  const save = async (field, value) => {
    setSaving(true)
    try {
      const res = await api(`/bookings/${bookingId}/checklist`, { method: 'PUT', body: { [field]: value } })
      setCl(res)
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  const saveMultiple = async (fields) => {
    setSaving(true)
    try {
      const res = await api(`/bookings/${bookingId}/checklist`, { method: 'PUT', body: fields })
      setCl(res)
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  if (loading) return <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)' }}>Chargement...</div>
  if (!cl) return <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)' }}>Erreur de chargement</div>

  const paidPct = cl.amount_total > 0 ? Math.round((cl.amount_paid / cl.amount_total) * 100) : 0
  const allDone = cl.flight === 'done' && cl.hotel === 'done' && cl.insurance === 'done' && cl.activities === 'done' && (cl.guides === 'done' || cl.guides === 'na')

  const CheckRow = ({ label, field, options }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F0F4F5' }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{label}</span>
      <div style={{ display: 'flex', gap: 4 }}>
        {options.map(([v, lbl]) => (
          <button key={v} onClick={() => save(field, v)}
            style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all .15s',
              background: cl[field] === v ? (v === 'done' ? '#D1FAE5' : v === 'na' ? '#F3F4F6' : '#FEF3C7') : '#F7FAFA',
              color: cl[field] === v ? (v === 'done' ? '#065F46' : v === 'na' ? '#6B7280' : '#92400E') : 'var(--muted)',
            }}>{lbl}</button>
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,35,64,.5)', backdropFilter: 'blur(6px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <Card style={{ maxWidth: 520, width: '100%', maxHeight: '85vh', overflow: 'auto', padding: 0 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #EEF3F5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 16, color: 'var(--navy)' }}>Suivi de la reservation</div>
            {allDone && <span style={{ fontSize: 11, fontWeight: 700, color: '#059669' }}>Tout est pret</span>}
          </div>
          <button onClick={onClose} style={{ border: 'none', background: '#F3F4F6', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>X</button>
        </div>

        <div style={{ padding: '16px 24px' }}>
          {/* Progress */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>Progression</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: allDone ? '#059669' : 'var(--teal2)' }}>
                {[cl.flight, cl.hotel, cl.insurance, cl.activities, cl.guides].filter(v => v === 'done' || v === 'na').length}/5
              </span>
            </div>
            <div style={{ height: 6, background: '#E2EBF0', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${[cl.flight, cl.hotel, cl.insurance, cl.activities, cl.guides].filter(v => v === 'done' || v === 'na').length / 5 * 100}%`, height: '100%', background: allDone ? '#059669' : 'var(--teal)', borderRadius: 3, transition: 'width .3s' }} />
            </div>
          </div>

          {/* Checklist items */}
          <CheckRow label="Vol" field="flight" options={STATUSES.flight} />
          <CheckRow label="Hotel" field="hotel" options={STATUSES.hotel} />
          <CheckRow label="Assurance" field="insurance" options={STATUSES.insurance} />
          <CheckRow label="Activites / Programme" field="activities" options={STATUSES.activities} />
          <CheckRow label="Guides" field="guides" options={STATUSES.guides} />

          {/* Group type */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F0F4F5' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>Type de groupe</span>
            <select value={cl.group_type || ''} onChange={e => save('group_type', e.target.value)}
              style={{ padding: '4px 12px', borderRadius: 8, border: '1px solid #E2EBF0', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: '#fff' }}>
              <option value="">Non defini</option>
              {GROUP_TYPES.filter(Boolean).map(g => <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>)}
            </select>
          </div>

          {/* Payment */}
          <div style={{ marginTop: 16, padding: 16, background: '#F7FAFA', borderRadius: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: .5 }}>Paiement</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 3 }}>Montant verse (DZD)</label>
                <input style={{ ...INP, marginBottom: 0, textAlign: 'center', fontWeight: 700 }} type="number" value={cl.amount_paid || 0}
                  onChange={e => setCl(p => ({ ...p, amount_paid: parseInt(e.target.value) || 0 }))}
                  onBlur={() => save('amount_paid', cl.amount_paid || 0)} />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 3 }}>Montant total (DZD)</label>
                <input style={{ ...INP, marginBottom: 0, textAlign: 'center', fontWeight: 700 }} type="number" value={cl.amount_total || 0}
                  onChange={e => setCl(p => ({ ...p, amount_total: parseInt(e.target.value) || 0 }))}
                  onBlur={() => save('amount_total', cl.amount_total || 0)} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1, height: 6, background: '#E2EBF0', borderRadius: 3, overflow: 'hidden', marginRight: 10 }}>
                <div style={{ width: `${Math.min(paidPct, 100)}%`, height: '100%', background: paidPct >= 100 ? '#059669' : paidPct > 50 ? 'var(--teal)' : '#F59E0B', borderRadius: 3, transition: 'width .3s' }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, color: paidPct >= 100 ? '#059669' : 'var(--teal2)', minWidth: 40, textAlign: 'right' }}>{paidPct}%</span>
            </div>
            {cl.amount_total > 0 && cl.amount_paid < cl.amount_total && (
              <div style={{ fontSize: 11, color: '#D97706', fontWeight: 600, marginTop: 6 }}>
                Reste : {(cl.amount_total - cl.amount_paid).toLocaleString()} DZD
              </div>
            )}
          </div>

          {/* Notes */}
          <div style={{ marginTop: 14 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 3, textTransform: 'uppercase' }}>Notes internes</label>
            <textarea style={{ width: '100%', border: '1.5px solid #E2EBF0', borderRadius: 10, padding: '10px 14px', fontSize: 13, resize: 'vertical', minHeight: 60, fontFamily: 'inherit' }}
              value={cl.notes || ''} onChange={e => setCl(p => ({ ...p, notes: e.target.value }))}
              onBlur={() => save('notes', cl.notes || '')}
              placeholder="Notes sur la reservation..." />
          </div>
        </div>
      </Card>
    </div>
  )
}
