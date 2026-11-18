import React, { useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { makeGlyph, glyphPathData, countSegments, type Point } from "./core/geometry";
import { traceBitmap } from "./core/trace";
import { compileFont, downloadFont } from "./core/font";
import "./style.css";

const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split("");
const palettes = {
  Babylon: { background:"#191970",surface:"#0f0f0f",foreground:"#FFF8DC",muted:"#6A5ACD",border:"#6A5ACD",selection:"#6a5acd",cursor:"#FFD700",primary:"#faebd7",secondary:"#00ffff" },
  Troy: { background:"#000000",surface:"#201006",foreground:"#faebd7",muted:"#8b4513",border:"#333333",selection:"#8b4513",cursor:"#00FF7F",primary:"#FF6347",secondary:"#FFD700" },
  Knossos: { background:"#FAEBD7",surface:"#eedfcc",foreground:"#8b2323",muted:"#cdb79e",border:"#8b7355",selection:"#ff7f50",cursor:"#FF0000",primary:"#FF6347",secondary:"#1a1a1a" },
  Petra: { background:"#8b0000",surface:"#0d0d0d",foreground:"#FFE4E1",muted:"#BC8F8F",border:"#8B4513",selection:"#cd2626",cursor:"#FFD700",primary:"#ff6347",secondary:"#cdb7b5" },
  Tikal: { background:"#013220",surface:"#080808",foreground:"#F5DEB3",muted:"#2f4f4f",border:"#2f4f4f",selection:"#458b74",cursor:"#FFD700",primary:"#7CFC00",secondary:"#DAA520" },
  Alexandria: { background:"#e6e6fa",surface:"#f5f5f5",foreground:"#483d8b",muted:"#b0c4de",border:"#708090",selection:"#6495ed",cursor:"#b22222",primary:"#4682b4",secondary:"#8a2be2" }
} as const;
type Palette = keyof typeof palettes;
type Crop = { x:number; y:number; w:number; h:number };

function App() {
  const [code,setCode] = useState(65);
  const [drawings,setDrawings] = useState<Map<number,Point[][]>>(new Map());
  const [imageUrl,setImageUrl] = useState("");
  const [image,setImage] = useState<HTMLImageElement|null>(null);
  const [crop,setCrop] = useState<Crop>({x:50,y:50,w:400,h:400});
  const [drag,setDrag] = useState<Point|null>(null);
  const [threshold,setThreshold] = useState(180);
  const [simplicity,setSimplicity] = useState(.4);
  const [tension,setTension] = useState(.8);
  const [family,setFamily] = useState("Plasticine");
  const [specimen,setSpecimen] = useState("Hamburgefontsiv 0123456789");
  const [loadedFont,setLoadedFont] = useState("");
  const [palette,setPalette] = useState<Palette>("Babylon");
  const [message,setMessage] = useState("Upload a glyph image. Select the crop, then reconstruct.");
  const svg = useRef<SVGSVGElement>(null);
  const raw = drawings.get(code) ?? [];
  const glyph = useMemo(()=>makeGlyph(code,raw,simplicity,tension),[code,raw,simplicity,tension]);
  const path = glyphPathData(glyph);
  const all = useMemo(()=>[...drawings].map(([unicode,contours])=>makeGlyph(unicode,contours,simplicity,tension)).filter(g=>g.contours.length),[drawings,simplicity,tension]);
  const colors = palettes[palette];
  const themeStyle = {
    "--bg":colors.background,"--surface":colors.surface,"--fg":colors.foreground,"--muted":colors.muted,
    "--border":colors.border,"--selection":colors.selection,"--cursor":colors.cursor,
    "--accent":colors.primary,"--accent2":colors.secondary
  } as React.CSSProperties;

  function stagePoint(e:React.PointerEvent<SVGSVGElement>):Point {
    const p=svg.current!.createSVGPoint();p.x=e.clientX;p.y=e.clientY;
    const matrix=svg.current!.getScreenCTM();const q=matrix?p.matrixTransform(matrix.inverse()):{x:0,y:0};
    return {x:Math.max(0,Math.min(500,q.x)),y:Math.max(0,Math.min(500,q.y))};
  }
  function upload(e:React.ChangeEvent<HTMLInputElement>) {
    const file=e.target.files?.[0];if(!file)return;
    const url=URL.createObjectURL(file),img=new Image();
    img.onload=()=>{setImage(img);setImageUrl(url);setCrop({x:35,y:35,w:430,h:430});setMessage("Adjust the crop around one glyph, then reconstruct.");};
    img.onerror=()=>{URL.revokeObjectURL(url);setMessage("Could not read that image.");};
    img.src=url;e.target.value="";
  }
  function reconstruct() {
    if(!image){setMessage("Upload an image first.");return;}
    const size=256,canvas=document.createElement("canvas");canvas.width=size;canvas.height=size;
    const context=canvas.getContext("2d",{willReadFrequently:true});if(!context){setMessage("Canvas is unavailable.");return;}
    context.fillStyle="#fff";context.fillRect(0,0,size,size);
    context.drawImage(image,crop.x/500*image.naturalWidth,crop.y/500*image.naturalHeight,crop.w/500*image.naturalWidth,crop.h/500*image.naturalHeight,0,0,size,size);
    const pixels=context.getImageData(0,0,size,size).data,mask=new Uint8Array(size*size);
    for(let i=0;i<mask.length;i++){const alpha=pixels[i*4+3],lum=.2126*pixels[i*4]+.7152*pixels[i*4+1]+.0722*pixels[i*4+2];mask[i]=alpha>16&&lum<threshold?1:0;}
    try {
      const contours=traceBitmap(mask,size,size);
      if(!contours.length){setMessage("No foreground pixels found. Adjust crop or threshold.");return;}
      setDrawings(old=>{const next=new Map(old);next.set(code,contours);return next;});
      setMessage(`Reconstructed ${contours.length} contour(s) from ${mask.reduce((a,b)=>a+b,0)} ink pixels.`);
    } catch(error) { setMessage(String(error)); }
  }
  function compile() {
    try {
      const data=compileFont(all,family),url=URL.createObjectURL(new Blob([data],{type:"font/otf"}));
      const face=new FontFace(family,`url(${url})`);
      face.load().then(f=>{document.fonts.add(f);setLoadedFont(family);downloadFont(data,family);setMessage("Compiled OTF and loaded it in the specimen.");}).catch(e=>setMessage(String(e)));
    } catch(error) { setMessage(String(error)); }
  }
  function exportProject() {
    const data={format:"plasticine-project",version:1,family,glyphs:[...drawings].map(([unicode,contours])=>({unicode,contours}))};
    const url=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:"application/json"})),a=document.createElement("a");
    a.href=url;a.download="plasticine.json";a.click();URL.revokeObjectURL(url);
  }
  function importProject(e:React.ChangeEvent<HTMLInputElement>) {
    const file=e.target.files?.[0];if(!file)return;
    file.text().then(text=>{const data=JSON.parse(text);if(data.format!=="plasticine-project"||!Array.isArray(data.glyphs))throw Error("Invalid Plasticine project");setDrawings(new Map(data.glyphs.map((g:{unicode:number;contours:Point[][]})=>[g.unicode,g.contours])));setFamily(data.family||"Plasticine");setMessage("Project imported.");}).catch(error=>setMessage(String(error)));e.target.value="";
  }
  return <div className="app" style={themeStyle}>
    <header>
      <a className="brand" href="#">plasticine</a>
      <div className="actions">
        <label className="control">Open image<input type="file" accept="image/*" onChange={upload}/></label>
        <label className="control">Project<input type="file" accept=".json,application/json" onChange={importProject}/></label>
        <button className="control" onClick={exportProject}>Save project</button>
        <button className="control primary" onClick={compile}>Compile OTF</button>
      </div>
      <select aria-label="Findspot palette" value={palette} onChange={e=>setPalette(e.target.value as Palette)}>{Object.keys(palettes).map(name=><option key={name}>{name}</option>)}</select>
    </header>
    <nav className="glyphs" aria-label="Glyphs">{chars.map(char=><button key={char} className={code===char.charCodeAt(0)?"selected":""} onClick={()=>{setCode(char.charCodeAt(0));setMessage("Select a glyph image and crop.");}}>{char}{drawings.has(char.charCodeAt(0))&&<i/>}</button>)}</nav>
    <main>
      <section className="workspace">
        <div className="stagebar"><strong>{String.fromCharCode(code)}</strong><span>{image?"CROP IMAGE":"VECTOR OUTLINE"}</span><button onClick={reconstruct} disabled={!image}>Reconstruct</button></div>
        <div className="stage">
          <svg ref={svg} viewBox="0 0 500 500" onPointerDown={e=>{if(!image)return;const p=stagePoint(e);setDrag(p);setCrop({x:p.x,y:p.y,w:0,h:0});e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{if(!drag)return;const p=stagePoint(e);setCrop({x:Math.min(drag.x,p.x),y:Math.min(drag.y,p.y),w:Math.abs(p.x-drag.x),h:Math.abs(p.y-drag.y)});}} onPointerUp={()=>setDrag(null)} onPointerCancel={()=>setDrag(null)}>
            {image&&<image href={imageUrl} x="0" y="0" width="500" height="500" preserveAspectRatio="none"/>}
            {!image&&<g className="empty"><path d={path} fill="currentColor" fillRule="nonzero"/>{!raw.length&&<text x="250" y="245" textAnchor="middle">Open an image to begin</text>}</g>}
            {image&&<><rect x="0" y="0" width="500" height="500" fill="#000" opacity=".48"/><rect x={crop.x} y={crop.y} width={crop.w} height={crop.h} fill="none" stroke="var(--cursor)" strokeWidth="2" vectorEffect="non-scaling-stroke"/><svg x={crop.x} y={crop.y} width={crop.w} height={crop.h} viewBox={`${crop.x} ${crop.y} ${Math.max(1,crop.w)} ${Math.max(1,crop.h)}`}><image href={imageUrl} x="0" y="0" width="500" height="500" preserveAspectRatio="none"/></svg></>}
            {image&&raw.length>0&&<path d={path} fill="var(--accent)" fillRule="nonzero" opacity=".8" pointerEvents="none"/>}
          </svg>
        </div>
        <div className="message">{message}</div>
      </section>
      <aside>
        <section>
          <label>Threshold <output>{threshold}</output></label>
          <input type="range" min="0" max="255" value={threshold} onChange={e=>setThreshold(+e.target.value)}/>
          <label>Simplicity <output>{simplicity.toFixed(2)}</output></label>
          <input type="range" min="0" max="3" step=".05" value={simplicity} onChange={e=>setSimplicity(+e.target.value)}/>
          <label>Curve tension <output>{tension.toFixed(2)}</output></label>
          <input type="range" min="0" max="1.5" step=".05" value={tension} onChange={e=>setTension(+e.target.value)}/>
        </section>
        <section className="stats"><div><span>Contours</span><b>{glyph.contours.length}</b></div><div><span>Segments</span><b>{countSegments(glyph)}</b></div><div><span>Ink bounds</span><b>{glyph.contours.length?Math.round(Math.max(...glyph.contours.flatMap(c=>c.points.map(p=>p.x)))-Math.min(...glyph.contours.flatMap(c=>c.points.map(p=>p.x))))+" × "+Math.round(Math.max(...glyph.contours.flatMap(c=>c.points.map(p=>p.y)))-Math.min(...glyph.contours.flatMap(c=>c.points.map(p=>p.y)))):"—"}</b></div></section>
        <section><label>Font family</label><input className="textinput" value={family} onChange={e=>setFamily(e.target.value)}/></section>
        <section><label>Specimen</label><input className="textinput" value={specimen} onChange={e=>setSpecimen(e.target.value)}/><div className="specimen" style={loadedFont?{fontFamily:loadedFont}:undefined}>{specimen}</div></section>
        <section className="message">{loadedFont?"Compiled font loaded.":"Compile to test the actual OTF."}</section>
      </aside>
    </main>
  </div>;
}
createRoot(document.getElementById("root")!).render(<React.StrictMode><App/></React.StrictMode>);
