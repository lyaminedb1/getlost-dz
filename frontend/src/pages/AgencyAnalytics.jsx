import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../context/ToastContext"
import { api } from "../api"
import { B, INP, TA, TH, TD, Card, Spin, Badge, Stars, SectionTitle, BOOKING_STATUSES, BSTATUS_MAP } from "../utils/styles.jsx"
import SvgLineChart from "../components/charts/SvgLineChart"
import MiniBarH from "../components/charts/MiniBarH"

export default function AgencyAnalyticsPage({t,openAuth}){

  const {user} = useAuth();
  const {show} = useToast();
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user || user.role !== 'agency' || !user.agencyId) return;
    setLoading(true);
    try {
      const d = await api(`/agencies/${user.agencyId}/analytics?days=${days}`);
      setData(d);
    } catch(e) { show(e.message, 'err'); }
    setLoading(false);
  }, [user, days]);

  useEffect(() => { load(); }, [load]);

  if (!user || user.role !== 'agency') return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F8FAFC',paddingTop:68}}>
      <Card style={{padding:'48px 40px',textAlign:'center',maxWidth:380}}>
        <div style={{fontSize:48,marginBottom:16}}>📊</div>
        <div style={{fontFamily:'Nunito',fontWeight:900,fontSize:20,color:'var(--navy)',marginBottom:8}}>Espace Agence uniquement</div>
        <button style={{...B.pri,width:'100%',marginTop:16}} onClick={()=>openAuth('login')}>{t.navLogin}</button>
      </Card>
    </div>
  );

  const { daily=[], top_offers=[], funnel={offer_views:0,booking_started:0,booking_done:0} } = data || {};

  // Compute stats
  const totalViews = funnel.offer_views || 0;
  const totalBookingsDone = funnel.booking_done || 0;
  const convRate = totalViews > 0 ? ((totalBookingsDone / totalViews) * 100).toFixed(1) : '0.0';
  const peakDay = daily.length > 0 ? daily.reduce((a,b) => (b.sessions||0) > (a.sessions||0) ? b : a, daily[0]) : null;
  const totalSessions = daily.reduce((s,d) => s + (d.sessions||0), 0);

  // Mini sparkline path for line chart
  function sparkPath(arr, key, W=180, H=48) {
    if (!arr || arr.length < 2) return '';
    const max = Math.max(...arr.map(d=>d[key]||0), 1);
    return arr.map((d,i) => {
      const x = (i/(arr.length-1)) * W;
      const y = H - ((d[key]||0)/max) * H;
      return `${i===0?'M':'L'}${x},${y}`;
    }).join(' ');
  }

  // Color palette
  const C = {
    teal: '#0DB9A8', navy: '#0B2340', accent: '#FF6B6B',
    blue: '#3B82F6', amber: '#F59E0B', green: '#10B981',
    purple: '#8B5CF6', bg: '#F0FDF9', card: '#fff',
    muted: '#64748B', border: '#E2E8F0'
  };

  const KPICard = ({icon, label, value, sub, color, spark}) => (
    <div style={{
      background: C.card, borderRadius: 20,
      padding: '24px 28px', boxShadow: '0 2px 20px rgba(11,35,64,.07)',
      border: `1px solid ${C.border}`, position: 'relative', overflow: 'hidden',
      transition: 'transform .2s, box-shadow .2s',
    }}
    onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 8px 32px rgba(11,35,64,.12)';}}
    onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='0 2px 20px rgba(11,35,64,.07)';}}>
      <div style={{position:'absolute',top:0,right:0,width:80,height:80,borderRadius:'0 20px 0 80px',background:`${color}15`}}/>
      <div style={{fontSize:28,marginBottom:12}}>{icon}</div>
      <div style={{fontFamily:'Nunito',fontWeight:900,fontSize:34,color:color,lineHeight:1,marginBottom:4}}>{value}</div>
      <div style={{fontWeight:700,fontSize:13,color:C.navy,marginBottom:2}}>{label}</div>
      {sub && <div style={{fontSize:11,color:C.muted,fontWeight:500}}>{sub}</div>}
      {spark && daily.length>1 && (
        <svg viewBox={`0 0 180 48`} style={{width:'100%',height:40,marginTop:12,opacity:.6}}>
          <path d={sparkPath(daily, spark)} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d={sparkPath(daily, spark)+'L180,48L0,48Z'} fill={`${color}20`}/>
        </svg>
      )}
    </div>
  );

  const maxSessions = Math.max(...daily.map(d=>d.sessions||0), 1);
  const maxEvents = Math.max(...daily.map(d=>d.events||0), 1);
  const maxOfferViews = Math.max(...top_offers.map(o=>o.views||0), 1);

  return (
    <div style={{background:'#F0FDF9',minHeight:'100vh',paddingTop:68}}>
      {/* Header */}
      <div style={{background:`linear-gradient(135deg, ${C.navy} 0%, #1a3a5c 50%, #0a4a3a 100%)`,padding:'40px 32px 48px',position:'relative',overflow:'hidden'}}>
        {/* Decorative circles */}
        <div style={{position:'absolute',top:-60,right:-60,width:240,height:240,borderRadius:'50%',background:'rgba(13,185,168,.12)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',bottom:-40,left:-40,width:180,height:180,borderRadius:'50%',background:'rgba(13,185,168,.08)',pointerEvents:'none'}}/>
        <div style={{maxWidth:1200,margin:'0 auto',position:'relative'}}>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:16}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
                <div style={{width:44,height:44,borderRadius:14,background:'rgba(13,185,168,.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>📊</div>
                <div>
                  <div style={{fontFamily:'Nunito',fontWeight:900,fontSize:26,color:'#fff',lineHeight:1}}>Analytics</div>
                  <div style={{color:'rgba(255,255,255,.55)',fontSize:12,fontWeight:500,marginTop:2}}>{user.name} · Agence</div>
                </div>
              </div>
              <p style={{color:'rgba(255,255,255,.65)',fontSize:13,margin:'8px 0 0',fontWeight:400,maxWidth:480}}>
                Suivez les performances de vos offres en temps réel.
              </p>
            </div>
            {/* Period selector */}
            <div style={{display:'flex',gap:6,background:'rgba(255,255,255,.08)',borderRadius:50,padding:'5px'}}>
              {[[7,'7j'],[30,'30j'],[90,'90j']].map(([d,l])=>(
                <button key={d} onClick={()=>setDays(d)} style={{
                  padding:'7px 18px',borderRadius:50,fontSize:12,fontWeight:700,cursor:'pointer',border:'none',
                  background:days===d?C.teal:'transparent',
                  color:days===d?'#fff':'rgba(255,255,255,.6)',
                  transition:'all .2s'
                }}>{l}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{maxWidth:1200,margin:'0 auto',padding:'32px 24px 80px'}}>
        {loading ? (
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:300,gap:12}}>
            <div style={{width:36,height:36,borderRadius:'50%',border:`3px solid ${C.teal}`,borderTopColor:'transparent',animation:'spin 1s linear infinite'}}/>
            <span style={{color:C.muted,fontWeight:600}}>Chargement des données…</span>
          </div>
        ) : (
          <>
            {/* KPI Row */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:16,marginBottom:28}}>
              <KPICard icon="👁" label="Vues des offres" value={totalViews.toLocaleString()}
                sub={`${days} derniers jours`} color={C.teal} spark="sessions"/>
              <KPICard icon="👥" label="Sessions uniques" value={totalSessions.toLocaleString()}
                sub={peakDay?`Pic: ${peakDay.day?.slice(5)||'—'}`:'Aucune session'} color={C.blue}/>
              <KPICard icon="🎫" label="Réservations" value={totalBookingsDone}
                sub="Voyages confirmés" color={C.green}/>
              <KPICard icon="📈" label="Taux conversion" value={`${convRate}%`}
                sub="Vues → Réservations" color={convRate>5?C.green:convRate>2?C.amber:C.accent}/>
            </div>

            {/* Main grid */}
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:20,marginBottom:20}}>

              {/* Traffic chart */}
              <div style={{background:C.card,borderRadius:20,padding:'28px',boxShadow:'0 2px 20px rgba(11,35,64,.07)',border:`1px solid ${C.border}`}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
                  <div>
                    <div style={{fontFamily:'Nunito',fontWeight:800,fontSize:16,color:C.navy}}>📈 Trafic quotidien</div>
                    <div style={{fontSize:11,color:C.muted,marginTop:2}}>Sessions et événements sur la période</div>
                  </div>
                  <div style={{display:'flex',gap:16,fontSize:11}}>
                    <span style={{display:'flex',alignItems:'center',gap:5,color:C.muted,fontWeight:600}}>
                      <span style={{width:20,height:3,borderRadius:3,background:C.teal,display:'inline-block'}}/>Sessions
                    </span>
                    <span style={{display:'flex',alignItems:'center',gap:5,color:C.muted,fontWeight:600}}>
                      <span style={{width:20,height:3,borderRadius:3,background:`${C.blue}80`,display:'inline-block'}}/>Événements
                    </span>
                  </div>
                </div>
                {daily.length < 2 ? (
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:160,gap:8}}>
                    <div style={{fontSize:36}}>📭</div>
                    <div style={{color:C.muted,fontWeight:600,fontSize:13}}>Les données apparaîtront dès les premières visites</div>
                  </div>
                ) : (
                  <div style={{overflowX:'auto'}}>
                    <svg viewBox="0 0 640 160" style={{width:'100%',minWidth:300,height:160}}>
                      {/* Grid lines */}
                      {[0,.25,.5,.75,1].map(f=>(
                        <line key={f} x1="40" y1={20+f*120} x2="630" y2={20+f*120}
                          stroke={C.border} strokeWidth="1" strokeDasharray={f===0?'0':'4,4'}/>
                      ))}
                      {/* Sessions area */}
                      <path d={(() => {
                        const pts = daily.map((d,i)=>{
                          const x=40+(i/(daily.length-1))*590;
                          const y=20+((1-(d.sessions||0)/maxSessions)*120);
                          return `${i===0?'M':'L'}${x},${y}`;
                        }).join(' ');
                        return pts+`L${40+590},140L40,140Z`;
                      })()} fill={`${C.teal}18`}/>
                      <path d={daily.map((d,i)=>{
                        const x=40+(i/(daily.length-1))*590;
                        const y=20+((1-(d.sessions||0)/maxSessions)*120);
                        return `${i===0?'M':'L'}${x},${y}`;
                      }).join(' ')} fill="none" stroke={C.teal} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      {/* Events line */}
                      <path d={daily.map((d,i)=>{
                        const x=40+(i/(daily.length-1))*590;
                        const y=20+((1-(d.events||0)/maxEvents)*120);
                        return `${i===0?'M':'L'}${x},${y}`;
                      }).join(' ')} fill="none" stroke={`${C.blue}80`} strokeWidth="1.5" strokeDasharray="6,3" strokeLinecap="round"/>
                      {/* Dots + x-axis labels */}
                      {daily.map((d,i)=>{
                        const x=40+(i/(daily.length-1))*590;
                        const y=20+((1-(d.sessions||0)/maxSessions)*120);
                        const showLabel = i===0||i===daily.length-1||i%Math.ceil(daily.length/6)===0;
                        return (
                          <g key={i}>
                            <circle cx={x} cy={y} r="4" fill={C.teal} opacity=".9"/>
                            {showLabel&&<text x={x} y="155" textAnchor="middle" fontSize="9" fill={C.muted}>{(d.day||'').slice(5)}</text>}
                          </g>
                        );
                      })}
                      {/* Y axis labels */}
                      <text x="35" y="24" textAnchor="end" fontSize="9" fill={C.muted}>{maxSessions}</text>
                      <text x="35" y="140" textAnchor="end" fontSize="9" fill={C.muted}>0</text>
                    </svg>
                  </div>
                )}
              </div>

              {/* Funnel */}
              <div style={{background:C.card,borderRadius:20,padding:'28px',boxShadow:'0 2px 20px rgba(11,35,64,.07)',border:`1px solid ${C.border}`}}>
                <div style={{fontFamily:'Nunito',fontWeight:800,fontSize:16,color:C.navy,marginBottom:6}}>🔽 Funnel</div>
                <div style={{fontSize:11,color:C.muted,marginBottom:24}}>Taux de conversion étape par étape</div>
                {[
                  {label:'Vues',val:funnel.offer_views,color:C.teal,icon:'👁'},
                  {label:'Démarrées',val:funnel.booking_started,color:C.blue,icon:'🖱'},
                  {label:'Confirmées',val:funnel.booking_done,color:C.green,icon:'✅'},
                ].map((s,i,arr)=>{
                  const prev = i>0?arr[i-1].val:null;
                  const pct = (funnel.offer_views||1)>0 ? Math.round((s.val/(funnel.offer_views||1))*100) : 0;
                  const step = prev&&prev>0 ? Math.round((s.val/prev)*100) : null;
                  return (
                    <div key={i} style={{marginBottom:i<2?20:0}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                        <span style={{fontSize:13,fontWeight:700,color:C.navy}}>{s.icon} {s.label}</span>
                        <div style={{textAlign:'right'}}>
                          <span style={{fontSize:16,fontWeight:900,color:s.color,fontFamily:'Nunito'}}>{s.val}</span>
                          {step!==null&&<div style={{fontSize:10,color:C.muted,fontWeight:600}}>{step}% du précédent</div>}
                        </div>
                      </div>
                      <div style={{background:'#F1F5F9',borderRadius:8,height:10,overflow:'hidden'}}>
                        <div style={{height:'100%',borderRadius:8,background:`linear-gradient(90deg,${s.color},${s.color}cc)`,width:`${pct}%`,transition:'width .8s cubic-bezier(.4,0,.2,1)'}}/>
                      </div>
                      {i<2&&<div style={{display:'flex',justifyContent:'center',marginTop:8}}>
                        <div style={{width:1,height:12,background:C.border}}/>
                      </div>}
                    </div>
                  );
                })}
                <div style={{marginTop:24,padding:'14px 16px',background:`${C.teal}12`,borderRadius:12,border:`1px solid ${C.teal}30`}}>
                  <div style={{fontSize:11,color:C.muted,fontWeight:600,marginBottom:2}}>Taux global</div>
                  <div style={{fontFamily:'Nunito',fontWeight:900,fontSize:22,color:C.teal}}>{convRate}%</div>
                  <div style={{fontSize:10,color:C.muted}}>vues → réservations confirmées</div>
                </div>
              </div>
            </div>

            {/* Top Offers */}
            <div style={{background:C.card,borderRadius:20,padding:'28px',boxShadow:'0 2px 20px rgba(11,35,64,.07)',border:`1px solid ${C.border}`,marginBottom:20}}>
              <div style={{fontFamily:'Nunito',fontWeight:800,fontSize:16,color:C.navy,marginBottom:6}}>🏆 Performance des offres</div>
              <div style={{fontSize:11,color:C.muted,marginBottom:24}}>Classement par nombre de vues sur la période</div>
              {top_offers.length === 0 ? (
                <div style={{textAlign:'center',padding:'40px 0',color:C.muted}}>
                  <div style={{fontSize:36,marginBottom:8}}>📭</div>
                  <div style={{fontWeight:600,fontSize:13}}>Aucune donnée pour l'instant</div>
                </div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  {top_offers.map((o,i)=>{
                    const conv = o.views>0?Math.round((o.bookings_done/o.views)*100):0;
                    const w = Math.round((o.views/maxOfferViews)*100);
                    const medals = ['🥇','🥈','🥉'];
                    return (
                      <div key={o.id} style={{display:'grid',gridTemplateColumns:'28px 1fr 80px 80px 80px',gap:12,alignItems:'center'}}>
                        <div style={{fontFamily:'Nunito',fontWeight:900,fontSize:16,textAlign:'center'}}>
                          {i<3 ? medals[i] : <span style={{color:C.muted,fontSize:12}}>#{i+1}</span>}
                        </div>
                        <div>
                          <div style={{fontWeight:700,fontSize:13,color:C.navy,marginBottom:4,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:260}}>{o.title}</div>
                          <div style={{background:'#F1F5F9',borderRadius:6,height:7,overflow:'hidden'}}>
                            <div style={{height:'100%',borderRadius:6,background:`linear-gradient(90deg,${C.teal},${C.blue})`,width:`${w}%`,transition:'width .8s'}}/>
                          </div>
                        </div>
                        <div style={{textAlign:'center'}}>
                          <div style={{fontFamily:'Nunito',fontWeight:900,fontSize:16,color:C.navy}}>{o.views}</div>
                          <div style={{fontSize:10,color:C.muted,fontWeight:600}}>VUES</div>
                        </div>
                        <div style={{textAlign:'center'}}>
                          <div style={{fontFamily:'Nunito',fontWeight:900,fontSize:16,color:C.blue}}>{o.bookings_started||0}</div>
                          <div style={{fontSize:10,color:C.muted,fontWeight:600}}>DÉMARRÉES</div>
                        </div>
                        <div style={{textAlign:'center'}}>
                          <div style={{fontFamily:'Nunito',fontWeight:900,fontSize:16,color:conv>5?C.green:C.muted}}>{conv}%</div>
                          <div style={{fontSize:10,color:C.muted,fontWeight:600}}>CONV.</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Empty state hint */}
            {totalViews === 0 && (
              <div style={{background:`linear-gradient(135deg,${C.teal}10,${C.blue}10)`,borderRadius:20,padding:'32px',border:`1px dashed ${C.teal}50`,textAlign:'center'}}>
                <div style={{fontSize:48,marginBottom:12}}>🚀</div>
                <div style={{fontFamily:'Nunito',fontWeight:900,fontSize:18,color:C.navy,marginBottom:8}}>Les données arrivent !</div>
                <p style={{color:C.muted,fontSize:13,maxWidth:400,margin:'0 auto',lineHeight:1.7}}>
                  Les statistiques s'afficheront dès que des visiteurs consulteront vos offres. Partagez vos offres sur Instagram pour accélérer !
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}