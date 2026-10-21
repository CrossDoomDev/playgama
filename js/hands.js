'use strict';

(function (G) {
  const WIDTH = 760;
  const HEIGHT = 330;
  const COLS = 32;
  const ROWS = 40;
  const NAMES = ['pinky', 'ring', 'middle', 'index', 'thumb'];
  const HOME = {
    'left-pinky': 'ф', 'left-ring': 'ы', 'left-middle': 'в', 'left-index': 'а',
    'right-index': 'о', 'right-middle': 'л', 'right-ring': 'д', 'right-pinky': 'ж',
    'left-thumb': ' ', 'right-thumb': ' '
  };
  // Landmarks belong to the continuous dorsal-hand textures, not separate sprites.
  // Coordinates are normalized inside the corresponding 768 x 1024 atlas half.
  const LEFT = {
    pinky: { tip: [.218, .207], base: [.255, .455], radius: .076 },
    ring: { tip: [.428, .087], base: [.355, .460], radius: .084 },
    middle: { tip: [.580, .063], base: [.490, .460], radius: .087 },
    index: { tip: [.731, .121], base: [.634, .453], radius: .091 },
    thumb: { tip: [.892, .380], base: [.660, .646], radius: .105 }
  };
  const rightLandmarks = Object.fromEntries(
    NAMES.map(name => [name, {
      tip: [1 - LEFT[name].tip[0], LEFT[name].tip[1]],
      base: [1 - LEFT[name].base[0], LEFT[name].base[1]],
      radius: LEFT[name].radius
    }])
  );

  const smooth = value => {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
  };
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const blend = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

  class HandRenderer {
    constructor(canvas, forceCanvas = false) {
      this.canvas = canvas;
      this.indices = [];
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const a = row * (COLS + 1) + col;
          const b = a + 1;
          const c = a + COLS + 1;
          this.indices.push(a, b, c, b, c + 1, c);
        }
      }
      this.gl = forceCanvas ? null : canvas.getContext('webgl', {
        alpha: true, antialias: true, premultipliedAlpha: true,
        preserveDrawingBuffer: true, powerPreference: 'low-power'
      });
      if (this.gl) this.initGL();
      else this.ctx = canvas.getContext('2d');
      this.resize();
    }

    resize() {
      const scale = this.canvas.parentElement.getBoundingClientRect().width / WIDTH || 1;
      const dpr = Math.min(2, window.devicePixelRatio || 1) * Math.max(1, scale);
      this.canvas.width = Math.round(WIDTH * dpr);
      this.canvas.height = Math.round(HEIGHT * dpr);
      this.pixelRatio = dpr;
      if (this.gl) this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    initGL() {
      const gl = this.gl;
      const compile = (type, source) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          throw new Error(gl.getShaderInfoLog(shader));
        }
        return shader;
      };
      const vertex = compile(gl.VERTEX_SHADER,
        'attribute vec2 a_position; attribute vec2 a_uv; varying vec2 v_uv;' +
        'void main(){gl_Position=vec4(a_position.x/380.0-1.0,1.0-a_position.y/165.0,0.0,1.0);v_uv=a_uv;}');
      const fragment = compile(gl.FRAGMENT_SHADER,
        'precision mediump float;uniform sampler2D u_texture;varying vec2 v_uv;' +
        'void main(){gl_FragColor=texture2D(u_texture,v_uv);}');
      this.program = gl.createProgram();
      gl.attachShader(this.program, vertex);
      gl.attachShader(this.program, fragment);
      gl.linkProgram(this.program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      gl.useProgram(this.program);
      this.buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      this.indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
      for (const [name, offset] of [['a_position', 0], ['a_uv', 8]]) {
        const location = gl.getAttribLocation(this.program, name);
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 16, offset);
      }
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
    }

    texture(image) {
      const surface = document.createElement('canvas');
      surface.width = 384;
      surface.height = 512;
      surface.getContext('2d').drawImage(image, 0, 0, 384, 512);
      if (!this.gl) return { image: surface };
      const gl = this.gl;
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, surface);
      return { texture, image: surface };
    }

    clear() {
      if (this.gl) this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      else {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }

    draw(data, texture) {
      if (this.gl) {
        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, texture.texture);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
        return;
      }
      // Canvas fallback uses the same continuous mesh and source texture.
      const ctx = this.ctx, ratio = this.pixelRatio, source = texture.image;
      for (let n = 0; n < this.indices.length; n += 3) {
        const points = this.indices.slice(n, n + 3).map(i => ({
          x: data[i * 4], y: data[i * 4 + 1],
          u: data[i * 4 + 2] * source.width, v: data[i * 4 + 3] * source.height
        }));
        const [p, q, r] = points;
        const determinant = p.u * (q.v - r.v) + q.u * (r.v - p.v) + r.u * (p.v - q.v);
        if (Math.abs(determinant) < .001) continue;
        const a = (p.x * (q.v - r.v) + q.x * (r.v - p.v) + r.x * (p.v - q.v)) / determinant;
        const b = (p.y * (q.v - r.v) + q.y * (r.v - p.v) + r.y * (p.v - q.v)) / determinant;
        const c = (p.x * (r.u - q.u) + q.x * (p.u - r.u) + r.x * (q.u - p.u)) / determinant;
        const d = (p.y * (r.u - q.u) + q.y * (p.u - r.u) + r.y * (q.u - p.u)) / determinant;
        const e = p.x - a * p.u - c * p.v;
        const f = p.y - b * p.u - d * p.v;
        ctx.save();
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.beginPath();
        const cx = (p.x + q.x + r.x) / 3, cy = (p.y + q.y + r.y) / 3;
        points.forEach((point, i) => {
          const len = Math.hypot(point.x - cx, point.y - cy) || 1;
          const x = point.x + (point.x - cx) / len * .35;
          const y = point.y + (point.y - cy) / len * .35;
          if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        });
        ctx.closePath();
        ctx.clip();
        ctx.setTransform(a * ratio, b * ratio, c * ratio, d * ratio, e * ratio, f * ratio);
        ctx.drawImage(source, 0, 0);
        ctx.restore();
      }
    }

    dispose(textures) {
      if (!this.gl) return;
      for (const texture of textures) if (texture?.texture) this.gl.deleteTexture(texture.texture);
      this.gl.deleteBuffer(this.buffer);
      this.gl.deleteBuffer(this.indexBuffer);
      this.gl.deleteProgram(this.program);
      this.gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  }

  G.Hands = class Hands {
    constructor(root, opacity, skinId = 'default') {
      this.skinId = G.HandMaterials?.valid(skinId) ? skinId : 'default';
      root.dataset.skin = this.skinId;
      root.dataset.ready = 'false';
      this.root = root;
      this.disposed = false;
      this.frame = null;
      this.keys = null;
      this.goals = new Map();
      this.presses = new Map();
      this.fingers = {};
      this.hands = [];
      this.root.innerHTML = '';
      this.root.classList.add('connected-hands');
      this.root.style.opacity = opacity;
      this.root.setAttribute('aria-hidden', 'true');
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'hand-surface';
      this.root.append(this.canvas);
      this.overlay = document.createElement('canvas');
      this.overlay.className = 'hand-highlights';
      this.overlay.width = WIDTH * 2;
      this.overlay.height = HEIGHT * 2;
      this.root.append(this.overlay);
      this.renderer = new HandRenderer(this.canvas, root.dataset.renderer === 'canvas');
      this.root.dataset.renderer = this.renderer.gl ? 'webgl' : 'canvas';
      for (const side of ['left', 'right']) {
        const landmarks = side === 'left' ? LEFT : rightLandmarks;
        const hand = { side, landmarks, shift: { x: 0, y: 0 }, ready: false };
        this.hands.push(hand);
        for (const name of NAMES) {
          this.fingers[side + '-' + name] = {
            name, hand, position: null, home: null, pulse: 0
          };
        }
        const applyMaterial = image => {
          if (this.disposed) return;
          hand.texture = this.renderer.texture(image);
          hand.ready = true;
          this.layout();
          this.wake();
        };
        const fallback = () => new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image); image.onerror = reject;
          const path = 'assets/hands/' + side + '-whole.webp';
          image.src = G.HandImageData?.[path] || path;
        });
        (G.HandMaterials ? G.HandMaterials.get(side, this.skinId) : fallback()).then(applyMaterial).catch(() => {
          if (this.disposed) return;
          this.root.dataset.assetError = side;
          this.root.dataset.skin = 'default';
          fallback().then(applyMaterial).catch(() => {});
        });
      }
      this.observer = new ResizeObserver(() => {
        if (!this.disposed) {
          this.renderer.resize();
          this.layout();
          this.wake();
        }
      });
      this.observer.observe(root.parentElement);
      this.onResize = () => {
        if (this.disposed) return;
        this.renderer.resize();
        this.layout();
        this.wake();
      };
      window.addEventListener('resize', this.onResize);
    }

    point(key, id) {
      if (!key) return null;
      const rect = key.getBoundingClientRect();
      const parent = this.root.getBoundingClientRect();
      const sx = parent.width / WIDTH || 1;
      const sy = parent.height / HEIGHT || 1;
      let x = (rect.left + rect.width / 2 - parent.left) / sx;
      const y = (rect.top + rect.height / 2 - parent.top) / sy;
      if (key.dataset.code === 'Space') {
        x += id.startsWith('left') ? -35 : 35;
      }
      return { x, y };
    }

    home(keys) {
      this.keys = keys;
      this.layout();
      this.wake();
    }

    layout() {
      if (!this.keys || this.disposed) return;
      for (const [id, char] of Object.entries(HOME)) {
        const finger = this.fingers[id];
        finger.home = this.point(this.keys[char], id);
        if (!finger.position) finger.position = { ...finger.home };
      }
      for (const hand of this.hands) {
        const pinky = this.fingers[hand.side + '-pinky'].home;
        const index = this.fingers[hand.side + '-index'].home;
        if (!pinky || !index) continue;
        const lp = hand.landmarks.pinky.tip;
        const li = hand.landmarks.index.tip;
        const width = (index.x - pinky.x) / (li[0] - lp[0]);
        const height = 235;
        const x = pinky.x - lp[0] * width;
        const y = pinky.y - .13 * height;
        hand.rect = { x, y, width, height };
        hand.vertices = [];
        for (let row = 0; row <= ROWS; row++) {
          for (let col = 0; col <= COLS; col++) {
            const u = col / COLS, v = row / ROWS;
            const weights = NAMES.map(name => {
              const bone = hand.landmarks[name];
              const dx = bone.tip[0] - bone.base[0];
              const dy = bone.tip[1] - bone.base[1];
              const length2 = dx * dx + dy * dy;
              const along = ((u - bone.base[0]) * dx + (v - bone.base[1]) * dy) / length2;
              const perpendicular = Math.abs((u - bone.base[0]) * dy - (v - bone.base[1]) * dx) / Math.sqrt(length2);
              const side = Math.max(0, 1 - Math.pow(perpendicular / bone.radius, 4));
              return smooth(along / .85) * side;
            });
            const sum = weights.reduce((a, b) => a + b, 0);
            if (sum > 1) weights.forEach((w, i) => weights[i] = w / sum);
            hand.vertices.push({ u, v, weights });
          }
        }
        hand.data = new Float32Array(hand.vertices.length * 4);
      }
    }

    target(id, key, keys, modifierTargets = []) {
      if (this.disposed) return;
      this.keys = keys;
      if (!this.hands[0].rect) this.layout();
      this.goals.clear();
      if (this.fingers[id] && key) this.goals.set(id, key);
      for (const modifier of modifierTargets) {
        if (this.fingers[modifier.id] && modifier.key) this.goals.set(modifier.id, modifier.key);
      }
      // Press impulses deliberately survive a next-character target in the same event.
      this.wake();
    }

    place(id, key, press) {
      if (!this.fingers[id] || !key || this.disposed) return;
      if (press) this.presses.set(id, { key, started: performance.now(), until: performance.now() + 145 });
      else this.goals.set(id, key);
      this.wake();
    }

    clear() {
      this.goals.clear();
      this.presses.clear();
      this.wake();
    }

    wake() {
      if (this.disposed || this.frame !== null) return;
      this.frame = requestAnimationFrame(time => this.animate(time));
    }

    animate(time) {
      this.frame = null;
      if (this.disposed || !this.root.isConnected) return;
      let moving = false;
      for (const [id, finger] of Object.entries(this.fingers)) {
        if (!finger.home) continue;
        const press = this.presses.get(id);
        if (press && time >= press.until) this.presses.delete(id);
        const currentPress = this.presses.get(id);
        const key = currentPress?.key || this.goals.get(id);
        const goal = key ? this.point(key, id) : finger.home;
        const pressProgress = currentPress ? (time - currentPress.started) / 145 : 0;
        finger.pulse = currentPress ? Math.sin(Math.max(0, Math.min(1, pressProgress)) * Math.PI) : 0;
        const desired = { x: goal.x, y: goal.y + finger.pulse * 4 };
        finger.position = blend(finger.position || desired, desired, currentPress ? .55 : .3);
        if (distance(finger.position, desired) > .15 || currentPress) moving = true;
      }
      for (const hand of this.hands) {
        if (!hand.rect) continue;
        const active = NAMES.map(name => hand.side + '-' + name)
          .filter(id => this.goals.has(id) || this.presses.has(id));
        let desiredShift = { x: 0, y: 0 };
        let leadDelta = null;
        let reachAllowance = 52;
        if (active.length) {
          // Let the whole wrist follow distant keys; do not stretch a single finger indefinitely.
          const lead = active.reduce((a, b) =>
            distance(this.fingers[a].position, this.fingers[a].home) >
            distance(this.fingers[b].position, this.fingers[b].home) ? a : b);
          const finger = this.fingers[lead];
          const delta = { x: finger.position.x - finger.home.x, y: finger.position.y - finger.home.y };
          const length = Math.hypot(delta.x, delta.y);
          reachAllowance = lead.endsWith('-pinky') ? 8 : 52;
          leadDelta = delta;
          const follow = length ? Math.max(.22, (length - reachAllowance) / length) : 0;
          desiredShift = { x: delta.x * follow, y: delta.y * follow };
        }
        hand.shift = blend(hand.shift, desiredShift, .3);
        // Limit actual residual after interpolation, including rapid press -> target changes.
        // Distant pinky keys are reached by the wrist, not a thin stretched finger.
        if (leadDelta && reachAllowance === 8) {
          const rx = leadDelta.x - hand.shift.x, ry = leadDelta.y - hand.shift.y;
          const residual = Math.hypot(rx, ry);
          if (residual > reachAllowance) {
            hand.shift = {
              x: leadDelta.x - rx * reachAllowance / residual,
              y: leadDelta.y - ry * reachAllowance / residual
            };
          }
        }
        if (distance(hand.shift, desiredShift) > .15) moving = true;
      }
      this.render();
      if (moving) this.wake();
    }

    deform(hand, u, v, weights) {
      const rect = hand.rect;
      let x = rect.x + u * rect.width + hand.shift.x;
      let y = rect.y + v * rect.height + hand.shift.y;
      NAMES.forEach((name, i) => {
        const finger = this.fingers[hand.side + '-' + name];
        const tip = hand.landmarks[name].tip;
        const rest = { x: rect.x + tip[0] * rect.width, y: rect.y + tip[1] * rect.height };
        const active = this.goals.has(hand.side + '-' + name) || this.presses.has(hand.side + '-' + name);
        // Resting fingers travel a little with the wrist instead of twisting their knuckles.
        const dx = active ? finger.position.x - rest.x - hand.shift.x : finger.home.x - rest.x;
        const dy = active ? finger.position.y - rest.y - hand.shift.y : finger.home.y - rest.y;
        x += dx * weights[i];
        y += dy * weights[i];
      });
      return { x, y };
    }

    render() {
      this.renderer.clear();
      for (const hand of this.hands) {
        if (!hand.ready || !hand.rect) continue;
        hand.vertices.forEach((vertex, i) => {
          const point = this.deform(hand, vertex.u, vertex.v, vertex.weights);
          hand.data[i * 4] = point.x;
          hand.data[i * 4 + 1] = point.y;
          hand.data[i * 4 + 2] = vertex.u;
          hand.data[i * 4 + 3] = vertex.v;
        });
        this.renderer.draw(hand.data, hand.texture);
      }
      const ctx = this.overlay.getContext('2d');
      ctx.setTransform(2, 0, 0, 2, 0, 0);
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      for (const [id, finger] of Object.entries(this.fingers)) {
        if (!finger.position || (!this.goals.has(id) && !this.presses.has(id))) continue;
        const { x, y } = finger.position;
        const glow = ctx.createRadialGradient(x, y, 1, x, y, 14);
        glow.addColorStop(0, 'rgba(173,255,198,.4)');
        glow.addColorStop(1, 'rgba(120,255,176,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.ellipse(x, y, 14, 11, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      this.root.dataset.ready = String(this.hands.every(hand => hand.ready));
    }

    dispose() {
      if (this.disposed) return;
      this.disposed = true;
      if (this.frame !== null) cancelAnimationFrame(this.frame);
      this.frame = null;
      this.observer.disconnect();
      window.removeEventListener('resize', this.onResize);
      this.renderer.dispose(this.hands.map(hand => hand.texture));
      this.root.replaceChildren();
    }
  };
})(EditorGame);
