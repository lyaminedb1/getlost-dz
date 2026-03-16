import { Card } from "../../utils/styles.jsx"
export default function StatRow({label,curr,prev,format=v=>v,color='var(--teal2)'}){
  const pct=prev>0?Math.round(((curr-prev)/prev)*100):null;
  const up=pct>0,same=pct===0;
  return(
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid #F1F5F9'}}>
      <span style={{fontSize:13,color:'var(--muted)',fontWeight:600}}>{label}</span>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <span style={{fontFamily:'Nunito',fontWeight:900,fontSize:18,color}}>{format(curr)}</span>
        {pct!==null&&(
          <span style={{fontSize:11,fontWeight:700,color:up?'#10B981':same?'#94A3B8':'#EF4444',background:up?'#D1FAE5':same?'#F1F5F9':'#FEE2E2',padding:'2px 8px',borderRadius:20}}>
            {up?'↑':same?'—':'↓'}{Math.abs(pct)}%
          </span>
        )}
      </div>
    </div>
  );
}