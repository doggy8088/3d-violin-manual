import { CameraControls, ContactShadows, Float } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, type ReactNode } from "react";
import * as THREE from "three";
import type { ChapterId } from "../data/handbook";
import { BowModel, ViolinModel } from "./ViolinModel";

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
};

function Lights() {
  return (
    <>
      <ambientLight intensity={0.38} color="#4a3038" />
      <hemisphereLight args={["#6a4450", "#10080c", 0.55]} />
      <spotLight
        position={[5.5, 11, 6]}
        angle={0.42}
        penumbra={0.85}
        intensity={90}
        color="#ffd4a8"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.00015}
      />
      <spotLight position={[-6, 5, -2.5]} angle={0.55} penumbra={1} intensity={28} color="#7a58a8" />
      <directionalLight position={[-3, 7, 4]} intensity={1.55} color="#ffe6cc" />
      <pointLight position={[0, 2.2, 2.4]} intensity={8} color="#ffc98a" distance={8} />
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
  onUserInteract,
}: {
  chapter: ChapterId;
  selectedPart: string | null;
  onUserInteract: () => void;
}) {
  const controls = useRef<CameraControls>(null);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    if (selectedPart && PART_FOCUS[selectedPart]) {
      const v = PART_FOCUS[selectedPart];
      void c.setLookAt(v[0], v[1], v[2], v[3], v[4], v[5], true);
      return;
    }
    const v = VIEWS[chapter] ?? VIEWS.cover;
    void c.setLookAt(v[0], v[1], v[2], v[3], v[4], v[5], true);
  }, [chapter, selectedPart]);

  return (
    <CameraControls
      ref={controls}
      makeDefault
      minDistance={3.2}
      maxDistance={14}
      maxPolarAngle={Math.PI * 0.62}
      minPolarAngle={0.25}
      smoothTime={0.55}
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
  onUserInteract: () => void;
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.6]}
      camera={{ position: [3.4, 1.5, 7], fov: 36, near: 0.1, far: 80 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      onPointerMissed={() => onSelectPart("")}
    >
      <color attach="background" args={["#0a0608"]} />
      <fog attach="fog" args={["#0a0608", 10, 24]} />
      <Lights />
      <CameraRig chapter={chapter} selectedPart={selectedPart} onUserInteract={onUserInteract} />
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
