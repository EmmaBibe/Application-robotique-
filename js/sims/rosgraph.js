import { frame, canvas, theme, text, roundRect, loop, readout, note, button, buttons } from '../core/kit.js';

// Graphe ROS 2 vivant : des nœuds publient sur des topics, d'autres s'y abonnent.
// Touche un nœud pour l'arrêter et observe ce qui se passe en aval.
export default function rosgraph(root, opts = {}) {
  const f = frame(root, { title: opts.title || 'Architecture ROS 2 en direct', tag: 'Logiciel robot', height: 440 });
  const nodes = {
    camera: { label: 'camera_driver', x: 0.08, y: 0.18, on: true },
    lidar: { label: 'lidar_driver', x: 0.08, y: 0.5, on: true },
    wheels: { label: 'wheel_encoders', x: 0.08, y: 0.82, on: true },
    detect: { label: 'object_detector', x: 0.38, y: 0.18, on: true },
    slam: { label: 'slam', x: 0.38, y: 0.62, on: true },
    planner: { label: 'path_planner', x: 0.66, y: 0.36, on: true },
    control: { label: 'controller', x: 0.92, y: 0.6, on: true },
    motors: { label: 'motor_driver', x: 0.92, y: 0.88, on: true },
  };
  const topics = [
    { name: '/camera/image_raw', type: 'sensor_msgs/Image', from: 'camera', to: ['detect'], hz: 30, sample: 'height: 480\nwidth: 640\nencoding: rgb8\ndata: [921600 octets]' },
    { name: '/scan', type: 'sensor_msgs/LaserScan', from: 'lidar', to: ['slam', 'planner'], hz: 10, sample: 'angle_min: -3.14\nangle_increment: 0.0175\nranges: [1.92, 1.95, 2.01, inf, 0.48, ...]' },
    { name: '/odom', type: 'nav_msgs/Odometry', from: 'wheels', to: ['slam'], hz: 50, sample: 'pose.position: {x: 1.24, y: 0.37}\ntwist.linear.x: 0.31' },
    { name: '/detections', type: 'vision_msgs/Detection2DArray', from: 'detect', to: ['planner'], hz: 15, sample: 'detections:\n- class: personne  score: 0.93\n  bbox: {x: 312, y: 140, w: 80, h: 210}' },
    { name: '/map', type: 'nav_msgs/OccupancyGrid', from: 'slam', to: ['planner'], hz: 1, sample: 'info: {resolution: 0.05, width: 384, height: 384}\ndata: [-1, -1, 0, 0, 100, ...]' },
    { name: '/cmd_vel', type: 'geometry_msgs/Twist', from: 'planner', to: ['control'], hz: 20, sample: 'linear: {x: 0.4, y: 0.0, z: 0.0}\nangular: {x: 0.0, y: 0.0, z: -0.2}' },
    { name: '/wheel_cmd', type: 'std_msgs/Float64MultiArray', from: 'control', to: ['motors'], hz: 100, sample: 'data: [0.38, 0.42]' },
  ];
  // disposition compacte pour les écrans étroits (téléphone)
  const LAYOUT = {
    wide: { camera: [0.08, 0.18], lidar: [0.08, 0.5], wheels: [0.08, 0.82], detect: [0.38, 0.18], slam: [0.38, 0.62], planner: [0.66, 0.36], control: [0.92, 0.6], motors: [0.92, 0.88] },
    narrow: { camera: [0.2, 0.07], lidar: [0.5, 0.2], wheels: [0.8, 0.07], detect: [0.2, 0.4], slam: [0.78, 0.4], planner: [0.45, 0.62], control: [0.45, 0.8], motors: [0.45, 0.95] },
  };
  const applyLayout = narrow => { for (const [k, [x, y]] of Object.entries(LAYOUT[narrow ? 'narrow' : 'wide'])) { nodes[k].x = x; nodes[k].y = y; } };
  let sel = topics[5];
  const msgs = [];
  const lastRx = {};
  const bb = buttons(f.ctrl);
  button(bb, 'Tout redémarrer', () => { for (const k in nodes) nodes[k].on = true; });
  const ro = readout(f.ctrl, [['topic', 'Topic'], ['type', 'Type de message'], ['hz', 'Fréquence'], ['subs', 'Abonnés']]);
  const echo = document.createElement('pre');
  echo.style.margin = '0';
  echo.style.fontSize = '.78rem';
  f.ctrl.appendChild(echo);
  note(f.ctrl, 'Touche une étiquette de topic pour voir un message type (<code>ros2 topic echo</code>). Touche un nœud pour le tuer : ses abonnés ne reçoivent plus rien et passent en orange, puis en rouge. C\'est pour ça qu\'en vrai on surveille la « vivacité » (liveliness) des nœuds et l\'âge des derniers messages.');

  const cv = canvas(f.stage);
  const nodeAt = (p, W, H) => Object.entries(nodes).find(([, n]) => Math.abs(p.x - n.x * W) < (W < 620 ? 48 : 62) && Math.abs(p.y - n.y * H) < 16);
  const labelPos = (t, W, H) => {
    const a = nodes[t.from], b = nodes[t.to[0]];
    return { x: (a.x + b.x) / 2 * W, y: (a.y + b.y) / 2 * H - 10 };
  };
  cv.c.addEventListener('pointerdown', e => {
    const p = cv.pos(e), W = cv.w, H = cv.h;
    const t = topics.find(t => { const l = labelPos(t, W, H); return Math.abs(p.x - l.x) < 60 && Math.abs(p.y - l.y) < 11; });
    if (t) { sel = t; return; }
    const n = nodeAt(p, W, H);
    if (n) n[1].on = !n[1].on;
  });

  let clock = 0;
  const acc = {};
  const lp = loop(root, dt => {
    clock += dt;
    for (const t of topics) {
      acc[t.name] = (acc[t.name] || 0) + dt * Math.min(t.hz, 25);
      const src = nodes[t.from];
      const alive = src.on && (t.from === 'camera' || t.from === 'lidar' || t.from === 'wheels' || fresh(t.from));
      while (acc[t.name] >= 1) {
        acc[t.name] -= 1;
        if (alive) for (const to of t.to) msgs.push({ t, to, p: 0 });
      }
    }
    for (const m of msgs) {
      m.p += dt * 1.6;
      if (m.p >= 1 && !m.done) { m.done = true; if (nodes[m.to].on) lastRx[m.to] = clock; }
    }
    for (let i = msgs.length - 1; i >= 0; i--) if (msgs[i].done) msgs.splice(i, 1);
    draw();
  });
  function fresh(k) { return lastRx[k] !== undefined && clock - lastRx[k] < 1.2; }
  function health(k) {
    if (!nodes[k].on) return 'dead';
    if (['camera', 'lidar', 'wheels'].includes(k)) return 'ok';
    if (lastRx[k] === undefined) return clock < 2 ? 'ok' : 'stale';
    const age = clock - lastRx[k];
    return age < 1.2 ? 'ok' : age < 3 ? 'stale' : 'dead-in';
  }

  function draw() {
    const th = theme(), ctx = cv.ctx, W = cv.w, H = cv.h;
    ctx.clearRect(0, 0, W, H);
    const narrow = W < 620;
    applyLayout(narrow);
    const fs = narrow ? 9 : 11;
    for (const t of topics) {
      const a = nodes[t.from];
      for (const to of t.to) {
        const b = nodes[to];
        ctx.strokeStyle = t === sel ? th.warn : th.line; ctx.lineWidth = t === sel ? 2.5 : 1.5;
        ctx.beginPath(); ctx.moveTo(a.x * W, a.y * H); ctx.lineTo(b.x * W, b.y * H); ctx.stroke();
      }
    }
    for (const m of msgs) {
      const a = nodes[m.t.from], b = nodes[m.to];
      ctx.fillStyle = m.t === sel ? th.warn : th.accent;
      ctx.beginPath(); ctx.arc((a.x + (b.x - a.x) * m.p) * W, (a.y + (b.y - a.y) * m.p) * H, 3.5, 0, 7); ctx.fill();
    }
    for (const t of topics) {
      const l = labelPos(t, W, H);
      ctx.font = `600 ${fs - 1}px ` + th.mono;
      const tw = ctx.measureText(t.name).width + 12;
      roundRect(ctx, l.x - tw / 2, l.y - 9, tw, 18, 9);
      ctx.fillStyle = t === sel ? th.warn : th.panel; ctx.fill();
      ctx.strokeStyle = th.line; ctx.lineWidth = 1; ctx.stroke();
      text(ctx, t.name, l.x, l.y + 4, { color: t === sel ? '#1b1200' : th.muted, size: fs - 1, align: 'center', font: th.mono, weight: 600 });
    }
    for (const [k, n] of Object.entries(nodes)) {
      const x = n.x * W, y = n.y * H, h = health(k);
      const col = h === 'ok' ? th.accent : h === 'stale' ? th.warn : th.danger;
      ctx.font = `700 ${fs}px ` + th.mono;
      const w = Math.max(narrow ? 60 : 90, ctx.measureText(n.label).width + (narrow ? 16 : 22));
      roundRect(ctx, x - w / 2, y - 14, w, 28, 8);
      ctx.fillStyle = th.bg; ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
      text(ctx, n.label, x, y + 4, { color: n.on ? th.text : th.faint, size: fs, align: 'center', font: th.mono, weight: 700 });
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x - w / 2 + 7, y - 7, 3, 0, 7); ctx.fill();
    }
    ro.set('topic', sel.name);
    ro.set('type', sel.type);
    ro.set('hz', `${sel.hz} Hz`);
    ro.set('subs', sel.to.map(k => nodes[k].label).join(', '));
    echo.textContent = `$ ros2 topic echo ${sel.name}\n${nodes[sel.from].on ? sel.sample + '\n---' : '(plus rien : l\'éditeur est arrêté)'}`;
  }
  return () => { lp.stop(); cv.destroy(); };
}
