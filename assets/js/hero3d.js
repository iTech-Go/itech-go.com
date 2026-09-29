/* iTech-Go — 3D hero: animated node network (Three.js, loaded from CDN).
   Loads when WebGL is available; under prefers-reduced-motion it renders a single static frame.
   Renders behind the hero content as a transparent layer. */
(async function () {
  'use strict';
  var hero = document.querySelector('.hero');
  if (!hero) return;
  var STILL = window.matchMedia('(prefers-reduced-motion: reduce)').matches; // reduced motion: render one static frame
  var probe = document.createElement('canvas');
  if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) return;

  var THREE;
  try {
    THREE = await import('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js');
  } catch (e) { return; }

  var wrap = document.createElement('div');
  wrap.className = 'hero-3d';
  wrap.setAttribute('aria-hidden', 'true');
  hero.insertBefore(wrap, hero.firstChild);

  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 900 ? 1.5 : 2)); // lighter on phones
  renderer.setClearColor(0x000000, 0);
  wrap.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  function themeColors() {
    var light = document.documentElement.getAttribute('data-theme') === 'light';
    return {
      a: new THREE.Color(0x3B5BFF),
      b: new THREE.Color(0x22D3EE),
      line: light ? 0x3B5BFF : 0x8FB3FF,
      lineOpacity: light ? 0.16 : 0.22,
      pointOpacity: light ? 0.85 : 0.95
    };
  }
  var colors = themeColors();

  // ---- Nodes on a slowly rotating sphere shell + inner cloud -------------
  var COUNT = 220;
  var positions = new Float32Array(COUNT * 3);
  var colorArr = new Float32Array(COUNT * 3);
  var sizes = new Float32Array(COUNT);
  var pts = [];
  for (var i = 0; i < COUNT; i++) {
    var shell = i < 150;
    var r = shell ? 3.2 + Math.random() * 0.25 : Math.random() * 2.2;
    var theta = Math.random() * Math.PI * 2;
    var phi = Math.acos(2 * Math.random() - 1);
    var x = r * Math.sin(phi) * Math.cos(theta);
    var y = r * Math.sin(phi) * Math.sin(theta);
    var z = r * Math.cos(phi);
    positions.set([x, y, z], i * 3);
    pts.push(new THREE.Vector3(x, y, z));
    var c = colors.a.clone().lerp(colors.b, Math.random());
    colorArr.set([c.r, c.g, c.b], i * 3);
    sizes[i] = shell ? 0.06 + Math.random() * 0.05 : 0.04 + Math.random() * 0.04;
  }
  var geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colorArr, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  var pointMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uOpacity: { value: colors.pointOpacity }, uPixelRatio: { value: renderer.getPixelRatio() } },
    vertexShader: [
      'attribute float size; attribute vec3 color; varying vec3 vColor; uniform float uPixelRatio;',
      'void main(){ vColor = color; vec4 mv = modelViewMatrix * vec4(position,1.0);',
      ' gl_PointSize = size * uPixelRatio * (300.0 / -mv.z); gl_Position = projectionMatrix * mv; }'
    ].join('\n'),
    fragmentShader: [
      'varying vec3 vColor; uniform float uOpacity;',
      'void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;',
      ' float a = smoothstep(0.5, 0.15, d) * uOpacity; gl_FragColor = vec4(vColor, a); }'
    ].join('\n')
  });
  var points = new THREE.Points(geo, pointMat);

  // ---- Connections between near neighbours ------------------------------
  var linePos = [];
  for (var a = 0; a < COUNT; a++) {
    var links = 0;
    for (var b = a + 1; b < COUNT && links < 3; b++) {
      if (pts[a].distanceTo(pts[b]) < 1.05) { linePos.push(pts[a].x, pts[a].y, pts[a].z, pts[b].x, pts[b].y, pts[b].z); links++; }
    }
  }
  var lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
  var lineMat = new THREE.LineBasicMaterial({ color: colors.line, transparent: true, opacity: colors.lineOpacity });
  var lines = new THREE.LineSegments(lineGeo, lineMat);

  // ---- Core: wireframe icosahedron with glow -----------------------------
  var core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.15, 1),
    new THREE.MeshBasicMaterial({ color: colors.b, wireframe: true, transparent: true, opacity: 0.35 })
  );
  var coreInner = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.75, 2),
    new THREE.MeshBasicMaterial({ color: colors.a, wireframe: true, transparent: true, opacity: 0.25 })
  );

  // ---- Travelling pulses along random edges ------------------------------
  var PULSES = 18;
  var pulseGeo = new THREE.BufferGeometry();
  var pulsePos = new Float32Array(PULSES * 3);
  pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePos, 3));
  var pulseMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, transparent: true, opacity: 0.9, sizeAttenuation: true, depthWrite: false });
  var pulses = new THREE.Points(pulseGeo, pulseMat);
  var segCount = linePos.length / 6;
  var pulseState = [];
  for (var p = 0; p < PULSES; p++) pulseState.push({ seg: Math.floor(Math.random() * segCount), t: Math.random(), speed: 0.4 + Math.random() * 0.6 });

  var group = new THREE.Group();
  group.add(points, lines, core, coreInner, pulses);
  group.position.x = 2.6; // sit to the right of the headline on desktop
  scene.add(group);

  // ---- Interaction ---------------------------------------------------------
  var target = { x: 0, y: 0 }, current = { x: 0, y: 0 };
  window.addEventListener('pointermove', function (e) {
    target.x = (e.clientX / window.innerWidth - 0.5) * 0.6;
    target.y = (e.clientY / window.innerHeight - 0.5) * 0.4;
  }, { passive: true });

  function resize() {
    var w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    group.position.x = w > 1100 ? 2.6 : (w > 900 ? 1.8 : 0);
  }
  resize();
  window.addEventListener('resize', resize);

  new MutationObserver(function () {
    colors = themeColors();
    lineMat.color.setHex(colors.line); lineMat.opacity = colors.lineOpacity;
    pointMat.uniforms.uOpacity.value = colors.pointOpacity;
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  var visible = true;
  new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(hero);

  var clock = new THREE.Clock();
  function frame() {
    if (!STILL) requestAnimationFrame(frame);
    if (!STILL && (!visible || document.hidden)) return;
    var dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    current.x += (target.x - current.x) * 0.05; current.y += (target.y - current.y) * 0.05;
    group.rotation.y = t * 0.08 + current.x;
    group.rotation.x = Math.sin(t * 0.15) * 0.12 + current.y;
    core.rotation.y = -t * 0.3; core.rotation.z = t * 0.12;
    coreInner.rotation.x = t * 0.5; coreInner.rotation.y = -t * 0.25;
    var s = 1 + Math.sin(t * 1.6) * 0.04; core.scale.setScalar(s);
    for (var i = 0; i < PULSES; i++) {
      var ps = pulseState[i]; ps.t += dt * ps.speed;
      if (ps.t > 1) { ps.t = 0; ps.seg = Math.floor(Math.random() * segCount); }
      var o = ps.seg * 6;
      pulsePos[i * 3] = linePos[o] + (linePos[o + 3] - linePos[o]) * ps.t;
      pulsePos[i * 3 + 1] = linePos[o + 1] + (linePos[o + 4] - linePos[o + 1]) * ps.t;
      pulsePos[i * 3 + 2] = linePos[o + 2] + (linePos[o + 5] - linePos[o + 2]) * ps.t;
    }
    pulseGeo.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
  }
  if (STILL) { group.rotation.y = 0.6; group.rotation.x = 0.15; }
  frame();
  hero.classList.add('has-3d');
})();
