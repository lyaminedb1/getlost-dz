import { useState } from 'react'

export const B={
  pri:{background:'linear-gradient(135deg,#0DB9A8,#09907F)',color:'#fff',border:'none',borderRadius:50,padding:'12px 28px',fontWeight:700,fontSize:14,boxShadow:'0 4px 20px rgba(13,185,168,.35)',cursor:'pointer',transition:'all .2s'},
  out:{background:'transparent',color:'var(--teal)',border:'2px solid var(--teal)',borderRadius:50,padding:'11px 28px',fontWeight:700,fontSize:14,cursor:'pointer',transition:'all .2s'},
  ghost:{background:'rgba(11,35,64,.06)',color:'var(--navy)',border:'none',borderRadius:50,padding:'10px 22px',fontWeight:600,fontSize:14,cursor:'pointer',transition:'all .2s'},
  sm:{background:'var(--teal3)',color:'var(--teal2)',border:'1px solid var(--teal4)',borderRadius:8,padding:'6px 14px',fontWeight:700,fontSize:12,cursor:'pointer',transition:'all .2s'},
  danger:{background:'#FEE2E2',color:'#DC2626',border:'1px solid #FECACA',borderRadius:8,padding:'6px 14px',fontWeight:700,fontSize:12,cursor:'pointer'},
  white:{background:'#fff',color:'var(--teal2)',border:'none',borderRadius:50,padding:'12px 28px',fontWeight:700,fontSize:14,boxShadow:'0 4px 20px rgba(0,0,0,.12)',cursor:'pointer'},
}

export const INP={width:'100%',border:'1.5px solid #E2EBF0',borderRadius:10,padding:'11px 15px',fontSize:14,background:'#fff',color:'var(--text)',marginBottom:12,transition:'border .2s'}
export const TA=(h=80)=>({...INP,height:h,resize:'vertical'})
export const TH={textAlign:'left',padding:'11px 16px',fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:1.2,borderBottom:'2px solid #F0F4F5',background:'#FAFCFC'}
export const TD={padding:'13px 16px',borderBottom:'1px solid #F0F4F5',fontSize:14,color:'var(--text)'}

export const BOOKING_STATUSES=[
  {v:'pending',     label:'En attente',       bg:'#FEF3C7',c:'#92400E'},
  {v:'contacted',   label:'Contacté',         bg:'#DBEAFE',c:'#1E40AF'},
  {v:'didnt_answer',label:'Pas de réponse',   bg:'#FEE2E2',c:'#991B1B'},
  {v:'pre_reserved',label:'Pré-réservé',      bg:'#EDE9FE',c:'#5B21B6'},
  {v:'confirmed',   label:'Confirmé ✅',      bg:'#D1FAE5',c:'#065F46'},
  {v:'completed',   label:'Voyage terminé 🎉',bg:'#A7F3D0',c:'#065F46'},
  {v:'cancelled',   label:'Annulé',           bg:'#F3F4F6',c:'#6B7280'},
]
export const BSTATUS_MAP=Object.fromEntries(BOOKING_STATUSES.map(s=>[s.v,s]))

export const Stars=({v=0,size=14,interactive=false,onRate})=>{
  const [h,setH]=useState(0)
  return <span style={{display:'inline-flex',gap:2}}>{[1,2,3,4,5].map(i=>(
    <span key={i} style={{fontSize:size,cursor:interactive?'pointer':'default',color:i<=(h||v)?'#F59E0B':'#DDE5E8',lineHeight:1}}
      onClick={()=>interactive&&onRate?.(i)} onMouseEnter={()=>interactive&&setH(i)} onMouseLeave={()=>interactive&&setH(0)}>★</span>
  ))}</span>
}

export const Badge=({status})=>{
  const m={approved:{bg:'#D1FAE5',c:'#065F46'},pending:{bg:'#FEF3C7',c:'#92400E'},
    rejected:{bg:'#FEE2E2',c:'#991B1B'},suspended:{bg:'#FEE2E2',c:'#991B1B'},
    contacted:{bg:'#DBEAFE',c:'#1E40AF'},didnt_answer:{bg:'#FEE2E2',c:'#991B1B'},
    pre_reserved:{bg:'#EDE9FE',c:'#5B21B6'},confirmed:{bg:'#D1FAE5',c:'#065F46'},
    completed:{bg:'#A7F3D0',c:'#065F46'},cancelled:{bg:'#F3F4F6',c:'#6B7280'}}
  const bs=BSTATUS_MAP[status]
  const label=bs?bs.label:status
  const s=m[status]||m.pending
  return <span style={{padding:'3px 11px',borderRadius:20,fontSize:11,fontWeight:700,background:s.bg,color:s.c,letterSpacing:.3,whiteSpace:'nowrap'}}>{label}</span>
}

export const Spin=()=>(
  <div style={{display:'flex',justifyContent:'center',padding:'60px 0'}}>
    <div style={{width:36,height:36,border:'3px solid #E2EBF0',borderTopColor:'var(--teal)',borderRadius:'50%',animation:'spin 1s linear infinite'}}/>
  </div>
)

export const Card=({children,style={}})=>(
  <div style={{background:'#fff',borderRadius:20,boxShadow:'var(--shadow)',border:'1px solid #EEF3F5',...style}}>{children}</div>
)

export const SectionTitle=({children,sub,center=false})=>(
  <div style={{textAlign:center?'center':'left',marginBottom:40}}>
    <div style={{fontFamily:'Nunito',fontWeight:900,fontSize:'clamp(22px,3.5vw,32px)',color:'var(--navy)',lineHeight:1.2,marginBottom:8}}>{children}</div>
    {sub&&<p style={{color:'var(--muted)',fontSize:15,maxWidth:480,margin:center?'0 auto':0}}>{sub}</p>}
    <div style={{width:50,height:4,background:'linear-gradient(90deg,var(--teal),var(--teal2))',borderRadius:2,marginTop:12,...(center?{margin:'12px auto 0'}:{})}}/>
  </div>
)
