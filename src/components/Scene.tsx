import {
  CameraControls,
  CameraControlsImpl,
  ContactShadows,
  Float,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import type { ChapterId } from "../data/handbook";
import { BowModel, ViolinModel } from "./ViolinModel";

const { ACTION } = CameraControlsImpl;

/**
 * 相機要退到多遠才裝得下整把小提琴（含肩墊與琴頭）。手機是窄畫面，垂直視角
 * 雖然不變，但水平可視範圍很小，所以兩個方向都要算，取較遠的那個。
 */
const MODEL_HEIGHT = 6.9;
const MODEL_WIDTH = 3.0;
const CAMERA_FOV = 36;
const FIT_MARGIN = 1.04;

/** 只有「看整把琴」的章節才自動退到剛好裝得下的距離；特寫章節維持原本的構圖。 */
const FIT_CHAPTERS = new Set<ChapterId>([
  "cover",
  "history",
  "anatomy",
  "care",
  "repertoire",
  "quiz",
]);

function fitDistance(aspect: number) {
  const half = Math.tan((CAMERA_FOV * Math.PI) / 180 / 2);
  const vertical = MODEL_HEIGHT / 2 / half;
  const horizontal = MODEL_WIDTH / 2 / (half * Math.max(aspect, 0.2));
  return Math.max(vertical, horizontal) * FIT_MARGIN;
}

/**
 * 說明面板在桌機固定佔住左側（目錄 224px + 面板 448px），琴身若置中，左半邊就會
 * 躲在面板後面。這裡把整組相機連同注視點往左推，畫面中的琴身就落到右側空位；
 * 手機則不讓位，改為預設收起面板，把整個畫面留給 3D。
 */
function frameShift(width: number) {
  if (width < 640) return 0;
  return width >= 1024 ? 350 : 235;
}

const VIEWS: Record<string, [number, number, number, number, number, number]> = {
  cover: [3.4, 1.5, 7.0, 0, 0.7, 0],
  history: [2.6, 1.8, 6.4, 0, 0.9, 0],
  anatomy: [0.15, 1.35, 8.4, 0, 0.85, 0],
  strings: [1.6, 0.9, 5.4, 0, 0.4, 0.2],
  posture: [3.8, 2.2, 5.5, 0, 0.6, 0],
  bowing: [0.2, 0.4, 5.8, 0, -0.1, 0.2],
  leftHand: [1.1, 2.4, 4.6, 0, 1.8, 0.15],
  care: [2.2, 1.2, 6.6, 0, 0.5, 0],
  repertoire: [3.0, 1.6, 6.8, 0, 0.8, 0],
  quiz: [2.4, 1.4, 7.2, 0, 0.7, 0],
};

const PART_FOCUS: Record<string, [number, number, number, number, number, number]> = {
  scroll: [1.6, 4.1, 3.2, 0, 3.4, 0.1],
  pegs: [2.0, 3.6, 3.0, 0, 3.2, 0.1],
  nut: [1.4, 3.4, 2.8, 0, 3.05, 0.15],
  fingerboard: [1.5, 2.2, 3.6, 0, 1.7, 0.2],
  neck: [1.8, 2.8, 3.4, 0, 2.4, 0.1],
  body: [2.4, 1.0, 5.2, 0, 0.1, 0.1],
  fholes: [1.6, 0.4, 3.4, 0.2, 0.0, 0.3],
  bridge: [1.4, 0.3, 3.0, 0, -0.18, 0.35],
  strings: [1.2, 1.2, 3.6, 0, 0.6, 0.3],
  tailpiece: [1.4, -0.6, 3.2, 0, -1.1, 0.2],
  chinrest: [-0.2, -0.8, 3.4, -0.4, -1.5, 0.2],
  shoulderrest: [2.0, -1.4, -3.0, 0, -1.15, -0.32],
};

const DRAG_BUTTONS = {
  left: ACTION.ROTATE,
  middle: ACTION.DOLLY,
  right: ACTION.TRUCK,
  wheel: ACTION.DOLLY,
};

const PAN_BUTTONS = { wheel: ACTION.DOLLY, left: ACTION.SCREEN_PAN, middle: ACTION.DOLLY, right: ACTION.ROTATE };

const DRAG_TOUCHES = {
  one: ACTION.TOUCH_ROTATE,
  two: ACTION.TOUCH_DOLLY_TRUCK,
  three: ACTION.TOUCH_TRUCK,
};

const PAN_TOUCHES = {
  one: ACTION.TOUCH_TRUCK,
  two: ACTION.TOUCH_DOLLY,
  three: ACTION.TOUCH_ROTATE,
};

/**
 * 跟著相機跑的補光。小提琴是一塊平板，漆面又是深色，只有固定光源時，轉到背光那面
 * 就會整片黑掉；這盞燈永遠從觀看者的方向打過去，讓面對鏡頭的表面維持看得清楚。
 */
function CameraFill() {
  const light = useRef<THREE.DirectionalLight>(null);
  const dir = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }) => {
    const l = light.current;
    if (!l) return;
    camera.getWorldDirection(dir);
    l.position.copy(camera.position).addScaledVector(dir, -4);
    l.target.position.set(0, 0.4, 0);
    l.target.updateMatrixWorld();
  });
  return <directionalLight ref={light} intensity={1.35} color="#ffe4c8" />;
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.5} color="#5a4048" />
      <hemisphereLight args={["#7a5560", "#140c10", 0.6]} />
      <spotLight
        position={[5.5, 11, 6]}
        angle={0.45}
        penumbra={0.85}
        intensity={140}
        color="#ffd9b0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.00015}
      />
      <spotLight position={[-6, 5, -2.5]} angle={0.55} penumbra={1} intensity={34} color="#8a68c0" />
      <directionalLight position={[-3, 7, 4]} intensity={1.9} color="#ffe6cc" />
      <pointLight position={[0, 0.9, 3.6]} intensity={14} color="#ffd9a8" distance={12} />
      <CameraFill />
    </>
  );
}

function Pedestal() {
  return (
    <group position={[0, -2.35, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.16, 0]} receiveShadow>
        <circleGeometry args={[4.4, 64]} />
        <meshStandardMaterial color="#14080c" roughness={0.92} metalness={0.18} />
      </mesh>
      <mesh receiveShadow castShadow>
        <cylinderGeometry args={[1.15, 1.35, 0.42, 36]} />
        <meshStandardMaterial color="#2c141c" roughness={0.55} metalness={0.28} />
      </mesh>
      <mesh position={[0, 0.24, 0]} receiveShadow>
        <cylinderGeometry args={[1.05, 1.15, 0.08, 36]} />
        <meshStandardMaterial color="#5a2830" roughness={0.45} metalness={0.35} />
      </mesh>
    </group>
  );
}

function AutoRig({ autoRotate, children }: { autoRotate: boolean; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (autoRotate && ref.current) {
      ref.current.rotation.y += dt * 0.22;
    }
  });
  return <group ref={ref}>{children}</group>;
}

function CameraRig({
  chapter,
  selectedPart,
  panMode,
  resetToken,
  onUserInteract,
}: {
  chapter: ChapterId;
  selectedPart: string | null;
  panMode: boolean;
  resetToken: number;
  onUserInteract: () => void;
}) {
  const controls = useRef<CameraControls>(null);
  const { size } = useThree();
  const aspect = size.height > 0 ? size.width / size.height : 1;

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const focus = selectedPart ? PART_FOCUS[selectedPart] : undefined;
    const v = focus ?? VIEWS[chapter] ?? VIEWS.cover;
    const target = new THREE.Vector3(v[3], v[4], v[5]);
    const offset = new THREE.Vector3(v[0], v[1], v[2]).sub(target);
    // 章節的整體視角先退到「整把琴都看得到」的距離，手機的窄畫面才不會切掉琴頭與琴尾。
    if (!focus && FIT_CHAPTERS.has(chapter)) {
      offset.setLength(Math.max(offset.length(), fitDistance(aspect)));
    }
    const position = target.clone().add(offset);
    // 讓位給左側面板：整組相機（位置與注視點）沿畫面水平方向平移，琴身就落到空位上。
    const shiftPx = frameShift(size.width);
    if (shiftPx > 0) {
      const forward = target.clone().sub(position).normalize();
      const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));
      if (right.lengthSq() > 1e-6) {
        const worldPerPx =
          (2 * offset.length() * Math.tan((CAMERA_FOV * Math.PI) / 180 / 2)) / Math.max(size.height, 1);
        const shift = right.normalize().multiplyScalar(-shiftPx * worldPerPx);
        position.add(shift);
        target.add(shift);
      }
    }
    void c.setLookAt(position.x, position.y, position.z, target.x, target.y, target.z, true);
  }, [chapter, selectedPart, resetToken, aspect]);

  return (
    <CameraControls
      ref={controls}
      makeDefault
      minDistance={FIT_CHAPTERS.has(chapter) ? Math.max(2.4, fitDistance(aspect) * 0.45) : 2.4}
      maxDistance={24}
      maxPolarAngle={1.95}
      minPolarAngle={0.12}
      smoothTime={0.55}
      mouseButtons={panMode ? PAN_BUTTONS : DRAG_BUTTONS}
      touches={panMode ? PAN_TOUCHES : DRAG_TOUCHES}
      onStart={onUserInteract}
    />
  );
}

export function Scene({
  chapter,
  selectedPart,
  onSelectPart,
  exploded,
  showHotspots,
  highlightString,
  onPlayString,
  showFingers,
  playingString,
  bowTechnique,
  autoRotate,
  panMode,
  resetToken,
  onUserInteract,
}: {
  chapter: ChapterId;
  selectedPart: string | null;
  onSelectPart: (id: string) => void;
  exploded: boolean;
  showHotspots: boolean;
  highlightString: string | null;
  onPlayString: (id: string) => void;
  showFingers: boolean;
  playingString: string | null;
  bowTechnique: string | null;
  autoRotate: boolean;
  panMode: boolean;
  resetToken: number;
  onUserInteract: () => void;
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.6]}
      camera={{ position: [3.4, 1.5, 7], fov: CAMERA_FOV, near: 0.1, far: 80 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      onPointerMissed={(e) => {
        const delta = (e as unknown as { delta?: number }).delta ?? 0;
        if (delta > 6) return;
        onSelectPart("");
      }}
    >
      <color attach="background" args={["#0a0608"]} />
      <fog attach="fog" args={["#0a0608", 12, 30]} />
      <Lights />
      <CameraRig
        chapter={chapter}
        selectedPart={selectedPart}
        panMode={panMode}
        resetToken={resetToken}
        onUserInteract={onUserInteract}
      />
      <Pedestal />
      <ContactShadows position={[0, -2.12, 0]} opacity={0.55} scale={14} blur={2.4} far={5} />
      <AutoRig autoRotate={autoRotate}>
        <Float
          enabled={chapter === "cover"}
          speed={1.15}
          rotationIntensity={0.1}
          floatIntensity={0.22}
        >
          <group position={[0, -0.28, 0]} rotation={[0.1, 0.28, 0.03]}>
            <ViolinModel
              selectedPart={selectedPart}
              onSelectPart={(id) => onSelectPart(id)}
              exploded={exploded}
              showHotspots={showHotspots}
              highlightString={highlightString}
              onPlayString={onPlayString}
              showFingers={showFingers}
              playingString={playingString}
            />
            <BowModel technique={bowTechnique} active={selectedPart === "bow" || chapter === "bowing"} />
          </group>
        </Float>
      </AutoRig>
    </Canvas>
  );
}
