import { useState } from 'react'
import { B } from '../utils/styles.jsx'
import { track } from '../utils/analytics'

export default function OfferCard({offer,t,onOpen,onViewAgency}){
  const [hov,setHov]=useState(false)
  const avg=offer.avg_rating
  return(
    <div onClick={()=>{track('offer_click',{offer_id:offer.id});onOpen(offer)}}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:'#fff',borderRadius:20,overflow:'hidden',border:'1px solid #EEF3F5',cursor:'pointer',transition:'all .25s',boxShadow:hov?'0 20px 50px rgba(13,185,168,.18)':'var(--shadow)',transform:hov?'translateY(-5px)':'none'}}>
      <div style={{position:'relative'}}>
        <img src={offer.image_url||'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=500&q=80'} alt={offer.title}
          onError={e=>e.target.src='https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=500&q=80'}
          style={{width:'100%',height:200,objectFit:'cover',display:'block',transition:'transform .3s',...(hov?{transform:'scale(1.03)'}:{})}}/>
        <div style={{position:'absolute',top:12,left:12,background:'rgba(255,255,255,.95)',backdropFilter:'blur(4px)',borderRadius:20,padding:'4px 12px',fontSize:11,fontWeight:700,color:'var(--teal2)'}}>
          {t.catIco?.[offer.category]} {t.cats?.[offer.category]||offer.category}
        </div>
        {avg&&<div style={{position:'absolute',bottom:12,right:12,background:'rgba(255,255,255,.95)',borderRadius:20,padding:'4px 10px',display:'flex',alignItems:'center',gap:4}}>
          <span style={{color:'#F59E0B',fontSize:13}}>★</span>
          <span style={{fontSize:12,fontWeight:800,color:'var(--navy)'}}>{avg}</span>
        </div>}
      </div>
      <div style={{padding:'16px 20px 20px'}}>
        <div style={{fontFamily:'Nunito',fontWeight:800,fontSize:16,color:'var(--navy)',marginBottom:4,lineHeight:1.3}}>{offer.title}</div>
        {offer.agency_name&&<div style={{fontSize:12,color:'var(--teal2)',fontWeight:600,marginBottom:6,cursor:onViewAgency?'pointer':'default'}}
          onClick={e=>{e.stopPropagation();if(onViewAgency&&offer.agency_id)onViewAgency(offer.agency_id)}}>
          {offer.agency_logo||'🏢'} {offer.agency_name}
        </div>}
        <div style={{display:'flex',gap:14,color:'var(--muted)',fontSize:12,fontWeight:500,marginBottom:14,flexWrap:'wrap'}}>
          <span>📍 {offer.region}</span>
          <span>⏱ {offer.duration}{t.days}</span>
          <span>💬 {offer.review_count||0} {t.revs}</span>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontSize:10,color:'var(--muted)',fontWeight:600,textTransform:'uppercase',letterSpacing:.8,marginBottom:1}}>{t.from}</div>
            <div style={{fontFamily:'Nunito',fontWeight:900,fontSize:20,color:'var(--teal2)',lineHeight:1}}>
              {(offer.price||0).toLocaleString()} <span style={{fontSize:11,color:'var(--muted)',fontWeight:500}}>DZD{t.per}</span>
            </div>
          </div>
          <button style={{...B.pri,padding:'9px 18px',fontSize:12}} onClick={e=>{e.stopPropagation();onOpen(offer)}}>{t.details}</button>
        </div>
      </div>
    </div>
  )
}
