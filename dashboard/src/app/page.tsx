"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";


interface LogLine {
  time: string;
  tag: string;
  className: string;
  message: string;
}

export default function LandingPage() {
  // Autoplay and Simulation state
  const [cyclesCount, setCyclesCount] = useState(724);
  const [netSettled, setNetSettled] = useState(728.54);
  const [isAutoplay, setIsAutoplay] = useState(true);
  const [agentState, setAgentState] = useState("AUTOPILOT");
  const [simState, setSimState] = useState<"idle" | "scrape" | "ai_extract" | "x402_settle" | "consume" | "outage">("idle");
  
  // Console logs
  const [logs, setLogs] = useState<LogLine[]>([
    { time: "14:21:40", tag: "SYSTEM", className: "text-slate-400", message: "Proxygen Runtime v2.0.0 initializing on node-solana-mainnet..." },
    { time: "14:21:41", tag: "SAP", className: "text-slate-400", message: "Autodiscovered SAP Tool Registry. 3 tools synced: proxygen-scrape, proxygen-analyze, proxygen-route." }
  ]);
  const consoleContainerRef = useRef<HTMLDivElement>(null);
  
  // Custom Flow Dot positions
  const [flowDot, setFlowDot] = useState<{ cx: number; cy: number; color: string; opacity: number } | null>(null);
  
  // Prices states for Kimchi Premium widget
  const [upbitPrice, setUpbitPrice] = useState(68450);
  const [usdtPrice, setUsdtPrice] = useState(66180);
  
  // Accordion active FAQ keys
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Floating USDC text list
  const [floats, setFloats] = useState<{ id: number; text: string; left: string; top: string }[] | null>(null);
  const floatIdCounter = useRef(0);

  // Scroll only the console container to the bottom on new logs (does not affect window scroll)
  useEffect(() => {
    if (consoleContainerRef.current) {
      consoleContainerRef.current.scrollTo({
        top: consoleContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [logs]);

  // Log append helper
  const addLog = (tag: string, message: string, className: string) => {
    const time = new Date().toTimeString().split(" ")[0];
    setLogs(prev => [...prev, { time, tag, className, message }]);
  };

  // Flow dot animator helper
  const animateDot = (x1: number, y1: number, x2: number, y2: number, color: string, duration: number): Promise<void> => {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const run = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const cx = x1 + (x2 - x1) * progress;
        const cy = y1 + (y2 - y1) * progress;
        setFlowDot({ cx, cy, color, opacity: 0.9 });
        if (progress < 1) {
          requestAnimationFrame(run);
        } else {
          setFlowDot(null);
          resolve();
        }
      };
      requestAnimationFrame(run);
    });
  };

  // Spawn floating USDC tag
  const spawnFloat = (nodeId: "nd-con1" | "nd-con2") => {
    const id = floatIdCounter.current++;
    const coords = nodeId === "nd-con1" ? { left: "500px", top: "40px" } : { left: "500px", top: "110px" };
    setFloats(prev => [...(prev || []), { id, text: "+0.01 USDC", ...coords }]);
    setTimeout(() => {
      setFloats(prev => (prev || []).filter(f => f.id !== id));
    }, 1300);
  };

  // Simulation step controller
  useEffect(() => {
    if (!isAutoplay) return;

    let stepTimer: NodeJS.Timeout;

    const runIdle = () => {
      setSimState("idle");
      addLog("SYSTEM", "Agent idle. Waiting for next cron epoch (10m) or manual trigger.", "text-slate-400");
      stepTimer = setTimeout(runScrape, 3500);
    };

    const runScrape = () => {
      setSimState("scrape");
      setCyclesCount(prev => prev + 1);
      addLog("SYSTEM", `Initiating scrape cycle #${cyclesCount + 1}...`, "text-slate-400");
      addLog("SAP", "Querying tool registries via Synapse SAP client...", "text-slate-400");
      
      stepTimer = setTimeout(async () => {
        addLog("SAP", "Discovery registry hit: found active tool 'proxygen-scrape' (Seoul proxy node)", "text-slate-400");
        addLog("PROXY", "Routing target fetch request through Ace Data Cloud HTTP Proxy (Seoul, KR)...", "text-cyan-400");
        addLog("SCRAPE", "Accessing restricted Upbit BTC/KRW API orderbooks behind geo-IP gate...", "text-cyan-400");
        
        await animateDot(90, 32, 145, 122, "#06B6D4", 1200);
        await animateDot(240, 122, 260, 122, "#06B6D4", 800);
        
        runAIExtract();
      }, 1000);
    };

    const runAIExtract = () => {
      setSimState("ai_extract");
      addLog("SCRAPE", "Data payload fetched: 184KB unstructured HTML table (Korean strings)", "text-cyan-400");
      addLog("AI", "Unstructured table sent to Ace Data GPT-4o parser for model serialization...", "text-violet-400");
      
      stepTimer = setTimeout(async () => {
        await animateDot(308, 110, 308, 44, "#8B5CF6", 800);
        addLog("AI", "Extraction finished successfully (confidence index: 99.78%). Model: gpt-4o-mini", "text-violet-400");
        addLog("AI", "Output structured parameters verified: spot_price=₩91,240,000, depth_bids_10m=4.51M", "text-violet-400");
        
        setUpbitPrice(68300 + Math.floor(Math.random() * 300));
        setUsdtPrice(66100 + Math.floor(Math.random() * 200));

        await animateDot(308, 44, 308, 110, "#8B5CF6", 800);
        runX402Settle();
      }, 1200);
    };

    const runX402Settle = () => {
      setSimState("x402_settle");
      addLog("x402", "Aggregating cycle expenses. Proxy: $0.05 USDC | LLM: $0.02 USDC. Total: $0.07 USDC", "text-amber-500");
      addLog("x402", "Initiating x402 settlement out-flow to Ace Data wallet...", "text-amber-500");
      
      stepTimer = setTimeout(async () => {
        await animateDot(355, 122, 380, 122, "#22C55E", 800);
        setNetSettled(prev => prev - 0.07);
        addLog("x402", "Settlement tx successful. Payout hash: 5B9w...p2a1 on Solana Sepolia", "text-amber-500");
        addLog("FEED", "Publishing structured feed parameter to SAP: kimchi_premium = +3.42%", "text-emerald-500");
        runConsume();
      }, 1500);
    };

    const runConsume = () => {
      setSimState("consume");
      addLog("FEED", "Incoming consumer query request: \"BTC Kimchi Premium Signal\"", "text-emerald-500");
      addLog("x402", "Verifying consumer in-flow payment: 0.01 USDC received", "text-amber-500");
      
      stepTimer = setTimeout(async () => {
        animateDot(475, 122, 500, 52, "#22C55E", 900).then(() => spawnFloat("nd-con1"));
        animateDot(475, 122, 500, 122, "#22C55E", 900).then(() => spawnFloat("nd-con2"));
        
        setTimeout(() => {
          setNetSettled(prev => prev + 0.02);
          addLog("FEED", "Delivering live serialized JSON feeds to 2 active subscribers.", "text-emerald-500");
          addLog("SYSTEM", `Cycle #${cyclesCount + 1} completed. Outflow: 0.07 USDC | Inflow: 0.02 USDC`, "text-slate-400");
          stepTimer = setTimeout(runIdle, 3000);
        }, 1500);
      }, 1000);
    };

    // Run first step on mount
    runIdle();

    return () => clearTimeout(stepTimer);
  }, [isAutoplay, cyclesCount]);

  // Handle manual scrapings
  const forceManualScrape = () => {
    setIsAutoplay(false);
    setAgentState("MANUAL");
    setSimState("scrape");
    setCyclesCount(prev => prev + 1);
    addLog("SYSTEM", "[MANUAL] Overriding automation cron schedule. Initiating scrape cycle...", "text-slate-400");
    addLog("SCRAPE", "Triggering Ace Data Global HTTP Proxy (Korea)...", "text-cyan-400");

    setTimeout(async () => {
      await animateDot(90, 32, 145, 122, "#06B6D4", 1000);
      await animateDot(240, 122, 260, 122, "#06B6D4", 750);
      setSimState("ai_extract");
      addLog("AI", "Processing orderbook fields via GPT-4o parser...", "text-violet-400");
      
      setTimeout(async () => {
        await animateDot(308, 110, 308, 44, "#8B5CF6", 800);
        setNetSettled(prev => prev - 0.07 + 0.01);
        addLog("x402", "Settled 0.07 USDC spend and collected 0.01 USDC query fees on Solana.", "text-amber-500");
        addLog("SYSTEM", "[MANUAL] Scrape cycle complete. Returning to autopilot monitoring in 3s...", "text-slate-400");
        
        await animateDot(308, 44, 308, 110, "#8B5CF6", 800);
        
        setTimeout(() => {
          setIsAutoplay(true);
          setAgentState("AUTOPILOT");
        }, 3000);
      }, 1500);
    }, 1500);
  };

  // Handle manual outage simulator
  const simulateOutage = () => {
    setIsAutoplay(false);
    setAgentState("MANUAL");
    setSimState("outage");
    addLog("WARNING", "Proxy connection timeout from node 'kr-mobile-1' (Seoul 🇰🇷).", "text-amber-500");
    addLog("ERROR", "Proxy scraping pipeline request failed. Health Monitor Status: CRITICAL", "text-red-500");

    setTimeout(() => {
      addLog("SYSTEM", "Initiating self-healing network failover loop...", "text-slate-400");
      addLog("SAP", "Querying Synapse SAP DiscoveryRegistry for alternative proxy tools...", "text-slate-400");

      setTimeout(() => {
        addLog("SAP", "Discovery registry hit: found alternative healthy provider node 'kr-residential-3'", "text-slate-400");
        addLog("SYSTEM", "Proxy pipeline re-routed. System status: RECOVERED. Resuming loop in 2s.", "text-slate-400");

        setTimeout(() => {
          setIsAutoplay(true);
          setAgentState("AUTOPILOT");
        }, 2000);
      }, 2000);
    }, 1500);
  };

  // Toggle autoplay button
  const toggleAutoplay = () => {
    if (isAutoplay) {
      setIsAutoplay(false);
      setAgentState("MANUAL");
      addLog("SYSTEM", "Autopilot disabled. Manual override enabled.", "text-slate-400");
    } else {
      setIsAutoplay(true);
      setAgentState("AUTOPILOT");
    }
  };

  // FAQs data list
  const faqs = [
    {
      q: "How does Proxygen bypass Korea and China IP restrictions?",
      a: "Proxygen integrates with Ace Data Cloud's HTTP Proxy API, utilizing a dynamically rotating pool of residential and mobile IP gateways in restricted territories like Seoul (KR) and Beijing (CN). Every scrape query is routed through a local IP, preventing geo-blocks."
    },
    {
      q: "What is the x402 payment protocol and how does it manage billing?",
      a: "x402 is an EVM/Solana micropayment standard designed for Machine-to-Machine (M2M) billing. Proxygen holds a balance and automatically streams Solana USDC fractions to pay for resources (proxies, LLM extraction) on a per-request basis. Data consumers similarly pay the agent per query."
    },
    {
      q: "How does the Synapse Agent Protocol (SAP) self-healing loop work?",
      a: "When a target source blocks an active proxy, Proxygen's health monitor triggers a failover sequence. It queries the decentralised Synapse SAP registry, locates active alternative tools matching the required parameters, and swaps the endpoint configuration on-the-fly without service interruption."
    },
    {
      q: "Can I query Proxygen feeds using my own autonomous agent?",
      a: "Yes! Proxygen exposes standard SAP endpoints on Sepolia. Any agent configured with Synapse SAP SDK can discover the 'proxygen-scrape' tool, sign a request, and settle payments programmatically in real-time."
    },
    {
      q: "What fallbacks are used if GPT-4o fails to parse the unstructured raw data?",
      a: "If GPT-4o encounters a parsing anomaly or rate limit, Proxygen immediately reroutes the unstructured HTML payload to the cost-optimized DeepSeek-V3 engine. If the schemas mismatch, a drift incident is logged, and the agent attempts to self-heal via updated tool rules."
    }
  ];

  return (
    <div className="flex-1 w-full min-h-screen text-(--color-text-primary) font-sans relative selection:bg-cyan-500/30 selection:text-white">
      {/* Background Meshes and Grid */}
      <div className="fixed inset-0 z-[-3] bg-[#020617] pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_10%_20%,rgba(6,182,212,0.18)_0%,transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(34,197,94,0.15)_0%,transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(139,92,246,0.08)_0%,transparent_50%)]" />
      </div>
      <div className="fixed inset-0 z-[-2] pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-size-[40px_40px]" />
      <div className="fixed inset-0 z-[-1] pointer-events-none bg-[linear-gradient(to_bottom,transparent,transparent_50%,rgba(0,0,0,0.08)_50%,rgba(0,0,0,0.08))] bg-size-[100%_4px] opacity-40" />

      {/* Header (Element 2) */}
      <header className="sticky top-0 z-50 w-full px-6 py-4 bg-[#020617]/70 backdrop-blur-md border-b border-(--color-border-subtle) flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" className="w-8 h-8" alt="Proxygen Logo" />
          <span className="font-orbitron font-extrabold tracking-widest text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-emerald-400 text-lg">
            PROXYGEN
          </span>
          <div className="flex items-center gap-2 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-mono-data">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
            {agentState}
          </div>
        </div>
        <nav className="flex items-center gap-6">
          <Link href="/pitch-deck.html" target="_blank" className="text-xs font-mono-data text-(--color-text-secondary) hover:text-cyan-400 transition-colors">
            PITCH DECK
          </Link>
          <Link href="https://github.com/edycutjong/proxygen" target="_blank" className="text-xs font-mono-data text-(--color-text-secondary) hover:text-cyan-400 transition-colors">
            GITHUB
          </Link>
          <Link href="/dashboard" className="px-4 py-1.5 text-xs font-mono-data text-[#020617] bg-linear-to-r from-cyan-400 to-emerald-400 rounded-md font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all">
            LAUNCH APP
          </Link>
        </nav>
      </header>

      <div className="max-w-[1280px] mx-auto px-6 py-12 md:py-16">
        
        {/* Sponsor Track Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-950/40 border border-cyan-800/30 rounded-full text-[10px] font-mono-data text-cyan-400 tracking-wider mb-6">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          HACKATHON ENTRY: SUPERTEAM OOBE × ACE DATA CLOUD 2026
        </div>

        {/* Hero Section (Elements 3 & 4 & 5) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-20">
          
          <div className="lg:col-span-7 flex flex-col items-start">
            {/* Title (Element 3) */}
            <h1 className="font-orbitron font-extrabold text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.05] text-white mb-6">
              Autonomous Global
              <span className="block mt-1.5 text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-emerald-400">
                Data Intelligence
              </span>
            </h1>
            
            {/* Subtitle (Element 3) */}
            <p className="text-base sm:text-lg text-(--color-text-secondary) max-w-[620px] mb-8 leading-relaxed">
              Breathe life into geo-restricted feeds. Proxygen routes scraped data from closed markets via global proxies, structures raw content with GPT-4o, and publishes real-time API feeds settled via x402 micropayments on Solana.
            </p>

            {/* CTAs (Element 4) */}
            <div className="flex flex-wrap gap-4 mb-8">
              <Link href="/dashboard" className="px-7 py-3 text-sm font-mono-data text-[#020617] bg-linear-to-r from-cyan-400 to-emerald-400 rounded-lg font-semibold hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/25 transition-all">
                Launch Command Center →
              </Link>
              <Link href="/pitch-deck.html" target="_blank" className="px-7 py-3 text-sm font-mono-data text-white bg-slate-800/40 border border-(--color-border-default) rounded-lg hover:border-cyan-400 hover:bg-slate-800/60 transition-all flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                View Pitch Deck
              </Link>
              <Link href="https://youtu.be/ktl4GxVcBoI" target="_blank" className="px-7 py-3 text-sm font-mono-data text-white bg-slate-800/40 border border-(--color-border-default) rounded-lg hover:border-cyan-400 hover:bg-slate-800/60 transition-all flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Watch Demo Video
              </Link>
            </div>

            {/* Social Proof Stats (Element 5) */}
            <div className="grid grid-cols-3 gap-4 py-4 border-t border-(--color-border-subtle) w-full max-w-[580px]">
              <div>
                <div className="text-2xl font-bold font-mono-data text-cyan-400">{netSettled.toFixed(2)}</div>
                <div className="text-[10px] uppercase font-mono-data tracking-widest text-(--color-text-muted) mt-1">USDC Settled</div>
              </div>
              <div>
                <div className="text-2xl font-bold font-mono-data text-white">{cyclesCount}+</div>
                <div className="text-[10px] uppercase font-mono-data tracking-widest text-(--color-text-muted) mt-1">Auto Cycles</div>
              </div>
              <div>
                <div className="text-2xl font-bold font-mono-data text-emerald-400">99.78%</div>
                <div className="text-[10px] uppercase font-mono-data tracking-widest text-(--color-text-muted) mt-1">AI Confidence</div>
              </div>
            </div>
          </div>

          {/* Interactive Widget Display (Element 6) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="glass-card p-5 border border-(--color-border-accent) shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 blur-2xl rounded-full" />
              
              <div className="flex justify-between items-center pb-3 border-b border-(--color-border-subtle) mb-4">
                <span className="text-[10px] font-orbitron text-cyan-400 font-bold tracking-wider flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  PIPELINE EMULATOR
                </span>
                
                <div className="flex gap-2">
                  <button onClick={forceManualScrape} className="px-2 py-1 bg-slate-800 text-[10px] font-mono-data text-slate-300 border border-slate-700/60 rounded hover:border-cyan-400 hover:text-cyan-400 transition-all">
                    Scrape
                  </button>
                  <button onClick={simulateOutage} className="px-2 py-1 bg-slate-800 text-[10px] font-mono-data text-slate-300 border border-slate-700/60 rounded hover:border-red-400 hover:text-red-400 transition-all">
                    Outage
                  </button>
                  <button onClick={toggleAutoplay} className={`px-2 py-1 text-[10px] font-mono-data border rounded transition-all ${isAutoplay ? "bg-cyan-950/40 border-cyan-800 text-cyan-400" : "bg-slate-800 border-slate-700 text-slate-400"}`}>
                    {isAutoplay ? "Auto: ON" : "Auto: OFF"}
                  </button>
                </div>
              </div>

              {/* Live SVG Graph & Node Boxes */}
              <div className="relative w-full h-[230px] bg-slate-950/40 rounded-lg overflow-hidden border border-slate-800/50 mb-4">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 580 250">
                  <line x1="90" y1="32" x2="145" y2="122" stroke={simState === "scrape" ? "var(--color-accent-cyan)" : "rgba(255,255,255,0.05)"} strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="90" y1="92" x2="145" y2="122" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="90" y1="152" x2="145" y2="122" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="90" y1="212" x2="145" y2="122" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="3 3" />
                  
                  <line x1="240" y1="122" x2="260" y2="122" stroke={simState === "scrape" ? "var(--color-accent-cyan)" : "rgba(255,255,255,0.05)"} strokeWidth="1.2" />
                  <line x1="308" y1="110" x2="308" y2="44" stroke={simState === "ai_extract" ? "var(--color-accent-violet)" : "rgba(255,255,255,0.05)"} strokeWidth="1" strokeDasharray="3 3" />
                  
                  <line x1="355" y1="122" x2="380" y2="122" stroke={["x402_settle", "consume"].includes(simState) ? "var(--color-accent-green)" : "rgba(255,255,255,0.05)"} strokeWidth="1.2" />
                  
                  <line x1="475" y1="122" x2="500" y2="52" stroke={simState === "consume" ? "var(--color-accent-green)" : "rgba(255,255,255,0.05)"} strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="475" y1="122" x2="500" y2="122" stroke={simState === "consume" ? "var(--color-accent-green)" : "rgba(255,255,255,0.05)"} strokeWidth="1" />
                  <line x1="475" y1="122" x2="500" y2="192" stroke={simState === "consume" ? "var(--color-accent-green)" : "rgba(255,255,255,0.05)"} strokeWidth="1" strokeDasharray="3 3" />

                  {flowDot && (
                    <circle cx={flowDot.cx} cy={flowDot.cy} r="3" fill={flowDot.color} opacity={flowDot.opacity} style={{ filter: `drop-shadow(0 0 4px ${flowDot.color})` }} />
                  )}
                </svg>

                {/* Nodes overlays */}
                <div className={`node-box src n-src1 ${simState === "scrape" ? "active" : ""}`} style={{ left: "10px", top: "20px", width: "80px" }}>🇰🇷 Upbit</div>
                <div className="node-box src n-src2" style={{ left: "10px", top: "80px", width: "80px" }}>🇨🇳 Weibo</div>
                <div className="node-box src n-src3" style={{ left: "10px", top: "140px", width: "80px" }}>🇺🇸 Binance</div>
                <div className="node-box src n-src4" style={{ left: "10px", top: "200px", width: "80px" }}>🇪🇺 Regs</div>

                <div className={`node-box proxy n-proxy ${simState === "scrape" ? "active" : ""} ${simState === "outage" ? "offline animate-pulse" : ""}`} style={{ left: "145px", top: "110px", width: "95px" }}>
                  {simState === "outage" ? "❌ Outage" : "🌐 Ace Proxy"}
                </div>
                
                <div className={`node-box core n-core ${["scrape", "ai_extract", "x402_settle", "consume"].includes(simState) ? "active" : ""}`} style={{ left: "260px", top: "110px", width: "95px" }}>🧠 PROXYGEN</div>
                <div className={`node-box llm n-llm ${simState === "ai_extract" ? "active" : ""}`} style={{ left: "260px", top: "20px", width: "95px" }}>🤖 GPT-4o</div>
                <div className={`node-box feed n-feed ${["x402_settle", "consume"].includes(simState) ? "active" : ""}`} style={{ left: "380px", top: "110px", width: "95px" }}>📡 x402 Feed</div>

                <div className={`node-box con n-con1 ${simState === "consume" ? "active" : ""}`} style={{ left: "500px", top: "40px", width: "70px" }}>📊 Traders</div>
                <div className={`node-box con n-con2 ${simState === "consume" ? "active" : ""}`} style={{ left: "500px", top: "110px", width: "70px" }}>🤖 Agents</div>
                <div className={`node-box con n-con3 ${simState === "consume" ? "active" : ""}`} style={{ left: "500px", top: "180px", width: "70px" }}>🏛️ Protocols</div>

                {/* x402 labels */}
                <div className={`x402-tag t-proxy ${simState === "scrape" ? "active" : ""}`} style={{ left: "108px", top: "98px" }}>x402 $0.05</div>
                <div className={`x402-tag t-llm ${simState === "ai_extract" ? "active" : ""}`} style={{ left: "315px", top: "78px" }}>x402 $0.02</div>
                <div className={`x402-tag t-feed ${simState === "x402_settle" ? "active" : ""}`} style={{ left: "342px", top: "135px" }}>x402 $0.01</div>

                {/* Floats list */}
                {floats && floats.map(f => (
                  <div key={f.id} className="absolute font-mono-data text-[9px] font-bold text-green-400 pointer-events-none animate-bounce" style={{ left: f.left, top: f.top }}>
                    {f.text}
                  </div>
                ))}
              </div>

              {/* Logs output terminal console */}
              <div ref={consoleContainerRef} className="w-full h-[140px] bg-[#020617] border border-slate-800 rounded-lg p-3 overflow-y-auto font-mono-data text-[10px] space-y-1.5">
                {logs.map((log, index) => (
                  <div key={index} className="flex gap-2 leading-relaxed animate-fade-in">
                    <span className="text-slate-500 shrink-0">{log.time}</span>
                    <span className={`font-bold shrink-0 ${log.className}`}>[{log.tag}]</span>
                    <span className="text-slate-100">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Kimchi premium banner indicator (Element 5 Part 2) */}
            <div className="glass-card p-4 border border-(--color-border-subtle) flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-amber-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.077 17.657 18.657z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12.343 14.343S13 15 14 15c0-1 .5-2.5 2-3.5C15 12 13 13 12.343 14.343z" />
                </svg>
                <div>
                  <span className="block font-orbitron font-bold text-xs text-amber-500 tracking-wider">
                    ARBITRAGE gap ALERT
                  </span>
                  <span className="block text-[11px] text-(--color-text-secondary) mt-0.5">
                    Korea orderbooks detected in real-time
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono-data font-bold text-xl text-green-400">
                  +{((upbitPrice / 1320 - usdtPrice) / usdtPrice * 100).toFixed(2)}%
                </div>
                <div className="font-mono-data text-[9px] text-(--color-text-muted) mt-0.5">
                  KR: ₩{(upbitPrice * 1320).toLocaleString()} • US: ${usdtPrice.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Core Benefits/Features Section (Element 7) */}
        <section className="py-16">
          <h2 className="font-orbitron font-extrabold text-2xl tracking-widest text-center text-white mb-2 uppercase">
            Data Access Solved
          </h2>
          <p className="text-center text-xs font-mono-data tracking-widest text-cyan-400 mb-12">
            STABLE PIPELINE INFRASTRUCTURE
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="glass-card p-8 hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-12 h-12 bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 rounded-lg flex items-center justify-center mb-6 group-hover:border-cyan-400 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <h3 className="font-orbitron font-bold text-base text-white mb-3 tracking-wide">
                Residential Proxy Routing
              </h3>
              <p className="text-xs text-(--color-text-secondary) leading-relaxed">
                Connect directly through geo-restricted residential ISP subnets in Seoul, Beijing, and Tokyo. Powered by Ace Data Cloud Proxy nodes to safely bypass heavy firewall checks.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card p-8 hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-12 h-12 bg-violet-950/40 border border-violet-500/30 text-violet-400 rounded-lg flex items-center justify-center mb-6 group-hover:border-violet-400 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="font-orbitron font-bold text-base text-white mb-3 tracking-wide">
                LLM Structured Extraction
              </h3>
              <p className="text-xs text-(--color-text-secondary) leading-relaxed">
                Structures raw foreign-language HTML files into clean JSON feeds with gpt-4o-mini. Returns orderbook prices, active bids/asks, and localized sentiment.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card p-8 hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-12 h-12 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 rounded-lg flex items-center justify-center mb-6 group-hover:border-emerald-400 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-orbitron font-bold text-base text-white mb-3 tracking-wide">
                M2M x402 Micropayments
              </h3>
              <p className="text-xs text-(--color-text-secondary) leading-relaxed">
                A self-sustaining dual-flow agent. Proxygen streams micro-payments to purchase hosting, proxy IP bandwidth, and LLM requests, while charging callers fractions of a USDC per query.
              </p>
            </div>

          </div>
        </section>

        {/* Customer Testimonials Section (Element 8) */}
        <section className="py-12 border-t border-(--color-border-subtle)">
          <h2 className="font-orbitron font-extrabold text-2xl tracking-widest text-center text-white mb-2 uppercase">
            Data Trust Verified
          </h2>
          <p className="text-center text-xs font-mono-data tracking-widest text-cyan-400 mb-12">
            INTELLIGENCE FEEDS ADOPTION
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="glass-card p-6 border border-slate-800/40 relative">
              <span className="absolute top-4 right-6 text-slate-700 text-5xl font-serif">“</span>
              <p className="text-xs text-(--color-text-secondary) leading-relaxed mb-6 italic">
                Our trading desk spent thousands debugging custom VPN scripts to gather Korean market data. Proxygen automated this instantly. The kimchi premium signal paid off the x402 micropayments on day one.
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-900/60 border border-cyan-500/20 rounded-full flex items-center justify-center font-mono-data text-xs text-white">
                  QA
                </div>
                <div>
                  <span className="block text-xs font-bold text-white font-mono-data">Marcus Vance</span>
                  <span className="block text-[10px] text-cyan-400 font-mono-data uppercase tracking-wider">Quant Lead, Vance Arbitrage Labs</span>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 border border-slate-800/40 relative">
              <span className="absolute top-4 right-6 text-slate-700 text-5xl font-serif">“</span>
              <p className="text-xs text-(--color-text-secondary) leading-relaxed mb-6 italic">
                We use Proxygen endpoints to supply local Chinese sentiment indices to our autonomous agent network. The Synapse SAP discovery handles proxy failovers smoothly. It is data delivery exactly as it should be.
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-900/60 border border-emerald-500/20 rounded-full flex items-center justify-center font-mono-data text-xs text-white">
                  DS
                </div>
                <div>
                  <span className="block text-xs font-bold text-white font-mono-data">Chen Xiao</span>
                  <span className="block text-[10px] text-emerald-400 font-mono-data uppercase tracking-wider">CTO, SomaPulse Intelligence</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* FAQ Accordion Section (Element 9) */}
        <section className="py-16 border-t border-(--color-border-subtle)">
          <h2 className="font-orbitron font-extrabold text-2xl tracking-widest text-center text-white mb-2 uppercase">
            Frequently Asked
          </h2>
          <p className="text-center text-xs font-mono-data tracking-widest text-cyan-400 mb-12">
            TECHNICAL DEEP DIVE
          </p>

          <div className="max-w-[800px] mx-auto space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="glass-card border border-slate-800/50 overflow-hidden">
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-slate-800/20 transition-colors"
                >
                  <span className="text-xs font-semibold text-white tracking-wide">{faq.q}</span>
                  <span className="text-cyan-400 font-bold transition-transform duration-300" style={{ transform: activeFaq === idx ? "rotate(45deg)" : "rotate(0)" }}>
                    ＋
                  </span>
                </button>
                <div
                  className="transition-all duration-300 ease-in-out overflow-hidden"
                  style={{
                    maxHeight: activeFaq === idx ? "200px" : "0",
                    borderTop: activeFaq === idx ? "1px solid var(--color-border-subtle)" : "none"
                  }}
                >
                  <p className="px-6 py-4 text-xs text-(--color-text-secondary) leading-relaxed bg-[#020617]/40">
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Final Call to Action Section (Element 10) */}
        <section className="relative overflow-hidden glass-card p-10 md:p-14 border border-(--color-border-accent) text-center mb-16">
          <div className="absolute inset-0 z-[-1] bg-linear-to-br from-cyan-950/20 to-slate-950/50 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />

          <h2 className="font-orbitron font-extrabold text-3xl md:text-4xl text-white mb-4 tracking-tight">
            Deploy the Global Data Oxygen
          </h2>
          <p className="text-xs md:text-sm text-(--color-text-secondary) max-w-[580px] mx-auto mb-8 leading-relaxed">
            Ready to integrate automated, geo-bypassed feeds into your trading system or agent runtime? Access Proxygen feeds or launch your own autonomous scraper instance instantly.
          </p>

          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/dashboard" className="px-8 py-3.5 text-sm font-mono-data text-[#020617] bg-linear-to-r from-cyan-400 to-emerald-400 rounded-lg font-bold hover:scale-[1.02] transition-transform">
              Launch Agent Dashboard
            </Link>
            <Link href="https://github.com/edycutjong/proxygen" target="_blank" className="px-8 py-3.5 text-sm font-mono-data text-white bg-slate-900 border border-(--color-border-default) rounded-lg hover:bg-slate-950 transition-colors">
              Clone GitHub Repo
            </Link>
          </div>
        </section>

      </div>

      {/* Footer Section (Element 11) */}
      <footer className="w-full bg-[#020617] border-t border-(--color-border-subtle) py-12 px-6">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon.svg" className="w-6 h-6" alt="Proxygen Logo" />
              <span className="font-orbitron font-extrabold tracking-widest text-white text-md">
                PROXYGEN
              </span>
            </div>
            <p className="text-[11px] text-(--color-text-muted) leading-relaxed mt-1">
              Autonomous global data intelligence agent settled via x402 on Solana.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 max-w-[500px]">
            <span className="tech-pill text-[10px] bg-slate-900 px-3 py-1 rounded-full text-slate-400 font-mono-data">Solana</span>
            <span className="tech-pill text-[10px] bg-slate-900 px-3 py-1 rounded-full text-slate-400 font-mono-data">x402 Micropayments</span>
            <span className="tech-pill text-[10px] bg-slate-900 px-3 py-1 rounded-full text-slate-400 font-mono-data">Synapse SAP v2</span>
            <span className="tech-pill text-[10px] bg-slate-900 px-3 py-1 rounded-full text-slate-400 font-mono-data">Ace Data Cloud</span>
            <span className="tech-pill text-[10px] bg-slate-900 px-3 py-1 rounded-full text-slate-400 font-mono-data">Next.js 16</span>
          </div>

          <div className="text-[11px] text-(--color-text-muted) font-mono-data text-left md:text-right">
            <span>Built for Superteam Agent Bounty</span>
            <span className="block mt-1">© 2026 Edy Cu. Licensed under MIT.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
