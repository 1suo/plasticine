import React, { useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { makeGlyph, glyphPathData, countSegments, type Point } from "./core/geometry";
import { traceGlyphImage } from "./core/img2bez";
import { compileFont, downloadFont } from "./core/font";
import "./style.css";

const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split("");
const palettes = {
  Babylon: { background:"#191970",surface:"#0f0f0f",foreground:"#FFF8DC",muted:"#6A5ACD",border:"#6A5ACD",selection:"#6a5acd",cursor:"#FFD700",primary:"#faebd7",secondary:"#00ffff" },
  Troy: { background:"#000000",surface:"#201006",foreground:"#faebd7",muted:"#8b4513",border:"#333333",selection:"#8b4513",cursor:"#00FF7F",primary:"#FF6347",secondary:"#FFD700" },
  Knossos: { background:"#FAEBD7",surface:"#eedfcc",foreground:"#8b2323",muted:"#cdb79e",border:"#8b7355",selection:"#ff7f50",cursor:"#FF0000",primary:"#FF6347",secondary:"#1a1a1a" },
  Petra: { background:"#8b0000",surface:"#0d0d0d",foreground:"#FFE4E1",muted:"#BC8F8F",border:"#8B4513",selection:"#cd2626",cursor:"#FFD700",primary:"#ff6347",secondary:"#cdb7b5" },
  Tikal: { background:"#013220",surface:"#080808",foreground:"#F5DEB3",muted:"#2f4f4f",border:"#2f4f4f",selection:"#458b74",cursor:"#FFD700",primary:"#7CFC00",secondary:"#DAA520" },
  Alexandria: { background:"#FFFAFA",surface:"#FFFAFA",foreground:"#2F4F4F",muted:"#696969",border:"#708090",selection:"#2F4F4F",cursor:"#8B0000",primary:"#B22222",secondary:"#008080" }
} as const;
type Palette = keyof typeof palettes;
type Crop = { x:number; y:number; w:number; h:number };

function App() {
  const [code,setCode] = useState(65);
  const [drawings,setDrawings] = useState<Map<number,Point[][]>>(new Map());
  const [advances,setAdvances] = useState<Map<number,number>>(new Map());
  const [imageUrl,setImageUrl] = useState("");
  const [image,setImage] = useState<HTMLImageElement|null>(null);
  const [crop,setCrop] = useState<Crop>({x:50,y:50,w:400,h:400});
  const [drag,setDrag] = useState<Point|null>(null);
  const [threshold,setThreshold] = useState(180);
  const [profile,setProfile] = useState<"wild"|"clean"|"photo">("wild");
  const [tension,setTension] = useState(.8);
  const [family,setFamily] = useState("Plasticine");
  const [specimen,setSpecimen] = useState("Hamburgefontsiv 0123456789");
  const [loadedFont,setLoadedFont] = useState("");
  const [palette,setPalette] = useState<Palette>("Babylon");
  const [message,setMessage] = useState("Upload a glyph image. Select the crop, then reconstruct.");
  const svg = useRef<SVGSVGElement>(null);
  const raw = drawings.get(code) ?? [];
  const glyph = useMemo(()=>({...makeGlyph(code,raw,0.4,tension),advanceWidth:advances.get(code)??700}),[code,raw,tension,advances]);
  const path = glyphPathData(glyph);
  const all = useMemo(()=>[...drawings].map(([unicode,contours])=>({...makeGlyph(unicode,contours,0.4,tension),advanceWidth:advances.get(unicode)??700})).filter(g=>g.contours.length),[drawings,tension,advances]);
  const colors = palettes[palette];
  const imageRect = useMemo(()=>{if(!image)return{x:0,y:0,w:500,h:500};const scale=Math.min(500/image.naturalWidth,500/image.naturalHeight);const w=image.naturalWidth*scale,h=image.naturalHeight*scale;return{x:(500-w)/2,y:(500-h)/2,w,h};},[image]);
  const themeStyle = {
    "--bg":colors.background,"--surface":colors.surface,"--fg":colors.foreground,"--muted":colors.muted,
    "--border":colors.border,"--selection":colors.selection,"--cursor":colors.cursor,
    "--accent":colors.primary,"--accent2":colors.secondary
  } as React.CSSProperties;

  function stagePoint(e:React.PointerEvent<SVGSVGElement>):Point {
    const p=svg.current!.createSVGPoint();p.x=e.clientX;p.y=e.clientY;
    const matrix=svg.current!.getScreenCTM();const q=matrix?p.matrixTransform(matrix.inverse()):{x:0,y:0};
    return {x:Math.max(imageRect.x,Math.min(imageRect.x+imageRect.w,q.x)),y:Math.max(imageRect.y,Math.min(imageRect.y+imageRect.h,q.y))};
  }
  function upload(e:React.ChangeEvent<HTMLInputElement>) {
    const file=e.target.files?.[0];if(!file)return;
    const url=URL.createObjectURL(file),img=new Image();
    img.onload=()=>{setImage(img);setImageUrl(url);const scale=Math.min(500/img.naturalWidth,500/img.naturalHeight),w=img.naturalWidth*scale,h=img.naturalHeight*scale;setCrop({x:(500-w)/2+w*.08,y:(500-h)/2+h*.08,w:w*.84,h:h*.84});setMessage("Adjust the crop around one glyph, then reconstruct.");};
    img.onerror=()=>{URL.revokeObjectURL(url);setMessage("Could not read that image.");};
    img.src=url;e.target.value="";
  }
  async function reconstruct() {
    if(!image){setMessage("Upload an image first.");return;}
    const size=1024,canvas=document.createElement("canvas");canvas.width=size;canvas.height=size;
    const context=canvas.getContext("2d");if(!context){setMessage("Canvas is unavailable.");return;}
    context.fillStyle="#fff";context.fillRect(0,0,size,size);
    const sourceX=(crop.x-imageRect.x)/imageRect.w*image.naturalWidth,sourceY=(crop.y-imageRect.y)/imageRect.h*image.naturalHeight,sourceW=crop.w/imageRect.w*image.naturalWidth,sourceH=crop.h/imageRect.h*image.naturalHeight,scale=Math.min(size/sourceW,size/sourceH),destW=sourceW*scale,destH=sourceH*scale;
    context.drawImage(image,sourceX,sourceY,sourceW,sourceH,(size-destW)/2,(size-destH)/2,destW,destH);
    const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/png"));
    if(!blob){setMessage("Could not encode the cropped image.");return;}
    try {
      setMessage("Detecting glyph structure and fitting font-ready outlines…");
      const traced=await traceGlyphImage(new Uint8Array(await blob.arrayBuffer()),code,threshold,profile);
      setDrawings(old=>{const next=new Map(old);next.set(code,traced.contours);return next;});
      setAdvances(old=>{const next=new Map(old);next.set(code,traced.advanceWidth);return next;});
      const segments=traced.contours.reduce((sum,contour)=>sum+contour.length-1,0);
      setMessage(`img2bez inferred ${traced.contours.length} contour(s), ${segments} structural segments, and a ${traced.advanceWidth}-unit advance.`);
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
    const data={format:"plasticine-project",version:2,family,glyphs:[...drawings].map(([unicode,contours])=>({unicode,contours,advanceWidth:advances.get(unicode)??700}))};
    const url=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:"application/json"})),a=document.createElement("a");
    a.href=url;a.download="plasticine.json";a.click();URL.revokeObjectURL(url);
  }
  function importProject(e:React.ChangeEvent<HTMLInputElement>) {
    const file=e.target.files?.[0];if(!file)return;
    file.text().then(text=>{const data=JSON.parse(text);if(data.format!=="plasticine-project"||!Array.isArray(data.glyphs))throw Error("Invalid Plasticine project");setDrawings(new Map<number,Point[][]>(data.glyphs.map((g:{unicode:number;contours:Point[][]})=>[g.unicode,g.contours] as [number,Point[][]])));setAdvances(new Map<number,number>(data.glyphs.map((g:{unicode:number;advanceWidth?:number})=>[g.unicode,g.advanceWidth??700] as [number,number])));setFamily(data.family||"Plasticine");setMessage("Project imported.");}).catch(error=>setMessage(String(error)));e.target.value="";
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
            {image&&<image href={imageUrl} x="0" y="0" width="500" height="500" preserveAspectRatio="xMidYMid meet"/>}
            {!image&&<g className="empty"><path d={path} fill="currentColor" fillRule="nonzero"/>{!raw.length&&<text x="250" y="245" textAnchor="middle">Open an image to begin</text>}</g>}
            {image&&<><rect x="0" y="0" width="500" height="500" fill="#000" opacity=".48"/><rect x={crop.x} y={crop.y} width={crop.w} height={crop.h} fill="none" stroke="var(--cursor)" strokeWidth="2" vectorEffect="non-scaling-stroke"/><svg x={crop.x} y={crop.y} width={crop.w} height={crop.h} viewBox={`${crop.x} ${crop.y} ${Math.max(1,crop.w)} ${Math.max(1,crop.h)}`}><image href={imageUrl} x="0" y="0" width="500" height="500" preserveAspectRatio="xMidYMid meet"/></svg></>}
            {image&&raw.length>0&&<path d={path} fill="var(--accent)" fillRule="nonzero" opacity=".8" pointerEvents="none"/>}
          </svg>
        </div>
        <div className="message">{message}</div>
      </section>
      <aside>
        <section>
          <label>Source profile</label>
          <select className="textinput" value={profile} onChange={e=>setProfile(e.target.value as "wild"|"clean"|"photo")}><option value="wild">Wild / unknown raster</option><option value="clean">Clean font render</option><option value="photo">Photo / printed scan</option></select>
          <label>Threshold <output>{threshold}</output></label>
          <input type="range" min="0" max="255" value={threshold} onChange={e=>setThreshold(+e.target.value)}/>
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
