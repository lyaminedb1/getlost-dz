import { Card } from "../../utils/styles.jsx"
export default function DonutSmall({data,nameKey,valueKey,title,colors,size=120}){
  const COLS=colors||['#0DB9A8','#3B82F6','#F59E0B','#EF4444','#8B5CF6','#EC4899'];
  const total=data.reduce((s,d)=>s+(d[valueKey]||0),0)||1;
  let angle=0;
  const R=46,cx=60,cy=60;
  function arc(s,e){
    if(e-s>=360)return`M ${cx} ${cy-R} A ${R} ${R} 0 1 1 ${cx-.01} ${cy-R} Z`;
    const rad=a=>(a-90)*Math.PI/180;
    const sx=cx+R*Math.cos(rad(s)),sy=cy+R*Math.sin(rad(s));
    const ex=cx+R*Math.cos(rad(e)),ey=cy+R*Math.sin(rad(e));
    return`M${cx} ${cy}L${sx} ${sy}A${R} ${R} 0 ${e-s>180?1:0} 1 ${ex} ${ey}Z`;
  }
  const slices=data.map((d,i)=>{const pct=(d[valueKey]||0)/total;const s=angle;angle+=pct*360;return{...d,pct,s,e:angle,c:COLS[i%COLS.length]};});
  return(
    <div>
      <div style={{fontFamily:'Nunito',fontWeight:700,fontSize:13,color:'var(--navy)',marginBottom:10}}>{title}</div>
      {data.length===0?<div style={{color:'var(--muted)',fontSize:11,textAlign:'center',padding:'8px 0'}}>—</div>:(
        <div style={{display:'flex',gap:12,alignItems:'center'}}>
          <svg viewBox='0 0 120 120' style={{width:size,height:size,flexShrink:0}}>
            {slices.map((s,i)=><path key={i} d={arc(s.s,s.e)} fill={s.c} opacity='.9'/>)}
            <circle cx={cx} cy={cy} r={22} fill='#fff'/>
            <text x={cx} y={cy+4} textAnchor='middle' fontSize='11' fontWeight='700' fill='var(--navy)'>{total}</text>
          </svg>
          <div style={{flex:1}}>
            {slices.map((s,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:6,marginBottom:5}}>
                <div style={{width:8,height:8,borderRadius:2,background:s.c,flexShrink:0}}/>
                <span style={{fontSize:11,color:'var(--muted)',flex:1,fontWeight:600}}>{s[nameKey]||'—'}</span>
                <span style={{fontSize:11,color:'var(--navy)',fontWeight:700}}>{Math.round(s.pct*100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}