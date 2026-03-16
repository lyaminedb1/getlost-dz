import { Card } from "../../utils/styles.jsx"
export default function HeatGrid({data,title}){
  const hours=Array.from({length:24},(_,h)=>{
    const f=(data||[]).find(d=>parseInt(d.hour)===h);
    return{h,c:f?f.c:0};
  });
  const max=Math.max(...hours.map(h=>h.c),1);
  return(
    <div>
      <div style={{fontFamily:'Nunito',fontWeight:700,fontSize:13,color:'var(--navy)',marginBottom:10}}>{title}</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(12,1fr)',gap:3}}>
        {hours.map(({h,c})=>{
          const pct=c/max;
          const bg=c===0?'#F1F5F9':`rgba(13,185,168,${.12+pct*.88})`;
          return(
            <div key={h} title={`${h}h: ${c}`} style={{background:bg,borderRadius:5,padding:'5px 2px',textAlign:'center',cursor:'default'}}>
              <div style={{fontSize:8,color:pct>.5?'#fff':'#94A3B8',fontWeight:700}}>{h}h</div>
              <div style={{fontSize:8,color:pct>.5?'#fff':'var(--navy)',fontWeight:600}}>{c||''}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}