"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { coffeeState, getMachineState, range, smooth } from "@/animations/coffeeTimeline";
import { useQuality } from "./quality";

/**
 * Dark-studio lighting. A procedural Lightformer environment (no HDR download)
 * provides the long soft reflections on chrome; a warm key, a bronze rim and a
 * cup-bay down-light that warms up when the machine comes alive.
 */
export default function Lighting() {
  const { tier } = useQuality();
  const keyRef = useRef<THREE.SpotLight>(null);
  const bayRef = useRef<THREE.SpotLight>(null);
  const rimRef = useRef<THREE.SpotLight>(null);

  const targets = useMemo(() => {
    const machine = new THREE.Object3D();
    machine.position.set(0, 1.1, 0.2);
    const cup = new THREE.Object3D();
    cup.position.set(0, 0.55, 0.62);
    return { machine, cup };
  }, []);

  useFrame(() => {
    const p = coffeeState.progress;
    const m = getMachineState(p);
    const reveal = smooth(range(p, 0.8, 1));
    if (keyRef.current) keyRef.current.intensity = 2.3 + 0.6 * smooth(range(p, 0, 0.15)) - 0.5 * reveal;
    if (bayRef.current) bayRef.current.intensity = 0.3 + m.bayLight * 1.9;
    if (rimRef.current) rimRef.current.intensity = 3.2 + reveal * 1.5;
  });

  return (
    <>
      <color attach="background" args={["#100e0c"]} />
      <fog attach="fog" args={["#100e0c", 7.5, 19]} />

      <primitive object={targets.machine} />
      <primitive object={targets.cup} />

      <ambientLight intensity={0.12} color="#ffe6c8" />

      {/* warm key from upper-left front */}
      <spotLight
        ref={keyRef}
        position={[-3.6, 6.2, 5]}
        angle={0.42}
        penumbra={1}
        decay={0}
        intensity={2.3}
        color="#ffdcb0"
        target={targets.machine}
      />
      {/* bronze rim from behind-right — separates the silhouette from the dark */}
      <spotLight
        ref={rimRef}
        position={[3.8, 3.6, -3.8]}
        angle={0.5}
        penumbra={1}
        decay={0}
        intensity={3.2}
        color="#c4935f"
        target={targets.machine}
      />
      {/* cool, very low fill from the right */}
      <directionalLight position={[5, 2, 3]} intensity={0.22} color="#d6d2cc" />
      {/* the cup-bay down-light (matches the LED strip under the housing) */}
      <spotLight
        ref={bayRef}
        position={[0, 1.6, 0.25]}
        angle={0.75}
        penumbra={0.9}
        decay={0}
        distance={2.2}
        intensity={0.4}
        color="#ffc98c"
        target={targets.cup}
      />

      <Environment resolution={tier === "high" ? 256 : 128} frames={1} environmentIntensity={0.85}>
        {/* overhead softbox */}
        <Lightformer form="rect" intensity={2.2} position={[0, 6, 1]} rotation-x={Math.PI / 2} scale={[7, 3, 1]} />
        {/* tall strip lights left & right — the long chrome highlights */}
        <Lightformer form="rect" intensity={2.6} position={[-5, 2, 1.5]} rotation-y={Math.PI / 2} scale={[0.6, 7, 1]} />
        <Lightformer form="rect" intensity={1.6} position={[5, 2, 2.5]} rotation-y={-Math.PI / 2} scale={[0.5, 7, 1]} />
        {/* warm bronze bounce from behind */}
        <Lightformer form="rect" intensity={0.9} color="#b88a5a" position={[0, 2, -6]} scale={[10, 3, 1]} />
        {/* low front kicker */}
        <Lightformer form="ring" intensity={1.2} color="#ffe2bf" position={[2.5, 1.2, 6]} scale={1.6} />
      </Environment>
    </>
  );
}
