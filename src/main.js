import * as THREE from "three";
import "./style.css";
import { createEmails, emailRustle } from "./emails.js";
import { showMail, isMailOpen, hideMail } from "./mailView.js";
import { EMAIL_COUNT } from "./emailData.js";

document.getElementById("count").textContent = String(EMAIL_COUNT + 1123).replace(/\B(?=(\d{3})+$)/g, ",");   // the pit only holds a few hundred at a time; the rest are on their way

// ---------- renderer, scene, camera ----------
const canvas = document.getElementById("gl");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setClearColor(0xffffff, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(48, 1, 0.05, 100);
const BASE = new THREE.Vector3(0, 0.5, 1.5), AIM = new THREE.Vector3(0, -0.35, -2.7);

// ---------- a plain white screen: no walls, just an invisible floor that catches the pile's shadows ----------
const RM = { X0: -2.2, X1: 2.2, Y0: -1.2, Y1: 4.5, Z0: -4.5 };   // the space the pile sits in
const room = new THREE.Group(); scene.add(room);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.12 }));
floor.rotation.x = -Math.PI / 2; floor.position.y = RM.Y0; floor.receiveShadow = true; room.add(floor);
scene.fog = new THREE.Fog(0xffffff, 9, 22);
scene.add(new THREE.HemisphereLight(0xffffff, 0xe6e2d8, 0.55));
const sun = new THREE.DirectionalLight(0xffffff, 0.7); sun.position.set(-0.7, 8, 1.6); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 0.5, far: 22 }); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.04; sun.shadow.radius = 4;
sun.target.position.set(0.1, RM.Y0, -2.5); scene.add(sun, sun.target);
const key = new THREE.DirectionalLight(0xfff4e6, 0.5); key.position.set(2.5, 2.5, 3); scene.add(key);

const emails = createEmails(room, RM);

// ---------- pointer: hover digs, a click reads ----------
const ndc = new THREE.Vector2(), ray = new THREE.Raycaster(), look = { x: 0, y: 0 };
let last = null, down = null;
const toNdc = e => ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
addEventListener("pointermove", e => {
  toNdc(e); look.x = ndc.x; look.y = ndc.y;
  if (isMailOpen() || e.pointerType !== "mouse") { last = null; return; }
  if (last && emails.overPit(camera, ndc.x, ndc.y)) { const sp = Math.hypot((ndc.x - last.x) * camera.aspect, ndc.y - last.y); if (sp > 0.003) emails.ruffle(camera, ndc.x, ndc.y, sp); }
  last = { x: ndc.x, y: ndc.y };
});
canvas.addEventListener("pointerdown", e => { down = { x: e.clientX, y: e.clientY }; });
addEventListener("pointerup", e => {
  const click = down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 6; down = null;
  if (!click || e.target !== canvas || isMailOpen()) return;
  toNdc(e); camera.updateMatrixWorld(); ray.setFromCamera(ndc, camera);
  const caught = emails.pick(ray);
  if (caught) { emails.hold(caught); showMail(caught.mail, () => emails.release(caught)); }
});
for (const ev of ["pointerdown", "keydown", "touchend"]) addEventListener(ev, () => emailRustle.unlock(), { passive: true });   // browsers only allow sound after a gesture
addEventListener("keydown", e => { if (e.key === "Escape") hideMail(); });

// ---------- loop ----------
function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.fov = camera.aspect < 0.8 ? 66 : 48; camera.updateProjectionMatrix(); }
addEventListener("resize", resize); resize();
const clock = new THREE.Clock(), cam = { x: 0, y: 0 };
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  cam.x += (look.x * 0.45 - cam.x) * (1 - Math.exp(-3 * dt)); cam.y += (look.y * 0.18 - cam.y) * (1 - Math.exp(-3 * dt));   // the view drifts a little with the pointer
  camera.position.set(BASE.x + cam.x, BASE.y + cam.y, BASE.z); camera.lookAt(AIM);
  emails.update(dt);
  renderer.render(scene, camera);
});
