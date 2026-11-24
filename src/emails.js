import * as THREE from "three";
import { makeEmail } from "./emailData.js";
import { createRustle } from "./emailSound.js";

export const emailRustle = createRustle();   // shared, so a click anywhere can unlock the sound

export const EMAIL_SCENE = 2;   // index into windows/scenes.js: the room after the pigeons

const TAU = Math.PI * 2, PW = 0.34, PH = 0.22;               // envelope size
const SW = 0.32, SH = 0.23;                                      // a printed sheet
const FLYING = 14, SPAWN_EVERY = 0.7, CAP_S = 900, CAP_E = 170, CAP = CAP_S + CAP_E, HMAX = 1.25;   // sheets and envelopes on the heap's surface; HMAX is how tall the heap can get
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
function bulkTexture() {   // what shows where the top layer of papers has been shoved aside: more papers, drawn sharp with a soft shadow under each (no thin lines, which look like wireframe at a low angle)
  const c = document.createElement("canvas"); c.width = c.height = 1024; const g = c.getContext("2d");
  g.fillStyle = "#b9b19c"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 520; i++) {
    g.save(); g.translate(Math.random() * 1024, Math.random() * 1024); g.rotate(Math.random() * TAU);
    g.fillStyle = "rgba(40,34,24,0.28)"; g.fillRect(-48, -30, 100, 72);                                   // the shadow it casts on the sheet below
    g.fillStyle = PASTELS[i % PASTELS.length]; g.fillRect(-50, -34, 100, 72);
    g.fillStyle = "rgba(40,40,50,0.22)"; for (let r = 0; r < 5; r++) g.fillRect(-40, -22 + r * 12, 80 - (r % 3) * 16, 3);   // printed lines
    g.restore();
  }
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
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

// "UNREAD" counter on the back wall
function counterSign(start) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 160; const g = c.getContext("2d");
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  const draw = n => {
    g.clearRect(0, 0, 512, 160); g.fillStyle = "#fffdf8"; g.beginPath(); g.roundRect ? g.roundRect(6, 6, 500, 148, 22) : g.rect(6, 6, 500, 148); g.fill();
    g.lineWidth = 4; g.strokeStyle = "rgba(40,30,20,0.3)"; g.stroke();
    g.fillStyle = "#5f6368"; g.font = "600 30px system-ui, sans-serif"; g.fillText("UNREAD", 34, 58);
    g.fillStyle = "#d93025"; g.font = "700 74px system-ui, sans-serif"; g.fillText(n.toLocaleString("en-US"), 32, 132);
    g.fillStyle = "#e53935"; g.beginPath(); g.arc(452, 52, 14, 0, TAU); g.fill();
    t.needsUpdate = true;
  };
  draw(start);
  return { texture: t, draw };
}

/** The room: a heap of printed emails and envelopes piled against the back wall. More flutter down onto it like moths; hovering over it ruffles through it. */
export function createEmails(parent, RM) {
  const group = new THREE.Group(); parent.add(group);
  const floorY = RM.Y0, flying = [], A = { x0: RM.X0 + 0.45, x1: RM.X1 - 0.45, z0: RM.Z0 + 0.03, z1: -1.6 };   // A: the part of the floor the heap sits on
  const NX = 29, NZ = 23, dx = (A.x1 - A.x0) / (NX - 1), dz = (A.z1 - A.z0) / (NZ - 1), H = new Float32Array(NX * NZ);   // H: height of the heap's top surface at each grid point
  let count = 1284, spawnT = 0, nextE = 0, dirty = true; const sign = counterSign(count);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.31), new THREE.MeshBasicMaterial({ map: sign.texture, transparent: true }));
  plate.position.set(1.0, floorY + 2.4, RM.Z0 + 0.02); group.add(plate);

  // ---- the heap's body: a surface that rises from the floor, so there is never a gap between the papers and the ground
  for (let k = 0; k < NZ; k++) for (let i = 0; i < NX; i++) {
    const x = A.x0 + i * dx, z = A.z0 + k * dz;
    const g = (cx, cz, sx, sz, h) => h * Math.exp(-(((x - cx) / sx) ** 2 + ((z - cz) / sz) ** 2));
    H[k * NX + i] = Math.max(0, g(0.0, -3.75, 1.2, 0.95, 0.95) + g(-1.05, -3.3, 0.65, 0.6, 0.4) + g(1.1, -3.05, 0.65, 0.65, 0.36) + g(0.1, -2.4, 1.1, 0.5, 0.08) + 0.05 * Math.sin(x * 3.1 + z * 2.3) * Math.sin(z * 4.1) + 0.006);
  }
  const bpos = new Float32Array(NX * NZ * 3), buv = new Float32Array(NX * NZ * 2), bidx = [];
  for (let k = 0; k < NZ; k++) for (let i = 0; i < NX; i++) { const n = k * NX + i; bpos[n * 3] = A.x0 + i * dx; bpos[n * 3 + 2] = A.z0 + k * dz; buv[n * 2] = (A.x0 + i * dx) * 0.36; buv[n * 2 + 1] = (A.z0 + k * dz) * 0.36; }
  for (let k = 0; k < NZ - 1; k++) for (let i = 0; i < NX - 1; i++) { const a = k * NX + i, b = a + 1, c = a + NX, d = c + 1; bidx.push(a, c, b, b, c, d); }
  const bgeo = new THREE.BufferGeometry(); bgeo.setAttribute("position", new THREE.BufferAttribute(bpos, 3)); bgeo.setAttribute("uv", new THREE.BufferAttribute(buv, 2)); bgeo.setIndex(bidx);
  const bulk = new THREE.Mesh(bgeo, new THREE.MeshStandardMaterial({ map: bulkTexture(), color: 0xf0ebdd, roughness: 1, side: THREE.DoubleSide })); bulk.frustumCulled = false; bulk.receiveShadow = true; group.add(bulk);
  const hAt = (x, z) => {   // the surface height at any point (bilinear between grid points)
    const fx = clamp((x - A.x0) / dx, 0, NX - 1.001), fz = clamp((z - A.z0) / dz, 0, NZ - 1.001), i = Math.floor(fx), k = Math.floor(fz), u = fx - i, w = fz - k, n = k * NX + i;
    return (H[n] * (1 - u) + H[n + 1] * u) * (1 - w) + (H[n + NX] * (1 - u) + H[n + NX + 1] * u) * w;
  };
  const bump = (x, z, amt) => {   // raise (or dig out) a soft round patch of the heap
    for (let k = 0; k < NZ; k++) for (let i = 0; i < NX; i++) {
      const d2 = ((A.x0 + i * dx - x) ** 2 + (A.z0 + k * dz - z) ** 2) / 0.05; if (d2 > 6) continue;
      const n = k * NX + i; H[n] = clamp(H[n] + amt * Math.exp(-d2), 0.004, HMAX);
    }
    dirty = true;
  };
    const syncBulk = () => { for (let n = 0; n < NX * NZ; n++) bpos[n * 3 + 1] = floorY + H[n]; bgeo.attributes.position.needsUpdate = true; bgeo.computeVertexNormals(); dirty = false; };

  // ---- the papers lying on the surface: two instanced meshes (printed sheets and envelopes) share one set of slots
  const sheets = new THREE.InstancedMesh(new THREE.BoxGeometry(SW, SH, 0.005), new THREE.MeshStandardMaterial({ map: sheetTexture(), roughness: 0.95 }), CAP_S);
  const envs = new THREE.InstancedMesh(new THREE.BoxGeometry(PW, PH, 0.008), new THREE.MeshStandardMaterial({ map: envelopeTexture(0), roughness: 0.92 }), CAP_E);
  for (const m of [sheets, envs]) { m.frustumCulled = false; m.castShadow = true; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); group.add(m); }
  const P = new Float32Array(CAP * 3), Q = new Float32Array(CAP * 4), S = new Uint8Array(CAP), LIFT = new Float32Array(CAP), VX = new Float32Array(CAP), VZ = new Float32Array(CAP), SPIN = new Float32Array(CAP);   // position, orientation, and whether the slot holds a paper
  const mails = new Array(CAP).fill(null), dummy = new THREE.Object3D(), qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), nrm = new THREE.Vector3(), Z = new THREE.Vector3(0, 0, 1), col = new THREE.Color(), shade = new THREE.Color();
  const meshOf = i => i < CAP_S ? sheets : envs, local = i => i < CAP_S ? i : i - CAP_S;
  const tint = (i, h) => { col.set(PASTELS[i % PASTELS.length]).multiplyScalar(0.72 + 0.28 * clamp(h / 1.1, 0, 1)); meshOf(i).setColorAt(local(i), col); meshOf(i).instanceColor.needsUpdate = true; };   // lower down is darker
  for (let i = 0; i < CAP; i++) { dummy.position.set(0, -50, 0); dummy.updateMatrix(); meshOf(i).setMatrixAt(local(i), dummy.matrix); meshOf(i).setColorAt(local(i), shade.set("#ffffff")); }
  const put = i => {
    dummy.position.set(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]);
    dummy.quaternion.set(Q[i * 4], Q[i * 4 + 1], Q[i * 4 + 2], Q[i * 4 + 3]);
    dummy.updateMatrix(); meshOf(i).setMatrixAt(local(i), dummy.matrix);
  };
  const touched = () => { sheets.instanceMatrix.needsUpdate = true; envs.instanceMatrix.needsUpdate = true; };
  const YAW = new Float32Array(CAP), TLX = new Float32Array(CAP), TLZ = new Float32Array(CAP);   // each paper's own spin on the surface and small tilt
  function orient(i) {   // a flat sheet's own normal is +z: turn it to the surface normal here, spin it about that normal, then tilt it a little off the surface
    const x = P[i * 3], z = P[i * 3 + 2], e = 0.12;
    nrm.set(hAt(x - e, z) - hAt(x + e, z), 2 * e, hAt(x, z - e) - hAt(x, z + e)).normalize();
    qa.setFromUnitVectors(Z, nrm); qb.setFromAxisAngle(Z, YAW[i]); qa.multiply(qb);
    dummy.rotation.set(TLX[i], TLZ[i], 0); qa.multiply(qb.setFromEuler(dummy.rotation)); Q.set([qa.x, qa.y, qa.z, qa.w], i * 4);
  }
  function rest(slot, x, z, mail, raise = 0) {   // lay a paper on the heap's surface at (x, z)
    S[slot] = 1; if (raise) bump(x, z, raise);
    const h = hAt(x, z);
    YAW[slot] = rand(0, TAU); TLX[slot] = rand(-0.16, 0.16); TLZ[slot] = rand(-0.16, 0.16);
    LIFT[slot] = 0.005 + rand(0, 0.012); VX[slot] = VZ[slot] = SPIN[slot] = 0; P.set([x, floorY + h + LIFT[slot], z], slot * 3); orient(slot);
    mails[slot] = mail || null; tint(slot, h); put(slot);
  }
  const surfaceSpot = (bias = 0.5) => {   // a random spot on the heap, more likely where it is tall
    for (let n = 0; n < 40; n++) { const x = rand(A.x0 + 0.1, A.x1 - 0.1), z = rand(A.z0 + 0.1, A.z1 - 0.1); if (Math.random() < Math.pow(clamp(hAt(x, z) / bias, 0, 1), 0.8) * 0.95 + 0.025) return [x, z]; }
    return [rand(A.x0, A.x1), rand(A.z0, A.z1)];
  };
  const RESERVE = 220; let reserveNext = CAP_S - RESERVE;   // sheets held back: digging uncovers them, so a hole shows more papers and not the bare surface underneath
  for (let n = 0; n < CAP; n++) { if (n >= CAP_S - RESERVE && n < CAP_S) continue; const [x, z] = surfaceSpot(); rest(n, x, z); }   // the heap starts out piled high
  syncBulk(); touched();

  // ---- fluttering envelopes that fall onto the heap
  function launch(h) {
    const { g, hinge } = makeEnvelope(); group.add(g); const [tx, tz] = surfaceSpot(0.9);
    const e = { g, hinge, mail: makeEmail(), t: rand(0, 20), x: rand(A.x0, A.x1), y: floorY + h, z: rand(A.z0, A.z1), tx, tz, ph: [rand(0, TAU), rand(0, TAU), rand(0, TAU)], held: false };
    flying.push(e); return e;
  }
  function land(e) {
    flying.splice(flying.indexOf(e), 1); group.remove(e.g);
    const slot = CAP_S + nextE; nextE = (nextE + 1) % CAP_E;   // the oldest envelope is recycled
    rest(slot, e.x, e.z, e.mail, 0.05 * (1 - hAt(e.x, e.z) / HMAX)); touched();
    count++; sign.draw(count);
  }
  for (let i = 0; i < FLYING - 2; i++) launch(rand(1.5, 3.8));

  // ---- ruffling: papers near the pointer are thrown up and tumble back down onto the heap
  const M = new THREE.Matrix4(), v = new THREE.Vector3(), right = new THREE.Vector3(), upv = new THREE.Vector3(), inv = new THREE.Matrix4();
  const toNdc = (x, y, z) => v.set(x, y, z).applyMatrix4(M);
  const setM = cam => { cam.updateMatrixWorld(); group.updateWorldMatrix(true, false); M.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse).multiply(group.matrixWorld); };
  const bboxNdc = cam => {   // the heap's outline on the screen
    setM(cam); let x0 = 9, x1 = -9, y0 = 9, y1 = -9;
    for (const x of [A.x0, A.x1]) for (const y of [0, 1.5]) for (const z of [A.z0, A.z1]) { const p = toNdc(x, floorY + y, z); x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
    return [x0, x1, y0, y1];
  };

  // Digging. Where the pointer touches the heap, material is scooped out of the middle and piled up in a ring around the hole; the papers there are shoved outwards and slide to a stop.
  // Then the loose pile spreads: the heap's surface relaxes towards its neighbours around the disturbed spot, so the ridge slumps into the hole instead of the hole just fading away.
  const ptr = { cam: null, nx: 0, ny: 0, speed: 0, at: 0 }, rc = new THREE.Raycaster(), ndcP = new THREE.Vector2(), hit = new THREE.Vector3(), prev = new THREE.Vector3(), pv = new THREE.Vector3(), loose = new Float32Array(NX * NZ), Hn = new Float32Array(NX * NZ);
  let lastRustle = 0, havePrev = false, scanI = 0;
  function stir(dt) {
    dt = Math.min(dt, 1 / 30);
    const live = ptr.cam && performance.now() - ptr.at < 140; let touching = false;
    if (live) {
      ptr.cam.updateMatrixWorld(); ndcP.set(ptr.nx, ptr.ny); rc.setFromCamera(ndcP, ptr.cam); group.updateWorldMatrix(true, true);   // the camera's matrix is refreshed first: it is only brought up to date by the render at the end of the frame, which is after this runs
      const h = rc.intersectObject(bulk, false)[0];
      if (h) { hit.copy(group.worldToLocal(h.point.clone())); touching = true; }
    }
    if (touching && havePrev) { const k = 1 - Math.exp(-18 * dt); pv.x += ((hit.x - prev.x) / dt - pv.x) * k; pv.z += ((hit.z - prev.z) / dt - pv.z) * k; }
    else pv.multiplyScalar(Math.exp(-8 * dt));
    prev.copy(hit); havePrev = touching;
    const speed = Math.hypot(pv.x, pv.z), R = 0.8, act = touching ? clamp(0.4 + speed * 2.5, 0.4, 1.6) : 0;

    // 1. dig: scoop the middle, heap the scooped material in a ring
    let changed = false;
    if (act) {
      let scooped = 0, ringW = 0;
      for (let k = 0; k < NZ; k++) for (let i = 0; i < NX; i++) {
        const n = k * NX + i, d = Math.hypot(A.x0 + i * dx - hit.x, A.z0 + k * dz - hit.z), u = d / R;
        if (u < 0.55) { const take = Math.min(H[n] - 0.004, 0.95 * act * dt * (1 - u / 0.55)); if (take > 0) { H[n] -= take; scooped += take; loose[n] = 1; } }
        else if (u < 1.1) { Hn[n] = (1 - Math.abs(u - 0.8) / 0.3); ringW += Math.max(0, Hn[n]); } else Hn[n] = 0;
      }
      if (scooped > 0 && ringW > 0) for (let n = 0; n < NX * NZ; n++) if (Hn[n] > 0) { H[n] = Math.min(HMAX, H[n] + scooped * 0.9 * Hn[n] / ringW); loose[n] = 1; }
      changed = scooped > 0;
      for (let n = Math.min(3, Math.floor(act * dt * 150 + Math.random())); n > 0; n--) {   // papers from the heap's thin edge flow into the hole, so it fills with papers instead of showing bare surface
        let slot = reserveNext < CAP_S ? reserveNext++ : -1;
        for (let tries = 0; slot < 0 && tries < 60; tries++) {
          scanI = (scanI + 1) % (CAP_S - RESERVE); const j = scanI, o = j * 3;
          if (S[j] === 1 && hAt(P[o], P[o + 2]) < 0.14 && Math.hypot(P[o] - hit.x, P[o + 2] - hit.z) > R * 1.2) slot = j;
        }
        if (slot >= 0) { const a = rand(0, TAU), r = Math.sqrt(Math.random()) * R * 0.55; rest(slot, hit.x + Math.cos(a) * r, hit.z + Math.sin(a) * r, mails[slot]); }
      }
    }
    // 2. spread: the loose pile relaxes towards its neighbours, which lets the ridge slump into the hole
    for (let k = 0; k < NZ; k++) for (let i = 0; i < NX; i++) {
      const n = k * NX + i, w = loose[n]; if (w < 0.01) { loose[n] = 0; continue; }
      const avg = ((i > 0 ? H[n - 1] : H[n]) + (i < NX - 1 ? H[n + 1] : H[n]) + (k > 0 ? H[n - NX] : H[n]) + (k < NZ - 1 ? H[n + NX] : H[n])) / 4;
      Hn[n] = H[n] + (avg - H[n]) * Math.min(0.5, 7 * dt * w); loose[n] = w * Math.exp(-0.8 * dt);
    }
    for (let n = 0; n < NX * NZ; n++) if (loose[n] > 0 && Hn[n] !== H[n]) { H[n] = Hn[n]; changed = true; }
    if (changed) dirty = true;

    // 3. the papers: shoved outwards from the hole and along the way the pointer moves, sliding to a stop; and every paper rides the surface as it moves
    let moved = false;
    for (let i = 0; i < CAP; i++) {
      if (!S[i]) continue; const o = i * 3;
      if (touching) {
        const ddx = P[o] - hit.x, ddz = P[o + 2] - hit.z, d = Math.hypot(ddx, ddz);
        if (d < R) { const u = 1 - d / R, inf = u * u * (3 - 2 * u); VX[i] += ((ddx / (d || 1)) * 4.5 * act + pv.x * 2) * inf * dt * 6; VZ[i] += ((ddz / (d || 1)) * 4.5 * act + pv.z * 2) * inf * dt * 6; SPIN[i] += (i % 2 ? 1 : -1) * inf * act * 14 * dt; }
      }
      const sp = Math.abs(VX[i]) + Math.abs(VZ[i]) + Math.abs(SPIN[i]);
      if (sp > 0.004) {
        P[o] = clamp(P[o] + VX[i] * dt, A.x0 + 0.1, A.x1 - 0.1); P[o + 2] = clamp(P[o + 2] + VZ[i] * dt, A.z0 + 0.1, A.z1 - 0.1);
        const f = Math.exp(-5.5 * dt); VX[i] *= f; VZ[i] *= f; SPIN[i] *= f;   // friction against the other papers
        moved = true;
      } else if (sp) { VX[i] = VZ[i] = SPIN[i] = 0; }
      if (moved || changed) { const y = floorY + hAt(P[o], P[o + 2]) + LIFT[i]; if (Math.abs(y - P[o + 1]) > 1e-4) { P[o + 1] = y; moved = true; } if (sp > 0.004) YAW[i] += SPIN[i] * dt; if (sp > 0.004 || changed) { orient(i); put(i); } }
    }
    if (moved || changed) touched();
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
        const hy = e.y - floorY, near = 1 - Math.min(1, hy / 3.0);                           // 0 high up, 1 close to the floor
        e.y -= dt * (0.2 + 0.1 * Math.abs(Math.sin(e.t * 1.3 + e.ph[0])));                   // drifts down, with a dip and a lift like a moth
        e.x += (Math.sin(e.t * 1.7 + e.ph[0]) * 0.32 + Math.sin(e.t * 3.1 + e.ph[1]) * 0.18) * dt * (1 - 0.7 * near) + (e.tx - e.x) * dt * (0.15 + 0.8 * near);
        e.z += (Math.sin(e.t * 1.3 + e.ph[1]) * 0.26 + Math.sin(e.t * 2.7 + e.ph[2]) * 0.14) * dt * (1 - 0.7 * near) + (e.tz - e.z) * dt * (0.15 + 0.8 * near);
        e.x = clamp(e.x, A.x0 + 0.1, A.x1 - 0.1); e.z = clamp(e.z, A.z0 + 0.1, A.z1 - 0.1);
        e.g.position.set(e.x, e.y, e.z);
        e.g.rotation.set(Math.sin(e.t * 5.2 + e.ph[0]) * 0.6, e.t * 0.5 + e.ph[1] + Math.sin(e.t * 1.9) * 0.5, Math.sin(e.t * 7 + e.ph[2]) * 0.7);   // tumbling
        e.hinge.rotation.x = -(0.15 + 0.95 * Math.abs(Math.sin(e.t * 10 + e.ph[1])));                                                              // the flap beats like a wing
        if (e.y <= floorY + hAt(e.x, e.z) + 0.07) land(e);
      }
      stir(dt);
      if (dirty) syncBulk();
    },
    /** True if the screen point (ndc) is over the heap. */
    overPit(cam, nx, ny) { const [x0, x1, y0, y1] = bboxNdc(cam); return nx >= x0 && nx <= x1 && ny >= y0 && ny <= y1; },
    /** Ruffle through the papers at the pointer. speed is how far the pointer moved (ndc units). */
    ruffle(cam, nx, ny, speed) { ptr.cam = cam; ptr.nx = nx; ptr.ny = ny; ptr.speed = speed; ptr.at = performance.now(); },
    /** The paper under the ray, fluttering or lying on the heap (the one nearest the camera), as { mail, ... }, or null. */
    pick(ray) {
      let best = null, bd = 1e9;
      for (const e of flying) { tmp.copy(e.g.position); group.localToWorld(tmp); const d = closest(ray, tmp, 0.2 * 0.2); if (d >= 0 && d < bd) { bd = d; best = { mail: e.mail, e }; } }
      for (let i = 0; i < CAP; i++) {
        if (!S[i]) continue; tmp.set(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]); group.localToWorld(tmp);
        const r = i < CAP_S ? 0.15 : 0.12, d = closest(ray, tmp, r * r); if (d >= 0 && d < bd) { bd = d; best = { slot: i }; }
      }
      if (best && best.slot !== undefined) best.mail = mails[best.slot] || (mails[best.slot] = makeEmail());   // each paper keeps its email once it has been read
      return best;
    },
    hold(c) { if (c.e) { c.e.held = true; c.e.hinge.rotation.x = -0.9; } },
    release(c) { if (c.e) c.e.held = false; }
  };
}
