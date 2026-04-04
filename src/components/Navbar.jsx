"use client"
import { UserButton } from '@clerk/nextjs'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export default function Navbar({ mode, avgLoad, criticalCount }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const getModeColor = () => {
    if (mode === "traffic")  return "from-orange-500 to-red-500"
    if (mode === "energy")   return "from-yellow-400 to-orange-500"
    if (mode === "water")    return "from-blue-400 to-cyan-500"
    if (mode === "disaster") return "from-red-500 to-rose-700"
  }

  return (
    <nav className="border-b border-gray-800 dark:bg-gray-950 bg-white px-6 py-3">
      <div className="flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getModeColor()} flex items-center justify-center text-sm font-bold text-white shadow-lg`}>
            U
          </div>
          <div>
            <h1 className="text-lg font-black dark:text-white text-gray-900 leading-none">
              Urban<span className="text-red-500">Twins</span>
            </h1>
            <p className="text-xs dark:text-gray-500 text-gray-400">Smart City Digital Twin</p>
          </div>
        </div>

        {/* Center — live status bar */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${avgLoad > 70 ? 'bg-red-500' : 'bg-green-500'}`} />
            <span className="text-xs dark:text-gray-400 text-gray-500 font-medium">
              System Load: <span className={`font-bold ${avgLoad > 70 ? 'text-red-400' : 'text-green-400'}`}>{avgLoad}%</span>
            </span>
          </div>
          <div className="w-px h-4 dark:bg-gray-700 bg-gray-300" />
          <div className="flex items-center gap-2">
            <span className="text-xs dark:text-gray-400 text-gray-500 font-medium">
              Critical Zones: <span className={`font-bold ${criticalCount > 0 ? 'text-red-400' : 'text-green-400'}`}>{criticalCount}</span>
            </span>
          </div>
          <div className="w-px h-4 dark:bg-gray-700 bg-gray-300" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-400 font-medium">Live</span>
          </div>
        </div>

        {/* Right — theme + user */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-9 h-9 rounded-lg dark:bg-gray-800 bg-gray-100 dark:hover:bg-gray-700 hover:bg-gray-200 flex items-center justify-center transition-all"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          )}

          {/* Mode badge */}
          <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getModeColor()} text-white text-xs font-bold uppercase shadow`}>
            {mode}
          </div>

          {/* Clerk user button */}
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </div>
    </nav>
  )
}