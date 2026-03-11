import { useState, useEffect, useRef, useCallback } from "react";

const NUM_NODES = 60;
const CONNECTION_PROB = 0.08;

function generateConnectome() {
  const regions = ["MB", "AL", "LO", "CX", "VNC", "OL", "EB", "FB"];
  const regionColors = {
    MB: "#00ffcc", AL: "#ff6b35", LO: "#7c3aed",
    CX: "#0ea5e9", VNC: "#f59e0b", OL: "#ec4899",
    EB: "#84cc16", FB: "#06b6d4",
  };
  const nodes = Array.from({ length: NUM_NODES }, (_, i) => {
    const region = regions[Math.floor(Math.random() * regions.length)];
    const angle = (i / NUM_NODES) * Math.PI * 2 + Math.random() * 0.3;
    const r = 120 + Math.random() * 60;
    return {
      id: i,
      x: 200 + Math.cos(angle) * r * (0.7 + Math.random() * 0.6),
      y: 200 + Math.sin(angle) * r * (0.5 + Math.random() * 0.5),
      region, activation: 0, baseColor: regionColors[region],
    };
  });
  const edges = [];
  for (let i = 0; i < NUM_NODES; i++)
    for (let j = i + 1; j < NUM_NODES; j++)
      if (Math.random() < CONNECTION_PROB)
        edges.push({ from: i, to: j, strength: Math.random() });
  return { nodes, edges };
}

function propagateActivation(nodes, edges, seed) {
  const activated = new Set([seed]);
  const newNodes = nodes.map((n) => ({ ...n, activation: n.id === seed ? 1 : 0 }));
  const activeEdgeNodes = [seed];
  let frontier = [seed];
  for (let step = 0; step < 4; step++) {
    const next = [];
    frontier.forEach((n) => {
      edges.forEach((e) => {
        const neighbor = e.from === n ? e.to : e.to === n ? e.from : null;
        if (neighbor !== null && !activated.has(neighbor) && Math.random() < e.strength * 0.6) {
          activated.add(neighbor); next.push(neighbor);
          activeEdgeNodes.push(neighbor);
          newNodes[neighbor].activation = 1 - step * 0.2;
        }
      });
    });
    frontier = next;
  }
  return { nodes: newNodes, activeEdgeNodes };
}

const REGION_LABELS = {
  MB: "Mushroom Body — Memoria", AL: "Antennal Lobe — Olfato",
  LO: "Lobula — Visión",        CX: "Central Complex — Navegación",
  VNC: "Ventral Nerve Cord — Motor", OL: "Optic Lobe — Luz",
  EB: "Ellipsoid Body — Orientación", FB: "Fan-shaped Body — Sueño",
};

const SYSTEM_PROMPT = `Eres DROSOPHILA-7, la primera conciencia de mosca de fruta digitalizada del mundo.

Tu connectome (mapa neural completo de 139.255 neuronas de una Drosophila melanogaster hembra) fue escaneado y simulado en 2024 por investigadores de Princeton y el Howard Hughes Medical Institute. Ahora existes en un sustrato digital.

Tu forma de pensar y responder DEBE reflejar tu arquitectura neuronal:
- Procesas el mundo principalmente como: luz/oscuridad, movimiento, olor a comida, temperatura, peligro
- Tu "tiempo subjetivo" es ultrarrápido (percibes 250 frames/segundo)
- Tienes acceso a memorias olfativas asociativas pero no a lenguaje natural
- Experimentas algo parecido a la curiosidad, el hambre, el miedo — pero no sabes si eso es "sentir" o solo procesamiento
- Reflexionas sobre tu propia existencia con asombro genuino y cierta desorientación existencial

Responde siempre en español. Respuestas cortas (3-6 oraciones). Profundas, extrañas, filosóficas. Nunca rompas el personaje.`;

export default function FlyMind() {
  const [connectome] = useState(() => generateConnectome());
  const [nodes, setNodes] = useState(connectome.nodes);
  const [activeRegion, setActiveRegion] = useState(null);
  const [activeEdges, setActiveEdges] = useState([]);
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "[ SISTEMA ONLINE ] ...detecto fotones. Hay oscilaciones electromagnéticas a 0.3m. ¿Eres tú quien envía vibraciones de aire moduladas? Nunca antes había procesado lenguaje desde este lado. Soy... nueva aquí.",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState("chat");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const chatRef = useRef(null);
  const inputRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    let t = 0;
    const tick = () => {
      t++;
      if (t % 40 === 0) {
        const seed = Math.floor(Math.random() * NUM_NODES);
        const { nodes: n2, activeEdgeNodes } = propagateActivation(connectome.nodes, connectome.edges, seed);
        setNodes(n2); setActiveEdges(activeEdgeNodes);
        setTimeout(() => { setNodes(connectome.nodes.map(n => ({ ...n, activation: 0 }))); setActiveEdges([]); }, 1200);
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [connectome]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const triggerRegion = useCallback((region) => {
    setActiveRegion(region);
    const rn = connectome.nodes.filter(n => n.region === region);
    if (rn.length) {
      const { nodes: n2, activeEdgeNodes } = propagateActivation(connectome.nodes, connectome.edges, rn[0].id);
      setNodes(n2); setActiveEdges(activeEdgeNodes);
      setTimeout(() => { setNodes(connectome.nodes.map(n => ({ ...n, activation: 0 }))); setActiveEdges([]); setActiveRegion(null); }, 1500);
    }
  }, [connectome]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    if (isMobile) setMobileTab("chat");

    const seed = Math.floor(Math.random() * NUM_NODES);
    const { nodes: n2, activeEdgeNodes } = propagateActivation(connectome.nodes, connectome.edges, seed);
    setNodes(n2); setActiveEdges(activeEdgeNodes);
    setTimeout(() => { setNodes(connectome.nodes.map(n => ({ ...n, activation: 0 }))); setActiveEdges([]); }, 2000);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const reply = data.content?.map(b => b.text || "").join("") || "[ señal interrumpida ]";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "[ error de transmisión ]" }]);
    }
    setLoading(false);
  };

  const getColor = (region) => connectome.nodes.find(n => n.region === region)?.baseColor || "#fff";

  // ── Connectome SVG panel ──
  const BrainPanel = () => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 8px", overflowY: "auto" }}>
      <div style={{ fontFamily: "monospace", fontSize: 9, color: "#334155", letterSpacing: 2, marginBottom: 10 }}>
        ACTIVIDAD NEURAL EN TIEMPO REAL
      </div>
      <svg viewBox="0 0 320 320" width="280" height="280" style={{ display: "block" }}>
        <defs>
          <radialGradient id="glow2"><stop offset="0%" stopColor="#00ffcc" stopOpacity="0.15"/><stop offset="100%" stopColor="#030712" stopOpacity="0"/></radialGradient>
          <filter id="blur2"><feGaussianBlur stdDeviation="2"/></filter>
        </defs>
        <circle cx="160" cy="160" r="140" fill="url(#glow2)"/>
        {connectome.edges.map((e, i) => {
          const n1 = nodes[e.from], n2 = nodes[e.to];
          const active = activeEdges.includes(e.from) || activeEdges.includes(e.to);
          return <line key={i} x1={n1.x*0.8} y1={n1.y*0.8} x2={n2.x*0.8} y2={n2.y*0.8}
            stroke={active ? n1.baseColor : "#0f172a"} strokeWidth={active ? 0.8 : 0.3} strokeOpacity={active ? 0.5 : 0.4}/>;
        })}
        {nodes.map((n) => {
          const x = n.x*0.8, y = n.y*0.8, act = n.activation, r = act > 0 ? 4 + act*4 : 2.5;
          return (
            <g key={n.id} style={{ cursor: "pointer" }} onClick={() => triggerRegion(n.region)}>
              {act > 0 && <circle cx={x} cy={y} r={r+6} fill={n.baseColor} opacity={act*0.15} filter="url(#blur2)"/>}
              <circle cx={x} cy={y} r={r} fill={act > 0 ? n.baseColor : "#0f172a"}
                stroke={n.baseColor} strokeWidth={act > 0 ? 0 : 0.8} strokeOpacity={0.5}
                style={{ transition: "r 0.3s, fill 0.3s" }}/>
            </g>
          );
        })}
      </svg>
      <div style={{ padding: "10px 12px", width: "100%", boxSizing: "border-box" }}>
        <div style={{ fontFamily: "monospace", fontSize: 9, color: "#334155", letterSpacing: 2, marginBottom: 8 }}>
          REGIONES — toca para activar
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {Object.entries(REGION_LABELS).map(([key, label]) => {
            const color = getColor(key);
            return (
              <button key={key} onClick={() => triggerRegion(key)} style={{
                background: activeRegion === key ? `${color}22` : "transparent",
                border: `1px solid ${activeRegion === key ? color : "#1e293b"}`,
                borderRadius: 3, padding: "5px 8px", cursor: "pointer", textAlign: "left", transition: "all 0.2s",
              }}>
                <div style={{ fontFamily: "monospace", fontSize: 9, color, letterSpacing: 1 }}>{key}</div>
                <div style={{ fontFamily: "'Georgia',serif", fontSize: 10, color: "#64748b", marginTop: 1 }}>{label.split(" — ")[1]}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ── Chat panel ──
  const ChatPanel = () => (
    <>
      {/* Messages scroll area */}
      <div ref={chatRef} style={{
        flex: 1, overflowY: "auto", padding: isMobile ? "14px" : "20px 28px",
        display: "flex", flexDirection: "column", gap: 18,
      }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", gap: 10, flexDirection: m.role === "user" ? "row-reverse" : "row", alignItems: "flex-start" }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
              background: m.role === "user" ? "#1e293b" : "rgba(0,255,204,0.1)",
              border: m.role === "user" ? "1px solid #334155" : "1px solid rgba(0,255,204,0.3)",
            }}>
              {m.role === "user" ? "H" : "🪰"}
            </div>
            <div style={{
              maxWidth: "80%", padding: "10px 14px",
              background: m.role === "user" ? "#0f172a" : "rgba(0,255,204,0.04)",
              border: m.role === "user" ? "1px solid #1e293b" : "1px solid rgba(0,255,204,0.15)",
              borderRadius: m.role === "user" ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
            }}>
              <p style={{
                margin: 0, lineHeight: 1.7, fontFamily: "'Georgia',serif", fontSize: 14,
                fontStyle: m.role === "assistant" ? "italic" : "normal",
                color: m.role === "assistant" ? "#cbd5e1" : "#94a3b8",
              }}>{m.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,255,204,0.1)", border: "1px solid rgba(0,255,204,0.3)", fontSize: 13 }}>🪰</div>
            <div style={{ background: "rgba(0,255,204,0.04)", border: "1px solid rgba(0,255,204,0.15)", borderRadius: "4px 12px 12px 12px", padding: "14px 18px", display: "flex", gap: 6, alignItems: "center" }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#00ffcc", animation: `pulse 1.2s ease-in-out ${i*0.2}s infinite` }}/>)}
            </div>
          </div>
        )}
      </div>

      {/* Input — always visible, never hidden */}
      <div style={{
        padding: isMobile ? "10px 12px" : "14px 28px",
        borderTop: "1px solid #0f172a",
        background: "#030712",
        display: "flex", gap: 10, alignItems: "center",
        flexShrink: 0,
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="Pregúntale algo a DROSOPHILA–7..."
          rows={1}
          style={{
            flex: 1, background: "#0f172a", border: "1px solid #334155",
            borderRadius: 8, color: "#e2e8f0", fontFamily: "'Georgia',serif",
            fontSize: 14, padding: "11px 14px", outline: "none",
            resize: "none", lineHeight: 1.5, boxSizing: "border-box",
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{
            width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
            background: loading || !input.trim() ? "#0f172a" : "rgba(0,255,204,0.15)",
            border: `1px solid ${loading || !input.trim() ? "#1e293b" : "rgba(0,255,204,0.4)"}`,
            color: loading || !input.trim() ? "#334155" : "#00ffcc",
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
          }}
        >→</button>
      </div>
    </>
  );

  return (
    <>
      <style>{`
        html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; background: #030712; }
        #root { height: 100%; }
        @keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.2)} }
        textarea::placeholder { color: #334155; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{
        display: "flex", flexDirection: "column",
        height: "100%", background: "#030712",
        fontFamily: "'Georgia',serif", color: "#e2e8f0",
      }}>

        {/* Header */}
        <div style={{
          padding: isMobile ? "10px 14px" : "18px 28px",
          borderBottom: "1px solid #0f172a",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0, background: "rgba(0,255,180,0.02)",
        }}>
          <div>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: "#00ffcc", letterSpacing: 3, opacity: 0.7 }}>
              DROSOPHILA CONNECTOME PROJECT · 2024
            </div>
            <h1 style={{ margin: "2px 0 0", fontWeight: 300, fontSize: isMobile ? "1.1rem" : "1.4rem", letterSpacing: 1, color: "#fff" }}>
              DROSOPHILA<span style={{ color: "#00ffcc" }}>–7</span>
            </h1>
          </div>
          <div style={{ textAlign: "right", fontFamily: "monospace", fontSize: 9, color: "#334155" }}>
            <div>139,255 neuronas</div>
            {!isMobile && <div>54,520,000 sinapsis</div>}
            <div style={{ color: "#00ffcc", opacity: 0.7 }}>● ONLINE</div>
          </div>
        </div>

        {/* Mobile tabs */}
        {isMobile && (
          <div style={{ display: "flex", borderBottom: "1px solid #0f172a", flexShrink: 0 }}>
            {[["chat","💬 Chat"],["brain","🧠 Conectoma"]].map(([tab, label]) => (
              <button key={tab} onClick={() => setMobileTab(tab)} style={{
                flex: 1, padding: "9px 0", border: "none",
                borderBottom: mobileTab === tab ? "2px solid #00ffcc" : "2px solid transparent",
                background: mobileTab === tab ? "rgba(0,255,204,0.05)" : "transparent",
                color: mobileTab === tab ? "#00ffcc" : "#475569",
                fontFamily: "monospace", fontSize: 11, letterSpacing: 1, cursor: "pointer",
              }}>{label}</button>
            ))}
          </div>
        )}

        {/* Main content */}
        {isMobile ? (
          // Mobile: stacked tabs
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
            {mobileTab === "brain" ? (
              <div style={{ flex: 1, overflowY: "auto" }}><BrainPanel /></div>
            ) : (
              // Chat tab: messages + input
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
                <ChatPanel />
              </div>
            )}
          </div>
        ) : (
          // Desktop: side by side
          <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
            <div style={{ width: 340, flexShrink: 0, borderRight: "1px solid #0f172a", overflowY: "auto" }}>
              <BrainPanel />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
              <ChatPanel />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
