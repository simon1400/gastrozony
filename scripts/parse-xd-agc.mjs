import fs from 'node:fs';
const src = process.argv[2]; const out = process.argv[3];
const doc = JSON.parse(fs.readFileSync(src, 'utf8'));
const rows = [];
const hex = c => c && c.value ? '#' + [c.value.r,c.value.g,c.value.b].map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase() + (c.alpha!=null && c.alpha<1 ? ` a=${c.alpha.toFixed(2)}`:'') : '';
function fillStr(st){ if(!st||!st.fill) return ''; const f=st.fill; if(f.type==='solid') return hex(f.color); if(f.type==='gradient') return 'gradient'; if(f.type==='pattern') return 'img'; return f.type||''; }
function walk(node, ox, oy, depth, parentName){
  const tx = node.transform ? node.transform.tx||0 : 0; const ty = node.transform ? node.transform.ty||0 : 0;
  const ax = ox+tx, ay = oy+ty;
  const name = node.name || '';
  const t = node.type;
  let w='',h='',lx=0,ly=0;
  const s = node.shape;
  if (s){ if (s.type==='rect'){ lx=s.x||0; ly=s.y||0; w=s.width; h=s.height; }
          else if (s.type==='ellipse'){ lx=(s.cx||0)-(s.rx||0); ly=(s.cy||0)-(s.ry||0); w=(s.rx||0)*2; h=(s.ry||0)*2; }
          else if (s.type==='line'){ lx=Math.min(s.x1,s.x2); ly=Math.min(s.y1,s.y2); w=Math.abs(s.x2-s.x1); h=Math.abs(s.y2-s.y1);} }
  const lb = node.meta?.ux?.localBounds || node.meta?.ux?.pathBounds;
  if (lb && (w==='' )) { lx=lb.x||0; ly=lb.y||0; w=lb.width; h=lb.height; }
  let text='', font='';
  if (t==='text'){ text = (node.text?.rawText||'').replace(/\s+/g,' ').slice(0,90);
    const st = node.style||{}; const f=st.font||{}; font=`${f.family||''} ${f.style||''} ${f.size||''}px`;
    const ls = node.text?.paragraphs?.[0]?.lines?.[0]?.[0]?.style?.font; if(ls) font = `${ls.family||''} ${ls.style||''} ${ls.size||''}px`;
    if (node.text?.frame) { w = node.text.frame.width||''; h = node.text.frame.height||''; }
    const lh = st.textAttributes?.lineHeight; if(lh) font += ` lh=${lh}`;
    const ls2 = st.textAttributes?.letterSpacing; if(ls2) font += ` ls=${ls2}`;
  }
  const fill = fillStr(node.style);
  const stroke = node.style?.stroke && node.style.stroke.type!=='none' ? `stroke ${hex(node.style.stroke.color)} ${node.style.stroke.width||''}` : '';
  const op = node.style?.opacity!=null && node.style.opacity<1 ? `op=${node.style.opacity}` : '';
  const blur = node.style?.filters?.find(f=>f.type==='uxdesign#blur'); const bl = blur ? `blur=${blur.params?.blurAmount}` : '';
  const rad = s?.r ? `r=${Array.isArray(s.r)?s.r.join('/'):s.r}` : '';
  const hidden = node.visible===false ? 'HIDDEN' : '';
  if (t!=='artboard' && !(t==='group' && !name.match(/Group|Mask/))) {}
  rows.push({depth, type:t, name, x:Math.round(ax+lx), y:Math.round(ay+ly), w:typeof w==='number'?Math.round(w):w, h:typeof h==='number'?Math.round(h):h, text, font, fill, stroke, op, bl, rad, hidden});
  const kids = node.children || node.artboard?.children || (node.group?.children) || [];
  for (const k of kids) walk(k, ax, ay, depth+1, name);
}
for (const ab of doc.children) walk(ab, 0, 0, 0, '');
const lines = rows.map(r => `${'  '.repeat(Math.max(0,r.depth-1))}[${r.type}] ${r.name} @ ${r.x},${r.y} ${r.w}×${r.h} ${[r.fill,r.stroke,r.op,r.bl,r.rad,r.hidden].filter(Boolean).join(' ')}${r.text?` | "${r.text}"`:''}${r.font?` | ${r.font}`:''}`);
fs.writeFileSync(out, lines.join('\n'));
console.log(rows.length, 'nodes ->', out);
