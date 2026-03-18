import { useState, useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import TR from './utils/translations'
import { track } from './utils/analytics'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import AuthModal from './components/AuthModal'
import ForgotPasswordModal from './components/ForgotPasswordModal'
import ResetPasswordModal from './components/ResetPasswordModal'
import OfferModal from './components/OfferModal'
import ReviewModal from './components/ReviewModal'
import HomePage from './pages/HomePage'
import TripsPage from './pages/TripsPage'
import AboutPage from './pages/AboutPage'
import DashPage from './pages/DashPage'
import AdminPage from './pages/AdminPage'
import AgencyAnalytics from './pages/AgencyAnalytics'
import AgencyProfilePage from './pages/AgencyProfilePage'

export default function App(){
  const [lang,setLang]=useState(localStorage.getItem("glz_lang")||"fr")
  const [page,setPage]=useState("home")
  const [filterCat,setFilterCat]=useState("all")
  const [authModal,setAuthModal]=useState(null)
  const [selOffer,setSelOffer]=useState(null)
  const [forgotModal,setForgotModal]=useState(false)
  const [resetToken,setResetToken]=useState(null)
  const [reviewBookingId,setReviewBookingId]=useState(null)
  const [viewAgencyId,setViewAgencyId]=useState(null)
  const t=TR[lang]
  useEffect(()=>{track("page_view",{metadata:{page}});},[page])
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search)
    const tok=params.get("reset_token")
    const rbid=params.get("review_booking")
    if(tok){setResetToken(tok);window.history.replaceState({},'',window.location.pathname);}
    if(rbid){setReviewBookingId(rbid);window.history.replaceState({},'',window.location.pathname);}
    const handler=()=>setForgotModal(true)
    document.addEventListener("openForgot",handler)
    return()=>document.removeEventListener("openForgot",handler)
  },[])
  return(
    <div style={{direction:lang==="ar"?"rtl":"ltr"}}>
      <Navbar page={page} setPage={setPage} lang={lang} setLang={setLang} openAuth={setAuthModal} t={t}/>
      {page==="home"&&<HomePage t={t} setPage={setPage} setFilterCat={setFilterCat} onOpen={setSelOffer} onViewAgency={(id)=>{setViewAgencyId(id);setPage('agency-profile')}}/>}
      {page==="trips"&&<TripsPage t={t} filterCat={filterCat} setFilterCat={setFilterCat} onOpen={setSelOffer} onViewAgency={(id)=>{setViewAgencyId(id);setPage('agency-profile')}}/>}
      {page==="about"&&<AboutPage t={t}/>}
      {page==="dash"&&<DashPage t={t} openAuth={setAuthModal} setReviewBookingId={setReviewBookingId} setPage={setPage}/>}
      {page==="analytics"&&<AgencyAnalytics t={t} openAuth={setAuthModal}/>}
      {page==="admin"&&<AdminPage t={t} openAuth={setAuthModal}/>}
      {page==="agency-profile"&&<AgencyProfilePage agencyId={viewAgencyId} t={t} onOpen={setSelOffer} setPage={setPage}/>}
      <Footer t={t} setPage={setPage}/>
      {authModal&&<AuthModal mode={authModal} onClose={()=>setAuthModal(null)} t={t}/>}
      {selOffer&&<OfferModal offer={selOffer} onClose={()=>setSelOffer(null)} t={t} lang={lang} onViewAgency={(id)=>{setSelOffer(null);setViewAgencyId(id);setPage('agency-profile')}}/>}
      {forgotModal&&<ForgotPasswordModal onClose={()=>setForgotModal(false)} t={t} openAuth={setAuthModal}/>}
      {resetToken&&<ResetPasswordModal token={resetToken} onClose={()=>setResetToken(null)} t={t} openAuth={setAuthModal}/>}
      {reviewBookingId&&<ReviewModal bookingId={reviewBookingId} onClose={()=>setReviewBookingId(null)} t={t}/>}
    </div>
  )
}
