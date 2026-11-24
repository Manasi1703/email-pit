import * as THREE from "three";
import { makeEmail } from "./emailData.js";
import { createRustle } from "./emailSound.js";

export const emailRustle = createRustle();   // shared, so a click anywhere can unlock the sound

export const EMAIL_SCENE = 2;   // index into windows/scenes.js: the room after the pigeons

const TAU = Math.PI * 2, PW = 0.34, PH = 0.22;               // envelope size
const SW = 0.32, SH = 0.23;                                      // a printed sheet
const FLYING = 14, SPAWN_EVERY = 0.7, CAP_S = 1000, CAP_E = 140, CAP = CAP_S + CAP_E;   // every sheet and envelope in the heap
const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const PASTELS = ["#f4efd8", "#d8ecd9", "#f3d6dc", "#f6ecb5", "#dfeaf2", "#ffffff", "#e9dfc3"];
function sheetTexture() {   // a printed-out email: header lines, then rows of text
  const c = document.createElement("canvas"); c.width = 256; c.height = 184; const g = c.getContext("2d");
  g.fillStyle = "#fbfaf6"; g.fillRect(0, 0, 256, 184);
  g.fillStyle = "rgba(40,40,50,0.55)"; g.fillRect(14, 14, 96, 7); g.fillStyle = "rgba(40,40,50,0.28)"; g.fillRect(14, 28, 140, 4); g.fillRect(14, 38, 120, 4);
  g.fillRect(14, 54, 228, 2);
  for (let r = 0; r < 9; r++) { g.fillStyle = "rgba(40,40,50,0.3)"; g.fillRect(14, 66 + r * 12, 228 - (r % 3) * 40 - Math.random() * 30, 4); }
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t;
}
let shared = null;
function envelopeTexture(variant) {
  const c = document.createElement("canvas"); c.width = 340; c.height = 220; const g = c.getContext("2d");
  const paper = ["#f7f2e7", "#f3ecdc", "#fbf8f0"][variant % 3];
  g.fillStyle = paper; g.fillRect(0, 0, 340, 220);
  g.strokeStyle = "rgba(60,50,40,0.18)"; g.lineWidth = 3; g.strokeRect(2, 2, 336, 216);
  g.beginPath(); g.moveTo(0, 0); g.lineTo(170, 120); g.lineTo(340, 0); g.stroke();   // the flap's seam
  g.fillStyle = "rgba(60,50,40,0.35)"; for (let i = 0; i < 3; i++) g.fillRect(105 + i * 4, 150 + i * 18, 150 - i * 30, 5);   // address lines
  g.strokeStyle = "rgba(170,60,50,0.6)"; g.lineWidth = 2; g.strokeRect(285, 128, 40, 46); g.fillStyle = "rgba(170,60,50,0.22)"; g.fillRect(285, 128, 40, 46);   // a stamp
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t;
}
function build() {
  const bodyGeo = new THREE.BoxGeometry(PW, PH, 0.008);
  const fs = new THREE.Shape(); fs.moveTo(-PW / 2, 0); fs.lineTo(PW / 2, 0); fs.lineTo(0, -PH * 0.58); fs.closePath();
  shared = {
    bodyGeo, flapGeo: new THREE.ShapeGeometry(fs),
    bodies: [0, 1, 2].map(i => new THREE.MeshStandardMaterial({ map: envelopeTexture(i), roughness: 0.92 })),
    flap: new THREE.MeshStandardMaterial({ color: "#e9e0cd", roughness: 0.95, side: THREE.DoubleSide }),
    badge: new THREE.MeshBasicMaterial({ color: "#e53935" }), badgeGeo: new THREE.CircleGeometry(0.03, 14)
  };
}
function makeEnvelope() {
  if (!shared) build();
  const g = new THREE.Group(), body = new THREE.Mesh(shared.bodyGeo, shared.bodies[Math.floor(Math.random() * 3)]); body.castShadow = true; g.add(body);
  const hinge = new THREE.Group(); hinge.position.set(0, PH / 2, 0.005); const flap = new THREE.Mesh(shared.flapGeo, shared.flap); hinge.add(flap); g.add(hinge);
  const badge = new THREE.Mesh(shared.badgeGeo, shared.badge); badge.position.set(PW / 2 - 0.02, PH / 2 - 0.02, 0.01); g.add(badge);   // an unread dot
  return { g, hinge };
}

/**
 * A heap made entirely of printed emails and envelopes, piled up on a white floor. More flutter down onto it like moths; hovering digs through it.
 * The papers are stacked for real: each one rests a paper's thickness above the papers it overlaps (following the local slope), so no two ever pass through each other.
 * A paper that arrives (shoved, sliding or landing) goes on top of whatever is there; a paper whose support is taken away sinks onto what is left underneath.
 * H, a height field over the floor, follows the tops of the papers. It is never drawn: it gives the pointer something to hit and tells papers which way is downhill.
 */
export function createEmails(parent, RM, onLand = () => {}) {
  const group = new THREE.Group(); parent.add(group);
  const floorY = RM.Y0, flying = [], A = { x0: -7, x1: 7, z0: -10, z1: -0.3 }, P0 = { x0: -2.3, x1: 2.3, z0: -5.4, z1: -1.5 };   // A: the floor papers can spread over (more than the screen shows; the screen's edges stop them); P0: where the heap starts out
  const CELL = 0.08, NX = Math.round((A.x1 - A.x0) / CELL) + 1, NZ = Math.round((A.z1 - A.z0) / CELL) + 1, dx = (A.x1 - A.x0) / (NX - 1), dz = (A.z1 - A.z0) / (NZ - 1), H = new Float32Array(NX * NZ);
  const OV = 0.4, HR = 0.2, TILT = 0.006, R = 0.7, REPOSE = 0.45, DIG = 0.06;   // OV: how close two papers' centres must be to overlap; HR: reach of a paper's top in H; R: dig radius
  let spawnT = 0, nextE = 0;
  const shape = (x, z) => { const g = (cx, cz, sx, sz, h) => h * Math.exp(-(((x - cx) / sx) ** 2 + ((z - cz) / sz) ** 2)); return g(0.0, -3.75, 1.2, 0.95, 0.95) + g(-1.05, -3.3, 0.65, 0.6, 0.4) + g(1.1, -3.05, 0.65, 0.65, 0.36) + g(0.1, -2.4, 1.1, 0.5, 0.08); };   // the heap's starting shape
  const hAt = (x, z) => {   // the surface height at any point (bilinear between grid points)
    const fx = clamp((x - A.x0) / dx, 0, NX - 1.001), fz = clamp((z - A.z0) / dz, 0, NZ - 1.001), i = Math.floor(fx), k = Math.floor(fz), u = fx - i, w = fz - k, n = k * NX + i;
    return (H[n] * (1 - u) + H[n + 1] * u) * (1 - w) + (H[n + NX] * (1 - u) + H[n + NX + 1] * u) * w;
  };
  let gx = 0, gz = 0, gRaw = 0; const GE = 0.35, TCAP = 0.25;
  const gradAt = (x, z) => { gx = (hAt(x + GE, z) - hAt(x - GE, z)) / (2 * GE); gz = (hAt(x, z + GE) - hAt(x, z - GE)) / (2 * GE); const g = Math.hypot(gx, gz); gRaw = g; if (g > TCAP) { gx *= TCAP / g; gz *= TCAP / g; } };   // the slope of the heap here (into gx, gz), capped so papers lie nearly flat on each other (at most ~14°) instead of propping up; gRaw: the uncapped steepness

  // ---- the papers: two instanced meshes (printed sheets and envelopes) share one set of slots
  const sheets = new THREE.InstancedMesh(new THREE.BoxGeometry(SW, SH, 0.0022), new THREE.MeshStandardMaterial({ map: sheetTexture(), roughness: 0.95 }), CAP_S);
  const envs = new THREE.InstancedMesh(new THREE.BoxGeometry(PW, PH, 0.0035), new THREE.MeshStandardMaterial({ map: envelopeTexture(0), roughness: 0.92 }), CAP_E);
  for (const m of [sheets, envs]) { m.frustumCulled = false; m.castShadow = true; m.receiveShadow = true; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); group.add(m); }
  // P: drawn position (x and z are the paper's real spot; y eases towards Y); Y: the height it rests at; Q: drawn orientation, QT: the orientation it eases towards; WAKE: still easing
  const P = new Float32Array(CAP * 3), Y = new Float32Array(CAP), Q = new Float32Array(CAP * 4), QT = new Float32Array(CAP * 4), WAKE = new Uint8Array(CAP), S = new Uint8Array(CAP);
  const VX = new Float32Array(CAP), VZ = new Float32Array(CAP), SPIN = new Float32Array(CAP), YAW = new Float32Array(CAP), TLX = new Float32Array(CAP), TLZ = new Float32Array(CAP), OX = new Float32Array(CAP), OZ = new Float32Array(CAP);   // OX, OZ: where a sliding paper was before this frame's move
  const mails = new Array(CAP).fill(null), dummy = new THREE.Object3D(), qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), nrm = new THREE.Vector3(), Z = new THREE.Vector3(0, 0, 1), col = new THREE.Color();
  const meshOf = i => i < CAP_S ? sheets : envs, local = i => i < CAP_S ? i : i - CAP_S;
  const tint = i => { col.set(PASTELS[i % PASTELS.length]).multiplyScalar(0.62 + 0.38 * clamp(Y[i] / 1.0, 0, 1)); meshOf(i).setColorAt(local(i), col); };   // lower down is darker
  for (let i = 0; i < CAP; i++) { dummy.position.set(0, -50, 0); dummy.updateMatrix(); meshOf(i).setMatrixAt(local(i), dummy.matrix); meshOf(i).setColorAt(local(i), col.set("#ffffff")); }
  const put = i => {
    dummy.position.set(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]);
    dummy.quaternion.set(Q[i * 4], Q[i * 4 + 1], Q[i * 4 + 2], Q[i * 4 + 3]);
    dummy.updateMatrix(); meshOf(i).setMatrixAt(local(i), dummy.matrix);
  };
  const touched = () => { sheets.instanceMatrix.needsUpdate = true; envs.instanceMatrix.needsUpdate = true; };
  const colored = () => { sheets.instanceColor.needsUpdate = true; envs.instanceColor.needsUpdate = true; };

  // ---- finding neighbours: papers are kept in buckets on a coarse grid
  const BC = 0.3, BX = Math.ceil((A.x1 - A.x0) / BC) + 1, BZ = Math.ceil((A.z1 - A.z0) / BC) + 1, head = new Int32Array(BX * BZ).fill(-1), nxt = new Int32Array(CAP);
  const link = i => { const b = clamp(Math.floor((P[i * 3 + 2] - A.z0) / BC), 0, BZ - 1) * BX + clamp(Math.floor((P[i * 3] - A.x0) / BC), 0, BX - 1); nxt[i] = head[b]; head[b] = i; };
  const CO = new Float32Array(CAP), SN = new Float32Array(CAP);   // each paper's turn on the floor (cos, sin of YAW), refreshed with the buckets
  const relink = () => { head.fill(-1); for (let i = 0; i < CAP; i++) if (S[i]) link(i); };
  function each(x, z, r, fn) {   // call fn(j, x - xj, z - zj) for every paper whose centre is within r of (x, z)
    const bx0 = clamp(Math.floor((x - r - A.x0) / BC), 0, BX - 1), bx1 = clamp(Math.floor((x + r - A.x0) / BC), 0, BX - 1), bz0 = clamp(Math.floor((z - r - A.z0) / BC), 0, BZ - 1), bz1 = clamp(Math.floor((z + r - A.z0) / BC), 0, BZ - 1), r2 = r * r;
    for (let bz = bz0; bz <= bz1; bz++) for (let bx = bx0; bx <= bx1; bx++) for (let j = head[bz * BX + bx]; j >= 0; j = nxt[j]) { const ox = x - P[j * 3], oz = z - P[j * 3 + 2]; if (ox * ox + oz * oz < r2) fn(j, ox, oz); }
  }
  // the height paper i must rest at: a thickness above every overlapping paper (only those under it, if below), measured along the slope.
  // A sliding paper rides only on resting papers and on sliding ones already placed this frame, so two sliding papers never climb over each other in turn.
  let sY = 0, sI = -1, sYi = 0, sBelow = false;
  const TH = i => i < CAP_S ? 0.0022 : 0.0035, gap = (i, j) => (TH(i) + TH(j)) / 2 + 0.0008;   // the space between two stacked papers' centres: half of each one's thickness, and a hair
  const HW = i => (i < CAP_S ? SW : PW) / 2, HH = i => (i < CAP_S ? SH : PH) / 2;
  function overlaps(i, j, ox, oz) {   // whether papers i and j (ox, oz: from j to i) cover any of the same floor, as turned rectangles (separating-axis test)
    const wi = HW(i), hi = HH(i), wj = HW(j), hj = HH(j), dd = ox * ox + oz * oz, m = Math.min(wi, hi) + Math.min(wj, hj);
    if (dd < m * m * 0.9) return true;   // close enough that they overlap whichever way they are turned
    const ci = CO[i], si = SN[i], cj = CO[j], sj = SN[j];
    const ax = [ci, -si, -si, -ci, cj, -sj, -sj, -cj];   // each paper's two edge directions on the floor
    for (let k = 0; k < 8; k += 2) {
      const a = ax[k], b = ax[k + 1], d = Math.abs(ox * a + oz * b);
      const ri = wi * Math.abs(ci * a - si * b) + hi * Math.abs(-si * a - ci * b), rj = wj * Math.abs(cj * a - sj * b) + hj * Math.abs(-sj * a - cj * b);
      if (d > (ri + rj) * 0.96) return false;
    }
    return true;
  }
  const supFn = (j, ox, oz) => { if (j === sI || (!sBelow && WAKE[j] === 2 && j > sI)) return; const pj = Y[j] + gx * ox + gz * oz; if (sBelow && pj >= sYi - 1e-4) return; const t = pj + gap(sI, j); if (t > sY && overlaps(sI, j, ox, oz)) sY = t; };   // the cheap height test first, the shape test only when it would matter
  function support(i, below) { const x = P[i * 3], z = P[i * 3 + 2]; gradAt(x, z); sI = i; sYi = Y[i]; sBelow = below; sY = 0.0025; each(x, z, OV, supFn); return sY; }
  // whether nothing lies on top of paper i
  let tI = -1, tY = 0, tTop = true;
  const topFn = (j, ox, oz) => { if (tTop && j !== tI && Y[j] + gx * ox + gz * oz > tY + 1e-4 && overlaps(tI, j, ox, oz)) tTop = false; };
  function isTop(i) { const x = P[i * 3], z = P[i * 3 + 2]; gradAt(x, z); tI = i; tY = Y[i]; tTop = true; each(x, z, OV, topFn); return tTop; }
  // H follows the tops of the papers: rebuilt over a patch of the floor
  let hm = 0; const hFn = j => { if (Y[j] > hm) hm = Y[j]; };
  function rebuildH(x0, x1, z0, z1) {
    const i0 = clamp(Math.floor((x0 - A.x0) / dx), 0, NX - 1), i1 = clamp(Math.ceil((x1 - A.x0) / dx), 0, NX - 1), k0 = clamp(Math.floor((z0 - A.z0) / dz), 0, NZ - 1), k1 = clamp(Math.ceil((z1 - A.z0) / dz), 0, NZ - 1);
    for (let k = k0; k <= k1; k++) for (let i = i0; i <= i1; i++) { hm = 0; each(A.x0 + i * dx, A.z0 + k * dz, HR, hFn); H[k * NX + i] = hm > 0 ? hm + 0.004 : 0; }
  }
  function aim(i) {   // QT: a flat sheet's own normal is +z: turn it to the slope here, spin it about that normal, then tilt it a hair
    gradAt(P[i * 3], P[i * 3 + 2]); nrm.set(-gx, 1, -gz).normalize();
    qa.setFromUnitVectors(Z, nrm); qb.setFromAxisAngle(Z, YAW[i]); qa.multiply(qb);
    dummy.rotation.set(TLX[i], TLZ[i], 0); qa.multiply(qb.setFromEuler(dummy.rotation)); qa.toArray(QT, i * 4);
  }
  const snap = i => { P[i * 3 + 1] = floorY + Y[i]; aim(i); Q.set(QT.subarray(i * 4, i * 4 + 4), i * 4); tint(i); put(i); };
  function spawn(slot, x, z, mail) {
    S[slot] = 1; YAW[slot] = rand(0, TAU); CO[slot] = Math.cos(YAW[slot]); SN[slot] = Math.sin(YAW[slot]); TLX[slot] = rand(-TILT, TILT); TLZ[slot] = rand(-TILT, TILT);
    VX[slot] = VZ[slot] = SPIN[slot] = 0; WAKE[slot] = 0; P[slot * 3] = x; P[slot * 3 + 2] = z; mails[slot] = mail || null;
  }

  // ---- build the heap: spots picked in proportion to the starting shape, then dropped one by one, deepest first, each onto the ones already there
  for (let k = 0; k < NZ; k++) for (let i = 0; i < NX; i++) H[k * NX + i] = 0.3 * shape(A.x0 + i * dx, A.z0 + k * dz);   // a low version of the starting shape guides the slope while stacking: a small heap on the floor, not a mountain
  const order = [], depth = new Float32Array(CAP);
  for (let n = 0; n < CAP; n++) {
    let x = 0, z = 0;
    for (let t = 0; t < 60; t++) { x = rand(P0.x0, P0.x1); z = rand(P0.z0, P0.z1); if (Math.random() < shape(x, z) + 0.12) break; }
    spawn(n, x, z, null); depth[n] = shape(x, z) * Math.random(); order.push(n);
  }
  order.sort((a, b) => depth[a] - depth[b]);
  for (const n of order) { Y[n] = support(n, false); link(n); }   // straight onto the papers already there (or the floor), so nothing in the heap rests on empty space
  rebuildH(P0.x0 - 1, P0.x1 + 1, P0.z0 - 1, P0.z1 + 1);
  for (let n = 0; n < CAP; n++) snap(n);
  touched(); colored();

  // where the heap changed (papers left, arrived or sank): papers there must be checked next frame
  let box = { x0: 1e9, x1: -1e9, z0: 1e9, z1: -1e9 }, next = { ...box };
  const grow = (b, x, z) => { if (x < b.x0) b.x0 = x; if (x > b.x1) b.x1 = x; if (z < b.z0) b.z0 = z; if (z > b.z1) b.z1 = z; };

  // ---- fluttering envelopes that fall onto the heap
  const surfaceSpot = (bias = 0.5) => {   // a random spot on the heap, more likely where it is tall
    for (let n = 0; n < 40; n++) { const x = rand(P0.x0, P0.x1), z = rand(P0.z0, P0.z1); if (Math.random() < Math.pow(clamp(hAt(x, z) / bias, 0, 1), 0.8) * 0.95 + 0.025) return [x, z]; }
    return [rand(P0.x0, P0.x1), rand(P0.z0, P0.z1)];
  };
  function launch(h) {
    const { g, hinge } = makeEnvelope(); group.add(g); const [tx, tz] = surfaceSpot(0.9);
    const e = { g, hinge, mail: makeEmail(), t: rand(0, 20), x: rand(P0.x0, P0.x1), y: floorY + h, z: rand(P0.z0, P0.z1), tx, tz, ph: [rand(0, TAU), rand(0, TAU), rand(0, TAU)], held: false };
    flying.push(e); return e;
  }
  function land(e) {
    flying.splice(flying.indexOf(e), 1); group.remove(e.g);
    let slot = -1;   // reuse an envelope that is buried, so nothing visible vanishes; failing that, the oldest
    for (let t = 0; t < CAP_E && slot < 0; t++) { const j = CAP_S + (nextE + t) % CAP_E; if (!isTop(j)) { slot = j; nextE = (j - CAP_S + 1) % CAP_E; } }
    if (slot < 0) { slot = CAP_S + nextE; nextE = (nextE + 1) % CAP_E; }
    grow(next, P[slot * 3], P[slot * 3 + 2]);   // whatever lay on the recycled envelope may sink
    spawn(slot, e.x, e.z, e.mail); Y[slot] = support(slot, false); snap(slot); grow(next, e.x, e.z);
    colored(); touched(); onLand();
  }
  for (let i = 0; i < FLYING - 2; i++) launch(rand(1.5, 3.8));

  // ---- the pointer
  const M = new THREE.Matrix4(), v = new THREE.Vector3();
  const toNdc = (x, y, z) => v.set(x, y, z).applyMatrix4(M);
  const setM = cam => { cam.updateMatrixWorld(); group.updateWorldMatrix(true, false); M.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse).multiply(group.matrixWorld); };
  const bboxNdc = cam => {   // the heap's outline on the screen
    setM(cam); let x0 = 9, x1 = -9, y0 = 9, y1 = -9;
    for (const x of [A.x0, A.x1]) for (const y of [0, 1.5]) for (const z of [A.z0, A.z1]) { const p = toNdc(x, floorY + y, z); x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
    return [x0, x1, y0, y1];
  };
  const ptr = { cam: null, nx: 0, ny: 0, speed: 0, at: 0 }, rc = new THREE.Raycaster(), ndcP = new THREE.Vector2(), hit = new THREE.Vector3(), goal = new THREE.Vector3(), prev = new THREE.Vector3(), pv = new THREE.Vector3(), ro = new THREE.Vector3(), rd = new THREE.Vector3(), inv = new THREE.Matrix4();
  const above = t => ro.y + rd.y * t - floorY - hAt(ro.x + rd.x * t, ro.z + rd.z * t);
  function march(out) {   // where the pointer's ray first meets the heap's surface (or the floor): step along it, then narrow down
    if (above(0) <= 0) return false;
    for (let t = 0.04, t0 = 0; t < 30; t0 = t, t += 0.04) {
      if (above(t) <= 0) { let a = t0, b = t; for (let n = 0; n < 12; n++) { const m = (a + b) / 2; if (above(m) > 0) a = m; else b = m; } out.copy(rd).multiplyScalar(b).add(ro); return out.x > A.x0 && out.x < A.x1 && out.z > A.z0 && out.z < A.z1; }
    }
    return false;
  }
  const scr = new THREE.Vector3(), clickAt = new THREE.Vector3();
  const onScreen = (x, y, z) => { if (!ptr.cam) return true; scr.set(x, y, z).applyMatrix4(M); return scr.x > -0.97 && scr.x < 0.97 && scr.y > -0.95 && scr.y < 0.97 && scr.z < 1; };   // inside the screen's edges (M: set from the camera each frame)

  // Digging: the papers on top near the pointer are shoved outwards (and a little along the way the pointer moves) and slide to a stop on top of whatever they reach.
  // The ones underneath come into view; papers left on a slope steeper than paper can rest on slide down it. The dig point glides after the pointer.
  let lastRustle = 0, havePrev = false, actS = 0, act = 0, sdt = 0;
  const shoveFn = (j, ox, oz) => {   // ox, oz: from paper j to the dig point
    if (!isTop(j)) return;   // only papers with nothing on them move: a buried one waits until it is uncovered, so nothing rises up through the heap
    const d = Math.hypot(ox, oz), u = 1 - d / R, inf = u * u * (3 - 2 * u) * sdt * 6;
    VX[j] += (-(ox / (d || 1)) * 3.6 * act + pv.x * 1.6) * inf; VZ[j] += (-(oz / (d || 1)) * 3.6 * act + pv.z * 1.6) * inf; SPIN[j] = clamp(SPIN[j] + (j % 2 ? 1 : -1) * inf * act * 0.3, -1.5, 1.5);
  };
  const near = (b, x, z, m) => x > b.x0 - m && x < b.x1 + m && z > b.z0 - m && z < b.z1 + m;
  function stir(dt) {
    dt = Math.min(dt, 1 / 30);
    if (ptr.cam) setM(ptr.cam);
    const live = ptr.cam && performance.now() - ptr.at < 160; let touching = false;
    if (live) {
      ptr.cam.updateMatrixWorld(); ndcP.set(ptr.nx, ptr.ny); rc.setFromCamera(ndcP, ptr.cam); group.updateWorldMatrix(true, true);   // the camera's matrix is refreshed first: it is only brought up to date by the render at the end of the frame, which is after this runs
      inv.copy(group.matrixWorld).invert(); ro.copy(rc.ray.origin).applyMatrix4(inv); rd.copy(rc.ray.direction).transformDirection(inv);
      touching = march(goal);
    }
    if (touching) { if (havePrev) hit.lerp(goal, 1 - Math.exp(-22 * dt)); else hit.copy(goal); }
    if (touching && havePrev) { const k = 1 - Math.exp(-12 * dt); pv.x += ((hit.x - prev.x) / dt - pv.x) * k; pv.z += ((hit.z - prev.z) / dt - pv.z) * k; }
    else pv.multiplyScalar(Math.exp(-8 * dt));
    prev.copy(hit); havePrev = touching;
    const speed = Math.hypot(pv.x, pv.z);
    actS += ((touching ? clamp(0.4 + speed * 2.2, 0.4, 1.5) : 0) - actS) * (1 - Math.exp(-10 * dt));   // eased, so digging fades in and out instead of switching
    act = touching && actS > 0.02 ? actS : 0; sdt = dt;

    box = next; next = { x0: 1e9, x1: -1e9, z0: 1e9, z1: -1e9 };
    relink();
    if (act) each(hit.x, hit.z, R, shoveFn);   // 1. the shove
    // 2. sliding papers move (the screen's edges are walls: a paper that reaches one bounces off it softly)
    let any = false, recolor = false; const f = Math.exp((act ? -3.6 : -12) * dt);   // once the pointer leaves, everything comes to rest quickly
    for (let i = 0; i < CAP; i++) {
      if (!S[i] || (Math.abs(VX[i]) + Math.abs(VZ[i]) + Math.abs(SPIN[i])) <= 0.004) continue; const o = i * 3;
      grow(box, P[o], P[o + 2]);
      gradAt(P[o], P[o + 2]); const sl = Math.hypot(gx, gz);
      if (act && sl > 0.3) { const a = (sl - 0.25) * 5 * dt / sl; VX[i] -= gx * a; VZ[i] -= gz * a; }   // a moving paper keeps sliding down the side of the heap until the ground flattens out
      const sv = Math.hypot(VX[i], VZ[i]); if (sv > 2.5) { VX[i] *= 2.5 / sv; VZ[i] *= 2.5 / sv; }
      OX[i] = P[o]; OZ[i] = P[o + 2];
      const nx = clamp(P[o] + VX[i] * dt, A.x0 + 0.08, A.x1 - 0.08), nz = clamp(P[o + 2] + VZ[i] * dt, A.z0 + 0.08, A.z1 - 0.08);
      if (onScreen(nx, P[o + 1], P[o + 2])) P[o] = nx; else VX[i] *= -0.3;
      if (onScreen(P[o], P[o + 1], nz)) P[o + 2] = nz; else VZ[i] *= -0.3;
      VX[i] *= f; VZ[i] *= f; SPIN[i] *= f; YAW[i] += SPIN[i] * dt; CO[i] = Math.cos(YAW[i]); SN[i] = Math.sin(YAW[i]);   // friction against the other papers
      grow(box, P[o], P[o + 2]); WAKE[i] = 2;   // 2: sliding this frame
    }
    if (box.x0 > box.x1) { // nothing changed: just let papers finish easing
    } else rebuildH(box.x0 - HR - 0.1, box.x1 + HR + 0.1, box.z0 - HR - 0.1, box.z1 + HR + 0.1);
    // 3. papers where the heap changed: sliding ones ride on top of whatever is under them; resting ones sink if what held them up has gone, or start sliding if it is too steep
    const ease = 1 - Math.exp(-14 * dt), turn = 1 - Math.exp(-6 * dt);   // turn: tilts ease slower than heights, so papers settle instead of twitching
    for (let i = 0; i < CAP; i++) {
      if (!S[i]) continue; const o = i * 3;
      const sliding = WAKE[i] === 2, check = sliding || near(box, P[o], P[o + 2], OV);
      if (!check && !WAKE[i]) continue;
      if (check) {
        const was = Y[i];
        if (sliding) {
          Y[i] = support(i, false);
          if (Y[i] > was + 0.02) { P[o] = OX[i]; P[o + 2] = OZ[i]; VX[i] *= -0.15; VZ[i] *= -0.15; Y[i] = support(i, false); }   // a sliding paper does not climb over a stack in its way: it stops against it
        }
        else {
          const y = Math.min(Y[i], support(i, true)); if (y < Y[i] - 0.002) grow(next, P[o], P[o + 2]); Y[i] = y;
          if (act && gRaw >= REPOSE && isTop(i)) { const a = (gRaw - REPOSE) * 9 * dt / Math.hypot(gx, gz); VX[i] -= gx * a; VZ[i] -= gz * a; grow(next, P[o], P[o + 2]); }   // too steep: slide downhill
        }
        aim(i);
        if (Math.abs(Y[i] - was) > 0.04) { tint(i); recolor = true; }
      }
      const ty = floorY + Y[i], dy = ty - P[o + 1]; P[o + 1] += dy * ease;
      qa.fromArray(Q, i * 4); qb.fromArray(QT, i * 4); const dot = Math.abs(qa.dot(qb));
      if (dot < 0.99999) { qa.slerp(qb, turn); qa.toArray(Q, i * 4); }
      WAKE[i] = Math.abs(dy) > 2e-4 || dot < 0.99999 || sliding ? 1 : 0;
      put(i); any = true;
    }
    if (any) touched(); if (recolor) colored();
    if (touching && speed > 0.25 && performance.now() - lastRustle > 60) { lastRustle = performance.now(); emailRustle.play(clamp(speed / 2.5, 0.2, 1), clamp(ptr.nx * 0.6, -0.8, 0.8)); }
  }
  const tmp = new THREE.Vector3(), q = new THREE.Vector3();
  const closest = (ray, point, radius2) => {   // distance from the camera to where the ray passes the point, or -1 if it misses by more than the radius
    if (ray.ray.distanceSqToPoint(point) > radius2) return -1;
    ray.ray.closestPointToPoint(point, q); return q.distanceTo(ray.ray.origin);
  };
  return {
    update(dt) {
      spawnT -= dt;
      if (spawnT <= 0 && flying.length < FLYING) { launch(rand(3.6, 4.6)); spawnT = SPAWN_EVERY * rand(0.7, 1.4); }
      for (const e of flying.slice()) {
        if (e.held) continue;
        e.t += dt;
        const hy = e.y - floorY, low = 1 - Math.min(1, hy / 3.0);                           // 0 high up, 1 close to the floor
        const gap = e.y - floorY - hAt(e.x, e.z), near = 1 - Math.min(1, Math.max(0, gap) / 0.9);   // near: 0 well above the heap, 1 touching it
        e.y -= dt * (0.2 + 0.1 * Math.abs(Math.sin(e.t * 1.3 + e.ph[0])) + 1.6 * near * near);   // drifts down like a moth, then settles quickly onto the heap instead of hovering over it
        e.x += (Math.sin(e.t * 1.7 + e.ph[0]) * 0.32 + Math.sin(e.t * 3.1 + e.ph[1]) * 0.18) * dt * (1 - 0.7 * low) + (e.tx - e.x) * dt * (0.15 + 0.8 * low);
        e.z += (Math.sin(e.t * 1.3 + e.ph[1]) * 0.26 + Math.sin(e.t * 2.7 + e.ph[2]) * 0.14) * dt * (1 - 0.7 * low) + (e.tz - e.z) * dt * (0.15 + 0.8 * low);
        e.x = clamp(e.x, A.x0 + 0.1, A.x1 - 0.1); e.z = clamp(e.z, A.z0 + 0.1, A.z1 - 0.1);
        e.g.position.set(e.x, e.y, e.z);
        const calm = 1 - near; e.g.rotation.set(Math.sin(e.t * 5.2 + e.ph[0]) * 0.6 * calm, e.t * 0.5 + e.ph[1] + Math.sin(e.t * 1.9) * 0.5, Math.sin(e.t * 7 + e.ph[2]) * 0.7 * calm);   // tumbling, flattening out as it comes down
        e.hinge.rotation.x = -(0.15 + 0.95 * Math.abs(Math.sin(e.t * 10 + e.ph[1]))) * calm;                                                       // the flap beats like a wing, and folds shut to land
        if (e.y <= floorY + hAt(e.x, e.z) + 0.02) land(e);
      }
      stir(dt);
    },
    /** True if the screen point (ndc) is over the heap. */
    overPit(cam, nx, ny) { const [x0, x1, y0, y1] = bboxNdc(cam); return nx >= x0 && nx <= x1 && ny >= y0 && ny <= y1; },
    /** Dig through the papers at the pointer. speed is how far the pointer moved (ndc units). */
    ruffle(cam, nx, ny, speed) { ptr.cam = cam; ptr.nx = nx; ptr.ny = ny; ptr.speed = speed; ptr.at = performance.now(); },
    /** The paper under the ray, fluttering or on top of the heap (the one nearest the camera), as { mail, ... }, or null. */
    pick(ray) {
      let best = null, bd = 1e9; const hits = [];
      for (const e of flying) { tmp.copy(e.g.position); group.localToWorld(tmp); const d = closest(ray, tmp, 0.2 * 0.2); if (d >= 0 && d < bd) { bd = d; best = { mail: e.mail, e }; } }
      for (let i = 0; i < CAP; i++) {
        if (!S[i]) continue; tmp.set(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]); group.localToWorld(tmp);
        const r = i < CAP_S ? 0.15 : 0.12, d = closest(ray, tmp, r * r); if (d >= 0 && d < bd) hits.push([d, i]);
      }
      hits.sort((a, b) => a[0] - b[0]);
      for (const [d, i] of hits) if (isTop(i)) { best = { slot: i }; break; }   // the nearest one with nothing on it
      if (!best && hits.length) best = { slot: hits[0][1] };
      if (!best) {   // a click anywhere on the heap opens one: find where the ray meets the heap, then the topmost paper there
        group.updateWorldMatrix(true, false); inv.copy(group.matrixWorld).invert(); ro.copy(ray.ray.origin).applyMatrix4(inv); rd.copy(ray.ray.direction).transformDirection(inv);
        if (march(clickAt)) { let top = -1, ty = -1; each(clickAt.x, clickAt.z, 0.3, j => { if (Y[j] > ty) { ty = Y[j]; top = j; } }); if (top >= 0) best = { slot: top }; }
      }
      if (best && best.slot !== undefined) best.mail = mails[best.slot] || (mails[best.slot] = makeEmail());   // each paper keeps its email once it has been read
      return best;
    },
    hold(c) { if (c.e) { c.e.held = true; c.e.hinge.rotation.x = -0.9; } },
    release(c) { if (c.e) c.e.held = false; }
  };
}
