import * as THREE from 'three';

export const EMPLOYEE_HAIRSTYLES: Record<string, string> = {
  adhi: 'swept quiff', abbu: 'soft side part', prox: 'close crop',
  vaibav: 'curly high top', taha: 'curtain part', rewaant: 'textured fringe', ameen: 'receding slick back',
};

/** All pieces share the avatar hair material and merge into one animated head batch. */
export function createEmployeeHair(id: string, width: number, depth: number, top: number, material: THREE.Material) {
  const root = new THREE.Group(); root.name = `Hair: ${EMPLOYEE_HAIRSTYLES[id] || 'short crop'}`;
  root.userData.hairstyle = EMPLOYEE_HAIRSTYLES[id];
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, tilt = 0) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w * width, h * width, d * depth), material);
    mesh.position.set(x * width, top + y * width, z * depth); mesh.rotation.z = tilt; mesh.castShadow = true; root.add(mesh);
  };
  const curl = (x: number, y: number, z: number, size = 0.19) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(width * size, 8, 5), material);
    mesh.position.set(x * width, top + y * width, z * depth); mesh.scale.set(1, 0.8, 1); root.add(mesh);
  };
  // Short side and back panels leave eyebrows and facial textures visible.
  box(1.04, 0.27, 0.18, 0, -0.12, -0.45);
  for (const side of [-1, 1]) box(0.10, 0.26, 0.76, side * 0.49, -0.12, -0.06);
  switch (id) {
    case 'adhi':
      box(0.94, 0.13, 0.83, 0, 0.02, -0.04);
      for (let i = 0; i < 4; i++) box(0.25, 0.23 + i * 0.025, 0.55, -0.34 + i * 0.21, 0.15, 0.16, -0.16);
      break;
    case 'abbu':
      box(0.96, 0.12, 0.9, 0, 0.02, 0);
      for (let i = 0; i < 4; i++) { curl(-0.30 + i * 0.20, 0.12 + (i < 2 ? 0.04 : 0), 0.14, 0.23); }
      box(0.13, 0.07, 0.83, 0.23, 0.1, 0);
      break;
    case 'prox':
      box(1.02, 0.085, 0.98, 0, 0.005, 0);
      box(0.95, 0.045, 0.09, 0, -0.03, 0.46);
      break;
    case 'vaibav':
      for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) curl((col - 1) * 0.30, 0.12 + (col === 1 ? 0.05 : 0), (row - 1) * 0.30, 0.24);
      break;
    case 'taha':
      box(0.98, 0.11, 0.86, 0, 0.03, -0.06);
      box(0.44, 0.18, 0.61, -0.26, 0.12, 0.12, -0.12);
      box(0.44, 0.18, 0.61, 0.26, 0.12, 0.12, 0.12);
      for (const side of [-1, 1]) box(0.21, 0.22, 0.18, side * 0.34, -0.035, 0.44, side * 0.15);
      break;
    case 'rewaant':
      box(0.98, 0.15, 0.96, 0, 0.04, 0);
      for (let i = 0; i < 5; i++) box(0.21, 0.19, 0.23, -0.39 + i * 0.19, 0.015 - i * 0.018, 0.43, -0.23);
      box(0.52, 0.14, 0.75, -0.16, 0.15, 0.01, -0.12);
      break;
    case 'ameen':
      box(0.91, 0.08, 0.58, 0, 0.02, -0.19);
      for (const side of [-1, 1]) box(0.25, 0.10, 0.77, side * 0.35, 0.04, -0.09, side * 0.08);
      for (let i = 0; i < 3; i++) box(0.14, 0.055, 0.54, -0.16 + i * 0.16, 0.085, -0.22, -0.08);
      break;
  }
  return root;
}
