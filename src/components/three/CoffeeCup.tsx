"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { CUP, SCENE, cupInnerRadius, cupOuterRadius } from "@/animations/coffeeTimeline";
import { useDisposable } from "./useDisposable";
import { useQuality } from "./quality";

/**
 * Glazed porcelain cappuccino cup + saucer, built as a single lathe each so the
 * inner wall profile matches CoffeeLiquid exactly (shared cupInnerRadius()).
 */
function cupProfile(): THREE.Vector2[] {
  const pts: THREE.Vector2[] = [];
  // foot ring
  pts.push(new THREE.Vector2(0, 0.004));
  pts.push(new THREE.Vector2(0.118, 0.0));
  pts.push(new THREE.Vector2(0.132, 0.006));
  pts.push(new THREE.Vector2(0.136, 0.024));
  // outer wall (bottom → rim)
  const steps = 22;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = 0.03 + t * (CUP.innerTop - 0.03);
    pts.push(new THREE.Vector2(cupOuterRadius(t), y));
  }
  // rolled rim
  pts.push(new THREE.Vector2(CUP.outerTopR + 0.002, CUP.innerTop + 0.006));
  pts.push(new THREE.Vector2(CUP.outerTopR - 0.004, CUP.height));
  pts.push(new THREE.Vector2(CUP.innerTopR + 0.008, CUP.height + 0.001));
  pts.push(new THREE.Vector2(CUP.innerTopR, CUP.innerTop + 0.002));
  // inner wall (rim → bottom)
  for (let i = steps; i >= 0; i--) {
    const t = i / steps;
    const y = CUP.innerBottom + t * (CUP.innerTop - CUP.innerBottom);
    pts.push(new THREE.Vector2(cupInnerRadius(t), y));
  }
  pts.push(new THREE.Vector2(0.06, CUP.innerBottom - 0.004));
  pts.push(new THREE.Vector2(0, CUP.innerBottom - 0.005));
  return pts;
}

function saucerProfile(): THREE.Vector2[] {
  return [
    [0, 0.0],
    [0.3, 0.0],
    [0.315, 0.008],
    [0.44, 0.022],
    [0.5, 0.042],
    [0.512, 0.05],
    [0.506, 0.056],
    [0.45, 0.036],
    [0.32, 0.026],
    [0.17, 0.02],
    [0.155, 0.033],
    [0.14, 0.035],
    [0, 0.035],
  ].map(([r, y]) => new THREE.Vector2(r, y));
}

export default function CoffeeCup() {
  const { segments } = useQuality();

  const { cupGeo, saucerGeo, handleGeo, porcelain, bronze } = useMemo(() => {
    const cupGeo = new THREE.LatheGeometry(cupProfile(), segments);
    const saucerGeo = new THREE.LatheGeometry(saucerProfile(), segments);
    const handleGeo = new THREE.TorusGeometry(0.095, 0.021, 16, Math.max(24, segments / 2), Math.PI * 1.28);
    const porcelain = new THREE.MeshPhysicalMaterial({
      color: "#e4d9c9",
      roughness: 0.24,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      sheen: 0.3,
      sheenColor: new THREE.Color("#fff4e6"),
      envMapIntensity: 0.75,
    });
    const bronze = new THREE.MeshStandardMaterial({ color: "#c0915f", metalness: 1, roughness: 0.25 });
    return { cupGeo, saucerGeo, handleGeo, porcelain, bronze };
  }, [segments]);

  const disposables = useMemo(
    () => [cupGeo, saucerGeo, handleGeo, porcelain, bronze],
    [cupGeo, saucerGeo, handleGeo, porcelain, bronze],
  );
  useDisposable(disposables);

  const handleY = 0.235;
  const handleX = cupOuterRadius((handleY - 0.03) / (CUP.innerTop - 0.03)) + 0.07;

  return (
    <group name="CoffeeCup" position={[SCENE.brewX, SCENE.dripTrayTop, SCENE.brewZ]}>
      <mesh geometry={saucerGeo} material={porcelain} />
      {/* bronze line on the saucer well */}
      <mesh position={[0, 0.0425, 0]} rotation={[Math.PI / 2, 0, 0]} material={bronze}>
        <torusGeometry args={[0.47, 0.0028, 6, segments]} />
      </mesh>

      {/* cup rotated so the handle faces the camera's right */}
      <group position={[0, SCENE.saucerHeight, 0]} rotation={[0, -0.55, 0]}>
        <mesh geometry={cupGeo} material={porcelain} />
        {/* fine bronze band just under the rim */}
        <mesh position={[0, CUP.innerTop - 0.03, 0]} rotation={[Math.PI / 2, 0, 0]} material={bronze}>
          <torusGeometry args={[cupOuterRadius(0.92) + 0.001, 0.0035, 6, segments]} />
        </mesh>
        <mesh
          geometry={handleGeo}
          material={porcelain}
          position={[handleX - 0.085, handleY, 0]}
          rotation={[0, 0, -Math.PI * 0.64]}
          scale={[1, 1.12, 1.5]}
        />
      </group>
    </group>
  );
}
