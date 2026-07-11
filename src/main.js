import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import './style.css';

const MAP = [
  '#################',
  '#o.....#.#.....o#',
  '#.###.#.#.#.###.#',
  '#.....#...#.....#',
  '###.#.###.###.#.#',
  '#...#.........#.#',
  '#.###.##.##.###.#',
  '#......#.#......#',
  '#.###.#...#.###.#',
  '#.....#.G.#.....#',
  '###.#.#####.#.###',
  '#...#...P...#...#',
  '#.###.#####.###.#',
  '#o..#...#...#..o#',
  '###.###.#.###.###',
  '#...............#',
  '#################',
];

const rows = MAP.length;
const cols = MAP[0].length;
const DIRS = {
  ArrowUp: { r: -1, c: 0, angle: Math.PI / 2 }, KeyW: { r: -1, c: 0, angle: Math.PI / 2 },
  ArrowDown: { r: 1, c: 0, angle: -Math.PI / 2 }, KeyS: { r: 1, c: 0, angle: -Math.PI / 2 },
  ArrowLeft: { r: 0, c: -1, angle: Math.PI }, KeyA: { r: 0, c: -1, angle: Math.PI },
  ArrowRight: { r: 0, c: 1, angle: 0 }, KeyD: { r: 0, c: 1, angle: 0 },
};

const canvas = document.querySelector('#game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050713);
scene.fog = new THREE.FogExp2(0x050713, 0.032);
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 16.7, 11.5);
camera.lookAt(0, 0, 0);

scene.add(new THREE.HemisphereLight(0x7fd8ff, 0x080516, 1.35));
const keyLight = new THREE.DirectionalLight(0xaedfff, 3.4);
keyLight.position.set(-6, 13, 6);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.left = keyLight.shadow.camera.bottom = -11;
keyLight.shadow.camera.right = keyLight.shadow.camera.top = 11;
scene.add(keyLight);
const rimLight = new THREE.PointLight(0x315bff, 36, 25, 2);
rimLight.position.set(6, 5, -6);
scene.add(rimLight);

const maze = new THREE.Group();
scene.add(maze);
const floor = new THREE.Mesh(
  new RoundedBoxGeometry(cols + 1.2, 0.34, rows + 1.2, 4, 0.32),
  new THREE.MeshStandardMaterial({ color: 0x08101d, roughness: 0.55, metalness: 0.4 })
);
floor.position.y = -0.28;
floor.receiveShadow = true;
maze.add(floor);

const grid = new THREE.GridHelper(24, 48, 0x173458, 0x10213a);
grid.position.y = -0.095;
grid.material.opacity = 0.18;
grid.material.transparent = true;
maze.add(grid);

const wallGeo = new RoundedBoxGeometry(0.92, 0.72, 0.92, 5, 0.15);
const wallMat = new THREE.MeshPhysicalMaterial({ color: 0x142b5a, roughness: 0.18, metalness: 0.25, clearcoat: 0.7, emissive: 0x071c5a, emissiveIntensity: 1.15 });
const wallEdgeMat = new THREE.MeshBasicMaterial({ color: 0x2d73ff, transparent: true, opacity: 0.52 });
const pelletGeo = new THREE.SphereGeometry(0.075, 16, 12);
const pelletMat = new THREE.MeshStandardMaterial({ color: 0xffefb5, emissive: 0xffb632, emissiveIntensity: 2.5, roughness: 0.2 });
const powerGeo = new THREE.SphereGeometry(0.19, 28, 20);
const powerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x49dfff, emissiveIntensity: 5, roughness: 0.1 });
const pellets = new Map();
let playerStart = { r: 11, c: 8 };
let ghostStart = { r: 9, c: 8 };

const worldX = c => c - cols / 2 + 0.5;
const worldZ = r => r - rows / 2 + 0.5;
const keyOf = (r, c) => `${r},${c}`;
const isWall = (r, c) => !MAP[Math.round(r)] || MAP[Math.round(r)][Math.round(c)] === '#';

function buildMaze() {
  MAP.forEach((line, r) => [...line].forEach((cell, c) => {
    if (cell === '#') {
      const wall = new THREE.Mesh(wallGeo, wallMat);
      wall.position.set(worldX(c), 0.26, worldZ(r));
      wall.castShadow = wall.receiveShadow = true;
      maze.add(wall);
      const edge = new THREE.LineSegments(new THREE.EdgesGeometry(wallGeo, 35), wallEdgeMat);
      edge.position.copy(wall.position);
      maze.add(edge);
    } else {
      if (cell === 'P') playerStart = { r, c };
      if (cell === 'G') ghostStart = { r, c };
      if (cell === '.' || cell === 'o') addPellet(r, c, cell === 'o');
    }
  }));
}

function addPellet(r, c, power) {
  const mesh = new THREE.Mesh(power ? powerGeo : pelletGeo, power ? powerMat : pelletMat);
  mesh.position.set(worldX(c), power ? 0.29 : 0.17, worldZ(r));
  mesh.userData = { power, baseY: mesh.position.y, phase: Math.random() * 6.28 };
  maze.add(mesh);
  pellets.set(keyOf(r, c), mesh);
  if (power) {
    const glow = new THREE.PointLight(0x3cdfff, 2.6, 2.2, 2);
    glow.position.set(0, 0.25, 0);
    mesh.add(glow);
  }
}
buildMaze();

function createPac() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 56, 36, 0.38, Math.PI * 2 - 0.76),
    new THREE.MeshPhysicalMaterial({ color: 0xffd91f, emissive: 0x8b5f00, emissiveIntensity: 0.48, roughness: 0.18, metalness: 0.05, clearcoat: 0.8 })
  );
  body.castShadow = true;
  body.rotation.x = Math.PI;
  group.add(body);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 12), new THREE.MeshBasicMaterial({ color: 0x10131e }));
  eye.position.set(0.08, 0.27, -0.24);
  group.add(eye);
  const glow = new THREE.PointLight(0xffcf27, 3.5, 3, 2);
  glow.position.y = 0.25;
  group.add(glow);
  group.userData.body = body;
  return group;
}

function createGhost(color, name, offset) {
  const group = new THREE.Group();
  const mat = new THREE.MeshPhysicalMaterial({ color, emissive: color, emissiveIntensity: 0.32, roughness: 0.22, clearcoat: 0.6 });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.39, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.64), mat);
  head.position.y = 0.16;
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.34, 0.42, 40, 1, false), mat);
  skirt.position.y = -0.1;
  group.add(head, skirt);
  head.userData.ghostBody = skirt.userData.ghostBody = true;
  for (let i = -1; i <= 1; i++) {
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.145, 20, 12), mat);
    foot.scale.y = 0.65;
    foot.position.set(i * 0.24, -0.33, 0);
    foot.userData.ghostBody = true;
    group.add(foot);
  }
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15 });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x172652 });
  [-0.15, 0.15].forEach(x => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 14), eyeMat);
    eye.position.set(x, 0.18, 0.34);
    eye.scale.y = 1.25;
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.043, 12, 8), pupilMat);
    pupil.position.set(0, 0, 0.087);
    eye.add(pupil);
    group.add(eye);
  });
  group.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return { mesh: group, baseMat: mat, afraid: false, color, name, r: ghostStart.r, c: ghostStart.c + offset, spawnR: ghostStart.r, spawnC: ghostStart.c + offset, dir: { r: 0, c: offset < 0 ? -1 : 1 }, active: true, respawn: 0, phase: Math.random() * 6.28 };
}

const playerMesh = createPac();
scene.add(playerMesh);
const player = { ...playerStart, dir: { r: 0, c: 0, angle: 0 }, next: { r: 0, c: 0, angle: 0 }, decisionKey: null };
const ghosts = [
  createGhost(0xff3e6c, 'BLINK', -1), createGhost(0x42d9ff, 'GLITCH', 0),
  createGhost(0xff8ee3, 'PIXEL', 1), createGhost(0xff9d36, 'EMBER', 0),
];
ghosts[3].spawnR -= 2; ghosts[3].r -= 2;
ghosts.forEach(g => scene.add(g.mesh));

const frightenedMat = new THREE.MeshPhysicalMaterial({ color: 0x275cff, emissive: 0x244cff, emissiveIntensity: 1.2, roughness: 0.25, clearcoat: 0.7 });
let score = 0, lives = 3, high = Number(localStorage.getItem('neonPacHigh') || 0);
let powered = 0, shootCooldown = 0, started = false, paused = false, over = false, won = false;
let soundOn = true, lastTime = performance.now(), elapsed = 0;
const shots = [], particles = [];
window.__gameDebug = () => ({ player: { r: player.r, c: player.c, dir: player.dir, next: player.next }, ghosts: ghosts.map(g => ({ r:g.r, c:g.c, active:g.active })), score, lives, powered, started, paused, over });

function resetPositions() {
  Object.assign(player, { ...playerStart, dir: { r: 0, c: 0, angle: 0 }, next: { r: 0, c: 0, angle: 0 }, decisionKey: null });
  ghosts.forEach(g => { g.r = g.spawnR; g.c = g.spawnC; g.dir = { r: 0, c: 1 }; g.decisionKey = null; g.active = true; g.respawn = 0; g.mesh.visible = true; setGhostFrightened(g, false); });
  syncMeshes();
}

function syncMeshes() {
  playerMesh.position.set(worldX(player.c), 0.45, worldZ(player.r));
  playerMesh.rotation.y = player.dir.angle || 0;
  ghosts.forEach(g => {
    g.mesh.position.set(worldX(g.c), 0.45 + Math.sin(elapsed * 5 + g.phase) * 0.045, worldZ(g.r));
    g.mesh.visible = g.active;
  });
}
resetPositions();

function canMove(r, c, d) { return !isWall(Math.round(r) + d.r, Math.round(c) + d.c); }
function nearCenter(v, step) { return Math.abs(v - Math.round(v)) < step + 0.025; }

function movePlayer(dt) {
  const speed = 4.25, step = speed * dt;
  const centerKey = keyOf(Math.round(player.r), Math.round(player.c));
  const waitingToStart = !player.dir.r && !player.dir.c && (player.next.r || player.next.c);
  if ((centerKey !== player.decisionKey || waitingToStart) && nearCenter(player.r, step) && nearCenter(player.c, step)) {
    player.r = Math.round(player.r); player.c = Math.round(player.c);
    player.decisionKey = centerKey;
    if (canMove(player.r, player.c, player.next)) player.dir = { ...player.next };
    if (!canMove(player.r, player.c, player.dir)) player.dir = { r: 0, c: 0, angle: player.dir.angle };
  }
  player.r += player.dir.r * step;
  player.c += player.dir.c * step;
  playerMesh.rotation.y = THREE.MathUtils.lerp(playerMesh.rotation.y, player.dir.angle || 0, Math.min(1, dt * 16));
  const cellKey = keyOf(Math.round(player.r), Math.round(player.c));
  const pellet = pellets.get(cellKey);
  if (pellet && Math.hypot(player.r - Math.round(player.r), player.c - Math.round(player.c)) < 0.32) eatPellet(cellKey, pellet);
}

function chooseGhostDir(g) {
  const options = Object.values(DIRS).slice(0, 8).filter((d, i, a) => i === a.findIndex(x => x.r === d.r && x.c === d.c)).filter(d => canMove(g.r, g.c, d));
  const forward = options.filter(d => !(d.r === -g.dir.r && d.c === -g.dir.c));
  const pool = forward.length ? forward : options;
  if (!pool.length) return { r: 0, c: 0 };
  const targetR = powered > 0 ? rows - player.r : player.r;
  const targetC = powered > 0 ? cols - player.c : player.c;
  pool.sort((a, b) => {
    const da = Math.abs(g.r + a.r - targetR) + Math.abs(g.c + a.c - targetC) + Math.random() * (powered ? 6 : 1.8);
    const db = Math.abs(g.r + b.r - targetR) + Math.abs(g.c + b.c - targetC) + Math.random() * (powered ? 6 : 1.8);
    return da - db;
  });
  return pool[0];
}

function moveGhosts(dt) {
  ghosts.forEach((g, index) => {
    if (!g.active) {
      g.respawn -= dt;
      if (g.respawn <= 0) { g.active = true; g.mesh.visible = true; g.r = g.spawnR; g.c = g.spawnC; g.decisionKey = null; burst(g.r, g.c, g.color, 12); }
      return;
    }
    const speed = powered > 0 ? 2.5 : 2.85 + index * 0.08;
    const step = speed * dt;
    const centerKey = keyOf(Math.round(g.r), Math.round(g.c));
    if (centerKey !== g.decisionKey && nearCenter(g.r, step) && nearCenter(g.c, step)) {
      g.r = Math.round(g.r); g.c = Math.round(g.c); g.dir = chooseGhostDir(g);
      g.decisionKey = centerKey;
    }
    g.r += g.dir.r * step; g.c += g.dir.c * step;
    if (Math.hypot(g.r - player.r, g.c - player.c) < 0.62) {
      if (powered > 0) defeatGhost(g); else loseLife();
    }
  });
}

function eatPellet(key, mesh) {
  pellets.delete(key); maze.remove(mesh);
  score += mesh.userData.power ? 100 : 10;
  tone(mesh.userData.power ? 660 : 260, 0.055, mesh.userData.power ? 'sawtooth' : 'sine', 0.04);
  if (mesh.userData.power) {
    powered = 10; showToast();
    ghosts.forEach(g => setGhostFrightened(g, true));
    burst(player.r, player.c, 0x43e8ff, 30);
  }
  updateHud();
  if (!pellets.size) finish(true);
}

function setGhostFrightened(g, afraid) {
  if (g.afraid === afraid) return;
  g.afraid = afraid;
  g.mesh.traverse(o => {
    if (o.isMesh && o.userData.ghostBody) o.material = afraid ? frightenedMat : g.baseMat;
  });
}

function shoot() {
  if (!started || paused || over || powered <= 0 || shootCooldown > 0 || (!player.dir.r && !player.dir.c)) return;
  shootCooldown = 0.22;
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.115, 18, 12), new THREE.MeshBasicMaterial({ color: 0xb9f7ff }));
  const light = new THREE.PointLight(0x50eaff, 4, 3, 2); mesh.add(light);
  scene.add(mesh);
  shots.push({ r: player.r, c: player.c, dr: player.dir.r, dc: player.dir.c, mesh, life: 1.6 });
  burst(player.r + player.dir.r * .4, player.c + player.dir.c * .4, 0x73efff, 7);
  tone(780, .09, 'square', .055);
}

function moveShots(dt) {
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i]; s.life -= dt; s.r += s.dr * dt * 9; s.c += s.dc * dt * 9;
    s.mesh.position.set(worldX(s.c), 0.48, worldZ(s.r));
    let hit = isWall(s.r, s.c) || s.life <= 0;
    for (const g of ghosts) if (g.active && Math.hypot(g.r - s.r, g.c - s.c) < .48) { defeatGhost(g); hit = true; break; }
    if (hit) { burst(s.r, s.c, 0x78eaff, 10); scene.remove(s.mesh); shots.splice(i, 1); }
  }
}

function defeatGhost(g) {
  if (!g.active) return;
  g.active = false; g.mesh.visible = false; g.respawn = 4.2; score += 300;
  burst(g.r, g.c, g.color, 26); tone(430, .22, 'sawtooth', .07); updateHud();
}

function loseLife() {
  if (over || paused) return;
  lives--; powered = 0; shots.splice(0).forEach(s => scene.remove(s.mesh));
  burst(player.r, player.c, 0xffd82f, 35); tone(90, .45, 'sawtooth', .09); updateHud();
  if (lives <= 0) finish(false);
  else { paused = true; showMessage('READY', 'ONE MORE TRY'); setTimeout(() => { if (!over) { resetPositions(); paused = false; hideMessage(); } }, 1200); }
}

function finish(success) {
  over = true; won = success;
  high = Math.max(high, score); localStorage.setItem('neonPacHigh', high); updateHud();
  showMessage(success ? 'MAZE CLEAR' : 'GAME OVER', 'PRESS ENTER TO PLAY AGAIN');
  tone(success ? 740 : 120, .55, success ? 'triangle' : 'sawtooth', .08);
}

function burst(r, c, color, count) {
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true });
  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(Math.random() * .035 + .025, 8, 6), mat.clone());
    mesh.position.set(worldX(c), .45, worldZ(r)); scene.add(mesh);
    particles.push({ mesh, vx:(Math.random()-.5)*3.5, vy:Math.random()*2.6+.3, vz:(Math.random()-.5)*3.5, life:Math.random()*.45+.35 });
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]; p.life -= dt; p.vy -= 5 * dt;
    p.mesh.position.x += p.vx * dt; p.mesh.position.y += p.vy * dt; p.mesh.position.z += p.vz * dt;
    p.mesh.material.opacity = Math.max(0, p.life * 2);
    if (p.life <= 0) { scene.remove(p.mesh); particles.splice(i, 1); }
  }
}

let audioCtx;
function tone(freq, duration, type='sine', volume=.04) {
  if (!soundOn) return;
  audioCtx ||= new AudioContext();
  const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
  osc.type = type; osc.frequency.setValueAtTime(freq, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(Math.max(45, freq*.72), audioCtx.currentTime + duration);
  gain.gain.setValueAtTime(volume, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audioCtx.currentTime + duration);
  osc.connect(gain).connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + duration);
}

function showToast() { const t=document.querySelector('#toast'); t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2200); }
function showMessage(title, sub) { const m=document.querySelector('#message'); m.innerHTML=`${title}<small>${sub}</small>`; m.classList.add('show'); }
function hideMessage() { document.querySelector('#message').classList.remove('show'); }
function updateHud() {
  document.querySelector('#score').textContent = String(score).padStart(6,'0');
  document.querySelector('#high-score').textContent = String(Math.max(score,high)).padStart(6,'0');
  document.querySelector('#lives').textContent = Array(Math.max(0,lives)).fill('●').join(' ');
}
updateHud();

function newGame() {
  location.reload();
}

addEventListener('keydown', e => {
  if (DIRS[e.code]) { e.preventDefault(); player.next = { ...DIRS[e.code] }; if (!player.dir.r && !player.dir.c) player.decisionKey = null; }
  if (e.code === 'Space') { e.preventDefault(); shoot(); }
  if (e.code === 'KeyP' && started && !over) { paused = !paused; paused ? showMessage('PAUSED','PRESS P TO RESUME') : hideMessage(); }
  if (e.code === 'Enter' && over) newGame();
});
document.querySelector('#start-button').addEventListener('click', () => {
  started = true; document.querySelector('#start-screen').classList.add('hidden'); tone(440,.13,'triangle',.07);
  setTimeout(() => tone(660,.16,'triangle',.06), 120);
});
document.querySelector('#sound').addEventListener('click', e => { soundOn=!soundOn; e.currentTarget.textContent=soundOn?'♪':'×'; });

function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - lastTime) / 1000, 0.033); lastTime = now; elapsed += dt;
  if (started && !paused && !over) {
    movePlayer(dt); moveGhosts(dt); moveShots(dt);
    powered = Math.max(0, powered - dt); shootCooldown = Math.max(0, shootCooldown - dt);
    if (powered === 0) ghosts.forEach(g => setGhostFrightened(g, false));
  }
  updateParticles(dt);
  syncMeshes();
  playerMesh.userData.body.rotation.z = Math.sin(elapsed * 14) * .045;
  pellets.forEach(p => { p.rotation.y += dt * 1.6; p.position.y = p.userData.baseY + Math.sin(elapsed * 3 + p.userData.phase) * (p.userData.power ? .06 : .025); });
  const wrap = document.querySelector('#power-wrap'); wrap.classList.toggle('active', powered > 0);
  document.querySelector('#power-bar').style.transform = `scaleX(${powered/10})`;
  document.querySelector('#power-seconds').textContent = `${powered.toFixed(1)}s`;
  const targetX = started ? worldX(player.c) * .08 : 0;
  const targetZ = started ? worldZ(player.r) * .05 : 0;
  camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, dt * 1.2);
  camera.position.z = THREE.MathUtils.lerp(camera.position.z, 11.5 + targetZ, dt * 1.2);
  camera.lookAt(camera.position.x * .25, 0, targetZ * .4);
  renderer.render(scene, camera);
}
requestAnimationFrame(animate);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio,2));
});
