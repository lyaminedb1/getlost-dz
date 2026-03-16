import { Card } from "../../utils/styles.jsx"
export default function MiniBarH({data,nameKey,valueKey,title,color='var(--teal)',formatVal=v=>v,maxRows=8}){
  const max=Math.max(...data.map(d=>Number(d[valueKey])||0),1);
  return(
    <div>
      <div style={{fontFamily:'Nunito',fontWeight:700,fontSize:13,color:'var(--navy)',marginBottom:10}}>{title}</div>
      {data.length===0&&<div style={{color:'var(--muted)',fontSize:11,textAlign:'center',padding:'8px 0'}}>Aucune donnée</div>}
      {data.slice(0,maxRows).map((d,i)=>{
        const w=Math.round((Number(d[valueKey])||0)/max*100);
        return(
          <div key={i} style={{marginBottom:7}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:11,fontWeight:600,color:'var(--muted)',marginBottom:2}}>
              <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'70%'}}>{d[nameKey]||'—'}</span>
              <span style={{color:'var(--navy)',fontWeight:700}}>{formatVal(d[valueKey])}</span>
            </div>
            <div style={{background:'#F1F5F9',borderRadius:4,height:6,overflow:'hidden'}}>
              <div style={{height:'100%',borderRadius:4,background:color,width:`${w}%`,transition:'width .6s'}}/>
            </div>
          </div>
        );
      })}
    </div>
  );
}