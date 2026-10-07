import * as THREE from 'three';
import { latLon } from './shapes.js';

const SEGMENTS = 56;
const RED = [0.0, 0.8, 1.0];
const HOT = [0.22, 0.95, 1.0];

const slerp = (a, b, t) => {
  const dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const om = Math.acos(dot);
  if (om < 1e-5) return [...a];
  const so = Math.sin(om);
  const p = Math.sin((1 - t) * om) / so;
  const q = Math.sin(t * om) / so;
  return [a[0] * p + b[0] * q, a[1] * p + b[1] * q, a[2] * p + b[2] * q];
};

/**
 * Placement arcs: great-circle routes from wayand to every destination,
 * plus pulsing markers. Lives in unit-sphere space inside a Group that the
 * stage keeps aligned with the particle globe.
 */
export class Arcs {
  constructor({ origin, destinations, pixelRatio = 1 }) {
    this.group = new THREE.Group();
    this.group.rotation.order = 'XYZ';
    this.destinations = destinations;

    const o = latLon(origin.lat, origin.lon);
    const pos = [];
    const ts = [];
    const seeds = [];

    destinations.forEach((d, i) => {
      const e = latLon(d.lat, d.lon);
      const ang = Math.acos(Math.min(1, Math.max(-1, o[0] * e[0] + o[1] * e[1] + o[2] * e[2])));
      const lift = 0.04 + Math.min(0.42, ang * 0.2);
      const seed = (i * 0.618034) % 1;
      let prev = null;
      for (let s = 0; s <= SEGMENTS; s++) {
        const t = s / SEGMENTS;
        const p = slerp(o, e, t);
        const r = 1.003 + Math.sin(Math.PI * t) * lift;
        const cur = [p[0] * r, p[1] * r, p[2] * r, t];
        if (prev) {
          pos.push(prev[0], prev[1], prev[2], cur[0], cur[1], cur[2]);
          ts.push(prev[3], cur[3]);
          seeds.push(seed, seed);
        }
        prev = cur;
      }
    });

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    lineGeo.setAttribute('aT', new THREE.Float32BufferAttribute(ts, 1));
    lineGeo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 1));

    this.uniforms = {
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uOpacity: { value: 0 },
      uPixelRatio: { value: pixelRatio },
      uScale: { value: 1 },
    };

    this.lines = new THREE.LineSegments(
      lineGeo,
      new THREE.ShaderMaterial({
        uniforms: this.uniforms,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */ `
          attribute float aT;
          attribute float aSeed;
          varying float vT;
          varying float vSeed;
          varying float vFace;
          void main() {
            vT = aT;
            vSeed = aSeed;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vFace = normalize(mat3(modelViewMatrix) * normalize(position)).z;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          uniform float uReveal;
          uniform float uOpacity;
          varying float vT;
          varying float vSeed;
          varying float vFace;
          void main() {
            float reveal = clamp(uReveal * 1.7 - vSeed * 0.7, 0.0, 1.0);
            if (vT > reveal) discard;
            float head = fract(uTime * 0.13 + vSeed * 3.7);
            float d = head - vT;
            float pulse = (d > 0.0 && d < 0.34) ? pow(1.0 - d / 0.34, 2.2) : 0.0;
            float face = smoothstep(-0.4, 0.12, vFace);
            float a = (0.2 + pulse * 0.95) * face * uOpacity;
            vec3 col = mix(vec3(${RED.join(',')}), vec3(${HOT.join(',')}), pulse * 0.75);
            gl_FragColor = vec4(col, a);
          }
        `,
      }),
    );
    this.lines.frustumCulled = false;

    // markers: destinations + the origin (last, larger)
    const mPos = [];
    const mSeed = [];
    const mSize = [];
    destinations.forEach((d, i) => {
      mPos.push(...latLon(d.lat, d.lon, 1.006));
      mSeed.push((i * 0.618034) % 1);
      mSize.push(1);
    });
    mPos.push(...latLon(origin.lat, origin.lon, 1.008));
    mSeed.push(0);
    mSize.push(2.1);

    const markGeo = new THREE.BufferGeometry();
    markGeo.setAttribute('position', new THREE.Float32BufferAttribute(mPos, 3));
    markGeo.setAttribute('aSeed', new THREE.Float32BufferAttribute(mSeed, 1));
    markGeo.setAttribute('aSize', new THREE.Float32BufferAttribute(mSize, 1));

    this.marks = new THREE.Points(
      markGeo,
      new THREE.ShaderMaterial({
        uniforms: this.uniforms,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */ `
          uniform float uPixelRatio;
          uniform float uScale;
          uniform float uReveal;
          attribute float aSeed;
          attribute float aSize;
          varying float vSeed;
          varying float vFace;
          varying float vSize;
          void main() {
            vSeed = aSeed;
            vSize = aSize;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vFace = normalize(mat3(modelViewMatrix) * normalize(position)).z;
            float on = aSize > 1.5 ? 1.0 : smoothstep(0.0, 0.12, uReveal * 1.7 - aSeed * 0.7 - 0.88);
            gl_PointSize = 26.0 * aSize * uPixelRatio * uScale * (10.0 / -mv.z) * on;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          uniform float uOpacity;
          varying float vSeed;
          varying float vFace;
          varying float vSize;
          void main() {
            vec2 uv = gl_PointCoord - 0.5;
            float d = length(uv) * 2.0;
            float core = smoothstep(0.26, 0.1, d);
            float t = fract(uTime * 0.45 + vSeed * 5.0);
            float ringR = mix(0.2, 0.98, t);
            float ring = smoothstep(0.09, 0.0, abs(d - ringR)) * (1.0 - t);
            float face = smoothstep(-0.3, 0.15, vFace);
            vec3 col = vSize > 1.5 ? vec3(${HOT.join(',')}) : vec3(${RED.join(',')});
            float a = (core + ring * 0.8) * face * uOpacity;
            if (a < 0.01) discard;
            gl_FragColor = vec4(col * (1.0 + core * 0.6), a);
          }
        `,
      }),
    );
    this.marks.frustumCulled = false;

    this.group.add(this.lines, this.marks);
    this.group.visible = false;
  }

  /** World position of a destination (or the origin with index -1), for HTML labels. */
  worldOf(index, target = new THREE.Vector3()) {
    const attr = this.marks.geometry.getAttribute('position');
    const i = index < 0 ? attr.count - 1 : index;
    target.fromBufferAttribute(attr, i);
    return this.group.localToWorld(target);
  }

  /** > 0 when the marker is on the side of the globe that faces the camera. */
  facing(index, camera) {
    const p = this.worldOf(index, this._p || (this._p = new THREE.Vector3()));
    const n = (this._n || (this._n = new THREE.Vector3())).copy(p).sub(this.group.position).normalize();
    const v = (this._v || (this._v = new THREE.Vector3())).copy(camera.position).sub(p).normalize();
    return n.dot(v);
  }

  update(time, { opacity, reveal, scale }) {
    this.uniforms.uTime.value = time;
    this.uniforms.uOpacity.value = opacity;
    this.uniforms.uReveal.value = reveal;
    this.uniforms.uScale.value = scale;
    this.group.visible = opacity > 0.004;
  }

  dispose() {
    this.lines.geometry.dispose();
    this.lines.material.dispose();
    this.marks.geometry.dispose();
    this.marks.material.dispose();
  }
}
