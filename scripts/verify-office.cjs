// Geometry and data checks. Canvas is stubbed; these checks do not claim visual rendering coverage.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const ts = require('typescript');
const THREE = require('three');
require.extensions['.ts'] = (module, filename) => {
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    fileName: filename,
  });
  module._compile(output.outputText, filename);
};
const context = new Proxy({}, {
  get(target, key) {
    if (key in target) return target[key];
    if (key === 'measureText') return text => ({ width: text.length * 8 });
    if (key === 'createLinearGradient' || key === 'createRadialGradient') return () => ({ addColorStop() {} });
    return () => {};
  },
  set(target, key, value) { target[key] = value; return true; },
});
global.document = { createElement: () => ({ width: 0, height: 0, getContext: () => context }) };
const memory = new Map();
global.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) };

const { OFFICE_CONFIG } = require('../src/config/office.config.ts');
const { SITTABLE_CHAIRS } = require('../src/data/chairs.ts');
const { StorageService } = require('../src/services/storage.ts');
const { CharacterFactory } = require('../src/components/3d/Character.ts');
const { DeskFactory } = require('../src/components/3d/DeskFactory.ts');

assert.equal(SITTABLE_CHAIRS.length, 35, '33 existing seats and two executive sofa seats');
assert.equal(new Set(SITTABLE_CHAIRS.map(seat => seat.id)).size, 35);
for (const seat of SITTABLE_CHAIRS) {
  assert(seat.position.every(Number.isFinite));
  assert(seat.seatHeight >= 0.4 && seat.seatHeight <= 0.8, seat.name);
}
for (const employee of OFFICE_CONFIG.employees) {
  const task = SITTABLE_CHAIRS.find(seat => seat.id === employee.seatAnchorId);
  const visitor = SITTABLE_CHAIRS.find(seat => seat.id === employee.visitorSeatAnchorId);
  for (const [seat, localZ] of [[task, employee.id === 'ameen' ? 1.05 : 0.75], [visitor, -1.25]]) {
    assert(seat, employee.name);
    assert(Math.abs(seat.position[0] - employee.deskPosition[0] - Math.sin(employee.deskRotation) * localZ) < 1e-6);
    assert(Math.abs(seat.position[2] - employee.deskPosition[2] - Math.cos(employee.deskRotation) * localZ) < 1e-6);
  }
}

assert.equal(StorageService.getSettings().graphicsQuality, 'High');
for (const tier of ['Low', 'Medium', 'High']) {
  StorageService.saveSettings({ graphicsQuality: tier });
  StorageService.saveSettings({ soundEnabled: false });
  assert.equal(StorageService.getSettings().graphicsQuality, tier, 'Other settings must preserve selected quality');
}

const player = CharacterFactory.createPlayerAvatar();
const hip = player.group.children.find(child => child instanceof THREE.Group);
for (const seat of SITTABLE_CHAIRS) {
  player.setSitting(true, seat.kind === 'sofa', seat.kind === 'bar_stool', seat.seatHeight);
  assert(Math.abs(hip.position.y - seat.seatHeight - 0.085) < 1e-6, seat.name);
  player.group.updateMatrixWorld(true);
  const foot = new THREE.Box3().setFromObject(player.group.getObjectByName('Player left knee'));
  assert(Math.abs(foot.min.y - (seat.kind === 'bar_stool' ? 0.25 : 0)) < 0.035, `${seat.name}: feet supported`);
}

const ameenConfig = OFFICE_CONFIG.employees.find(employee => employee.id === 'ameen');
const ameen = CharacterFactory.createEmployeeAvatar(ameenConfig);
ameen.setSitting(true);
ameen.group.updateMatrixWorld(true);
const [deskX, , deskZ] = ameenConfig.deskPosition;
const tabletop = new THREE.Box3(new THREE.Vector3(deskX - 2, 0.73, deskZ - 0.8), new THREE.Vector3(deskX + 2, 0.83, deskZ + 0.8));
const ameenHip = ameen.group.children.find(child => child instanceof THREE.Group);
const shirt = new THREE.Color(ameenConfig.avatarColors.shirt).getHex();
const torso = ameenHip.children.find(child => child instanceof THREE.Mesh && !Array.isArray(child.material) && child.material.color?.getHex() === shirt);
assert(torso, 'CEO torso must exist');
const torsoBounds = new THREE.Box3().setFromObject(torso);
assert(torsoBounds.max.x - torsoBounds.min.x >= 0.98, 'CEO has a broader silhouette');
assert(!torsoBounds.intersectsBox(tabletop), 'CEO torso must clear the tabletop');
ameen.group.traverse(mesh => {
  if (!(mesh instanceof THREE.Mesh)) return;
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  if (materials.some(material => material.color?.getHex() === new THREE.Color(ameenConfig.avatarColors.skin).getHex())) {
    assert(!new THREE.Box3().setFromObject(mesh).intersectsBox(tabletop), 'Skin must not intersect the tabletop');
  }
});

const monitor = DeskFactory.createMonitor(0.64, 0.4, new THREE.MeshBasicMaterial({ map: new THREE.Texture() }), new THREE.MeshStandardMaterial({ color: 0x18181B }));
const display = monitor.getObjectByName('Monitor display');
const chassis = monitor.children.find(child => child.geometry instanceof THREE.BoxGeometry);
assert(display && chassis);
assert.equal(chassis.material.map, null, 'Monitor backs must not display screen content');
assert(display.position.z > chassis.geometry.parameters.depth / 2, 'Display must sit in front of bezel');
const diningTop = new THREE.Box3(new THREE.Vector3(0.801, 0.711, -18.549), new THREE.Vector3(3.199, 0.789, -17.451));
for (const seat of SITTABLE_CHAIRS.filter(seat => seat.id.startsWith('canteen_dining_'))) {
  ameen.group.position.set(...seat.position); ameen.group.rotation.y = seat.lookDirection;
  ameen.setSitting(true, false, false, seat.seatHeight); ameen.setHoldingProp('meal_plate', 'rice');
  for (const time of [0, 0.8, 1.6, 2.4, 3.2]) {
    ameen.updateAnimation(time, false); ameen.group.updateMatrixWorld(true);
    ameen.group.traverse(mesh => {
      if (mesh instanceof THREE.Mesh) assert(!new THREE.Box3().setFromObject(mesh).intersectsBox(diningTop), 'CEO body and food must clear the dining tabletop');
    });
  }
}
for (const config of OFFICE_CONFIG.employees) {
  const employee = CharacterFactory.createEmployeeAvatar(config);
  let hairstyle;
  employee.group.traverse(part => { if (part.userData.hairstyle) hairstyle = part; });
  assert(hairstyle && hairstyle.children.length > 0, `${config.name}: hairstyle must survive geometry batching`);
  for (const seat of SITTABLE_CHAIRS) {
    employee.setSitting(true, seat.kind === 'sofa', seat.kind === 'bar_stool', seat.seatHeight);
    employee.group.updateMatrixWorld(true);
    const feet = new THREE.Box3().setFromObject(employee.group.getObjectByName('Employee left knee'));
    assert(Math.abs(feet.min.y - (seat.kind === 'bar_stool' ? 0.25 : 0)) < 0.05, `${config.name}: ${seat.name}: feet supported`);
  }
}
console.log('PASS: 35 seats, saved quality, player and employee feet, CEO desk clearance, and monitor construction.');
