import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { api } from '../api'
import { B, INP, Card, Spin, Stars } from '../utils/styles.jsx'
import { track } from '../utils/analytics'
import { validatePhone } from '../utils/validation.jsx'
import { toSlug } from '../utils/slug'
import ReviewCard from '../components/ReviewCard'
import PhoneInput from '../components/PhoneInput'

const FALLBACK = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=700&q=80'

/* ── Social Share Buttons ── */
function ShareButtons({ offer, t }) {
  const [copied, setCopied] = useState(false)
  const url = window.location.origin + '/offre/' + toSlug(offer.title || '', offer.id)
  const text = `${offer.title} — ${(offer.price || 0).toLocaleString()} DZD | Get Lost DZ`

  const share = (platform) => {
    track('share_click', { offer_id: offer.id, platform })
    const urls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    }
    if (platform === 'copy') {
      navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }).catch(() => {})
      return
    }
    // Try native share on mobile
    if (platform === 'native' && navigator.share) {
      navigator.share({ title: offer.title, text, url }).catch(() => {})
      return
    }
    window.open(urls[platform], '_blank', 'noopener,noreferrer,width=600,height=400')
  }

  const btnBase = { border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all .2s' }

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8 }}>
        {t.shareLabel || 'Partager'}
      </span>
      <button onClick={() => share('whatsapp')}
        style={{ ...btnBase, background: '#25D366', color: '#fff' }}
        onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        WhatsApp
      </button>
      <button onClick={() => share('facebook')}
        style={{ ...btnBase, background: '#1877F2', color: '#fff' }}
        onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        Facebook
      </button>
      <button onClick={() => share('copy')}
        style={{ ...btnBase, background: copied ? '#D1FAE5' : '#F0F4F5', color: copied ? '#065F46' : 'var(--navy)' }}
        onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
        {copied ? '✓' : '🔗'} {copied ? (t.copied || 'Copié !') : (t.copyLink || 'Copier le lien')}
      </button>
      {typeof navigator !== 'undefined' && navigator.share && (
        <button onClick={() => share('native')}
          style={{ ...btnBase, background: 'var(--teal3)', color: 'var(--teal2)' }}>
          📤 {t.shareNative || 'Partager'}
        </button>
      )}
    </div>
  )
}

export default function OfferPage({ offerId, t, lang, setPage }) {
  const { user } = useAuth()
  const { show } = useToast()
  const [offer, setOffer] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [phone, setPhone] = useState('+213 ')
  const [travelers, setTravelers] = useState(1)
  const [activeImg, setActiveImg] = useState(0)

  useEffect(() => {
    if (!offerId) return
    setLoading(true)
    Promise.all([
      api(`/offers/${offerId}`),
      api(`/offers/${offerId}/reviews`)
    ]).then(([o, r]) => {
      setOffer(o); setReviews(r); setLoading(false)
      track('offer_view', { offer_id: offerId })
    }).catch(() => setLoading(false))
  }, [offerId])

  if (loading) return <div style={{ minHeight: '100vh', paddingTop: 100, display: 'flex', justifyContent: 'center' }}><Spin /></div>
  if (!offer) return (
    <div style={{ minHeight: '100vh', paddingTop: 100, textAlign: 'center', color: 'var(--muted)' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
      <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 20 }}>Offre introuvable</div>
      <button style={{ ...B.pri, marginTop: 20 }} onClick={() => setPage('trips')}>← Voir les offres</button>
    </div>
  )

  const imgs = (offer.images && offer.images.length > 0) ? offer.images : [offer.image_url || FALLBACK]
  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : (offer.avg_rating || null)

  const handleBook = async () => {
    track('booking_started', { offer_id: offer.id })
    if (!user) { setPage('login'); show('Connectez-vous pour réserver', 'warn'); return }
    if (!validatePhone(phone).valid) { show('Numéro de téléphone invalide', 'err'); return }
    if (travelers < 1 || travelers > 20) { show('Nombre de voyageurs: 1 à 20', 'err'); return }
    setBooking(true)
    try {
      await api('/bookings', { method: 'POST', body: { offerId: offer.id, phone: phone.trim(), travelers } })
      track('booking_done', { offer_id: offer.id })
      show(t.bookMsg)
      setPhone('+213 '); setTravelers(1)
    } catch (e) { show(e.message, 'err') }
    setBooking(false)
  }

  const Arrow = ({ dir, onClick }) => (
    <button onClick={onClick} style={{ position: 'absolute', [dir === 'l' ? 'left' : 'right']: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,.45)', color: '#fff', border: 'none', borderRadius: '50%', width: 40, height: 40, fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      {dir === 'l' ? '‹' : '›'}
    </button>
  )

  return (
    <div className="page-enter" style={{ background: 'var(--offwhite)', minHeight: '100vh', paddingTop: 68 }}>
      {/* Back button */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 24px 0' }}>
        <button onClick={() => window.history.length > 1 ? window.history.back() : setPage('trips')}
          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'var(--teal2)', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
          ← Retour aux offres
        </button>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px 24px 60px' }}>
        {/* Hero image gallery */}
        <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', marginBottom: 24 }}>
          <img src={imgs[activeImg] || FALLBACK} alt={offer.title}
            onError={e => { e.target.src = FALLBACK }}
            style={{ width: '100%', height: 400, objectFit: 'cover', display: 'block' }}
            className="offer-page-hero" />
          <div style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(255,255,255,.95)', borderRadius: 20, padding: '6px 16px', fontSize: 12, fontWeight: 700, color: 'var(--teal2)' }}>
            {t.catIco?.[offer.category]} {t.cats?.[offer.category]}
          </div>
          {imgs.length > 1 && <>
            <Arrow dir="l" onClick={() => setActiveImg(i => (i - 1 + imgs.length) % imgs.length)} />
            <Arrow dir="r" onClick={() => setActiveImg(i => (i + 1) % imgs.length)} />
            <div style={{ position: 'absolute', bottom: 16, right: 16, background: 'rgba(0,0,0,.5)', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: '#fff' }}>{activeImg + 1}/{imgs.length}</div>
          </>}
        </div>

        {/* Thumbnails */}
        {imgs.length > 1 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {imgs.map((url, i) => (
              <img key={i} src={url} alt="" onClick={() => setActiveImg(i)}
                onError={e => { e.target.src = FALLBACK }}
                style={{ width: 80, height: 56, objectFit: 'cover', borderRadius: 10, cursor: 'pointer', border: i === activeImg ? '3px solid var(--teal)' : '3px solid transparent', opacity: i === activeImg ? 1 : .6, transition: 'all .15s', flexShrink: 0 }} />
            ))}
          </div>
        )}

        {/* Content grid: main info + booking sidebar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }} className="offer-page-grid">
          {/* Left — details */}
          <div>
            <h1 style={{ fontFamily: 'Nunito', fontWeight: 900, fontSize: 28, color: 'var(--navy)', marginBottom: 10, margin: 0 }}>{offer.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Stars v={parseFloat(avg) || 0} size={16} />
              {avg && <span style={{ fontWeight: 800, color: '#F59E0B', fontSize: 15 }}>{avg}</span>}
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>({reviews.length} {t.revs})</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {[['📍', offer.region], ['⏱', `${offer.duration} ${t.days}`], ['💰', `${(offer.price || 0).toLocaleString()} DZD${t.per}`]].map(([i, v]) => (
                <span key={v} style={{ padding: '6px 14px', background: '#F7FAFA', borderRadius: 20, fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{i} {v}</span>
              ))}
              {offer.agency_name && (
                <span onClick={() => setPage('agency-profile', { agencyId: offer.agency_id })}
                  style={{ padding: '6px 14px', background: 'var(--teal3)', borderRadius: 20, fontSize: 13, fontWeight: 600, color: 'var(--teal2)', cursor: 'pointer' }}>
                  🏢 {offer.agency_name} →
                </span>
              )}
            </div>

            {offer.description && <p style={{ color: 'var(--muted)', lineHeight: 1.9, marginBottom: 24, fontSize: 14 }}>{offer.description}</p>}

            {/* Social share */}
            <div style={{ marginBottom: 24 }}>
              <ShareButtons offer={offer} t={t} />
            </div>

            {offer.itinerary?.length > 0 && (
              <Card style={{ padding: 20, marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--teal2)', marginBottom: 14 }}>{t.itin}</div>
                {offer.itinerary.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 8, fontSize: 14 }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--teal3)', color: 'var(--teal2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ color: 'var(--text)' }}>{s}</span>
                  </div>
                ))}
              </Card>
            )}

            {offer.includes?.length > 0 && (
              <Card style={{ padding: 20, marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--teal2)', marginBottom: 14 }}>{t.incl}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {offer.includes.map((x, i) => <span key={i} style={{ padding: '6px 14px', background: 'var(--teal3)', borderRadius: 20, fontSize: 12, fontWeight: 600, color: 'var(--teal2)' }}>✓ {x}</span>)}
                </div>
              </Card>
            )}

            {offer.available_dates?.length > 0 && (
              <Card style={{ padding: 20, marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--teal2)', marginBottom: 14 }}>{t.dates}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {offer.available_dates.map((d, i) => <span key={i} style={{ padding: '6px 14px', background: '#F7FAFA', borderRadius: 20, fontSize: 12, border: '1px solid #E2EBF0' }}>📅 {d}</span>)}
                </div>
              </Card>
            )}

            {/* Reviews */}
            <Card style={{ padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--teal2)', marginBottom: 14 }}>💬 {t.revTitle}</div>
              {reviews.length === 0
                ? <p style={{ color: 'var(--muted)', fontSize: 13 }}>{t.noRevs}</p>
                : reviews.map(r => <ReviewCard key={r.id} r={r} isAgency={false} />)}
            </Card>
          </div>

          {/* Right — Booking sidebar (sticky) */}
          <div style={{ position: 'sticky', top: 88 }}>
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(135deg,var(--navy),#1a3a5c)', padding: '24px 20px' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{t.from}</div>
                <div style={{ fontFamily: 'Nunito', fontWeight: 900, fontSize: 30, color: 'var(--teal)', lineHeight: 1 }}>
                  {(offer.price || 0).toLocaleString()} <span style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', fontWeight: 400 }}>DZD{t.per}</span>
                </div>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 4 }}>👤 Voyageurs</label>
                  <input type="number" min="1" max="20" value={travelers} onChange={e => setTravelers(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                    style={{ ...INP, marginBottom: 0, textAlign: 'center', fontSize: 16, fontWeight: 700 }} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 4 }}>📞 Téléphone</label>
                  <PhoneInput value={phone} onChange={setPhone} placeholder="770 123 456" showHint={false} />
                </div>
                <button style={{ ...B.pri, width: '100%', padding: '14px 20px', fontSize: 16, borderRadius: 12, background: 'linear-gradient(135deg,#0DB9A8,#09907F)', boxShadow: '0 4px 20px rgba(13,185,168,.4)' }}
                  onClick={handleBook} disabled={booking}>
                  {booking ? 'Réservation en cours…' : t.book}
                </button>
                {user?.role === 'traveler' && <div style={{ background: 'var(--teal3)', borderRadius: 10, padding: '10px 14px', marginTop: 14, fontSize: 11, color: 'var(--teal2)', textAlign: 'center' }}>
                  💡 Vous pourrez laisser un avis après confirmation.
                </div>}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
