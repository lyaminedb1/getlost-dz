import { useState } from 'react'
import { useToast } from '../context/ToastContext'
import { api } from '../api'
import { B } from '../utils/styles.jsx'

export default function ReviewCard({r,isAgency=false,onReply}){
  const [replyMode,setReplyMode]=useState(false)
  const [replyText,setReplyText]=useState(r.agency_reply||'')
  const [saving,setSaving]=useState(false)
  const {show}=useToast()
  const saveReply=async()=>{
    setSaving(true)
    try{await api(`/reviews/${r.id}/reply`,{method:'PATCH',body:{reply:replyText}});show('Réponse publiée !');setReplyMode(false);if(onReply)onReply();}
    catch(e){show(e.message,'err');}
    setSaving(false)
  }
  return(
    <div style={{background:'#F8FAFC',borderRadius:14,padding:'16px 18px',marginBottom:12}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
        <div>
          <div style={{display:'flex',gap:2,marginBottom:4}}>
            {[1,2,3,4,5].map(s=><span key={s} style={{color:r.rating>=s?'#F59E0B':'#E2EBF0',fontSize:15}}>★</span>)}
          </div>
          <div style={{fontWeight:700,fontSize:14,color:'var(--navy)'}}>{r.title}</div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:11,color:'var(--muted)'}}>{r.user_name||'Voyageur'}</div>
          <div style={{fontSize:11,color:'var(--muted)'}}>{r.created_at?new Date(r.created_at).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'}):''}</div>
        </div>
      </div>
      {r.comment&&<p style={{fontSize:13,color:'#374151',margin:'4px 0 8px'}}>{r.comment}</p>}
      {r.photo&&<img src={r.photo} style={{width:'100%',maxHeight:180,objectFit:'cover',borderRadius:10,marginBottom:8}} alt=""/>}
      {r.agency_reply&&!replyMode&&(
        <div style={{background:'#EFF6FF',borderRadius:10,padding:'10px 14px',marginTop:8,borderLeft:'3px solid #0DB9A8'}}>
          <div style={{fontSize:11,fontWeight:700,color:'var(--teal2)',marginBottom:4}}>Réponse de l&apos;agence</div>
          <p style={{fontSize:13,color:'#374151',margin:0}}>{r.agency_reply}</p>
        </div>
      )}
      {isAgency&&!replyMode&&(
        <button onClick={()=>setReplyMode(true)} style={{...B.ghost,fontSize:12,padding:'5px 12px',marginTop:8}}>
          {r.agency_reply?'Modifier la réponse':'Répondre'}
        </button>
      )}
      {isAgency&&replyMode&&(
        <div style={{marginTop:8}}>
          <textarea value={replyText} onChange={e=>setReplyText(e.target.value)} rows={3}
            placeholder="Votre réponse publique…"
            style={{width:'100%',padding:'8px 12px',borderRadius:10,border:'1.5px solid #E2EBF0',fontSize:13,resize:'vertical',boxSizing:'border-box',marginBottom:6}}/>
          <div style={{display:'flex',gap:8}}>
            <button style={{...B.pri,fontSize:12,padding:'6px 14px'}} onClick={saveReply} disabled={saving}>{saving?'…':'Publier'}</button>
            <button style={{...B.ghost,fontSize:12,padding:'6px 14px'}} onClick={()=>setReplyMode(false)}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  )
}
