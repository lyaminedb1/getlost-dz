import { useState, useEffect } from 'react'
import { api } from '../api'
import { B, Card, Spin, Stars } from '../utils/styles.jsx'
import OfferCard from '../components/OfferCard'
import ReviewCard from '../components/ReviewCard'
import CustomRequestForm from '../components/CustomRequestForm'

export default function AgencyProfilePage({ agencyId, t, onOpen, setPage }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('offers')

  useEffect(() => {
    if (!agencyId) return
    setLoading(true)
    api(`/agencies/${agencyId}/profile`)
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [agencyId])

  if (loading) return (
    <div style={{ minHeight: '100vh', paddingTop: 68, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--offwhite)' }}>
      <Spin />
    </div>
  )

  if (!data || !data.agency) return (
    <div style={{ minHeight: '100vh', paddingTop: 68, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--offwhite)' }}>
      <Card style={{ padding: '48px 40px', textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏢</div>
        <div style={{ fontFamily: 'Nunito', fontWeight: 900, fontSize: 20, color: 'var(--navy)', marginBottom: 8 }}>Agence non trouvée</div>
        <p style={{ color: 'var(--muted)', marginBottom: 24, fontSize: 14 }}>Cette agence n'existe pas ou n'est plus disponible.</p>
        <button style={{ ...B.pri, width: '100%' }} onClick={() => setPage('trips')}>Voir les voyages</button>
      </Card>
    </div>
  )

  const { agency, offers, reviews, stats } = data
  const TB = (a) => ({
    padding: '10px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 700,
    border: 'none', borderBottom: a ? '2px solid var(--teal)' : '2px solid transparent',
    color: a ? 'var(--teal2)' : 'var(--muted)', background: 'none', marginBottom: -1, transition: 'all .18s'
  })

  const fmtDate = (d) => {
    if (!d) return ''
    return new Date(d).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  }

  return (
    <div style={{ background: 'var(--offwhite)', minHeight: '100vh', paddingTop: 68 }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, var(--navy) 0%, #1a3a5c 100%)', padding: '48px 24px 0', position: 'relative', overflow: 'hidden' }}>
        {/* BG decoration */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(13,185,168,.08)' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(13,185,168,.06)' }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative' }}>
          <div className="agency-hero" style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
            {/* Logo */}
            <div style={{
              width: 72, height: 72, borderRadius: 18, background: 'rgba(255,255,255,.12)',
              border: '2px solid rgba(255,255,255,.2)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 36, flexShrink: 0
            }}>
              {agency.logo || '🏢'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Nunito', fontWeight: 900, fontSize: 'clamp(22px, 4vw, 32px)', color: '#fff', lineHeight: 1.2 }}>
                {agency.name}
              </div>
              {agency.description && (
                <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 14, marginTop: 6, lineHeight: 1.6, maxWidth: 500 }}>
                  {agency.description}
                </p>
              )}
              <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
                {agency.plan === 'premium' && (
                  <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(245,158,11,.2)', color: '#FBBF24' }}>
                    ⭐ Premium
                  </span>
                )}
                <span style={{ color: 'rgba(255,255,255,.4)', fontSize: 12 }}>
                  Membre depuis {fmtDate(agency.member_since || agency.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Stats band */}
          <div className="agency-stats" style={{ display: 'flex', gap: 24, marginBottom: 0, flexWrap: 'wrap' }}>
            {[
              ['📦', stats.total_offers, 'Offres'],
              ['⭐', stats.avg_rating || '—', 'Note moyenne'],
              ['💬', stats.total_reviews, 'Avis'],
              ['🎫', stats.total_bookings, 'Réservations'],
            ].map(([ico, val, lbl]) => (
              <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 0' }}>
                <span style={{ fontSize: 20 }}>{ico}</span>
                <div>
                  <div style={{ fontFamily: 'Nunito', fontWeight: 900, fontSize: 20, color: 'var(--teal)', lineHeight: 1 }}>{val}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', fontWeight: 600 }}>{lbl}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="dash-tabs" style={{ display: 'flex', gap: 4, borderBottom: '2px solid rgba(255,255,255,.1)' }}>
            {[['offers', `Offres (${offers.length})`], ['reviews', `Avis (${reviews.length})`], ['custom', 'Voyage sur mesure']].map(([tk, lbl]) => (
              <button key={tk} style={{
                ...TB(tab === tk),
                color: tab === tk ? 'var(--teal)' : 'rgba(255,255,255,.5)',
                borderBottomColor: tab === tk ? 'var(--teal)' : 'transparent'
              }} onClick={() => setTab(tk)}>{lbl}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px 60px' }}>
        {tab === 'offers' && (
          offers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
              <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Aucune offre pour le moment</div>
              <div style={{ fontSize: 14 }}>Cette agence n'a pas encore publié d'offres.</div>
            </div>
          ) : (
            <div className="offer-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {offers.map(o => <OfferCard key={o.id} offer={{ ...o, agency_name: agency.name, agency_logo: agency.logo }} t={t} onOpen={onOpen} />)}
            </div>
          )
        )}

        {tab === 'reviews' && (
          reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⭐</div>
              <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Aucun avis</div>
              <div style={{ fontSize: 14 }}>Soyez le premier à laisser un avis !</div>
            </div>
          ) : (
            <div>
              {/* Rating summary */}
              <Card style={{ padding: '24px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center', minWidth: 100 }}>
                  <div style={{ fontFamily: 'Nunito', fontWeight: 900, fontSize: 42, color: 'var(--teal2)', lineHeight: 1 }}>
                    {stats.avg_rating || '—'}
                  </div>
                  <Stars v={parseFloat(stats.avg_rating) || 0} size={16} />
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{reviews.length} avis</div>
                </div>
                <div style={{ flex: 1 }}>
                  {[5, 4, 3, 2, 1].map(n => {
                    const count = reviews.filter(r => r.rating === n).length
                    const pct = reviews.length ? (count / reviews.length * 100) : 0
                    return (
                      <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', width: 16 }}>{n}</span>
                        <span style={{ color: '#F59E0B', fontSize: 12 }}>★</span>
                        <div style={{ flex: 1, height: 8, background: '#F0F4F5', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--teal), var(--teal2))', borderRadius: 4, transition: 'width .5s' }} />
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--muted)', width: 24, textAlign: 'right' }}>{count}</span>
                      </div>
                    )
                  })}
                </div>
              </Card>
              {/* Review list */}
              {reviews.map(r => (
                <div key={r.id} style={{ marginBottom: 8 }}>
                  {r.offer_title && (
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, fontWeight: 600 }}>📦 {r.offer_title}</div>
                  )}
                  <ReviewCard r={r} isAgency={false} />
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'custom' && (
          <CustomRequestForm agencyId={agencyId} agencyName={agency.name} />
        )}
      </div>
    </div>
  )
}
