import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { B } from '../utils/styles.jsx'

export default function Navbar({page,setPage,lang,setLang,openAuth,t}){
  const {user,logout}=useAuth()
  const {show}=useToast()
  const [scroll,setScroll]=useState(false)
  const [menuOpen,setMenuOpen]=useState(false)
  useEffect(()=>{const h=()=>setScroll(window.scrollY>30);window.addEventListener('scroll',h);return()=>window.removeEventListener('scroll',h);},[])
  const nl=(pg)=>({padding:'8px 16px',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',border:'none',background:page===pg?'var(--teal3)':'transparent',color:page===pg?'var(--teal2)':'var(--navy)',transition:'all .18s'})
  const navTo=(pg)=>{setPage(pg);setMenuOpen(false)}
  return(
    <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:300,background:'rgba(255,255,255,.97)',backdropFilter:'blur(20px)',borderBottom:scroll?'1px solid #E8F0F2':'1px solid transparent',boxShadow:scroll?'var(--shadow)':'none',transition:'all .3s'}}>
      <div style={{maxWidth:1280,margin:'0 auto',padding:'0 20px',height:68,display:'flex',alignItems:'center',justifyContent:'space-between',direction:lang==='ar'?'rtl':'ltr'}}>
        <div style={{cursor:'pointer',display:'flex',alignItems:'center'}} onClick={()=>navTo('home')}>
          <img src="/logo-1.png" alt="Get Lost DZ" style={{height:44,width:'auto',objectFit:'contain'}}
            onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex'}}/>
          <div style={{display:'none',alignItems:'center',gap:8}}>
            <div style={{fontFamily:'Nunito',fontWeight:900,fontSize:18,color:'var(--teal2)'}}>Get Lost DZ</div>
          </div>
        </div>
        <div className="nav-links" style={{display:'flex',gap:4,alignItems:'center'}}>
          <button style={nl('home')} onClick={()=>navTo('home')}>{t.navHome}</button>
          <button style={nl('trips')} onClick={()=>navTo('trips')}>{t.navTrips}</button>
          <button style={nl('about')} onClick={()=>navTo('about')}>{t.navAbout}</button>
          {user&&<button style={nl('dash')} onClick={()=>navTo('dash')}>{t.navDash}</button>}
          {user?.role==='agency'&&<button style={nl('analytics')} onClick={()=>navTo('analytics')}>📊 {t.navAnalytics}</button>}
          {user?.role==='admin'&&<button style={nl('admin')} onClick={()=>navTo('admin')}>{t.navAdmin}</button>}
        </div>
        <div className="nav-right-desktop" style={{display:'flex',gap:8,alignItems:'center'}}>
          <div style={{display:'flex',gap:2,background:'#F0F4F5',borderRadius:8,padding:3}}>
            {['fr','en','ar'].map(l=>(
              <button key={l} style={{padding:'4px 10px',borderRadius:6,fontSize:11,fontWeight:700,border:'none',cursor:'pointer',background:lang===l?'var(--teal)':'transparent',color:lang===l?'#fff':'var(--muted)',transition:'all .18s'}} onClick={()=>setLang(l)}>{l.toUpperCase()}</button>
            ))}
          </div>
          {user?(
            <>
              <div style={{display:'flex',alignItems:'center',gap:8,background:'var(--teal3)',borderRadius:50,padding:'5px 14px 5px 5px',cursor:'pointer'}} onClick={()=>navTo('dash')}>
                <div style={{width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,var(--teal),var(--teal2))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:'#fff',overflow:'hidden',flexShrink:0}}>
                  {user.avatar?<img src={user.avatar} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:user.name[0].toUpperCase()}
                </div>
                <span style={{fontSize:13,fontWeight:700,color:'var(--teal2)'}}>{user.name.split(' ')[0]}</span>
              </div>
              <button style={{...B.ghost,padding:'8px 16px',fontSize:13}} onClick={()=>{logout();setPage('home');show('À bientôt !')}}>{t.navLogout}</button>
            </>
          ):(
            <>
              <button style={{...B.ghost,padding:'8px 18px',fontSize:13}} onClick={()=>openAuth('login')}>{t.navLogin}</button>
              <button style={{...B.pri,padding:'8px 20px',fontSize:13}} onClick={()=>openAuth('register')}>{t.navReg}</button>
            </>
          )}
        </div>
        <button className="hamburger-btn" onClick={()=>setMenuOpen(o=>!o)}
          style={{display:'none',alignItems:'center',justifyContent:'center',width:40,height:40,borderRadius:10,border:'1.5px solid #E2EBF0',background:'#fff',cursor:'pointer',fontSize:20,color:'var(--navy)',flexShrink:0}}>
          {menuOpen?'✕':'☰'}
        </button>
      </div>
      {menuOpen&&(
        <div className="mobile-menu-open" style={{flexDirection:'column',background:'rgba(255,255,255,.98)',backdropFilter:'blur(20px)',borderTop:'1px solid #E8F0F2',padding:'10px 16px 18px',gap:4,boxShadow:'0 12px 32px rgba(11,35,64,.1)'}}>
          {[
            ['home',t.navHome,'��'],['trips',t.navTrips,'✈️'],['about',t.navAbout,'ℹ️'],
            ...(user?[['dash',t.navDash,'👤']]:[]),
            ...(user?.role==='agency'?[['analytics','📊 '+t.navAnalytics,'📊']]:[]),
            ...(user?.role==='admin'?[['admin',t.navAdmin,'🛡️']]:[])
          ].map(([pg,label,ico])=>(
            <button key={pg} onClick={()=>navTo(pg)}
              style={{padding:'11px 14px',borderRadius:10,fontSize:14,fontWeight:600,border:'none',textAlign:'left',cursor:'pointer',background:page===pg?'var(--teal3)':'transparent',color:page===pg?'var(--teal2)':'var(--navy)',transition:'all .15s',width:'100%'}}>
              {ico} {label}
            </button>
          ))}
          <div style={{height:1,background:'#E8F0F2',margin:'6px 0'}}/>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
            <div style={{display:'flex',gap:3,background:'#F0F4F5',borderRadius:8,padding:3}}>
              {['fr','en','ar'].map(l=>(
                <button key={l} style={{padding:'5px 10px',borderRadius:6,fontSize:11,fontWeight:700,border:'none',cursor:'pointer',background:lang===l?'var(--teal)':'transparent',color:lang===l?'#fff':'var(--muted)',transition:'all .18s'}} onClick={()=>setLang(l)}>{l.toUpperCase()}</button>
              ))}
            </div>
            {user?(
              <button style={{...B.ghost,padding:'8px 14px',fontSize:13}} onClick={()=>{logout();setPage('home');setMenuOpen(false);show('À bientôt !')}}>{t.navLogout}</button>
            ):(
              <div style={{display:'flex',gap:6}}>
                <button style={{...B.ghost,padding:'7px 14px',fontSize:12}} onClick={()=>{openAuth('login');setMenuOpen(false)}}>{t.navLogin}</button>
                <button style={{...B.pri,padding:'7px 14px',fontSize:12}} onClick={()=>{openAuth('register');setMenuOpen(false)}}>{t.navReg}</button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
