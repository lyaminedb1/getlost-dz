import { useState, useEffect, useCallback } from "react"
import { useToast } from "../context/ToastContext"
import { api } from "../api"
import { B, INP, TA, TH, TD, Card, Spin, Badge, Stars, SectionTitle, BOOKING_STATUSES, BSTATUS_MAP } from "../utils/styles.jsx"
import SvgLineChart from "../components/charts/SvgLineChart"
import DonutSmall from "../components/charts/DonutSmall"
import HeatGrid from "../components/charts/HeatGrid"
import StatRow from "../components/charts/StatRow"
import MiniBarH from "../components/charts/MiniBarH"

export default function AnalyticsDash(){

  const [days,setDays]=useState(30);
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(false);
  const [section,setSection]=useState('overview'); // overview | agencies | traffic | users
  const {show}=useToast();

  const load=useCallback(async()=>{
    setLoading(true);
    try{const d=await api(`/admin/analytics?days=${days}`);setData(d);}
    catch(e){show(e.message,'err');}
    setLoading(false);
  },[days]);
  useEffect(()=>{load();},[load]);

  const fmtDA=v=>v!=null?`${v} DA`:'—';
  const fmtK=v=>v>=1000?`${(v/1000).toFixed(1)}k`:String(v);
  const fmtDA2=v=>v>=1000000?`${(v/1000000).toFixed(2)}M DA`:v>=1000?`${(v/1000).toFixed(0)}k DA`:`${v} DA`;

  const C={teal:'#0DB9A8',navy:'#0B2340',blue:'#3B82F6',green:'#10B981',amber:'#F59E0B',red:'#EF4444',purple:'#8B5CF6'};

  const SECTIONS=[['overview','🏠 Vue d\'ensemble'],['agencies','🏢 Agences'],['traffic','📡 Trafic'],['users','👥 Utilisateurs']];

  if(loading||!data)return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:400,gap:12}}>
      <div style={{width:40,height:40,borderRadius:'50%',border:`3px solid ${C.teal}`,borderTopColor:'transparent',animation:'spin 1s linear infinite'}}/>
      <span style={{color:'var(--muted)',fontWeight:600,fontSize:13}}>Chargement du tableau de bord…</span>
    </div>
  );

  const {
    daily=[],hourly=[],devices=[],browsers=[],sources=[],langs=[],searches=[],filters=[],
    funnel={offer_views:0,booking_started:0,booking_done:0},
    total_events=0,total_sessions=0,top_offers=[],
    agency_leaderboard=[],revenue_daily=[],booking_statuses=[],offer_categories=[],
    total_revenue=0,period_revenue=0,
    new_users_curr=0,new_users_prev=0,new_bookings_curr=0,new_bookings_prev=0,
    user_growth=[],top_cities=[],gender_stats=[]
  }=data;

  const totalBookings=booking_statuses.reduce((s,x)=>s+(x.c||0),0);
  const completedCount=(booking_statuses.find(x=>x.status==='completed')||{}).c||0;
  const pendingCount=(booking_statuses.find(x=>x.status==='pending')||{}).c||0;
  const convRate=funnel.offer_views>0?((funnel.booking_done/funnel.offer_views)*100).toFixed(1):'0.0';

  const KPI=({icon,label,value,sub,color,trend})=>(
    <div style={{background:'#fff',borderRadius:18,padding:'20px 22px',boxShadow:'0 2px 16px rgba(11,35,64,.07)',border:'1px solid #E2E8F0',position:'relative',overflow:'hidden',transition:'transform .2s,box-shadow .2s'}}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 28px rgba(11,35,64,.12)';}}
      onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='0 2px 16px rgba(11,35,64,.07)';}}>
      <div style={{position:'absolute',top:-20,right:-20,width:80,height:80,borderRadius:'50%',background:`${color}12`}}/>
      <div style={{fontSize:24,marginBottom:8}}>{icon}</div>
      <div style={{fontFamily:'Nunito',fontWeight:900,fontSize:28,color,lineHeight:1,marginBottom:3}}>{value}</div>
      <div style={{fontWeight:700,fontSize:12,color:'var(--navy)',marginBottom:2}}>{label}</div>
      <div style={{fontSize:11,color:'var(--muted)'}}>{sub}</div>
      {trend!=null&&<div style={{position:'absolute',top:16,right:16,fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,background:trend>0?'#D1FAE5':trend===0?'#F1F5F9':'#FEE2E2',color:trend>0?'#059669':trend===0?'#94A3B8':'#DC2626'}}>{trend>0?'↑':trend===0?'—':'↓'}{Math.abs(trend)}%</div>}
    </div>
  );

  const usrTrend=new_users_prev>0?Math.round(((new_users_curr-new_users_prev)/new_users_prev)*100):null;
  const bkTrend=new_bookings_prev>0?Math.round(((new_bookings_curr-new_bookings_prev)/new_bookings_prev)*100):null;

  return(
    <div>
      {/* Header + period + section nav */}
      <div style={{background:`linear-gradient(135deg,${C.navy},#1a3a5c,#0a4a3a)`,borderRadius:20,padding:'28px 32px',marginBottom:24,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:-60,right:-60,width:220,height:220,borderRadius:'50%',background:'rgba(13,185,168,.1)',pointerEvents:'none'}}/>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16}}>
          <div>
            <div style={{fontFamily:'Nunito',fontWeight:900,fontSize:22,color:'#fff'}}>📊 Business Intelligence</div>
            <div style={{color:'rgba(255,255,255,.5)',fontSize:12,marginTop:3}}>Vue complète de la plateforme</div>
          </div>
          <div style={{display:'flex',gap:6,background:'rgba(255,255,255,.1)',borderRadius:50,padding:'4px'}}>
            {[[7,'7j'],[30,'30j'],[90,'90j']].map(([d,l])=>(
              <button key={d} onClick={()=>setDays(d)} style={{padding:'6px 16px',borderRadius:50,fontSize:11,fontWeight:700,cursor:'pointer',border:'none',background:days===d?C.teal:'transparent',color:days===d?'#fff':'rgba(255,255,255,.6)',transition:'all .2s'}}>{l}</button>
            ))}
            <button onClick={load} style={{padding:'6px 12px',borderRadius:50,fontSize:11,fontWeight:700,cursor:'pointer',border:'none',background:'transparent',color:'rgba(255,255,255,.5)'}}>↻</button>
          </div>
        </div>
        {/* Section pills */}
        <div style={{display:'flex',gap:8,marginTop:20,flexWrap:'wrap'}}>
          {SECTIONS.map(([k,lbl])=>(
            <button key={k} onClick={()=>setSection(k)} style={{padding:'7px 18px',borderRadius:50,fontSize:12,fontWeight:700,cursor:'pointer',border:`1px solid ${section===k?C.teal:'rgba(255,255,255,.2)'}`,background:section===k?C.teal:'rgba(255,255,255,.08)',color:section===k?'#fff':'rgba(255,255,255,.7)',transition:'all .2s'}}>{lbl}</button>
          ))}
        </div>
      </div>

      {/* ── OVERVIEW ─────────────────────────────────────── */}
      {section==='overview'&&<>
        {/* KPI row */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:14,marginBottom:20}}>
          <KPI icon='💰' label='Revenu total' value={fmtDA2(total_revenue)} sub='Réservations confirmées + terminées' color={C.green}/>
          <KPI icon='📈' label={`Revenu sur ${days}j`} value={fmtDA2(period_revenue)} sub={`${days} derniers jours`} color={C.teal}/>
          <KPI icon='🎫' label='Nouvelles résa.' value={new_bookings_curr} sub={`vs ${new_bookings_prev} période précédente`} color={C.blue} trend={bkTrend}/>
          <KPI icon='👤' label='Nouveaux inscrits' value={new_users_curr} sub={`vs ${new_users_prev} période précédente`} color={C.purple} trend={usrTrend}/>
          <KPI icon='🏢' label='Agences actives' value={agency_leaderboard.filter(a=>a.booking_count>0).length} sub={`sur ${agency_leaderboard.length} totales`} color={C.amber}/>
          <KPI icon='✅' label='Voyages terminés' value={completedCount} sub={`${totalBookings} réservations totales`} color={C.green}/>
          <KPI icon='📊' label='Taux conversion' value={`${convRate}%`} sub='Vues → Réservations' color={parseFloat(convRate)>3?C.green:C.amber}/>
          <KPI icon='⏳' label='En attente' value={pendingCount} sub='Réservations non traitées' color={pendingCount>10?C.red:C.amber}/>
        </div>

        {/* Revenue + Bookings chart */}
        <div style={{marginBottom:16}}>
          <SvgLineChart data={revenue_daily} keys={['revenue','bookings']} colors={[C.green,C.blue]}
            title='💰 Revenus & Réservations' subtitle='Montants confirmés par jour'
            height={180} formatY={fmtDA2}/>
        </div>

        {/* Funnel + booking statuses */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
          <Card style={{padding:'24px'}}>
            <div style={{fontFamily:'Nunito',fontWeight:800,fontSize:15,color:'var(--navy)',marginBottom:4}}>🔽 Funnel de conversion</div>
            <div style={{fontSize:11,color:'var(--muted)',marginBottom:20}}>De la vue à la réservation confirmée</div>
            {[
              {label:'👁 Vues offres',val:funnel.offer_views,c:C.teal},
              {label:'🖱 Résa. démarrées',val:funnel.booking_started,c:C.blue},
              {label:'✅ Résa. confirmées',val:funnel.booking_done,c:C.green},
            ].map((s,i,arr)=>{
              const base=funnel.offer_views||1;
              const pct=Math.round((s.val/base)*100);
              const step=i>0&&arr[i-1].val>0?Math.round((s.val/arr[i-1].val)*100):null;
              return(
                <div key={i} style={{marginBottom:i<2?18:0}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                    <span style={{fontSize:12,fontWeight:700,color:'var(--navy)'}}>{s.label}</span>
                    <div style={{textAlign:'right'}}>
                      <span style={{fontFamily:'Nunito',fontWeight:900,fontSize:16,color:s.c}}>{s.val}</span>
                      {step!==null&&<span style={{fontSize:10,color:'var(--muted)',marginLeft:6}}>{step}%</span>}
                    </div>
                  </div>
                  <div style={{background:'#F1F5F9',borderRadius:6,height:10,overflow:'hidden'}}>
                    <div style={{height:'100%',borderRadius:6,background:s.c,width:`${pct}%`,transition:'width .8s'}}/>
                  </div>
                  {i<2&&<div style={{display:'flex',justifyContent:'center',marginTop:6}}><div style={{width:1,height:10,background:'#E2E8F0'}}/></div>}
                </div>
              );
            })}
            <div style={{marginTop:20,padding:'12px 16px',background:'#F0FDF9',borderRadius:12,border:'1px solid #A7F3D0'}}>
              <div style={{fontSize:11,color:'var(--muted)',fontWeight:600}}>Taux global</div>
              <div style={{fontFamily:'Nunito',fontWeight:900,fontSize:24,color:C.teal}}>{convRate}%</div>
            </div>
          </Card>

          <Card style={{padding:'24px'}}>
            <div style={{fontFamily:'Nunito',fontWeight:800,fontSize:15,color:'var(--navy)',marginBottom:4}}>📋 Statuts réservations</div>
            <div style={{fontSize:11,color:'var(--muted)',marginBottom:20}}>Distribution sur la période</div>
            <MiniBarH data={booking_statuses} nameKey='status' valueKey='c' title=''
              color={C.teal}/>
            <div style={{marginTop:16,padding:'10px 14px',background:'#F8FAFC',borderRadius:10}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12}}>
                <span style={{color:'var(--muted)',fontWeight:600}}>Total réservations</span>
                <span style={{fontFamily:'Nunito',fontWeight:900,color:'var(--navy)'}}>{totalBookings}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Categories + top offers */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
          <Card style={{padding:'24px'}}>
            <MiniBarH data={offer_categories} nameKey='category' valueKey='views'
              title='🏷 Catégories — vues cumulées' color={C.purple} maxRows={8}/>
          </Card>
          <Card style={{padding:'24px'}}>
            <MiniBarH data={top_offers} nameKey='title' valueKey='views'
              title='🏆 Top offres par vues' color={C.teal} maxRows={8}/>
          </Card>
        </div>
      </>}

      {/* ── AGENCIES ─────────────────────────────────────── */}
      {section==='agencies'&&<>
        {/* Agency leaderboard */}
        <Card style={{padding:'24px',marginBottom:16}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:'wrap',gap:8}}>
            <div>
              <div style={{fontFamily:'Nunito',fontWeight:800,fontSize:15,color:'var(--navy)'}}>🏆 Classement des agences</div>
              <div style={{fontSize:11,color:'var(--muted)',marginTop:2}}>Par revenu généré (réservations confirmées + terminées)</div>
            </div>
          </div>
          {agency_leaderboard.length===0?(
            <div style={{textAlign:'center',padding:'40px',color:'var(--muted)'}}>
              <div style={{fontSize:36,marginBottom:8}}>📭</div><div style={{fontWeight:600}}>Aucune agence</div>
            </div>
          ):(
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead>
                  <tr style={{borderBottom:'2px solid #F1F5F9'}}>
                    {['#','Agence','Plan','Offres','Réservations','Terminées','Annulées','En attente','Revenu','Note','Avis'].map(h=>(
                      <th key={h} style={{padding:'8px 12px',textAlign:'left',fontWeight:700,color:'var(--muted)',fontSize:11,textTransform:'uppercase',letterSpacing:.6,whiteSpace:'nowrap'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {agency_leaderboard.map((a,i)=>{
                    const medals=['🥇','🥈','🥉'];
                    const convA=a.booking_count>0?Math.round((a.completed_count/a.booking_count)*100):0;
                    return(
                      <tr key={a.id} style={{borderBottom:'1px solid #F8FAFC',transition:'background .15s'}}
                        onMouseEnter={e=>e.currentTarget.style.background='#F8FAFC'}
                        onMouseLeave={e=>e.currentTarget.style.background=''}>
                        <td style={{padding:'12px',fontFamily:'Nunito',fontWeight:900,fontSize:16,textAlign:'center'}}>
                          {i<3?medals[i]:<span style={{color:'var(--muted)',fontSize:12}}>#{i+1}</span>}
                        </td>
                        <td style={{padding:'12px',whiteSpace:'nowrap'}}>
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <span style={{fontSize:18}}>{a.logo||'🏢'}</span>
                            <div>
                              <div style={{fontWeight:700,color:'var(--navy)'}}>{a.name}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{padding:'12px'}}>
                          <span style={{padding:'2px 8px',borderRadius:20,fontSize:10,fontWeight:700,background:a.plan==='premium'?'#FEF3C7':'#F0F4F5',color:a.plan==='premium'?'#92400E':'var(--muted)'}}>
                            {a.plan==='premium'?'⭐ Premium':'Standard'}
                          </span>
                        </td>
                        <td style={{padding:'12px',textAlign:'center',fontFamily:'Nunito',fontWeight:700,color:'var(--navy)'}}>{a.offer_count||0}</td>
                        <td style={{padding:'12px',textAlign:'center',fontFamily:'Nunito',fontWeight:700,color:'var(--navy)'}}>{a.booking_count||0}</td>
                        <td style={{padding:'12px',textAlign:'center'}}>
                          <span style={{fontFamily:'Nunito',fontWeight:700,color:'#10B981'}}>{a.completed_count||0}</span>
                          <span style={{fontSize:10,color:'var(--muted)',marginLeft:4}}>({convA}%)</span>
                        </td>
                        <td style={{padding:'12px',textAlign:'center',fontFamily:'Nunito',fontWeight:700,color:a.cancelled_count>0?'#EF4444':'var(--muted)'}}>{a.cancelled_count||0}</td>
                        <td style={{padding:'12px',textAlign:'center',fontFamily:'Nunito',fontWeight:700,color:a.pending_bookings>0?'#F59E0B':'var(--muted)'}}>{a.pending_bookings||0}</td>
                        <td style={{padding:'12px',whiteSpace:'nowrap'}}>
                          <span style={{fontFamily:'Nunito',fontWeight:900,color:'#10B981',fontSize:14}}>{fmtDA2(a.revenue||0)}</span>
                        </td>
                        <td style={{padding:'12px',textAlign:'center'}}>
                          {a.avg_rating?<span style={{fontFamily:'Nunito',fontWeight:700,color:'#F59E0B'}}>⭐ {a.avg_rating}</span>:<span style={{color:'var(--muted)'}}>—</span>}
                        </td>
                        <td style={{padding:'12px',textAlign:'center',fontFamily:'Nunito',fontWeight:700,color:'var(--navy)'}}>{a.review_count||0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Agency summary cards */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:14,marginBottom:16}}>
          {[
            ['💰','Revenu total agences',fmtDA2(agency_leaderboard.reduce((s,a)=>s+(a.revenue||0),0)),C.green],
            ['🥇','Meilleure agence',agency_leaderboard[0]?.name||'—',C.amber],
            ['📦','Total offres',agency_leaderboard.reduce((s,a)=>s+(a.offer_count||0),0),C.teal],
            ['⭐','Meilleure note',agency_leaderboard.filter(a=>a.avg_rating).sort((a,b)=>b.avg_rating-a.avg_rating)[0]?.avg_rating||'—',C.purple],
          ].map(([ico,lbl,val,c])=>(
            <div key={lbl} style={{background:'#fff',borderRadius:16,padding:'18px 20px',boxShadow:'0 2px 14px rgba(11,35,64,.07)',border:'1px solid #E2E8F0'}}>
              <div style={{fontSize:22,marginBottom:8}}>{ico}</div>
              <div style={{fontFamily:'Nunito',fontWeight:900,fontSize:22,color:c,lineHeight:1,marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{val}</div>
              <div style={{fontSize:11,color:'var(--muted)',fontWeight:600}}>{lbl}</div>
            </div>
          ))}
        </div>

        {/* Revenue per agency bar */}
        <Card style={{padding:'24px'}}>
          <MiniBarH
            data={[...agency_leaderboard].sort((a,b)=>(b.revenue||0)-(a.revenue||0))}
            nameKey='name' valueKey='revenue' title='💰 Revenu par agence'
            color={C.green} formatVal={fmtDA2} maxRows={10}/>
        </Card>
      </>}

      {/* ── TRAFFIC ──────────────────────────────────────── */}
      {section==='traffic'&&<>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:14,marginBottom:20}}>
          <KPI icon='🖱' label='Événements' value={fmtK(total_events)} sub={`${days} derniers jours`} color={C.teal}/>
          <KPI icon='👥' label='Sessions uniques' value={fmtK(total_sessions)} sub='Visiteurs distincts' color={C.blue}/>
          <KPI icon='🔍' label='Recherches' value={searches.reduce((s,x)=>s+(x.c||0),0)} sub='Termes tapés' color={C.purple}/>
          <KPI icon='📱' label='% Mobile' value={`${devices.length?Math.round(((devices.find(d=>d.device==='mobile')||{}).c||0)/Math.max(total_events,1)*100):0}%`} sub='vs desktop' color={C.amber}/>
        </div>

        <div style={{marginBottom:16}}>
          <SvgLineChart data={daily} keys={['sessions','events']} colors={[C.teal,C.blue]}
            title='📈 Trafic quotidien' subtitle='Sessions uniques et total événements' height={160}/>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
          <Card style={{padding:'24px'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
              <DonutSmall data={devices} nameKey='device' valueKey='c' title='📱 Devices' colors={[C.teal,C.blue,C.amber]}/>
              <DonutSmall data={browsers} nameKey='browser' valueKey='c' title='🌐 Navigateurs' colors={[C.red,C.amber,C.purple,C.blue]}/>
            </div>
          </Card>
          <Card style={{padding:'24px'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
              <DonutSmall data={sources} nameKey='source' valueKey='c' title='🔗 Sources' colors={['#E4405F','#1877F2','#4285F4','#94A3B8','#10B981']}/>
              <DonutSmall data={langs} nameKey='lang' valueKey='c' title='🌍 Langues' colors={[C.teal,C.blue,C.amber]}/>
            </div>
          </Card>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
          <Card style={{padding:'24px'}}>
            <MiniBarH data={searches} nameKey='search_query' valueKey='c' title='🔍 Recherches populaires' color={C.blue}/>
          </Card>
          <Card style={{padding:'24px'}}>
            <MiniBarH data={filters} nameKey='filter_cat' valueKey='c' title='🏷 Filtres utilisés' color={C.amber}/>
          </Card>
        </div>

        <Card style={{padding:'24px'}}>
          <HeatGrid data={hourly} title='🕐 Activité par heure (24h)' />
        </Card>
      </>}

      {/* ── USERS ────────────────────────────────────────── */}
      {section==='users'&&<>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:14,marginBottom:20}}>
          <KPI icon='👤' label='Nouveaux voyageurs' value={new_users_curr} sub={`vs ${new_users_prev} période préc.`} color={C.teal} trend={usrTrend}/>
          <KPI icon='🗺' label='Villes représentées' value={top_cities.length} sub='Couverture géographique' color={C.blue}/>
          <KPI icon='♂' label='Genre dominant' value={gender_stats.length?([...gender_stats].sort((a,b)=>b.c-a.c)[0]?.gender||'—'):'—'} sub='Groupe le plus large' color={C.purple}/>
          <KPI icon='📬' label='Taux réservation' value={new_users_curr>0?`${Math.round((new_bookings_curr/new_users_curr)*100)}%`:'—'} sub='Inscrits → ont réservé' color={C.green}/>
        </div>

        <div style={{marginBottom:16}}>
          <SvgLineChart data={user_growth} keys={['c']} colors={[C.purple]}
            title='👥 Croissance des inscriptions' subtitle='Nouveaux voyageurs par jour' height={150}/>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
          <Card style={{padding:'24px'}}>
            <MiniBarH data={top_cities} nameKey='city' valueKey='c'
              title='📍 Top villes' color={C.blue} maxRows={10}/>
          </Card>
          <Card style={{padding:'24px'}}>
            <div style={{marginBottom:24}}>
              <DonutSmall data={gender_stats} nameKey='gender' valueKey='c'
                title='👥 Répartition par genre' colors={[C.blue,'#EC4899',C.teal]}/>
            </div>
            <div style={{height:1,background:'#F1F5F9',marginBottom:20}}/>
            <div>
              <StatRow label='Nouveaux inscrits' curr={new_users_curr} prev={new_users_prev}/>
              <StatRow label='Nouvelles réservations' curr={new_bookings_curr} prev={new_bookings_prev}/>
              <StatRow label='Revenu période' curr={period_revenue} prev={0} format={fmtDA2} color={C.green}/>
            </div>
          </Card>
        </div>
      </>}
    </div>
  );
}