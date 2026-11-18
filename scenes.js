/* Stillpoint background scenes: auras (SVG), silk (SVG), illustrations (SVG + animated canvas). All original. */
(() => {
  "use strict";
  let n = 0;
  const uid = () => "s" + (++n).toString(36);
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const svgWrap = (inner, vb = "0 0 160 100") =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" style="display:block">${inner}</svg>`;

  // ---------- Aura shapes (drawn in a 100×100 box, all soft/rounded) ----------
  const starPts = (pts, outer, inner) => {
    let s = "";
    for (let i = 0; i < pts * 2; i++) {
      const r = i % 2 ? inner : outer, a = (Math.PI / pts) * i - Math.PI / 2;
      s += `${(50 + r * Math.cos(a)).toFixed(1)},${(52 + r * Math.sin(a)).toFixed(1)} `;
    }
    return s;
  };
  const SHAPES = {
    orb: `<circle cx="50" cy="50" r="40"/>`,
    heart: `<path d="M50 90 C22 70 5 54 5 32 C5 17 16 7 29 7 C39 7 46 13 50 21 C54 13 61 7 71 7 C84 7 95 17 95 32 C95 54 78 70 50 90Z"/>`,
    butterfly: `<ellipse cx="24" cy="32" rx="24" ry="17" transform="rotate(-35 24 32)"/><ellipse cx="76" cy="32" rx="24" ry="17" transform="rotate(35 76 32)"/>
      <ellipse cx="31" cy="70" rx="15" ry="11" transform="rotate(35 31 70)"/><ellipse cx="69" cy="70" rx="15" ry="11" transform="rotate(-35 69 70)"/>
      <ellipse cx="50" cy="52" rx="3" ry="22"/>`,
    star: `<polygon points="${starPts(5, 44, 20)}" stroke-width="12"/>`,
    sparkle: `<polygon points="${starPts(4, 46, 13)}" stroke-width="10"/>`,
    flower: [0, 72, 144, 216, 288].map((a) => {
      const r = (a - 90) * Math.PI / 180;
      return `<circle cx="${(50 + 30 * Math.cos(r)).toFixed(1)}" cy="${(50 + 30 * Math.sin(r)).toFixed(1)}" r="17"/>`;
    }).join("") + `<circle cx="50" cy="50" r="13"/>`,
    moon: `<path d="M60 6 A44 44 0 1 0 94 70 A36 36 0 1 1 60 6Z"/>`,
    cloud: `<circle cx="30" cy="58" r="20"/><circle cx="50" cy="44" r="26"/><circle cx="72" cy="56" r="21"/><rect x="28" y="56" width="46" height="22" rx="11"/>`,
    drop: `<path d="M50 5 C50 5 84 45 84 64 A34 34 0 0 1 16 64 C16 45 50 5 50 5Z"/>`,
    bloom: `<ellipse cx="50" cy="50" rx="44" ry="26"/><ellipse cx="50" cy="50" rx="26" ry="44"/>`,
    ring: `<circle cx="50" cy="50" r="40" fill="none" stroke-width="16"/>`,
  };

  function aura({ base, halo, c1, c2, core, shape, rot = 0, size = 0.62, halo2, soft = 1 }) {
    return () => {
      const id = uid();
      const sh = SHAPES[shape];
      const crisp = { butterfly: .55, flower: .6, star: .7, sparkle: .7, bloom: .7, cloud: .75, moon: .8 }[shape] || 1;
      return svgWrap(`
        <defs>
          <radialGradient id="${id}h" cx="80" cy="50" r="85" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="${halo}" stop-opacity=".7"/>
            <stop offset=".2" stop-color="${halo}" stop-opacity=".58"/>
            <stop offset=".4" stop-color="${halo}" stop-opacity=".36"/>
            <stop offset=".6" stop-color="${halo}" stop-opacity=".17"/>
            <stop offset=".8" stop-color="${halo}" stop-opacity=".05"/>
            <stop offset="1" stop-color="${halo}" stop-opacity="0"/>
          </radialGradient>
          ${halo2 ? `<radialGradient id="${id}h2" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${halo2}" stop-opacity=".55"/><stop offset=".5" stop-color="${halo2}" stop-opacity=".2"/><stop offset="1" stop-color="${halo2}" stop-opacity="0"/></radialGradient>` : ""}
          <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
          <filter id="${id}b1" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${26 * soft}"/></filter>
          <filter id="${id}b2" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${11 * soft * crisp}"/></filter>
          <filter id="${id}b3" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${16 * soft * crisp}"/></filter>
        </defs>
        <rect width="160" height="100" fill="${base}"/>
        ${halo2 ? `<ellipse cx="30" cy="85" rx="70" ry="50" fill="url(#${id}h2)"/><ellipse cx="135" cy="15" rx="60" ry="45" fill="url(#${id}h2)"/>` : ""}
        <rect x="-40" y="-40" width="240" height="180" fill="url(#${id}h)"/>
        <g transform="translate(80 50) rotate(${rot}) scale(${size}) translate(-50 -50)" stroke-linejoin="round" stroke-linecap="round">
          <g filter="url(#${id}b1)" fill="url(#${id}s)" stroke="url(#${id}s)" stroke-width="0" opacity=".75">${sh}</g>
          <g filter="url(#${id}b2)" fill="url(#${id}s)" stroke="url(#${id}s)" stroke-width="0" opacity=".8">${sh}</g>
          <g filter="url(#${id}b3)" fill="${core}" stroke="${core}" stroke-width="0" opacity=".35" transform="translate(50 50) scale(.6) translate(-50 -50)">${sh}</g>
        </g>`);
    };
  }

  // ---------- Silk ----------
  function silk({ base, shadow, light, mid, angle = -16 }) {
    return () => {
      const id = uid();
      let defs = `<filter id="${id}f" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.1"/></filter>`;
      let bands = "";
      const N = 9;
      for (let i = 0; i < N; i++) {
        const off = -30 + i * 20, amp = 7 + ((i * 37) % 9), f = 0.025 + ((i * 13) % 7) * 0.004, ph = i * 1.7;
        const th = 14 + ((i * 29) % 12);
        const top = [], bot = [];
        for (let x = -40; x <= 200; x += 5) {
          const y = off + amp * Math.sin(x * f + ph) + 4 * Math.sin(x * f * 2.3 + ph * 2);
          const t = th + 6 * Math.sin(x * f * 1.4 + ph);
          top.push(`${x},${y.toFixed(2)}`); bot.unshift(`${x},${(y + t).toFixed(2)}`);
        }
        defs += `<linearGradient id="${id}g${i}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${shadow}" stop-opacity="0"/>
          <stop offset=".3" stop-color="${mid}" stop-opacity=".7"/>
          <stop offset=".5" stop-color="${light}" stop-opacity=".95"/>
          <stop offset=".62" stop-color="${mid}" stop-opacity=".75"/>
          <stop offset=".85" stop-color="${shadow}" stop-opacity=".85"/>
          <stop offset="1" stop-color="${shadow}" stop-opacity="0"/></linearGradient>`;
        bands += `<path d="M${top.join(" L")} L${bot.join(" L")}Z" fill="url(#${id}g${i})"/>`;
      }
      defs += `<radialGradient id="${id}v" cx="50%" cy="45%" r="75%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient>`;
      return svgWrap(`<defs>${defs}</defs><rect width="160" height="100" fill="${base}"/>
        <g transform="rotate(${angle} 80 50)" filter="url(#${id}f)">${bands}</g>
        <rect width="160" height="100" fill="url(#${id}v)"/>`);
    };
  }

  // ---------- SVG illustrations ----------
  const hillPath = (y, amp, f, ph, w = 160, h = 100) => {
    let d = `M-10 ${h + 10} L-10 ${y}`;
    for (let x = -10; x <= w + 10; x += 4) d += ` L${x} ${(y - amp * (0.6 * Math.sin(x * f + ph) + 0.4 * Math.sin(x * f * 2.1 + ph * 1.3))).toFixed(2)}`;
    return d + ` L${w + 10} ${h + 10}Z`;
  };
  function hills({ sky1, sky2, sun, layers, sunY = 48, glow }) {
    return () => {
      const id = uid();
      return svgWrap(`<defs>
          <linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky1}"/><stop offset="1" stop-color="${sky2}"/></linearGradient>
          <radialGradient id="${id}glow"><stop offset="0" stop-color="${glow}" stop-opacity=".8"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient>
        </defs>
        <rect width="160" height="100" fill="url(#${id}sky)"/>
        <circle cx="80" cy="${sunY}" r="40" fill="url(#${id}glow)"/>
        <circle cx="80" cy="${sunY}" r="11" fill="${sun}"/>
        ${layers.map((c, i) => `<path d="${hillPath(58 + i * 9, 6 - i * 0.6, 0.035 + i * 0.008, i * 2.1)}" fill="${c}"/>`).join("")}`);
    };
  }
  function clouds({ sky1, sky2, cloud, shade }) {
    return () => {
      const id = uid();
      const puff = (x, y, s, o = 1) => `<g transform="translate(${x} ${y}) scale(${s})" opacity="${o}">
        <g fill="${shade}" transform="translate(0 2)"><circle cx="0" cy="0" r="8"/><circle cx="10" cy="-5" r="10"/><circle cx="22" cy="-1" r="8"/><rect x="0" y="-2" width="22" height="10" rx="5"/></g>
        <g fill="${cloud}"><circle cx="0" cy="0" r="8"/><circle cx="10" cy="-5" r="10"/><circle cx="22" cy="-1" r="8"/><rect x="0" y="-2" width="22" height="9" rx="4.5"/></g></g>`;
      return svgWrap(`<defs><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky1}"/><stop offset="1" stop-color="${sky2}"/></linearGradient>
        <filter id="${id}b"><feGaussianBlur stdDeviation=".5"/></filter></defs>
        <rect width="160" height="100" fill="url(#${id}s)"/>
        <g filter="url(#${id}b)">${puff(10, 22, 1.1, .9)}${puff(112, 16, 0.8, .8)}${puff(128, 62, 1.3)}${puff(-6, 78, 1.5)}${puff(60, 90, 1.2, .95)}${puff(70, 40, 0.55, .7)}</g>`);
    };
  }

  // ---------- Canvas scenes ----------
  function dropSprite() {
    const c = document.createElement("canvas"); c.width = 64; c.height = 72;
    const g = c.getContext("2d");
    g.beginPath(); g.ellipse(32, 38, 28, 32, 0, 0, 7); g.closePath();
    const lg = g.createLinearGradient(0, 6, 0, 70);
    lg.addColorStop(0, "rgba(0,0,0,0.30)"); lg.addColorStop(0.55, "rgba(255,255,255,0.06)"); lg.addColorStop(1, "rgba(255,255,255,0.38)");
    g.fillStyle = lg; g.fill();
    g.lineWidth = 3; g.strokeStyle = "rgba(0,0,0,0.25)"; g.stroke();
    g.beginPath(); g.ellipse(22, 22, 7, 5, -0.6, 0, 7); g.fillStyle = "rgba(255,255,255,0.75)"; g.fill();
    return c;
  }
  function rainWindow({ sky1, sky2, bokeh, frame, fog }) {
    return {
      canvas: true,
      setup(w, h) {
        const sprite = dropSprite();
        const bg = document.createElement("canvas"); bg.width = w; bg.height = h;
        const g = bg.getContext("2d");
        const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, sky1); grd.addColorStop(1, sky2);
        g.fillStyle = grd; g.fillRect(0, 0, w, h);
        const scale = Math.max(w, h) / 1400;
        for (let i = 0; i < 46; i++) {
          const x = Math.random() * w, y = h * (0.3 + Math.random() * 0.75), r = (45 + Math.random() * 110) * scale;
          const c = bokeh[i % bokeh.length];
          const rg = g.createRadialGradient(x, y, 0, x, y, r);
          rg.addColorStop(0, c + "66"); rg.addColorStop(0.5, c + "38"); rg.addColorStop(0.8, c + "12"); rg.addColorStop(1, c + "00");
          g.fillStyle = rg; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
        }
        g.fillStyle = fog; g.fillRect(0, 0, w, h);
        const cond = g.createLinearGradient(0, h * 0.6, 0, h); cond.addColorStop(0, "rgba(255,255,255,0)"); cond.addColorStop(1, "rgba(255,255,255,0.10)");
        g.fillStyle = cond; g.fillRect(0, 0, w, h);
        const s = scale * 1.5;
        const nStill = Math.round(420 * (w * h) / (1400 * 900)) + 20;
        for (let i = 0; i < nStill; i++) {
          const r = (1.2 + Math.pow(Math.random(), 2.2) * 6) * s;
          g.drawImage(sprite, Math.random() * w - r, Math.random() * h - r, r * 2, r * 2.25);
        }
        const mk = (top) => ({ x: Math.random() * w, y: top ? -20 - Math.random() * h * 0.5 : Math.random() * h, r: (4.5 + Math.random() * 5.5) * s, v: 0, trail: [] });
        const sliders = [...Array(24)].map(() => mk(false));
        return { bg, sprite, sliders, mk, s };
      },
      draw(ctx, w, h, st, dt) {
        ctx.drawImage(st.bg, 0, 0);
        const drop = (x, y, r) => ctx.drawImage(st.sprite, x - r, y - r * 1.1, r * 2, r * 2.25);
        st.sliders.forEach((d, i) => {
          if (Math.random() < 0.015) d.v = 0;
          d.v = Math.min(d.v + 0.015 * d.r * dt, 0.8 * d.r * dt);
          if (Math.random() < 0.35) d.y += d.v * (0.4 + Math.random());
          d.x += (Math.random() - 0.5) * 0.5 * st.s;
          if (Math.random() < 0.12) d.trail.push({ x: d.x + (Math.random() - 0.5) * d.r * 0.4, y: d.y - d.r * 0.8, r: d.r * (0.18 + Math.random() * 0.22), life: 1 });
          d.trail = d.trail.filter((t) => (t.life -= 0.0015 * dt) > 0);
          d.trail.forEach((t) => drop(t.x, t.y, t.r * (0.5 + t.life * 0.5)));
          drop(d.x, d.y, d.r);
          if (d.y - d.r > h) st.sliders[i] = st.mk(true);
        });
        // window frame with a soft inner shadow
        const fw = Math.max(4, w * 0.022);
        ctx.fillStyle = frame;
        ctx.fillRect(0, 0, w, fw); ctx.fillRect(0, h - fw * 1.8, w, fw * 1.8); ctx.fillRect(0, 0, fw, h); ctx.fillRect(w - fw, 0, fw, h);
        const sh = (x0, y0, x1, y1, rx, ry, rw, rh) => {
          const gr = ctx.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, "rgba(0,0,0,0.35)"); gr.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = gr; ctx.fillRect(rx, ry, rw, rh);
        };
        sh(0, fw, 0, fw * 3, fw, fw, w - fw * 2, fw * 2);
        sh(fw, 0, fw * 3, 0, fw, fw, fw * 2, h - fw * 2.8);
        sh(w - fw, 0, w - fw * 3, 0, w - fw * 3, fw, fw * 2, h - fw * 2.8);
        ctx.fillStyle = "rgba(255,255,255,0.06)"; ctx.fillRect(0, h - fw * 1.8, w, 2);
      },
    };
  }

  function starryHills({ sky1, sky2, hillsC, moon }) {
    return {
      canvas: true,
      setup(w, h) {
        const stars = [...Array(Math.round((w * h) / 4500))].map(() => ({ x: Math.random() * w, y: Math.random() * h * 0.75, r: Math.random() * 1.3 + 0.3, p: Math.random() * 6, sp: 0.5 + Math.random() * 1.5 }));
        return { stars, t: 0, shoot: null };
      },
      draw(ctx, w, h, st, dt) {
        st.t += dt / 60;
        const grd = ctx.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, sky1); grd.addColorStop(1, sky2);
        ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);
        st.stars.forEach((s) => {
          ctx.globalAlpha = 0.45 + 0.55 * Math.abs(Math.sin(st.t * s.sp + s.p));
          ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill();
        });
        ctx.globalAlpha = 1;
        // moon
        const mx = w * 0.78, my = h * 0.2, mr = Math.min(w, h) * 0.05;
        const mg = ctx.createRadialGradient(mx, my, mr, mx, my, mr * 6); mg.addColorStop(0, moon + "55"); mg.addColorStop(1, moon + "00");
        ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, mr * 6, 0, 7); ctx.fill();
        ctx.fillStyle = moon; ctx.beginPath(); ctx.arc(mx, my, mr, 0, 7); ctx.fill();
        // shooting star
        if (!st.shoot && Math.random() < 0.002 * dt) st.shoot = { x: Math.random() * w * 0.6, y: Math.random() * h * 0.3, l: 0 };
        if (st.shoot) {
          const s = st.shoot; s.l += 0.02 * dt;
          const x = s.x + s.l * w * 0.25, y = s.y + s.l * h * 0.12;
          const lg = ctx.createLinearGradient(x - 80, y - 38, x, y); lg.addColorStop(0, "rgba(255,255,255,0)"); lg.addColorStop(1, `rgba(255,255,255,${1 - s.l})`);
          ctx.strokeStyle = lg; ctx.lineWidth = 2; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(x - 80, y - 38); ctx.lineTo(x, y); ctx.stroke();
          if (s.l >= 1) st.shoot = null;
        }
        // rounded hills
        hillsC.forEach((c, i) => {
          const base = h * (0.68 + i * 0.1), amp = h * (0.06 - i * 0.01), f = (0.004 + i * 0.0015) * (1400 / w);
          ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, h);
          for (let x = 0; x <= w + 8; x += 8) ctx.lineTo(x, base - amp * (0.6 * Math.sin(x * f + i * 2) + 0.4 * Math.sin(x * f * 2.2 + i)));
          ctx.lineTo(w, h); ctx.fill();
        });
      },
    };
  }

  // ---------- Catalog ----------
  const L = true; // light background → dark UI text
  const list = [
    // Aura
    { id: "aura-pink", name: "Pink aura", group: "Aura", light: L, svg: aura({ base: "#fde3ea", halo: "#f9a9c2", c1: "#ea5f92", c2: "#f792b3", core: "#e8588c", shape: "orb", size: 0.72 }) },
    { id: "aura-peach", name: "Peach orb", group: "Aura", light: L, svg: aura({ base: "#f7e6dc", halo: "#ffb995", c1: "#ff8a5c", c2: "#ffd2a8", core: "#fff1e2", shape: "orb" }) },
    { id: "aura-lilac-heart", name: "Lilac heart", group: "Aura", light: L, svg: aura({ base: "#f1e8f8", halo: "#d5b6ff", c1: "#b98cff", c2: "#ff9fd2", core: "#fff0fb", shape: "heart" }) },
    { id: "aura-blue-butterfly", name: "Sky butterfly", group: "Aura", light: L, svg: aura({ base: "#e6eefb", halo: "#a9c7ff", c1: "#6fa6ff", c2: "#c3a8ff", core: "#f2f4ff", shape: "butterfly", size: 0.68 }) },
    { id: "aura-rose-heart", name: "Rose heart", group: "Aura", svg: aura({ base: "#1c0d18", halo: "#ff4f8b", c1: "#ff3d7f", c2: "#ffa0c5", core: "#ffe0ec", shape: "heart", halo2: "#7a2a63" }) },
    { id: "aura-moon", name: "Moonglow", group: "Aura", svg: aura({ base: "#0b1026", halo: "#6f7fe8", c1: "#9aaaff", c2: "#e8cbff", core: "#ffffff", shape: "moon", rot: -10, halo2: "#2b2f7a" }) },
    { id: "aura-mint-flower", name: "Mint flower", group: "Aura", light: L, svg: aura({ base: "#e9f6ef", halo: "#9fe8c6", c1: "#6fd9a9", c2: "#d4f2a0", core: "#fbfff2", shape: "flower", rot: 10 }) },
    { id: "aura-gold-star", name: "Golden star", group: "Aura", light: L, svg: aura({ base: "#fff4de", halo: "#ffcd6b", c1: "#ffb22e", c2: "#ff8f6b", core: "#fff8e6", shape: "star" }) },
    { id: "aura-cherry-butterfly", name: "Cherry butterfly", group: "Aura", svg: aura({ base: "#170a13", halo: "#ff6fae", c1: "#ff5fa2", c2: "#ffb36b", core: "#fff0e0", shape: "butterfly", size: 0.68, halo2: "#5b1f4a" }) },
    { id: "aura-drop", name: "Ocean drop", group: "Aura", light: L, svg: aura({ base: "#e4f4f7", halo: "#86d6e6", c1: "#3fbcd6", c2: "#8fa8ff", core: "#effbff", shape: "drop" }) },
    { id: "aura-cotton-cloud", name: "Cotton cloud", group: "Aura", light: L, svg: aura({ base: "#fdeff5", halo: "#ffc2da", c1: "#ffa8cb", c2: "#a8d8ff", core: "#ffffff", shape: "cloud", size: 0.682 }) },
    { id: "aura-violet-sparkle", name: "Violet sparkle", group: "Aura", svg: aura({ base: "#120d26", halo: "#9b6dff", c1: "#a77bff", c2: "#5ee0ff", core: "#f4efff", shape: "sparkle", halo2: "#173a6b" }) },
    { id: "aura-sunset", name: "Sunset orb", group: "Aura", svg: aura({ base: "#26101c", halo: "#ff7a59", c1: "#ff6a4d", c2: "#ffcb6b", core: "#fff1d6", shape: "orb", halo2: "#6b2245" }) },
    { id: "aura-matcha", name: "Matcha bloom", group: "Aura", light: L, svg: aura({ base: "#eef0e2", halo: "#c2d69a", c1: "#9cbf6a", c2: "#ece59a", core: "#fbfbe9", shape: "bloom", rot: 45 }) },
    { id: "aura-ice-heart", name: "Ice heart", group: "Aura", light: L, svg: aura({ base: "#eef5fb", halo: "#b5dcff", c1: "#8ccaff", c2: "#d9c6ff", core: "#ffffff", shape: "heart" }) },
    { id: "aura-ember-ring", name: "Ember halo", group: "Aura", svg: aura({ base: "#140b08", halo: "#ff8a3d", c1: "#ff7a2f", c2: "#ffd36b", core: "#fff0c9", shape: "ring", halo2: "#4a1d0e" }) },
    { id: "aura-lavender-moon", name: "Lavender moon", group: "Aura", light: L, svg: aura({ base: "#f0ebfa", halo: "#c8b5f5", c1: "#a891f0", c2: "#f3b6e3", core: "#ffffff", shape: "moon", rot: -10 }) },
    { id: "aura-teal-flower", name: "Midnight flower", group: "Aura", svg: aura({ base: "#071a1c", halo: "#2fc4b2", c1: "#36d6c1", c2: "#8ff0a8", core: "#eafff7", shape: "flower", halo2: "#0d3b4a" }) },
    { id: "aura-blush-sparkle", name: "Blush sparkle", group: "Aura", light: L, svg: aura({ base: "#fbece9", halo: "#ffb7a8", c1: "#ff9a8a", c2: "#ffd0e0", core: "#ffffff", shape: "sparkle" }) },

    // Illustrated
    { id: "rain-night", name: "Rainy night", group: "Illustrated", anim: true, ...rainWindow({ sky1: "#0d1424", sky2: "#1c2236", bokeh: ["#ffb35c", "#ff6f6f", "#7fb2ff", "#ffd27a", "#c48bff"], frame: "#0a0d16", fog: "rgba(160,180,220,0.06)" }) },
    { id: "rain-day", name: "Rainy afternoon", group: "Illustrated", anim: true, ...rainWindow({ sky1: "#8fa3a8", sky2: "#5f7378", bokeh: ["#d8e6d0", "#f2e3c6", "#b9d3dc", "#ffffff"], frame: "#3a4446", fog: "rgba(230,240,240,0.12)" }) },
    { id: "rain-blush", name: "Rainy blush", group: "Illustrated", anim: true, ...rainWindow({ sky1: "#3a2333", sky2: "#5a3346", bokeh: ["#ff9fc0", "#ffc9a8", "#f5a8ff", "#ffe2b8"], frame: "#21131d", fog: "rgba(255,210,230,0.06)" }) },
    { id: "starry", name: "Starry hills", group: "Illustrated", anim: true, ...starryHills({ sky1: "#070b1f", sky2: "#2b2a5c", hillsC: ["#1b1d45", "#14163a", "#0d0f2a"], moon: "#fff3d6" }) },
    { id: "sunset-hills", name: "Sunset hills", group: "Illustrated", svg: hills({ sky1: "#ffb48a", sky2: "#ffe1c2", sun: "#fff4dc", glow: "#ffd9a0", layers: ["#e79a8c", "#c97a86", "#9c5f7e", "#6b4568"] }) },
    { id: "mint-hills", name: "Meadow", group: "Illustrated", light: L, svg: hills({ sky1: "#cfeaf2", sky2: "#f5f3e3", sun: "#fffbe9", glow: "#fff2b8", sunY: 40, layers: ["#bfe0c0", "#9fd0a6", "#7fbb8d", "#5fa077"] }) },
    { id: "dusk-hills", name: "Violet dusk", group: "Illustrated", svg: hills({ sky1: "#2a2350", sky2: "#c47aa0", sun: "#ffe6d2", glow: "#ff9fb8", sunY: 55, layers: ["#6b4b8a", "#523b73", "#3b2b5b", "#251c40"] }) },
    { id: "clouds-pink", name: "Pastel clouds", group: "Illustrated", light: L, svg: clouds({ sky1: "#ffd6e5", sky2: "#c9e4ff", cloud: "#ffffff", shade: "#f1d9ec" }) },
    { id: "clouds-blue", name: "Daydream", group: "Illustrated", light: L, svg: clouds({ sky1: "#8ec5ff", sky2: "#dff0ff", cloud: "#ffffff", shade: "#cfe0f5" }) },

    // Silk
    { id: "silk-champagne", name: "Champagne silk", group: "Silk", light: L, svg: silk({ base: "#d9c2a3", shadow: "#9a7e5d", mid: "#e8d4b8", light: "#fff6e8" }) },
    { id: "silk-rose", name: "Rose silk", group: "Silk", svg: silk({ base: "#b7687c", shadow: "#6b2a3d", mid: "#d68c9f", light: "#ffd9e2", angle: 14 }) },
    { id: "silk-midnight", name: "Midnight silk", group: "Silk", svg: silk({ base: "#1a2140", shadow: "#070a18", mid: "#3a4a80", light: "#a9b8f0" }) },
    { id: "silk-sage", name: "Sage silk", group: "Silk", light: L, svg: silk({ base: "#a9b89a", shadow: "#5f6e54", mid: "#c3d0b5", light: "#f2f7e8", angle: 20 }) },
    { id: "silk-lilac", name: "Lilac silk", group: "Silk", light: L, svg: silk({ base: "#b9a5d6", shadow: "#6d5a8f", mid: "#d2c2ea", light: "#f8f1ff", angle: -24 }) },
    { id: "silk-noir", name: "Noir silk", group: "Silk", svg: silk({ base: "#1b1b1f", shadow: "#050506", mid: "#3a3a42", light: "#b9b9c4", angle: 10 }) },

    // Simple gradients (kept from v1)
    { id: "dusk", name: "Dusk", group: "Gradient", css: "linear-gradient(160deg,#2b1e3f 0%,#6b3f6b 45%,#e08a5f 100%)" },
    { id: "ocean", name: "Ocean", group: "Gradient", css: "linear-gradient(160deg,#0f2027 0%,#203a43 50%,#2c5364 100%)" },
    { id: "forest", name: "Forest", group: "Gradient", css: "linear-gradient(160deg,#0b1f17 0%,#1f4d3a 55%,#6b8f5e 100%)" },
    { id: "aurora", name: "Aurora", group: "Gradient", css: "radial-gradient(ellipse at 20% 20%,#3dd6b0 0%,transparent 45%),radial-gradient(ellipse at 80% 30%,#7b5cff 0%,transparent 50%),linear-gradient(180deg,#081325,#0d1b33)" },
    { id: "night", name: "Midnight", group: "Gradient", css: "radial-gradient(circle at 70% 20%,#2a3a6b 0%,transparent 40%),linear-gradient(180deg,#05070f,#141a2e)" },
    { id: "slate", name: "Slate", group: "Gradient", css: "linear-gradient(160deg,#1f2229 0%,#2f343f 100%)" },
  ];
  const byId = Object.fromEntries(list.map((s) => [s.id, s]));

  // ---------- Rendering ----------
  let anim = null;
  function stop() { if (anim) { cancelAnimationFrame(anim.raf); window.removeEventListener("resize", anim.onResize); anim = null; } }

  function mountCanvas(el, scene, still) {
    const c = document.createElement("canvas");
    c.style.cssText = "display:block;width:100%;height:100%";
    el.appendChild(c);
    const ctx = c.getContext("2d");
    let state;
    const size = () => {
      const dpr = still ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.round(el.clientWidth * dpr)), h = Math.max(1, Math.round(el.clientHeight * dpr));
      c.width = w; c.height = h; state = scene.setup(w, h);
      return [w, h];
    };
    let [w, h] = size();
    if (still) { for (let i = 0; i < 3; i++) scene.draw(ctx, w, h, state, 1); return; }
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(4, (now - last) / 16.67); last = now;
      scene.draw(ctx, w, h, state, dt);
      if (!reduced()) anim.raf = requestAnimationFrame(loop);
    };
    let rt;
    const onResize = () => { clearTimeout(rt); rt = setTimeout(() => { [w, h] = size(); if (reduced()) scene.draw(ctx, w, h, state, 1); }, 150); };
    anim = { raf: requestAnimationFrame(loop), onResize };
    window.addEventListener("resize", onResize);
  }

  function render(el, id, { thumb = false } = {}) {
    const s = byId[id] || byId.dusk;
    if (!thumb) stop();
    el.innerHTML = ""; el.style.background = "";
    if (s.css) el.style.background = s.css;
    else if (s.svg) el.innerHTML = s.svg();
    else if (s.canvas) mountCanvas(el, s, thumb);
    if (!thumb) {
      el.classList.toggle("grainy", s.group === "Aura" || s.group === "Silk");
    }
    return s;
  }

  window.Scenes = { list, byId, render, stop, groups: ["Aura", "Illustrated", "Silk", "Gradient"] };
})();
