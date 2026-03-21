import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './context/AuthContext'
import { api } from './api'
import TR from './utils/translations'
import { track } from './utils/analytics'
import { fromSlug } from './utils/slug'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ForgotPasswordModal from './components/ForgotPasswordModal'
import ResetPasswordModal from './components/ResetPasswordModal'
import ReviewModal from './components/ReviewModal'
import HomePage from './pages/HomePage'
import TripsPage from './pages/TripsPage'
import AboutPage from './pages/AboutPage'
import DashPage from './pages/DashPage'
import AdminPage from './pages/AdminPage'
import AgencyAnalytics from './pages/AgencyAnalytics'
import AgencyProfilePage from './pages/AgencyProfilePage'
import OfferPage from './pages/OfferPage'
import AuthPage from './pages/AuthPage'

/* ── Hash routing ─────────────────────────────────────────────────── */
function parseHash(hash) {
  const h = (hash || '').replace('#', '') || '/'
  if (h === '/' || h === '') return { page: 'home' }
  if (h === '/voyages') return { page: 'trips' }
  if (h === '/a-propos') return { page: 'about' }
  if (h === '/mon-espace') return { page: 'dash' }
  if (h === '/admin') return { page: 'admin' }
  if (h === '/analytics') return { page: 'analytics' }
  if (h === '/connexion') return { page: 'login' }
  if (h === '/inscription') return { page: 'register' }
  if (h.startsWith('/offre/')) return { page: 'offer', offerId: fromSlug(h.split('/offre/')[1]) }
  if (h.startsWith('/agence/')) return { page: 'agency-profile', agencyId: fromSlug(h.split('/agence/')[1]) }
  return { page: 'home' }
}

const PAGE_HASHES = {
  home: '#/', trips: '#/voyages', about: '#/a-propos', dash: '#/mon-espace',
  admin: '#/admin', analytics: '#/analytics', login: '#/connexion', register: '#/inscription',
}

export default function App() {
  const [lang, setLang] = useState(localStorage.getItem("glz_lang") || "fr")
  const [filterCat, setFilterCat] = useState("all")
  const [forgotModal, setForgotModal] = useState(false)
  const [resetToken, setResetToken] = useState(null)
  const [reviewBookingId, setReviewBookingId] = useState(null)
  const [favIds, setFavIds] = useState([])
  const { user } = useAuth()
  const t = TR[lang]

  // ── Route state ──
  const [route, setRoute] = useState(() => parseHash(window.location.hash))
  const page = route.page

  useEffect(() => {
    const onHash = () => { setRoute(parseHash(window.location.hash)); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // Navigate
  const setPage = useCallback((pg, opts = {}) => {
    let hash
    if (pg === 'offer' && opts.offerId) hash = `#/offre/${opts.slug || opts.offerId}`
    else if (pg === 'agency-profile' && opts.agencyId) hash = `#/agence/${opts.slug || opts.agencyId}`
    else hash = PAGE_HASHES[pg] || '#/'
    if (window.location.hash !== hash) window.location.hash = hash
    else { setRoute(parseHash(hash)); window.scrollTo(0, 0) }
  }, [])

  const viewAgency = useCallback((id) => setPage('agency-profile', { agencyId: id }), [setPage])

  // Open offer as page
  const openOffer = useCallback((offer) => {
    const slug = (offer.title || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
    setPage('offer', { offerId: offer.id, slug: `${slug}-${offer.id}` })
  }, [setPage])

  // Favorites
  useEffect(() => {
    if (user) { api('/favorites/ids').then(setFavIds).catch(() => { }) }
    else { setFavIds([]) }
  }, [user])

  const toggleFav = useCallback(async (offerId) => {
    if (!user) { setPage('login'); return }
    try {
      const res = await api(`/favorites/${offerId}`, { method: 'POST' })
      if (res.favorited) setFavIds(p => [...p, offerId])
      else setFavIds(p => p.filter(id => id !== offerId))
    } catch (e) { console.error(e) }
  }, [user, setPage])

  useEffect(() => { track("page_view", { metadata: { page } }) }, [page])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tok = params.get("reset_token")
    const rbid = params.get("review_booking")
    if (tok) { setResetToken(tok); window.history.replaceState({}, '', window.location.pathname + window.location.hash) }
    if (rbid) { setReviewBookingId(rbid); window.history.replaceState({}, '', window.location.pathname + window.location.hash) }
    const handler = () => setForgotModal(true)
    document.addEventListener("openForgot", handler)
    return () => document.removeEventListener("openForgot", handler)
  }, [])

  // Redirect to login page if auth required
  const openAuth = useCallback((mode) => setPage(mode === 'register' ? 'register' : 'login'), [setPage])

  return (
    <div style={{ direction: lang === "ar" ? "rtl" : "ltr" }}>
      <Navbar page={page} setPage={setPage} lang={lang} setLang={setLang} openAuth={openAuth} t={t} />
      {page === "home" && <HomePage t={t} setPage={setPage} setFilterCat={setFilterCat} onOpen={openOffer} onViewAgency={viewAgency} favIds={favIds} toggleFav={toggleFav} />}
      {page === "trips" && <TripsPage t={t} filterCat={filterCat} setFilterCat={setFilterCat} onOpen={openOffer} onViewAgency={viewAgency} favIds={favIds} toggleFav={toggleFav} />}
      {page === "about" && <AboutPage t={t} />}
      {page === "dash" && <DashPage t={t} openAuth={openAuth} setReviewBookingId={setReviewBookingId} setPage={setPage} favIds={favIds} toggleFav={toggleFav} onOpen={openOffer} onViewAgency={viewAgency} />}
      {page === "analytics" && <AgencyAnalytics t={t} openAuth={openAuth} />}
      {page === "admin" && <AdminPage t={t} openAuth={openAuth} />}
      {page === "agency-profile" && <AgencyProfilePage agencyId={route.agencyId} t={t} onOpen={openOffer} setPage={setPage} />}
      {page === "offer" && <OfferPage offerId={route.offerId} t={t} lang={lang} setPage={setPage} />}
      {page === "login" && <AuthPage mode="login" t={t} setPage={setPage} />}
      {page === "register" && <AuthPage mode="register" t={t} setPage={setPage} />}
      <Footer t={t} setPage={setPage} />
      {forgotModal && <ForgotPasswordModal onClose={() => setForgotModal(false)} t={t} openAuth={openAuth} />}
      {resetToken && <ResetPasswordModal token={resetToken} onClose={() => setResetToken(null)} t={t} openAuth={openAuth} />}
      {reviewBookingId && <ReviewModal bookingId={reviewBookingId} onClose={() => setReviewBookingId(null)} t={t} />}
    </div>
  )
}
