export default function Footer({t,setPage}){
  return(
    <footer style={{background:'var(--navy)',padding:'52px 24px 24px'}}>
      <div style={{maxWidth:1280,margin:'0 auto'}}>
        <div className="footer-grid" style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:40,marginBottom:40}}>
          <div>
            <img src="/logo-1.png" alt="Get Lost DZ" style={{height:52,marginBottom:16,filter:'brightness(0) invert(1) sepia(1) saturate(2) hue-rotate(140deg)'}}
              onError={e=>e.target.style.display='none'}/>
            <p style={{color:'rgba(255,255,255,.5)',fontSize:13,lineHeight:1.8,maxWidth:240}}>La référence du tourisme expérientiel en Algérie.</p>
          </div>
          {[['Navigation',[[t.navHome,'home',null],[t.navTrips,'trips',null],[t.navAbout,'about',null]]],['Contact',[['📧 getlost.dz@gmail.com',null,null],['📱 +213 782 8292 46',null,null],['📍 Alger, Algérie',null,null]]],['Réseaux',[['📸 Instagram',null,'https://www.instagram.com/get_lost_dz/'],['🔗 Linktree',null,'https://www.hopp.bio/get-lost'],['📘 Facebook',null,'https://www.facebook.com/getlostdz']]]]
          .map(([title,links])=>(
            <div key={title}>
              <div style={{fontFamily:'Nunito',fontWeight:800,fontSize:12,textTransform:'uppercase',letterSpacing:1.5,color:'var(--teal)',marginBottom:16}}>{title}</div>
              {links.map(([lbl,pg,url])=>{
                if(url) return(<a key={lbl} href={url} target="_blank" rel="noopener noreferrer" style={{color:'rgba(255,255,255,.5)',fontSize:13,marginBottom:9,display:'block',textDecoration:'none',transition:'color .18s'}} onMouseEnter={e=>e.target.style.color='rgba(255,255,255,.9)'} onMouseLeave={e=>e.target.style.color='rgba(255,255,255,.5)'}>{lbl}</a>)
                return(<div key={lbl} onClick={()=>pg&&setPage(pg)} style={{color:'rgba(255,255,255,.5)',fontSize:13,marginBottom:9,cursor:pg?'pointer':'default',transition:'color .18s'}} onMouseEnter={e=>{if(pg)e.target.style.color='rgba(255,255,255,.9)'}} onMouseLeave={e=>{if(pg)e.target.style.color='rgba(255,255,255,.5)'}}>{lbl}</div>)
              })}
            </div>
          ))}
        </div>
        <div style={{borderTop:'1px solid rgba(255,255,255,.08)',paddingTop:20,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
          <span style={{color:'rgba(255,255,255,.3)',fontSize:12}}>© {new Date().getFullYear()} Get Lost DZ — Tous droits réservés</span>
          <div style={{display:'flex',gap:16}}>{['Mentions légales','CGU','FAQ'].map(l=><span key={l} style={{color:'rgba(255,255,255,.3)',fontSize:12,cursor:'pointer'}}>{l}</span>)}</div>
        </div>
      </div>
    </footer>
  )
}
