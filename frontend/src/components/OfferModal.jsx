import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { api } from '../api'
import { B, Stars } from '../utils/styles.jsx'
import { track } from '../utils/analytics'
import { validatePhone } from '../utils/validation.jsx'
import ReviewCard from './ReviewCard'
import PhoneInput from './PhoneInput'

export default function OfferModal({offer,onClose,t,lang,onViewAgency}){
  const {user}=useAuth()
  const {show}=useToast()
  const [reviews,setReviews]=useState([])
  const [booking,setBooking]=useState(false)
  const [phone,setPhone]=useState('+213 ')
  const [travelers,setTravelers]=useState(1)
  const rtl=lang==='ar'
  useEffect(()=>{if(offer){api(`/offers/${offer.id}/reviews`).then(setReviews).catch(()=>{});track('offer_view',{offer_id:offer.id});}},[offer?.id])
  if(!offer)return null
  const avg=reviews.length?(reviews.reduce((s,r)=>s+r.rating,0)/reviews.length).toFixed(1):(offer.avg_rating||null)
  const SL=({children})=><div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:1.5,color:'var(--teal2)',marginBottom:10}}>{children}</div>
  const handleBook=async()=>{
    track('booking_started',{offer_id:offer.id})
    if(!user){onClose();show('Connectez-vous pour réserver','warn');return;}
    if(!validatePhone(phone).valid){show('Numéro de téléphone invalide','err');return;}
    if(travelers<1||travelers>20){show('Nombre de voyageurs: 1 à 20','err');return;}
    setBooking(true)
    try{await api('/bookings',{method:'POST',body:{offerId:offer.id,phone:phone.trim(),travelers:travelers}});track('booking_done',{offer_id:offer.id});show(t.bookMsg);setPhone('+213 ');setTravelers(1);}
    catch(e){show(e.message,'err');}
    setBooking(false)
  }
  return(
    <div className="offer-modal-outer" style={{position:'fixed',inset:0,background:'rgba(11,35,64,.6)',backdropFilter:'blur(8px)',zIndex:500,display:'flex',alignItems:'flex-end',justifyContent:'center',padding:0}} onClick={onClose}>
      {/* Mobile: slide up from bottom. Desktop: centered card */}
      <div className="offer-modal-inner" style={{background:'#fff',borderRadius:'24px 24px 0 0',overflow:'hidden',maxWidth:660,width:'100%',maxHeight:'95vh',overflowY:'auto',direction:rtl?'rtl':'ltr'}} onClick={e=>e.stopPropagation()}>
        {/* Drag handle for mobile */}
        <div style={{display:'flex',justifyContent:'center',padding:'10px 0 0'}}>
          <div style={{width:36,height:4,borderRadius:2,background:'#DDE5E8'}}/>
        </div>
        <div style={{position:'relative'}}>
          <img src={offer.image_url||'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=700&q=80'} alt={offer.title}
            onError={e=>e.target.src='https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=700&q=80'}
            className="offer-modal-img"
            style={{width:'100%',height:200,objectFit:'cover',display:'block'}}/>
          <button onClick={onClose} style={{position:'absolute',top:14,right:14,background:'rgba(255,255,255,.95)',border:'none',borderRadius:'50%',width:36,height:36,fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 12px rgba(0,0,0,.15)'}}>×</button>
          <div style={{position:'absolute',bottom:14,left:14,background:'rgba(255,255,255,.95)',borderRadius:20,padding:'4px 14px',fontSize:11,fontWeight:700,color:'var(--teal2)'}}>{t.catIco?.[offer.category]} {t.cats?.[offer.category]}</div>
        </div>
        <div className="offer-modal-body" style={{padding:'20px 20px 24px'}}>
          <div style={{fontFamily:'Nunito',fontWeight:900,fontSize:20,color:'var(--navy)',marginBottom:8}}>{offer.title}</div>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
            <Stars v={parseFloat(avg)||0} size={15}/>
            {avg&&<span style={{fontWeight:800,color:'#F59E0B',fontSize:14}}>{avg}</span>}
            <span style={{color:'var(--muted)',fontSize:12}}>({reviews.length} {t.revs})</span>
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:16}}>
            {[['📍',offer.region],['⏱',`${offer.duration} ${t.days}`],['💰',`${(offer.price||0).toLocaleString()} DZD${t.per}`]].filter(Boolean).filter(([,v])=>v).map(([i,v])=>(
              <span key={v} style={{padding:'5px 12px',background:'#F7FAFA',borderRadius:20,fontSize:12,fontWeight:500,color:'var(--text)'}}>{i} {v}</span>
            ))}
            {offer.agency_name&&(
              <span onClick={(e)=>{e.stopPropagation();if(onViewAgency&&offer.agency_id)onViewAgency(offer.agency_id)}}
                style={{padding:'5px 12px',background:onViewAgency?'var(--teal3)':'#F7FAFA',borderRadius:20,fontSize:12,fontWeight:600,color:'var(--teal2)',cursor:onViewAgency?'pointer':'default',transition:'all .15s'}}>
                🏢 {offer.agency_name} {onViewAgency&&'→'}
              </span>
            )}
          </div>
          {offer.description&&<p style={{color:'var(--muted)',lineHeight:1.8,marginBottom:18,fontSize:13}}>{offer.description}</p>}
          {offer.itinerary?.length>0&&<div style={{marginBottom:16}}>
            <SL>{t.itin}</SL>
            {offer.itinerary.map((s,i)=><div key={i} style={{display:'flex',gap:10,marginBottom:6,fontSize:13}}>
              <span style={{width:20,height:20,borderRadius:'50%',background:'var(--teal3)',color:'var(--teal2)',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,flexShrink:0,marginTop:1}}>{i+1}</span>
              <span style={{color:'var(--text)'}}>{s}</span>
            </div>)}
          </div>}
          {offer.includes?.length>0&&<div style={{marginBottom:16}}>
            <SL>{t.incl}</SL>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {offer.includes.map((x,i)=><span key={i} style={{padding:'5px 12px',background:'var(--teal3)',borderRadius:20,fontSize:11,fontWeight:600,color:'var(--teal2)'}}>✓ {x}</span>)}
            </div>
          </div>}
          {offer.available_dates?.length>0&&<div style={{marginBottom:20}}>
            <SL>{t.dates}</SL>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {offer.available_dates.map((d,i)=><span key={i} style={{padding:'5px 12px',background:'#F7FAFA',borderRadius:20,fontSize:11,border:'1px solid #E2EBF0'}}>📅 {d}</span>)}
            </div>
          </div>}
          <div style={{borderTop:'2px solid #F0F4F5',paddingTop:18,marginBottom:14}}>
            <SL>💬 {t.revTitle}</SL>
            {reviews.length===0?<p style={{color:'var(--muted)',fontSize:13}}>{t.noRevs}</p>
            :reviews.map(r=><ReviewCard key={r.id} r={r} isAgency={false}/>)}
          </div>
          {user?.role==='traveler'&&<div style={{background:'var(--teal3)',borderRadius:14,padding:'12px 16px',marginBottom:18,display:'flex',alignItems:'center',gap:10,fontSize:12,color:'var(--teal2)'}}>
            <span style={{fontSize:18}}>💡</span>
            <span>Vous pourrez laisser un avis après confirmation de votre réservation.</span>
          </div>}
          {/* BOOKING BAR — stacked on mobile */}
          <div style={{background:'linear-gradient(135deg,var(--navy),#1a3a5c)',borderRadius:16,padding:'18px 18px 20px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <div>
                <div style={{fontSize:10,color:'rgba(255,255,255,.6)',textTransform:'uppercase',letterSpacing:1,marginBottom:2}}>{t.from}</div>
                <div style={{fontFamily:'Nunito',fontWeight:900,fontSize:24,color:'var(--teal)',lineHeight:1}}>
                  {(offer.price||0).toLocaleString()} <span style={{fontSize:11,color:'rgba(255,255,255,.5)',fontWeight:400}}>DZD{t.per}</span>
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontSize:11,color:'rgba(255,255,255,.5)'}}>👤</span>
                <input type="number" min="1" max="20" value={travelers} onChange={e=>setTravelers(Math.max(1,Math.min(20,parseInt(e.target.value)||1)))}
                  style={{width:48,background:'rgba(255,255,255,.12)',border:'1.5px solid rgba(255,255,255,.25)',borderRadius:8,padding:'8px 6px',fontSize:14,color:'#fff',textAlign:'center'}}
                  title="Nombre de voyageurs"/>
              </div>
            </div>
            <div style={{marginBottom:12}}>
              <PhoneInput value={phone} onChange={setPhone} dark={true} placeholder="770 123 456" showHint={false}/>
            </div>
            <button style={{...B.pri,width:'100%',padding:'13px 20px',fontSize:15,borderRadius:12,background:'linear-gradient(135deg,#0DB9A8,#09907F)',boxShadow:'0 4px 20px rgba(13,185,168,.4)'}} onClick={handleBook} disabled={booking}>
              {booking?'Réservation en cours…':t.book}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
