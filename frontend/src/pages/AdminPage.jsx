import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../context/ToastContext"
import { api } from "../api"
import { B, INP, TA, TH, TD, Card, Spin, Badge, Stars, SectionTitle, BOOKING_STATUSES, BSTATUS_MAP } from "../utils/styles.jsx"
import AnalyticsDash from "./AdminAnalytics"
import AdminCreateAgencyForm from "./AdminCreateAgencyForm"

export default function AdminPage({t,openAuth}){

  const {user}=useAuth();
  const {show}=useToast();
  const [tab,setTab]=useState('offers');
  const [data,setData]=useState({offers:[],agencies:[],users:[],reviews:[],bookings:[],stats:null});
  const [loading,setLoading]=useState(false);
  const load=useCallback(async()=>{
    if(!user||user.role!=='admin')return;setLoading(true);
    try{
      const [stats,offers,agencies,users,reviews,bookings]=await Promise.all([api('/admin/stats'),api('/admin/offers'),api('/agencies'),api('/admin/users'),api('/admin/reviews'),api('/admin/bookings')]);
      setData({stats,offers,agencies,users,reviews,bookings});
    }catch(e){show(e.message,'err');}
    setLoading(false);
  },[user]);
  useEffect(()=>{load();},[load]);
  if(!user||user.role!=='admin')return(
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--offwhite)',paddingTop:68}}>
      <Card style={{padding:'48px 40px',textAlign:'center',maxWidth:380}}>
        <div style={{fontSize:48,marginBottom:16}}>🛡️</div>
        <div style={{fontFamily:'Nunito',fontWeight:900,fontSize:20,color:'var(--navy)',marginBottom:8}}>Admin uniquement</div>
        <button style={{...B.pri,width:'100%',marginTop:16}} onClick={()=>openAuth('login')}>{t.navLogin}</button>
      </Card>
    </div>
  );
  const patch=async(url,body,msg)=>{try{await api(url,{method:'PATCH',body});show(msg);load();}catch(e){show(e.message,'err');}};
  const {stats,offers,agencies,users,reviews,bookings=[]}=data;
  const pendO=offers.filter(o=>o.status==='pending').length;
  const pendR=reviews.filter(r=>r.status==='pending').length;
  const TB=(a)=>({padding:'10px 18px',cursor:'pointer',fontSize:13,fontWeight:700,border:'none',borderBottom:a?'2px solid var(--teal)':'2px solid transparent',color:a?'var(--teal2)':'var(--muted)',background:'none',marginBottom:-1,transition:'all .18s'});
  const Tbl=({children,cols})=>(
    <Card><table style={{width:'100%',borderCollapse:'collapse'}}>
      <thead><tr>{cols.map(c=><th key={c} style={TH}>{c}</th>)}</tr></thead>
      <tbody>{children}</tbody>
    </table></Card>
  );
  /* FIX 4: date formatter */
  const fmtDate=(d)=>d?new Date(d).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'}):'';
  return(
    <div style={{background:'var(--offwhite)',minHeight:'100vh',paddingTop:68}}>
      <div style={{background:'linear-gradient(135deg,var(--teal3),var(--teal4))',padding:'40px 24px 0'}}>
        <div style={{maxWidth:1280,margin:'0 auto'}}>
          <div style={{fontFamily:'Nunito',fontWeight:900,fontSize:28,color:'var(--navy)',marginBottom:20}}>🛡️ {t.adminTitle}</div>
          {stats&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:12,marginBottom:24}}>
            {[['📦','Offres',stats.total_offers,'var(--teal2)'],['⏳','En attente',stats.pending_offers,'#D97706'],['✅','Validées',stats.approved_offers,'#059669'],['🏢','Agences',stats.total_agencies,'var(--teal2)'],['👤','Voyageurs',stats.total_travelers,'var(--teal2)'],['💬','Avis',stats.total_reviews,'var(--teal2)'],['🔔','Avis pend.',stats.pending_reviews,'#D97706'],['🎫','Réservations',stats.total_bookings,'var(--teal2)']].map(([ico,lbl,val,c])=>(
              <div key={lbl} style={{background:'rgba(255,255,255,.8)',borderRadius:12,padding:'14px 16px',backdropFilter:'blur(4px)'}}>
                <div style={{fontSize:20,marginBottom:6}}>{ico}</div>
                <div style={{fontFamily:'Nunito',fontWeight:900,fontSize:24,color:c,lineHeight:1}}>{val}</div>
                <div style={{color:'var(--muted)',fontSize:11,fontWeight:600,marginTop:2}}>{lbl}</div>
              </div>
            ))}
          </div>}
          <div style={{display:'flex',gap:4,borderBottom:'2px solid rgba(0,0,0,.08)'}}>
            {[['offers',t.aOffers,pendO],['bookings','Réservations',0],['agencies',t.aAgencies,0],['users',t.aUsers,0],['reviews',t.aRevs,pendR],['analytics','📊 Analytics',0]].map(([tk,lbl,badge])=>(
              <button key={tk} style={TB(tab===tk)} onClick={()=>setTab(tk)}>
                {lbl}{badge>0&&<span style={{marginLeft:6,padding:'1px 7px',background:'#F59E0B',color:'#fff',borderRadius:10,fontSize:10,fontWeight:800}}>{badge}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{maxWidth:1280,margin:'0 auto',padding:'24px 24px 60px'}}>
        {loading?<Spin/>:<>
          {tab==='bookings'&&<Tbl cols={['Voyageur','Email','Offre','Agence','Prix','Téléphone','Date','Statut','Action']}>
            {bookings.map(b=>(
              <tr key={b.id}>
                <td style={{...TD,fontWeight:700}}><div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,var(--teal),var(--teal2))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:'#fff',flexShrink:0}}>{(b.traveler_name||'?')[0].toUpperCase()}</div>{b.traveler_name}</div></td>
                <td style={{...TD,color:'var(--muted)',fontSize:12}}>{b.traveler_email}</td>
                <td style={{...TD,fontWeight:600,maxWidth:150,fontSize:13}}>{b.offer_title}</td>
                <td style={{...TD,color:'var(--muted)',fontSize:13}}>{b.agency_name}</td>
                <td style={{...TD,color:'var(--teal2)',fontWeight:700,fontFamily:'Nunito'}}>{(b.price||0).toLocaleString()}</td>
                <td style={{...TD,fontSize:13}}>{b.phone||<span style={{color:'var(--muted)'}}>—</span>}</td>
                <td style={{...TD,color:'var(--muted)',fontSize:12}}>{fmtDate(b.created_at)}</td>
                <td style={TD}><Badge status={b.status}/></td>
                <td style={TD}><div style={{display:'flex',gap:5}}>
                  {b.status!=='confirmed'&&<button style={B.sm} onClick={async()=>{try{await api(`/bookings/${b.id}/status`,{method:'PATCH',body:{status:'confirmed'}});show('Confirmée!');load();}catch(e){show(e.message,'err');}}}>✅</button>}
                  {b.status!=='cancelled'&&<button style={B.danger} onClick={async()=>{try{await api(`/bookings/${b.id}/status`,{method:'PATCH',body:{status:'cancelled'}});show('Annulée');load();}catch(e){show(e.message,'err');}}}>✕</button>}
                </div></td>
              </tr>
            ))}
            {!bookings.length&&<tr><td colSpan={8} style={{...TD,textAlign:'center',color:'var(--muted)',padding:40}}>Aucune réservation.</td></tr>}
          </Tbl>}
          {tab==='offers'&&<Tbl cols={['Titre','Agence','Cat.','Prix','Statut','Actions']}>
            {offers.map(o=>(
              <tr key={o.id} style={{background:o.status==='pending'?'#FFFBEB':''}}>
                <td style={{...TD,fontWeight:700,color:'var(--navy)'}}>{o.title}</td>
                <td style={{...TD,color:'var(--muted)',fontSize:13}}>{o.agency_name||'—'}</td>
                <td style={{...TD,color:'var(--muted)',fontSize:13}}>{t.cats[o.category]||o.category}</td>
                <td style={{...TD,color:'var(--teal2)',fontWeight:700,fontFamily:'Nunito'}}>{(o.price||0).toLocaleString()}</td>
                <td style={TD}><Badge status={o.status}/></td>
                <td style={TD}><div style={{display:'flex',gap:6}}>
                  {o.status!=='approved'&&<button style={B.sm} onClick={()=>patch(`/offers/${o.id}/status`,{status:'approved'},'✅ Approuvé')}>{t.approve}</button>}
                  {o.status!=='rejected'&&<button style={B.danger} onClick={()=>patch(`/offers/${o.id}/status`,{status:'rejected'},'Refusé')}>{t.reject}</button>}
                </div></td>
              </tr>
            ))}
          </Tbl>}
          {tab==='agencies'&&<>
            {/* Create Agency Form */}
            <AdminCreateAgencyForm onCreated={load}/>
            {/* Agencies table */}
            <div style={{marginTop:24}}>
              <Tbl cols={['Agence','Plan','Email','Offres','Statut','Actions']}>
                {agencies.map(a=>(
                  <tr key={a.id}>
                    <td style={{...TD,fontWeight:700}}><span style={{marginRight:8,fontSize:18}}>{a.logo}</span>{a.name}</td>
                    <td style={TD}><span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700,background:a.plan==='premium'?'#FEF3C7':'#F0F4F5',color:a.plan==='premium'?'#92400E':'var(--muted)'}}>{a.plan}</span></td>
                    <td style={{...TD,color:'var(--muted)',fontSize:13}}>{a.email}</td>
                    <td style={TD}>{a.offer_count||0}</td>
                    <td style={TD}><Badge status={a.status}/></td>
                    <td style={TD}><div style={{display:'flex',gap:6}}>
                      {a.status!=='approved'&&<button style={B.sm} onClick={()=>patch(`/agencies/${a.id}/status`,{status:'approved'},'Activée')}>{t.approve}</button>}
                      {a.status==='approved'&&<button style={B.danger} onClick={()=>patch(`/agencies/${a.id}/status`,{status:'suspended'},'Suspendue')}>{t.suspend}</button>}
                    </div></td>
                  </tr>
                ))}
              </Tbl>
            </div>
          </>}
          {tab==='users'&&<Tbl cols={['Nom','Email','Rôle','Inscrit le']}>
            {users.map(u=>(
              <tr key={u.id}>
                <td style={{...TD,fontWeight:700}}>{u.name}</td>
                <td style={{...TD,color:'var(--muted)',fontSize:13}}>{u.email}</td>
                <td style={TD}><span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700,background:u.role==='admin'?'#D1FAE5':u.role==='agency'?'#EDE9FE':'#F0F4F5',color:u.role==='admin'?'#065F46':u.role==='agency'?'#5B21B6':'var(--muted)'}}>{u.role}</span></td>
                <td style={{...TD,color:'var(--muted)',fontSize:13}}>{(u.created_at||'').split('T')[0]}</td>
              </tr>
            ))}
          </Tbl>}
          {tab==='analytics'&&<AnalyticsDash/>}
          {tab==='reviews'&&<Tbl cols={['Utilisateur','Offre','Note','Titre','Statut','Actions']}>
            {reviews.map(r=>(
              <tr key={r.id} style={{background:r.status==='pending'?'#FFFBEB':''}}>
                <td style={{...TD,fontWeight:700}}>{r.user_name}</td>
                <td style={{...TD,color:'var(--muted)',fontSize:13,maxWidth:160}}>{r.offer_title}</td>
                <td style={TD}><Stars v={r.rating} size={13}/></td>
                <td style={{...TD,fontWeight:600}}>{r.title}</td>
                <td style={TD}><Badge status={r.status}/></td>
                <td style={TD}><div style={{display:'flex',gap:6}}>
                  {r.status!=='approved'&&<button style={B.sm} onClick={()=>patch(`/reviews/${r.id}/status`,{status:'approved'},'Approuvé')}>{t.approve}</button>}
                  {r.status!=='rejected'&&<button style={B.danger} onClick={()=>patch(`/reviews/${r.id}/status`,{status:'rejected'},'Refusé')}>{t.reject}</button>}
                </div></td>
              </tr>
            ))}
          </Tbl>}
        </>}
      </div>
    </div>
  );
}