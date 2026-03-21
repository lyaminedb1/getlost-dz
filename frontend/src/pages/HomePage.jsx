import { useState, useEffect } from 'react'
import { api } from '../api'
import { B, Spin, SectionTitle } from '../utils/styles.jsx'
import OfferCard from '../components/OfferCard'

export default function HomePage({t,setPage,setFilterCat,onOpen,onViewAgency,favIds,toggleFav}){

  const [feat,setFeat]=useState([]);
  useEffect(()=>{api('/offers?sort=rating').then(d=>setFeat(d.slice(0,3))).catch(()=>{});},[]);
  const categories=[
    {k:'intl',bg:'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=400&q=80'},
    {k:'national',bg:'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400&q=80'},
    {k:'hike',bg:'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&q=80'},
    {k:'visa',bg:'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&q=80'},
  ];
  return(
    <div className="page-enter">
      {/* HERO */}
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',background:'linear-gradient(160deg,#E6F9F7 0%,#CCF2EE 35%,#fff 70%)',position:'relative',overflow:'hidden',paddingTop:68}}>
        {/* BG decorations */}
        <div style={{position:'absolute',top:-80,right:-80,width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(13,185,168,.12) 0%,transparent 70%)'}}/>
        <div style={{position:'absolute',bottom:-100,left:-50,width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle,rgba(13,185,168,.08) 0%,transparent 70%)'}}/>
        <div className="hero-grid" style={{maxWidth:1280,margin:'0 auto',padding:'60px 24px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:60,alignItems:'center',width:'100%'}}>
          {/* LEFT */}
          <div className="fade">
            <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'#fff',border:'1px solid var(--teal4)',borderRadius:50,padding:'6px 16px',fontSize:12,fontWeight:600,color:'var(--teal2)',marginBottom:24,boxShadow:'0 2px 12px rgba(13,185,168,.1)'}}>
              {t.heroTag}
            </div>
            <div style={{fontFamily:'Nunito',fontWeight:900,fontSize:'clamp(36px,5vw,62px)',lineHeight:1.1,color:'var(--navy)',marginBottom:20}}>
              {t.heroTitle1}<br/>
              <span style={{background:'linear-gradient(135deg,var(--teal),var(--teal2))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{t.heroTitle2}</span><br/>
              {t.heroTitle3}
            </div>
            <p style={{fontSize:16,color:'var(--muted)',lineHeight:1.8,marginBottom:32,maxWidth:440}}>{t.heroSub}</p>
            <div className="hero-btns" style={{display:'flex',gap:12,flexWrap:'wrap'}}>
              <button style={{...B.pri,fontSize:15,padding:'14px 32px'}} onClick={()=>setPage('trips')}>{t.heroCta}</button>
              <button style={{...B.out,fontSize:15,padding:'13px 32px'}} onClick={()=>setPage('about')}>{t.heroCta2}</button>
            </div>
            {/* Stats */}
            <div className="hero-stats" style={{display:'flex',gap:32,marginTop:44,flexWrap:'wrap'}}>
              {['100K+','1000+','5+','99%'].map((n,i)=>(
                <div key={i}>
                  <div className="stat-num" style={{fontFamily:'Nunito',fontWeight:900,fontSize:26,color:'var(--teal2)',lineHeight:1}}>{n}</div>
                  <div style={{fontSize:11,color:'var(--muted)',fontWeight:600,textTransform:'uppercase',letterSpacing:.8,marginTop:2}}>{t.stats[i]}</div>
                </div>
              ))}
            </div>
          </div>
          {/* RIGHT — Logo hero image */}
          <div className="hero-right fade" style={{display:'flex',justifyContent:'center',alignItems:'center'}}>
            <div style={{position:'relative'}}>
              <div style={{width:420,height:420,borderRadius:'50%',background:'linear-gradient(135deg,var(--teal3),var(--teal4))',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 20px 60px rgba(13,185,168,.2)',animation:'float 5s ease-in-out infinite'}}>
                <img src="/logo-1.png" alt="Get Lost DZ" style={{width:'75%',height:'75%',objectFit:'contain'}}/>
              </div>
              {/* Floating badges */}
              {[{top:-10,right:20,ico:'✈️',txt:'International'},{bottom:30,left:-20,ico:'🏔️',txt:'Aventures'},{top:'45%',right:-30,ico:'⭐',txt:'4.9/5'}].map((b,i)=>(
                <div key={i} style={{position:'absolute',top:b.top,bottom:b.bottom,left:b.left,right:b.right,background:'#fff',borderRadius:14,padding:'10px 16px',boxShadow:'0 8px 24px rgba(11,35,64,.12)',display:'flex',alignItems:'center',gap:8,whiteSpace:'nowrap'}}>
                  <span style={{fontSize:18}}>{b.ico}</span>
                  <span style={{fontWeight:700,fontSize:13,color:'var(--navy)'}}>{b.txt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CATEGORIES */}
      <div style={{background:'#fff',padding:'80px 24px'}}>
        <div style={{maxWidth:1280,margin:'0 auto'}}>
          <SectionTitle center sub="Trouvez le voyage parfait selon vos envies">{t.catTitle}</SectionTitle>
          <div className="cat-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:16}}>
            {categories.map(({k,bg})=>(
              <div key={k} onClick={()=>{setFilterCat(k);setPage('trips');}}
                style={{position:'relative',borderRadius:20,overflow:'hidden',cursor:'pointer',height:180,transition:'transform .25s'}}
                onMouseEnter={e=>e.currentTarget.style.transform='translateY(-4px) scale(1.01)'}
                onMouseLeave={e=>e.currentTarget.style.transform='none'}>
                <img src={bg} alt={k} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(11,35,64,.75) 0%,rgba(11,35,64,.2) 60%,transparent 100%)'}}/>
                <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'16px 20px'}}>
                  <div style={{fontSize:24,marginBottom:4}}>{t.catIco[k]}</div>
                  <div style={{fontFamily:'Nunito',fontWeight:800,fontSize:16,color:'#fff'}}>{t.cats[k]}</div>
                  <div style={{fontSize:12,color:'rgba(255,255,255,.7)',fontWeight:500}}>{t.catDesc[k]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FEATURED */}
      <div style={{background:'var(--offwhite)',padding:'80px 24px'}}>
        <div style={{maxWidth:1280,margin:'0 auto'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:40,flexWrap:'wrap',gap:16}}>
            <SectionTitle sub="Nos voyages les mieux notés par la communauté">{t.featTitle}</SectionTitle>
            <button style={{...B.out,marginTop:8}} onClick={()=>setPage('trips')}>{t.seeAll} →</button>
          </div>
          {feat.length===0?<Spin/>:(
            <div className="offer-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:20}}>
              {feat.map(o=><OfferCard key={o.id} offer={o} t={t} onOpen={onOpen} onViewAgency={onViewAgency} isFav={favIds?.includes(o.id)} onToggleFav={toggleFav}/>)}
            </div>
          )}
        </div>
      </div>

      {/* TRUST BAND */}
      <div style={{background:'linear-gradient(135deg,var(--navy),var(--navy2))',padding:'72px 24px'}}>
        <div style={{maxWidth:1100,margin:'0 auto',textAlign:'center'}}>
          <img src="/logo-1.png" alt="Get Lost DZ" style={{height:80,marginBottom:20,filter:'brightness(0) invert(1) sepia(1) saturate(3) hue-rotate(140deg)'}}
            onError={e=>e.target.style.display='none'}/>
          <div style={{fontFamily:'Nunito',fontWeight:900,fontSize:28,color:'#fff',marginBottom:12}}>Pourquoi choisir Get Lost DZ ?</div>
          <p style={{color:'rgba(255,255,255,.65)',maxWidth:540,margin:'0 auto 32px',lineHeight:1.8}}>Chaque offre est validée par notre équipe. Qualité, sécurité et authenticité garanties.</p>
          <div style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap'}}>
            {['✅ Offres validées','⭐ Avis vérifiés','🤝 Agences certifiées','🌍 100K communauté'].map(x=>(
              <div key={x} style={{background:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.15)',borderRadius:50,padding:'10px 20px',fontSize:13,fontWeight:600,color:'rgba(255,255,255,.9)'}}>{x}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

}