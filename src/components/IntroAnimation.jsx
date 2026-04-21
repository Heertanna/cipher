import { useEffect, useRef, useState } from "react";

export function IntroAnimation({ onComplete }) {
  const canvasRef = useRef(null);
  const [fadeOut, setFadeOut] = useState(false);
  const fadeScheduledRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!fadeOut) return;
    const id = window.setTimeout(() => {
      onCompleteRef.current();
    }, 800);
    return () => window.clearTimeout(id);
  }, [fadeOut]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let W, H, raf, af = 0;

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    const C_RAW = [
      {x:150,y:19},{x:108,y:0},{x:74,y:0},{x:108,y:190},{x:74,y:190},
      {x:169,y:38},{x:131,y:38},{x:150,y:57},
      {x:146,y:126},{x:165,y:145},{x:127,y:145},{x:146,y:164},
      {x:33,y:19},{x:52,y:38},{x:14,y:38},{x:0,y:81},
      {x:0,y:112},{x:33,y:57},
      {x:38,y:126},{x:57,y:145},{x:19,y:145},{x:38,y:164},
    ];
    const C_ORDER = [2,3,1,0,14,12,13,15,17,16,18,20,21,4,5,6,7,8,9,10,11];

    const HB_RAW_SORTED = [
      {x:80,y:638},{x:99,y:610},{x:122,y:638},{x:144,y:618},
      {x:167,y:636},{x:176,y:598},{x:192,y:565},{x:203,y:536},
      {x:227,y:565},{x:236,y:598},{x:251,y:628},
      {x:282,y:629},{x:288,y:661},{x:298,y:695},
      {x:308,y:731},{x:318,y:765},{x:328,y:800},
      {x:345,y:765},{x:347,y:731},
      {x:355,y:695},{x:357,y:659},{x:362,y:623},{x:367,y:590},
      {x:374,y:556},{x:381,y:520},{x:391,y:482},
      {x:406,y:520},{x:413,y:555},{x:418,y:590},{x:425,y:623},
      {x:451,y:623},{x:470,y:598},{x:483,y:566},
      {x:496,y:598},{x:509,y:623},
    ];

    function easeInOut(t) {
      return t < 0.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1;
    }

    function getHBTransform() {
      const minX=80, maxX=528, minY=482, maxY=819;
      const hbW=maxX-minX, hbH=maxY-minY;
      const scale=Math.min(W*0.78/hbW, H*0.52/hbH);
      const offX=W/2-(hbW/2)*scale-minX*scale;
      const offY=H/2-(hbH/2)*scale-minY*scale;
      return {scale, offX, offY};
    }

    function getCTransform() {
      const scale=Math.min(W,H)/420;
      const offX=W/2-(188/2)*scale;
      const offY=H/2-(209/2)*scale;
      return {scale, offX, offY};
    }

    function build() {
      const ct=getCTransform();
      const ht=getHBTransform();
      const sz=19*ct.scale;
      const hbSz=19*ht.scale;
      const N=HB_RAW_SORTED.length;

      return HB_RAW_SORTED.map((hb,i)=>{
        const ex=ht.offX+hb.x*ht.scale;
        const ey=ht.offY+hb.y*ht.scale;
        const ci=Math.round((i/(N-1))*(C_ORDER.length-1));
        const cr=C_RAW[C_ORDER[ci]];
        const tx=ct.offX+cr.x*ct.scale;
        const ty=ct.offY+cr.y*ct.scale;
        return {
          tx, ty, ex, ey, sz: hbSz,
          x: W/2+(Math.random()-0.5)*W*0.9,
          y: H/2+(Math.random()-0.5)*H*0.9,
          alpha:0,
          delay:Math.round((i/(N-1))*55),
          scattered:false, dvx:0, dvy:0, dsx:0, dsy:0,
        };
      });
    }

    let pixels = build();

    function tick() {
      ctx.clearRect(0,0,W,H);
      af++;

      // PHASE 1: assemble into C (0-115)
      if (af<=115) {
        pixels.forEach(p=>{
          if (af<p.delay) return;
          p.x+=(p.tx-p.x)*0.11; p.y+=(p.ty-p.y)*0.11;
          p.alpha=Math.min(1,p.alpha+0.05);
          const dist=Math.hypot(p.x-p.tx,p.y-p.ty);
          const frac=Math.max(0,1-dist/100);
          const r=Math.round(255+(181-255)*frac);
          const g=Math.round(255+(236-255)*frac);
          const b=Math.round(255+(52-255)*frac);
          ctx.fillStyle=`rgba(${r},${g},${b},${p.alpha})`;
          ctx.fillRect(Math.round(p.x),Math.round(p.y),Math.round(p.sz),Math.round(p.sz));
        });
      }

      // PHASE 2: C shimmer (115-170)
      else if (af<=170) {
        const ht2=(af-115)/55;
        const sh=(ht2*1.5*pixels.length)%pixels.length;
        pixels.forEach((p,i)=>{
          const d=Math.min(Math.abs(i-sh),pixels.length-Math.abs(i-sh));
          const shimmer=Math.max(0,1-d/3.5);
          const base=0.65+0.2*Math.sin(ht2*Math.PI*3+i*0.4);
          const alpha=Math.min(1,base+shimmer*0.4);
          const wr=Math.min(255,181+Math.round(shimmer*74));
          const wg=Math.min(255,236+Math.round(shimmer*19));
          const wb=Math.round(52+shimmer*200);
          ctx.fillStyle=`rgba(${wr},${wg},${wb},${alpha})`;
          ctx.fillRect(Math.round(p.tx),Math.round(p.ty),Math.round(p.sz),Math.round(p.sz));
        });
      }

      // PHASE 3: morph C → heartbeat (170-260)
      else if (af<=260) {
        const t=easeInOut((af-170)/90);
        pixels.forEach(p=>{
          const x=p.tx+(p.ex-p.tx)*t;
          const y=p.ty+(p.ey-p.ty)*t;
          const brightness=1+Math.sin(t*Math.PI)*0.3;
          const r=Math.min(255,Math.round(181*brightness));
          const g=Math.min(255,Math.round(236*brightness));
          const b=Math.min(255,Math.round(52*brightness));
          ctx.fillStyle=`rgba(${r},${g},${b},0.9)`;
          ctx.fillRect(Math.round(x),Math.round(y),Math.round(p.sz),Math.round(p.sz));
        });
      }

      // PHASE 4: HB shimmer wave (260-350)
      else if (af<=350) {
        const ht2=(af-260)/90;
        const sh=ht2*pixels.length*1.3;
        pixels.forEach((p,i)=>{
          const d=Math.abs(i-sh);
          const shimmer=Math.max(0,1-d/4);
          const base=0.6+0.2*Math.sin(ht2*Math.PI*3+i*0.2);
          const alpha=Math.min(1,base+shimmer*0.5);
          const wr=Math.min(255,181+Math.round(shimmer*74));
          const wg=Math.min(255,236+Math.round(shimmer*19));
          const wb=Math.round(52+shimmer*200);
          ctx.fillStyle=`rgba(${wr},${wg},${wb},${alpha})`;
          ctx.fillRect(Math.round(p.ex),Math.round(p.ey),Math.round(p.sz),Math.round(p.sz));
        });
        if (af<295) {
          const rp=(af-260)/35;
          const sp=pixels[25];
          if(sp){
            [90,55].forEach((maxR,ri)=>{
              ctx.beginPath();
              ctx.arc(sp.ex+sp.sz/2,sp.ey+sp.sz/2,rp*maxR,0,Math.PI*2);
              ctx.strokeStyle=`rgba(${ri===0?'181,236,52':'255,255,200'},${(ri===0?0.5:0.25)*(1-rp)})`;
              ctx.lineWidth=ri===0?1.5:1; ctx.stroke();
            });
          }
        }
      }

      // PHASE 5: scatter (350-400)
      else if (af<=400) {
        const prog=(af-350)/50;
        pixels.forEach(p=>{
          if (!p.scattered){
            p.scattered=true;
            const a=Math.atan2(p.ey-H/2,p.ex-W/2)+(Math.random()-0.5)*0.8;
            const spd=3+Math.random()*10;
            p.dvx=Math.cos(a)*spd; p.dvy=Math.sin(a)*spd;
            p.dsx=p.ex; p.dsy=p.ey;
          }
          p.dsx+=p.dvx; p.dsy+=p.dvy; p.dvx*=1.07; p.dvy*=1.07;
          ctx.fillStyle=`rgba(181,236,52,${Math.max(0,1-prog*1.8)})`;
          ctx.fillRect(Math.round(p.dsx),Math.round(p.dsy),Math.round(p.sz),Math.round(p.sz));
        });
      }

      // After scatter: fade wrapper (handled in React); stop canvas loop
      else {
        if (!fadeScheduledRef.current) {
          fadeScheduledRef.current = true;
          setFadeOut(true);
        }
        return;
      }

      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "#0d0d0d",
        opacity: fadeOut ? 0 : 1,
        transition: fadeOut ? "opacity 0.8s ease" : "none",
      }}
    >
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0 }} />
    </div>
  );
}
