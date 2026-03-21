import { useState, useEffect, useRef } from "react"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../context/ToastContext"
import { api } from "../api"
import { B, INP, TA, TH, TD, Card, Spin, Badge, Stars, SectionTitle } from "../utils/styles.jsx"
import WILAYAS from '../utils/wilayas.js'
import ImageUpload from '../components/ImageUpload'

export default function ProfileTab({t}){

  const {user,updateUser}=useAuth();
  const {show}=useToast();
  const [pf,setPf]=useState({name:user?.name||'',familyName:user?.family_name||'',birthDate:user?.birth_date||'',gender:user?.gender||'',city:user?.city||'',email:user?.email||'',phone:user?.phone||'',password:'',agencyName:'',agencyDesc:'',agencyLogo:'🏢'});
  const [agencyData,setAgencyData]=useState(null);
  const [saving,setSaving]=useState(false);
  const fileRef=useRef(null);

  useEffect(()=>{
    if(user?.role==='agency'&&user?.agencyId){
      api(`/agencies`).then(list=>{
        const ag=list.find(a=>a.id===user.agencyId);
        if(ag){setAgencyData(ag);setPf(p=>({...p,agencyName:ag.name||'',agencyDesc:ag.description||'',agencyLogo:ag.logo||'🏢'}));}
      }).catch(()=>{});
    }
  },[user]);

  const handleAvatar=(e)=>{
    const file=e.target.files?.[0];
    if(!file)return;
    if(file.size>2_000_000){show('Image trop grande (max 2MB)','err');return;}
    const reader=new FileReader();
    reader.onload=(ev)=>{
      const b64=ev.target.result;
      api('/auth/avatar',{method:'POST',body:{avatar:b64}}).then(d=>{
        updateUser({avatar:b64});show('Photo mise à jour !');
      }).catch(e=>show(e.message,'err'));
    };
    reader.readAsDataURL(file);
  };

  const save=async()=>{
    if(!pf.name||!pf.email){show('Nom et email requis','err');return;}
    setSaving(true);
    try{
      const res=await api('/auth/profile',{method:'PUT',body:{...pf}});
      updateUser({name:pf.name,family_name:pf.familyName,birth_date:pf.birthDate,gender:pf.gender,city:pf.city,email:pf.email,phone:pf.phone});
      show(t.profileSuccess);
    }catch(e){show(e.message,'err');}
    setSaving(false);
  };

  const LBL=({children})=><label style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:1,color:'var(--muted)',display:'block',marginBottom:5}}>{children}</label>;

  return(
    <div className="profile-layout" style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:24,alignItems:'start'}}>
      {/* LEFT — Avatar */}
      <Card style={{padding:28,textAlign:'center'}}>
        <div style={{display:'flex',justifyContent:'center',marginBottom:16}}>
          <ImageUpload
            value={user?.avatar||''}
            onChange={async(url)=>{
              try{
                await api('/auth/avatar',{method:'POST',body:{avatar:url}});
                updateUser({avatar:url});show('Photo mise à jour !');
              }catch(e){show(e.message,'err');}
            }}
            type="avatar" shape="circle" size={100}
          />
        </div>
        <div style={{fontFamily:'Nunito',fontWeight:800,fontSize:16,color:'var(--navy)',marginBottom:4}}>{user?.name}</div>
        <div style={{fontSize:12,color:'var(--muted)',marginBottom:16}}>{user?.email}</div>
        <div style={{padding:'8px 16px',background:'var(--teal3)',borderRadius:20,display:'inline-block',fontSize:12,fontWeight:700,color:'var(--teal2)',marginBottom:12}}>
          {user?.role==='agency'?'🏢 Agence':user?.role==='admin'?'🛡️ Admin':'🧳 Voyageur'}
        </div>
        {user?.phone&&<div style={{fontSize:13,color:'var(--muted)',marginBottom:4}}>📞 {user.phone}</div>}
        {user?.city&&<div style={{fontSize:13,color:'var(--muted)',marginBottom:4}}>📍 {user.city}</div>}
        {user?.birth_date&&<div style={{fontSize:12,color:'var(--muted)',marginBottom:4}}>🎂 {user.birth_date}</div>}
      </Card>

      {/* RIGHT — Form */}
      <Card style={{padding:28}}>
        <div style={{fontFamily:'Nunito',fontWeight:800,fontSize:18,color:'var(--navy)',marginBottom:22}}>✏️ {t.profileTab}</div>

        {user?.role==='agency'?(<>
          {/* ── Agency profile ── */}
          <div style={{background:'var(--teal3)',borderRadius:10,padding:'8px 14px',marginBottom:14,fontSize:12,fontWeight:700,color:'var(--teal2)'}}>🏢 Informations agence</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 80px',gap:12,marginBottom:4}}>
            <div><LBL>{t.agNameLbl}</LBL><input style={INP} value={pf.agencyName} onChange={e=>setPf(p=>({...p,agencyName:e.target.value}))}/></div>
            <div><LBL>Logo</LBL><input style={INP} value={pf.agencyLogo} placeholder="🏢" onChange={e=>setPf(p=>({...p,agencyLogo:e.target.value}))}/></div>
          </div>
          <div><LBL>{t.descLbl}</LBL><textarea style={TA(72)} value={pf.agencyDesc} onChange={e=>setPf(p=>({...p,agencyDesc:e.target.value}))}/></div>

          <div style={{background:'var(--teal3)',borderRadius:10,padding:'8px 14px',margin:'16px 0 14px',fontSize:12,fontWeight:700,color:'var(--teal2)'}}>📬 Contact & Accès</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:4}}>
            <div><LBL>Nom du responsable</LBL><input style={INP} value={pf.name} onChange={e=>setPf(p=>({...p,name:e.target.value}))}/></div>
            <div><LBL>📞 Téléphone</LBL><input style={INP} type="tel" value={pf.phone} placeholder="0770 123 456" onChange={e=>setPf(p=>({...p,phone:e.target.value}))}/></div>
            <div><LBL>{t.emailLbl}</LBL><input style={INP} type="email" value={pf.email} onChange={e=>setPf(p=>({...p,email:e.target.value}))}/></div>
            <div><LBL>Wilaya</LBL>
              <select style={{...INP,marginBottom:0}} value={pf.city} onChange={e=>setPf(p=>({...p,city:e.target.value}))}>
                <option value="">— Sélectionner —</option>
                {WILAYAS.map(w=><option key={w.code} value={w.name}>{w.code} — {w.name}</option>)}
              </select>
            </div>
            <div style={{gridColumn:'1/-1'}}><LBL>🔒 {t.profileNewPass}</LBL><input style={INP} type="password" value={pf.password} placeholder="••••••••" onChange={e=>setPf(p=>({...p,password:e.target.value}))}/></div>
          </div>
        </>):(<>
          {/* ── Traveler / Admin profile ── */}
          <div style={{background:'var(--teal3)',borderRadius:10,padding:'8px 14px',marginBottom:14,fontSize:12,fontWeight:700,color:'var(--teal2)'}}>👤 Identité</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:4}}>
            <div><LBL>Prénom</LBL><input style={INP} value={pf.name} onChange={e=>setPf(p=>({...p,name:e.target.value}))}/></div>
            <div><LBL>Nom de famille</LBL><input style={INP} value={pf.familyName} onChange={e=>setPf(p=>({...p,familyName:e.target.value}))}/></div>
            <div><LBL>Date de naissance</LBL><input style={INP} type="date" value={pf.birthDate} max={new Date().toISOString().split('T')[0]} onChange={e=>setPf(p=>({...p,birthDate:e.target.value}))}/></div>
            <div><LBL>Genre</LBL>
              <select style={{...INP,marginBottom:0}} value={pf.gender} onChange={e=>setPf(p=>({...p,gender:e.target.value}))}>
                <option value="">— Sélectionner —</option>
                <option value="homme">Homme</option>
                <option value="femme">Femme</option>
              </select>
            </div>
            <div style={{gridColumn:'1/-1'}}>
              <LBL>Wilaya</LBL>
              <select style={{...INP,marginBottom:0}} value={pf.city} onChange={e=>setPf(p=>({...p,city:e.target.value}))}>
                <option value="">— Sélectionner une wilaya —</option>
                {WILAYAS.map(w=><option key={w.code} value={w.name}>{w.code} — {w.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{background:'var(--teal3)',borderRadius:10,padding:'8px 14px',margin:'16px 0 14px',fontSize:12,fontWeight:700,color:'var(--teal2)'}}>📬 Contact & Accès</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:4}}>
            <div><LBL>{t.emailLbl}</LBL><input style={INP} type="email" value={pf.email} onChange={e=>setPf(p=>({...p,email:e.target.value}))}/></div>
            <div><LBL>📞 {t.profilePhone}</LBL><input style={INP} type="tel" value={pf.phone} placeholder="0770 123 456" onChange={e=>setPf(p=>({...p,phone:e.target.value}))}/></div>
            <div style={{gridColumn:'1/-1'}}><LBL>🔒 {t.profileNewPass}</LBL><input style={INP} type="password" value={pf.password} placeholder="••••••••" onChange={e=>setPf(p=>({...p,password:e.target.value}))}/></div>
          </div>
        </>)}
        <button style={{...B.pri,padding:'12px 28px',marginTop:8}} onClick={save} disabled={saving}>{saving?'…':t.profileSave}</button>
      </Card>
    </div>
  );
}