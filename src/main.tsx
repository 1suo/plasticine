import React, { useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { makeGlyph, countSegments, type Point } from "./core/geometry";
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
type InkPoint = { x:number; y:number };
type Stroke = { id:string; points:InkPoint[]; color:"#000000"|"#ffffff"; size:number };
type Layer = { id:string; name:string; visible:boolean; strokes:Stroke[] };
type SavedGlyph = { unicode:number; contours:Point[][]; advanceWidth?:number; layers?:Layer[] };

const initialLayer:Layer = {id:"ink",name:"Ink",visible:true,strokes:[]};
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
const strokePath=(points:InkPoint[])=>points.map((p,i)=>`${i?"L":"M"} ${p.x} ${p.y}`).join(" ");

function App() {
  const [code,setCode] = useState(65);
  const [drawings,setDrawings] = useState<Map<number,Point[][]>>(new Map());
  const [advances,setAdvances] = useState<Map<number,number>>(new Map());
  const [layersByGlyph,setLayersByGlyph] = useState<Map<number,Layer[]>>(new Map());
  const [activeLayerId,setActiveLayerId] = useState("ink");
  const [mode,setMode] = useState<"draw"|"crop">("draw");
  const [tool,setTool] = useState<"pen"|"eraser">("pen");
  const [inkColor,setInkColor] = useState<"#000000"|"#ffffff">("#000000");
  const [penSize,setPenSize] = useState(12);
  const [imageUrl,setImageUrl] = useState("");
  const [image,setImage] = useState<HTMLImageElement|null>(null);
  const [imageVisible,setImageVisible] = useState(true);
  const [crop,setCrop] = useState<Crop>({x:0,y:0,w:500,h:500});
  const [cropDrag,setCropDrag] = useState<InkPoint|null>(null);
  const strokeId = useRef<string|null>(null);
  const strokeSequence = useRef(0);
  const layerSequence = useRef(0);
  const [threshold,setThreshold] = useState(180);
  const [profile,setProfile] = useState<"wild"|"clean"|"photo">("wild");
  const [tension,setTension] = useState(1.0);
  const [family,setFamily] = useState("Plasticine");
  const [specimen,setSpecimen] = useState("Hamburgefontsiv 0123456789");
  const [loadedFont,setLoadedFont] = useState("");
  const [palette,setPalette] = useState<Palette>("Babylon");
  const [message,setMessage] = useState("Draw directly, import a glyph image, or combine both. Reconstruct traces the visible result.");
  const svg = useRef<SVGSVGElement>(null);
  const raw = drawings.get(code) ?? [];
  const layers = layersByGlyph.get(code) ?? [initialLayer];
  const activeLayer = layers.find(layer=>layer.id===activeLayerId) ?? layers[0];
  const glyph = useMemo(()=>({...makeGlyph(code,raw,0.4,tension),advanceWidth:advances.get(code)??700}),[code,raw,tension,advances]);
  const all = useMemo(()=>[...drawings].map(([unicode,contours])=>({...makeGlyph(unicode,contours,0.4,tension),advanceWidth:advances.get(unicode)??700})).filter(g=>g.contours.length),[drawings,tension,advances]);
  const colors = palettes[palette];
  const imageRect = useMemo(()=>{if(!image)return{x:0,y:0,w:500,h:500};const scale=Math.min(500/image.naturalWidth,500/image.naturalHeight);const w=image.naturalWidth*scale,h=image.naturalHeight*scale;return{x:(500-w)/2,y:(500-h)/2,w,h};},[image]);
  const themeStyle = {
    "--bg":colors.background,"--surface":colors.surface,"--fg":colors.foreground,"--muted":colors.muted,
    "--border":colors.border,"--selection":colors.selection,"--cursor":colors.cursor,
    "--accent":colors.primary,"--accent2":colors.secondary
  } as React.CSSProperties;

  function stagePoint(e:React.PointerEvent<SVGSVGElement>):InkPoint {
    const p=svg.current!.createSVGPoint();p.x=e.clientX;p.y=e.clientY;
    const matrix=svg.current!.getScreenCTM();const q=matrix?p.matrixTransform(matrix.inverse()):{x:0,y:0};
    return {x:clamp(q.x,0,500),y:clamp(q.y,0,500)};
  }
  function updateLayers(update:(current:Layer[])=>Layer[]) {
    setLayersByGlyph(current=>{const next=new Map(current);next.set(code,update(current.get(code)??[initialLayer]));return next;});
  }
  function upload(e:React.ChangeEvent<HTMLInputElement>) {
    const file=e.target.files?.[0];if(!file)return;
    const url=URL.createObjectURL(file),img=new Image();
    img.onload=()=>{if(imageUrl)URL.revokeObjectURL(imageUrl);setImage(img);setImageUrl(url);setImageVisible(true);const scale=Math.min(500/img.naturalWidth,500/img.naturalHeight),w=img.naturalWidth*scale,h=img.naturalHeight*scale;setCrop({x:(500-w)/2+w*.04,y:(500-h)/2+h*.04,w:w*.92,h:h*.92});setMode("draw");setMessage("Image added beneath the drawing layers. Draw over it or switch to Crop.");};
    img.onerror=()=>{URL.revokeObjectURL(url);setMessage("Could not read that image.");};
    img.src=url;e.target.value="";
  }
  function beginPointer(e:React.PointerEvent<SVGSVGElement>) {
    const p=stagePoint(e);
    if(mode==="crop"){
      const bounds=image?imageRect:{x:0,y:0,w:500,h:500};
      const q={x:clamp(p.x,bounds.x,bounds.x+bounds.w),y:clamp(p.y,bounds.y,bounds.y+bounds.h)};
      setCropDrag(q);setCrop({x:q.x,y:q.y,w:0,h:0});
    } else {
      const id=`stroke-${++strokeSequence.current}`;strokeId.current=id;
      const stroke:Stroke={id,points:[p],color:tool==="eraser"?"#ffffff":inkColor,size:penSize};
      updateLayers(current=>current.map(layer=>layer.id===activeLayer.id?{...layer,strokes:[...layer.strokes,stroke]}:layer));
    }
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function movePointer(e:React.PointerEvent<SVGSVGElement>) {
    const p=stagePoint(e);
    if(mode==="crop"&&cropDrag){
      const bounds=image?imageRect:{x:0,y:0,w:500,h:500};
      const q={x:clamp(p.x,bounds.x,bounds.x+bounds.w),y:clamp(p.y,bounds.y,bounds.y+bounds.h)};
      setCrop({x:Math.min(cropDrag.x,q.x),y:Math.min(cropDrag.y,q.y),w:Math.abs(q.x-cropDrag.x),h:Math.abs(q.y-cropDrag.y)});
    } else if(mode==="draw"&&strokeId.current){
      const id=strokeId.current;
      updateLayers(current=>current.map(layer=>layer.id===activeLayer.id?{...layer,strokes:layer.strokes.map(stroke=>stroke.id===id?{...stroke,points:[...stroke.points,p]}:stroke)}:layer));
    }
  }
  function endPointer(){strokeId.current=null;setCropDrag(null);}
  function addLayer(){
    const id=`layer-${++layerSequence.current}`;
    updateLayers(current=>[...current,{id,name:`Layer ${current.length}`,visible:true,strokes:[]}]);
    setActiveLayerId(id);setMode("draw");
  }
  function removeLayer(id:string){
    if(layers.length<=1)return;
    const next=layers.filter(layer=>layer.id!==id);
    updateLayers(()=>next);
    if(activeLayerId===id)setActiveLayerId(next[0].id);
  }
  async function reconstruct() {
    const bounds=image?crop:{x:0,y:0,w:500,h:500};
    if(bounds.w<4||bounds.h<4){setMessage("Select a larger crop.");return;}
    const size=1024,canvas=document.createElement("canvas");canvas.width=size;canvas.height=size;
    const context=canvas.getContext("2d");if(!context){setMessage("Canvas is unavailable.");return;}
    context.fillStyle="#ffffff";context.fillRect(0,0,size,size);
    const scale=Math.min(size/bounds.w,size/bounds.h),destW=bounds.w*scale,destH=bounds.h*scale,destX=(size-destW)/2,destY=(size-destH)/2;
    if(image&&imageVisible){
      const sourceX=(bounds.x-imageRect.x)/imageRect.w*image.naturalWidth,sourceY=(bounds.y-imageRect.y)/imageRect.h*image.naturalHeight,sourceW=bounds.w/imageRect.w*image.naturalWidth,sourceH=bounds.h/imageRect.h*image.naturalHeight;
      context.drawImage(image,sourceX,sourceY,sourceW,sourceH,destX,destY,destW,destH);
    }
    context.save();context.beginPath();context.rect(destX,destY,destW,destH);context.clip();
    context.setTransform(scale,0,0,scale,destX-bounds.x*scale,destY-bounds.y*scale);
    for(const layer of layers){
      if(!layer.visible)continue;
      for(const stroke of layer.strokes){
        if(!stroke.points.length)continue;
        context.strokeStyle=stroke.color;context.fillStyle=stroke.color;context.lineWidth=stroke.size;context.lineCap="round";context.lineJoin="round";
        if(stroke.points.length===1){context.beginPath();context.arc(stroke.points[0].x,stroke.points[0].y,stroke.size/2,0,Math.PI*2);context.fill();}
        else {context.beginPath();context.moveTo(stroke.points[0].x,stroke.points[0].y);for(const point of stroke.points.slice(1))context.lineTo(point.x,point.y);context.stroke();}
      }
    }
    context.restore();context.setTransform(1,0,0,1,0,0);
    const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/png"));
    if(!blob){setMessage("Could not encode the visible canvas.");return;}
    try {
      setMessage("CV is analyzing the visible black-and-white composite…");
      const traced=await traceGlyphImage(new Uint8Array(await blob.arrayBuffer()),code,threshold,profile);
      setDrawings(old=>{const next=new Map(old);next.set(code,traced.contours);return next;});
      setAdvances(old=>{const next=new Map(old);next.set(code,traced.advanceWidth);return next;});
      const segments=traced.contours.reduce((sum,contour)=>sum+contour.length-1,0);
      setMessage(`img2bez reconstructed ${traced.contours.length} contour(s) and ${segments} structural segments from the visible layers.`);
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
    const data={format:"plasticine-project",version:3,family,glyphs:[...new Set([...drawings.keys(),...layersByGlyph.keys()])].map(unicode=>({unicode,contours:drawings.get(unicode)??[],advanceWidth:advances.get(unicode)??700,layers:layersByGlyph.get(unicode)??[initialLayer]}))};
    const url=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:"application/json"})),a=document.createElement("a");
    a.href=url;a.download="plasticine.json";a.click();URL.revokeObjectURL(url);
  }
  function importProject(e:React.ChangeEvent<HTMLInputElement>) {
    const file=e.target.files?.[0];if(!file)return;
    file.text().then(text=>{const data=JSON.parse(text);if(data.format!=="plasticine-project"||!Array.isArray(data.glyphs))throw Error("Invalid Plasticine project");const glyphs=data.glyphs as SavedGlyph[];setDrawings(new Map<number,Point[][]>(glyphs.map(g=>[g.unicode,g.contours??[]] as [number,Point[][]])));setAdvances(new Map<number,number>(glyphs.map(g=>[g.unicode,g.advanceWidth??700] as [number,number])));setLayersByGlyph(new Map<number,Layer[]>(glyphs.filter(g=>g.layers?.length).map(g=>[g.unicode,g.layers!] as [number,Layer[]])));setActiveLayerId("ink");setFamily(data.family||"Plasticine");setMessage("Project imported.");}).catch(error=>setMessage(String(error)));e.target.value="";
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
    <nav className="glyphs" aria-label="Glyphs">{chars.map(char=><button key={char} className={code===char.charCodeAt(0)?"selected":""} onClick={()=>{setCode(char.charCodeAt(0));setActiveLayerId("ink");setMessage("Edit this glyph's layers or import a source image.");}}>{char}{(drawings.has(char.charCodeAt(0))||(layersByGlyph.get(char.charCodeAt(0))??[]).some(layer=>layer.strokes.length>0))&&<i/>}</button>)}</nav>
    <main>
      <section className="workspace">
        <div className="stagebar"><strong>{String.fromCharCode(code)}</strong><span>{mode==="draw"?"DRAW CANVAS":"CROP SOURCE"}</span><div className="modeSwitch"><button className={mode==="draw"?"active":""} onClick={()=>setMode("draw")}>Draw</button><button className={mode==="crop"?"active":""} onClick={()=>setMode("crop")}>Crop</button></div><button onClick={reconstruct}>Reconstruct visible layers</button></div>
        <div className="stage">
          <svg ref={svg} viewBox="0 0 500 500" onPointerDown={beginPointer} onPointerMove={movePointer} onPointerUp={endPointer} onPointerCancel={endPointer} onLostPointerCapture={endPointer}>
            <rect width="500" height="500" fill="#ffffff"/>
            {image&&imageVisible&&<image href={imageUrl} x="0" y="0" width="500" height="500" preserveAspectRatio="xMidYMid meet"/>}
            {layers.filter(layer=>layer.visible).flatMap(layer=>layer.strokes.map(stroke=><g key={stroke.id} pointerEvents="none"><path d={strokePath(stroke.points)} fill="none" stroke={stroke.color} strokeWidth={stroke.size} strokeLinecap="round" strokeLinejoin="round"/>{stroke.points.length===1&&<circle cx={stroke.points[0].x} cy={stroke.points[0].y} r={stroke.size/2} fill={stroke.color}/>}</g>))}
            {!image&&!layers.some(layer=>layer.strokes.length)&&<text x="250" y="245" textAnchor="middle" fill="#777" fontSize="13">Draw a glyph here</text>}
            {mode==="crop"&&<><path d={`M0 0H500V500H0Z M${crop.x} ${crop.y}h${crop.w}v${crop.h}h-${crop.w}Z`} fill="#000" fillOpacity=".48" fillRule="evenodd" pointerEvents="none"/><rect x={crop.x} y={crop.y} width={crop.w} height={crop.h} fill="none" stroke="#d4a900" strokeWidth="2" pointerEvents="none"/></>}
            {mode==="draw"&&<rect x="0" y="0" width="500" height="500" fill="none" stroke="#888" strokeOpacity=".35" strokeWidth="1" pointerEvents="none"/>}
          </svg>
        </div>
        <div className="message">{message}</div>
      </section>
      <aside>
        <section className="tools">
          <div className="toolrow"><button className={tool==="pen"?"active":""} onClick={()=>setTool("pen")}>Pen</button><button className={tool==="eraser"?"active":""} onClick={()=>setTool("eraser")}>Eraser</button></div>
          <label>Ink color</label><div className="swatches"><button aria-label="Black ink" className={inkColor==="#000000"?"chosen":""} onClick={()=>{setInkColor("#000000");setTool("pen");}}><i className="blackSwatch"/></button><button aria-label="White ink" className={inkColor==="#ffffff"?"chosen":""} onClick={()=>{setInkColor("#ffffff");setTool("pen");}}><i className="whiteSwatch"/></button></div>
          <label>Brush size <output>{penSize}</output></label><input type="range" min="1" max="64" value={penSize} onChange={e=>setPenSize(+e.target.value)}/>
          <label className="checkrow"><input type="checkbox" checked={imageVisible} disabled={!image} onChange={e=>setImageVisible(e.target.checked)}/> Show source image</label>
        </section>
        <section className="layersPanel">
          <div className="panelTitle"><label>Layers</label><button onClick={addLayer}>+ Layer</button></div>
          {layers.map(layer=><div className={activeLayer.id===layer.id?"layer activeLayer":"layer"} key={layer.id}>
            <button className="visibility" aria-label={layer.visible?"Hide layer":"Show layer"} onClick={()=>updateLayers(current=>current.map(v=>v.id===layer.id?{...v,visible:!v.visible}:v))}>{layer.visible?"◉":"○"}</button>
            <button className="layerName" onClick={()=>setActiveLayerId(layer.id)}>{layer.name}</button>
            <span className="layerCount">{layer.strokes.length}</span>
            <button className="removeLayer" aria-label="Delete layer" disabled={layers.length<=1} onClick={()=>removeLayer(layer.id)}>×</button>
          </div>)}
        </section>
        <section>
          <label>CV source profile</label>
          <select className="textinput" value={profile} onChange={e=>setProfile(e.target.value as "wild"|"clean"|"photo")}><option value="wild">Wild / unknown raster</option><option value="clean">Clean font render</option><option value="photo">Photo / printed scan</option></select>
          <label>Threshold <output>{threshold}</output></label><input type="range" min="0" max="255" value={threshold} onChange={e=>setThreshold(+e.target.value)}/>
          <label>Curve tension <output>{tension.toFixed(2)}</output></label><input type="range" min="0" max="1.5" step=".05" value={tension} onChange={e=>setTension(+e.target.value)}/>
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
