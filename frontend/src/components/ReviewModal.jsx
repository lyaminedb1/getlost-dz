import { useState } from 'react'
import { useToast } from '../context/ToastContext'
import { api } from '../api'
import { B, INP, Stars } from '../utils/styles.jsx'

export default function ReviewModal({bookingId,onClose,t,onDone}){
  const {show}=useToast()
  const [f,setF]=useState({rating:0,title:'',comment:''})
  const [loading,setLoading]=useState(false)
  const submit=async()=>{
    if(!f.rating||!f.title.trim()){show('Note et titre requis','err');return;}
    setLoading(true)
    try{
      await api('/offers/'+bookingId+'/reviews',{method:'POST',body:{...f,booking_id:bookingId}})
      show('Avis publié ! Merci 🎉')
      onDone?.()
      onClose()
    }catch(e){show(e.message,'err');}
    setLoading(false)
  }
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(11,35,64,.6)',backdropFilter:'blur(8px)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={onClose}>
      <div style={{background:'#fff',borderRadius:24,padding:'32px 28px',maxWidth:460,width:'100%',boxShadow:'0 24px 60px rgba(11,35,64,.2)'}} onClick={e=>e.stopPropagation()}>
        <div style={{textAlign:'center',marginBottom:24}}>
          <div style={{fontSize:40,marginBottom:10}}>⭐</div>
          <div style={{fontFamily:'Nunito',fontWeight:900,fontSize:20,color:'var(--navy)',marginBottom:6}}>{t.leaveRev}</div>
        </div>
        <div style={{marginBottom:16,textAlign:'center'}}>
          <div style={{fontSize:12,color:'var(--muted)',fontWeight:700,marginBottom:8}}>{t.yourRating}</div>
          <Stars v={f.rating} size={32} interactive onRate={r=>setF(p=>({...p,rating:r}))}/>
        </div>
        <input style={INP} placeholder={t.fTitle||'Titre de votre avis'} value={f.title} onChange={e=>setF(p=>({...p,title:e.target.value}))}/>
        <textarea style={{...INP,height:100,resize:'vertical'}} placeholder={t.revPlaceholder} value={f.comment} onChange={e=>setF(p=>({...p,comment:e.target.value}))}/>
        <button style={{...B.pri,width:'100%',padding:13,fontSize:15}} onClick={submit} disabled={loading}>{loading?'...':t.submitRev}</button>
      </div>
    </div>
  )
}
