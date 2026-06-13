import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameTime } from "@/context/GameTimeContext";

const CEIL_H = 4.5;

const FLOOR_VERT = `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
`;
const FLOOR_FRAG = `
  varying vec2 vUv;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float sn(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
  void main(){
    vec2 uv=vUv*vec2(14.0,10.0);
    float pw=0.9; float pid=floor(uv.x/pw);
    float po=hash(vec2(pid,0.0))*0.55;
    float lx=fract((uv.x/pw)+po);
    float g=sn(vec2(lx*3.0,uv.y*0.28))*0.45+sn(vec2(lx*7.0,uv.y*0.55+1.7))*0.30+(sin((uv.y+sin(lx*5.0)*0.35)*20.0)*0.5+0.5)*0.25;
    float pv=hash(vec2(pid*7.3,13.7))*0.13;
    vec3 dw=vec3(0.54+pv,0.38+pv*0.5,0.22+pv*0.3);
    vec3 lw=vec3(0.78+pv,0.60+pv*0.5,0.38+pv*0.3);
    vec3 c=mix(dw,lw,g);
    float gx=smoothstep(0.95,1.0,lx)+smoothstep(0.95,1.0,1.0-lx);
    float gy=step(0.96,fract(uv.y*0.3));
    c-=(gx+gy)*vec3(0.07,0.05,0.03);
    c+=smoothstep(0.35,0.85,g)*0.09;
    gl_FragColor=vec4(c,1.0);
  }
`;

const CARPET_FRAG = `
  varying vec2 vUv;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  void main(){
    vec2 uv=vUv*40.0;
    float n=hash(floor(uv))*0.15;
    gl_FragColor=vec4(0.18+n,0.20+n,0.30+n,1.0);
  }
`;

function Plant({ pos, scale=1.0 }: { pos:[number,number,number]; scale?:number }) {
  return (
    <group position={pos} scale={[scale,scale,scale]}>
      <mesh position={[0,0.22,0]} castShadow>
        <cylinderGeometry args={[0.2,0.15,0.44,10]}/>
        <meshLambertMaterial color="#9a6840"/>
      </mesh>
      <mesh position={[0,0.44,0]}>
        <cylinderGeometry args={[0.195,0.195,0.02,10]}/>
        <meshLambertMaterial color="#2e1e0e"/>
      </mesh>
      <mesh position={[0,0.72,0]} castShadow>
        <cylinderGeometry args={[0.028,0.038,0.6,6]}/>
        <meshLambertMaterial color="#4a3020"/>
      </mesh>
      {[[0,1.18,0,0.38,0.30,0.38],[-0.2,0.98,0.12,0.24,0.30,0.24],[0.22,1.02,-0.10,0.22,0.28,0.22],
        [0.12,1.06,0.20,0.20,0.26,0.20],[-0.15,1.00,-0.16,0.18,0.24,0.18]].map(([lx,ly,lz,rx,ry,rz],i)=>(
        <mesh key={i} position={[lx,ly,lz] as [number,number,number]} scale={[rx,ry,rz]} rotation={[0.3,i*1.1,0.2]} castShadow>
          <sphereGeometry args={[1,8,6]}/>
          <meshLambertMaterial color={i===0?'#2a5a1c':i%2===0?'#38681e':'#1e4812'}/>
        </mesh>
      ))}
    </group>
  );
}

function LargePlant({ pos }: { pos:[number,number,number] }) {
  return (
    <group position={pos}>
      <mesh position={[0,0.35,0]} castShadow>
        <cylinderGeometry args={[0.32,0.22,0.70,12]}/>
        <meshLambertMaterial color="#7a5030"/>
      </mesh>
      <mesh position={[0,0.72,0]}>
        <cylinderGeometry args={[0.05,0.06,0.80,6]}/>
        <meshLambertMaterial color="#3a1e08"/>
      </mesh>
      {[[0,1.6,0,0.60,0.50,0.60],[-0.35,1.3,0.2,0.36,0.45,0.36],[0.38,1.35,-0.18,0.34,0.42,0.34],
        [0.15,1.2,0.35,0.28,0.38,0.28],[-0.28,1.2,-0.28,0.26,0.35,0.26],
        [0,1.05,0.38,0.22,0.30,0.22],[0.30,1.08,-0.30,0.20,0.28,0.20]].map(([lx,ly,lz,rx,ry,rz],i)=>(
        <mesh key={i} position={[lx,ly,lz] as [number,number,number]} scale={[rx,ry,rz]} rotation={[0.2,i*0.9,0.15]} castShadow>
          <sphereGeometry args={[1,8,6]}/>
          <meshLambertMaterial color={i===0?'#1e5218':i%2===0?'#2a7030':'#154010'}/>
        </mesh>
      ))}
    </group>
  );
}

function GlassWall({ x, z1, z2, axis="x" }: { x:number; z1:number; z2:number; axis?:"x"|"z" }) {
  const len = Math.abs(z2-z1);
  const mid = (z1+z2)/2;
  const frames = Math.floor(len/2.4);
  return (
    <group>
      {axis === "x" ? (
        <>
          <mesh position={[x, CEIL_H/2, mid]} castShadow>
            <boxGeometry args={[0.08, CEIL_H, len]}/>
            <meshLambertMaterial color="#1a1a2a" transparent opacity={0.9}/>
          </mesh>
          <mesh position={[x, CEIL_H/2, mid]}>
            <boxGeometry args={[0.04, CEIL_H-0.12, len-0.08]}/>
            <meshPhysicalMaterial roughness={0.02} metalness={0.0} color="#a8d4f5" transparent opacity={0.18}/>
          </mesh>
          {Array.from({length:frames},(_,i)=>(
            <mesh key={i} position={[x, CEIL_H/2, z1+1.2+(i*2.4)]}>
              <boxGeometry args={[0.1,CEIL_H,0.06]}/>
              <meshLambertMaterial color="#2a2a3a"/>
            </mesh>
          ))}
          <mesh position={[x, 0.025, mid]}>
            <boxGeometry args={[0.12, 0.05, len]}/>
            <meshLambertMaterial color="#1e1e2e"/>
          </mesh>
          <mesh position={[x, CEIL_H-0.025, mid]}>
            <boxGeometry args={[0.12, 0.05, len]}/>
            <meshLambertMaterial color="#1e1e2e"/>
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[mid, CEIL_H/2, x]} castShadow>
            <boxGeometry args={[len, CEIL_H, 0.08]}/>
            <meshLambertMaterial color="#1a1a2a" transparent opacity={0.9}/>
          </mesh>
          <mesh position={[mid, CEIL_H/2, x]}>
            <boxGeometry args={[len-0.08, CEIL_H-0.12, 0.04]}/>
            <meshPhysicalMaterial roughness={0.02} metalness={0.0} color="#a8d4f5" transparent opacity={0.18}/>
          </mesh>
          {Array.from({length:frames},(_,i)=>(
            <mesh key={i} position={[z1+1.2+(i*2.4), CEIL_H/2, x]}>
              <boxGeometry args={[0.06,CEIL_H,0.1]}/>
              <meshLambertMaterial color="#2a2a3a"/>
            </mesh>
          ))}
          <mesh position={[mid, 0.025, x]}>
            <boxGeometry args={[len, 0.05, 0.12]}/>
            <meshLambertMaterial color="#1e1e2e"/>
          </mesh>
        </>
      )}
    </group>
  );
}

function FloorToWindowWall({ x, z1, z2 }: { x:number; z1:number; z2:number }) {
  const len = Math.abs(z2-z1);
  const mid = (z1+z2)/2;
  const panes = Math.ceil(len/3.0);
  return (
    <group>
      {Array.from({length:panes},(_,i)=>{
        const pz = z1 + i*3.0 + 1.5;
        return (
          <group key={i} position={[x, 0, pz]}>
            <mesh position={[0, CEIL_H/2, 0]}>
              <boxGeometry args={[0.05, CEIL_H, 2.85]}/>
              <meshPhysicalMaterial roughness={0.02} color="#b0d8f0" transparent opacity={0.22} metalness={0.05}/>
            </mesh>
            <mesh position={[0, CEIL_H/2-0.02, -1.425]}>
              <boxGeometry args={[0.1,CEIL_H,0.1]}/>
              <meshLambertMaterial color="#1a1a2a"/>
            </mesh>
            <mesh position={[0, CEIL_H/2-0.02, 1.425]}>
              <boxGeometry args={[0.1,CEIL_H,0.1]}/>
              <meshLambertMaterial color="#1a1a2a"/>
            </mesh>
            <mesh position={[0,CEIL_H-0.05,0]}>
              <boxGeometry args={[0.15,0.12,2.9]}/>
              <meshLambertMaterial color="#111118"/>
            </mesh>
            <mesh position={[0,0.05,0]}>
              <boxGeometry args={[0.15,0.12,2.9]}/>
              <meshLambertMaterial color="#111118"/>
            </mesh>
          </group>
        );
      })}
      <mesh position={[x, CEIL_H/2, mid]}>
        <boxGeometry args={[0.15, 0.12, len]}/>
        <meshLambertMaterial color="#111118"/>
      </mesh>
    </group>
  );
}

function MeetingRoom({ position, accent }: { position:[number,number,number]; accent:string }) {
  const [rx,ry,rz] = position;
  const W=8.5; const D=9.5;
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,0,0]} receiveShadow>
        <planeGeometry args={[W,D]}/>
        <meshLambertMaterial color="#2a2a3a"/>
      </mesh>
      <mesh rotation={[Math.PI/2,0,0]} position={[0,CEIL_H,0]}>
        <planeGeometry args={[W+0.2,D+0.2]}/>
        <meshLambertMaterial color="#f0eee9"/>
      </mesh>
      <mesh position={[0,CEIL_H/2,D/2]}>
        <planeGeometry args={[W,CEIL_H]}/>
        <meshLambertMaterial color="#e8e4de"/>
      </mesh>
      <mesh position={[W/2,CEIL_H/2,0]} rotation={[0,-Math.PI/2,0]}>
        <planeGeometry args={[D,CEIL_H]}/>
        <meshLambertMaterial color="#f0ede8"/>
      </mesh>
      <mesh position={[-W/2,CEIL_H/2,0]} rotation={[0,Math.PI/2,0]}>
        <planeGeometry args={[D,CEIL_H]}/>
        <meshLambertMaterial color="#eceae5"/>
      </mesh>
      <mesh position={[0, CEIL_H/2, -D/2+0.02]}>
        <planeGeometry args={[W,CEIL_H]}/>
        <meshLambertMaterial color="#e8e4de"/>
      </mesh>
      <group position={[0,0.82,0]}>
        <mesh castShadow>
          <boxGeometry args={[5.5,0.09,2.2]}/>
          <meshLambertMaterial color="#c8a870"/>
        </mesh>
        <mesh position={[0,0.045,0]}>
          <boxGeometry args={[5.6,0.04,2.3]}/>
          <meshLambertMaterial color="#a88050"/>
        </mesh>
        {[[-2.4,-0.85],[2.4,-0.85],[-2.4,0.85],[2.4,0.85],[-0.8,-0.85],[0.8,-0.85],[-0.8,0.85],[0.8,0.85]].map(([lx,lz],i)=>(
          <mesh key={i} position={[lx,-0.42,lz] as [number,number,number]} castShadow>
            <boxGeometry args={[0.07,0.84,0.07]}/>
            <meshLambertMaterial color="#5a5a6a"/>
          </mesh>
        ))}
      </group>
      {[[-1.8,-1.3],[0,-1.3],[1.8,-1.3],[-1.8,1.3],[0,1.3],[1.8,1.3]].map(([cx,cz],i)=>(
        <group key={i} position={[cx,0,cz] as [number,number,number]}>
          <mesh position={[0,0.46,0]} castShadow>
            <boxGeometry args={[0.46,0.06,0.46]}/>
            <meshLambertMaterial color="#2a3448"/>
          </mesh>
          <mesh position={[0,0.49,0]}>
            <boxGeometry args={[0.42,0.04,0.42]}/>
            <meshLambertMaterial color={accent}/>
          </mesh>
          <mesh position={[0,0.72,cz>0?0.21:-0.21]} castShadow>
            <boxGeometry args={[0.44,0.40,0.07]}/>
            <meshLambertMaterial color="#2a3448"/>
          </mesh>
          <mesh position={[0,0.22,0]}>
            <cylinderGeometry args={[0.025,0.025,0.44,6]}/>
            <meshLambertMaterial color="#444455"/>
          </mesh>
        </group>
      ))}
      <mesh position={[-1.5,0.84,0]}>
        <boxGeometry args={[0.38,0.01,0.28]}/>
        <meshLambertMaterial color="#0a0a14"/>
      </mesh>
      <mesh position={[-1.5,0.97,-0.12]} rotation={[-0.50,0,0]}>
        <boxGeometry args={[0.38,0.26,0.01]}/>
        <meshLambertMaterial color="#0a0a14" emissive={accent} emissiveIntensity={0.22}/>
      </mesh>
      <mesh position={[1.5,0.84,0]}>
        <boxGeometry args={[0.38,0.01,0.28]}/>
        <meshLambertMaterial color="#0a0a14"/>
      </mesh>
      <mesh position={[1.5,0.97,-0.12]} rotation={[-0.50,0,0]}>
        <boxGeometry args={[0.38,0.26,0.01]}/>
        <meshLambertMaterial color="#0a0a14" emissive={accent} emissiveIntensity={0.22}/>
      </mesh>
      {[[-2.5,3.8,-D/2+0.05],[-2.5,3.8,-D/2+0.05]].slice(0,1).map(([lx,ly,lz],i)=>(
        <mesh key={i} position={[lx,ly,lz] as [number,number,number]}>
          <boxGeometry args={[3.0,0.5,0.05]}/>
          <meshLambertMaterial color={accent} emissive={accent} emissiveIntensity={0.45} transparent opacity={0.9}/>
        </mesh>
      ))}
      {[[-3.5,3.2,-D/2+0.05],[3.5,3.2,-D/2+0.05]].map(([lx,ly,lz],i)=>(
        <mesh key={i} position={[lx,ly,lz] as [number,number,number]}>
          <boxGeometry args={[1.4,0.9,0.04]}/>
          <meshLambertMaterial color={i===0?'#1a3a6a':'#1a4a3a'} emissive={i===0?'#2040a0':'#20a040'} emissiveIntensity={0.18}/>
        </mesh>
      ))}
      {[[-1.5,3.5,-D/2+0.07],[0,3.5,-D/2+0.07],[1.5,3.5,-D/2+0.07]].map(([lx,ly,lz],i)=>(
        <mesh key={i} position={[lx,ly,lz] as [number,number,number]}>
          <boxGeometry args={[0.1,0.04,2.2]}/>
          <meshLambertMaterial color="#fffff0" emissive="#fffde0" emissiveIntensity={1.0}/>
        </mesh>
      ))}
    </group>
  );
}

function ReceptionLobby({ accent }: { accent:string }) {
  return (
    <group>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.001,13.5]} receiveShadow>
        <planeGeometry args={[30,7]}/>
        <meshLambertMaterial color="#e8e5de"/>
      </mesh>
      <mesh rotation={[Math.PI/2,0,0]} position={[0,CEIL_H,13.5]}>
        <planeGeometry args={[30.2,7.2]}/>
        <meshLambertMaterial color="#f5f2ee"/>
      </mesh>
      <mesh position={[0,CEIL_H/2,17]} castShadow>
        <planeGeometry args={[30,CEIL_H]}/>
        <meshLambertMaterial color="#e0ddd8"/>
      </mesh>
      <mesh position={[-15,CEIL_H/2,13.5]} rotation={[0,Math.PI/2,0]}>
        <planeGeometry args={[7,CEIL_H]}/>
        <meshLambertMaterial color="#e8e4df"/>
      </mesh>
      <mesh position={[15,CEIL_H/2,13.5]} rotation={[0,-Math.PI/2,0]}>
        <planeGeometry args={[7,CEIL_H]}/>
        <meshLambertMaterial color="#e8e4df"/>
      </mesh>

      <mesh position={[0,2.2,16.95]}>
        <boxGeometry args={[8,1.2,0.08]}/>
        <meshLambertMaterial color="#0a0a1a" emissive={accent} emissiveIntensity={0.55} transparent opacity={0.95}/>
      </mesh>
      <mesh position={[-5,3.0,16.95]}>
        <boxGeometry args={[4.5,0.6,0.06]}/>
        <meshLambertMaterial color="#1a1a2a" emissive={accent} emissiveIntensity={0.22} transparent opacity={0.8}/>
      </mesh>
      <mesh position={[5,3.0,16.95]}>
        <boxGeometry args={[4.5,0.6,0.06]}/>
        <meshLambertMaterial color="#1a1a2a" emissive={accent} emissiveIntensity={0.22} transparent opacity={0.8}/>
      </mesh>

      <group position={[0,0,12]}>
        <mesh position={[0,0.52,0]} castShadow>
          <boxGeometry args={[3.8,1.04,1.0]}/>
          <meshLambertMaterial color="#2a2a3a"/>
        </mesh>
        <mesh position={[0,1.06,0]} castShadow>
          <boxGeometry args={[4.0,0.08,1.1]}/>
          <meshLambertMaterial color="#e0e0e8"/>
        </mesh>
        <mesh position={[0,1.1,-0.1]}>
          <boxGeometry args={[1.4,0.22,0.01]}/>
          <meshLambertMaterial color="#0a1628" emissive={accent} emissiveIntensity={0.55}/>
        </mesh>
        <mesh position={[0,0.88,-0.52]}>
          <boxGeometry args={[0.30,0.24,0.02]}/>
          <meshLambertMaterial color="#0a1020" emissive="#304060" emissiveIntensity={0.4}/>
        </mesh>
        <mesh position={[-0.8,1.02,-0.35]}>
          <cylinderGeometry args={[0.05,0.04,0.12,8]}/>
          <meshLambertMaterial color="#e0ddd8"/>
        </mesh>
        <mesh position={[-0.8,1.09,-0.35]}>
          <cylinderGeometry args={[0.05,0.05,0.015,8]}/>
          <meshLambertMaterial color="#5a3010"/>
        </mesh>
      </group>

      {[[-8,0,14.5],[8,0,14.5],[-8,0,16],[8,0,16]].map(([sx,sy,sz],i)=>(
        <group key={i} position={[sx,sy,sz] as [number,number,number]}>
          <mesh position={[0,0.22,0]} castShadow>
            <boxGeometry args={[1.4,0.44,0.7]}/>
            <meshLambertMaterial color="#2a3040"/>
          </mesh>
          <mesh position={[0,0.46,0]}>
            <boxGeometry args={[1.4,0.04,0.72]}/>
            <meshLambertMaterial color={accent} transparent opacity={0.8}/>
          </mesh>
          <mesh position={[0,0.26,-0.38]} castShadow>
            <boxGeometry args={[1.4,0.52,0.07]}/>
            <meshLambertMaterial color="#222832"/>
          </mesh>
        </group>
      ))}

      {[[-6,0,15.5],[6,0,15.5]].map(([sx,sy,sz],i)=>(
        <group key={i} position={[sx,sy,sz] as [number,number,number]}>
          <mesh position={[0,0.38,0]} castShadow>
            <boxGeometry args={[1.6,0.76,0.8]}/>
            <meshLambertMaterial color="#1e2838"/>
          </mesh>
          <mesh position={[0,0.76,0]}>
            <boxGeometry args={[0.55,0.02,0.55]}/>
            <meshLambertMaterial color="#3a3a4a"/>
          </mesh>
        </group>
      ))}

      {[[-11,0,15],[11,0,15]].map((p,i)=>(<Plant key={i} pos={p as [number,number,number]} scale={1.15}/>))}
      {[[-13,0,14],[13,0,14]].map((p,i)=>(<LargePlant key={i} pos={p as [number,number,number]}/>))}

      {[[-10,CEIL_H-0.04,12],[0,CEIL_H-0.04,12],[10,CEIL_H-0.04,12],
        [-10,CEIL_H-0.04,15],[0,CEIL_H-0.04,15],[10,CEIL_H-0.04,15]].map(([lx,ly,lz],i)=>(
        <mesh key={i} position={[lx,ly,lz] as [number,number,number]}>
          <boxGeometry args={[0.18,0.04,3.0]}/>
          <meshLambertMaterial color="#fffff4" emissive="#fffde0" emissiveIntensity={0.85}/>
        </mesh>
      ))}
    </group>
  );
}

function BreakRoom({ accent }: { accent:string }) {
  return (
    <group>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.001,-13.5]} receiveShadow>
        <planeGeometry args={[18,7]}/>
        <meshLambertMaterial color="#2a2a3a"/>
      </mesh>
      <mesh rotation={[Math.PI/2,0,0]} position={[0,CEIL_H,-13.5]}>
        <planeGeometry args={[18.2,7.2]}/>
        <meshLambertMaterial color="#f0eee9"/>
      </mesh>
      <mesh position={[0,CEIL_H/2,-17]}>
        <planeGeometry args={[18,CEIL_H]}/>
        <meshLambertMaterial color="#dedad4"/>
      </mesh>
      <mesh position={[-9,CEIL_H/2,-13.5]} rotation={[0,Math.PI/2,0]}>
        <planeGeometry args={[7,CEIL_H]}/>
        <meshLambertMaterial color="#dedad4"/>
      </mesh>
      <mesh position={[9,CEIL_H/2,-13.5]} rotation={[0,-Math.PI/2,0]}>
        <planeGeometry args={[7,CEIL_H]}/>
        <meshLambertMaterial color="#dedad4"/>
      </mesh>

      <mesh position={[0,CEIL_H/2,-16.95]}>
        <boxGeometry args={[5,1.0,0.06]}/>
        <meshLambertMaterial color="#1a1a2a" emissive="#ffffff" emissiveIntensity={0.08}/>
      </mesh>

      <group position={[0,0,-13.5]}>
        <mesh position={[0,0.48,0]} castShadow>
          <boxGeometry args={[7.0,0.96,0.7]}/>
          <meshLambertMaterial color="#c8a870"/>
        </mesh>
        <mesh position={[0,0.96,0]} castShadow>
          <boxGeometry args={[7.2,0.06,0.8]}/>
          <meshLambertMaterial color="#a0a0a0"/>
        </mesh>
        <mesh position={[2.0,1.32,0.12]} castShadow>
          <boxGeometry args={[0.55,0.65,0.45]}/>
          <meshLambertMaterial color="#1c1c1c"/>
        </mesh>
        <mesh position={[2.0,1.55,0.345]}>
          <boxGeometry args={[0.28,0.18,0.01]}/>
          <meshLambertMaterial color="#0a2040" emissive="#0a80e0" emissiveIntensity={0.65}/>
        </mesh>
        <mesh position={[-1.0,1.32,0.1]} castShadow>
          <boxGeometry args={[1.2,0.7,0.5]}/>
          <meshLambertMaterial color="#222222"/>
        </mesh>
        <mesh position={[-1.0,1.68,0.26]}>
          <boxGeometry args={[1.0,0.02,0.02]}/>
          <meshLambertMaterial color="#444"/>
        </mesh>
        <mesh position={[0.8,1.12,0.26]} castShadow>
          <boxGeometry args={[0.38,0.55,0.4]}/>
          <meshLambertMaterial color="#c8c8c8"/>
        </mesh>
        <mesh position={[0.8,1.24,0.46]}>
          <boxGeometry args={[0.22,0.22,0.01]}/>
          <meshLambertMaterial color="#2a3a50" emissive="#3060a0" emissiveIntensity={0.4}/>
        </mesh>
        <mesh position={[-2.8,1.0,0.26]} castShadow>
          <cylinderGeometry args={[0.36,0.32,0.75,12]}/>
          <meshLambertMaterial color="#c8c8c8" transparent opacity={0.7}/>
        </mesh>
        <mesh position={[-2.8,1.42,0.26]}>
          <cylinderGeometry args={[0.22,0.30,0.20,12]}/>
          <meshLambertMaterial color="#a0c8e8" transparent opacity={0.5}/>
        </mesh>
        {[[-0.4,0],[0.4,0]].map(([x],i)=>(
          <group key={i} position={[x,1.01,0.35] as [number,number,number]}>
            <mesh><cylinderGeometry args={[0.045,0.038,0.09,8]}/><meshLambertMaterial color="#fff"/></mesh>
            <mesh position={[0,0.035,0]}><cylinderGeometry args={[0.043,0.043,0.018,8]}/><meshLambertMaterial color="#3a1808"/></mesh>
          </group>
        ))}
      </group>

      {[[-5,CEIL_H-0.04,-13],[5,CEIL_H-0.04,-13],[-5,CEIL_H-0.04,-16],[5,CEIL_H-0.04,-16]].map(([lx,ly,lz],i)=>(
        <mesh key={i} position={[lx,ly,lz] as [number,number,number]}>
          <boxGeometry args={[0.14,0.04,2.5]}/>
          <meshLambertMaterial color="#fffff4" emissive="#fffde0" emissiveIntensity={0.8}/>
        </mesh>
      ))}
      <Plant pos={[-7,0,-16.5]} scale={1.0}/>
      <Plant pos={[7,0,-16.5]} scale={0.9}/>
    </group>
  );
}

function RightWing({ accent }: { accent:string }) {
  const W=9.5; const mz=0;
  return (
    <group position={[14,0,0]}>
      <mesh rotation={[-Math.PI/2,0,0]} position={[W/2,0.001,0]} receiveShadow>
        <planeGeometry args={[W,20]}/>
        <meshLambertMaterial color="#2a2a3a"/>
      </mesh>
      <mesh rotation={[Math.PI/2,0,0]} position={[W/2,CEIL_H,0]}>
        <planeGeometry args={[W+0.2,20.2]}/>
        <meshLambertMaterial color="#f0eee9"/>
      </mesh>
      <mesh position={[W,CEIL_H/2,0]} rotation={[0,-Math.PI/2,0]}>
        <planeGeometry args={[20,CEIL_H]}/>
        <meshLambertMaterial color="#e8e4de"/>
      </mesh>

      {Array.from({length:6},(_,i)=>{
        const pz=-9+i*3.0+1.5;
        return (
          <group key={i} position={[W-0.025,0,pz]}>
            <mesh>
              <boxGeometry args={[0.05,CEIL_H,2.85]}/>
              <meshPhysicalMaterial roughness={0.02} color="#b0d8f0" transparent opacity={0.20}/>
            </mesh>
            <mesh position={[0,CEIL_H/2-0.02,-1.425]}>
              <boxGeometry args={[0.1,CEIL_H,0.1]}/>
              <meshLambertMaterial color="#1a1a2a"/>
            </mesh>
            <mesh position={[0,CEIL_H/2-0.02,1.425]}>
              <boxGeometry args={[0.1,CEIL_H,0.1]}/>
              <meshLambertMaterial color="#1a1a2a"/>
            </mesh>
            <mesh position={[0,CEIL_H-0.05,0]}>
              <boxGeometry args={[0.15,0.12,2.9]}/>
              <meshLambertMaterial color="#111118"/>
            </mesh>
            <mesh position={[0,0.05,0]}>
              <boxGeometry args={[0.15,0.12,2.9]}/>
              <meshLambertMaterial color="#111118"/>
            </mesh>
          </group>
        );
      })}

      <mesh position={[3.2,CEIL_H/2,0.05]}>
        <boxGeometry args={[0.1,CEIL_H,0.1]}/>
        <meshLambertMaterial color="#1a1a2a"/>
      </mesh>
      <mesh position={[3.2,CEIL_H/2+0.02,0]}>
        <boxGeometry args={[0.1,CEIL_H-0.02,10]}/>
        <meshPhysicalMaterial roughness={0.9} color="#e8e4de" transparent opacity={0.95}/>
      </mesh>
      <mesh position={[3.2,CEIL_H/2,-10]}>
        <planeGeometry args={[CEIL_H,10]}/>
        <meshLambertMaterial color="#e8e4de"/>
      </mesh>
      <mesh position={[3.2,CEIL_H/2,10]}>
        <planeGeometry args={[CEIL_H,10]}/>
        <meshLambertMaterial color="#e8e4de"/>
      </mesh>

      <MeetingRoom position={[W/2+1.25,0,-5] as [number,number,number]} accent={accent}/>
      <MeetingRoom position={[W/2+1.25,0,5] as [number,number,number]} accent={accent}/>

      <mesh position={[0.8,1.8,-9.95]}>
        <boxGeometry args={[0.5,0.3,0.04]}/>
        <meshLambertMaterial color="#1a1a2a" emissive={accent} emissiveIntensity={0.6}/>
      </mesh>
      <mesh position={[0.8,1.8,9.95]}>
        <boxGeometry args={[0.5,0.3,0.04]}/>
        <meshLambertMaterial color="#1a1a2a" emissive={accent} emissiveIntensity={0.6}/>
      </mesh>
      <mesh position={[0.8,1.8,0]}>
        <boxGeometry args={[0.5,0.3,0.04]}/>
        <meshLambertMaterial color="#1a1a2a" emissive="#a0a0a0" emissiveIntensity={0.4}/>
      </mesh>

      {[[2,3.96,-5],[2,3.96,5],[6,3.96,-5],[6,3.96,5]].map(([lx,ly,lz],i)=>(
        <mesh key={i} position={[lx,ly,lz] as [number,number,number]}>
          <boxGeometry args={[0.14,0.04,2.5]}/>
          <meshLambertMaterial color="#fffff4" emissive="#fffde0" emissiveIntensity={0.8}/>
        </mesh>
      ))}

      <Plant pos={[0.5,0,-8.5]} scale={0.85}/>
      <Plant pos={[0.5,0,8.5]} scale={0.85}/>
    </group>
  );
}

function ElevatorLobby({ accent }: { accent:string }) {
  return (
    <group position={[-13.5,0,0]}>
      <mesh position={[0,2,0]}>
        <boxGeometry args={[0.18,CEIL_H+0.1,5.5]}/>
        <meshLambertMaterial color="#c8c6c2"/>
      </mesh>
      {[[-1.2],[0],[1.2]].map(([z],i)=>(
        <group key={i} position={[0,0,z]}>
          <mesh position={[0.09,1.8,0]}>
            <boxGeometry args={[0.07,3.4,2.4]}/>
            <meshLambertMaterial color="#0a0a14"/>
          </mesh>
          <mesh position={[0.09,1.8,-0.6]}>
            <boxGeometry args={[0.04,3.3,1.15]}/>
            <meshLambertMaterial color="#e0e0e0"/>
          </mesh>
          <mesh position={[0.09,1.8,0.6]}>
            <boxGeometry args={[0.04,3.3,1.15]}/>
            <meshLambertMaterial color="#e0e0e0"/>
          </mesh>
          <mesh position={[0.14,2.8,1.22]}>
            <boxGeometry args={[0.06,0.22,0.22]}/>
            <meshLambertMaterial color="#2a2a3a" emissive={accent} emissiveIntensity={0.4}/>
          </mesh>
          <mesh position={[0.14,3.2,1.22]}>
            <boxGeometry args={[0.06,0.08,0.08]}/>
            <meshLambertMaterial color="#2a2a3a" emissive="#4080ff" emissiveIntensity={0.8}/>
          </mesh>
        </group>
      ))}

      {[[-3,0,2],[3,0,2],[-3,0,-2],[3,0,-2]].map(([sx,,sz],i)=>(
        <group key={i} position={[sx+13.5,0,sz] as [number,number,number]}>
          <mesh position={[0,0.22,0]} castShadow>
            <boxGeometry args={[0.9,0.44,0.6]}/>
            <meshLambertMaterial color="#2a3040"/>
          </mesh>
          <mesh position={[0,0.46,0]}>
            <boxGeometry args={[0.92,0.04,0.62]}/>
            <meshLambertMaterial color={accent} transparent opacity={0.8}/>
          </mesh>
          <mesh position={[0,0.26,-0.32]} castShadow>
            <boxGeometry args={[0.9,0.52,0.07]}/>
            <meshLambertMaterial color="#1e2838"/>
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function OfficeFloor({ accent = "#3b82f6" }: { accent?: string }) {
  const windowMatRef = useRef<THREE.MeshPhysicalMaterial[]>([]);
  const ceilLightRef = useRef<THREE.MeshLambertMaterial[]>([]);
  const gameTime = useGameTime();

  const floorMat = useMemo(()=>new THREE.ShaderMaterial({
    vertexShader: FLOOR_VERT, fragmentShader: FLOOR_FRAG, uniforms:{uTime:{value:0}}
  }),[]);
  const carpetMat = useMemo(()=>new THREE.ShaderMaterial({
    vertexShader: FLOOR_VERT, fragmentShader: CARPET_FRAG, uniforms:{uTime:{value:0}}
  }),[]);

  useFrame((_,delta)=>{
    floorMat.uniforms.uTime.value+=delta;
    const lc=gameTime.lightConfig;
    for(const m of windowMatRef.current){m.emissive.set(lc.windowGlow);m.emissiveIntensity=lc.windowGlowIntensity;}
    const dim=gameTime.hour>=22||gameTime.hour<6?0.5:1.0;
    for(const m of ceilLightRef.current){m.emissiveIntensity=dim*0.85;}
  });

  const addW=(m:THREE.MeshPhysicalMaterial|null)=>{if(m&&!windowMatRef.current.includes(m))windowMatRef.current.push(m);};
  const addC=(m:THREE.MeshLambertMaterial|null)=>{if(m&&!ceilLightRef.current.includes(m))ceilLightRef.current.push(m);};

  const theme = gameTime;

  return (
    <group>
      {/* ── Main office floor ── */}
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,0,0]} receiveShadow>
        <planeGeometry args={[30,22,1,1]}/>
        <primitive object={floorMat} attach="material"/>
      </mesh>

      {/* ── Main ceiling ── */}
      <mesh rotation={[Math.PI/2,0,0]} position={[0,CEIL_H,0]}>
        <planeGeometry args={[30.2,22.2]}/>
        <meshLambertMaterial color="#f0eee9"/>
      </mesh>

      {/* ── Walls ── */}
      <mesh position={[-15,CEIL_H/2,0]} rotation={[0,Math.PI/2,0]}>
        <planeGeometry args={[22,CEIL_H]}/>
        <meshLambertMaterial color="#eae7e2"/>
      </mesh>
      <mesh position={[0,CEIL_H/2,-11]} castShadow>
        <planeGeometry args={[30,CEIL_H]}/>
        <meshLambertMaterial color="#eceae5"/>
      </mesh>
      <mesh position={[0,CEIL_H/2,11]} rotation={[0,Math.PI,0]}>
        <planeGeometry args={[30,CEIL_H]}/>
        <meshLambertMaterial color="#f0eee9"/>
      </mesh>

      {/* ── Floor-to-ceiling windows RIGHT wall ── */}
      <FloorToWindowWall x={15} z1={-10} z2={10}/>

      {/* ── Ceiling LED strips — main office ── */}
      {[[-8,CEIL_H-0.04,-4],[-2,CEIL_H-0.04,-4],[4,CEIL_H-0.04,-4],[10,CEIL_H-0.04,-4],
        [-8,CEIL_H-0.04,0],[-2,CEIL_H-0.04,0],[4,CEIL_H-0.04,0],[10,CEIL_H-0.04,0],
        [-8,CEIL_H-0.04,4],[-2,CEIL_H-0.04,4],[4,CEIL_H-0.04,4],[10,CEIL_H-0.04,4]].map(([x,y,z],i)=>(
        <mesh key={i} position={[x,y,z] as [number,number,number]}>
          <boxGeometry args={[0.16,0.05,3.5]}/>
          <meshLambertMaterial ref={addC} color="#fffff4" emissive="#fffde0" emissiveIntensity={0.85}/>
        </mesh>
      ))}

      {/* ── Baseboards ── */}
      <mesh position={[0,0.055,-10.96]}><boxGeometry args={[30,0.11,0.08]}/><meshLambertMaterial color="#d0cbc4"/></mesh>
      <mesh position={[-14.96,0.055,0]} rotation={[0,Math.PI/2,0]}><boxGeometry args={[22,0.11,0.08]}/><meshLambertMaterial color="#d0cbc4"/></mesh>

      {/* ── Glass partition to right wing ── */}
      <GlassWall x={14} z1={-10} z2={10}/>

      {/* ── Glass partition to front lobby ── */}
      <GlassWall x={11} z1={-4} z2={4} axis="z"/>

      {/* ── Glass partition to back break room ── */}
      <GlassWall x={-11} z1={-4} z2={4} axis="z"/>

      {/* ── Department sign (back wall) ── */}
      <mesh position={[-3,CEIL_H-0.6,-10.95]}>
        <boxGeometry args={[8,0.65,0.07]}/>
        <meshLambertMaterial color="#1a1a2e" emissive="#3b82f6" emissiveIntensity={0.45} transparent opacity={0.92}/>
      </mesh>
      <mesh position={[6,CEIL_H-0.6,-10.95]}>
        <boxGeometry args={[4.5,0.65,0.07]}/>
        <meshLambertMaterial color="#1a1a2e" emissive="#10b981" emissiveIntensity={0.35} transparent opacity={0.85}/>
      </mesh>

      {/* ── Whiteboard ── */}
      <group position={[-4,2.4,-10.94]}>
        <mesh castShadow><boxGeometry args={[4.8,2.4,0.07]}/><meshLambertMaterial color="#f8f5f0"/></mesh>
        <mesh position={[0,0,0.038]}><boxGeometry args={[4.95,2.52,0.03]}/><meshLambertMaterial color="#b0b0b0"/></mesh>
        {[[-1.6,0.7,2.8,0.04,'#2563eb'],[-1.6,0.3,2.1,0.04,'#2563eb'],[-1.6,0.0,2.5,0.04,'#2563eb'],
          [0.5,0.3,1.4,0.8,'#e0e8f0']].map(([x,y,w,h,c],i)=>(
          <mesh key={i} position={[x as number,y as number,0.055]}>
            <boxGeometry args={[w as number,h as number,0.005]}/>
            <meshLambertMaterial color={c as string}/>
          </mesh>
        ))}
        <mesh position={[0,-1.24,0.06]}><boxGeometry args={[4.6,0.09,0.16]}/><meshLambertMaterial color="#a0a0a0"/></mesh>
        {[['#e03030',-1.6],['#3060c0',-1.2],['#308030',-0.9]].map(([color,x],i)=>(
          <mesh key={i} position={[x as number,-1.2,0.13]}>
            <cylinderGeometry args={[0.018,0.018,0.22,6]}/>
            <meshLambertMaterial color={color as string}/>
          </mesh>
        ))}
      </group>

      {/* ── Bookshelf back right ── */}
      <group position={[10,0,-9.5]}>
        <mesh position={[0,1.0,0]} castShadow>
          <boxGeometry args={[2.8,2.0,0.48]}/>
          <meshLambertMaterial color="#8b6340"/>
        </mesh>
        {[0.25,0.82,1.40].map((y,row)=>(
          <group key={row}>
            <mesh position={[0,y,0.2]}><boxGeometry args={[2.75,0.03,0.02]}/><meshLambertMaterial color="#7a5530"/></mesh>
            {Array.from({length:8},(_,c)=>{
              const h=0.25+Math.sin((row*8+c)*53)*0.09;
              const bcs=["#c03535","#3555b8","#35803a","#b87820","#8035b8","#b85018","#185870","#a03060"];
              return (
                <mesh key={c} position={[-1.1+c*0.31,y+h/2+0.02,0.14]}>
                  <boxGeometry args={[0.17,h,0.32]}/>
                  <meshLambertMaterial color={bcs[(row*8+c)%bcs.length]}/>
                </mesh>
              );
            })}
          </group>
        ))}
      </group>

      {/* ── Water cooler ── */}
      <group position={[-12.5,0,6.5]}>
        <mesh position={[0,0.55,0]}><cylinderGeometry args={[0.24,0.27,1.1,12]}/><meshLambertMaterial color="#e0e0e0" transparent opacity={0.88}/></mesh>
        <mesh position={[0,1.15,0]}><cylinderGeometry args={[0.14,0.22,0.22,12]}/><meshLambertMaterial color="#a0c8e8" transparent opacity={0.65}/></mesh>
        <mesh position={[0,0.32,0.17]}><boxGeometry args={[0.18,0.1,0.06]}/><meshLambertMaterial color="#2a2a2a"/></mesh>
        {[[-0.05,'#60a0d8'],[0.05,'#d86060']].map(([x,col],i)=>(
          <mesh key={i} position={[x as number,0.3,0.2]}><cylinderGeometry args={[0.012,0.012,0.04,6]}/><meshLambertMaterial color={col as string}/></mesh>
        ))}
      </group>

      {/* ── Lounge / rug area center ── */}
      <mesh rotation={[-Math.PI/2,0,0]} position={[5,0.003,0]}>
        <planeGeometry args={[5.5,4.0]}/>
        <meshLambertMaterial color="#8b7050" transparent opacity={0.75}/>
      </mesh>
      <group position={[5,0,2]}>
        <mesh position={[0,0.22,0]} castShadow><boxGeometry args={[1.6,0.44,0.7]}/><meshLambertMaterial color="#2a3040"/></mesh>
        <mesh position={[0,0.46,0]}><boxGeometry args={[1.62,0.04,0.72]}/><meshLambertMaterial color="#3b82f6" transparent opacity={0.8}/></mesh>
        <mesh position={[0,0.26,-0.38]}><boxGeometry args={[1.6,0.52,0.07]}/><meshLambertMaterial color="#222832"/></mesh>
      </group>
      <group position={[5,0,-2]}>
        <mesh position={[0,0.22,0]} castShadow><boxGeometry args={[1.6,0.44,0.7]}/><meshLambertMaterial color="#2a3040"/></mesh>
        <mesh position={[0,0.46,0]}><boxGeometry args={[1.62,0.04,0.72]}/><meshLambertMaterial color="#3b82f6" transparent opacity={0.8}/></mesh>
        <mesh position={[0,0.26,0.38]}><boxGeometry args={[1.6,0.52,0.07]}/><meshLambertMaterial color="#222832"/></mesh>
      </group>
      <group position={[5,0,0]}>
        <mesh position={[0,0.32,0]} castShadow><boxGeometry args={[1.2,0.64,0.6]}/><meshLambertMaterial color="#3a3a4a"/></mesh>
        <mesh position={[0,0.64,0]}><boxGeometry args={[1.24,0.04,0.64]}/><meshLambertMaterial color="#4a4a5a"/></mesh>
      </group>

      {/* ── Picture frames back wall ── */}
      {[[-10,2.5,'#2563eb'],[-6,2.5,'#059669'],[2,2.5,'#d97706']].map(([x,y,col],i)=>(
        <group key={i} position={[x as number,y as number,-10.94]}>
          <mesh><boxGeometry args={[0.9,0.65,0.05]}/><meshLambertMaterial color="#1e1e1e"/></mesh>
          <mesh position={[0,0,0.027]}><planeGeometry args={[0.75,0.51]}/><meshLambertMaterial color={col as string} emissive={col as string} emissiveIntensity={0.12}/></mesh>
        </group>
      ))}

      {/* ── Corner plants main office ── */}
      <LargePlant pos={[-13,0,-9]}/>
      <LargePlant pos={[12,0,-9]}/>
      <Plant pos={[-13,0,9]} scale={1.1}/>
      <Plant pos={[12,0,9]} scale={0.9}/>
      <Plant pos={[-8,0,9]} scale={0.85}/>
      <Plant pos={[8,0,9]} scale={0.80}/>

      {/* ── Bathroom sign area back-left ── */}
      <group position={[-11,2.8,-10.94]}>
        <mesh><boxGeometry args={[2.2,0.45,0.05]}/><meshLambertMaterial color="#1a1a2e" emissive="#a0a0c0" emissiveIntensity={0.35}/></mesh>
        <mesh position={[0,0,0.03]}><planeGeometry args={[1.8,0.28]}/><meshLambertMaterial color="#c0c0e0" emissive="#8080b0" emissiveIntensity={0.18}/></mesh>
      </group>

      {/* ── Subzones ── */}
      <RightWing accent="#3b82f6"/>
      <ReceptionLobby accent="#3b82f6"/>
      <BreakRoom accent="#3b82f6"/>
      <ElevatorLobby accent="#3b82f6"/>
    </group>
  );
}
