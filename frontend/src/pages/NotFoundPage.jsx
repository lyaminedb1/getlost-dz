import { B } from '../utils/styles.jsx'

export default function NotFoundPage({ setPage }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--offwhite)', paddingTop: 68, padding: '88px 24px 60px' }}>
      <div style={{ textAlign: 'center', maxWidth: 440 }}>
        <div style={{ fontSize: 80, marginBottom: 8 }}>🏝️</div>
        <div style={{ fontFamily: 'Nunito', fontWeight: 900, fontSize: 72, color: 'var(--teal)', lineHeight: 1, marginBottom: 8 }}>404</div>
        <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 22, color: 'var(--navy)', marginBottom: 12 }}>Page introuvable</div>
        <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
          On dirait que vous vous êtes perdu… mais c'est le concept ! 😄<br />
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button style={{ ...B.pri, padding: '12px 28px', fontSize: 14 }} onClick={() => setPage('home')}>🏠 Retour à l'accueil</button>
          <button style={{ ...B.ghost, padding: '12px 28px', fontSize: 14 }} onClick={() => setPage('trips')}>🧭 Voir les voyages</button>
        </div>
      </div>
    </div>
  )
}
