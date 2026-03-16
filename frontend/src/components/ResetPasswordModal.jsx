import { useState, useEffect } from 'react'
import { useToast } from '../context/ToastContext'
import { api } from '../api'
import { B, INP } from '../utils/styles.jsx'

export default function ResetPasswordModal({token,onClose,t,openAuth}){
  const {show}=useToast()
  const [pass,setPass]=useState('')
  const [confirm,setConfirm]=useState('')
  const [loading,setLoading]=useState(false)
  const [done,setDone]=useState(false)
  const [invalid,setInvalid]=useState(false)
  useEffect(()=>{
    api('/auth/verify-reset-token',{method:'POST',body:{token}}).then(d=>{
      if(!d.valid)setInvalid(true)
    }).catch(()=>setInvalid(true))
  },[token])
  const submit=async()=>{
    if(!pass||!confirm){show('Les deux champs sont requis','err');return;}
    if(pass!==confirm){show(t.resetMismatch,'err');return;}
    if(pass.length<6){show('Minimum 6 caractères','err');return;}
    setLoading(true)
    try{await api('/auth/reset-password',{method:'POST',body:{token,password:pass}});setDone(true);}
    catch(e){show(e.message,'err');}
    setLoading(false)
  }
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(11,35,64,.6)',backdropFilter:'blur(8px)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:'#fff',borderRadius:24,padding:'32px 28px',maxWidth:400,width:'100%',boxShadow:'0 24px 60px rgba(11,35,64,.2)'}} className="fade">
        {invalid?(
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:40,marginBottom:12}}>❌</div>
            <div style={{fontFamily:'Nunito',fontWeight:900,fontSize:18,color:'var(--navy)',marginBottom:8}}>{t.resetInvalid}</div>
            <button style={{...B.pri,marginTop:16}} onClick={()=>{onClose();openAuth('login');}}>{t.backToLogin}</button>
          </div>
        ):done?(
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:40,marginBottom:12}}>✅</div>
            <div style={{fontFamily:'Nunito',fontWeight:900,fontSize:18,color:'var(--navy)',marginBottom:8}}>{t.resetDone}</div>
            <button style={{...B.pri,marginTop:16}} onClick={()=>{onClose();openAuth('login');}}>{t.navLogin}</button>
          </div>
        ):(
          <>
            <div style={{textAlign:'center',marginBottom:24}}>
              <div style={{fontSize:40,marginBottom:10}}>🔐</div>
              <div style={{fontFamily:'Nunito',fontWeight:900,fontSize:20,color:'var(--navy)',marginBottom:6}}>{t.resetTitle}</div>
              <p style={{color:'var(--muted)',fontSize:13}}>{t.resetSub}</p>
            </div>
            <input style={INP} type="password" placeholder={t.resetNewPass} value={pass} onChange={e=>setPass(e.target.value)}/>
            <input style={INP} type="password" placeholder={t.resetConfirm} value={confirm} onChange={e=>setConfirm(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()}/>
            <button style={{...B.pri,width:'100%',padding:13,fontSize:15}} onClick={submit} disabled={loading}>{loading?'…':t.resetSave}</button>
          </>
        )}
      </div>
    </div>
  )
}
