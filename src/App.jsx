import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as THREE from "three";
import {
  ChevronDown,
  Zap,
  Wind,
  Snowflake,
  Flame,
  MapPin,
  Search,
  Plus,
  Check,
  ArrowRight,
  Menu,
  X,
} from "lucide-react";

/* ==================================================================
   VOLT — a full multi-section 3D energy-drink showcase.
   Original invented brand (not a reproduction of any real trademark).
   No external animation libs available in this sandbox, so scroll
   reveals are built with IntersectionObserver + CSS transitions —
   visually equivalent to motion's whileInView, zero dependencies.
=================================================================== */

const FLAVORS = [
  {
    id: "classic",
    name: "Classic Charge",
    tag: "The original jolt",
    body: 0x0a1a3d,
    cap: 0xd4af37,
    glow: 0x2f6fed,
    icon: Zap,
    desc: "Where it started. A clean, sharp charge with no fade — the can that set the standard.",
  },
  {
    id: "arctic",
    name: "Arctic Surge",
    tag: "Cold-brewed clarity",
    body: 0x0d2f3d,
    cap: 0xc7cdd9,
    glow: 0x39c6ff,
    icon: Snowflake,
    desc: "Menthol-cool and glacier-sharp. Built for early starts and late finishes.",
  },
  {
    id: "crimson",
    name: "Crimson Ignite",
    tag: "Maximum output",
    body: 0x3d0a12,
    cap: 0xd4af37,
    glow: 0xe2231a,
    icon: Flame,
    desc: "The highest-output edition in the lineup. Bold, dark-fruited, unapologetic.",
  },
  {
    id: "storm",
    name: "Storm Zero",
    tag: "Zero sugar, full send",
    body: 0x1a1a1a,
    cap: 0x8a8f98,
    glow: 0xffffff,
    icon: Wind,
    desc: "All the charge, none of the sugar. Crisp, light, built for volume.",
  },
];

const STORES = [
  { name: "Corner Mart — MP Nagar", city: "Bhopal", stock: "In stock" },
  { name: "QuickStop — Arera Colony", city: "Bhopal", stock: "In stock" },
  { name: "FreshGo — New Market", city: "Bhopal", stock: "Low stock" },
  { name: "Metro Express — Kolar Road", city: "Bhopal", stock: "In stock" },
  { name: "Urban Basket — Indore", city: "Indore", stock: "In stock" },
  { name: "Speedy Mart — Vijay Nagar", city: "Indore", stock: "Out of stock" },
];

const TIMELINE = [
  { year: "2019", title: "First Can", body: "VOLT started as a single formula, hand-tested in one lab." },
  { year: "2021", title: "The Surge", body: "Arctic Surge launched after 400+ flavor trials." },
  { year: "2023", title: "Going Zero", body: "Storm Zero proved zero-sugar didn't mean zero charge." },
  { year: "2026", title: "Full Lineup", body: "Four editions, one standard: no static, no fade." },
];

/* ---------------- Reveal-on-scroll wrapper ---------------- */
function Reveal({ children, delay = 0, y = 28, style }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : `translateY(${y}px)`,
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ---------------- Canvas texture label ---------------- */
function makeLabelTexture(flavor) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 720;
  const ctx = canvas.getContext("2d");

  const bodyHex = "#" + flavor.body.toString(16).padStart(6, "0");
  ctx.fillStyle = bodyHex;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  grad.addColorStop(0, "rgba(255,255,255,0.08)");
  grad.addColorStop(0.5, "rgba(255,255,255,0)");
  grad.addColorStop(1, "rgba(255,255,255,0.05)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const glowHex = "#" + flavor.glow.toString(16).padStart(6, "0");
  ctx.save();
  ctx.translate(256, 300);
  ctx.fillStyle = glowHex;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.moveTo(-20, -140);
  ctx.lineTo(40, -20);
  ctx.lineTo(0, -20);
  ctx.lineTo(30, 140);
  ctx.lineTo(-45, 10);
  ctx.lineTo(-8, 10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "#F5F5F0";
  ctx.textAlign = "center";
  ctx.font = "900 92px Arial, sans-serif";
  ctx.fillText("VOLT", 256, 470);

  ctx.font = "700 22px Arial, sans-serif";
  ctx.fillStyle = glowHex;
  ctx.fillText(flavor.name.toUpperCase(), 256, 510);

  ctx.font = "600 16px Arial, sans-serif";
  ctx.fillStyle = "rgba(245,245,240,0.55)";
  ctx.fillText("ENERGY  ·  250ML  ·  CARBONATED", 256, 630);

  ctx.strokeStyle = "rgba(245,245,240,0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(60, 560);
  ctx.lineTo(452, 560);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/* ---------------- 3D Can Scene ---------------- */
function CanScene({ flavorIndex }) {
  const mountRef = useRef(null);
  const stateRef = useRef({});

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 1;
    const height = mount.clientHeight || 1;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 7);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const key = new THREE.PointLight(0x2f6fed, 18, 20);
    key.position.set(3, 3, 4);
    scene.add(key);

    const rim = new THREE.PointLight(0xe2231a, 12, 20);
    rim.position.set(-3, -1, -3);
    scene.add(rim);

    const fill = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(fill);

    const top = new THREE.SpotLight(0xffffff, 4, 15, Math.PI / 6, 0.5);
    top.position.set(0, 6, 2);
    scene.add(top);

    const canGroup = new THREE.Group();
    scene.add(canGroup);

    const bodyGeo = new THREE.CylinderGeometry(1, 1, 3.2, 64, 1, true);
    const labelMat = new THREE.MeshStandardMaterial({
      map: makeLabelTexture(FLAVORS[flavorIndex]),
      metalness: 0.6,
      roughness: 0.25,
      side: THREE.DoubleSide,
    });
    const body = new THREE.Mesh(bodyGeo, labelMat);
    canGroup.add(body);

    const capGeo = new THREE.CylinderGeometry(1, 1, 0.12, 64);
    const capMat = new THREE.MeshStandardMaterial({
      color: FLAVORS[flavorIndex].cap,
      metalness: 0.9,
      roughness: 0.2,
    });
    const capTop = new THREE.Mesh(capGeo, capMat);
    capTop.position.y = 1.66;
    canGroup.add(capTop);
    const capBottom = new THREE.Mesh(capGeo, capMat);
    capBottom.position.y = -1.66;
    canGroup.add(capBottom);

    const ringGeo = new THREE.TorusGeometry(0.85, 0.03, 16, 64);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0xc7cdd9, metalness: 1, roughness: 0.15 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 1.72;
    canGroup.add(ring);

    canGroup.rotation.x = 0.05;

    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6 - 2;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: FLAVORS[flavorIndex].glow,
      size: 0.03,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    let autoRotate = true;
    let dragging = false;
    let prevX = 0;
    let velocity = 0.004;

    const onPointerDown = (e) => {
      dragging = true;
      autoRotate = false;
      prevX = e.touches ? e.touches[0].clientX : e.clientX;
    };
    const onPointerMove = (e) => {
      if (!dragging) return;
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      const dx = x - prevX;
      prevX = x;
      canGroup.rotation.y += dx * 0.01;
      velocity = dx * 0.001;
    };
    const onPointerUp = () => {
      dragging = false;
    };

    mount.addEventListener("mousedown", onPointerDown);
    mount.addEventListener("touchstart", onPointerDown, { passive: true });
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("touchmove", onPointerMove, { passive: true });
    window.addEventListener("mouseup", onPointerUp);
    window.addEventListener("touchend", onPointerUp);

    let raf;
    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();
      if (autoRotate) {
        canGroup.rotation.y += 0.0035;
      } else if (!dragging) {
        canGroup.rotation.y += velocity;
        velocity *= 0.96;
      }
      canGroup.position.y = Math.sin(t * 0.8) * 0.08;
      particles.rotation.y = t * 0.02;
      key.position.x = Math.sin(t * 0.3) * 4;
      key.position.z = Math.cos(t * 0.3) * 4 + 2;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);
    const resizeObs = new ResizeObserver(onResize);
    resizeObs.observe(mount);

    stateRef.current = { labelMat, particleMat, capMat };

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      resizeObs.disconnect();
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      window.removeEventListener("touchend", onPointerUp);
      mount.removeEventListener("mousedown", onPointerDown);
      mount.removeEventListener("touchstart", onPointerDown);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const s = stateRef.current;
    if (!s || !s.labelMat) return;
    const flavor = FLAVORS[flavorIndex];
    s.labelMat.map = makeLabelTexture(flavor);
    s.labelMat.map.needsUpdate = true;
    s.labelMat.needsUpdate = true;
    s.capMat.color.setHex(flavor.cap);
    s.particleMat.color.setHex(flavor.glow);
  }, [flavorIndex]);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
}

/* ==================================================================
   MAIN SITE
=================================================================== */
export default function VoltSite() {
  const [flavorIndex, setFlavorIndex] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [navOpen, setNavOpen] = useState(false);
  const [fridge, setFridge] = useState([]);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("All");

  const containerRef = useRef(null);
  const sectionRefs = useRef({});

  const sections = [
    { id: "home", label: "Home" },
    { id: "editions", label: "Editions" },
    { id: "story", label: "The Charge" },
    { id: "locate", label: "Find It" },
  ];

  useEffect(() => {
    const el = containerRef.current;
    const onScroll = () => {
      if (!el) return;
      setScrolled(el.scrollTop > 40);

      let current = "home";
      let closest = Infinity;
      for (const s of sections) {
        const node = sectionRefs.current[s.id];
        if (!node) continue;
        const rect = node.getBoundingClientRect();
        const dist = Math.abs(rect.top - 90);
        if (rect.top < window.innerHeight * 0.6 && dist < closest) {
          closest = dist;
          current = s.id;
        }
      }
      setActiveSection(current);
    };
    el?.addEventListener("scroll", onScroll);
    return () => el?.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollTo = useCallback((id) => {
    const node = sectionRefs.current[id];
    if (node && containerRef.current) {
      const top = node.offsetTop - 70;
      containerRef.current.scrollTo({ top, behavior: "smooth" });
    }
    setNavOpen(false);
  }, []);

  const toggleFridge = (id) => {
    setFridge((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  };

  const cities = useMemo(() => ["All", ...new Set(STORES.map((s) => s.city))], []);
  const filteredStores = useMemo(() => {
    return STORES.filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
      const matchesCity = cityFilter === "All" || s.city === cityFilter;
      return matchesSearch && matchesCity;
    });
  }, [search, cityFilter]);

  const flavor = FLAVORS[flavorIndex];
  const glowHex = "#" + flavor.glow.toString(16).padStart(6, "0");

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100vh",
        overflowY: "auto",
        overflowX: "hidden",
        background: "#080910",
        color: "#F5F5F0",
        fontFamily: "'Inter', -apple-system, sans-serif",
        scrollBehavior: "smooth",
        position: "relative",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap');
        .volt-display { font-family: 'Anton', sans-serif; letter-spacing: 0.02em; }
        .volt-mono { font-family: 'JetBrains Mono', monospace; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 0px; }
        .navlink { position: relative; cursor: pointer; opacity: 0.65; transition: opacity 0.25s; background:none; border:none; color:#F5F5F0; font: inherit; padding: 0; }
        .navlink:hover { opacity: 1; }
        .navlink.active { opacity: 1; }
        .navlink.active::after { content:''; position:absolute; left:0; right:0; bottom:-8px; height:2px; background:${glowHex}; }
        @keyframes bounce { 0%,100% { transform: translateY(0);} 50% { transform: translateY(6px);} }
        input::placeholder { color: #5c606c; }
      `}</style>

      {/* NAV */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 5vw",
          transition: "background 0.3s, backdrop-filter 0.3s",
          background: scrolled ? "rgba(8,9,16,0.8)" : "transparent",
          backdropFilter: scrolled ? "blur(10px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.08)" : "1px solid transparent",
        }}
      >
        <button
          className="volt-display"
          onClick={() => scrollTo("home")}
          style={{ fontSize: 22, letterSpacing: "0.08em", background: "none", border: "none", color: "#F5F5F0", cursor: "pointer", padding: 0 }}
        >
          VOLT
        </button>

        <div className="volt-mono" style={{ display: "flex", gap: 32, fontSize: 12, letterSpacing: "0.08em" }}>
          {sections.map((s) => (
            <button key={s.id} className={`navlink ${activeSection === s.id ? "active" : ""}`} onClick={() => scrollTo(s.id)} style={{ display: window.innerWidth < 720 ? "none" : "block" }}>
              {s.label.toUpperCase()}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div className="volt-mono" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6, opacity: fridge.length ? 1 : 0.4 }}>
            <Check size={13} color={glowHex} /> {fridge.length}
          </div>
          <button onClick={() => setNavOpen((v) => !v)} style={{ background: "none", border: "none", color: "#F5F5F0", cursor: "pointer", display: window.innerWidth < 720 ? "block" : "none" }}>
            {navOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {navOpen && (
        <div
          className="volt-mono"
          style={{
            position: "fixed",
            top: 64,
            right: 20,
            zIndex: 60,
            background: "#12131c",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            padding: 12,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            fontSize: 13,
          }}
        >
          {sections.map((s) => (
            <button key={s.id} className="navlink" onClick={() => scrollTo(s.id)} style={{ textAlign: "left" }}>
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* ================= HOME ================= */}
      <section
        ref={(el) => (sectionRefs.current.home = el)}
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          alignItems: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle at 30% 50%, ${glowHex}22 0%, transparent 55%)`,
            transition: "background 0.6s ease",
            pointerEvents: "none",
          }}
        />
        <div style={{ padding: "0 6vw", zIndex: 2 }}>
          <div className="volt-mono" style={{ fontSize: 12, color: glowHex, letterSpacing: "0.25em", marginBottom: 18, transition: "color 0.5s" }}>
            NO. 01 — {flavor.name.toUpperCase()}
          </div>
          <h1 className="volt-display" style={{ fontSize: "clamp(48px, 7vw, 96px)", lineHeight: 0.95, margin: 0, textTransform: "uppercase" }}>
            Static
            <br />
            Won't
            <br />
            <span style={{ color: glowHex, transition: "color 0.5s" }}>Cut It.</span>
          </h1>
          <p style={{ maxWidth: 380, marginTop: 24, fontSize: 16, lineHeight: 1.6, color: "#B8BCC8" }}>
            One can, engineered for the moment your focus can't afford to slip. Drag it. Turn it. It's yours before you've even cracked it open.
          </p>
          <div style={{ marginTop: 36, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => scrollTo("editions")}
              style={{
                background: glowHex,
                color: "#080910",
                border: "none",
                padding: "14px 30px",
                borderRadius: 999,
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: "0.08em",
                cursor: "pointer",
                transition: "background 0.5s, transform 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.96)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              EXPLORE EDITIONS <ArrowRight size={14} />
            </button>
            <span className="volt-mono" style={{ fontSize: 12, color: "#7A7F8C" }}>
              DRAG CAN TO ROTATE →
            </span>
          </div>
        </div>

        <div style={{ height: "min(100vh, 640px)", width: "100%", cursor: "grab" }}>
          <CanScene flavorIndex={flavorIndex} />
        </div>

        <div style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, opacity: 0.5 }}>
          <span className="volt-mono" style={{ fontSize: 10, letterSpacing: "0.2em" }}>SCROLL</span>
          <ChevronDown size={16} style={{ animation: "bounce 1.8s infinite" }} />
        </div>
      </section>

      {/* STATS STRIP */}
      <Reveal>
        <section style={{ borderTop: "1px solid rgba(255,255,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", padding: "36px 5vw" }}>
          {[
            { label: "CAFFEINE", value: "80mg" },
            { label: "SUGAR", value: "0g" },
            { label: "VOLUME", value: "250ml" },
            { label: "EDITIONS", value: "04" },
          ].map((s, i) => (
            <div key={s.label} style={{ textAlign: "center", borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
              <div className="volt-display" style={{ fontSize: 32 }}>{s.value}</div>
              <div className="volt-mono" style={{ fontSize: 11, color: "#7A7F8C", letterSpacing: "0.15em", marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </section>
      </Reveal>

      {/* ================= EDITIONS ================= */}
      <section ref={(el) => (sectionRefs.current.editions = el)} style={{ padding: "120px 5vw" }}>
        <Reveal>
          <div className="volt-mono" style={{ fontSize: 12, color: "#7A7F8C", letterSpacing: "0.2em", marginBottom: 10 }}>02 — PICK YOUR CHARGE</div>
          <h2 className="volt-display" style={{ fontSize: "clamp(32px, 4.5vw, 56px)", marginTop: 0, textTransform: "uppercase" }}>Four currents. One jolt.</h2>
        </Reveal>

        <Reveal delay={0.1}>
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 40, marginTop: 48, alignItems: "start" }}>
            {/* detail panel */}
            <div
              style={{
                background: `${glowHex}0d`,
                border: `1px solid ${glowHex}44`,
                borderRadius: 20,
                padding: "36px 32px",
                transition: "background 0.4s, border 0.4s",
                minHeight: 260,
              }}
            >
              <div className="volt-mono" style={{ fontSize: 11, color: glowHex, letterSpacing: "0.15em", marginBottom: 10 }}>{flavor.tag.toUpperCase()}</div>
              <h3 className="volt-display" style={{ fontSize: 34, margin: 0, textTransform: "uppercase" }}>{flavor.name}</h3>
              <p style={{ color: "#B8BCC8", marginTop: 16, lineHeight: 1.7, maxWidth: 460 }}>{flavor.desc}</p>
              <button
                onClick={() => toggleFridge(flavor.id)}
                style={{
                  marginTop: 24,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: fridge.includes(flavor.id) ? glowHex : "transparent",
                  color: fridge.includes(flavor.id) ? "#080910" : "#F5F5F0",
                  border: `1px solid ${glowHex}`,
                  borderRadius: 999,
                  padding: "10px 22px",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "all 0.3s",
                }}
              >
                {fridge.includes(flavor.id) ? <Check size={14} /> : <Plus size={14} />}
                {fridge.includes(flavor.id) ? "In your fridge" : "Add to fridge"}
              </button>
            </div>

            {/* flavor grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {FLAVORS.map((f, i) => {
                const Icon = f.icon;
                const active = i === flavorIndex;
                const hex = "#" + f.glow.toString(16).padStart(6, "0");
                return (
                  <button
                    key={f.id}
                    onClick={() => setFlavorIndex(i)}
                    style={{
                      background: active ? `${hex}18` : "rgba(255,255,255,0.03)",
                      border: `1px solid ${active ? hex : "rgba(255,255,255,0.1)"}`,
                      borderRadius: 16,
                      padding: "22px 16px",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.3s",
                      color: "#F5F5F0",
                    }}
                  >
                    <Icon size={20} color={active ? hex : "#7A7F8C"} style={{ marginBottom: 12, transition: "color 0.3s" }} />
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{f.name}</div>
                    <div className="volt-mono" style={{ fontSize: 10, color: "#7A7F8C", marginTop: 6, letterSpacing: "0.08em" }}>
                      {active ? "VIEWING" : "TAP TO VIEW"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ================= STORY ================= */}
      <section ref={(el) => (sectionRefs.current.story = el)} style={{ padding: "100px 5vw 120px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <Reveal>
          <div className="volt-mono" style={{ fontSize: 12, color: "#7A7F8C", letterSpacing: "0.2em", marginBottom: 10 }}>03 — THE CHARGE</div>
          <h2 className="volt-display" style={{ fontSize: "clamp(32px, 4.5vw, 56px)", marginTop: 0, textTransform: "uppercase", maxWidth: 700 }}>
            Built one formula at a time.
          </h2>
        </Reveal>

        <div style={{ marginTop: 56, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
          {TIMELINE.map((t, i) => (
            <Reveal key={t.year} delay={i * 0.1}>
              <div style={{ borderTop: `2px solid ${glowHex}`, paddingTop: 18, transition: "border-color 0.5s" }}>
                <div className="volt-display" style={{ fontSize: 26, color: glowHex, transition: "color 0.5s" }}>{t.year}</div>
                <div style={{ fontWeight: 700, marginTop: 8 }}>{t.title}</div>
                <div style={{ color: "#8A8F9C", fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>{t.body}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= LOCATE ================= */}
      <section ref={(el) => (sectionRefs.current.locate = el)} style={{ padding: "100px 5vw 60px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <Reveal>
          <div className="volt-mono" style={{ fontSize: 12, color: "#7A7F8C", letterSpacing: "0.2em", marginBottom: 10 }}>04 — FIND IT</div>
          <h2 className="volt-display" style={{ fontSize: "clamp(32px, 4.5vw, 56px)", marginTop: 0, textTransform: "uppercase" }}>Cold cans, nearby.</h2>
        </Reveal>

        <Reveal delay={0.1}>
          <div style={{ marginTop: 36, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: "1 1 280px" }}>
              <Search size={16} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#7A7F8C" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search stores..."
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 999,
                  padding: "13px 20px 13px 44px",
                  color: "#F5F5F0",
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {cities.map((c) => (
                <button
                  key={c}
                  onClick={() => setCityFilter(c)}
                  className="volt-mono"
                  style={{
                    background: cityFilter === c ? glowHex : "rgba(255,255,255,0.04)",
                    color: cityFilter === c ? "#080910" : "#F5F5F0",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 999,
                    padding: "10px 16px",
                    fontSize: 12,
                    cursor: "pointer",
                    transition: "all 0.3s",
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 10 }}>
          {filteredStores.length === 0 && (
            <div style={{ color: "#7A7F8C", padding: "24px 0" }}>No stores match that search.</div>
          )}
          {filteredStores.map((s, i) => (
            <Reveal key={s.name} delay={i * 0.05} y={12}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "18px 22px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <MapPin size={16} color={glowHex} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                    <div className="volt-mono" style={{ fontSize: 11, color: "#7A7F8C", marginTop: 2 }}>{s.city}</div>
                  </div>
                </div>
                <div
                  className="volt-mono"
                  style={{
                    fontSize: 11,
                    padding: "5px 12px",
                    borderRadius: 999,
                    background:
                      s.stock === "In stock" ? "rgba(57,198,255,0.12)" : s.stock === "Low stock" ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.05)",
                    color: s.stock === "In stock" ? "#39c6ff" : s.stock === "Low stock" ? "#d4af37" : "#7A7F8C",
                  }}
                >
                  {s.stock.toUpperCase()}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <Reveal>
        <section style={{ padding: "100px 5vw 60px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 24 }}>
            <div>
              <h3 className="volt-display" style={{ fontSize: "clamp(28px, 4vw, 44px)", margin: 0, textTransform: "uppercase" }}>Crack one open.</h3>
              <p style={{ color: "#7A7F8C", marginTop: 10, maxWidth: 420 }}>Available wherever momentum runs out. Find the nearest cold can.</p>
            </div>
            <button
              onClick={() => scrollTo("locate")}
              style={{ background: "transparent", border: "1px solid #F5F5F0", color: "#F5F5F0", padding: "14px 30px", borderRadius: 999, fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", cursor: "pointer" }}
            >
              FIND A STORE
            </button>
          </div>
          <div className="volt-mono" style={{ marginTop: 60, fontSize: 11, color: "#4A4E58", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <span>© VOLT ENERGY — CONCEPT SHOWCASE</span>
            <span>DRAG · SCROLL · SELECT · SEARCH</span>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
