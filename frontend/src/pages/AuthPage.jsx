import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { B, INP, Card } from '../utils/styles.jsx'
import { validateEmail, validatePassword, validatePhone, PasswordStrengthBar } from '../utils/validation.jsx'
import WILAYAS from '../utils/wilayas.js'
import PhoneInput from '../components/PhoneInput'

export default function AuthPage({ mode, t, setPage }) {
  const { login, register } = useAuth()
  const { show } = useToast()
  const [isLogin, setIsLogin] = useState(mode === 'login')
  const EF = () => ({ email: '', password: '', confirmPassword: '', name: '', familyName: '', phone: '', birthDate: '', gender: '', city: '' })
  const [f, setF] = useState(EF)
  const [loading, setLoading] = useState(false)
  useEffect(() => { setIsLogin(mode === 'login'); setF(EF()) }, [mode])

  const LBL = ({ children }) => <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .7, display: 'block', marginBottom: 4 }}>{children}</label>

  const submit = async () => {
    if (!f.email || !f.password) { show('Email et mot de passe requis', 'err'); return }
    if (!validateEmail(f.email)) { show('Format email invalide', 'err'); return }
    if (!isLogin) {
      if (!f.name || !f.familyName) { show('Prénom et nom de famille requis', 'err'); return }
      if (!f.phone) { show('Numéro de téléphone requis', 'err'); return }
      if (!validatePhone(f.phone).valid) { show('Numéro de téléphone invalide', 'err'); return }
      if (f.password !== f.confirmPassword) { show('Les mots de passe ne correspondent pas', 'err'); return }
      if (!validatePassword(f.password).valid) { show('Mot de passe trop faible (8+ caractères, 1 majuscule, 1 chiffre)', 'err'); return }
    }
    setLoading(true)
    try {
      if (isLogin) { const u = await login(f.email, f.password); show(`Bienvenue, ${u.name}!`); }
      else { await register({ ...f, role: 'traveler' }); show('Compte créé ! Bienvenue 🎉'); }
      setPage('home')
    } catch (e) { show(e.message, 'err') }
    setLoading(false)
  }

  return (
    <div style={{ background: 'var(--offwhite)', minHeight: '100vh', paddingTop: 68, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '88px 12px 60px' }}>
      <Card style={{ padding: 'clamp(16px, 4vw, 32px)', maxWidth: isLogin ? 420 : 540, width: '100%', overflow: 'hidden' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/logo-1.png" alt="Get Lost DZ" style={{ height: 52, marginBottom: 14 }} onError={e => e.target.style.display = 'none'} />
          <div style={{ fontFamily: 'Nunito', fontWeight: 900, fontSize: 22, color: 'var(--navy)' }}>{isLogin ? t.loginTitle : t.regTitle}</div>
          {!isLogin && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Créez votre compte voyageur</div>}
        </div>

        {isLogin ? (
          <>
            <div><LBL>Email<span style={{ color: "var(--teal2)" }}>*</span></LBL><input style={INP} type="email" placeholder="votre@email.com" value={f.email} onChange={e => setF(p => ({ ...p, email: e.target.value }))} /></div>
            <div><LBL>Mot de passe<span style={{ color: "var(--teal2)" }}>*</span></LBL><input style={INP} type="password" placeholder="••••••••" value={f.password} onChange={e => setF(p => ({ ...p, password: e.target.value }))} onKeyDown={e => e.key === 'Enter' && submit()} /></div>
            <button style={{ ...B.pri, width: '100%', padding: 14, fontSize: 15, marginTop: 4 }} onClick={submit} disabled={loading}>{loading ? '…' : t.loginTitle}</button>
            <div style={{ textAlign: 'right', marginTop: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--teal2)', cursor: 'pointer', fontWeight: 600 }} onClick={() => document.dispatchEvent(new CustomEvent('openForgot'))}>{t.forgotPass}</span>
            </div>
          </>
        ) : (
          <>
            <div style={{ background: 'var(--teal3)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 12, fontWeight: 700, color: 'var(--teal2)' }}>👤 Identité</div>
            <div className="auth-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 4 }}>
              <div><LBL>Prénom<span style={{ color: "var(--teal2)" }}>*</span></LBL><input style={INP} placeholder="Ahmed" value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} /></div>
              <div><LBL>Nom de famille<span style={{ color: "var(--teal2)" }}>*</span></LBL><input style={INP} placeholder="Benali" value={f.familyName} onChange={e => setF(p => ({ ...p, familyName: e.target.value }))} /></div>
            </div>
            <div className="auth-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 4 }}>
              <div><LBL>Date de naissance</LBL><input style={INP} type="date" value={f.birthDate} onChange={e => setF(p => ({ ...p, birthDate: e.target.value }))} max={new Date().toISOString().split('T')[0]} /></div>
              <div><LBL>Genre</LBL>
                <select style={{ ...INP, marginBottom: 0 }} value={f.gender} onChange={e => setF(p => ({ ...p, gender: e.target.value }))}>
                  <option value="">— Sélectionner —</option>
                  <option value="homme">Homme</option>
                  <option value="femme">Femme</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 4 }}>
              <LBL>Wilaya</LBL>
              <select style={{ ...INP, marginBottom: 0 }} value={f.city} onChange={e => setF(p => ({ ...p, city: e.target.value }))}>
                <option value="">— Sélectionner une wilaya —</option>
                {WILAYAS.map(w => <option key={w.code} value={w.name}>{w.code} — {w.name}</option>)}
              </select>
            </div>
            <div style={{ background: 'var(--teal3)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, marginTop: 8, fontSize: 12, fontWeight: 700, color: 'var(--teal2)' }}>📬 Contact & Accès</div>
            <div><LBL>Email<span style={{ color: "var(--teal2)" }}>*</span></LBL><input style={INP} type="email" placeholder="votre@email.com" value={f.email} onChange={e => setF(p => ({ ...p, email: e.target.value }))} /></div>
            <div>
              <LBL>Téléphone (WhatsApp)<span style={{ color: 'var(--teal2)' }}>*</span></LBL>
              <PhoneInput value={f.phone || '+213 '} onChange={v => setF(p => ({ ...p, phone: v }))} placeholder="770 123 456" />
            </div>
            <div className="auth-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <LBL>Mot de passe<span style={{ color: 'var(--teal2)' }}>*</span></LBL>
                <input style={INP} type="password" placeholder="Min. 8 caractères" value={f.password} onChange={e => setF(p => ({ ...p, password: e.target.value }))} />
                <PasswordStrengthBar password={f.password} />
              </div>
              <div>
                <LBL>Confirmer<span style={{ color: 'var(--teal2)' }}>*</span></LBL>
                <input style={{ ...INP, borderColor: f.confirmPassword && f.password !== f.confirmPassword ? '#EF4444' : '' }}
                  type="password" placeholder="Répéter" value={f.confirmPassword} onChange={e => setF(p => ({ ...p, confirmPassword: e.target.value }))} onKeyDown={e => e.key === 'Enter' && submit()} />
                {f.confirmPassword && f.password !== f.confirmPassword && <div style={{ fontSize: 11, color: '#EF4444', marginTop: -8, marginBottom: 8, fontWeight: 600 }}>⚠ Mots de passe différents</div>}
              </div>
            </div>
            <button style={{ ...B.pri, width: '100%', padding: 14, fontSize: 15, marginTop: 8 }} onClick={submit} disabled={loading}>{loading ? '…' : '✅ Créer mon compte'}</button>
          </>
        )}
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--muted)' }}>
          {isLogin
            ? <>{t.noAcc} <span style={{ color: 'var(--teal2)', cursor: 'pointer', fontWeight: 700 }} onClick={() => setPage('register')}>{t.regTitle}</span></>
            : <>{t.hasAcc} <span style={{ color: 'var(--teal2)', cursor: 'pointer', fontWeight: 700 }} onClick={() => setPage('login')}>{t.loginTitle}</span></>}
        </div>
      </Card>
    </div>
  )
}
