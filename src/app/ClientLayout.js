"use client";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cityGraph } from "@/data/cityGraph";
import { MODES } from "@/app/constants/modes.js";
import { cloneGraph } from "@/lib/graphUtils";
import { buildTheme } from "@/lib/theme";
import { useAlerts }      from "@/app/hooks/useAlerts.js";
import { useDisasterMode } from "@/app/hooks/useDisasterMode";
import { useEnergyMode }   from "@/app/hooks/useEnergyMode";
import { useWaterMode }    from "@/app/hooks/useWaterMode";
import { useRouting }      from "@/app/hooks/useRouting.js";
import Navbar from "@/components/Navbar";
import Drawer from "@/components/Drawer";
import { SharedStateContext } from "@/app/context/SharedStateContext";

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const router   = useRouter();

  // Derive mode & page from URL
  const page = pathname.replace("/", "") || "overview";
  const mode = ["traffic","energy","water","disaster"].includes(page) ? page : "traffic";
  const currentMode = MODES.find((m) => m.id === mode) ?? MODES[0];
  const accent = currentMode.accent;

  const [dark, setDark]             = useState(false);
  const [time, setTime]             = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifOpen, setNotifOpen]   = useState(false);
  const [graph, setGraph]           = useState(() => cloneGraph(cityGraph));

  const theme = buildTheme(dark);

  const { alerts, addAlert, clearModeAlerts } = useAlerts(graph, mode);
  const routing = useRouting(graph, currentMode);
  const { clearPath } = routing;

  const disaster = useDisasterMode({ setGraph, clearPath, addAlert, clearModeAlerts });
  const energy   = useEnergyMode({ mode, setGraph, clearPath, addAlert, clearModeAlerts });
  const water    = useWaterMode({ mode, addAlert, clearModeAlerts });

  const avgLoad       = Math.round(graph.nodes.reduce((a, n) => a + n.load, 0) / graph.nodes.length);
  const criticalCount = graph.nodes.filter((n) => n.load > 80).length;

  // Navigate instead of setState
  const switchMode = (newMode) => {
    clearPath();
    clearModeAlerts(newMode);
    router.push(`/${newMode}`);
  };

  const setPage = (p) => router.push(`/${p}`);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-GB"));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    if (!drawerOpen) return;
    const handler = (e) => {
      if (!e.target.closest("#drawer") && !e.target.closest("#menu-btn"))
        setDrawerOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [drawerOpen]);

  useEffect(() => {
    const iv = setInterval(() => {
      setGraph((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) => ({
          ...n,
          load: Math.min(100, Math.max(10, n.load + (Math.random() * 10 - 5))),
        })),
      }));
    }, 3000);
    return () => clearInterval(iv);
  }, []);

  const healthData = [
    { label: "Traffic",  val: avgLoad,                                            color: "#639922" },
    { label: "Energy",   val: energy.failedStation ? 35 : energy.avgStationLoad,  color: "#BA7517" },
    { label: "Water",    val: water.burstActive     ? 40 : 80,                    color: "#185FA5" },
    { label: "Disaster", val: disaster.floodActive  ? 25 : 85,                    color: "#A32D2D" },
  ];

  return (
    <html lang="en">
      <body style={{ background: theme.bg, color: theme.txt, minHeight: "100vh",
                     fontFamily: theme.fontBody, display: "flex", flexDirection: "column", margin: 0 }}>
        <Navbar
          theme={theme}
          page={page} setPage={setPage}
          mode={mode} setMode={switchMode}
          dark={dark} setDark={setDark}
          time={time} alerts={alerts}
          drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen}
          notifOpen={notifOpen}   setNotifOpen={setNotifOpen}
        />

        <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
          <Drawer
            theme={theme} open={drawerOpen}
            page={page} setPage={setPage}
            mode={mode} setMode={switchMode}
            alerts={alerts} criticalCount={criticalCount}
            failedStation={energy.failedStation}
            burstActive={water.burstActive}
            floodActive={disaster.floodActive}
            healthData={healthData}
            onClose={() => setDrawerOpen(false)}
          />

          <main style={{ flex: 1, padding: 16, display: "flex",
                         flexDirection: "column", gap: 12, overflow: "auto", minWidth: 0 }}>
            <SharedStateContext.Provider value={{
              theme, mode, accent, currentMode, page, graph,
              routing, disaster, energy, water,
              alerts, avgLoad, criticalCount,
              activeEdges:   graph.edges.filter((e) => !e.isBlocked).length,
              blockedCount:  graph.nodes.filter((n) => n.isBlocked).length,
              // needed by OverviewPage via buildPageProps
              avgStationLoad: energy.avgStationLoad,
              burstActive:    water.burstActive,
            }}>
              {children}
            </SharedStateContext.Provider>
          </main>
        </div>

        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.25} }`}</style>
      </body>
    </html>
  );
}