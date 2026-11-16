"use client";

import { useEffect } from "react";

interface Disposable {
  dispose: () => void;
}

/**
 * Dispose manually-created Three.js resources (materials, geometries, textures)
 * when the component unmounts or the resources are re-created.
 * Resources declared as JSX elements are disposed automatically by R3F;
 * this covers the ones we build imperatively in useMemo.
 */
export function useDisposable(resources: ReadonlyArray<Disposable | null | undefined>) {
  useEffect(() => {
    return () => {
      for (const r of resources) r?.dispose();
    };
  }, [resources]);
}
