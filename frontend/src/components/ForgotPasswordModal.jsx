import { useState } from 'react'
import { useToast } from '../context/ToastContext'
import { api } from '../api'
import { B, INP } from '../utils/styles.jsx'

export default function ForgotPasswordModal({onClose,t,openAuth}){
  const {show}=useToast()
  const [email,setEmail]=useState('')
  const [loading,setLoading]=useState(false)
  const [done,setDone]=useState(false)
  const submit=async()=>{
    if(!email){show('Email requis','err');return;}
    setLoading(true)
    try{await api('/auth/forgot-password',{method:'POST',body:{email}});setDone(true);}
    catch(e){show(e.message,'err');}
    setLoading(false)
  }
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(11,35,64,.6)',backdropFilter:'blur(8px)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={onClose}>
      <div style={{background:'#fff',borderRadius:24,padding:'32px 28px',maxWidth:400,width:'100%',boxShadow:'0 24px 60px rgba(11,35,64,.2)'}} className="fade" onClick={e=>e.stopPropagation()}>
        <div style={{textAlign:'center',marginBottom:24}}>
          <div style={{fontSize:40,marginBottom:10}}>🔑</div>
          <div style={{fontFamily:'Nunito',fontWeight:900,fontSize:20,color:'var(--navy)',marginBottom:6}}>{t.forgotTitle}</div>
          <p style={{color:'var(--muted)',fontSize:13}}>{t.forgotSub}</p>
        </div>
        {done?(
          <div style={{textAlign:'center'}}>
            <div style={{background:'#D1FAE5',borderRadius:16,padding:'20px',marginBottom:20}}>
              <div style={{fontSize:32,marginBottom:8}}>📧</div>
              <div style={{color:'#065F46',fontWeight:700,fontSize:14}}>{t.forgotDone}</div>
            </div>
            <span style={{fontSize:13,color:'var(--teal2)',cursor:'pointer',fontWeight:600}} onClick={()=>{onClose();openAuth('login');}}>{t.backToLogin}</span>
          </div>
        ):(
          <>
            <input style={INP} type="email" placeholder={t.emailLbl} value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()}/>
            <button style={{...B.pri,width:'100%',padding:13,fontSize:15,marginBottom:12}} onClick={submit} disabled={loading}>{loading?'…':t.forgotSend}</button>
            <div style={{textAlign:'center',fontSize:13,color:'var(--muted)'}}>
              <span style={{color:'var(--teal2)',cursor:'pointer',fontWeight:600}} onClick={()=>{onClose();openAuth('login');}}>{t.backToLogin}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
