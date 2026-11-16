"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, MeshReflectorMaterial, PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import EspressoMachine from "./EspressoMachine";
import CoffeeCup from "./CoffeeCup";
import CoffeeLiquid from "./CoffeeLiquid";
import CoffeeCrema from "./CoffeeCrema";
import CoffeeStream from "./CoffeeStream";
import SteamParticles from "./SteamParticles";
import CoffeeCamera from "./CoffeeCamera";
import Lighting from "./Lighting";
import Atmosphere from "./Atmosphere";
import { QualityContext, type SceneQuality } from "./quality";
import { SCENE } from "@/animations/coffeeTimeline";

interface CoffeeSceneProps {
  quality: SceneQuality;
  /** Pause rendering entirely when the hero is off-screen. */
  active: boolean;
  onReady?: () => void;
}

function Studio({ tier }: { tier: SceneQuality["tier"] }) {
  return (
    <>
      {/* dark studio floor that dissolves into fog. Desktop: a blurred, glossy reflection
          of the machine — the polished-stone product-shot look. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[30, 48]} />
        {tier === "high" ? (
          <MeshReflectorMaterial
            resolution={512}
            blur={[420, 140]}
            mixBlur={1.1}
            mixStrength={2.2}
            mixContrast={1.05}
            mirror={0.6}
            depthScale={1.1}
            minDepthThreshold={0.35}
            maxDepthThreshold={1.3}
            color="#120e0b"
            metalness={0.55}
            roughness={0.78}
          />
        ) : (
          <meshStandardMaterial color="#17120e" roughness={0.62} metalness={0.25} />
        )}
      </mesh>
      {/* baked once — the machine and cup never move enough to need live shadows */}
      <ContactShadows position={[0, 0.002, 0]} scale={7} blur={2.6} far={2.6} opacity={0.85} resolution={512} frames={1} color="#000000" />
      <ContactShadows
        position={[SCENE.brewX, SCENE.dripTrayTop + 0.003, SCENE.brewZ]}
        scale={1.3}
        blur={1.8}
        far={0.6}
        opacity={0.55}
        resolution={256}
        frames={1}
        color="#000000"
      />
    </>
  );
}

export default function CoffeeScene({ quality, active, onReady }: CoffeeSceneProps) {
  const [dpr, setDpr] = useState<number>(quality.tier === "high" ? 1.75 : 1.25);

  return (
    <Canvas
      className="!absolute inset-0"
      dpr={dpr}
      frameloop={active ? "always" : "never"}
      gl={{
        antialias: quality.tier === "high",
        powerPreference: "high-performance",
        alpha: false,
        stencil: false,
      }}
      camera={{ fov: 30, near: 0.05, far: 40, position: [0, 1.75, 7.6] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        // give the first frame time to compile shaders before revealing
        requestAnimationFrame(() => requestAnimationFrame(() => onReady?.()));
      }}
      aria-hidden
    >
      <QualityContext.Provider value={quality}>
        <PerformanceMonitor
          onDecline={() => setDpr((d) => Math.max(1, d - 0.35))}
          onIncline={() => setDpr((d) => Math.min(quality.tier === "high" ? 1.75 : 1.25, d + 0.25))}
        />
        <Lighting />
        <CoffeeCamera />
        <Studio tier={quality.tier} />
        <Atmosphere />
        <EspressoMachine />
        <CoffeeCup />
        <CoffeeLiquid />
        <CoffeeCrema />
        <CoffeeStream />
        <SteamParticles />
      </QualityContext.Provider>
    </Canvas>
  );
}
