import { B, SectionTitle, Card } from "../utils/styles.jsx"

export default function AboutPage({t}){

  return(
    <div style={{background:'#fff',paddingTop:68}}>
      {/* Hero */}
      <div style={{background:'linear-gradient(160deg,var(--teal3) 0%,var(--teal4) 40%,#fff 80%)',padding:'80px 24px 60px'}}>
        <div style={{maxWidth:900,margin:'0 auto',textAlign:'center'}}>
          <img src="/logo-1.png" alt="Get Lost DZ" style={{height:100,marginBottom:24}}/>
          <div style={{fontFamily:'Nunito',fontWeight:900,fontSize:'clamp(28px,4vw,44px)',color:'var(--navy)',marginBottom:16}}>{t.aboutTitle}</div>
          <p style={{color:'var(--muted)',fontSize:16,lineHeight:1.9,maxWidth:640,margin:'0 auto'}}>{t.ap1}</p>
        </div>
      </div>
      <div style={{maxWidth:1100,margin:'0 auto',padding:'60px 24px'}}>
        {/* Story */}
        <div className="about-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:60,alignItems:'center',marginBottom:72}}>
          <div>
            <SectionTitle>Notre communauté</SectionTitle>
            <p style={{color:'var(--muted)',lineHeight:1.9,fontSize:15,marginBottom:16}}>{t.ap2}</p>
            <p style={{color:'var(--muted)',lineHeight:1.9,fontSize:15}}>{t.ap3}</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            {['100K+\nInstagram','1000+\nVoyages','3+\nDestinations','99%\nSatisfaction'].map((s,i)=>{
              const [n,l]=s.split('\n');
              return <Card key={i} style={{padding:'24px 20px',textAlign:'center'}}>
                <div style={{fontFamily:'Nunito',fontWeight:900,fontSize:28,color:'var(--teal2)'}}>{n}</div>
                <div style={{color:'var(--muted)',fontSize:12,fontWeight:600,textTransform:'uppercase',letterSpacing:.8,marginTop:4}}>{l}</div>
              </Card>;
            })}
          </div>
        </div>
        {/* Values */}
        <SectionTitle center sub="Ce qui nous différencie">Nos valeurs</SectionTitle>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:20,marginBottom:60}}>
          {t.vals.map(({i,t:title,d})=>(
            <Card key={title} style={{padding:'28px 24px',transition:'all .25s'}}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.boxShadow='0 16px 40px rgba(13,185,168,.15)';}}
              onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='var(--shadow)';}}>
              <div style={{width:48,height:48,borderRadius:14,background:'var(--teal3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,marginBottom:16}}>{i}</div>
              <div style={{fontFamily:'Nunito',fontWeight:800,fontSize:16,color:'var(--navy)',marginBottom:8}}>{title}</div>
              <div style={{color:'var(--muted)',fontSize:13,lineHeight:1.7}}>{d}</div>
            </Card>
          ))}
        </div>
        {/* Social CTA */}
        <Card style={{background:'linear-gradient(135deg,var(--navy),var(--navy2))',border:'none',padding:'48px',textAlign:'center'}}>
          <div style={{fontSize:40,marginBottom:14}}>📱</div>
          <div style={{fontFamily:'Nunito',fontWeight:900,fontSize:24,color:'#fff',marginBottom:10}}>Suivez-nous sur les réseaux</div>
          <p style={{color:'rgba(255,255,255,.6)',marginBottom:24,fontSize:14}}>100k+ voyageurs nous font confiance sur Instagram</p>
          <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
            {[
                {ico:'📸',lbl:'Instagram',url:'https://www.instagram.com/get_lost_dz/'},
                {ico:'🔗',lbl:'Link Tree',url:'https://www.hopp.bio/get-lost'},
              ].map(({ico,lbl,url})=>(
              <a key={lbl} href={url} target="_blank" rel="noopener noreferrer" style={{...B.white,fontSize:13,padding:'9px 20px',textDecoration:'none',display:'inline-block'}}>{ico} {lbl}</a>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}