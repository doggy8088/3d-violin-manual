import { useCursor, Html, Outlines } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { PARTS } from "../data/handbook";
import { getEbonyTexture, getMapleTexture, getVarnishTexture } from "../lib/woodTexture";

export const BODY_TOP = 1.78;
export const BODY_BOTTOM = -1.78;
export const RIB = 0.3;
export const NUT_Y = 3.08;
export const BRIDGE_Y = -0.18;
export const SCALE_LEN = NUT_Y - BRIDGE_Y;

const ZERO = new THREE.Vector3();

const EXPLODE: Record<string, THREE.Vector3> = {
  scroll: new THREE.Vector3(0, 0.85, 0.15),
  pegs: new THREE.Vector3(0.55, 0.7, 0.1),
  nut: new THREE.Vector3(0, 0.45, 0.25),
  fingerboard: new THREE.Vector3(0, 0.2, 0.55),
  neck: new THREE.Vector3(0, 0.35, 0.28),
  body: new THREE.Vector3(0, -0.05, 0),
  fholes: new THREE.Vector3(0.35, 0, 0.35),
  bridge: new THREE.Vector3(0, 0, 0.7),
  strings: new THREE.Vector3(0, 0, 0.85),
  tailpiece: new THREE.Vector3(0, -0.55, 0.25),
  chinrest: new THREE.Vector3(-0.7, -0.35, 0.3),
  bow: new THREE.Vector3(0, -1.1, 0.4),
};

function createBodyShape() {
  const shape = new THREE.Shape();
  const right: [number, number][] = [
    [0.0, -1.78],
    [0.2, -1.77],
    [0.5, -1.68],
    [0.82, -1.48],
    [1.0, -1.18],
    [1.05, -0.9],
    [0.97, -0.66],
    [0.72, -0.5],
    [0.84, -0.42],
    [0.92, -0.37],
    [0.8, -0.34],
    [0.56, -0.27],
    [0.48, -0.12],
    [0.46, 0.04],
    [0.5, 0.2],
    [0.58, 0.33],
    [0.8, 0.4],
    [0.9, 0.45],
    [0.78, 0.49],
    [0.6, 0.55],
    [0.7, 0.66],
    [0.82, 0.88],
    [0.84, 1.1],
    [0.76, 1.34],
    [0.58, 1.54],
    [0.34, 1.68],
    [0.14, 1.75],
    [0.0, 1.78],
  ];
  shape.moveTo(0, -1.78);
  shape.splineThru(right.slice(1).map(([x, y]) => new THREE.Vector2(x, y)));
  const left = right
    .slice(1, -1)
    .reverse()
    .map(([x, y]) => new THREE.Vector2(-x, y));
  shape.splineThru(left);
  return shape;
}

function makeFHoleShape(side: number) {
  const s = new THREE.Shape();
  const ox = 0.4 * side;
  const pts: [number, number][] = [
    [0.0, 0.46],
    [0.032, 0.51],
    [0.038, 0.57],
    [0.01, 0.61],
    [-0.03, 0.56],
    [-0.038, 0.47],
    [-0.02, 0.22],
    [-0.056, 0.14],
    [-0.016, 0.08],
    [-0.02, -0.18],
    [-0.058, -0.26],
    [-0.018, -0.34],
    [-0.03, -0.48],
    [0.008, -0.57],
    [0.044, -0.5],
    [0.03, -0.38],
    [0.012, -0.3],
    [0.016, 0.06],
    [0.054, 0.14],
    [0.018, 0.22],
    [0.016, 0.42],
  ];
  const mapped = pts.map(([x, y]) => new THREE.Vector2(ox + x * side, y));
  s.moveTo(mapped[0].x, mapped[0].y);
  s.splineThru(mapped.slice(1));
  s.closePath();
  return s;
}

function makeVoluteCurve() {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 80; i++) {
    const t = i / 80;
    const a = t * Math.PI * 2 * 2.55 + 0.55;
    const r = 0.118 * (1 - t * 0.64);
    pts.push(new THREE.Vector3(0, Math.cos(a) * r, Math.sin(a) * r));
  }
  return new THREE.CatmullRomCurve3(pts);
}

function makeBowStickCurve() {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 32; i++) {
    const t = i / 32;
    const x = (t - 0.5) * 5.4;
    const z = Math.sin(t * Math.PI) * 0.07;
    pts.push(new THREE.Vector3(x, 0, z));
  }
  return new THREE.CatmullRomCurve3(pts);
}

function useExplode(id: string, exploded: boolean) {
  const ref = useRef<THREE.Group>(null);
  const cur = useRef(new THREE.Vector3());
  useFrame((_, dt) => {
    const dest = exploded ? (EXPLODE[id] ?? ZERO) : ZERO;
    cur.current.lerp(dest, 1 - Math.pow(0.012, dt));
    ref.current?.position.copy(cur.current);
  });
  return ref;
}

function Part({
  id,
  selected,
  onSelect,
  exploded,
  children,
}: {
  id: string;
  selected: string | null;
  onSelect: (id: string) => void;
  exploded: boolean;
  children: ReactNode;
}) {
  const ref = useExplode(id, exploded);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  const active = selected === id || hovered;
  const handlers = {
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      onSelect(id);
    },
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      setHovered(true);
    },
    onPointerOut: () => setHovered(false),
  };
  return (
    <group ref={ref} {...handlers}>
      <group userData={{ active }}>{children}</group>
    </group>
  );
}

function VarnishMat({ active, maple = false }: { active?: boolean; maple?: boolean }) {
  const map = useMemo(() => (maple ? getMapleTexture() : getVarnishTexture()), [maple]);
  return (
    <meshPhysicalMaterial
      map={map}
      color={active ? "#d07a38" : maple ? "#c47a3c" : "#a24e1c"}
      roughness={0.26}
      metalness={0.05}
      clearcoat={1}
      clearcoatRoughness={0.16}
      sheen={0.5}
      sheenRoughness={0.35}
      sheenColor="#e8c090"
      emissive={active ? "#7a3c12" : "#000000"}
      emissiveIntensity={active ? 0.4 : 0}
    />
  );
}

function EbonyMat({ active }: { active?: boolean }) {
  const map = useMemo(() => getEbonyTexture(), []);
  return (
    <meshStandardMaterial
      map={map}
      color={active ? "#3a322c" : "#161210"}
      roughness={0.42}
      metalness={0.12}
      emissive={active ? "#4a3808" : "#000000"}
      emissiveIntensity={active ? 0.35 : 0}
    />
  );
}

function Highlight({ active }: { active: boolean }) {
  if (!active) return null;
  // drei 的 Outlines 一旦帶上 screenspace，thickness 會被當成「模型單位」往法線外推，
  // 而不是像素。零件本身多半只有 0.0x～0.3 單位，外推 2.2 單位等於用一層巨大的金黃色
  // 背殼把整把琴包住，相機一靠近就會被它填滿整個畫面。
  // 走預設的裁剪空間分支，thickness 才是穩定的像素寬度。
  return <Outlines thickness={3.5} color="#e8c547" />;
}

function VoluteMesh({ active }: { active: boolean }) {
  const curve = useMemo(() => makeVoluteCurve(), []);
  return (
    <mesh castShadow>
      <tubeGeometry args={[curve, 80, 0.042, 10, false]} />
      <VarnishMat active={active} />
      <Highlight active={active} />
    </mesh>
  );
}

function BodyMesh({ active }: { active: boolean }) {
  const geom = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(createBodyShape(), {
      depth: RIB,
      bevelEnabled: true,
      bevelThickness: 0.048,
      bevelSize: 0.038,
      bevelSegments: 3,
      curveSegments: 72,
    });
    g.computeVertexNormals();
    return g;
  }, []);
  useEffect(() => () => geom.dispose(), [geom]);
  return (
    <mesh geometry={geom} castShadow receiveShadow>
      <VarnishMat active={active} maple />
      <Highlight active={active} />
    </mesh>
  );
}

function Purfling() {
  const geom = useMemo(() => {
    const pts = createBodyShape()
      .getPoints(200)
      .map((p) => new THREE.Vector3(p.x * 0.962, p.y * 0.962, RIB + 0.004));
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    return g;
  }, []);
  useEffect(() => () => geom.dispose(), [geom]);
  return (
    <lineLoop geometry={geom}>
      <lineBasicMaterial color="#120c08" />
    </lineLoop>
  );
}

function FHoles({ active }: { active: boolean }) {
  const geom = useMemo(() => {
    const g1 = new THREE.ExtrudeGeometry(makeFHoleShape(1), {
      depth: 0.03,
      bevelEnabled: false,
      curveSegments: 24,
    });
    const g2 = new THREE.ExtrudeGeometry(makeFHoleShape(-1), {
      depth: 0.03,
      bevelEnabled: false,
      curveSegments: 24,
    });
    const merged = new THREE.BufferGeometry();
    const a = g1.toNonIndexed();
    const b = g2.toNonIndexed();
    const pos = new Float32Array(
      (a.getAttribute("position").array as Float32Array).length +
        (b.getAttribute("position").array as Float32Array).length,
    );
    pos.set(a.getAttribute("position").array as Float32Array, 0);
    pos.set(
      b.getAttribute("position").array as Float32Array,
      (a.getAttribute("position").array as Float32Array).length,
    );
    merged.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    merged.computeVertexNormals();
    g1.dispose();
    g2.dispose();
    a.dispose();
    b.dispose();
    return merged;
  }, []);
  useEffect(() => () => geom.dispose(), [geom]);
  return (
    <mesh geometry={geom} position={[0, 0, RIB - 0.01]} castShadow>
      <meshStandardMaterial color={active ? "#3a2208" : "#090604"} roughness={0.7} />
      <Highlight active={active} />
    </mesh>
  );
}

function BridgeMesh({ active }: { active: boolean }) {
  const geom = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.2, 0);
    s.lineTo(-0.145, 0);
    s.bezierCurveTo(-0.14, 0.07, -0.13, 0.11, -0.1, 0.13);
    s.bezierCurveTo(-0.12, 0.18, -0.05, 0.2, -0.04, 0.155);
    s.bezierCurveTo(-0.02, 0.12, 0.02, 0.12, 0.04, 0.155);
    s.bezierCurveTo(0.05, 0.2, 0.12, 0.18, 0.1, 0.13);
    s.bezierCurveTo(0.13, 0.11, 0.14, 0.07, 0.145, 0);
    s.lineTo(0.2, 0);
    s.lineTo(0.195, 0.3);
    s.quadraticCurveTo(0, 0.38, -0.195, 0.3);
    s.lineTo(-0.2, 0);
    const g = new THREE.ExtrudeGeometry(s, {
      depth: 0.04,
      bevelEnabled: true,
      bevelThickness: 0.004,
      bevelSize: 0.004,
      bevelSegments: 1,
    });
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0.02, 0);
    return g;
  }, []);
  useEffect(() => () => geom.dispose(), [geom]);
  return (
    <mesh geometry={geom} position={[0, BRIDGE_Y, RIB]} castShadow>
      <meshStandardMaterial
        color={active ? "#e8c090" : "#c9a066"}
        roughness={0.45}
        emissive={active ? "#6a4a10" : "#000"}
        emissiveIntensity={active ? 0.3 : 0}
      />
      <Highlight active={active} />
    </mesh>
  );
}

function Peg({
  position,
  dir,
  active,
}: {
  position: [number, number, number];
  dir: number;
  active: boolean;
}) {
  return (
    <group position={position} rotation={[0, 0, (dir * Math.PI) / 2]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.018, 0.015, 0.32, 10]} />
        <EbonyMat active={active} />
      </mesh>
      <mesh position={[0.18 * dir, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.038, 0.032, 0.1, 10]} />
        <EbonyMat active={active} />
      </mesh>
      <mesh position={[0.24 * dir, 0, 0]} castShadow>
        <sphereGeometry args={[0.026, 12, 12]} />
        <EbonyMat active={active} />
      </mesh>
    </group>
  );
}

function ViolinString({
  x,
  radius,
  color,
  active,
  vibrating,
  onPlay,
}: {
  x: number;
  radius: number;
  color: string;
  active: boolean;
  vibrating: boolean;
  onPlay: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geom = useMemo(() => {
    const pts = [
      new THREE.Vector3(x * 0.72, -1.42, RIB + 0.04),
      new THREE.Vector3(x, BRIDGE_Y, RIB + 0.175),
      new THREE.Vector3(x * 0.55, NUT_Y, RIB + 0.08),
      new THREE.Vector3(x * 0.35, NUT_Y + 0.28, RIB + 0.02),
    ];
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(curve, 48, radius, 6, false);
  }, [x, radius]);
  useEffect(() => () => geom.dispose(), [geom]);
  useFrame((state) => {
    if (!meshRef.current) return;
    if (vibrating) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 48) * 0.08;
      meshRef.current.scale.set(s, 1, s);
    } else {
      meshRef.current.scale.set(1, 1, 1);
    }
  });
  return (
    <mesh
      ref={meshRef}
      geometry={geom}
      onClick={(e) => {
        e.stopPropagation();
        onPlay();
      }}
      castShadow
    >
      <meshStandardMaterial
        color={color}
        metalness={0.82}
        roughness={0.22}
        emissive={active || vibrating ? "#c9a84c" : "#000"}
        emissiveIntensity={active || vibrating ? 0.55 : 0}
      />
    </mesh>
  );
}

const STRING_X = [-0.09, -0.032, 0.032, 0.09];
const STRING_R = [0.011, 0.009, 0.0075, 0.0055];
const STRING_C = ["#c9a84c", "#d7c39a", "#eee4d2", "#f7f2ea"];
const STRING_IDS = ["G", "D", "A", "E"] as const;

function FingerDots({ visible }: { visible: boolean }) {
  if (!visible) return null;
  const aX = STRING_X[2];
  const steps = [0, 2, 4, 5, 7];
  const labels = ["空", "1", "2", "3", "4"];
  return (
    <group>
      {steps.map((semi, i) => {
        const dist = SCALE_LEN * (1 - 1 / Math.pow(2, semi / 12));
        const y = NUT_Y - dist;
        return (
          <group key={labels[i]} position={[aX, y, RIB + 0.1]}>
            <mesh>
              <sphereGeometry args={[0.028, 12, 12]} />
              <meshBasicMaterial color="#e8c547" transparent opacity={0.85} />
            </mesh>
            <Html center distanceFactor={7} zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
              <div className="label-chip">{labels[i]}</div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

function Hotspot({
  position,
  label,
  active,
}: {
  position: [number, number, number];
  label: string;
  active: boolean;
}) {
  const pulse = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!pulse.current) return;
    const s = 1 + Math.sin(state.clock.elapsedTime * 2.2) * 0.18;
    pulse.current.scale.setScalar(s);
  });
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshBasicMaterial color={active ? "#fff3c4" : "#e8c547"} />
      </mesh>
      <mesh ref={pulse} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.055, 0.07, 20]} />
        <meshBasicMaterial color="#e8c547" transparent opacity={0.45} side={THREE.DoubleSide} />
      </mesh>
      <Html center distanceFactor={8} zIndexRange={[8, 0]} style={{ pointerEvents: "none" }}>
        <div className="label-chip" style={{ opacity: active ? 1 : 0.85 }}>
          {label}
        </div>
      </Html>
    </group>
  );
}

export function ViolinModel({
  selectedPart,
  onSelectPart,
  exploded,
  showHotspots,
  highlightString,
  onPlayString,
  showFingers,
  playingString,
}: {
  selectedPart: string | null;
  onSelectPart: (id: string) => void;
  exploded: boolean;
  showHotspots: boolean;
  highlightString: string | null;
  onPlayString: (id: string) => void;
  showFingers: boolean;
  playingString: string | null;
}) {
  const is = (id: string) => selectedPart === id;

  return (
    <group>
      <Part id="body" selected={selectedPart} onSelect={onSelectPart} exploded={exploded}>
        <BodyMesh active={is("body")} />
        <Purfling />
        <mesh position={[0, BODY_BOTTOM - 0.02, RIB / 2]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.08, 12]} />
          <EbonyMat active={is("body")} />
        </mesh>
      </Part>

      <Part id="fholes" selected={selectedPart} onSelect={onSelectPart} exploded={exploded}>
        <FHoles active={is("fholes")} />
      </Part>

      <Part id="neck" selected={selectedPart} onSelect={onSelectPart} exploded={exploded}>
        <mesh position={[0, BODY_TOP + 0.62, RIB * 0.45]} castShadow>
          <boxGeometry args={[0.22, 1.28, 0.15]} />
          <VarnishMat active={is("neck")} />
          <Highlight active={is("neck")} />
        </mesh>
        <mesh position={[0, BODY_TOP + 0.12, RIB * 0.28]} castShadow>
          <boxGeometry args={[0.32, 0.34, 0.22]} />
          <VarnishMat active={is("neck")} />
        </mesh>
      </Part>

      <Part id="fingerboard" selected={selectedPart} onSelect={onSelectPart} exploded={exploded}>
        <mesh position={[0, (NUT_Y + 0.42) / 2, RIB + 0.035]} castShadow>
          <boxGeometry args={[0.24, NUT_Y - 0.42, 0.06]} />
          <EbonyMat active={is("fingerboard")} />
          <Highlight active={is("fingerboard")} />
        </mesh>
      </Part>

      <Part id="nut" selected={selectedPart} onSelect={onSelectPart} exploded={exploded}>
        <mesh position={[0, NUT_Y, RIB + 0.07]} castShadow>
          <boxGeometry args={[0.26, 0.045, 0.07]} />
          <meshStandardMaterial color="#d9cbb0" roughness={0.4} />
          <Highlight active={is("nut")} />
        </mesh>
      </Part>

      <Part id="scroll" selected={selectedPart} onSelect={onSelectPart} exploded={exploded}>
        <group position={[0, NUT_Y, RIB * 0.4]} rotation={[0.18, 0, 0]}>
          <mesh position={[-0.07, 0.28, 0]} castShadow>
            <boxGeometry args={[0.035, 0.52, 0.22]} />
            <VarnishMat active={is("scroll")} />
          </mesh>
          <mesh position={[0.07, 0.28, 0]} castShadow>
            <boxGeometry args={[0.035, 0.52, 0.22]} />
            <VarnishMat active={is("scroll")} />
          </mesh>
          <mesh position={[0, 0.28, -0.1]} castShadow>
            <boxGeometry args={[0.16, 0.52, 0.04]} />
            <VarnishMat active={is("scroll")} />
          </mesh>
          <mesh position={[0, 0.55, 0.02]} castShadow>
            <boxGeometry args={[0.16, 0.06, 0.22]} />
            <VarnishMat active={is("scroll")} />
          </mesh>
          <group position={[0, 0.62, 0.02]}>
            <VoluteMesh active={is("scroll")} />
            <mesh position={[0, 0.02, 0.09]} castShadow>
              <sphereGeometry args={[0.038, 14, 14]} />
              <VarnishMat active={is("scroll")} />
            </mesh>
          </group>
        </group>
      </Part>

      <Part id="pegs" selected={selectedPart} onSelect={onSelectPart} exploded={exploded}>
        <group position={[0, NUT_Y, RIB * 0.4]} rotation={[0.18, 0, 0]}>
          <Peg position={[-0.02, 0.16, 0]} dir={-1} active={is("pegs")} />
          <Peg position={[-0.02, 0.38, 0]} dir={-1} active={is("pegs")} />
          <Peg position={[0.02, 0.16, 0]} dir={1} active={is("pegs")} />
          <Peg position={[0.02, 0.38, 0]} dir={1} active={is("pegs")} />
        </group>
      </Part>

      <Part id="bridge" selected={selectedPart} onSelect={onSelectPart} exploded={exploded}>
        <BridgeMesh active={is("bridge")} />
      </Part>

      <Part id="strings" selected={selectedPart} onSelect={onSelectPart} exploded={exploded}>
        {STRING_IDS.map((id, i) => (
          <ViolinString
            key={id}
            x={STRING_X[i]}
            radius={STRING_R[i]}
            color={STRING_C[i]}
            active={is("strings") || highlightString === id}
            vibrating={playingString === id}
            onPlay={() => {
              onSelectPart("strings");
              onPlayString(id);
            }}
          />
        ))}
      </Part>

      <Part id="tailpiece" selected={selectedPart} onSelect={onSelectPart} exploded={exploded}>
        <mesh position={[0, -1.05, RIB + 0.05]} rotation={[-0.18, 0, 0]} castShadow>
          <boxGeometry args={[0.22, 0.72, 0.05]} />
          <EbonyMat active={is("tailpiece")} />
          <Highlight active={is("tailpiece")} />
        </mesh>
        {[-0.07, -0.025, 0.025, 0.07].map((x) => (
          <mesh key={x} position={[x, -1.32, RIB + 0.08]} castShadow>
            <cylinderGeometry args={[0.012, 0.012, 0.04, 8]} />
            <meshStandardMaterial color="#b0b8c0" metalness={0.85} roughness={0.2} />
          </mesh>
        ))}
      </Part>

      <Part id="chinrest" selected={selectedPart} onSelect={onSelectPart} exploded={exploded}>
        <mesh position={[-0.38, -1.5, RIB + 0.08]} rotation={[0.55, 0.4, -0.3]} castShadow>
          <torusGeometry args={[0.16, 0.045, 10, 20, Math.PI * 1.2]} />
          <EbonyMat active={is("chinrest")} />
          <Highlight active={is("chinrest")} />
        </mesh>
        <mesh position={[-0.22, -1.62, RIB * 0.5]} castShadow>
          <boxGeometry args={[0.08, 0.06, 0.34]} />
          <EbonyMat active={is("chinrest")} />
        </mesh>
      </Part>

      {exploded && (
        <mesh position={[0.14, BRIDGE_Y, RIB * 0.5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.018, 0.018, RIB - 0.02, 10]} />
          <meshStandardMaterial color="#e8d2a8" roughness={0.55} />
        </mesh>
      )}

      <FingerDots visible={showFingers} />

      {showHotspots &&
        PARTS.filter((p) => p.id !== "bow").map((p) => {
          const pos = HOTSPOT_POS[p.id];
          if (!pos) return null;
          return <Hotspot key={p.id} position={pos} label={p.name} active={selectedPart === p.id} />;
        })}
    </group>
  );
}

const HOTSPOT_POS: Record<string, [number, number, number]> = {
  scroll: [0.28, 3.55, 0.25],
  pegs: [0.42, 3.28, 0.15],
  nut: [0.28, 3.08, 0.22],
  fingerboard: [0.32, 1.7, 0.28],
  neck: [0.3, 2.4, 0.12],
  body: [0.7, 0.6, 0.2],
  fholes: [0.55, 0.05, 0.38],
  bridge: [0.32, -0.18, 0.5],
  strings: [0.22, 0.9, 0.45],
  tailpiece: [0.28, -1.1, 0.28],
  chinrest: [-0.62, -1.5, 0.28],
};

const BOW_REST = new THREE.Vector3(1.6, -1.6, 0.35);

export function BowModel({
  technique,
  active,
}: {
  technique: string | null;
  active: boolean;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    if (!technique) {
      ref.current.position.lerp(BOW_REST, 0.08);
      ref.current.rotation.set(-0.5, 0.4, 1.1);
      return;
    }
    const t = state.clock.elapsedTime;
    const map: Record<string, { speed: number; amp: number; bounce: number }> = {
      detache: { speed: 2.1, amp: 1.15, bounce: 0 },
      legato: { speed: 0.85, amp: 1.35, bounce: 0 },
      staccato: { speed: 5.2, amp: 0.7, bounce: 0.02 },
      martele: { speed: 3.1, amp: 0.8, bounce: 0.01 },
      spiccato: { speed: 7.2, amp: 0.55, bounce: 0.13 },
      sautille: { speed: 11, amp: 0.4, bounce: 0.1 },
      tremolo: { speed: 18, amp: 0.22, bounce: 0 },
      ponticello: { speed: 2.4, amp: 1.0, bounce: 0 },
    };
    const m = map[technique] ?? map.detache;
    const wave = Math.sin(t * m.speed);
    const x =
      technique === "staccato" || technique === "martele"
        ? Math.sign(wave) * Math.pow(Math.abs(wave), 0.28) * m.amp
        : wave * m.amp;
    const bounce = Math.abs(Math.sin(t * m.speed)) * m.bounce;
    const y = technique === "ponticello" ? BRIDGE_Y + 0.08 : BRIDGE_Y + 0.22;
    ref.current.position.set(x, y, RIB + 0.22 + bounce);
    ref.current.rotation.set(0.02, 0, 0);
  });

  const stick = useMemo(() => makeBowStickCurve(), []);

  return (
    <group ref={ref} position={[0, BRIDGE_Y + 0.2, RIB + 0.22]}>
      <mesh castShadow>
        <tubeGeometry args={[stick, 40, 0.018, 8, false]} />
        <meshPhysicalMaterial
          color={active ? "#c47a3c" : "#6b3a18"}
          roughness={0.3}
          clearcoat={0.5}
          emissive={active ? "#6a3a10" : "#000"}
          emissiveIntensity={active ? 0.3 : 0}
        />
      </mesh>
      <mesh position={[0, -0.012, -0.03]}>
        <boxGeometry args={[4.6, 0.008, 0.04]} />
        <meshStandardMaterial color="#d8c9a8" roughness={0.6} />
      </mesh>
      <mesh position={[-2.45, -0.02, -0.01]} castShadow>
        <boxGeometry args={[0.22, 0.08, 0.1]} />
        <EbonyMat active={active} />
      </mesh>
      <mesh position={[2.5, 0.0, 0.02]} rotation={[0, 0, 0.4]} castShadow>
        <boxGeometry args={[0.16, 0.04, 0.05]} />
        <meshPhysicalMaterial color="#6b3a18" roughness={0.3} />
      </mesh>
    </group>
  );
}
