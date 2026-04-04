"use client"
import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { cityGraph } from '@/data/cityGraph'
import { dijkstra } from '@/modes/traffic'
import Navbar from '@/components/Navbar'
import { motion, AnimatePresence } from 'framer-motion'

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

const MODES = [
  { id: "traffic",  label: "Traffic",  icon: "🚗", color: "from-orange-500 to-red-500" },
  { id: "energy",   label: "Energy",   icon: "⚡", color: "from-yellow-400 to-orange-500" },
  { id: "water",    label: "Water",    icon: "💧", color: "from-blue-400 to-cyan-500" },
  { id: "disaster", label: "Disaster", icon: "🚨", color: "from-red-500 to-rose-700" },
]

const MODE_LABELS = {
  traffic:  { node: "Junction",        edge: "Road",      metric: "Congestion" },
  energy:   { node: "Power Station",   edge: "Power Line", metric: "Load" },
  water:    { node: "Water Zone",      edge: "Pipe",      metric: "Pressure" },
  disaster: { node: "City Zone",       edge: "Route",     metric: "Risk" },
}

export default function Home() {
  const [mode, setMode]             = useState("traffic")
  const [graph, setGraph]           = useState(cityGraph)
  const [start, setStart]           = useState(null)
  const [path, setPath]             = useState([])
  const [alerts, setAlerts]         = useState([])
  const [advice, setAdvice]         = useState("")
  const [aiLoading, setAiLoading]   = useState(false)
  const [floodActive, setFloodActive] = useState(false)
  const [loadHistory, setLoadHistory] = useState(
    Array(10).fill(0).map((_, i) => ({ t: i, v: 50 }))
  )

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

  // Update load history
  useEffect(() => {
    const avg = Math.round(graph.nodes.reduce((a, n) => a + n.load, 0) / graph.nodes.length)
    setLoadHistory(prev => [...prev.slice(1), { t: Date.now(), v: avg }])
  }, [graph])

  // Auto alert
  useEffect(() => {
    graph.nodes.forEach(n => {
      if (n.load > 80) {
        setAlerts(prev => {
          if (prev.find(a => a.id === n.id && Date.now() - a.ts < 10000)) return prev
          return [{
            id: n.id, label: n.label,
            load: Math.round(n.load), mode,
            time: new Date().toLocaleTimeString(),
            ts: Date.now()
          }, ...prev.slice(0, 9)]
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
    const floodZones = ["C", "E", "B"]
    setFloodActive(true)
    setGraph(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => floodZones.includes(n.id) ? { ...n, isBlocked: true } : n),
      edges: prev.edges.map(e =>
        floodZones.includes(e.from) || floodZones.includes(e.to) ? { ...e, isBlocked: true } : e
      )
    }))
    setAlerts(prev => [{
      id: "flood", label: "🌊 FLOOD — Zones C, E, B",
      load: 100, mode: "disaster",
      time: new Date().toLocaleTimeString(), ts: Date.now()
    }, ...prev])
  }

  const resetFlood = () => {
    setFloodActive(false)
    setGraph(cityGraph)
    setPath([])
    setStart(null)
  }

  const getAIAdvice = async () => {
    setAiLoading(true)
    setAdvice("")
    try {
      const criticalNode = graph.nodes.find(n => n.load > 80) || graph.nodes[0]
      const res = await fetch('/api/ai-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, zone: criticalNode.label, load: Math.round(criticalNode.load) })
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

  const avgLoad      = Math.round(graph.nodes.reduce((a, n) => a + n.load, 0) / graph.nodes.length)
  const criticalCount = graph.nodes.filter(n => n.load > 80).length
  const healthyCount  = graph.nodes.filter(n => n.load < 60).length
  const maxLoad       = Math.round(Math.max(...graph.nodes.map(n => n.load)))
  const minLoad       = Math.round(Math.min(...graph.nodes.map(n => n.load)))
  const blockedCount  = graph.nodes.filter(n => n.isBlocked).length
  const activeEdges   = graph.edges.filter(e => !e.isBlocked).length

  return (
    <div className="dark:bg-gray-950 bg-gray-100 min-h-screen text-gray-900 dark:text-white flex flex-col">

      <Navbar mode={mode} avgLoad={avgLoad} criticalCount={criticalCount} />

      {/* Mode Tabs */}
      <div className="flex items-center gap-2 px-6 py-3 dark:border-gray-800 border-gray-200 border-b dark:bg-gray-950 bg-white">
        {MODES.map(m => (
          <button key={m.id}
            onClick={() => { setMode(m.id); setPath([]); setStart(null) }}
            className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wide transition-all
              ${mode === m.id
                ? `bg-gradient-to-r ${m.color} text-white shadow-lg scale-105`
                : 'dark:bg-gray-800 bg-gray-200 dark:text-gray-400 text-gray-600 dark:hover:bg-gray-700 hover:bg-gray-300'}`}>
            {m.icon} {m.label}
          </button>
        ))}

        {mode === "disaster" && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={floodActive ? resetFlood : triggerFlood}
            className={`ml-auto px-5 py-2 rounded-xl text-sm font-bold uppercase tracking-wide transition-all
              ${floodActive ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700 animate-pulse'} text-white`}>
            {floodActive ? "🔄 Reset City" : "🌊 Trigger Flood"}
          </motion.button>
        )}
      </div>

      {/* Main content */}
      <div className="flex flex-1 gap-4 p-4" style={{ height: 'calc(100vh - 120px)' }}>

        {/* Map */}
        <div className="flex-1 rounded-2xl overflow-hidden border dark:border-gray-800 border-gray-200 shadow-xl">
          <MapView
            nodes={graph.nodes}
            edges={graph.edges}
            path={path}
            onNodeClick={handleNodeClick}
          />
        </div>

        {/* Right panel */}
        <div className="w-80 flex flex-col gap-3 overflow-y-auto">

          {/* Instruction card */}
          <div className="dark:bg-gray-900 bg-white rounded-2xl p-3 border dark:border-gray-800 border-gray-200 text-xs dark:text-gray-400 text-gray-500 flex items-center gap-2">
            <span className="text-lg">{start ? "✅" : "👆"}</span>
            {start
              ? `From: ${graph.nodes.find(n => n.id === start)?.label} — now click destination`
              : `Click any ${MODE_LABELS[mode].node} to set start point`}
          </div>

          {/* Stats grid */}
          <div className="dark:bg-gray-900 bg-white rounded-2xl p-4 border dark:border-gray-800 border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs uppercase dark:text-gray-500 text-gray-400 font-bold tracking-wider">
                📊 {MODE_LABELS[mode].metric} Stats
              </h3>
              <span className="text-xs dark:text-gray-600 text-gray-400">{mode}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Avg Load",    value: avgLoad + "%",       color: avgLoad > 70 ? "text-red-400" : "text-green-400" },
                { label: "Peak Load",   value: maxLoad + "%",       color: maxLoad > 80 ? "text-red-400" : "text-orange-400" },
                { label: "Min Load",    value: minLoad + "%",       color: "text-green-400" },
                { label: "Critical",    value: criticalCount,       color: criticalCount > 0 ? "text-red-400" : "text-green-400" },
                { label: "Healthy",     value: healthyCount,        color: "text-green-400" },
                { label: "Blocked",     value: blockedCount,        color: blockedCount > 0 ? "text-blue-400" : "text-gray-400" },
                { label: "Active Edges",value: activeEdges,         color: "text-blue-400" },
                { label: "Path Hops",   value: path.length || "—", color: "text-yellow-400" },
              ].map(stat => (
                <motion.div key={stat.label}
                  whileHover={{ scale: 1.03 }}
                  className="dark:bg-gray-800 bg-gray-100 rounded-xl p-2 text-center">
                  <p className="dark:text-gray-500 text-gray-400 text-xs">{stat.label}</p>
                  <p className={`font-bold text-base ${stat.color}`}>{stat.value}</p>
                </motion.div>
              ))}
            </div>

            {/* Mini load history bar */}
            <div className="mt-3">
              <p className="text-xs dark:text-gray-600 text-gray-400 mb-1">Load History</p>
              <div className="flex items-end gap-0.5 h-8">
                {loadHistory.map((d, i) => (
                  <div key={i}
                    className={`flex-1 rounded-sm transition-all duration-500 ${d.v > 80 ? 'bg-red-500' : d.v > 60 ? 'bg-orange-400' : 'bg-green-500'}`}
                    style={{ height: `${d.v}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Path display */}
            {path.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-2 dark:bg-gray-800 bg-gray-100 rounded-xl">
                <p className="text-xs dark:text-gray-500 text-gray-400 mb-1">
                  Optimal {MODE_LABELS[mode].edge} Path:
                </p>
                <p className="text-yellow-400 text-xs font-mono leading-relaxed">
                  {path.map(id => graph.nodes.find(n => n.id === id)?.label).join(" → ")}
                </p>
              </motion.div>
            )}
          </div>

          {/* Node list */}
          <div className="dark:bg-gray-900 bg-white rounded-2xl p-4 border dark:border-gray-800 border-gray-200">
            <h3 className="text-xs uppercase dark:text-gray-500 text-gray-400 font-bold tracking-wider mb-3">
              🗺️ {MODE_LABELS[mode].node}s
            </h3>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {graph.nodes.map(node => (
                <div key={node.id}
                  onClick={() => handleNodeClick(node.id)}
                  className="flex items-center justify-between cursor-pointer dark:hover:bg-gray-800 hover:bg-gray-100 rounded-lg px-2 py-1.5 transition-all">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      node.isBlocked ? 'bg-blue-400' :
                      node.load > 80 ? 'bg-red-400' :
                      node.load > 60 ? 'bg-orange-400' : 'bg-green-400'
                    }`} />
                    <span className="text-xs dark:text-gray-300 text-gray-700">{node.label}</span>
                  </div>
                  <span className={`text-xs font-bold ${
                    node.isBlocked ? 'text-blue-400' :
                    node.load > 80 ? 'text-red-400' :
                    node.load > 60 ? 'text-orange-400' : 'text-green-400'
                  }`}>
                    {node.isBlocked ? "BLOCKED" : Math.round(node.load) + "%"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Advisor */}
          <div className="dark:bg-gray-900 bg-white rounded-2xl p-4 border dark:border-gray-800 border-gray-200 flex-1">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs uppercase dark:text-gray-500 text-gray-400 font-bold tracking-wider">
                🤖 AI Advisor
              </h3>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={getAIAdvice}
                disabled={aiLoading}
                className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition-all">
                {aiLoading ? "Thinking..." : "Ask AI"}
              </motion.button>
            </div>
            <div className="text-xs leading-relaxed whitespace-pre-line min-h-16 dark:text-gray-300 text-gray-600">
              {aiLoading && !advice && (
                <span className="animate-pulse dark:text-gray-500 text-gray-400">
                  Analyzing {mode} infrastructure...
                </span>
              )}
              {advice}
              {!advice && !aiLoading && (
                <span className="dark:text-gray-600 text-gray-400">
                  Click "Ask AI" to get real-time recommendations for the current city state.
                </span>
              )}
            </div>
          </div>

          {/* Alert Log */}
          <div className="dark:bg-gray-900 bg-white rounded-2xl p-4 border dark:border-gray-800 border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs uppercase dark:text-gray-500 text-gray-400 font-bold tracking-wider">
                ⚠️ Alert Log
              </h3>
              <span className="text-xs dark:text-gray-600 text-gray-400">{alerts.length} events</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <AnimatePresence>
                {alerts.length === 0
                  ? <p className="dark:text-gray-600 text-gray-400 text-xs">No alerts yet...</p>
                  : alerts.map((a, i) => (
                    <motion.div
                      key={a.id + a.ts}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex justify-between items-center text-xs dark:bg-gray-800 bg-gray-100 rounded-lg p-2">
                      <div>
                        <span className={a.load > 90 ? "text-red-400" : "text-orange-400"}>
                          {a.label}
                        </span>
                        <span className="dark:text-gray-600 text-gray-400 ml-2 text-xs">
                          {a.load}%
                        </span>
                      </div>
                      <span className="dark:text-gray-600 text-gray-400">{a.time}</span>
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}