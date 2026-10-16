import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { POINTS } from './config.js';

const TILE_DEPTH = 0.32;
const FOV = 30;
const WOOD_SIDE = 0xdcbc80;
const SQUASH_MS = 180;

function letterTexture(letter, points) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const wood = ctx.createLinearGradient(0, 0, size, size);
  wood.addColorStop(0, '#f6e4bd');
  wood.addColorStop(0.6, '#ecd29c');
  wood.addColorStop(1, '#dcbc80');
  ctx.fillStyle = wood;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#2a2118';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${size * 0.62}px Georgia, "Times New Roman", serif`;
  ctx.fillText(letter, size / 2, size * 0.53);
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `bold ${size * 0.17}px Arial, sans-serif`;
  ctx.fillText(String(points), size * 0.9, size * 0.9);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function createRenderer(canvas, layout) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 10, 10000);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x8899bb, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  scene.add(sun, sun.target);

  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.ShadowMaterial({ opacity: 0.35 }),
  );
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  const geometry = new RoundedBoxGeometry(1, 1, TILE_DEPTH, 4, 0.1);
  const sideMaterial = new THREE.MeshStandardMaterial({ color: WOOD_SIDE, roughness: 0.7 });
  const meshes = new Map();

  function meshFor(state) {
    if (!meshes.has(state.id)) {
      const front = new THREE.MeshStandardMaterial({ map: letterTexture(state.letter, POINTS[state.letter]), roughness: 0.6 });
      // BoxGeometry material order: +x, -x, +y, -y, +z (front), -z.
      const mesh = new THREE.Mesh(geometry, [sideMaterial, sideMaterial, sideMaterial, sideMaterial, front, sideMaterial]);
      mesh.castShadow = true;
      scene.add(mesh);
      meshes.set(state.id, mesh);
    }
    return meshes.get(state.id);
  }

  let tileSize = layout.tileSize;
  const squashes = new Map();

  function resize(next) {
    const { width, height } = next;
    tileSize = next.tileSize;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Distance at which the z = 0 plane maps 1:1 to CSS pixels.
    const distance = height / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    camera.position.set(width / 2, -height / 2, distance);
    camera.lookAt(width / 2, -height / 2, 0);
    camera.updateProjectionMatrix();

    shadowPlane.scale.set(width * 2, height * 2, 1);
    shadowPlane.position.set(width / 2, -height / 2, (-TILE_DEPTH * tileSize) / 2 - 1);

    sun.position.set(width * 0.3, height * 0.4, distance * 0.6);
    sun.target.position.set(width / 2, -height / 2, 0);
    const shadowCam = sun.shadow.camera;
    const extent = Math.max(width, height);
    shadowCam.left = -extent;
    shadowCam.right = extent;
    shadowCam.top = extent;
    shadowCam.bottom = -extent;
    shadowCam.near = 1;
    shadowCam.far = distance * 3;
    shadowCam.updateProjectionMatrix();
  }

  function sync(tileStates) {
    // Tiles removed by a restart keep their mesh but stay hidden.
    for (const mesh of meshes.values()) mesh.visible = false;
    for (const state of tileStates) {
      const mesh = meshFor(state);
      mesh.visible = state.visible;
      // Loose tiles move in front of the rack so they never clip snapped ones.
      mesh.position.set(state.x, -state.y, state.snappedField === null ? TILE_DEPTH * tileSize : 0);
      mesh.rotation.z = -state.angle;
      mesh.scale.setScalar(tileSize);
      const startedAt = squashes.get(state.id);
      if (startedAt !== undefined) {
        const t = (performance.now() - startedAt) / SQUASH_MS;
        if (t >= 1) {
          squashes.delete(state.id);
        } else {
          const amount = Math.sin(t * Math.PI);
          mesh.scale.x *= 1 + 0.08 * amount;
          mesh.scale.y *= 1 - 0.12 * amount;
        }
      }
    }
    renderer.render(scene, camera);
  }

  resize(layout);
  function squash(tileId) {
    squashes.set(tileId, performance.now());
  }

  return { resize, sync, squash };
}
