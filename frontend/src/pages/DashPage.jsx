import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../context/ToastContext"
import { api } from "../api"
import { B, INP, TA, TH, TD, Card, Spin, Badge, Stars, SectionTitle, BOOKING_STATUSES, BSTATUS_MAP } from "../utils/styles.jsx"
import ProfileTab from "./ProfileTab"
import ReviewCard from "../components/ReviewCard"
import ReviewModal from "../components/ReviewModal"
import ChatModal from "../components/ChatModal"

export default function DashPage({t,openAuth,setReviewBookingId,setPage}){

  const {user}=useAuth();
  const {show}=useToast();
  const [tab,setTab]=useState(()=>{
    if(!user) return 'stats';
    if(user.role==='admin') return 'overview';
    if(user.role==='traveler') return 'bookings';
    return 'stats';
  });
  const [offers,setOffers]=useState([]);
  const [bookings,setBookings]=useState([]);
  const [chatBooking,setChatBooking]=useState(null);
  const [agencyReviews,setAgencyReviews]=useState([]);
  const [loading,setLoading]=useState(false);
  const [adminData,setAdminData]=useState(null);
  const [editTarget,setEditTarget]=useState(null);
  const EF={title:'',category:'national',price:'',duration:'',region:'',description:'',imageUrl:'',itinerary:'',includes:'',dates:''};
  const [form,setForm]=useState(EF);
  const load=useCallback(async()=>{
    if(!user)return;setLoading(true);
    try{
      if(user.role==='agency'&&user.agencyId){
        setOffers(await api(`/agencies/${user.agencyId}/offers`));
        setBookings(await api(`/agencies/${user.agencyId}/bookings`));
        // Load all reviews for agency offers
        const offData=await api(`/agencies/${user.agencyId}/offers`);
        const revPromises=offData.map(o=>api(`/offers/${o.id}/reviews`).then(rs=>rs.map(r=>({...r,offer_title:o.title}))).catch(()=>[]));
        const revArrays=await Promise.all(revPromises);
        setAgencyReviews(revArrays.flat());
      }
      else if(user.role==='traveler'){setBookings(await api('/bookings/my'));}
      else if(user.role==='admin'){
        try{
          const [stats,recentBookings,recentUsers,recentReviews]=await Promise.all([
            api('/admin/stats'),
            api('/admin/bookings'),
            api('/admin/users'),
            api('/admin/reviews')
          ]);
          setAdminData({stats,recentBookings:recentBookings.slice(0,5),recentUsers:recentUsers.slice(-5).reverse(),recentReviews:recentReviews.slice(0,5)});
        }catch(e){console.log('admin dash load error',e);}
      }
    }catch(e){show(e.message,'err');}
    setLoading(false);
  },[user]);
  useEffect(()=>{load();},[load]);
  if(!user)return(
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--offwhite)',paddingTop:68}}>
      <Card style={{padding:'48px 40px',textAlign:'center',maxWidth:380}}>
        <div style={{fontSize:48,marginBottom:16}}>🔐</div>
        <div style={{fontFamily:'Nunito',fontWeight:900,fontSize:20,color:'var(--navy)',marginBottom:8}}>Accès réservé</div>
        <p style={{color:'var(--muted)',marginBottom:24,fontSize:14}}>Connectez-vous pour accéder à votre espace personnel.</p>
        <button style={{...B.pri,width:'100%'}} onClick={()=>openAuth('login')}>{t.navLogin}</button>
      </Card>
    </div>
  );
  const submitOffer=async()=>{
    if(!form.title||!form.price||!form.region){show('Titre, prix et région requis','err');return;}
    try{
      const body={title:form.title,category:form.category,price:parseInt(form.price),duration:parseInt(form.duration)||1,region:form.region,description:form.description,imageUrl:form.imageUrl,
        itinerary:form.itinerary.split('\n').filter(Boolean),includes:form.includes.split('\n').filter(Boolean),dates:form.dates.split('\n').filter(Boolean)};
      if(editTarget){await api(`/offers/${editTarget.id}`,{method:'PUT',body});show('Offre mise à jour!');}
      else{await api('/offers',{method:'POST',body});show('Offre soumise pour validation!');}
      setForm(EF);setEditTarget(null);setTab('offers');load();
    }catch(e){show(e.message,'err');}
  };
  const delOffer=async(id)=>{
    if(!window.confirm(t.confirmDel))return;
    try{await api(`/offers/${id}`,{method:'DELETE'});show('Offre supprimée');load();}
    catch(e){show(e.message,'err');}
  };
  const startEdit=(o)=>{setEditTarget(o);setForm({title:o.title,category:o.category,price:String(o.price),duration:String(o.duration),region:o.region,description:o.description||'',imageUrl:o.image_url||'',itinerary:(o.itinerary||[]).join('\n'),includes:(o.includes||[]).join('\n'),dates:(o.available_dates||[]).join('\n')});setTab('add');};
  const TB=(a)=>({padding:'10px 18px',cursor:'pointer',fontSize:13,fontWeight:700,border:'none',borderBottom:a?'2px solid var(--teal)':'2px solid transparent',color:a?'var(--teal2)':'var(--muted)',background:'none',marginBottom:-1,transition:'all .18s'});
  const FI=({label,fk,type='text'})=><div><label style={{fontSize:12,fontWeight:600,color:'var(--muted)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:.8}}>{label}</label><input style={INP} type={type} value={form[fk]} onChange={e=>setForm(p=>({...p,[fk]:e.target.value}))}/></div>;
  const FTA=({label,fk,h=88})=><div><label style={{fontSize:12,fontWeight:600,color:'var(--muted)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:.8}}>{label}</label><textarea style={TA(h)} value={form[fk]} onChange={e=>setForm(p=>({...p,[fk]:e.target.value}))}/></div>;
  const SC=(ico,lbl,val,c='var(--teal2)')=>(
    <Card style={{padding:'20px 24px'}}>
      <div style={{fontSize:28,marginBottom:10}}>{ico}</div>
      <div style={{fontFamily:'Nunito',fontWeight:900,fontSize:30,color:c,lineHeight:1}}>{val}</div>
      <div style={{color:'var(--muted)',fontSize:12,fontWeight:600,marginTop:4,textTransform:'uppercase',letterSpacing:.8}}>{lbl}</div>
    </Card>
  );

  /* FIX 4: Short date formatter */
  const fmtDate=(d)=>d?new Date(d).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'}):'';

  return(
    <>
    <div style={{background:'var(--offwhite)',minHeight:'100vh',paddingTop:68}}>
      <div style={{background:'linear-gradient(135deg,var(--teal3),var(--teal4))',padding:'40px 24px 0'}}>
        <div style={{maxWidth:1280,margin:'0 auto'}}>
          <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:24}}>
            <div style={{width:56,height:56,borderRadius:'50%',background:'linear-gradient(135deg,var(--teal),var(--teal2))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:900,color:'#fff',overflow:'hidden',flexShrink:0,border:'3px solid rgba(255,255,255,.7)'}}>
              {user.avatar?<img src={user.avatar} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:user.name[0]}
            </div>
            <div>
              <div style={{fontFamily:'Nunito',fontWeight:900,fontSize:22,color:'var(--navy)'}}>{t.dashWelcome}, {user.name} 👋</div>
              <div style={{color:'var(--muted)',fontSize:13}}>{user.role==='agency'?'Compte Agence':user.role==='admin'?'Administrateur':'Compte Voyageur'}</div>
            </div>
          </div>
          {user.role==='agency'&&(
            <div style={{display:'flex',borderBottom:'2px solid rgba(0,0,0,.08)',gap:4}}>
              {[['stats',t.stats2],['bookings',t.myBook],['offers',t.myOffers],['add',editTarget?t.save:t.addOffer],['reviews','⭐ Avis'],['profile',t.profileTab]].map(([tk,lbl])=>(
                <button key={tk} style={TB(tab===tk)} onClick={()=>{if(tk!=='add'){setEditTarget(null);setForm(EF);}setTab(tk);}}>{lbl}</button>
              ))}
            </div>
          )}
          {user.role==='traveler'&&(
            <div style={{display:'flex',borderBottom:'2px solid rgba(0,0,0,.08)',gap:4}}>
              {[['bookings',t.myBook],['profile',t.profileTab]].map(([tk,lbl])=>(
                <button key={tk} style={TB(tab===tk)} onClick={()=>setTab(tk)}>{lbl}</button>
              ))}
            </div>
          )}
          {user.role==='admin'&&(
            <div style={{display:'flex',borderBottom:'2px solid rgba(0,0,0,.08)',gap:4}}>
              {[['overview','Vue d\'ensemble'],['activity','Activité récente'],['profile',t.profileTab]].map(([tk,lbl])=>(
                <button key={tk} style={TB(tab===tk)} onClick={()=>setTab(tk)}>{lbl}</button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{maxWidth:1280,margin:'0 auto',padding:'28px 24px 60px'}}>
        {user.role==='agency'&&<>
          {tab==='stats'&&!loading&&(
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:16}}>
              {SC('📦',t.totOff,offers.length)}
              {SC('✅',t.approved,offers.filter(o=>o.status==='approved').length)}
              {SC('⏳',t.pending,offers.filter(o=>o.status==='pending').length,'#D97706')}
              {SC('👁',t.views,offers.reduce((s,o)=>s+(o.views||0),0))}
            </div>
          )}
          {tab==='bookings'&&(loading?<Spin/>:(
            <Card>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr>{['Voyageur','Email','Offre','Prix','Téléphone','Date','Statut','Action'].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
                <tbody>
                  {bookings.map(b=>(
                    <tr key={b.id} style={{transition:'background .15s'}} onMouseEnter={e=>e.currentTarget.style.background='#FAFCFC'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                      <td style={{...TD,fontWeight:700,color:'var(--navy)'}}><div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:30,height:30,borderRadius:'50%',background:'linear-gradient(135deg,var(--teal),var(--teal2))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:'#fff',flexShrink:0}}>{(b.traveler_name||'?')[0].toUpperCase()}</div>{b.traveler_name}</div></td>
                      <td style={{...TD,color:'var(--muted)',fontSize:12}}>{b.traveler_email}</td>
                      <td style={{...TD,fontWeight:600,maxWidth:160}}>{b.offer_title}</td>
                      <td style={{...TD,color:'var(--teal2)',fontWeight:700,fontFamily:'Nunito'}}>{(b.price||0).toLocaleString()} DZD</td>
                      <td style={{...TD,fontSize:13}}>{b.phone||<span style={{color:'var(--muted)'}}>—</span>}</td>
                      <td style={{...TD,color:'var(--muted)',fontSize:12}}>{fmtDate(b.created_at)}</td>
                      <td style={TD}><Badge status={b.status}/></td>
                      <td style={TD}>
                        <select value={b.status} onChange={async e=>{
                          const ns=e.target.value;
                          try{await api(`/bookings/${b.id}/status`,{method:'PATCH',body:{status:ns}});
                          const bs=BSTATUS_MAP[ns];
                          show(bs?`Statut → ${bs.label}`:`Statut mis à jour`);load();}
                          catch(er){show(er.message,'err');}
                        }} style={{padding:'6px 10px',borderRadius:10,border:'1.5px solid #E2EBF0',fontSize:12,fontWeight:600,cursor:'pointer',background:'#F8FAFC'}}>
                          {BOOKING_STATUSES.map(s=><option key={s.v} value={s.v}>{s.label}</option>)}
                        </select>
                        <button onClick={()=>setChatBooking(b)} style={{...B.sm,marginTop:4,width:'100%',background:'linear-gradient(135deg,#0B2340,#0DB9A8)',color:'#fff',border:'none',fontWeight:700}}>💬 Chat</button>
                      </td>
                    </tr>
                  ))}
                  {!bookings.length&&<tr><td colSpan={7} style={{...TD,textAlign:'center',color:'var(--muted)',padding:40}}>Aucune réservation reçue pour l&apos;instant.</td></tr>}
                </tbody>
              </table>
            </Card>
          ))}
          {tab==='offers'&&(loading?<Spin/>:(
            <Card>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr>{['Titre','Cat.','Prix','Durée','Note','Statut','Actions'].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
                <tbody>
                  {offers.map(o=>(
                    <tr key={o.id} style={{transition:'background .15s'}} onMouseEnter={e=>e.currentTarget.style.background='#FAFCFC'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                      <td style={{...TD,fontWeight:700,color:'var(--navy)'}}>{o.title}</td>
                      <td style={{...TD,color:'var(--muted)'}}>{t.cats[o.category]||o.category}</td>
                      <td style={{...TD,fontWeight:700,color:'var(--teal2)',fontFamily:'Nunito'}}>{(o.price||0).toLocaleString()}</td>
                      <td style={{...TD,color:'var(--muted)'}}>{o.duration}j</td>
                      <td style={TD}>{o.avg_rating?<><Stars v={parseFloat(o.avg_rating)} size={12}/> <span style={{color:'#F59E0B',fontSize:12,fontWeight:700}}>{o.avg_rating}</span></>:'—'}</td>
                      <td style={TD}><Badge status={o.status}/></td>
                      <td style={TD}><div style={{display:'flex',gap:6}}><button style={B.sm} onClick={()=>startEdit(o)}>✏️</button><button style={B.danger} onClick={()=>delOffer(o.id)}>🗑️</button></div></td>
                    </tr>
                  ))}
                  {!offers.length&&<tr><td colSpan={7} style={{...TD,textAlign:'center',color:'var(--muted)',padding:40}}>Aucune offre. Créez votre première offre!</td></tr>}
                </tbody>
              </table>
            </Card>
          ))}
          {tab==='add'&&(
            <Card style={{padding:28}}>
              {editTarget&&<div style={{marginBottom:18,padding:'11px 16px',background:'#FEF3C7',border:'1px solid #F59E0B',borderRadius:10,color:'#92400E',fontSize:13,fontWeight:600}}>✏️ Modification : {editTarget.title}</div>}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:4}}>
                <FI label={t.fTitle} fk="title"/>
                <div><label style={{fontSize:12,fontWeight:600,color:'var(--muted)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:.8}}>{t.fCat}</label>
                  <select style={{...INP,background:'#fff'}} value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}>
                    {['intl','national','hike','visa'].map(c=><option key={c} value={c}>{t.cats[c]}</option>)}
                  </select>
                </div>
                <FI label={t.fPrice} fk="price" type="number"/>
                <FI label={t.fDur} fk="duration" type="number"/>
                <FI label={t.fRegion} fk="region"/>
                <FI label={t.fImg} fk="imageUrl"/>
              </div>
              <FTA label={t.fDesc} fk="description" h={72}/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
                <FTA label={t.fItin} fk="itinerary" h={90}/>
                <FTA label={t.fIncl} fk="includes" h={90}/>
                <FTA label={t.fDates} fk="dates" h={90}/>
              </div>
              <div style={{display:'flex',gap:10,marginTop:8}}>
                <button style={B.pri} onClick={submitOffer}>{editTarget?t.save:t.submit}</button>
                {editTarget&&<button style={B.ghost} onClick={()=>{setEditTarget(null);setForm(EF);setTab('offers');}}>{t.cancel}</button>}
              </div>
            </Card>
          )}
          {tab==='profile'&&<ProfileTab t={t}/>}
          {tab==='reviews'&&(loading?<Spin/>:(
            agencyReviews.length===0
            ?<div style={{textAlign:'center',padding:'60px 0'}}>
              <div style={{fontSize:48,marginBottom:12}}>⭐</div>
              <div style={{fontFamily:'Nunito',fontWeight:700,fontSize:18,color:'var(--navy)',marginBottom:6}}>Aucun avis pour l&apos;instant</div>
              <p style={{color:'var(--muted)',fontSize:14}}>Les avis apparaîtront après confirmation des réservations.</p>
            </div>
            :<div>
              <div style={{marginBottom:16,fontFamily:'Nunito',fontWeight:700,fontSize:16,color:'var(--navy)'}}>
                {agencyReviews.length} avis · Moyenne {agencyReviews.length?(agencyReviews.reduce((s,r)=>s+r.rating,0)/agencyReviews.length).toFixed(1):'—'} ⭐
              </div>
              {agencyReviews.map(r=>(
                <div key={r.id} style={{marginBottom:8}}>
                  {r.offer_title&&<div style={{fontSize:11,color:'var(--muted)',marginBottom:4,fontWeight:600}}>📦 {r.offer_title}</div>}
                  <ReviewCard r={r} isAgency={true} onReply={load}/>
                </div>
              ))}
            </div>
          ))}
        </>}
        {user.role==='traveler'&&(loading?<Spin/>:
          tab==='profile'?<ProfileTab t={t}/>:
          bookings.length===0
          ?<div style={{textAlign:'center',padding:'60px 0'}}>
            <div style={{fontSize:48,marginBottom:12}}>🎫</div>
            <div style={{fontFamily:'Nunito',fontWeight:700,fontSize:18,color:'var(--navy)',marginBottom:6}}>{t.myBook}</div>
            <p style={{color:'var(--muted)',fontSize:14}}>{t.noBook}</p>
          </div>
          :<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:16}}>
            {bookings.map(b=>(
              <Card key={b.id} style={{overflow:'hidden'}}>
                {b.image_url&&<img src={b.image_url} alt={b.offer_title} style={{width:'100%',height:120,objectFit:'cover'}}/>}
                <div style={{padding:'16px 18px'}}>
                  <div style={{fontFamily:'Nunito',fontWeight:800,fontSize:15,color:'var(--navy)',marginBottom:6}}>{b.offer_title}</div>
                  <div style={{color:'var(--teal2)',fontWeight:700,fontFamily:'Nunito',fontSize:18,marginBottom:8}}>{(b.price||0).toLocaleString()} DZD</div>
                  {/* FIX 4: short date format */}
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:b.status==='confirmed'?10:0}}>
                    <Badge status={b.status}/>
                    <span style={{fontSize:11,color:'var(--muted)'}}>{b.created_at?new Date(b.created_at).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'}):''}</span>
                  </div>
                  {b.status==='completed'&&<button onClick={()=>setReviewBookingId(String(b.id))} style={{...B.sm,width:'100%',marginTop:6,background:'linear-gradient(135deg,#F59E0B,#FBBF24)',color:'#fff',border:'none',fontWeight:700}}>⭐ Laisser un avis</button>}
                  <button onClick={()=>setChatBooking(b)} style={{...B.sm,width:'100%',marginTop:6,background:'linear-gradient(135deg,#0B2340,#0DB9A8)',color:'#fff',border:'none',fontWeight:700}}>💬 Messagerie</button>
                </div>
              </Card>
            ))}
          </div>
        )}
        {user.role==='admin'&&(loading?<Spin/>:<>
          {tab==='profile'&&<ProfileTab t={t}/>}
          {tab==='overview'&&adminData&&adminData.stats&&(
            <div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:14,marginBottom:28}}>
                {[
                  ['📦','Offres',adminData.stats.total_offers,'var(--teal2)'],
                  ['⏳','En attente',adminData.stats.pending_offers,'#D97706'],
                  ['✅','Validées',adminData.stats.approved_offers,'#059669'],
                  ['🏢','Agences',adminData.stats.total_agencies,'var(--teal2)'],
                  ['👤','Voyageurs',adminData.stats.total_travelers,'var(--teal2)'],
                  ['💬','Avis',adminData.stats.total_reviews,'var(--teal2)'],
                  ['🔔','Avis pend.',adminData.stats.pending_reviews,'#D97706'],
                  ['🎫','Réservations',adminData.stats.total_bookings,'var(--teal2)']
                ].map(([ico,lbl,val,c])=>SC(ico,lbl,val,c))}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
                <Card style={{padding:22}}>
                  <div style={{fontFamily:'Poppins',fontWeight:700,fontSize:15,color:'var(--navy)',marginBottom:14}}>🎫 Dernières réservations</div>
                  {(adminData.recentBookings||[]).length===0
                    ?<div style={{color:'var(--muted)',fontSize:13,padding:'16px 0',textAlign:'center'}}>Aucune réservation</div>
                    :(adminData.recentBookings||[]).map(b=>(
                    <div key={b.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #F0F4F5'}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:'var(--navy)'}}>{b.traveler_name}</div>
                        <div style={{fontSize:12,color:'var(--muted)'}}>{b.offer_title} · {b.agency_name}</div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <Badge status={b.status}/>
                        <div style={{fontSize:11,color:'var(--muted)',marginTop:2}}>{fmtDate(b.created_at)}</div>
                      </div>
                    </div>
                  ))}
                </Card>
                <Card style={{padding:22}}>
                  <div style={{fontFamily:'Poppins',fontWeight:700,fontSize:15,color:'var(--navy)',marginBottom:14}}>👤 Derniers inscrits</div>
                  {(adminData.recentUsers||[]).length===0
                    ?<div style={{color:'var(--muted)',fontSize:13,padding:'16px 0',textAlign:'center'}}>Aucun utilisateur</div>
                    :(adminData.recentUsers||[]).map(u=>(
                    <div key={u.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #F0F4F5'}}>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <div style={{width:30,height:30,borderRadius:'50%',background:'linear-gradient(135deg,var(--teal),var(--teal2))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:'#fff'}}>{(u.name||'?')[0].toUpperCase()}</div>
                        <div>
                          <div style={{fontSize:13,fontWeight:700,color:'var(--navy)'}}>{u.name}</div>
                          <div style={{fontSize:11,color:'var(--muted)'}}>{u.email}</div>
                        </div>
                      </div>
                      <span style={{padding:'3px 10px',borderRadius:20,fontSize:10,fontWeight:700,background:u.role==='agency'?'#EDE9FE':'#F0F4F5',color:u.role==='agency'?'#5B21B6':'var(--muted)'}}>{u.role}</span>
                    </div>
                  ))}
                </Card>
              </div>
              <div style={{marginTop:20,textAlign:'center'}}>
                <button style={B.pri} onClick={()=>{if(setPage)setPage('admin');else window.scrollTo(0,0);}}>
                  🛡️ Accéder au panneau Admin complet
                </button>
              </div>
            </div>
          )}
          {tab==='activity'&&adminData&&(
            <div>
              <Card style={{padding:22}}>
                <div style={{fontFamily:'Poppins',fontWeight:700,fontSize:15,color:'var(--navy)',marginBottom:14}}>⭐ Derniers avis</div>
                {(adminData.recentReviews||[]).length===0
                  ?<div style={{color:'var(--muted)',fontSize:13,padding:'16px 0',textAlign:'center'}}>Aucun avis</div>
                  :(adminData.recentReviews||[]).map(r=>(
                  <div key={r.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #F0F4F5'}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:'var(--navy)'}}>{r.user_name} — <Stars v={r.rating} size={12}/></div>
                      <div style={{fontSize:12,color:'var(--muted)'}}>{r.offer_title} · "{r.title}"</div>
                    </div>
                    <Badge status={r.status}/>
                  </div>
                ))}
              </Card>
              <Card style={{padding:22,marginTop:16}}>
                <div style={{fontFamily:'Poppins',fontWeight:700,fontSize:15,color:'var(--navy)',marginBottom:14}}>🎫 Dernières réservations</div>
                {(adminData.recentBookings||[]).map(b=>(
                  <div key={b.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #F0F4F5'}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:'var(--navy)'}}>{b.traveler_name} → {b.offer_title}</div>
                      <div style={{fontSize:12,color:'var(--muted)'}}>{b.agency_name} · {(b.price||0).toLocaleString()} DZD</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <Badge status={b.status}/>
                      <div style={{fontSize:11,color:'var(--muted)',marginTop:2}}>{fmtDate(b.created_at)}</div>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          )}
        </>)}
      </div>
    </div>
    {chatBooking&&<ChatModal booking={chatBooking} onClose={()=>setChatBooking(null)}/>}
    </>
  );
}