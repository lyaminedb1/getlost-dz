import { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import { B, Spin, SectionTitle } from '../utils/styles.jsx'
import OfferCard from '../components/OfferCard'

/* ── Intersection Observer hook for scroll-triggered animations ── */
function useInView(options = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } }, { threshold: 0.15, ...options })
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return [ref, inView]
}

/* ── Animated counter ── */
function AnimNum({ target, suffix = '', inView }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!inView) return
    const num = parseInt(target.replace(/[^0-9]/g, '')) || 0
    let start = 0
    const step = Math.max(1, Math.floor(num / 120))
    const t = setInterval(() => {
      start += step
      if (start >= num) { setVal(num); clearInterval(t) }
      else setVal(start)
    }, 16)
    return () => clearInterval(t)
  }, [inView, target])
  const display = target.includes('K') ? (val >= 1000 ? Math.floor(val / 1000) + 'K' : val) : val.toLocaleString()
  return <span>{display}{suffix}</span>
}

/* ── Hero background images (real Algeria/travel) ── */
const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1920&q=80', // Zanzibar beach
  'https://images.unsplash.com/photo-1583266994082-c21f77a67330?w=1920&q=80', // Sahara Algeria
  'https://images.unsplash.com/photo-1528127269322-539801943592?w=1920&q=80', // Vietnam Ha Long Bay
  'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7c?w=1920&q=80', // Zanzibar turquoise
  'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1920&q=80', // Algeria Hoggar
]

/* ── Testimonials ── */
const TESTIMONIALS = [
  { name: 'Amira B.', city: 'Alger', text: "Un voyage inoubliable au Sahara ! L'agence a géré chaque détail à la perfection. Les dunes de Timimoun resteront gravées dans ma mémoire.", rating: 5, avatar: '👩🏽' },
  { name: 'Karim M.', city: 'Oran', text: "Zanzibar avec Get Lost DZ, c'était magique. Tout était organisé, du visa aux excursions. Je recommande à 100% !", rating: 5, avatar: '👨🏽' },
  { name: 'Lina S.', city: 'Constantine', text: "La randonnée en Kabylie était extraordinaire. Guides professionnels, paysages à couper le souffle. Hâte de repartir !", rating: 5, avatar: '👩🏻' },
  { name: 'Yacine D.', city: 'Tizi Ouzou', text: "Service impeccable pour notre voyage en Turquie. Rapport qualité-prix imbattable et suivi personnalisé.", rating: 5, avatar: '👨🏻' },
]

export default function HomePage({ t, setPage, setFilterCat, onOpen, onViewAgency, favIds, toggleFav }) {

  const [feat, setFeat] = useState([])
  const [heroIdx, setHeroIdx] = useState(0)
  const [testiIdx, setTestiIdx] = useState(0)
  const [statsRef, statsInView] = useInView()
  const [howRef, howInView] = useInView()
  const [testiRef, testiInView] = useInView()

  useEffect(() => { api('/offers?sort=rating').then(d => setFeat(d.slice(0, 6))).catch(() => {}) }, [])

  // Auto-rotate hero
  useEffect(() => {
    const iv = setInterval(() => setHeroIdx(i => (i + 1) % HERO_IMAGES.length), 5000)
    return () => clearInterval(iv)
  }, [])

  // Auto-rotate testimonials
  useEffect(() => {
    const iv = setInterval(() => setTestiIdx(i => (i + 1) % TESTIMONIALS.length), 6000)
    return () => clearInterval(iv)
  }, [])

  const categories = [
    { k: 'intl', bg: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=400&q=80' },
    { k: 'national', bg: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400&q=80' },
    { k: 'hike', bg: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&q=80' },
    { k: 'visa', bg: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&q=80' },
  ]

  const steps = [
    { ico: '🔍', title: t.howStep1 || 'Explorez', desc: t.howStep1d || 'Parcourez nos offres sélectionnées auprès des meilleures agences algériennes.' },
    { ico: '📞', title: t.howStep2 || 'Réservez', desc: t.howStep2d || "Choisissez votre voyage et réservez en un clic. L'agence vous contacte sous 24h." },
    { ico: '✈️', title: t.howStep3 || 'Voyagez', desc: t.howStep3d || "Partez l'esprit tranquille avec un voyage entièrement organisé par des pros." },
  ]

  const stats = [
    { num: '100000', suffix: '+', label: t.stats[0] },
    { num: '1000', suffix: '+', label: t.stats[1] },
    { num: '5', suffix: '+', label: t.stats[2] },
    { num: '99', suffix: '%', label: t.stats[3] },
  ]

  return (
    <div className="page-enter">

      {/* ══════════ HERO — Full-screen image slider ══════════ */}
      <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        {HERO_IMAGES.map((url, i) => (
          <div key={i} style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: i === heroIdx ? 1 : 0,
            transition: 'opacity 1.2s ease-in-out',
            willChange: 'opacity',
          }} />
        ))}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(11,35,64,.5) 0%, rgba(11,35,64,.7) 50%, rgba(11,35,64,.9) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: .05, backgroundImage: 'radial-gradient(circle at 25% 25%, #0DB9A8 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1280, margin: '0 auto', padding: '140px 24px 100px', width: '100%' }}>
          <div style={{ maxWidth: 680 }}>
            <div className="fade" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(13,185,168,.15)', border: '1px solid rgba(13,185,168,.3)', borderRadius: 50, padding: '8px 20px', fontSize: 13, fontWeight: 600, color: '#0DB9A8', marginBottom: 28, backdropFilter: 'blur(10px)' }}>
              {t.heroTag}
            </div>
            <h1 className="fade" style={{ fontFamily: 'Nunito', fontWeight: 900, fontSize: 'clamp(40px, 6vw, 72px)', lineHeight: 1.05, color: '#fff', marginBottom: 24, letterSpacing: '-0.02em' }}>
              {t.heroTitle1}{' '}
              <span style={{ color: '#0DB9A8', position: 'relative', display: 'inline-block' }}>
                {t.heroTitle2}
                <svg style={{ position: 'absolute', bottom: -4, left: 0, width: '100%', height: 8, overflow: 'visible' }} viewBox="0 0 200 8" preserveAspectRatio="none">
                  <path d="M0 6 Q50 0 100 5 Q150 10 200 3" fill="none" stroke="#0DB9A8" strokeWidth="3" strokeLinecap="round" opacity=".5" />
                </svg>
              </span>
              <br />{t.heroTitle3}
            </h1>
            <p className="fade" style={{ fontSize: 18, color: 'rgba(255,255,255,.7)', lineHeight: 1.8, marginBottom: 40, maxWidth: 520 }}>{t.heroSub}</p>
            <div className="hero-btns fade" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <button style={{ background: 'linear-gradient(135deg,#0DB9A8,#09907F)', color: '#fff', border: 'none', borderRadius: 50, padding: '16px 36px', fontWeight: 700, fontSize: 16, boxShadow: '0 8px 30px rgba(13,185,168,.4)', cursor: 'pointer', transition: 'all .25s', display: 'flex', alignItems: 'center', gap: 8 }}
                onClick={() => setPage('trips')}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(13,185,168,.5)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(13,185,168,.4)' }}>
                {t.heroCta} <span style={{ fontSize: 18 }}>→</span>
              </button>
              <button style={{ background: 'rgba(255,255,255,.1)', color: '#fff', border: '2px solid rgba(255,255,255,.25)', borderRadius: 50, padding: '15px 32px', fontWeight: 700, fontSize: 16, cursor: 'pointer', transition: 'all .25s', backdropFilter: 'blur(10px)' }}
                onClick={() => setPage('about')}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.2)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.4)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.25)' }}>
                {t.heroCta2}
              </button>
            </div>
          </div>
          {/* Dots */}
          <div style={{ display: 'flex', gap: 10, position: 'absolute', bottom: 40, left: 24 }}>
            {HERO_IMAGES.map((_, i) => (
              <button key={i} onClick={() => setHeroIdx(i)}
                style={{ width: i === heroIdx ? 32 : 10, height: 10, borderRadius: 10, border: 'none', background: i === heroIdx ? '#0DB9A8' : 'rgba(255,255,255,.3)', cursor: 'pointer', transition: 'all .3s', padding: 0 }} />
            ))}
          </div>
        </div>
      </div>

      {/* ══════════ ANIMATED STATS BAR ══════════ */}
      <div ref={statsRef} style={{ background: '#fff', padding: '52px 24px', borderBottom: '1px solid #EEF3F5' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, textAlign: 'center' }} className="stats-grid">
          {stats.map((s, i) => (
            <div key={i} style={{ opacity: statsInView ? 1 : 0, transform: statsInView ? 'translateY(0)' : 'translateY(20px)', transition: `all .6s ease ${i * .12}s` }}>
              <div style={{ fontFamily: 'Nunito', fontWeight: 900, fontSize: 'clamp(28px, 4vw, 42px)', color: 'var(--teal2)', lineHeight: 1 }}>
                <AnimNum target={s.num} suffix={s.suffix} inView={statsInView} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════ HOW IT WORKS — 3 steps ══════════ */}
      <div ref={howRef} style={{ background: 'var(--offwhite)', padding: '88px 24px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <SectionTitle center sub={t.howSub || 'Réservez votre prochain voyage en 3 étapes simples'}>
            {t.howTitle || 'Comment ça marche ?'}
          </SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, position: 'relative' }} className="how-grid">
            <div className="how-line" style={{ position: 'absolute', top: 52, left: '18%', right: '18%', height: 3, background: 'linear-gradient(90deg, var(--teal4), var(--teal), var(--teal4))', borderRadius: 2, zIndex: 0 }} />
            {steps.map((s, i) => (
              <div key={i} style={{
                textAlign: 'center', position: 'relative', zIndex: 1,
                opacity: howInView ? 1 : 0, transform: howInView ? 'translateY(0)' : 'translateY(30px)',
                transition: `all .6s ease ${i * .15}s`
              }}>
                <div style={{ width: 104, height: 104, borderRadius: '50%', background: '#fff', border: '3px solid var(--teal4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, margin: '0 auto 20px', boxShadow: '0 8px 30px rgba(13,185,168,.12)', position: 'relative' }}>
                  {s.ico}
                  <div style={{ position: 'absolute', top: -6, right: -6, width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--teal), var(--teal2))', color: '#fff', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div>
                </div>
                <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 20, color: 'var(--navy)', marginBottom: 8 }}>{s.title}</div>
                <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7, maxWidth: 280, margin: '0 auto' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════ CATEGORIES ══════════ */}
      <div style={{ background: '#fff', padding: '88px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionTitle center sub={t.catSubtitle || 'Trouvez le voyage parfait selon vos envies'}>{t.catTitle}</SectionTitle>
          <div className="cat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
            {categories.map(({ k, bg }) => (
              <div key={k} onClick={() => { setFilterCat(k); setPage('trips') }}
                style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', cursor: 'pointer', height: 200, transition: 'transform .25s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                <img src={bg} alt={k} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .4s' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(11,35,64,.8) 0%,rgba(11,35,64,.2) 60%,transparent 100%)' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '18px 22px' }}>
                  <div style={{ fontSize: 28, marginBottom: 4 }}>{t.catIco[k]}</div>
                  <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 17, color: '#fff' }}>{t.cats[k]}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', fontWeight: 500 }}>{t.catDesc[k]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════ FEATURED TRIPS ══════════ */}
      <div style={{ background: 'var(--offwhite)', padding: '88px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
            <SectionTitle sub={t.featSub || 'Nos voyages les mieux notés par la communauté'}>{t.featTitle}</SectionTitle>
            <button style={{ ...B.out, marginTop: 8 }} onClick={() => setPage('trips')}>{t.seeAll} →</button>
          </div>
          {feat.length === 0 ? <Spin /> : (
            <div className="offer-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
              {feat.map(o => <OfferCard key={o.id} offer={o} t={t} onOpen={onOpen} onViewAgency={onViewAgency} isFav={favIds?.includes(o.id)} onToggleFav={toggleFav} />)}
            </div>
          )}
        </div>
      </div>

      {/* ══════════ TESTIMONIALS ══════════ */}
      <div ref={testiRef} style={{ background: '#fff', padding: '88px 24px', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <SectionTitle center sub={t.testiSub || 'Ce que disent nos voyageurs'}>
            {t.testiTitle || 'Témoignages'}
          </SectionTitle>
          <div style={{ position: 'relative', maxWidth: 700, margin: '0 auto' }}>
            {TESTIMONIALS.map((testi, i) => (
              <div key={i} style={{ display: i === testiIdx ? 'block' : 'none', animation: i === testiIdx ? 'fadeIn .5s ease-out' : 'none' }}>
                <div style={{ background: 'var(--offwhite)', borderRadius: 24, padding: '36px 40px', border: '1px solid #EEF3F5', textAlign: 'center' }}>
                  <div style={{ fontSize: 48, color: 'var(--teal4)', lineHeight: 1, marginBottom: 8, fontFamily: 'Georgia, serif' }}>"</div>
                  <p style={{ fontSize: 16, color: 'var(--text)', lineHeight: 1.9, marginBottom: 24, fontStyle: 'italic' }}>{testi.text}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, var(--teal3), var(--teal4))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{testi.avatar}</div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 15, color: 'var(--navy)' }}>{testi.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>📍 {testi.city}</div>
                    </div>
                    <div style={{ marginLeft: 8 }}>{[1, 2, 3, 4, 5].map(s => <span key={s} style={{ color: s <= testi.rating ? '#F59E0B' : '#DDE5E8', fontSize: 14 }}>★</span>)}</div>
                  </div>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
              {TESTIMONIALS.map((_, i) => (
                <button key={i} onClick={() => setTestiIdx(i)}
                  style={{ width: i === testiIdx ? 24 : 8, height: 8, borderRadius: 8, border: 'none', background: i === testiIdx ? 'var(--teal)' : 'var(--teal4)', cursor: 'pointer', transition: 'all .3s', padding: 0 }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ TRUST BAND ══════════ */}
      <div style={{ background: 'linear-gradient(135deg,var(--navy),var(--navy2))', padding: '80px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -120, right: -120, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,185,168,.1) 0%, transparent 70%)' }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <img src="/logo-1.png" alt="Get Lost DZ" style={{ height: 72, marginBottom: 20, filter: 'brightness(0) invert(1) sepia(1) saturate(3) hue-rotate(140deg)' }} onError={e => e.target.style.display = 'none'} />
          <div style={{ fontFamily: 'Nunito', fontWeight: 900, fontSize: 30, color: '#fff', marginBottom: 12 }}>{t.whyTitle || 'Pourquoi choisir Get Lost DZ ?'}</div>
          <p style={{ color: 'rgba(255,255,255,.6)', maxWidth: 540, margin: '0 auto 36px', lineHeight: 1.8, fontSize: 15 }}>{t.whyDesc || 'Chaque offre est validée par notre équipe. Qualité, sécurité et authenticité garanties.'}</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['✅ Offres validées', '⭐ Avis vérifiés', '🤝 Agences certifiées', '🌍 100K communauté'].map(x => (
              <div key={x} style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 50, padding: '12px 24px', fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,.9)', backdropFilter: 'blur(10px)' }}>{x}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════ FINAL CTA ══════════ */}
      <div style={{ background: 'linear-gradient(135deg, #0DB9A8, #09907F)', padding: '72px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ fontFamily: 'Nunito', fontWeight: 900, fontSize: 'clamp(24px, 4vw, 36px)', color: '#fff', marginBottom: 14 }}>{t.ctaTitle || 'Prêt à partir ?'}</div>
          <p style={{ color: 'rgba(255,255,255,.8)', fontSize: 16, marginBottom: 32, lineHeight: 1.7 }}>{t.ctaDesc || 'Rejoignez +100K voyageurs et trouvez votre prochaine aventure dès maintenant.'}</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button style={{ ...B.white, padding: '16px 36px', fontSize: 16, fontWeight: 800 }} onClick={() => setPage('trips')}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
              {t.heroCta} →
            </button>
            <button style={{ background: 'transparent', color: '#fff', border: '2px solid rgba(255,255,255,.4)', borderRadius: 50, padding: '15px 32px', fontWeight: 700, fontSize: 16, cursor: 'pointer', transition: 'all .25s' }}
              onClick={() => setPage('register')}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.15)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.6)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.4)' }}>
              {t.navReg}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
