import { Card } from "../../utils/styles.jsx"
export default function SvgLineChart({data,keys,colors,title,subtitle,height=160,formatY=v=>v}){
  if(!data||data.length<2) return(
    <Card style={{padding:'24px'}}>
      <div style={{fontFamily:'Nunito',fontWeight:800,fontSize:15,color:'var(--navy)',marginBottom:4}}>{title}</div>
      {subtitle&&<div style={{fontSize:11,color:'var(--muted)',marginBottom:16}}>{subtitle}</div>}
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:height,gap:8,color:'var(--muted)'}}>
        <div style={{fontSize:28}}>📭</div><div style={{fontSize:12,fontWeight:600}}>Données insuffisantes</div>
      </div>
    </Card>
  );
  const W=640,PAD=40,H=height;
  const maxes=keys.map(k=>Math.max(...data.map(d=>Number(d[k])||0),1));
  const pts=(k,maxV)=>data.map((d,i)=>{
    const x=PAD+(i/(data.length-1))*(W-2*PAD);
    const y=H-PAD-((Number(d[k])||0)/maxV)*(H-2*PAD);
    return{x,y,v:d[k],day:d.day||d.created_at||''};
  });
  return(
    <Card style={{padding:'24px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16,flexWrap:'wrap',gap:8}}>
        <div>
          <div style={{fontFamily:'Nunito',fontWeight:800,fontSize:15,color:'var(--navy)'}}>{title}</div>
          {subtitle&&<div style={{fontSize:11,color:'var(--muted)',marginTop:2}}>{subtitle}</div>}
        </div>
        <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
          {keys.map((k,i)=>(
            <span key={k} style={{display:'flex',alignItems:'center',gap:5,fontSize:11,fontWeight:600,color:'var(--muted)'}}>
              <span style={{width:20,height:3,borderRadius:2,background:colors[i],display:'inline-block'}}/>
              {k}
            </span>
          ))}
        </div>
      </div>
      <div style={{overflowX:'auto'}}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',minWidth:280,height:H}}>
          {[0,.25,.5,.75,1].map(f=>(
            <line key={f} x1={PAD} y1={PAD+f*(H-2*PAD)} x2={W-PAD} y2={PAD+f*(H-2*PAD)}
              stroke='#E2E8F0' strokeWidth='1' strokeDasharray={f===0?'0':'4,4'}/>
          ))}
          {keys.map((k,ki)=>{
            const P=pts(k,maxes[ki]);
            const path=P.map((p,i)=>`${i===0?'M':'L'}${p.x},${p.y}`).join(' ');
            const area=path+`L${W-PAD},${H-PAD}L${PAD},${H-PAD}Z`;
            return(
              <g key={k}>
                {ki===0&&<path d={area} fill={`${colors[ki]}18`}/>}
                <path d={path} fill='none' stroke={colors[ki]} strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'/>
                {P.map((p,i)=>(
                  <circle key={i} cx={p.x} cy={p.y} r='3.5' fill={colors[ki]} opacity='.9'/>
                ))}
              </g>
            );
          })}
          {data.map((d,i)=>{
            const showL=i===0||i===data.length-1||i%Math.ceil(data.length/7)===0;
            if(!showL)return null;
            const x=PAD+(i/(data.length-1))*(W-2*PAD);
            const lbl=(d.day||'').slice(5)||'';
            return<text key={i} x={x} y={H-4} textAnchor='middle' fontSize='9' fill='#94A3B8'>{lbl}</text>;
          })}
          <text x={PAD-4} y={PAD+4} textAnchor='end' fontSize='9' fill='#94A3B8'>{formatY(maxes[0])}</text>
          <text x={PAD-4} y={H-PAD+4} textAnchor='end' fontSize='9' fill='#94A3B8'>0</text>
        </svg>
      </div>
    </Card>
  );
}