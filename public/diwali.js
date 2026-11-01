// Diwali decorations: hanging string lights, lanterns, diyas, rangoli, fireworks and twinkling stars.
// Runs only during the festival window below, so nothing needs removing afterwards.
// Preview any time with ?diwali=1, or hide with ?diwali=0.
(function () {
  const END = new Date("2026-11-15T23:59:59+05:30");
  const force = new URLSearchParams(location.search).get("diwali");
  if (force === "0" || (force !== "1" && new Date() > END)) return;

  const root = document.documentElement;
  root.classList.add("diwali");
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const svgNS = 'xmlns="http://www.w3.org/2000/svg"';
  let uid = 0;

  // ---------- pieces ----------
  const BULBS = ["#FFD84D", "#FFE680", "#FFC93C"];

  // Fairy lights draped in swags across the full width
  function stringLights(width, drop) {
    const swag = width < 600 ? 130 : 190;
    const size = width < 600 ? 1.3 : 1.6;
    const n = Math.max(2, Math.round(width / swag));
    const w = width / n;
    let wire = "", bulbs = "", k = 0;
    for (let i = 0; i < n; i++) {
      const x0 = i * w, x1 = x0 + w, cx = x0 + w / 2;
      wire += `<path d="M${x0.toFixed(1)} 3 Q${cx.toFixed(1)} ${drop * 2} ${x1.toFixed(1)} 3" fill="none" stroke="#C9A35A" stroke-opacity=".7" stroke-width="1.4"/>`;
      for (let t = 0.1; t < 0.95; t += 0.16) {
        const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1;
        const y = (1 - t) * (1 - t) * 3 + 2 * (1 - t) * t * drop * 2 + t * t * 3;
        const c = BULBS[k % BULBS.length];
        bulbs += `<g class="bulb b${k % 3}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${size})">
          <circle cy="9" r="9" fill="#FFD84D" class="bulb__halo"/>
          <rect x="-2.2" y="-1" width="4.4" height="4" rx="1" fill="#3B0A2A"/>
          <path d="M0 3 C4.5 5 5 11 0 15 C-5 11 -4.5 5 0 3Z" fill="${c}"/>
          <ellipse cx="-1.4" cy="7.5" rx="1" ry="2" fill="#fff" fill-opacity=".7"/>
        </g>`;
        k++;
      }
    }
    return `<svg ${svgNS} viewBox="0 0 ${width} ${drop + 34}" width="${width}" height="${drop + 34}" aria-hidden="true">${wire}${bulbs}</svg>`;
  }

  // Akash kandil: a paper lantern hanging on a string
  function lantern(color, string) {
    const id = "l" + uid++;
    return `<svg ${svgNS} class="lantern__svg" viewBox="0 0 60 ${string + 110}" aria-hidden="true">
      <defs><radialGradient id="${id}"><stop offset="0" stop-color="#FFF3B0"/><stop offset=".6" stop-color="#FFD84D"/><stop offset="1" stop-color="#FFB703"/></radialGradient></defs>
      <line x1="30" y1="0" x2="30" y2="${string}" stroke="#C9A35A" stroke-opacity=".8" stroke-width="1.4"/>
      <g transform="translate(0 ${string})">
        <circle cx="30" cy="42" r="30" fill="#FFD84D" class="lantern__glow"/>
        <rect x="22" y="0" width="16" height="7" rx="2" fill="#3B0A2A"/>
        <path d="M30 6 L54 26 L54 58 L30 78 L6 58 L6 26Z" fill="${color}"/>
        <path d="M30 16 L45 29 L45 55 L30 68 L15 55 L15 29Z" fill="url(#${id})"/>
        <path d="M30 6 V78 M6 26 L54 58 M54 26 L6 58" stroke="${color}" stroke-width="2.5" opacity=".9"/>
        <circle cx="30" cy="42" r="6" fill="${color}"/>
        <path d="M6 26 L54 26 M6 58 L54 58" stroke="#FFD84D" stroke-width="2.5"/>
        <g stroke="${color}" stroke-width="2" stroke-linecap="round"><path d="M22 78 l-3 26"/><path d="M30 78 v30"/><path d="M38 78 l3 26"/></g>
        <g fill="#FFD84D"><circle cx="19" cy="104" r="2.5"/><circle cx="30" cy="108" r="2.5"/><circle cx="41" cy="104" r="2.5"/></g>
      </g>
    </svg>`;
  }

  function diya() {
    const id = "d" + uid++;
    return `<svg ${svgNS} class="diya" viewBox="0 0 80 72" aria-hidden="true">
      <defs>
        <radialGradient id="${id}g"><stop offset="0" stop-color="#FFE38A" stop-opacity=".95"/><stop offset=".45" stop-color="#FFB703" stop-opacity=".35"/><stop offset="1" stop-color="#FFB703" stop-opacity="0"/></radialGradient>
        <linearGradient id="${id}f" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#F77F00"/><stop offset=".55" stop-color="#FFC300"/><stop offset="1" stop-color="#FFF3B0"/></linearGradient>
        <linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E2622B"/><stop offset="1" stop-color="#9A3412"/></linearGradient>
      </defs>
      <circle class="diya__glow" cx="40" cy="22" r="24" fill="url(#${id}g)"/>
      <g class="diya__flame">
        <path d="M40 4 C47 15 51 23 47 30 C45 34 35 34 33 30 C29 23 33 15 40 4Z" fill="url(#${id}f)"/>
        <path d="M40 17 C43 22 44 26 42 29 C41 30.5 39 30.5 38 29 C36 26 37 22 40 17Z" fill="#FFFBE6"/>
      </g>
      <path d="M4 36 Q40 31 76 36 Q72 64 40 66 Q8 64 4 36Z" fill="url(#${id}b)"/>
      <ellipse cx="40" cy="36" rx="36" ry="5.5" fill="#7C2D12"/>
      <ellipse cx="40" cy="35" rx="30" ry="3" fill="#C2410C"/>
      <path d="M12 44 Q40 50 68 44" fill="none" stroke="#FFD84D" stroke-width="2.4" stroke-dasharray="1 5.5" stroke-linecap="round"/>
      <path d="M17 52 Q40 58 63 52" fill="none" stroke="#FF5FA2" stroke-width="2" stroke-dasharray="6 4" stroke-linecap="round"/>
    </svg>`;
  }

  function rangoli() {
    let s = "";
    const ring = (n, r, rx, ry, fill, off = 0) => {
      for (let i = 0; i < n; i++) s += `<ellipse cx="0" cy="${-r}" rx="${rx}" ry="${ry}" fill="${fill}" transform="rotate(${(360 / n) * i + off})"/>`;
    };
    const dots = (n, r, size, fill, off = 0) => {
      for (let i = 0; i < n; i++) {
        const a = ((360 / n) * i + off) * Math.PI / 180;
        s += `<circle cx="${(Math.sin(a) * r).toFixed(1)}" cy="${(-Math.cos(a) * r).toFixed(1)}" r="${size}" fill="${fill}"/>`;
      }
    };
    dots(48, 96, 2.6, "#FFD84D");
    ring(16, 76, 9, 18, "#F77F00", 11.25);
    ring(16, 74, 10, 20, "#FF5FA2");
    ring(12, 52, 9, 16, "#8EE3C2", 15);
    ring(8, 34, 10, 16, "#FFD84D");
    s += `<circle r="22" fill="#D61F69"/><circle r="14" fill="#FFF1B8"/>`;
    dots(8, 18, 2.6, "#D61F69", 22.5);
    s += `<circle r="6" fill="#F77F00"/>`;
    // One flat image that spins as a whole, so it always paints in full
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -100 200 200" width="600" height="600">${s}</svg>`;
    return `<img class="rangoli" src="data:image/svg+xml,${encodeURIComponent(svg)}" alt="" aria-hidden="true">`;
  }

  // "Diwali Special Offer" circle: scalloped gold edge with spinning text around a pink centre
  function offerBadge() {
    let scallop = "";
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      scallop += `<circle cx="${(Math.cos(a) * 88).toFixed(1)}" cy="${(Math.sin(a) * 88).toFixed(1)}" r="12" fill="#FFD84D"/>`;
    }
    return `<svg ${svgNS} viewBox="-104 -104 208 208" aria-hidden="true">
      <defs>
        <path id="offer-ring" d="M0 -77 A77 77 0 1 1 -0.01 -77"/>
        <radialGradient id="offer-core" cx=".4" cy=".35"><stop offset="0" stop-color="#FF5FA2"/><stop offset="1" stop-color="#C2125C"/></radialGradient>
      </defs>
      <g class="offer__spin">
        ${scallop}<circle r="90" fill="#FFD84D"/>
        <text font-family="Bricolage Grotesque, Arial Rounded MT Bold, sans-serif" font-weight="800" font-size="15" fill="#3B0A2A">
          <textPath href="#offer-ring" textLength="476" lengthAdjust="spacing">DIWALI SPECIAL ✦ DIWALI SPECIAL ✦</textPath>
        </text>
      </g>
      <circle r="64" fill="url(#offer-core)"/>
      <circle r="58" fill="none" stroke="#FFD84D" stroke-width="1.5" stroke-dasharray="2 5" stroke-linecap="round"/>
      <text text-anchor="middle" font-family="Bricolage Grotesque, Arial Rounded MT Bold, sans-serif" font-weight="800" fill="#FFF4FA">
        <tspan x="0" y="-14" font-size="22">Special</tspan>
        <tspan x="0" y="16" font-size="32" fill="#FFD84D">OFFER</tspan>
        <tspan x="0" y="38" font-size="12" font-family="Figtree, Segoe UI, sans-serif" font-weight="700">✨ shop now</tspan>
      </text>
    </svg>`;
  }

  // ---------- fireworks and stars (canvas) ----------
  function sky(host, { dark, rockets = true, starCount }) {
    const canvas = document.createElement("canvas");
    canvas.className = "fw";
    canvas.setAttribute("aria-hidden", "true");
    host.classList.add("fw-host");
    host.prepend(canvas);
    const ctx = canvas.getContext("2d");
    const palette = dark
      ? ["#FFD84D", "#FF5FA2", "#8EE3C2", "#FFB703", "#FFFFFF", "#FF9F1C", "#C77DFF"]
      : ["#D61F69", "#FF5FA2", "#F77F00", "#FFB703", "#E0A800", "#1F8A72", "#9D4EDD"];
    let W = 0, H = 0, stars = [], sparks = [], shells = [], flashes = [], visible = false, raf = 0, nextLaunch = 1500;

    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = host.clientWidth; H = host.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = starCount || Math.min(46, Math.round((W * H) / 16000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * W, y: Math.random() * H, r: 3.5 + Math.random() * 5.5,
        p: Math.random() * Math.PI * 2, s: 0.02 + Math.random() * 0.04,
        c: palette[(Math.random() * palette.length) | 0],
      }));
      if (calm) draw(0);
    }

    function star(x, y, r, a, c) {
      ctx.globalAlpha = a; ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.quadraticCurveTo(x, y, x, y + r);
      ctx.quadraticCurveTo(x, y, x - r, y);
      ctx.quadraticCurveTo(x, y, x, y - r);
      ctx.fill();
    }

    function burst(x, y) {
      const c1 = palette[(Math.random() * palette.length) | 0];
      const c2 = palette[(Math.random() * palette.length) | 0];
      const n = W < 600 ? 56 : 80, speed = (W < 600 ? 3.6 : 4.8) + Math.random() * 1.6;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.12;
        const v = speed * (0.8 + Math.random() * 0.3);
        sparks.push({ x, y, px: x, py: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, fade: 0.008 + Math.random() * 0.006, c: i % 2 ? c1 : c2, glitter: Math.random() < 0.3 });
      }
      // inner ring of a second colour
      for (let i = 0; i < n / 3; i++) {
        const a = (i / (n / 3)) * Math.PI * 2;
        sparks.push({ x, y, px: x, py: y, vx: Math.cos(a) * speed * 0.45, vy: Math.sin(a) * speed * 0.45, life: 1, fade: 0.014, c: c2, glitter: true });
      }
      // a soft flash at the centre
      flashes.push({ x, y, life: 1, c: c1 });
    }

    function launch() {
      const x = W * (0.12 + Math.random() * 0.76);
      // Burst in the part of the section that is on screen
      const r = host.getBoundingClientRect();
      const top = Math.max(0, -r.top), bottom = Math.min(H, innerHeight - r.top);
      if (bottom - top < 120) return;
      const ty = top + (bottom - top) * (0.12 + Math.random() * 0.35);
      const y0 = Math.min(H, bottom + 20);
      const vy = -Math.sqrt(2 * 0.06 * (y0 - ty));
      shells.push({ x, y: y0, vx: (Math.random() - 0.5) * 0.8, vy, c: palette[(Math.random() * palette.length) | 0] });
    }

    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      for (const s of stars) {
        const a = calm ? 0.7 : 0.35 + 0.65 * Math.abs(Math.sin(s.p + t * s.s * 0.06));
        star(s.x, s.y, s.r, a, s.c);
      }
      ctx.globalAlpha = 1;
      for (let i = shells.length - 1; i >= 0; i--) {
        const s = shells[i];
        s.x += s.vx; s.y += s.vy; s.vy += 0.06;
        ctx.fillStyle = s.c; ctx.globalAlpha = 0.9;
        ctx.beginPath(); ctx.arc(s.x, s.y, 2.6, 0, 7); ctx.fill();
        ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.arc(s.x - s.vx * 3, s.y - s.vy * 3, 1.8, 0, 7); ctx.fill();
        if (s.vy >= -0.4) { burst(s.x, s.y); shells.splice(i, 1); }
      }
      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i];
        f.life -= 0.05;
        if (f.life <= 0) { flashes.splice(i, 1); continue; }
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 70);
        g.addColorStop(0, f.c); g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.globalAlpha = f.life * 0.45; ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(f.x, f.y, 70, 0, 7); ctx.fill();
      }
      ctx.lineCap = "round";
      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i];
        p.vx *= 0.97; p.vy = p.vy * 0.97 + 0.04;
        p.x += p.vx; p.y += p.vy; p.life -= p.fade;
        if (p.life <= 0) { sparks.splice(i, 1); continue; }
        const a = p.glitter ? p.life * (0.4 + 0.6 * Math.random()) : p.life;
        ctx.globalAlpha = a; ctx.strokeStyle = p.c; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(p.x - p.vx * 4, p.y - p.vy * 4); ctx.lineTo(p.x, p.y); ctx.stroke();
        ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function frame(t) {
      if (rockets && t > nextLaunch) {
        launch();
        nextLaunch = t + 5000 + Math.random() * 4000;
      }
      draw(t);
      raf = visible && !document.hidden ? requestAnimationFrame(frame) : 0;
    }
    const start = () => { if (!calm && visible && !raf && !document.hidden) raf = requestAnimationFrame(frame); };

    new ResizeObserver(resize).observe(host);
    resize();
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; start(); }).observe(host);
    document.addEventListener("visibilitychange", start);
    if (!calm) {
      host.addEventListener("pointerdown", (e) => {
        if (e.target.closest("a, button, input, textarea, select, label")) return;
        const r = host.getBoundingClientRect();
        burst(e.clientX - r.left, e.clientY - r.top);
        start();
      }, { passive: true });
    }
  }

  // ---------- place them ----------
  const announce = document.querySelector(".announce");
  if (announce) {
    announce.setAttribute("href", "#pads");
    announce.innerHTML = `<span class="announce__tag">Happy Diwali</span>
      <span>Light up, glow up, stay comfy. Wishing you a bright and joyful Diwali from all of us at&nbsp;Pookie&nbsp;🪔</span>
      <span class="announce__cta">Shop pads</span>`;
  }

  const nav = document.querySelector(".nav");
  if (nav) {
    const lights = document.createElement("div");
    lights.className = "lights";
    lights.setAttribute("aria-hidden", "true");
    let lastW = 0;
    const fill = () => {
      if (innerWidth === lastW) return;
      lastW = innerWidth;
      lights.innerHTML = stringLights(innerWidth, innerWidth < 600 ? 18 : 26);
    };
    fill();
    let t;
    addEventListener("resize", () => { clearTimeout(t); t = setTimeout(fill, 200); });
    nav.prepend(lights);
  }

  const hero = document.querySelector(".hero");
  if (hero) {
    sky(hero, { dark: true });
    hero.insertAdjacentHTML("beforeend",
      `<div class="lantern lantern--a">${lantern("#D61F69", 70)}</div>
       <div class="lantern lantern--b">${lantern("#F77F00", 130)}</div>
       <div class="lantern lantern--c">${lantern("#9D4EDD", 40)}</div>`);
  }

  const copy = document.querySelector(".hero__copy");
  if (copy) {
    const sticker = document.createElement("p");
    sticker.className = "diwali-sticker";
    sticker.innerHTML = `<span aria-hidden="true">🪔</span> Happy Diwali, pookie!`;
    copy.prepend(sticker);
  }

  const art = document.querySelector(".hero__art");
  if (art) {
    art.insertAdjacentHTML("afterbegin", rangoli());
    art.insertAdjacentHTML("beforeend", `<span class="diya-spot diya-spot--l" aria-hidden="true">${diya()}</span><span class="diya-spot diya-spot--r" aria-hidden="true">${diya()}</span>
      <button class="offer" type="button" data-open-basket aria-label="Diwali special offer. Shop pads">${offerBadge()}</button>`);
  }

  const why = document.querySelector(".why");
  if (why) {
    sky(why, { dark: true });
    const title = why.querySelector(".section-title");
    if (title) title.insertAdjacentHTML("beforeend", ` <span class="diya-inline" aria-hidden="true">${diya()}</span>`);
  }

  // Twinkling stars (no fireworks) across the rest of the night sky
  for (const sel of [".pads", ".reviews", ".partner", ".faq", ".club"]) {
    const el = document.querySelector(sel);
    if (el) sky(el, { dark: true, rockets: false });
  }

  const footer = document.querySelector(".footer");
  if (footer) {
    sky(footer, { dark: true, rockets: !matchMedia("(max-width: 600px)").matches });
    const company = footer.querySelector(".footer__company");
    if (company) company.insertAdjacentHTML("beforeend", ` <span class="diya-inline" aria-hidden="true">${diya()}</span>`);
  }

  // ---------- tap sparkles everywhere else ----------
  if (calm) return;
  const colors = ["#FFD84D", "#FFB703", "#FF5FA2", "#F77F00", "#FFFFFF"];
  let last = 0;
  document.addEventListener("pointerdown", (e) => {
    if (e.target.closest("input, textarea, select, dialog, .basket, .fw-host")) return;
    const now = performance.now();
    if (now - last < 120) return;
    last = now;
    for (let i = 0; i < 12; i++) {
      const s = document.createElement("span");
      s.className = "spark";
      const a = (i / 12) * Math.PI * 2 + Math.random() * 0.4;
      const d = 34 + Math.random() * 38;
      s.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;--dx:${(Math.cos(a) * d).toFixed(0)}px;--dy:${(Math.sin(a) * d).toFixed(0)}px;background:${colors[i % colors.length]}`;
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 800);
    }
  }, { passive: true });
})();
