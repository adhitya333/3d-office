const fs = require('node:fs');
const assert = require('node:assert/strict');
const ts = require('typescript');
const THREE = require('three');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }, fileName: filename,
}).outputText, filename);
const { OFFICE_CONFIG } = require('../src/config/office.config.ts');
const { NPCBrainManager } = require('../src/services/npcBrain.ts');
const { NavigationService } = require('../src/services/navigation.ts');
const { EmployeeWorkManager, workPhase } = require('../src/services/employeeWorkManager.ts');
const { CollisionManager } = require('../src/components/3d/CollisionManager.ts');
const fakeController = () => ({ group: new THREE.Group(), updateAnimation() {}, lookAt(target) { this.group.lookAt(target); },
  setSitting(seated, sofa, bar, height) { this.seated = seated; this.seatHeight = height; }, setTalking() {}, setHoldingProp() {} });
const brain = new NPCBrainManager();
for (const employee of OFFICE_CONFIG.employees) brain.registerAgent(employee, fakeController());
assert(OFFICE_CONFIG.schedule.minBreakIntervalSec >= 480);
for (const employee of OFFICE_CONFIG.employees) assert(brain.getAgent(employee.id).breakCooldownTimer >= 480);
const originalRandom = Math.random;
Math.random = () => 0;
const a = brain.getAgent('adhi'), b = brain.getAgent('abbu'), c = brain.getAgent('prox');
brain.triggerRandomBreak(a); brain.triggerRandomBreak(b); brain.triggerRandomBreak(c);
assert.equal(a.targetPoint.id, 'canteen_coffee_machine');
assert.equal(b.targetPoint.id, 'canteen_coffee_queue_1');
assert.equal(c.state, 'AT_DESK_WORKING', 'Concurrent break limit must include departures in the same frame');
assert.notEqual(a.targetPoint.id, b.targetPoint.id);
a.controller.group.position.set(...a.targetPoint.position); brain.startTargetActivity(a, 1);
b.controller.group.position.set(...b.targetPoint.position); brain.startTargetActivity(b, 1);
assert.equal(a.state, 'COFFEE'); assert.equal(b.state, 'WAITING_FOR_COFFEE');
assert(a.controller.group.position.distanceTo(b.controller.group.position) > 1);
brain.commandBackToDesk(a.config.id);
// A reservation may be released before the departing person's body has left.
brain.update(0.01, 2, new THREE.Vector3(0, 0, 17));
assert.equal(b.state, 'WAITING_FOR_COFFEE', 'Queue must wait for physical clearance');
a.controller.group.position.set(0, 0, -11);
brain.update(0.01, 3, new THREE.Vector3(0, 0, 17));
assert.equal(b.targetPoint.id, 'canteen_coffee_machine');
assert(!NavigationService.getInstance().isPointOccupied('canteen_coffee_queue_1'));
const facing = c.controller.group.rotation.y;
brain.startChatWithPlayer(c.config.id); brain.startChatWithPlayer(c.config.id);
brain.update(0.01, 4, c.controller.group.position.clone().add(new THREE.Vector3(2, 0, 0)));
assert.equal(c.controller.group.rotation.y, facing, 'Seated conversation must not twist the whole body');
brain.endChatWithPlayer(c.config.id);
assert.equal(c.state, 'AT_DESK_WORKING'); assert.equal(c.controller.group.rotation.y, facing);
brain.setWorkStatus(c.config.id, 'thinking'); brain.triggerRandomBreak(c);
assert.equal(c.state, 'AT_DESK_WORKING', 'Busy employees stay at work');
brain.clearAgents();

const crowd = new NPCBrainManager();
const crowdCollisions = new CollisionManager();
crowd.setObstacleTest((x, z, radius) => crowdCollisions.isColliding(x, z, 0, radius));
for (const employee of OFFICE_CONFIG.employees) crowd.registerAgent(employee, fakeController());
crowd.triggerRandomBreak(crowd.getAgent('adhi')); crowd.triggerRandomBreak(crowd.getAgent('abbu'));
let reachedMachine = false, reachedQueue = false;
for (let frame = 0; frame < 3600; frame++) {
  crowd.update(1 / 60, frame / 60, new THREE.Vector3(0, 0, 17));
  const first = crowd.getAgent('adhi'), second = crowd.getAgent('abbu');
  assert(first.controller.group.position.distanceTo(second.controller.group.position) >= 0.68 - 1e-5, 'Two employees must stay separated while walking and queuing');
  reachedMachine ||= first.state === 'COFFEE'; reachedQueue ||= second.state === 'WAITING_FOR_COFFEE';
  if (reachedMachine && reachedQueue) break;
  assert(frame < 3599, `Both coffee visitors reach their separate spots: ${JSON.stringify([first, second].map(agent => ({ id: agent.config.id, state: agent.state, pos: agent.controller.group.position, waypoint: agent.path[agent.pathIndex] })))}`);
}
crowd.clearAgents();

// Check actual waypoint paths against the scene collision boxes, including the larger CEO.
for (const [roll, expectedState] of [[0, 'COFFEE'], [0.9, 'SNACK'], [0.5, 'SITTING_IN_LOUNGE']]) for (const config of OFFICE_CONFIG.employees) {
  Math.random = () => roll;
  const manager = new NPCBrainManager(); const controller = fakeController();
  manager.registerAgent(config, controller);
  const collision = new CollisionManager();
  manager.setObstacleTest((x, z, radius) => collision.isColliding(x, z, 0, radius));
  const agent = manager.getAgent(config.id);
  manager.triggerRandomBreak(agent);
  for (let frame = 0; frame < 3600 && agent.state === 'WALKING_TO_BREAK'; frame++) manager.update(1 / 60, frame / 60, new THREE.Vector3(0, 0, 17));
  assert.equal(agent.state, expectedState, `${config.name} reaches ${expectedState} without getting stuck: ${JSON.stringify(controller.group.position)} waypoint ${agent.pathIndex} ${JSON.stringify(agent.path[agent.pathIndex])}, length ${agent.path.length}, blocked ${agent.blockedTimer}`);
  manager.commandBackToDesk(config.id);
  for (let frame = 0; frame < 3600 && agent.state !== 'AT_DESK_WORKING'; frame++) manager.update(1 / 60, 60 + frame / 60, new THREE.Vector3(0, 0, 17));
  assert.equal(agent.state, 'AT_DESK_WORKING', `${config.name} returns to the chair at ${JSON.stringify(controller.group.position)} path ${agent.pathIndex}: ${JSON.stringify(agent.path[agent.pathIndex])}`);
  manager.clearAgents();
}
Math.random = originalRandom;

async function testBackgroundWork() {
  const { readChatStream } = require('../src/services/chatStream.ts');
  const encoded = new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hi ☕"}}]}\r\n\r\ndata: {"choices":[{"delta":{"content":" there"}}]}');
  const body = new ReadableStream({ start(controller) { for (let i = 0; i < encoded.length; i += 7) controller.enqueue(encoded.slice(i, i + 7)); controller.close(); } });
  assert.equal(await readChatStream(body, () => {}), 'Hi ☕ there', 'UTF-8 chunks and final SSE line must survive network boundaries');
  await assert.rejects(readChatStream(new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('data: {"error":{"message":"private diagnostics"}}\n')); controller.close(); } }), () => {}), /interrupted/);
  const messages = new Map(); const pending = new Map();
  const storage = { getChatMessages: id => [...(messages.get(id) || [])], getTasksForEmployee: () => [], saveChatMessage(message) {
    const list = messages.get(message.employeeId) || []; const index = list.findIndex(item => item.id === message.id);
    if (index < 0) list.push(message); else list[index] = message; messages.set(message.employeeId, list);
  } };
  const transport = {
    streamChatWithEmployee(employee, history, tasks, onChunk, signal) {
      assert.equal(signal.aborted, false);
      return new Promise((resolve, reject) => pending.set(employee.id, { resolve, reject, onChunk }));
    },
    askProgressUpdate: async () => 'The update is ready.',
    executeTask: (task, employee, progress) => new Promise(resolve => pending.set(task.id, { resolve, progress })),
  };
  const manager = new EmployeeWorkManager(storage, transport);
  const employeeA = { id: 'a' }, employeeB = { id: 'b' };
  let renders = 0; const unsubscribe = manager.subscribe('a', () => renders++);
  const jobA = manager.sendMessage(employeeA, 'First employee request');
  const jobB = manager.sendMessage(employeeB, 'Second employee request');
  assert.equal(manager.sendMessage(employeeA, 'Duplicate'), null, 'Synchronous lock prevents duplicate requests');
  assert.equal(manager.getActiveEmployees().length, 2);
  unsubscribe(); const closedAt = renders;
  pending.get('a').onChunk('Partial first reply', 'Partial');
  assert.equal(renders, closedAt, 'Closed panel is unsubscribed');
  assert.equal(manager.getSnapshot('a').chatStatus, 'responding', 'Work continues while panel is closed');
  assert.equal(manager.getSnapshot('b').chatStatus, 'thinking', 'Employees keep independent progress');
  pending.get('a').resolve('Finished first reply'); pending.get('b').resolve('Finished second reply');
  await Promise.all([jobA, jobB]);
  assert.equal(manager.getSnapshot('a').messages.at(-1).content, 'Finished first reply');
  assert.equal(storage.getChatMessages('a').length, 2, 'Streaming upserts one reply');
  assert.equal(storage.getChatMessages('b').at(-1).content, 'Finished second reply');
  assert.equal(manager.getActiveEmployees().length, 0);
  const failure = manager.sendMessage(employeeA, 'Failure test'); pending.get('a').reject(new Error('Disconnected')); await failure;
  assert.equal(manager.getSnapshot('a').messages.at(-1).delivery, 'failed');
  assert.equal(workPhase(manager.getSnapshot('a')), 'idle', 'Failures release the busy lock');
  const task = manager.executeTask({ id: 'task', title: 'Background task' }, employeeA);
  pending.get('task').progress('Generating the deliverable');
  assert.equal(manager.getSnapshot('a').executionStatus, 'Generating the deliverable');
  assert.equal(manager.executeTask({ id: 'duplicate' }, employeeA), null);
  pending.get('task').resolve({ id: 'output' }); await task;
  assert(manager.getSnapshot('a').messages.at(-1).content.includes('Finished'));
  assert.equal(manager.getSnapshot('a').executingTaskId, null);
  for (let i = 0; i < 100; i++) storage.saveChatMessage({ id: `history-${i}`, employeeId: 'history', sender: i % 2 ? 'employee' : 'user', content: 'Older message' });
  let historyCount = 0;
  const historyManager = new EmployeeWorkManager(storage, { ...transport, streamChatWithEmployee: async (employee, history) => { historyCount = history.length; return 'Recent context'; } });
  await historyManager.sendMessage({ id: 'history' }, 'Latest request');
  assert.equal(historyCount, 25, 'Long chats keep a bounded recent context within backend message limits');
  storage.saveChatMessage({ id: 'old', employeeId: 'old', delivery: 'thinking', content: 'Thinking…' });
  const reloaded = new EmployeeWorkManager(storage, transport);
  assert.equal(reloaded.getSnapshot('old').messages[0].delivery, 'interrupted', 'Reload recovery must not leave an endless spinner');
  console.log('PASS: Coffee reservations, physical queue clearance, seated conversations, all employee routes, independent background chat/task work and failure recovery.');
}
testBackgroundWork().catch(error => { console.error(error); process.exitCode = 1; });
