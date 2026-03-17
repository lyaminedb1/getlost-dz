import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { B, INP } from '../utils/styles.jsx'
import { validateEmail, validatePassword, validatePhone, PasswordStrengthBar } from '../utils/validation.jsx'
import WILAYAS from '../utils/wilayas.js'

export default function AuthModal({mode,onClose,t}){
  const {login,register}=useAuth()
  const {show}=useToast()
  const [isLogin,setIsLogin]=useState(mode==='login')
  const EF=()=>({email:'',password:'',confirmPassword:'',name:'',familyName:'',phone:'',birthDate:'',gender:'',city:''})
  const [f,setF]=useState(EF)
  const [loading,setLoading]=useState(false)
  useEffect(()=>{setIsLogin(mode==='login');setF(EF());},[mode])
  const LBL=({children})=><label style={{fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:.7,display:'block',marginBottom:4}}>{children}</label>

  const submit=async()=>{
    if(!f.email||!f.password){show('Email et mot de passe requis','err');return;}
    if(!validateEmail(f.email)){show('Format email invalide','err');return;}
    if(isLogin){
      // Login — pas de validation stricte du mot de passe
    } else if(!isLogin){
      if(!f.name||!f.familyName){show('Prénom et nom de famille requis','err');return;}
      if(!f.phone){show('Numéro de téléphone requis','err');return;}
      if(!validatePhone(f.phone)){show('Numéro invalide (min. 8 chiffres)','err');return;}
      if(f.password!==f.confirmPassword){show('Les mots de passe ne correspondent pas','err');return;}
        if(!validatePassword(f.password).valid){show('Mot de passe trop faible (8+ caractères, 1 majuscule, 1 chiffre)','err');return;}
    }
    setLoading(true)
    try{
      if(isLogin){const u=await login(f.email,f.password);show(`Bienvenue, ${u.name}!`);}
      else{await register({...f,role:'traveler'});show('Compte créé ! Bienvenue 🎉');}
      onClose()
    }catch(e){show(e.message,'err');}
    setLoading(false)
  }
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(11,35,64,.6)',backdropFilter:'blur(8px)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={onClose}>
      <div style={{background:'#fff',borderRadius:24,padding:'28px',maxWidth:isLogin?400:520,width:'100%',boxShadow:'0 24px 60px rgba(11,35,64,.2)',maxHeight:'90vh',overflowY:'auto'}} className="fade" onClick={e=>e.stopPropagation()}>
        <div style={{textAlign:'center',marginBottom:20}}>
          <img src="/logo-1.png" alt="Get Lost DZ" style={{height:48,marginBottom:12}} onError={e=>e.target.style.display='none'}/>
          <div style={{fontFamily:'Nunito',fontWeight:900,fontSize:20,color:'var(--navy)'}}>{isLogin?t.loginTitle:t.regTitle}</div>
          {!isLogin&&<div style={{fontSize:12,color:'var(--muted)',marginTop:4}}>Créez votre compte voyageur</div>}
        </div>
        {isLogin?(
          <>
            <div><LBL>Email<span style={{color:"var(--teal2)"}}>*</span></LBL><input style={INP} type="email" placeholder="votre@email.com" value={f.email} onChange={e=>setF(p=>({...p,email:e.target.value}))}/></div>
            <div><LBL>Mot de passe<span style={{color:"var(--teal2)"}}>*</span></LBL><input style={INP} type="password" placeholder="••••••••" value={f.password} onChange={e=>setF(p=>({...p,password:e.target.value}))}/></div>
            <button style={{...B.pri,width:'100%',padding:13,fontSize:15,marginTop:4}} onClick={submit} disabled={loading}>{loading?'…':t.loginTitle}</button>
            <div style={{textAlign:'right',marginTop:8,marginBottom:4}}>
              <span style={{fontSize:12,color:'var(--teal2)',cursor:'pointer',fontWeight:600}} onClick={()=>{onClose();document.dispatchEvent(new CustomEvent('openForgot'));}}>{t.forgotPass}</span>
            </div>
          </>
        ):(
          <>
            <div style={{background:'var(--teal3)',borderRadius:12,padding:'12px 16px',marginBottom:16,fontSize:12,fontWeight:700,color:'var(--teal2)'}}>�� Identité</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:4}}>
              <div><LBL>Prénom<span style={{color:"var(--teal2)"}}>*</span></LBL><input style={INP} placeholder="Ahmed" value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))}/></div>
              <div><LBL>Nom de famille<span style={{color:"var(--teal2)"}}>*</span></LBL><input style={INP} placeholder="Benali" value={f.familyName} onChange={e=>setF(p=>({...p,familyName:e.target.value}))}/></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:4}}>
              <div>
                <LBL>Date de naissance</LBL>
                <input style={INP} type="date" value={f.birthDate} onChange={e=>setF(p=>({...p,birthDate:e.target.value}))} max={new Date().toISOString().split('T')[0]}/>
              </div>
              <div>
                <LBL>Genre</LBL>
                <select style={{...INP,marginBottom:0}} value={f.gender} onChange={e=>setF(p=>({...p,gender:e.target.value}))}>
                  <option value="">— Sélectionner —</option>
                  <option value="homme">Homme</option>
                  <option value="femme">Femme</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
            </div>
            <div style={{marginBottom:4}}>
              <LBL>Wilaya</LBL>
              <select style={{...INP,marginBottom:0}} value={f.city} onChange={e=>setF(p=>({...p,city:e.target.value}))}>
                <option value="">— Sélectionner une wilaya —</option>
                {WILAYAS.map(w=><option key={w.code} value={w.name}>{w.code} — {w.name}</option>)}
              </select>
            </div>
            <div style={{background:'var(--teal3)',borderRadius:12,padding:'12px 16px',marginBottom:16,marginTop:8,fontSize:12,fontWeight:700,color:'var(--teal2)'}}>📬 Contact & Accès</div>
            <div><LBL>Email<span style={{color:"var(--teal2)"}}>*</span></LBL><input style={INP} type="email" placeholder="votre@email.com" value={f.email} onChange={e=>setF(p=>({...p,email:e.target.value}))}/></div>
            <div>
              <LBL>Téléphone<span style={{color:'var(--teal2)'}}>*</span></LBL>
              <input style={INP} type="tel" placeholder="📞 0770 123 456" value={f.phone} onChange={e=>setF(p=>({...p,phone:e.target.value}))}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div>
                <LBL>Mot de passe<span style={{color:'var(--teal2)'}}>*</span></LBL>
                <input style={INP} type="password" placeholder="Min. 8 caractères" value={f.password} onChange={e=>setF(p=>({...p,password:e.target.value}))}/>
              <PasswordStrengthBar password={f.password}/>
              </div>
              <div>
                <LBL>Confirmer le mot de passe<span style={{color:'var(--teal2)'}}>*</span></LBL>
                <input style={{...INP,borderColor:f.confirmPassword&&f.password!==f.confirmPassword?'#EF4444':'',background:f.confirmPassword&&f.password!==f.confirmPassword?'#FEF2F2':''}}
                  type="password" placeholder="Répéter" value={f.confirmPassword} onChange={e=>setF(p=>({...p,confirmPassword:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&submit()}/>
                {f.confirmPassword&&f.password!==f.confirmPassword&&<div style={{fontSize:11,color:'#EF4444',marginTop:-8,marginBottom:8,fontWeight:600}}>⚠ Les mots de passe ne correspondent pas</div>}
              </div>
            </div>
            <button style={{...B.pri,width:'100%',padding:13,fontSize:15,marginTop:8}} onClick={submit} disabled={loading}>{loading?'…':'✅ Créer mon compte'}</button>
          </>
        )}
        <div style={{textAlign:'center',marginTop:14,fontSize:13,color:'var(--muted)'}}>
          {isLogin
            ?<>{t.noAcc} <span style={{color:'var(--teal2)',cursor:'pointer',fontWeight:700}} onClick={()=>setIsLogin(false)}>{t.regTitle}</span></>
            :<>{t.hasAcc} <span style={{color:'var(--teal2)',cursor:'pointer',fontWeight:700}} onClick={()=>setIsLogin(true)}>{t.loginTitle}</span></>}
        </div>
      </div>
    </div>
  )
}
