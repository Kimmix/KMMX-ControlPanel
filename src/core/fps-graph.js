// Subtle sparkline of the controller's display FPS behind the shared header.
// Fed by BLE notifications (~4/s); hidden while there is no device data.
(() => {
  const canvas = document.getElementById('fpsGraph');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const color = getComputedStyle(document.documentElement).getPropertyValue('--acc1-color').trim() || '#dddddd';
  const history = [];
  const maxSamples = 120; // 30s at 4 samples/s
  let target = 0;

  function draw() {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const top = Math.max(target || 60, ...history) * 1.1;
    const step = w / (maxSamples - 1);
    const offset = w - (history.length - 1) * step;
    ctx.beginPath();
    history.forEach((fps, i) => ctx.lineTo(offset + i * step, h - (fps / top) * h));
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.lineTo(w, h);
    ctx.lineTo(offset, h);
    ctx.fillStyle = color + '22';
    ctx.fill();
    ctx.fillStyle = color;
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(history[history.length - 1] + ' fps', w - 2, 12);
  }

  window.setDeviceFps = (fps, targetFps = 0) => {
    if (fps === null) {
      history.length = 0;
      canvas.hidden = true;
      return;
    }
    target = targetFps;
    history.push(fps);
    if (history.length > maxSamples) history.shift();
    canvas.hidden = false;
    draw();
  };
  canvas.hidden = true;
})();
