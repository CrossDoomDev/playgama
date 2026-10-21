'use strict';
(function (G) {
  const cache = new Map();
  const WIDTH = 384, HEIGHT = 512;
  const load = src => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Hand material could not load: ' + src));
    image.src = G.HandImageData?.[src] || src;
  });
  const surface = () => {
    const canvas = document.createElement('canvas');
    canvas.width = WIDTH; canvas.height = HEIGHT;
    return canvas;
  };

  function compose(material, silhouette) {
    const canvas = surface(), ctx = canvas.getContext('2d', {willReadFrequently:true});
    const mask = surface(), maskContext = mask.getContext('2d', {willReadFrequently:true});
    ctx.drawImage(material, 0, 0, WIDTH, HEIGHT);
    maskContext.drawImage(silhouette, 0, 0, WIDTH, HEIGHT);
    const pixels = ctx.getImageData(0, 0, WIDTH, HEIGHT);
    const alpha = maskContext.getImageData(0, 0, WIDTH, HEIGHT).data;
    const data = pixels.data, count = WIDTH * HEIGHT;
    const background = new Uint8Array(count), queue = new Int32Array(count);
    let head = 0, tail = 0;
    const neutral = i => {
      const p = i * 4, low = Math.min(data[p], data[p+1], data[p+2]), high = Math.max(data[p], data[p+1], data[p+2]);
      return data[p+3] < 10 || (low >= 170 && high - low <= 18);
    };
    const visit = i => {
      if (!background[i] && neutral(i)) { background[i] = 1; queue[tail++] = i; }
    };
    for (let x = 0; x < WIDTH; x++) { visit(x); visit((HEIGHT-1)*WIDTH+x); }
    for (let y = 1; y < HEIGHT-1; y++) { visit(y*WIDTH); visit(y*WIDTH+WIDTH-1); }
    while (head < tail) {
      const i = queue[head++], x = i % WIDTH;
      if (x) visit(i-1); if (x < WIDTH-1) visit(i+1);
      if (i >= WIDTH) visit(i-WIDTH); if (i < count-WIDTH) visit(i+WIDTH);
    }
    // Extend material edge colors beneath the original connected hand silhouette.
    // This removes the baked matte without shrinking fingers or changing their anchors.
    const nearest = new Int32Array(count); nearest.fill(-1);
    head = 0; tail = 0;
    for (let i = 0; i < count; i++) if (!background[i]) { nearest[i] = i; queue[tail++] = i; }
    if (!tail) throw new Error('Hand material has no foreground.');
    const spread = (to, from) => {
      if (nearest[to] < 0) { nearest[to] = nearest[from]; queue[tail++] = to; }
    };
    while (head < tail) {
      const i = queue[head++], x = i % WIDTH;
      if (x) spread(i-1,i); if (x < WIDTH-1) spread(i+1,i);
      if (i >= WIDTH) spread(i-WIDTH,i); if (i < count-WIDTH) spread(i+WIDTH,i);
    }
    for (let i = 0; i < count; i++) {
      const p = i*4;
      if (background[i] && alpha[p+3]) {
        const from = nearest[i]*4;
        data[p] = data[from]; data[p+1] = data[from+1]; data[p+2] = data[from+2];
      }
      data[p+3] = alpha[p+3];
    }
    ctx.putImageData(pixels, 0, 0);
    return canvas;
  }

  G.HandMaterials = {
    valid(id) { return id === 'default' || !!G.data.handSkins?.some(item => item.id === id); },
    get(side, id = 'default') {
      if (!['left','right'].includes(side)) return Promise.reject(new Error('Unknown hand side.'));
      if (!this.valid(id)) id = 'default';
      const key = id + ':' + side;
      if (!cache.has(key)) {
        const base = 'assets/hands/' + side + '-whole.webp';
        const promise = id === 'default' ? load(base) : Promise.all([
          load('assets/hands/skins/' + id + '/' + side + '.webp'), load(base)
        ]).then(([material, mask]) => compose(material, mask));
        cache.set(key, promise);
        promise.catch(() => cache.delete(key));
      }
      return cache.get(key);
    },
    preview(root) {
      for (const image of root.querySelectorAll('img[data-hand-skin]')) {
        this.get(image.dataset.side, image.dataset.handSkin).then(material => {
          if (!image.isConnected) return;
          image.src = material.toDataURL('image/png');
          image.dataset.materialReady = 'true';
        }).catch(() => {
          if (!image.isConnected) return;
          image.dataset.assetError = 'true';
          image.src = 'assets/hands/' + image.dataset.side + '-whole.webp';
          image.dataset.materialReady = 'true';
        });
      }
    }
  };
})(EditorGame);
