import * as THREE from 'three';

export type PlateDish = 'rice' | 'pasta' | 'salad' | 'sandwich' | 'fruit' | 'nuts' | 'bar';
const foodMaterials = new Map<string, THREE.MeshStandardMaterial>();
const foodMaterial = (color: string, roughness = 0.8) => {
  const key = `${color}:${roughness}`;
  let material = foodMaterials.get(key);
  if (!material) {
    material = new THREE.MeshStandardMaterial({ color, roughness });
    material.userData.sharedFoodMaterial = true;
    foodMaterials.set(key, material);
  }
  return material;
};
/** Small shared-style food models: geometry stays static after serving. */
export function createFoodPlate(dish: PlateDish = 'rice'): THREE.Group {
  const group = new THREE.Group(); group.name = `${dish} meal plate`;
  const ceramic = foodMaterial('#EDE9DD', 0.35);
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.022, 24), ceramic);
  group.add(plate);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.168, 0.012, 6, 24), ceramic);
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.016; group.add(rim);
  const material = (color: string) => foodMaterial(color);
  const ball = (x: number, y: number, z: number, size: number, color: string, scale?: number[]) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(size, 10, 7), material(color));
    mesh.position.set(x, y, z); if (scale) mesh.scale.set(...scale as [number, number, number]); group.add(mesh);
  };
  if (dish === 'rice' || dish === 'pasta') {
    ball(-0.035, 0.06, 0.02, 0.105, dish === 'rice' ? '#E4D7B4' : '#D29B42', [1, 0.42, 1]);
    for (let i = 0; i < 6; i++) ball(0.07 + Math.sin(i) * 0.035, 0.04, Math.cos(i) * 0.07, 0.027, i % 2 ? '#47723A' : '#BA5634', [1, 0.7, 1]);
  } else if (dish === 'bar') {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.035, 0.065), material('#966E45'));
    bar.position.y = 0.035; group.add(bar);
  } else if (dish === 'sandwich') {
    for (const [y, color, h] of [[0.025, '#BA874D', 0.025], [0.046, '#487246', 0.01], [0.06, '#AE5138', 0.012], [0.08, '#D8B477', 0.025]] as const) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.20, h, 0.13), material(color)); mesh.position.y = y; mesh.rotation.y = 0.28; group.add(mesh);
    }
  } else {
    const colors = dish === 'salad' ? ['#537C43', '#6B944E', '#AF4B38'] : dish === 'fruit' ? ['#A94A35', '#CE8B32', '#6B8A3B'] : ['#9B6B3E', '#C29A68'];
    for (let i = 0; i < 11; i++) {
      const angle = i * 2.4, r = 0.025 + (i % 4) * 0.027;
      ball(Math.cos(angle) * r, 0.035 + (i % 3) * 0.008, Math.sin(angle) * r, dish === 'nuts' ? 0.018 : 0.035, colors[i % colors.length], dish === 'salad' ? [1.3, 0.25, 0.8] : [1, 0.7, 1]);
    }
  }
  return group;
}
