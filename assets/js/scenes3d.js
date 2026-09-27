/* iTech-Go — per-page 3D hero scenes (Three.js from CDN).
   Usage: <section class="page-hero" data-scene="rings|layers|globe|helix|particles|knot|cubes|waves">
   Guards: WebGL available, viewport >= 700px, no prefers-reduced-motion. */
(async function () {
  'use strict';
  var hero = document.querySelector('.page-hero[data-scene]');
  if (!hero) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.innerWidth < 700) return;
  var probe = document.createElement('canvas');
  if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) return;

  var THREE;
  try { THREE = await import('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js'); } catch (e) { return; }

  var wrap = document.createElement('div');
  wrap.className = 'hero-3d';
  wrap.setAttribute('aria-hidden', 'true');
  hero.insertBefore(wrap, hero.firstChild);

  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  wrap.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 10);
  var group = new THREE.Group();
  scene.add(group);

  var BRAND = 0x3B5BFF, CYAN = 0x22D3EE;
  function isLight() { return document.documentElement.getAttribute('data-theme') === 'light'; }
  function op(dark, light) { return isLight() ? light : dark; }
  var mats = []; // {mat, dark, light}
  function M(color, opacity, opts) {
    var m = new THREE.MeshBasicMaterial(Object.assign({ color: color, transparent: true, opacity: opacity, depthWrite: false }, opts || {}));
    return m;
  }
  function L(color, dark, light) {
    var m = new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: op(dark, light) });
    mats.push({ mat: m, dark: dark, light: light }); return m;
  }
  function P(color, size, dark, light) {
    var m = new THREE.PointsMaterial({ color: color, size: size, transparent: true, opacity: op(dark, light), sizeAttenuation: true, depthWrite: false });
    mats.push({ mat: m, dark: dark, light: light }); return m;
  }
  function W(color, dark, light) {
    var m = M(color, op(dark, light), { wireframe: true });
    mats.push({ mat: m, dark: dark, light: light }); return m;
  }
  function pointsFrom(arr, mat) {
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); return new THREE.Points(g, mat);
  }

  var update = function () {};
  var name = hero.getAttribute('data-scene');

  // ---------------------------------------------------------------- scenes
  var scenes = {
    /* Agents orbiting an orchestrator: tilted rings with satellites */
    rings: function () {
      var core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 1), W(CYAN, 0.45, 0.5));
      group.add(core);
      var sats = [];
      for (var i = 0; i < 4; i++) {
        var ring = new THREE.Group();
        ring.rotation.x = (i * 0.55) - 0.6; ring.rotation.y = i * 0.9;
        var r = 2.2 + i * 0.75;
        var pts = [];
        for (var a = 0; a <= 128; a++) { var t = a / 128 * Math.PI * 2; pts.push(Math.cos(t) * r, Math.sin(t) * r, 0); }
        var line = new THREE.Line(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)), L(i % 2 ? BRAND : CYAN, 0.35, 0.3));
        ring.add(line);
        var n = 2 + i;
        for (var k = 0; k < n; k++) {
          var s = new THREE.Mesh(new THREE.OctahedronGeometry(0.16 + i * 0.03, 0), W(k % 2 ? CYAN : BRAND, 0.9, 0.85));
          s.userData = { r: r, a: (k / n) * Math.PI * 2, sp: 0.35 / (1 + i * 0.4) };
          ring.add(s); sats.push(s);
        }
        ring.userData.spin = 0.05 * (i % 2 ? -1 : 1);
        group.add(ring);
      }
      update = function (t, dt) {
        core.rotation.y = t * 0.3; core.rotation.x = t * 0.15;
        group.children.forEach(function (r) { if (r.userData.spin) r.rotation.z += dt * r.userData.spin; });
        sats.forEach(function (s) { s.userData.a += dt * s.userData.sp; s.position.set(Math.cos(s.userData.a) * s.userData.r, Math.sin(s.userData.a) * s.userData.r, 0); s.rotation.x += dt; s.rotation.y += dt * 0.7; });
      };
    },

    /* Platform layers: stacked translucent slabs with a grid */
    layers: function () {
      var n = 5;
      for (var i = 0; i < n; i++) {
        var y = (i - (n - 1) / 2) * 1.1;
        var slab = new THREE.Mesh(new THREE.BoxGeometry(5.5 - i * 0.35, 0.12, 3.6 - i * 0.2), M(i % 2 ? BRAND : CYAN, op(0.12, 0.1)));
        mats.push({ mat: slab.material, dark: 0.12, light: 0.1 });
        slab.position.y = y;
        var edge = new THREE.LineSegments(new THREE.EdgesGeometry(slab.geometry), L(i % 2 ? CYAN : BRAND, 0.7, 0.6));
        edge.position.y = y;
        group.add(slab, edge);
        var grid = new THREE.GridHelper(3.2 - i * 0.2, 6, i % 2 ? CYAN : BRAND, i % 2 ? CYAN : BRAND);
        grid.material.transparent = true; grid.material.opacity = op(0.25, 0.2); mats.push({ mat: grid.material, dark: 0.25, light: 0.2 });
        grid.position.y = y + 0.07; grid.scale.x = 1.6; group.add(grid);
      }
      var dots = [];
      for (var d = 0; d < 120; d++) dots.push((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6.5, (Math.random() - 0.5) * 4);
      var pts = pointsFrom(dots, P(CYAN, 0.06, 0.8, 0.7)); group.add(pts);
      group.rotation.x = 0.45; group.rotation.y = -0.6;
      update = function (t) { group.rotation.y = -0.6 + Math.sin(t * 0.25) * 0.25; group.position.y = Math.sin(t * 0.6) * 0.15; pts.rotation.y = t * 0.05; };
    },

    /* Globe: wireframe sphere with dotted surface and arcs */
    globe: function () {
      var R = 3;
      group.add(new THREE.Mesh(new THREE.SphereGeometry(R, 24, 16), W(BRAND, 0.18, 0.16)));
      var dots = [];
      for (var i = 0; i < 900; i++) { var u = Math.random(), v = Math.random(); var th = 2 * Math.PI * u, ph = Math.acos(2 * v - 1); dots.push(R * Math.sin(ph) * Math.cos(th), R * Math.sin(ph) * Math.sin(th), R * Math.cos(ph)); }
      group.add(pointsFrom(dots, P(CYAN, 0.05, 0.9, 0.8)));
      // arcs between random points
      var arcMat = L(CYAN, 0.6, 0.5);
      for (var a = 0; a < 14; a++) {
        var p1 = new THREE.Vector3().randomDirection().multiplyScalar(R), p2 = new THREE.Vector3().randomDirection().multiplyScalar(R);
        var mid = p1.clone().add(p2).multiplyScalar(0.5).normalize().multiplyScalar(R * 1.35);
        var curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(40)), arcMat));
      }
      var halo = new THREE.Mesh(new THREE.RingGeometry(R * 1.15, R * 1.17, 96), M(CYAN, op(0.35, 0.3), { side: THREE.DoubleSide }));
      mats.push({ mat: halo.material, dark: 0.35, light: 0.3 }); halo.rotation.x = 1.2; group.add(halo);
      group.rotation.x = 0.35;
      update = function (t) { group.rotation.y = t * 0.12; halo.rotation.z = t * 0.2; };
    },

    /* Helix: two spirals of nodes climbing (phases of an engagement) */
    helix: function () {
      var a1 = [], a2 = [], N = 80;
      for (var i = 0; i < N; i++) {
        var y = (i / N - 0.5) * 8, ang = i * 0.28;
        a1.push(Math.cos(ang) * 1.6, y, Math.sin(ang) * 1.6);
        a2.push(Math.cos(ang + Math.PI) * 1.6, y, Math.sin(ang + Math.PI) * 1.6);
      }
      var s1 = pointsFrom(a1, P(BRAND, 0.14, 0.95, 0.85)), s2 = pointsFrom(a2, P(CYAN, 0.14, 0.95, 0.85));
      var rungs = [];
      for (var k = 0; k < N; k += 4) rungs.push(a1[k * 3], a1[k * 3 + 1], a1[k * 3 + 2], a2[k * 3], a2[k * 3 + 1], a2[k * 3 + 2]);
      var seg = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(rungs, 3)), L(CYAN, 0.35, 0.3));
      var l1 = new THREE.Line(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(a1, 3)), L(BRAND, 0.5, 0.4));
      var l2 = new THREE.Line(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(a2, 3)), L(CYAN, 0.5, 0.4));
      group.add(s1, s2, seg, l1, l2);
      group.rotation.z = 0.35;
      update = function (t) { group.rotation.y = t * 0.35; group.position.y = Math.sin(t * 0.5) * 0.2; };
    },

    /* Particles: slow knowledge cloud with drifting depth */
    particles: function () {
      var N = 700, arr = new Float32Array(N * 3), vel = [];
      for (var i = 0; i < N; i++) { arr[i * 3] = (Math.random() - 0.5) * 16; arr[i * 3 + 1] = (Math.random() - 0.5) * 8; arr[i * 3 + 2] = (Math.random() - 0.5) * 6; vel.push(0.1 + Math.random() * 0.25); }
      var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
      var p1 = new THREE.Points(g, P(CYAN, 0.07, 0.85, 0.7));
      var g2 = g.clone(); var p2 = new THREE.Points(g2, P(BRAND, 0.12, 0.35, 0.3)); p2.scale.setScalar(1.05);
      group.add(p1, p2);
      update = function (t, dt) {
        var a = g.attributes.position.array;
        for (var i = 0; i < N; i++) { a[i * 3 + 1] += dt * vel[i] * 0.3; if (a[i * 3 + 1] > 4) a[i * 3 + 1] = -4; a[i * 3] += Math.sin(t * 0.3 + i) * dt * 0.05; }
        g.attributes.position.needsUpdate = true; group.rotation.y = Math.sin(t * 0.1) * 0.15;
      };
    },

    /* Knot: wireframe torus knot, slow tumble */
    knot: function () {
      var k = new THREE.Mesh(new THREE.TorusKnotGeometry(1.9, 0.5, 220, 20, 2, 3), W(CYAN, 0.16, 0.14));
      var k2 = new THREE.Mesh(new THREE.TorusKnotGeometry(1.9, 0.5, 90, 8, 2, 3), W(BRAND, 0.3, 0.28));
      var dots = [];
      for (var i = 0; i < 160; i++) dots.push((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 7, (Math.random() - 0.5) * 6);
      group.add(k, k2, pointsFrom(dots, P(CYAN, 0.05, 0.7, 0.6)));
      update = function (t) { group.rotation.x = t * 0.2; group.rotation.y = t * 0.3; };
    },

    /* Cubes: isometric field of cubes rising in a wave */
    cubes: function () {
      var cubes = [], n = 8;
      var geo = new THREE.BoxGeometry(0.42, 0.42, 0.42), edges = new THREE.EdgesGeometry(geo);
      for (var x = 0; x < n; x++) for (var z = 0; z < n; z++) {
        var c = new THREE.LineSegments(edges, L((x + z) % 2 ? CYAN : BRAND, 0.75, 0.6));
        c.position.set((x - n / 2) * 0.58, 0, (z - n / 2) * 0.58);
        c.userData = { x: x, z: z }; group.add(c); cubes.push(c);
      }
      group.rotation.x = 0.6; group.rotation.y = 0.78;
      update = function (t) { cubes.forEach(function (c) { var h = Math.sin(t * 1.4 + c.userData.x * 0.6 + c.userData.z * 0.45); c.position.y = h * 0.45; c.scale.y = 1 + h * 0.4; }); group.rotation.y = 0.78 + Math.sin(t * 0.2) * 0.15; };
    },

    /* Waves: undulating wireframe plane */
    waves: function () {
      var g = new THREE.PlaneGeometry(16, 9, 48, 27);
      var mesh = new THREE.Mesh(g, W(BRAND, 0.22, 0.2));
      var pts = new THREE.Points(g, P(CYAN, 0.06, 0.8, 0.7));
      group.add(mesh, pts); group.rotation.x = -1.05; group.position.y = -1.5;
      var base = g.attributes.position.array.slice();
      update = function (t) {
        var a = g.attributes.position.array;
        for (var i = 0; i < a.length; i += 3) a[i + 2] = Math.sin(base[i] * 0.6 + t) * 0.35 + Math.cos(base[i + 1] * 0.8 + t * 0.8) * 0.35;
        g.attributes.position.needsUpdate = true;
      };
    }
  };
  (scenes[name] || scenes.particles)();

  // ---------------------------------------------------------------- runtime
  var target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  window.addEventListener('pointermove', function (e) { target.x = (e.clientX / window.innerWidth - 0.5) * 0.4; target.y = (e.clientY / window.innerHeight - 0.5) * 0.25; }, { passive: true });

  function resize() {
    var w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    group.position.x = name === 'waves' || name === 'particles' ? 0 : (w > 1100 ? 4.6 : (w > 900 ? 3.2 : 0));
    group.scale.setScalar(name === 'waves' || name === 'particles' ? 1 : (w > 1100 ? 0.9 : 0.75));
  }
  resize(); window.addEventListener('resize', resize);

  new MutationObserver(function () { mats.forEach(function (m) { m.mat.opacity = op(m.dark, m.light); }); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  var visible = true;
  new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(hero);

  var clock = new THREE.Clock();
  (function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    var dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    cur.x += (target.x - cur.x) * 0.05; cur.y += (target.y - cur.y) * 0.05;
    scene.rotation.y = cur.x; scene.rotation.x = cur.y;
    update(t, dt);
    renderer.render(scene, camera);
  })();
  hero.classList.add('has-3d');
})();
