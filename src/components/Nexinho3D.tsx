"use client";

import { useEffect, useRef } from "react";

// Nexinho, o mascote 3D do hero. O Three.js é carregado só no navegador, depois da página,
// e a animação pausa fora da tela, com a aba escondida ou com "reduzir movimento" ligado.
export function Nexinho3D() {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let stop = () => {};
    let cancelled = false;

    (async () => {
      const THREE = await import("three");
      const { RoundedBoxGeometry } = await import("three/examples/jsm/geometries/RoundedBoxGeometry.js");
      if (cancelled) return;

      const LIME = 0xc5f04a, LIME_DARK = 0x8fbf22, INK = 0x12160a, GLOW = 0xe4ff8f;
      const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
      camera.position.set(0, 0.3, 10);

      scene.add(new THREE.HemisphereLight(0xeaffc0, 0x1b2414, 1.1));
      const key = new THREE.DirectionalLight(0xffffff, 2.2);
      key.position.set(3, 5, 4);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      scene.add(key);
      const rim = new THREE.PointLight(LIME, 30, 12);
      rim.position.set(-3, 1, -2);
      scene.add(rim);

      const mat = (color: number) => new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.1 });
      const limeMat = mat(LIME);
      const darkMat = mat(LIME_DARK);
      const inkMat = new THREE.MeshStandardMaterial({ color: INK, roughness: 0.2, metalness: 0.4 });
      const glowMat = new THREE.MeshStandardMaterial({ color: GLOW, emissive: LIME, emissiveIntensity: 1.6 });

      const bot = new THREE.Group();
      scene.add(bot);

      const body = new THREE.Mesh(new RoundedBoxGeometry(1.7, 1.5, 1.2, 6, 0.38), limeMat);
      body.position.y = -0.9;
      body.castShadow = true;
      bot.add(body);

      const head = new THREE.Group();
      head.position.y = 0.55;
      bot.add(head);
      const skull = new THREE.Mesh(new RoundedBoxGeometry(2.3, 1.75, 1.6, 8, 0.5), limeMat);
      skull.castShadow = true;
      head.add(skull);
      const screen = new THREE.Mesh(new RoundedBoxGeometry(1.8, 1.15, 0.2, 6, 0.18), inkMat);
      screen.position.z = 0.74;
      head.add(screen);

      const eyeGeo = new THREE.CapsuleGeometry(0.11, 0.18, 6, 12);
      const eyeL = new THREE.Mesh(eyeGeo, glowMat);
      const eyeR = new THREE.Mesh(eyeGeo, glowMat);
      eyeL.position.set(-0.38, 0.08, 0.86);
      eyeR.position.set(0.38, 0.08, 0.86);
      head.add(eyeL, eyeR);
      const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.045, 8, 24, Math.PI), glowMat);
      mouth.rotation.z = Math.PI;
      mouth.position.set(0, -0.2, 0.86);
      head.add(mouth);

      // Antena com a faísca do logo
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.55, 12), darkMat);
      stem.position.y = 1.12;
      head.add(stem);
      const spark = new THREE.Group();
      spark.position.y = 1.5;
      head.add(spark);
      for (let i = 0; i < 4; i++) {
        const ray = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.42, 4), glowMat);
        ray.rotation.z = (i * Math.PI) / 2;
        ray.position.set(Math.sin(-ray.rotation.z) * 0.12, Math.cos(ray.rotation.z) * 0.12, 0);
        spark.add(ray);
      }
      spark.add(new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), glowMat));

      // Escudo da Garantia Nexo no peito, com o N
      const s = new THREE.Shape();
      s.moveTo(0, 0.42);
      s.lineTo(0.36, 0.28);
      s.lineTo(0.36, 0);
      s.quadraticCurveTo(0.36, -0.3, 0, -0.46);
      s.quadraticCurveTo(-0.36, -0.3, -0.36, 0);
      s.lineTo(-0.36, 0.28);
      s.closePath();
      const shield = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 3 }), inkMat);
      shield.position.set(0, -0.85, 0.6);
      bot.add(shield);
      const bar = (w: number, h: number, x: number, rz = 0) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.05), glowMat);
        m.position.set(x, -0.02, 0.13);
        m.rotation.z = rz;
        shield.add(m);
      };
      bar(0.07, 0.4, -0.13);
      bar(0.07, 0.4, 0.13);
      bar(0.07, 0.46, 0, 0.58);

      const arm = (side: number) => {
        const g = new THREE.Group();
        g.position.set(side * 1.0, -0.55, 0);
        const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.55, 6, 12), darkMat);
        a.position.y = -0.38;
        a.castShadow = true;
        g.add(a);
        const hand = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 20), limeMat);
        hand.position.y = -0.78;
        g.add(hand);
        g.rotation.z = side * 0.25;
        bot.add(g);
        return g;
      };
      const armL = arm(-1);
      const armR = arm(1);
      for (const side of [-1, 1]) {
        const f = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.3, 0.6, 4, 0.12), darkMat);
        f.position.set(side * 0.45, -1.82, 0.05);
        f.castShadow = true;
        bot.add(f);
      }

      const floor = new THREE.Mesh(new THREE.CircleGeometry(1.6, 48), new THREE.ShadowMaterial({ opacity: 0.35 }));
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -2.3;
      floor.receiveShadow = true;
      scene.add(floor);

      const N = 50;
      const pos = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 8;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 6;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 4 - 1;
      }
      const dustGeo = new THREE.BufferGeometry();
      dustGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: LIME, size: 0.05, transparent: true, opacity: 0.6 }));
      scene.add(dust);

      // Olha para o mouse (ou para o toque); clique nele faz pular e acenar mais rápido
      const target = new THREE.Vector2();
      const look = new THREE.Vector2();
      const onMove = (e: PointerEvent) => target.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
      addEventListener("pointermove", onMove, { passive: true });
      let hop = 0;
      const ray = new THREE.Raycaster();
      const onClick = (e: MouseEvent) => {
        const r = renderer.domElement.getBoundingClientRect();
        ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
        if (ray.intersectObject(bot, true).length) hop = 1;
      };
      renderer.domElement.addEventListener("click", onClick);

      const resize = () => {
        const w = el.clientWidth, h = el.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        // Em telas estreitas afasta a câmera para o boneco caber inteiro
        camera.position.z = w / h < 1 ? 13 : 10;
        camera.updateProjectionMatrix();
      };
      const ro = new ResizeObserver(resize);
      ro.observe(el);
      resize();

      const clock = new THREE.Clock();
      let nextBlink = 2;
      const frame = () => {
        const t = clock.getElapsedTime();
        look.lerp(target, 0.08);
        hop = Math.max(0, hop - 0.025);
        const jump = Math.sin(hop * Math.PI) * 0.9;
        bot.position.y = Math.sin(t * 1.6) * 0.12 + jump;
        bot.rotation.y = look.x * 0.35 + Math.sin(t * 0.5) * 0.05;
        head.rotation.y = look.x * 0.35;
        head.rotation.x = -look.y * 0.25;
        armR.rotation.z = 2.65 + Math.sin(t * (hop > 0 ? 14 : 5)) * 0.35;
        armL.rotation.z = -0.25 + Math.sin(t * 1.6 + 1) * 0.08 - jump * 0.8;
        if (t > nextBlink) {
          const k = Math.min(1, (t - nextBlink) / 0.14);
          eyeL.scale.y = eyeR.scale.y = Math.max(0.1, k < 0.5 ? 1 - k * 1.8 : 0.1 + (k - 0.5) * 1.8);
          if (k >= 1) {
            nextBlink = t + 2 + Math.random() * 3;
            eyeL.scale.y = eyeR.scale.y = 1;
          }
        }
        mouth.scale.setScalar(1 + jump * 0.6);
        spark.rotation.z = t * 1.5;
        spark.scale.setScalar(1 + Math.sin(t * 4) * 0.15);
        glowMat.emissiveIntensity = 1.4 + Math.sin(t * 3) * 0.4;
        dust.rotation.y = t * 0.03;
        floor.scale.setScalar(1 - bot.position.y * 0.25);
        renderer.render(scene, camera);
      };

      // Só anima quando aparece na tela
      let visible = true;
      const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        renderer.setAnimationLoop(visible && !still ? frame : null);
      });
      io.observe(el);
      armR.rotation.z = 2.65;
      frame();
      if (!still) renderer.setAnimationLoop(frame);
      el.classList.add("ready");

      stop = () => {
        renderer.setAnimationLoop(null);
        io.disconnect();
        ro.disconnect();
        removeEventListener("pointermove", onMove);
        renderer.domElement.removeEventListener("click", onClick);
        scene.traverse((o) => {
          const m = o as { geometry?: { dispose(): void } };
          m.geometry?.dispose();
        });
        for (const m of [limeMat, darkMat, inkMat, glowMat]) m.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
      if (!visible) renderer.setAnimationLoop(null);
    })().catch(() => {
      /* sem WebGL: o espaço fica só com o brilho de fundo */
    });

    return () => {
      cancelled = true;
      stop();
    };
  }, []);

  return <div ref={box} className="nexinho" aria-label="Nexinho, o mascote da Nexo" role="img" />;
}
