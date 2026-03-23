import { useState } from 'react'
import { api } from '../api'
import { B, INP, TA, Card } from '../utils/styles.jsx'
import PhoneInput from './PhoneInput'
import { validateEmail, validatePhone } from '../utils/validation.jsx'

const MONTHS = ['Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','Octobre','Novembre','Decembre']

export default function CustomRequestForm({ agencyId, agencyName, onClose, onSuccess }) {
  const [f, setF] = useState({
    name: '', email: '', phone: '+213 ', month: '',
    travelers: [{ age: '' }],
    budget: '', duration: '7', style: '', safari: '',
    message: ''
  })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const addTraveler = () => setF(p => ({ ...p, travelers: [...p.travelers, { age: '' }] }))
  const removeTraveler = (i) => setF(p => ({ ...p, travelers: p.travelers.filter((_, idx) => idx !== i) }))
  const setTravelerAge = (i, v) => setF(p => ({ ...p, travelers: p.travelers.map((t, idx) => idx === i ? { age: v } : t) }))

  const submit = async () => {
    setError('')
    if (!f.name.trim()) { setError('Nom requis'); return }
    if (!f.email.trim() || !validateEmail(f.email)) { setError('Email valide requis'); return }
    if (!f.month) { setError('Mois souhaite requis'); return }
    if (f.travelers.length === 0) { setError('Ajoutez au moins un voyageur'); return }

    setSending(true)
    try {
      await api(`/agencies/${agencyId}/custom-requests`, {
        method: 'POST',
        body: {
          name: f.name.trim(),
          email: f.email.trim(),
          phone: f.phone.trim(),
          month: f.month,
          travelers: f.travelers,
          budget: f.budget,
          duration: f.duration,
          style: f.style,
          safari: f.safari,
          message: f.message.trim()
        }
      })
      setSent(true)
      if (onSuccess) onSuccess()
    } catch (e) {
      setError(e.message || 'Erreur lors de l\'envoi')
    }
    setSending(false)
  }

  if (sent) return (
    <Card style={{ padding: 32, textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✈️</div>
      <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 20, color: 'var(--navy)', marginBottom: 8 }}>
        Demande envoyee !
      </div>
      <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
        {agencyName || 'L\'agence'} recevra votre demande et vous contactera par email ou telephone.
      </p>
      {onClose && <button style={B.pri} onClick={onClose}>Fermer</button>}
    </Card>
  )

  const LBL = ({ children, required }) => (
    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 4 }}>
      {children}{required && <span style={{ color: 'var(--teal2)' }}>*</span>}
    </label>
  )

  return (
    <Card style={{ padding: 28, maxWidth: 600, margin: '0 auto' }}>
      <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 18, color: 'var(--navy)', marginBottom: 4 }}>
        Voyage sur mesure
      </div>
      <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>
        Decrivez votre voyage ideal et {agencyName || 'l\'agence'} vous proposera une offre personnalisee.
      </p>

      {error && <div style={{ padding: '10px 14px', background: '#FEE2E2', borderRadius: 10, color: '#991B1B', fontSize: 13, fontWeight: 600, marginBottom: 14 }}>{error}</div>}

      {/* Identite */}
      <div style={{ background: 'var(--teal3)', borderRadius: 10, padding: '8px 14px', marginBottom: 14, fontSize: 12, fontWeight: 700, color: 'var(--teal2)' }}>Vos coordonnees</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 4 }}>
        <div><LBL required>Nom complet</LBL><input style={INP} value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} placeholder="Ahmed Benali" /></div>
        <div><LBL required>Email</LBL><input style={INP} type="email" value={f.email} onChange={e => setF(p => ({ ...p, email: e.target.value }))} placeholder="votre@email.com" /></div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <LBL>Telephone</LBL>
        <PhoneInput value={f.phone} onChange={v => setF(p => ({ ...p, phone: v }))} placeholder="770 123 456" showHint={false} />
      </div>

      {/* Voyage */}
      <div style={{ background: 'var(--teal3)', borderRadius: 10, padding: '8px 14px', marginBottom: 14, fontSize: 12, fontWeight: 700, color: 'var(--teal2)' }}>Votre voyage</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <LBL required>Mois souhaite</LBL>
          <select style={{ ...INP, cursor: 'pointer' }} value={f.month} onChange={e => setF(p => ({ ...p, month: e.target.value }))}>
            <option value="">Choisir un mois</option>
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <LBL>Duree du sejour</LBL>
          <select style={{ ...INP, cursor: 'pointer' }} value={f.duration} onChange={e => setF(p => ({ ...p, duration: e.target.value }))}>
            <option value="7">7 jours</option>
            <option value="9">9 jours</option>
            <option value="14">14 jours ou plus</option>
          </select>
        </div>
      </div>

      {/* Voyageurs */}
      <div style={{ marginBottom: 12 }}>
        <LBL required>Voyageurs ({f.travelers.length})</LBL>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {f.travelers.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', minWidth: 70 }}>Personne {i + 1}</span>
              <input style={{ ...INP, marginBottom: 0, flex: 1 }} type="number" min="1" max="99" placeholder="Age"
                value={t.age} onChange={e => setTravelerAge(i, e.target.value)} />
              {f.travelers.length > 1 && (
                <button onClick={() => removeTraveler(i)} style={{ border: 'none', background: '#FEE2E2', color: '#991B1B', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>X</button>
              )}
            </div>
          ))}
        </div>
        <button onClick={addTraveler} style={{ ...B.ghost, fontSize: 12, padding: '6px 14px', marginTop: 8 }}>+ Ajouter un voyageur</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <LBL>Budget approximatif</LBL>
          <select style={{ ...INP, cursor: 'pointer' }} value={f.budget} onChange={e => setF(p => ({ ...p, budget: e.target.value }))}>
            <option value="">Non defini</option>
            <option value="100000-200000">100,000 - 200,000 DZD/pers</option>
            <option value="200000-350000">200,000 - 350,000 DZD/pers</option>
            <option value="350000-500000">350,000 - 500,000 DZD/pers</option>
            <option value="500000+">500,000+ DZD/pers</option>
          </select>
        </div>
        <div>
          <LBL>Style de voyage</LBL>
          <select style={{ ...INP, cursor: 'pointer' }} value={f.style} onChange={e => setF(p => ({ ...p, style: e.target.value }))}>
            <option value="">Pas de preference</option>
            <option value="relax">Chill / Relax</option>
            <option value="active">Actif / Aventure</option>
            <option value="mix">Un peu des deux</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <LBL>Safari</LBL>
        <select style={{ ...INP, cursor: 'pointer' }} value={f.safari} onChange={e => setF(p => ({ ...p, safari: e.target.value }))}>
          <option value="">Pas de preference</option>
          <option value="yes">Oui, ca m'interesse</option>
          <option value="maybe">Pourquoi pas, a voir</option>
          <option value="no">Non merci</option>
        </select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <LBL>Message / precisions</LBL>
        <textarea style={TA(80)} value={f.message} onChange={e => setF(p => ({ ...p, message: e.target.value }))}
          placeholder="Destinations preferees, allergies, besoins speciaux..." />
      </div>

      <button style={{ ...B.pri, width: '100%', padding: 14, fontSize: 15 }} onClick={submit} disabled={sending}>
        {sending ? 'Envoi en cours...' : 'Envoyer ma demande'}
      </button>
    </Card>
  )
}
