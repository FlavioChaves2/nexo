// Cena 3D do Nexinho. Importa só as peças usadas do Three.js (o bundler descarta o resto)
// e é carregada sob demanda pelo componente Nexinho3D, nunca no carregamento da página.
import {
  ACESFilmicToneMapping,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CapsuleGeometry,
  CircleGeometry,
  Clock,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PointLight,
  Points,
  PointsMaterial,
  Raycaster,
  SRGBColorSpace,
  Scene,
  ShadowMaterial,
  Shape,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  WebGLRenderer,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

export type NexinhoOptions = {
  /** Cor principal e cor das sombras/braços. Padrão: verde-lima da Nexo. */
  main?: string;
  dark?: string;
  mood?: "happy" | "sad";
  /** Segue o mouse e reage ao clique. */
  interactive?: boolean;
  /** Partículas e sombra no chão (desligue em versões pequenas). */
  decor?: boolean;
  /** Distância da câmera: maior = boneco menor. */
  zoom?: number;
};

export type NexinhoHandle = { celebrate(): void; dispose(): void };

const spring = (pos: number, vel: number, target: number, k: number, damp: number, dt: number) => {
  vel += (target - pos) * k * dt;
  vel *= Math.exp(-damp * dt);
  return [pos + vel * dt, vel] as const;
};

export function createNexinho(el: HTMLElement, opts: NexinhoOptions = {}): NexinhoHandle {
  const MAIN = opts.main ?? "#C5F04A";
  const DARK = opts.dark ?? "#8FBF22";
  const INK = 0x12160a;
  const GLOW = 0xe4ff8f;
  const sad = opts.mood === "sad";
  const interactive = opts.interactive ?? true;
  const decor = opts.decor ?? true;
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const light = matchMedia("(pointer: coarse)").matches || innerWidth < 600;

  const renderer = new WebGLRenderer({ antialias: !light, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, light ? 1.5 : 2));
  renderer.shadowMap.enabled = decor && !light;
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  // O desenho é feito em pixels reais da tela (1,5x a 3x no celular); o tamanho visível é sempre o da caixa.
  Object.assign(renderer.domElement.style, { display: "block", width: "100%", height: "100%" });
  el.appendChild(renderer.domElement);

  const scene = new Scene();
  const camera = new PerspectiveCamera(35, 1, 0.1, 100);
  const baseZoom = opts.zoom ?? 10;
  camera.position.set(0, 0.3, baseZoom);

  scene.add(new HemisphereLight(0xeaffc0, 0x1b2414, 1.1));
  const key = new DirectionalLight(0xffffff, 2.2);
  key.position.set(3, 5, 4);
  key.castShadow = renderer.shadowMap.enabled;
  key.shadow.mapSize.set(512, 512);
  scene.add(key);
  const rim = new PointLight(MAIN, 30, 12);
  rim.position.set(-3, 1, -2);
  scene.add(rim);

  const mat = (color: string | number) => new MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.1 });
  const mainMat = mat(MAIN);
  const darkMat = mat(DARK);
  const inkMat = new MeshStandardMaterial({ color: INK, roughness: 0.2, metalness: 0.4 });
  const glowMat = new MeshStandardMaterial({ color: GLOW, emissive: MAIN, emissiveIntensity: 1.6 });
  const seg = light ? 4 : 6;

  const bot = new Group();
  scene.add(bot);
  const torso = new Group();
  torso.position.y = -0.9;
  bot.add(torso);
  const body = new Mesh(new RoundedBoxGeometry(1.7, 1.5, 1.2, seg, 0.38), mainMat);
  body.castShadow = true;
  torso.add(body);

  const neck = new Group();
  neck.position.y = 1.45;
  torso.add(neck);
  const head = new Group();
  neck.add(head);
  const skull = new Mesh(new RoundedBoxGeometry(2.3, 1.75, 1.6, seg + 2, 0.5), mainMat);
  skull.castShadow = true;
  head.add(skull);
  const screen = new Mesh(new RoundedBoxGeometry(1.8, 1.15, 0.2, seg, 0.18), inkMat);
  screen.position.z = 0.74;
  head.add(screen);

  const eyeGeo = new CapsuleGeometry(0.11, 0.18, 6, 12);
  const eyeL = new Mesh(eyeGeo, glowMat);
  const eyeR = new Mesh(eyeGeo, glowMat);
  eyeL.position.set(-0.38, 0.08, 0.86);
  eyeR.position.set(0.38, 0.08, 0.86);
  head.add(eyeL, eyeR);
  const mouth = new Mesh(new TorusGeometry(0.2, 0.045, 8, 24, Math.PI), glowMat);
  mouth.rotation.z = sad ? 0 : Math.PI;
  mouth.position.set(0, sad ? -0.34 : -0.2, 0.86);
  head.add(mouth);
  if (sad) {
    eyeL.rotation.z = -0.5;
    eyeR.rotation.z = 0.5;
  }

  // Antena com mola e a faísca do logo
  const antenna = new Group();
  antenna.position.y = 0.85;
  head.add(antenna);
  const stem = new Mesh(new CylinderGeometry(0.05, 0.05, 0.55, 10), darkMat);
  stem.position.y = 0.27;
  antenna.add(stem);
  const spark = new Group();
  spark.position.y = 0.65;
  antenna.add(spark);
  for (let i = 0; i < 4; i++) {
    const r = new Mesh(new ConeGeometry(0.07, 0.42, 4), glowMat);
    r.rotation.z = (i * Math.PI) / 2;
    r.position.set(Math.sin(-r.rotation.z) * 0.12, Math.cos(r.rotation.z) * 0.12, 0);
    spark.add(r);
  }
  spark.add(new Mesh(new SphereGeometry(0.1, 12, 12), glowMat));

  // Escudo da Garantia Nexo com o N
  const s = new Shape();
  s.moveTo(0, 0.42);
  s.lineTo(0.36, 0.28);
  s.lineTo(0.36, 0);
  s.quadraticCurveTo(0.36, -0.3, 0, -0.46);
  s.quadraticCurveTo(-0.36, -0.3, -0.36, 0);
  s.lineTo(-0.36, 0.28);
  s.closePath();
  const shield = new Mesh(new ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 }), inkMat);
  shield.position.set(0, 0.05, 0.6);
  torso.add(shield);
  for (const [w, h, x, rz] of [[0.07, 0.4, -0.13, 0], [0.07, 0.4, 0.13, 0], [0.07, 0.46, 0, 0.58]] as const) {
    const m = new Mesh(new BoxGeometry(w, h, 0.05), glowMat);
    m.position.set(x, -0.02, 0.13);
    m.rotation.z = rz;
    shield.add(m);
  }

  const makeArm = (side: number) => {
    const g = new Group();
    g.position.set(side * 1.0, 0.35, 0);
    const a = new Mesh(new CapsuleGeometry(0.17, 0.55, 6, 10), darkMat);
    a.position.y = -0.38;
    a.castShadow = true;
    g.add(a);
    const hand = new Mesh(new SphereGeometry(0.22, 16, 16), mainMat);
    hand.position.y = -0.78;
    g.add(hand);
    torso.add(g);
    return g;
  };
  const armL = makeArm(-1);
  const armR = makeArm(1);
  const feet = new Group();
  bot.add(feet);
  for (const side of [-1, 1]) {
    const f = new Mesh(new RoundedBoxGeometry(0.5, 0.3, 0.6, 4, 0.12), darkMat);
    f.position.set(side * 0.45, -1.82, 0.05);
    f.castShadow = true;
    feet.add(f);
  }

  let floor: Mesh | null = null;
  let dust: Points | null = null;
  if (decor) {
    floor = new Mesh(new CircleGeometry(1.6, 40), new ShadowMaterial({ opacity: 0.35 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.3;
    floor.receiveShadow = true;
    scene.add(floor);
    const N = light ? 24 : 50;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4 - 1;
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(pos, 3));
    dust = new Points(g, new PointsMaterial({ color: MAIN, size: 0.05, transparent: true, opacity: 0.6 }));
    scene.add(dust);
  }

  // Estado das molas e dos "comportamentos"
  const target = new Vector2();
  let lastMove = -10;
  let lookX = 0, lookXv = 0, lookY = 0, lookYv = 0;
  let ant = 0, antV = 0;
  let prevHeadY = 0;
  let idleTarget = new Vector2();
  let nextIdle = 0;
  let nextBlink = 1.5, blinks = 0;
  let nextWave = 1.2, waveStart = -10;
  let tilt = 0, tiltV = 0, tiltTarget = 0;
  let celebrateAt = -10;

  const onMove = (e: PointerEvent) => {
    target.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    lastMove = clock.getElapsedTime();
  };
  const ray = new Raycaster();
  const onClick = (e: MouseEvent) => {
    const r = renderer.domElement.getBoundingClientRect();
    ray.setFromCamera(new Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
    if (ray.intersectObject(bot, true).length) celebrateAt = clock.getElapsedTime();
  };
  if (interactive) {
    addEventListener("pointermove", onMove, { passive: true });
    renderer.domElement.addEventListener("click", onClick);
  }

  const resize = () => {
    const w = el.clientWidth, h = el.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w / h < 1 ? baseZoom * 1.3 : baseZoom;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(el);
  resize();

  const clock = new Clock();
  let last = 0;
  const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

  const frame = () => {
    const t = clock.getElapsedTime();
    const dt = Math.min(0.05, t - last || 0.016);
    last = t;

    // Para onde olhar: o mouse, ou passeia com o olhar quando o mouse fica parado
    let lx = target.x, ly = target.y;
    if (!interactive || t - lastMove > 3) {
      if (t > nextIdle) {
        idleTarget = new Vector2((Math.random() - 0.5) * 1.4, (Math.random() - 0.3) * 0.8);
        nextIdle = t + 1.5 + Math.random() * 2.5;
        tiltTarget = Math.random() < 0.35 ? (Math.random() - 0.5) * 0.35 : 0;
      }
      lx = idleTarget.x;
      ly = idleTarget.y;
    } else tiltTarget = 0;
    if (sad) ly = Math.min(ly, -0.4);
    [lookX, lookXv] = spring(lookX, lookXv, lx, 60, 7, dt);
    [lookY, lookYv] = spring(lookY, lookYv, ly, 60, 7, dt);
    [tilt, tiltV] = spring(tilt, tiltV, tiltTarget, 40, 6, dt);

    // Comemoração: agacha, salta esticado, gira e cai achatando
    const c = t - celebrateAt;
    let jump = 0, squash = 0, spin = 0, armsUp = 0;
    if (c < 1.3) {
      if (c < 0.18) squash = ease(c / 0.18) * 0.18;
      else if (c < 0.9) {
        const k = (c - 0.18) / 0.72;
        jump = Math.sin(k * Math.PI) * 1.3;
        squash = -Math.sin(k * Math.PI) * 0.12;
        spin = ease(k) * Math.PI * 2;
        armsUp = 1;
      } else {
        const k = (c - 0.9) / 0.4;
        squash = Math.sin(k * Math.PI) * 0.14;
        armsUp = 1 - ease(k);
      }
    }

    // Flutuação com estica-e-achata e corpo inclinando para o lado que olha
    const speed = sad ? 0.9 : 1.6;
    const bob = Math.sin(t * speed);
    bot.position.y = bob * (sad ? 0.06 : 0.12) + jump;
    const stretch = -bob * 0.025 - squash;
    torso.scale.set(1 - stretch * 0.6, 1 + stretch, 1 - stretch * 0.6);
    bot.rotation.y = lookX * 0.3 + spin;
    bot.rotation.z = -lookXv * 0.02 + Math.sin(t * 0.7) * 0.02;
    neck.position.y = 1.45 + Math.sin(t * speed - 0.6) * 0.03;
    head.rotation.y = lookX * 0.4;
    head.rotation.x = -lookY * 0.3 + (sad ? 0.25 : 0);
    head.rotation.z = tilt;

    // Antena balança com o movimento da cabeça
    const headVel = (head.rotation.y - prevHeadY) / dt;
    prevHeadY = head.rotation.y;
    [ant, antV] = spring(ant, antV, -headVel * 0.08, 90, 5, dt);
    antenna.rotation.z = ant + Math.sin(t * 2.3) * 0.04;
    spark.rotation.z = t * 1.5;
    spark.scale.setScalar(1 + Math.sin(t * 4) * 0.15 + armsUp * 0.3);

    // Braços: balanço solto e aceno de vez em quando
    if (!sad && t > nextWave && interactive) {
      waveStart = t;
      nextWave = t + 6 + Math.random() * 4;
    }
    const w = t - waveStart;
    const wave = w < 2.2 ? Math.sin((w / 2.2) * Math.PI) : 0;
    const swayR = Math.sin(t * speed + 0.5) * 0.06;
    const swayL = Math.sin(t * speed + 2) * 0.06;
    armR.rotation.z = 0.2 + swayR + ease(wave * 1.4) * 2.4 + wave * Math.sin(w * 11) * 0.3 + armsUp * 2.6;
    armL.rotation.z = -0.2 + swayL - armsUp * 2.6 + (sad ? 0.1 : 0);
    armR.rotation.x = Math.sin(t * speed) * 0.08;
    armL.rotation.x = -Math.sin(t * speed) * 0.08;

    // Piscar (às vezes duas vezes seguidas)
    if (t > nextBlink) {
      const k = Math.min(1, (t - nextBlink) / 0.13);
      const sY = k < 0.5 ? 1 - k * 1.8 : 0.1 + (k - 0.5) * 1.8;
      eyeL.scale.y = eyeR.scale.y = Math.max(0.1, sY);
      if (k >= 1) {
        eyeL.scale.y = eyeR.scale.y = 1;
        blinks++;
        nextBlink = blinks % 3 === 0 ? t + 0.15 : t + 2 + Math.random() * 3;
      }
    }
    if (armsUp > 0) eyeL.scale.y = eyeR.scale.y = 0.35; // olhinhos felizes na comemoração
    mouth.scale.setScalar(1 + armsUp * 0.5 + jump * 0.2);

    glowMat.emissiveIntensity = 1.4 + Math.sin(t * 3) * 0.4 + armsUp * 0.8;
    if (dust) dust.rotation.y = t * 0.03;
    if (floor) floor.scale.setScalar(Math.max(0.4, 1 - bot.position.y * 0.3));
    renderer.render(scene, camera);
  };

  let onScreen = true;
  let tabVisible = !document.hidden;
  const sync = () => renderer.setAnimationLoop(onScreen && tabVisible && !still ? frame : null);
  const io = new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    sync();
  });
  io.observe(el);
  const onVis = () => {
    tabVisible = !document.hidden;
    sync();
  };
  document.addEventListener("visibilitychange", onVis);
  frame();
  sync();

  return {
    celebrate() {
      celebrateAt = clock.getElapsedTime();
      if (still) frame();
    },
    dispose() {
      renderer.setAnimationLoop(null);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("click", onClick);
      scene.traverse((o) => (o as Mesh).geometry?.dispose());
      for (const m of [mainMat, darkMat, inkMat, glowMat]) m.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
