import { describe, expect, it } from "vitest";
import { traceBitmap } from "../src/core/trace";

describe("bitmap contour tracing", () => {
  it("traces a filled rectangle as one closed contour", () => {
    const width=8,height=7,mask=new Uint8Array(width*height);
    for(let y=1;y<6;y++)for(let x=2;x<7;x++)mask[y*width+x]=1;
    const contours=traceBitmap(mask,width,height);
    expect(contours).toHaveLength(1);
    expect(contours[0][0]).toEqual(contours[0][contours[0].length-1]);
    expect(contours[0].length).toBe(21);
  });
  it("preserves a counter as a second oppositely wound contour", () => {
    const width=9,height=9,mask=new Uint8Array(width*height);
    for(let y=1;y<8;y++)for(let x=1;x<8;x++)mask[y*width+x]=1;
    for(let y=3;y<6;y++)for(let x=3;x<6;x++)mask[y*width+x]=0;
    const contours=traceBitmap(mask,width,height);
    expect(contours).toHaveLength(2);
    const area=(points:{x:number;y:number}[])=>points.slice(0,-1).reduce((sum,p,i)=>sum+p.x*points[i+1].y-points[i+1].x*p.y,0)/2;
    expect(Math.sign(area(contours[0]))).not.toBe(Math.sign(area(contours[1])));
  });
  it("rejects a mask with inconsistent dimensions", () => {
    expect(()=>traceBitmap(new Uint8Array(2),3,3)).toThrow();
  });
});
