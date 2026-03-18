import { useState, useEffect, useCallback } from "react"
import { api } from "../api"
import { B, INP, Spin, SectionTitle } from "../utils/styles.jsx"
import { track } from "../utils/analytics"
import OfferCard from "../components/OfferCard"

export default function TripsPage({t,filterCat,setFilterCat,onOpen}){

  const [offers,setOffers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState('');
  const [sort,setSort]=useState('rating');
  const [debSearch,setDebSearch]=useState('');
  useEffect(()=>{const tm=setTimeout(()=>setDebSearch(search),400);return()=>clearTimeout(tm);},[search]);
  useEffect(()=>{
    setLoading(true);
    const p=new URLSearchParams({sort});
    if(filterCat&&filterCat!=='all')p.set('category',filterCat);
    if(debSearch)p.set('search',debSearch);
    api(`/offers?${p}`).then(d=>{setOffers(d);setLoading(false);}).catch(()=>setLoading(false));
  },[filterCat,sort,debSearch]);
  useEffect(()=>{if(debSearch)track('search',{search_query:debSearch});},[debSearch]);
  return(
    <div style={{background:'var(--offwhite)',minHeight:'100vh',paddingTop:68}}>
      {/* Header band */}
      <div style={{background:'linear-gradient(135deg,var(--teal3),var(--teal4))',padding:'48px 24px 36px'}}>
        <div style={{maxWidth:1280,margin:'0 auto'}}>
          <div style={{fontFamily:'Nunito',fontWeight:900,fontSize:'clamp(24px,4vw,38px)',color:'var(--navy)',marginBottom:6}}>Nos Voyages</div>
          <p style={{color:'var(--muted)',fontSize:15}}>Découvrez toutes nos offres — Algérie, Afrique, Asie et plus.</p>
          {/* Search + Sort */}
          <div style={{display:'flex',gap:10,marginTop:24,flexWrap:'wrap'}}>
            <div style={{position:'relative',flex:1,minWidth:240}}>
              <span style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',fontSize:16}}>🔍</span>
              <input style={{...INP,paddingLeft:42,marginBottom:0,borderRadius:50,boxShadow:'var(--shadow)'}} placeholder={t.srchPh} value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <select style={{...INP,width:'auto',marginBottom:0,borderRadius:50,paddingLeft:16,background:'#fff',cursor:'pointer',boxShadow:'var(--shadow)'}} value={sort} onChange={e=>setSort(e.target.value)}>
              {t.sorts.map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>
      </div>
      <div style={{maxWidth:1280,margin:'0 auto',padding:'28px 24px 60px'}}>
        {/* Category filters — FIX 2: horizontal scroll on mobile */}
        <div className="cat-filters" style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:28}}>
          {['all','intl','national','hike','visa'].map(c=>(
            <button key={c} style={{padding:'8px 20px',borderRadius:50,cursor:'pointer',fontSize:13,fontWeight:700,border:'none',background:filterCat===c?'var(--teal)':'#fff',color:filterCat===c?'#fff':'var(--text)',boxShadow:filterCat===c?'0 4px 14px rgba(13,185,168,.3)':'var(--shadow)',transition:'all .2s'}}
              onClick={()=>{setFilterCat(c);if(c!=='all')track('filter_used',{filter_cat:c});}}>{t.catIco[c]||'🌍'} {t.cats[c]||c}</button>
          ))}
        </div>
        {loading?<Spin/>:offers.length===0
          ?<div style={{textAlign:'center',padding:'60px 0',color:'var(--muted)'}}>
            <div style={{fontSize:48,marginBottom:12}}>🔍</div>
            <div style={{fontFamily:'Nunito',fontWeight:700,fontSize:18,marginBottom:6}}>Aucune offre trouvée</div>
            <div style={{fontSize:14}}>Essayez une autre recherche</div>
          </div>
          :<div className="offer-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:20}}>
            {offers.map(o=><OfferCard key={o.id} offer={o} t={t} onOpen={onOpen}/>)}
          </div>
        }
      </div>
    </div>
  );
}