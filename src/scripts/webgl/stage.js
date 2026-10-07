import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { env, clamp, lerp } from '../core/env.js';
import * as shapes from './shapes.js';
import { Arcs } from './arcs.js';
import { origin, destinations } from '../../data/alumni.js';

const FOV = 35;
const DIST = 10;
const PAPER = [1.0, 1.0, 1.0];
const RED = [0.0, 0.898, 1.0];

// Kerala, front and centre
const YAW_INDIA = (-78 * Math.PI) / 180;
const TILT_INDIA = (16 * Math.PI) / 180;

const DEFAULTS = {
  shape: 'dust',
  x: 0,
  y: 0,
  z: 0,
  size: 0.4, // fraction of the viewport height
  yaw: 0,
  tilt: 0,
  turn: 0, // continuous rotation, rad / s
  sway: 0, // oscillation amplitude, rad
  look: 0.18, // how far the shape turns toward the pointer
  red: 0.06, // share of red particles
  alpha: 1,
  drift: 0.012,
  point: 2.3,
  back: 0, // 1 = fade particles on the far side (spheres)
  force: 0.3, // pointer repulsion
  arcs: false,
  drag: false, // the visitor may spin it (needs a [data-globe-drag] element)
  auto: 0, // idle rotation of a draggable globe, rad / s
};

/**
 * One fixed full-screen canvas of particles that re-forms itself as the page
 * scrolls. Each "stop" pairs a DOM section with a shape + placement; the stage
 * morphs between neighbouring stops while the next section scrolls in.
 */
export class Stage {
  constructor(canvas) {
    this.canvas = canvas;
    this.count = env.small ? 9000 : 20000;
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, env.small ? 1.5 : 2);
    this.P = 0;
    this.intro = { t: 0, done: false };
    this.pair = [-1, -1];
    this.pointer = { x: 0, y: 0, tx: 0, ty: 0, wx: 0, wy: 0, speed: 0, px: 0, py: 0 };
    this.spin = { yaw: 0, tilt: 0, vy: 0, vt: 0, active: false, focused: false, auto: 0 };
    this.time = 0;
    this.ready = false;
    this.triggers = [];
    this.onFrame = null;
    this.render = this.render.bind(this);
    this.resize = this.resize.bind(this);
  }

  async init(stops) {
    const renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(this.pixelRatio);
    renderer.setClearColor(0x000000, 0);
    this.renderer = renderer;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60);
    this.camera.position.set(0, 0, DIST);

    // resolve stops â†’ [virtual scatter stop, ...page stops]
    const resolved = stops
      .map((s) => ({ ...DEFAULTS, ...s, el: typeof s.el === 'string' ? document.querySelector(s.el) : s.el }))
      .filter((s) => s.el);
    if (!resolved.length) resolved.push({ ...DEFAULTS, el: document.body });
    const first = resolved[0];
    this.stops = [{ ...first, shape: 'scatter', alpha: 0, arcs: false, size: first.size * 1.4, el: null }, ...resolved];

    await this.buildShapes();
    this.buildPoints();

    if (this.stops.some((s) => s.arcs)) {
      this.arcs = new Arcs({ origin, destinations, pixelRatio: this.pixelRatio });
      this.scene.add(this.arcs.group);
    }

    this.resize(true);
    this.bind();

    // one trigger per stop after the first: progress 0 â†’ 1 while its section scrolls in
    this.triggers = this.stops.slice(2).map((s) =>
      ScrollTrigger.create({
        trigger: s.el,
        start: s.start || 'top 88%',
        end: s.end || 'top 28%',
      }),
    );

    this.ready = true;
    gsap.ticker.add(this.render);
    requestAnimationFrame(() => this.canvas.classList.add('is-on'));
    return this;
  }

  async buildShapes() {
    const keys = [...new Set(this.stops.map((s) => s.shape))];
    this.buffers = {};
    let land = null;

    if (keys.includes('globe')) {
      try {
        land = await shapes.loadLand();
      } catch {
        land = null;
      }
    }
    if (keys.some((k) => k.startsWith('text:')) && document.fonts?.load) {
      const glyphs = keys.filter((k) => k.startsWith('text:')).map((k) => k.slice(5)).join('');
      try {
        await document.fonts.load('800 condensed 120px "Anek Latin Variable"', glyphs);
      } catch {
        /* fall back to whatever is available */
      }
    }

    for (const key of keys) {
      if (key === 'scatter') this.buffers[key] = shapes.scatter(this.count);
      else if (key === 'globe') this.buffers[key] = land ? shapes.globe(this.count, land) : shapes.ring(this.count);
      else if (key === 'ring') this.buffers[key] = shapes.ring(this.count);
      else if (key === 'bars') this.buffers[key] = shapes.bars(this.count);
      else if (key === 'network') this.buffers[key] = shapes.network(this.count);
      else if (key.startsWith('text:')) this.buffers[key] = shapes.text(this.count, key.slice(5));
      else this.buffers[key] = shapes.dust(this.count, 7 + key.length);
    }
  }

  buildPoints() {
    const n = this.count;
    const geo = new THREE.BufferGeometry();
    const rand = new Float32Array(n * 4);
    for (let i = 0; i < n * 4; i++) rand[i] = Math.random();

    this.aFrom = new THREE.BufferAttribute(new Float32Array(n * 4), 4);
    this.aTo = new THREE.BufferAttribute(new Float32Array(n * 4), 4);
    this.aFrom.setUsage(THREE.DynamicDrawUsage);
    this.aTo.setUsage(THREE.DynamicDrawUsage);

    // three needs a `position` attribute to know how many points to draw
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    geo.setAttribute('aFrom', this.aFrom);
    geo.setAttribute('aTo', this.aTo);
    geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 4));

    this.uniforms = {
      uTime: { value: 0 },
      uMix: { value: 0 },
      uSwirl: { value: 0.9 },
      uDrift: { value: 0.012 },
      uSize: { value: 2.3 },
      uPixelRatio: { value: this.pixelRatio },
      uRed: { value: 0.06 },
      uOpacity: { value: 1 },
      uBackA: { value: 0 },
      uBackB: { value: 0 },
      uScaleA: { value: new THREE.Vector3(1, 1, 1) },
      uScaleB: { value: new THREE.Vector3(1, 1, 1) },
      uOffA: { value: new THREE.Vector3() },
      uOffB: { value: new THREE.Vector3() },
      uRotA: { value: new THREE.Vector2() },
      uRotB: { value: new THREE.Vector2() },
      uPointer: { value: new THREE.Vector2(99, 99) },
      uPointerR: { value: 1.1 },
      uPointerF: { value: 0 },
      uColA: { value: new THREE.Vector3(...PAPER) },
      uColB: { value: new THREE.Vector3(...RED) },
    };

    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uMix;
        uniform float uSwirl;
        uniform float uDrift;
        uniform float uSize;
        uniform float uPixelRatio;
        uniform float uRed;
        uniform float uBackA;
        uniform float uBackB;
        uniform float uPointerR;
        uniform float uPointerF;
        uniform vec3 uScaleA;
        uniform vec3 uScaleB;
        uniform vec3 uOffA;
        uniform vec3 uOffB;
        uniform vec2 uRotA;
        uniform vec2 uRotB;
        uniform vec2 uPointer;
        attribute vec4 aFrom;
        attribute vec4 aTo;
        attribute vec4 aRand;
        varying float vAlpha;
        varying float vRed;

        vec3 orient(vec3 p, vec2 r) {
          float cy = cos(r.x);
          float sy = sin(r.x);
          p = vec3(cy * p.x + sy * p.z, p.y, -sy * p.x + cy * p.z);
          float cx = cos(r.y);
          float sx = sin(r.y);
          return vec3(p.x, cx * p.y - sx * p.z, sx * p.y + cx * p.z);
        }

        void main() {
          float t = clamp(uMix * 1.5 - aRand.x * 0.5, 0.0, 1.0);
          t = t * t * (3.0 - 2.0 * t);

          vec3 a = orient(aFrom.xyz, uRotA);
          vec3 b = orient(aTo.xyz, uRotB);
          float faceA = mix(1.0, smoothstep(-0.5, 0.4, a.z) * 0.93 + 0.07, uBackA);
          float faceB = mix(1.0, smoothstep(-0.5, 0.4, b.z) * 0.93 + 0.07, uBackB);

          vec3 p = mix(a * uScaleA + uOffA, b * uScaleB + uOffB, t);

          float arc = sin(t * 3.14159265);
          float ph = aRand.w * 6.2831853;
          vec3 swirl = vec3(
            sin(ph + uTime * 0.7 + p.y * 0.6),
            cos(ph * 1.7 + uTime * 0.6 + p.x * 0.5),
            sin(ph * 2.3 + uTime * 0.5)
          );
          p += swirl * arc * uSwirl * (0.35 + aRand.z);

          p += vec3(
            sin(uTime * 0.31 + ph * 3.0),
            cos(uTime * 0.27 + ph * 5.0),
            sin(uTime * 0.23 + ph * 7.0)
          ) * uDrift * (0.4 + aRand.y);

          vec2 d = p.xy - uPointer;
          float fall = smoothstep(uPointerR, 0.0, length(d));
          p.xy += normalize(d + 0.0001) * fall * uPointerF;
          p.z += fall * uPointerF * 0.8;

          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = uSize * (0.5 + aRand.z) * uPixelRatio * (10.0 / -mv.z);

          vAlpha = mix(aFrom.w * faceA, aTo.w * faceB, t) * (1.0 + fall * 0.8);
          vRed = max(step(1.0 - uRed, aRand.y), fall * fall * 0.9);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uOpacity;
        uniform vec3 uColA;
        uniform vec3 uColB;
        varying float vAlpha;
        varying float vRed;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.06, d);
          vec3 col = mix(uColA, uColB, vRed);
          gl_FragColor = vec4(col, a * vAlpha * uOpacity);
        }
      `,
    });

    this.points = new THREE.Points(geo, material);
    this.points.frustumCulled = false;
    this.scene.add(this.points);
  }

  bind() {
    window.addEventListener('resize', () => this.resize(false));

    if (!env.touch) {
      window.addEventListener(
        'pointermove',
        (e) => {
          this.pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
          this.pointer.ty = -((e.clientY / window.innerHeight) * 2 - 1);
        },
        { passive: true },
      );
    }

    // optional: drag a DOM region to spin the globe
    const zone = document.querySelector('[data-globe-drag]');
    if (zone) {
      let lastX = 0;
      let lastY = 0;
      zone.addEventListener('pointerdown', (e) => {
        this.spin.active = true;
        this.spin.focused = false;
        gsap.killTweensOf(this.spin);
        lastX = e.clientX;
        lastY = e.clientY;
        zone.setPointerCapture?.(e.pointerId);
        zone.classList.add('is-dragging');
      });
      zone.addEventListener('pointermove', (e) => {
        if (!this.spin.active) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        this.spin.vy = dx * 0.0052;
        this.spin.vt = dy * 0.0032;
        this.spin.yaw += this.spin.vy;
        this.spin.tilt = clamp(this.spin.tilt + this.spin.vt, -0.9, 0.9);
      });
      const end = () => {
        this.spin.active = false;
        zone.classList.remove('is-dragging');
      };
      zone.addEventListener('pointerup', end);
      zone.addEventListener('pointercancel', end);
    }
  }

  resize(force) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // mobile browsers resize constantly as the URL bar slides; ignore small height changes
    if (!force && w === this.w && Math.abs(h - this.h) < 140) return;
    this.w = w;
    this.h = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.viewH = 2 * Math.tan((FOV * Math.PI) / 360) * DIST;
    this.viewW = this.viewH * this.camera.aspect;
  }

  /** Resolve a stop into world-space placement for this frame. */
  place(stop) {
    const c = env.small && stop.m ? { ...stop, ...stop.m } : stop;
    const vw = this.viewW;
    const vh = this.viewH;
    let s = c.size * vh;
    if (c.fit) s = Math.min(s, c.fit * vw); // never wider than a share of the viewport
    const scale = c.shape === 'dust' || c.shape === 'scatter' ? [vw * 0.6, vh * 0.62, 3] : [s, s, s];
    if (c.shape === 'scatter') scale[0] = scale[1] = scale[2] = s * 1.2;

    // a draggable globe is turned by the visitor (and by focus()); the rest turn themselves
    const free = c.drag ? this.spin : null;
    const yaw = free
      ? c.yaw + free.yaw + this.pointer.x * c.look * 0.4
      : c.yaw + c.turn * this.time + c.sway * Math.sin(this.time * 0.17) + this.pointer.x * c.look;
    const tilt = c.tilt - this.pointer.y * c.look * (free ? 0.25 : 0.6) + (free ? free.tilt : 0);

    // a shape placed off-centre is seen at an angle; turn it back toward the viewer
    const ox = (c.x * vw) / 2;
    const oy = (c.y * vh) / 2;
    const face = c.back ? [Math.atan2(ox, DIST), Math.atan2(oy, DIST)] : [0, 0];

    return {
      c,
      scale,
      off: [ox, oy, c.z],
      rot: [yaw - face[0], tilt + face[1]],
    };
  }

  playIntro(duration = 2.8) {
    if (env.reduced) {
      this.intro.t = 1;
      this.intro.done = true;
      return gsap.timeline();
    }
    return gsap.to(this.intro, {
      t: 1,
      duration,
      ease: 'power3.inOut',
      onComplete: () => (this.intro.done = true),
    });
  }

  /** Turn the draggable globe so that a longitude (and latitude) faces the viewer. */
  focus(lon, lat = 14) {
    const stop = this.live || this.stops.find((c) => c.drag);
    if (!stop) return;
    const want = (-lon * Math.PI) / 180 - stop.yaw;
    const delta = Math.atan2(Math.sin(want - this.spin.yaw), Math.cos(want - this.spin.yaw));
    this.spin.focused = true;
    this.spin.vy = 0;
    gsap.to(this.spin, {
      yaw: this.spin.yaw + delta,
      tilt: clamp((lat * Math.PI) / 180 - stop.tilt, -0.7, 0.7),
      duration: env.reduced ? 0 : 1.7,
      ease: 'expo.out',
      overwrite: true,
    });
  }

  /** Let the globe drift again. */
  release() {
    this.spin.focused = false;
  }

  /** Screen position (px) of a world point. */
  project(v) {
    const p = v.clone().project(this.camera);
    return { x: (p.x * 0.5 + 0.5) * this.w, y: (-p.y * 0.5 + 0.5) * this.h, z: p.z };
  }

  render(_, delta) {
    if (!this.ready || document.hidden) return;
    const dt = Math.min(delta || 16, 60) / 1000;
    const still = env.reduced;
    if (!still) this.time += dt;

    // pointer
    const p = this.pointer;
    const k = 1 - Math.exp(-dt * 6);
    p.x = lerp(p.x, p.tx, k);
    p.y = lerp(p.y, p.ty, k);
    const moved = Math.hypot(p.tx - p.px, p.ty - p.py) / Math.max(dt, 0.001);
    p.px = p.tx;
    p.py = p.ty;
    p.speed = lerp(p.speed, Math.min(moved, 6), 0.08);

    // globe: inertia after a drag, then a slow idle turn â€” unless something asked it to hold still
    if (!this.spin.active && !still) {
      this.spin.yaw += this.spin.vy;
      this.spin.vy *= 0.94;
      if (!this.spin.focused) {
        this.spin.yaw += this.spin.auto * dt;
        this.spin.tilt = lerp(this.spin.tilt, 0, 0.012);
      }
    }

    // where on the timeline are we?
    let target = 1;
    for (const tr of this.triggers) target += tr.progress;
    target *= this.intro.t;
    this.P = still || !this.intro.done ? target : lerp(this.P, target, 1 - Math.exp(-dt * 4.6));

    const last = this.stops.length - 1;
    const i = clamp(Math.floor(this.P), 0, Math.max(0, last - 1));
    const t = last === 0 ? 0 : clamp(this.P - i, 0, 1);
    const A = this.stops[i];
    const B = this.stops[Math.min(i + 1, last)];

    if (this.pair[0] !== i) {
      this.pair = [i, i + 1];
      this.aFrom.array.set(this.buffers[A.shape]);
      this.aTo.array.set(this.buffers[B.shape]);
      this.aFrom.needsUpdate = true;
      this.aTo.needsUpdate = true;
    }

    const live = (t > 0.5 ? B : A).drag ? (t > 0.5 ? B : A) : B.drag ? B : A.drag ? A : null;
    this.live = live;
    this.spin.auto = live ? live.auto || 0 : 0;

    const a = this.place(A);
    const b = this.place(B);
    const u = this.uniforms;
    const e = t * t * (3 - 2 * t);

    u.uTime.value = this.time;
    u.uMix.value = t;
    u.uScaleA.value.set(...a.scale);
    u.uScaleB.value.set(...b.scale);
    u.uOffA.value.set(...a.off);
    u.uOffB.value.set(...b.off);
    u.uRotA.value.set(...a.rot);
    u.uRotB.value.set(...b.rot);
    u.uBackA.value = a.c.back;
    u.uBackB.value = b.c.back;
    u.uRed.value = lerp(a.c.red, b.c.red, e);
    u.uOpacity.value = lerp(a.c.alpha, b.c.alpha, e);
    u.uDrift.value = still ? 0 : lerp(a.c.drift, b.c.drift, e);
    u.uSize.value = lerp(a.c.point, b.c.point, e);
    u.uSwirl.value = still ? 0 : 0.85;

    p.wx = (p.x * this.viewW) / 2;
    p.wy = (p.y * this.viewH) / 2;
    u.uPointer.value.set(p.wx, p.wy);
    u.uPointerF.value = still || env.touch ? 0 : lerp(a.c.force, b.c.force, e) * (0.35 + Math.min(p.speed, 2.2) * 0.5);

    // gentle camera parallax
    if (!still) {
      this.camera.position.x = lerp(this.camera.position.x, p.x * 0.35, 0.05);
      this.camera.position.y = lerp(this.camera.position.y, p.y * 0.22, 0.05);
      this.camera.lookAt(0, 0, 0);
    }

    // placement arcs ride along with whichever neighbouring stop is a globe
    if (this.arcs) {
      const g = b.c.arcs ? b : a.c.arcs ? a : null;
      const presence = b.c.arcs && a.c.arcs ? 1 : b.c.arcs ? e : a.c.arcs ? 1 - e : 0;
      if (g) {
        this.arcs.group.position.set(...g.off);
        this.arcs.group.scale.setScalar(g.scale[0]);
        this.arcs.group.rotation.set(g.rot[1], g.rot[0], 0);
      }
      const solid = Math.pow(presence, 4);
      this.arcs.update(this.time, {
        opacity: solid * u.uOpacity.value,
        reveal: solid,
        scale: g ? clamp(g.scale[0] / 2.4, 0.5, 1.4) : 1,
      });
    }

    this.onFrame?.(this, { a, b, t: e });

    if (u.uOpacity.value < 0.004 && !(this.arcs && this.arcs.group.visible)) return;
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    gsap.ticker.remove(this.render);
    this.triggers.forEach((t) => t.kill());
    this.arcs?.dispose();
    this.points?.geometry.dispose();
    this.points?.material.dispose();
    this.renderer?.dispose();
  }
}

export const presets = { YAW_INDIA, TILT_INDIA };
