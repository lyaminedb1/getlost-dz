import { useState } from 'react'
import { useToast } from '../context/ToastContext'
import { api } from '../api'
import { B, INP, TA, Card } from '../utils/styles.jsx'

const EF={name:'',email:'',password:'',phone:'',agencyName:'',description:'',logo:'🏢',plan:'standard'}

export default function AdminCreateAgencyForm({onCreated}){
  const {show}=useToast()
  const [f,setF]=useState({...EF})
  const [open,setOpen]=useState(false)
  const [loading,setLoading]=useState(false)
  const submit=async()=>{
    if(!f.name||!f.email||!f.password){show('Nom, email et mot de passe requis','err');return;}
    if(f.password.length<6){show('Mot de passe: minimum 6 caractères','err');return;}
    setLoading(true)
    try{
      await api('/admin/create-agency',{method:'POST',body:f})
      show('Agence créée avec succès !','ok')
      setF({...EF});setOpen(false)
      if(onCreated)onCreated()
    }catch(e){show(e.message,'err');}
    setLoading(false)
  }
  return(
    <div style={{marginBottom:8}}>
      <button style={{...B.pri,display:'flex',alignItems:'center',gap:8,padding:'10px 22px',fontSize:13}} onClick={()=>setOpen(o=>!o)}>
        {open?'✕ Fermer':'➕ Créer une agence'}
      </button>
      {open&&(
        <Card style={{marginTop:16,padding:'28px',border:'2px solid var(--teal3)',background:'#FAFFFE'}}>
          <div style={{fontFamily:'Nunito',fontWeight:900,fontSize:16,color:'var(--navy)',marginBottom:20}}>🏢 Nouveau compte agence</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:.8,display:'block',marginBottom:5}}>Nom du contact *</label>
              <input style={INP} placeholder="Ex: Ahmed Benali" value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))}/>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:.8,display:'block',marginBottom:5}}>Nom de l'agence *</label>
              <input style={INP} placeholder="Ex: DZ Horizons Travel" value={f.agencyName} onChange={e=>setF(p=>({...p,agencyName:e.target.value}))}/>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:.8,display:'block',marginBottom:5}}>Email *</label>
              <input style={INP} type="email" placeholder="agence@example.com" value={f.email} onChange={e=>setF(p=>({...p,email:e.target.value}))}/>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:.8,display:'block',marginBottom:5}}>Mot de passe *</label>
              <input style={INP} type="password" placeholder="Min. 6 caractères" value={f.password} onChange={e=>setF(p=>({...p,password:e.target.value}))}/>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:.8,display:'block',marginBottom:5}}>Téléphone</label>
              <input style={INP} type="tel" placeholder="0770 123 456" value={f.phone} onChange={e=>setF(p=>({...p,phone:e.target.value}))}/>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:.8,display:'block',marginBottom:5}}>Plan</label>
              <select style={{...INP,marginBottom:0}} value={f.plan} onChange={e=>setF(p=>({...p,plan:e.target.value}))}>
                <option value="standard">Standard</option>
                <option value="premium">Premium ⭐</option>
              </select>
            </div>
          </div>
          <div style={{marginBottom:12}}>
            <label style={{fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:.8,display:'block',marginBottom:5}}>Description</label>
            <textarea style={TA(72)} placeholder="Description courte de l'agence…" value={f.description} onChange={e=>setF(p=>({...p,description:e.target.value}))}/>
          </div>
          <div style={{display:'flex',gap:10,alignItems:'center'}}>
            <div style={{flex:1}}>
              <label style={{fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:.8,display:'block',marginBottom:5}}>Logo (emoji)</label>
              <input style={{...INP,maxWidth:100}} placeholder="🏢" value={f.logo} onChange={e=>setF(p=>({...p,logo:e.target.value}))}/>
            </div>
            <button style={{...B.pri,padding:'12px 32px',fontSize:14,alignSelf:'flex-end',marginBottom:0}} onClick={submit} disabled={loading}>
              {loading?'…':'✅ Créer le compte'}
            </button>
          </div>
        </Card>
      )}
    </div>
  )
}
