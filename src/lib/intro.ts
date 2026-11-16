/**
 * Tiny cross-component signals for the opening sequence:
 *  - sceneReady: the 3D scene (or its fallback) has rendered its first frame
 *  - introDone:  the preloader curtain has lifted — hero & nav entrances may play
 */
type Cb = () => void;

function signal() {
  let fired = false;
  const cbs = new Set<Cb>();
  return {
    fire() {
      if (fired) return;
      fired = true;
      cbs.forEach((cb) => cb());
      cbs.clear();
    },
    on(cb: Cb): () => void {
      if (fired) {
        cb();
        return () => {};
      }
      cbs.add(cb);
      return () => cbs.delete(cb);
    },
  };
}

const sceneReady = signal();
const introDone = signal();

export const markSceneReady = sceneReady.fire;
export const onSceneReady = sceneReady.on;
export const markIntroDone = introDone.fire;
export const onIntroDone = introDone.on;
