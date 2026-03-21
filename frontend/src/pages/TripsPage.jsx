import { useState, useEffect, useCallback } from "react"
import { api } from "../api"
import { B, INP, Spin, SectionTitle } from "../utils/styles.jsx"
import { track } from "../utils/analytics"
import OfferCard from "../components/OfferCard"

export default function TripsPage({t,filterCat,setFilterCat,onOpen,onViewAgency,favIds,toggleFav}){

  const [offers,setOffers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState('');
  const [sort,setSort]=useState('rating');
  const [debSearch,setDebSearch]=useState('');
  const [showFilters,setShowFilters]=useState(false);
  const [filters,setFilters]=useState({priceMin:'',priceMax:'',durMin:'',durMax:'',region:''});
  const [applied,setApplied]=useState({priceMin:'',priceMax:'',durMin:'',durMax:'',region:''});

  useEffect(()=>{const tm=setTimeout(()=>setDebSearch(search),400);return()=>clearTimeout(tm);},[search]);

  useEffect(()=>{
    setLoading(true);
    const p=new URLSearchParams({sort});
    if(filterCat&&filterCat!=='all')p.set('category',filterCat);
    if(debSearch)p.set('search',debSearch);
    if(applied.priceMin)p.set('price_min',applied.priceMin);
    if(applied.priceMax)p.set('price_max',applied.priceMax);
    if(applied.durMin)p.set('dur_min',applied.durMin);
    if(applied.durMax)p.set('dur_max',applied.durMax);
    if(applied.region)p.set('region',applied.region);
    api(`/offers?${p}`).then(d=>{setOffers(d);setLoading(false);}).catch(()=>setLoading(false));
  },[filterCat,sort,debSearch,applied]);

  useEffect(()=>{if(debSearch)track('search',{search_query:debSearch});},[debSearch]);

  const applyFilters=()=>{setApplied({...filters});setShowFilters(false);track('filter_used',{...filters});};
  const resetFilters=()=>{const empty={priceMin:'',priceMax:'',durMin:'',durMax:'',region:''};setFilters(empty);setApplied(empty);setShowFilters(false);};
  const activeCount=[applied.priceMin,applied.priceMax,applied.durMin,applied.durMax,applied.region].filter(Boolean).length;

  const FS={fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:.8,color:'var(--muted)',display:'block',marginBottom:4};

  return(
    <div style={{background:'var(--offwhite)',minHeight:'100vh',paddingTop:68}}>
      {/* Header */}
      <div style={{background:'linear-gradient(135deg,var(--teal3),var(--teal4))',padding:'48px 24px 36px'}}>
        <div style={{maxWidth:1280,margin:'0 auto'}}>
          <div style={{fontFamily:'Nunito',fontWeight:900,fontSize:'clamp(24px,4vw,38px)',color:'var(--navy)',marginBottom:6}}>Nos Voyages</div>
          <p style={{color:'var(--muted)',fontSize:15}}>Découvrez toutes nos offres — Algérie, Afrique, Asie et plus.</p>
          {/* Search + Sort + Filter btn */}
          <div style={{display:'flex',gap:10,marginTop:24,flexWrap:'wrap',alignItems:'center'}}>
            <div style={{position:'relative',flex:1,minWidth:200}}>
              <span style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',fontSize:16}}>🔍</span>
              <input style={{...INP,paddingLeft:42,marginBottom:0,borderRadius:50,boxShadow:'var(--shadow)'}} placeholder={t.srchPh} value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <select style={{...INP,width:'auto',marginBottom:0,borderRadius:50,paddingLeft:16,background:'#fff',cursor:'pointer',boxShadow:'var(--shadow)'}} value={sort} onChange={e=>setSort(e.target.value)}>
              {t.sorts.map(([v,l])=><option key={v} value={v}>{l}</option>)}
              <option value="newest">Plus récents</option>
              <option value="duration">Durée ↑</option>
            </select>
            <button onClick={()=>setShowFilters(p=>!p)}
              style={{padding:'10px 20px',borderRadius:50,border:'none',cursor:'pointer',fontSize:13,fontWeight:700,
                background:activeCount?'var(--teal)':'#fff',color:activeCount?'#fff':'var(--text)',
                boxShadow:activeCount?'0 4px 14px rgba(13,185,168,.3)':'var(--shadow)',transition:'all .2s',display:'flex',alignItems:'center',gap:6}}>
              ⚙️ Filtres {activeCount>0&&<span style={{background:'#fff',color:'var(--teal2)',borderRadius:'50%',width:20,height:20,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800}}>{activeCount}</span>}
            </button>
          </div>
        </div>
      </div>

      <div style={{maxWidth:1280,margin:'0 auto',padding:'0 24px'}}>
        {/* Filter panel */}
        {showFilters&&(
          <div style={{background:'#fff',borderRadius:16,padding:'20px 24px',marginTop:20,boxShadow:'var(--shadow)',border:'1px solid #EEF3F5'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <div style={{fontFamily:'Nunito',fontWeight:800,fontSize:15,color:'var(--navy)'}}>⚙️ Filtres avancés</div>
              {activeCount>0&&<button onClick={resetFilters} style={{fontSize:12,color:'var(--teal2)',fontWeight:700,border:'none',background:'none',cursor:'pointer'}}>✕ Réinitialiser</button>}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:14}}>
              <div><label style={FS}>Prix min</label><div style={{position:'relative'}}><input style={{...INP,marginBottom:0,paddingRight:36}} type="number" placeholder="5 000" value={filters.priceMin} onChange={e=>setFilters(p=>({...p,priceMin:e.target.value}))}/><span style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',fontSize:11,color:'var(--muted)',fontWeight:600}}>DZD</span></div></div>
              <div><label style={FS}>Prix max</label><div style={{position:'relative'}}><input style={{...INP,marginBottom:0,paddingRight:36}} type="number" placeholder="500 000" value={filters.priceMax} onChange={e=>setFilters(p=>({...p,priceMax:e.target.value}))}/><span style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',fontSize:11,color:'var(--muted)',fontWeight:600}}>DZD</span></div></div>
              <div><label style={FS}>Durée min</label><div style={{position:'relative'}}><input style={{...INP,marginBottom:0,paddingRight:42}} type="number" placeholder="1" value={filters.durMin} onChange={e=>setFilters(p=>({...p,durMin:e.target.value}))}/><span style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',fontSize:11,color:'var(--muted)',fontWeight:600}}>jours</span></div></div>
              <div><label style={FS}>Durée max</label><div style={{position:'relative'}}><input style={{...INP,marginBottom:0,paddingRight:42}} type="number" placeholder="30" value={filters.durMax} onChange={e=>setFilters(p=>({...p,durMax:e.target.value}))}/><span style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',fontSize:11,color:'var(--muted)',fontWeight:600}}>jours</span></div></div>
              <div><label style={FS}>Région / Wilaya</label><input style={{...INP,marginBottom:0}} placeholder="Ex: Tamanrasset, Kabylie…" value={filters.region} onChange={e=>setFilters(p=>({...p,region:e.target.value}))}/></div>
            </div>
            <div style={{display:'flex',gap:10,marginTop:16}}>
              <button style={{...B.pri,padding:'10px 28px',borderRadius:50,fontSize:13}} onClick={applyFilters}>Appliquer</button>
              <button style={{...B.ghost,padding:'10px 20px',borderRadius:50,fontSize:13}} onClick={()=>setShowFilters(false)}>Fermer</button>
            </div>
          </div>
        )}

        {/* Active filter tags */}
        {activeCount>0&&!showFilters&&(
          <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:20,alignItems:'center'}}>
            <span style={{fontSize:12,color:'var(--muted)',fontWeight:600}}>Filtres :</span>
            {applied.priceMin&&<Tag label={`≥ ${Number(applied.priceMin).toLocaleString()} DZD`} onRemove={()=>setApplied(p=>({...p,priceMin:''}))}/>}
            {applied.priceMax&&<Tag label={`≤ ${Number(applied.priceMax).toLocaleString()} DZD`} onRemove={()=>setApplied(p=>({...p,priceMax:''}))}/>}
            {applied.durMin&&<Tag label={`≥ ${applied.durMin}j`} onRemove={()=>setApplied(p=>({...p,durMin:''}))}/>}
            {applied.durMax&&<Tag label={`≤ ${applied.durMax}j`} onRemove={()=>setApplied(p=>({...p,durMax:''}))}/>}
            {applied.region&&<Tag label={`📍 ${applied.region}`} onRemove={()=>setApplied(p=>({...p,region:''}))}/>}
            <button onClick={resetFilters} style={{fontSize:11,color:'var(--teal2)',fontWeight:700,border:'none',background:'none',cursor:'pointer'}}>✕ Tout effacer</button>
          </div>
        )}
      </div>

      <div style={{maxWidth:1280,margin:'0 auto',padding:'20px 24px 60px'}}>
        {/* Category filters */}
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
            <div style={{fontSize:14}}>Essayez d'autres filtres ou une autre recherche</div>
          </div>
          :<>
            <div style={{fontSize:13,color:'var(--muted)',marginBottom:16,fontWeight:600}}>{offers.length} offre{offers.length>1?'s':''} trouvée{offers.length>1?'s':''}</div>
            <div className="offer-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:20}}>
              {offers.map(o=><OfferCard key={o.id} offer={o} t={t} onOpen={onOpen} onViewAgency={onViewAgency} isFav={favIds?.includes(o.id)} onToggleFav={toggleFav}/>)}
            </div>
          </>
        }
      </div>
    </div>
  );
}

function Tag({label,onRemove}){
  return(
    <span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'5px 12px',background:'var(--teal3)',borderRadius:20,fontSize:12,fontWeight:600,color:'var(--teal2)'}}>
      {label}
      <button onClick={onRemove} style={{border:'none',background:'none',cursor:'pointer',fontSize:14,color:'var(--teal2)',padding:0,lineHeight:1}}>×</button>
    </span>
  );
}
