"use client"
import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { cityGraph } from '@/data/cityGraph'
import { dijkstra } from '@/modes/traffic'
import { UserButton } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity, Zap, Droplets, AlertTriangle,
  FileText, History, GitBranch, Moon, Sun, RefreshCw
} from 'lucide-react'

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

const MODES = [
  { id: "traffic",  label: "Traffic",  icon: Activity },
  { id: "energy",   label: "Energy",   icon: Zap },
  { id: "water",    label: "Water",    icon: Droplets },
  { id: "disaster", label: "Disaster", icon: AlertTriangle },
]

const SIDEBAR_TOOLS = [
  { label: "Incident Log", icon: FileText },
  { label: "History",      icon: History },
  { label: "City Graph",   icon: GitBranch },
]

export default function Home() {
  const [mode, setMode]               = useState("traffic")
  const [graph, setGraph]             = useState(cityGraph)
  const [start, setStart]             = useState(null)
  const [path, setPath]               = useState([])
  const [alerts, setAlerts]           = useState([])
  const [advice, setAdvice]           = useState("")
  const [aiLoading, setAiLoading]     = useState(false)
  const [floodActive, setFloodActive] = useState(false)
  const [dark, setDark]               = useState(true)
  const [time, setTime]               = useState("")
  const [systemHealth] = useState({ traffic: 78, energy: 62, water: 91, disaster: 55 })

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-GB'))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  // Live simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setGraph(prev => ({
        ...prev,
        nodes: prev.nodes.map(n => ({
          ...n,
          load: Math.min(100, Math.max(10, n.load + (Math.random() * 10 - 5)))
        }))
      }))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Auto alerts
  useEffect(() => {
    graph.nodes.forEach(n => {
      if (n.load > 80) {
        setAlerts(prev => {
          if (prev.find(a => a.id === n.id && Date.now() - a.ts < 15000)) return prev
          return [{ id: n.id, label: n.label, load: Math.round(n.load), mode, time: new Date().toLocaleTimeString(), ts: Date.now() }, ...prev.slice(0, 9)]
        })
      }
    })
  }, [graph])

  const handleNodeClick = (nodeId) => {
    if (!start) { setStart(nodeId); setPath([]) }
    else {
      const blocked = graph.nodes.filter(n => n.isBlocked).map(n => n.id)
      setPath(dijkstra(graph, start, nodeId, blocked))
      setStart(null)
    }
  }

  const triggerFlood = () => {
    const zones = ["C", "E", "B"]
    setFloodActive(true)
    setGraph(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => zones.includes(n.id) ? { ...n, isBlocked: true } : n),
      edges: prev.edges.map(e => zones.includes(e.from) || zones.includes(e.to) ? { ...e, isBlocked: true } : e)
    }))
  }

  const resetFlood = () => { setFloodActive(false); setGraph(cityGraph); setPath([]); setStart(null) }

  const getAIAdvice = async () => {
    setAiLoading(true); setAdvice("")
    try {
      const critical = graph.nodes.find(n => n.load > 80) || graph.nodes[0]
      const res = await fetch('/api/ai-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, zone: critical.label, load: Math.round(critical.load) })
      })
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setAdvice(prev => prev + decoder.decode(value))
      }
    } catch { setAdvice("Failed to fetch advice.") }
    finally { setAiLoading(false) }
  }

  const avgLoad       = Math.round(graph.nodes.reduce((a, n) => a + n.load, 0) / graph.nodes.length)
  const criticalCount = graph.nodes.filter(n => n.load > 80).length
  const activeEdges   = graph.edges.filter(e => !e.isBlocked).length

  // Status badges
  const statuses = [
    { label: "Grid",   sub: "Stable", ok: true },
    { label: "Water",  sub: floodActive ? "Burst" : "Normal", ok: !floodActive },
    { label: "Flood",  sub: floodActive ? "Active" : "Clear",  ok: !floodActive },
  ]

  const bg   = dark ? "bg-[#0f1117]"   : "bg-[#f0f0ea]"
  const card = dark ? "bg-[#1a1d27]"   : "bg-white"
  const side = dark ? "bg-[#13151f]"   : "bg-[#e8e8e2]"
  const txt  = dark ? "text-gray-100"  : "text-gray-900"
  const sub  = dark ? "text-gray-400"  : "text-gray-500"
  const bdr  = dark ? "border-gray-800": "border-gray-200"

  const modeStatus = { traffic: "Live", energy: "Ok", water: "—", disaster: floodActive ? "Active" : "Clear" }
  const modeStatusColor = {
    traffic:  "text-green-400 bg-green-400/10",
    energy:   "text-green-400 bg-green-400/10",
    water:    dark ? "text-gray-500 bg-gray-700/30" : "text-gray-400 bg-gray-200",
    disaster: floodActive ? "text-red-400 bg-red-400/10" : "text-green-400 bg-green-400/10"
  }

  return (
    <div className={`${bg} ${txt} min-h-screen flex flex-col font-sans`}>

      {/* Top Navbar */}
      <div className={`flex items-center justify-between px-5 py-3 border-b ${bdr} ${card}`}>
        <div className="flex items-center gap-2">
          <span className="font-black text-lg tracking-tight">UrbanTwins<span className={`text-xs font-normal ml-0.5 ${sub}`}>v2</span></span>
          <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
            Live
          </span>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-2">
          {statuses.map(s => (
            <div key={s.label} className={`px-3 py-1 rounded-lg border text-xs font-medium ${bdr}
              ${s.ok
                ? dark ? "bg-[#1a1d27] text-gray-300" : "bg-white text-gray-700"
                : "border-red-500/40 bg-red-500/10 text-red-400"}`}>
              <span className={sub + " text-xs"}>{s.label}</span>
              <br />
              <span className="font-semibold">{s.sub}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-sm font-mono ${sub}`}>{time}</span>
          <button onClick={() => setDark(!dark)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${bdr} text-xs font-medium ${sub} hover:${txt} transition-all`}>
            {dark ? <Sun size={13} /> : <Moon size={13} />}
            {dark ? "Light" : "Dark"}
          </button>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${bdr} text-xs font-medium`}>
            <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">OP</div>
            Operator
          </div>
          <UserButton />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <div className={`w-56 ${side} border-r ${bdr} flex flex-col p-4 gap-5`}>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-widest ${sub} mb-3`}>Systems</p>
            <div className="flex flex-col gap-1">
              {MODES.map(m => {
                const Icon = m.icon
                const active = mode === m.id
                return (
                  <button key={m.id}
                    onClick={() => { setMode(m.id); setPath([]); setStart(null) }}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all
                      ${active
                        ? dark ? "bg-green-500/15 text-green-400 border-l-2 border-green-500" : "bg-green-50 text-green-700 border-l-2 border-green-600"
                        : `${sub} hover:${txt} hover:bg-white/5`}`}>
                    <span className="flex items-center gap-2"><Icon size={15} />{m.label}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${modeStatusColor[m.id]}`}>
                      {modeStatus[m.id]}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* System Health bars */}
          <div>
            <p className={`text-xs font-semibold uppercase tracking-widest ${sub} mb-3`}>System Health</p>
            <div className="flex flex-col gap-2.5">
              {Object.entries(systemHealth).map(([key, val]) => (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={`capitalize ${sub}`}>{key}</span>
                    <span className={txt}>{val}%</span>
                  </div>
                  <div className={`h-1.5 rounded-full ${dark ? "bg-gray-800" : "bg-gray-200"}`}>
                    <div className={`h-1.5 rounded-full transition-all duration-700
                      ${val > 80 ? "bg-blue-500" : val > 60 ? "bg-green-500" : "bg-red-500"}`}
                      style={{ width: `${val}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tools */}
          <div>
            <p className={`text-xs font-semibold uppercase tracking-widest ${sub} mb-3`}>Tools</p>
            <div className="flex flex-col gap-1">
              {SIDEBAR_TOOLS.map(t => {
                const Icon = t.icon
                return (
                  <button key={t.label}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${sub} hover:${txt} hover:bg-white/5 transition-all`}>
                    <Icon size={14} />{t.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden p-4 gap-4">

          {/* Mode tabs */}
          <div className={`flex items-center gap-1 ${card} border ${bdr} rounded-xl p-1 w-fit`}>
            {MODES.map(m => {
              const Icon = m.icon
              const active = mode === m.id
              return (
                <button key={m.id}
                  onClick={() => { setMode(m.id); setPath([]); setStart(null) }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${active
                      ? dark ? "bg-green-600 text-white shadow" : "bg-green-700 text-white shadow"
                      : `${sub} hover:${txt}`}`}>
                  <Icon size={14} />{m.label}
                </button>
              )
            })}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "TOTAL VEHICLES",  value: (2800 + Math.round(avgLoad * 3)).toLocaleString(), badge: "Live",       badgeColor: "text-green-400 bg-green-400/10" },
              { label: "AVG SPEED",       value: `${Math.max(15, 60 - Math.round(avgLoad * 0.4))} km/h`, badge: avgLoad > 70 ? "Slow" : "Normal", badgeColor: avgLoad > 70 ? "text-orange-400 bg-orange-400/10" : "text-green-400 bg-green-400/10" },
              { label: "CONGESTION",      value: avgLoad + "%",  badge: criticalCount > 0 ? "Critical" : "Normal", badgeColor: criticalCount > 0 ? "text-red-400 bg-red-400/10" : "text-green-400 bg-green-400/10" },
              { label: "ACTIVE ROUTES",   value: activeEdges,    badge: "Dijkstra's",  badgeColor: "text-blue-400 bg-blue-400/10" },
            ].map(stat => (
              <div key={stat.label} className={`${card} border ${bdr} rounded-xl p-4`}>
                <p className={`text-xs font-semibold uppercase tracking-widest ${sub} mb-1`}>{stat.label}</p>
                <p className={`text-3xl font-black ${txt} leading-none mb-2`}>{stat.value}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stat.badgeColor}`}>{stat.badge}</span>
              </div>
            ))}
          </div>

          {/* Map + Right panel */}
          <div className="flex gap-4 flex-1 overflow-hidden">

            {/* Map card */}
            <div className={`flex-1 ${card} border ${bdr} rounded-xl overflow-hidden flex flex-col`}>
              <div className={`flex items-center justify-between px-4 py-3 border-b ${bdr}`}>
                <div>
                  <p className={`font-semibold text-sm ${txt}`}>City Road Network</p>
                  <p className={`text-xs ${sub}`}>
                    {start
                      ? `From: ${graph.nodes.find(n => n.id === start)?.label} — click destination`
                      : "Click two nodes to compute shortest path"}
                  </p>
                </div>
                <div className="flex gap-2">
                  {mode === "disaster" && (
                    <button onClick={floodActive ? resetFlood : triggerFlood}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                        ${floodActive ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse"}`}>
                      {floodActive ? "Reset City" : "Trigger Flood"}
                    </button>
                  )}
                  <button onClick={() => { setPath([]); setStart(null) }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${bdr} ${sub} hover:${txt} transition-all`}>
                    Run Dijkstra's
                  </button>
                </div>
              </div>
              <div className="flex-1">
                <MapView nodes={graph.nodes} edges={graph.edges} path={path} onNodeClick={handleNodeClick} />
              </div>

              {/* Path display */}
              {path.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`px-4 py-3 border-t ${bdr} font-mono text-sm`}>
                  <span className={`${sub} mr-2`}>Optimal path:</span>
                  <span className="text-blue-400 font-semibold">
                    {path.map(id => graph.nodes.find(n => n.id === id)?.label.split(" ")[0]).join(" → ")}
                  </span>
                  <span className={`ml-3 text-xs ${sub}`}>({path.length - 1} hops)</span>
                </motion.div>
              )}

              {/* Legend */}
              <div className={`flex items-center gap-4 px-4 py-2 border-t ${bdr} text-xs ${sub}`}>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-500 inline-block rounded" /> Clear</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-orange-400 inline-block rounded" /> Moderate</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-500 inline-block rounded" /> Congested</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-400 inline-block rounded" /> Shortest path</span>
              </div>
            </div>

            {/* Right panel */}
            <div className="w-72 flex flex-col gap-3 overflow-y-auto">

              {/* Live metrics */}
              <div className={`${card} border ${bdr} rounded-xl p-4`}>
                <p className={`text-sm font-semibold ${txt} mb-3`}>Live Metrics</p>
                <div className="flex flex-col gap-3">
                  {graph.nodes.slice(0, 5).map(node => (
                    <div key={node.id} className="flex items-center gap-2">
                      <span className={`text-xs w-24 truncate ${sub}`}>{node.label}</span>
                      <div className={`flex-1 h-1.5 rounded-full ${dark ? "bg-gray-800" : "bg-gray-200"}`}>
                        <motion.div
                          animate={{ width: `${node.load}%` }}
                          transition={{ duration: 0.8 }}
                          className={`h-1.5 rounded-full ${node.load > 80 ? "bg-red-500" : node.load > 60 ? "bg-orange-400" : "bg-green-500"}`}
                        />
                      </div>
                      <span className={`text-xs font-mono w-8 text-right ${node.load > 80 ? "text-red-400" : node.load > 60 ? "text-orange-400" : "text-green-400"}`}>
                        {Math.round(node.load)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Advisor */}
              <div className={`${card} border ${bdr} rounded-xl p-4 flex-1`}>
                <div className="flex items-center justify-between mb-1">
                  <p className={`text-sm font-semibold ${txt}`}>AI Advisor</p>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={getAIAdvice} disabled={aiLoading}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border ${bdr} ${sub} hover:${txt} transition-all disabled:opacity-40`}>
                    <RefreshCw size={11} className={aiLoading ? "animate-spin" : ""} />
                    {aiLoading ? "Analyzing..." : "Refresh"}
                  </motion.button>
                </div>
                <p className={`text-xs ${sub} mb-3`}>Gemini-powered recommendations</p>

                {advice || aiLoading ? (
                  <div className={`${dark ? "bg-[#0f1117]" : "bg-gray-50"} rounded-lg p-3`}>
                    <p className={`text-xs font-semibold uppercase tracking-widest ${sub} mb-2`}>
                      {mode.toUpperCase()} ANALYSIS
                    </p>
                    {aiLoading && !advice
                      ? <p className={`text-xs ${sub} animate-pulse`}>Analyzing city infrastructure...</p>
                      : (
                        <div className="flex flex-col gap-2">
                          {advice.split('\n').filter(l => l.trim()).slice(0, 4).map((line, i) => (
                            <div key={i} className="flex gap-2 text-xs">
                              <span className="w-4 h-4 rounded-full bg-green-500/20 text-green-400 flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5">
                                {i + 1}
                              </span>
                              <span className={`${txt} leading-relaxed`}>{line.replace(/^\d+\.\s*/, '').replace(/^\*+\s*/, '')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                ) : (
                  <p className={`text-xs ${sub}`}>Click Refresh for real-time recommendations.</p>
                )}
              </div>

              {/* Alert Log */}
              <div className={`${card} border ${bdr} rounded-xl p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <p className={`text-sm font-semibold ${txt}`}>Alert Log</p>
                  <span className={`text-xs ${sub}`}>{alerts.length} events</span>
                </div>
                <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                  <AnimatePresence>
                    {alerts.length === 0
                      ? <p className={`text-xs ${sub}`}>No alerts yet...</p>
                      : alerts.map((a, i) => (
                        <motion.div key={a.id + a.ts}
                          initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                          className={`flex justify-between text-xs ${dark ? "bg-[#0f1117]" : "bg-gray-50"} rounded-lg px-3 py-2`}>
                          <span className={a.load > 90 ? "text-red-400" : "text-orange-400"}>{a.label}</span>
                          <span className={sub}>{a.time}</span>
                        </motion.div>
                      ))}
                  </AnimatePresence>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}