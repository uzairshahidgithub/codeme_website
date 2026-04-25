'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

import { DEFAULT_CONFIG } from '@/lib/config/devTheme'

type ConfigKey = keyof typeof DEFAULT_CONFIG

function applyAll(cfg: typeof DEFAULT_CONFIG) {
  for (const [k, v] of Object.entries(cfg)) {
    document.documentElement.style.setProperty(k, v as string)
  }
}

const QUOTES_STORAGE_KEY = 'codemo-dev-quotes'
const MOTION_CONFIG_KEY  = 'codemo-dev-motion'

const DEFAULT_QUOTES = [
  'Your Career is your Worth',
  'Skills Matter Most',
  'Build What the World Needs',
  'Code with Purpose',
]

const DEFAULT_MOTION = {
  transitionMs: 700,
  intervalMs:   4000,
  motionPx:     20,
  fontWeight:   300,
  sizeMin:      20,
  sizeMax:      48,
  enabled:      true,
}

export default function DevThemeEditor() {
  const [config, setConfig] = useState<typeof DEFAULT_CONFIG>(DEFAULT_CONFIG)
  const [history, setHistory] = useState<(typeof DEFAULT_CONFIG)[]>([DEFAULT_CONFIG])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [savedFlash, setSavedFlash] = useState(false)
  const [pushStatus, setPushStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const jsonInputRef = useRef<HTMLInputElement>(null)
  const isMutatingHistory = useRef(false)

  const [quotes, setQuotes] = useState<string[]>(DEFAULT_QUOTES)
  const [motion, setMotion] = useState<typeof DEFAULT_MOTION>(DEFAULT_MOTION)
  const [newQuoteText, setNewQuoteText] = useState('')
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch: disable undo/redo on server, enable after client mount
  useEffect(() => { setMounted(true) }, [])

  function handleExportJson() {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'codemo-theme.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportJson(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string)
        const merged = { ...DEFAULT_CONFIG, ...parsed }
        setConfig(merged)
        applyAll(merged)
        pushHistory(merged)
        localStorage.setItem('codemo-dev-theme', JSON.stringify(merged))
      } catch { alert('Invalid JSON file') }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  useEffect(() => {
    const savedTheme = localStorage.getItem('codemo-dev-theme')
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme)
        const merged = { ...DEFAULT_CONFIG, ...parsed }
        setConfig(merged)
        setHistory([merged])
        applyAll(merged)
      } catch (e) {}
    }

    const savedQuotes = localStorage.getItem(QUOTES_STORAGE_KEY)
    if (savedQuotes) {
      try {
        const parsed = JSON.parse(savedQuotes)
        if (Array.isArray(parsed) && parsed.length > 0) setQuotes(parsed)
      } catch (e) {}
    }

    const savedMotion = localStorage.getItem(MOTION_CONFIG_KEY)
    if (savedMotion) {
      try {
        setMotion({ ...DEFAULT_MOTION, ...JSON.parse(savedMotion) })
      } catch (e) {}
    }
  }, [])

  function broadcastDevUpdate() {
    window.dispatchEvent(new Event('codemo-dev-update'))
  }

  function handleMotionChange(key: keyof typeof DEFAULT_MOTION, value: any) {
    const newMotion = { ...motion, [key]: value }
    setMotion(newMotion)
    localStorage.setItem(MOTION_CONFIG_KEY, JSON.stringify(newMotion))
    broadcastDevUpdate()
  }

  function addQuote() {
    if (!newQuoteText.trim()) return
    const next = [...quotes, newQuoteText.trim()]
    setQuotes(next)
    setNewQuoteText('')
    localStorage.setItem(QUOTES_STORAGE_KEY, JSON.stringify(next))
    broadcastDevUpdate()
  }

  function removeQuote(index: number) {
    if (quotes.length <= 1) return // must have at least 1
    const next = quotes.filter((_, i) => i !== index)
    setQuotes(next)
    localStorage.setItem(QUOTES_STORAGE_KEY, JSON.stringify(next))
    broadcastDevUpdate()
  }

  function updateQuote(index: number, val: string) {
    const next = [...quotes]
    next[index] = val
    setQuotes(next)
    localStorage.setItem(QUOTES_STORAGE_KEY, JSON.stringify(next))
    broadcastDevUpdate()
  }

  function pushHistory(newConfig: typeof DEFAULT_CONFIG) {
    const trimmed = history.slice(0, historyIndex + 1)
    const next = [...trimmed, newConfig].slice(-50)
    setHistory(next)
    setHistoryIndex(next.length - 1)
  }

  function handleChange(key: string, value: string, commit = true) {
    const newConfig = { ...config, [key as ConfigKey]: value }
    setConfig(newConfig)
    document.documentElement.style.setProperty(key, value)
    if (commit) pushHistory(newConfig)
  }

  function handleUndo() {
    if (historyIndex <= 0) return
    const ni = historyIndex - 1
    setHistoryIndex(ni)
    setConfig(history[ni])
    applyAll(history[ni])
  }

  function handleRedo() {
    if (historyIndex >= history.length - 1) return
    const ni = historyIndex + 1
    setHistoryIndex(ni)
    setConfig(history[ni])
    applyAll(history[ni])
  }

  function handleSave() {
    localStorage.setItem('codemo-dev-theme', JSON.stringify(config))
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1800)
  }

  function handleReset() {
    setConfig(DEFAULT_CONFIG)
    pushHistory(DEFAULT_CONFIG)
    localStorage.setItem('codemo-dev-theme', JSON.stringify(DEFAULT_CONFIG))
    applyAll(DEFAULT_CONFIG)
  }

  async function pushToGlobe() {
    setPushStatus('loading')
    try {
      const res = await fetch('/api/dev/save-theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      if (!res.ok) throw new Error('Failed to save')
      setPushStatus('done')
      setTimeout(() => setPushStatus('idle'), 2000)
    } catch {
      setPushStatus('error')
      setTimeout(() => setPushStatus('idle'), 2000)
    }
  }

  // --- UI Components ---

  const Section = ({ title }: { title: string }) => (
    <h3 className="text-xs font-semibold text-gray-500 mb-3 mt-5 border-b border-gray-800 pb-1 uppercase tracking-widest first:mt-0">{title}</h3>
  )

  const Slider = ({ label, configKey, min, max, unit = 'px', step = 1 }: any) => {
    const rawVal = (config as any)[configKey] || '0'
    const val = parseFloat(rawVal)
    return (
      <div className="mb-4 group">
        <div className="flex justify-between items-center mb-1.5">
          <label className="text-sm text-gray-300">{label}</label>
          <div className="flex items-center gap-1">
            <input
              type="number" value={val} step={step}
              onChange={(e) => handleChange(configKey, e.target.value + unit)}
              onBlur={(e) => handleChange(configKey, e.target.value + unit, true)}
              className="w-16 bg-[#1e1e1e] border border-gray-700 text-blue-400 px-2 py-0.5 rounded-md text-right outline-none focus:border-blue-500 text-sm font-mono transition-colors"
            />
            <span className="text-gray-600 text-xs w-5">{unit}</span>
          </div>
        </div>
        <input
          type="range" min={min} max={max} step={step} value={val}
          onChange={(e) => handleChange(configKey, e.target.value + unit, false)}
          onMouseUp={(e) => handleChange(configKey, (e.target as HTMLInputElement).value + unit, true)}
          onTouchEnd={(e) => handleChange(configKey, (e.target as HTMLInputElement).value + unit, true)}
          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-blue-500 transition-all duration-75"
          style={{ background: `linear-gradient(to right, #3b82f6 ${((val - min) / (max - min)) * 100}%, #374151 0%)` }}
        />
      </div>
    )
  }

  const ColorInput = ({ label, configKey }: any) => {
    const val = (config as any)[configKey] || ''
    const isHex = val.startsWith('#') && val.length <= 7
    return (
      <div className="mb-3">
        <label className="block text-sm text-gray-300 mb-1.5">{label}</label>
        <div className="flex items-center gap-2">
          {isHex && (
            <input
              type="color" value={val}
              onChange={(e) => handleChange(configKey, e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border border-gray-700 bg-transparent"
            />
          )}
          <input
            type="text" value={val}
            onChange={(e) => handleChange(configKey, e.target.value)}
            className="flex-1 bg-[#1e1e1e] border border-gray-700 focus:border-blue-500 outline-none rounded-md px-3 py-1.5 text-white font-mono text-sm transition-colors"
            placeholder="rgba(...) or #hex"
          />
        </div>
      </div>
    )
  }

  const Toggle = ({ label, configKey, onVal, offVal }: any) => {
    const isOn = (config as any)[configKey] === onVal
    return (
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm text-gray-300">{label}</label>
        <button
          onClick={() => handleChange(configKey, isOn ? offVal : onVal)}
          className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${isOn ? 'bg-blue-600' : 'bg-gray-700'}`}
        >
          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${isOn ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>
    )
  }

  // Slider that stores value WITH % suffix (e.g. "12%")
  const PercentSlider = ({ label, configKey, min, max }: any) => {
    const raw = (config as any)[configKey] || '12%'
    const val = parseFloat(raw)  // strips the %
    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1.5">
          <label className="text-sm text-gray-300">{label}</label>
          <div className="flex items-center gap-1">
            <input
              type="number" value={val} step={1} min={min} max={max}
              onChange={(e) => handleChange(configKey, e.target.value + '%')}
              className="w-16 bg-[#1e1e1e] border border-gray-700 text-blue-400 px-2 py-0.5 rounded-md text-right outline-none focus:border-blue-500 text-sm font-mono transition-colors"
            />
            <span className="text-gray-600 text-xs w-5">%</span>
          </div>
        </div>
        <input
          type="range" min={min} max={max} step={1} value={val}
          onChange={(e) => handleChange(configKey, e.target.value + '%', false)}
          onMouseUp={(e) => handleChange(configKey, (e.target as HTMLInputElement).value + '%', true)}
          onTouchEnd={(e) => handleChange(configKey, (e.target as HTMLInputElement).value + '%', true)}
          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-blue-500"
          style={{ background: `linear-gradient(to right, #3b82f6 ${((val - min) / (max - min)) * 100}%, #374151 0%)` }}
        />
      </div>
    )
  }

  // Select/preset input
  const SelectInput = ({ label, configKey, options }: { label: string; configKey: string; options: { label: string; value: string }[] }) => {
    const val = (config as any)[configKey] || options[0].value
    return (
      <div className="mb-3">
        <label className="block text-sm text-gray-300 mb-1.5">{label}</label>
        <div className="flex gap-2 flex-wrap">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleChange(configKey, opt.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                val === opt.value
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-[#1e1e1e] border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const canUndo = mounted && historyIndex > 0
  const canRedo = mounted && historyIndex < history.length - 1

  return (
    <div className="h-screen w-full flex flex-col bg-[#0a0a0a] text-white font-sans overflow-hidden">
      
      {/* Top Toolbar */}
      <header className="shrink-0 flex items-center justify-between gap-4 px-6 py-3 border-b border-gray-800 bg-[#111]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <span className="font-semibold text-white text-sm">Codemo Dev Editor</span>
            <span className="text-gray-500 text-xs ml-2">Component Design System</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Undo / Redo */}
          <button
            onClick={handleUndo} disabled={!canUndo}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-800"
            title="Undo (Ctrl+Z)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M3 13A9 9 0 1 0 5.3 6.4"/></svg>
          </button>
          <button
            onClick={handleRedo} disabled={!canRedo}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-800"
            title="Redo (Ctrl+Y)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M21 13A9 9 0 1 1 18.7 6.4"/></svg>
          </button>

          <button
            onClick={handleExportJson}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 transition-colors flex items-center gap-1.5"
            title="Export settings as JSON"
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export
          </button>
          <button
            onClick={() => jsonInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-yellow-400 hover:bg-yellow-500/10 border border-yellow-500/20 transition-colors flex items-center gap-1.5"
            title="Import settings from JSON"
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Import
          </button>
          <input ref={jsonInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleImportJson} />

          <div className="w-px h-6 bg-gray-700 mx-1" />

          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors"
          >
            Reset
          </button>

          <button
            onClick={pushToGlobe}
            disabled={pushStatus === 'loading'}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-purple-400 hover:bg-purple-500/10 border border-purple-500/20 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            title="Push to global codebase defaults"
          >
            {pushStatus === 'loading' && <span className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />}
            {pushStatus === 'done' && <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>}
            {pushStatus === 'error' && <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
            {pushStatus === 'idle' && <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>}
            Push to Globe
          </button>

          <button
            onClick={handleSave}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${savedFlash ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
          >
            {savedFlash ? (
              <><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>Saved!</>
            ) : (
              <><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Save</>
            )}
          </button>
        </div>
      </header>

      {/* Main Scrollable Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-[1400px] mx-auto pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            
            {/* ── GLOBAL ── */}
            <div className="bg-[#151515] rounded-2xl border border-gray-800/80 p-5 xl:col-span-3 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500"/>
                <h2 className="font-semibold text-white">Global Properties</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                  <Section title="Glass Effect" />
                  <Slider label="Gaussian Blur" configKey="--dev-glass-blur" min={0} max={100} />
                </div>
                <div>
                  <Section title="Background" />
                  <ColorInput label="Light Mode Base" configKey="--dev-bg-light" />
                  <ColorInput label="Dark Mode Base" configKey="--dev-bg-dark" />
                </div>
                <div>
                  <Section title="Primary Text" />
                  <ColorInput label="Light Text Color" configKey="--dev-text1-light" />
                  <ColorInput label="Dark Text Color" configKey="--dev-text1-dark" />
                </div>
                <div>
                  <Section title="Accent Color" />
                  <ColorInput label="Light Mode Accent" configKey="--dev-blue-light" />
                  <ColorInput label="Dark Mode Accent" configKey="--dev-blue-dark" />
                </div>
              </div>
            </div>

            {/* ── NAVBAR ── */}
            <div className="bg-[#151515] rounded-2xl border border-gray-800/80 p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"/>
                <h2 className="font-semibold text-white">Navbar</h2>
              </div>

              <Section title="Layout & Spacing" />
              <Slider label="Height" configKey="--nav-height" min={40} max={120} />
              <Slider label="Top Margin" configKey="--nav-top" min={0} max={60} />
              <Slider label="Border Radius" configKey="--nav-radius" min={0} max={40} />
              <Slider label="Horizontal Padding" configKey="--nav-px" min={0} max={60} />
              <Slider label="Link Group Gap" configKey="--nav-link-gap" min={0} max={80} />
              <Slider label="Action Buttons Gap" configKey="--nav-action-gap" min={0} max={60} />

              <Section title="Typography & Icons" />
              <Slider label="Logo Size" configKey="--nav-logo-size" min={24} max={80} />
              <Slider label="Logo Text Size" configKey="--nav-logo-text-size" min={14} max={48} />
              <Slider label="Link Text Size" configKey="--nav-link-size" min={10} max={32} />
              <Slider label="Sign Up Text Size" configKey="--nav-button-size" min={10} max={32} />
              <Slider label="Search Icon Size" configKey="--nav-search-size" min={12} max={48} />

              <Section title="Mobile View Components" />
              <Slider label="Mobile Nav Height" configKey="--mob-nav-height" min={40} max={100} />
              <Slider label="Mobile Nav Padding" configKey="--mob-nav-px" min={0} max={40} />
              <Slider label="Mobile Logo Width" configKey="--mob-nav-logo-size" min={80} max={200} />
              <Slider label="Mobile Search Popup Bottom" configKey="--mob-search-popup-bottom" min={50} max={150} />

              <Section title="Glass Color" />
              <ColorInput label="Light Mode Glass" configKey="--dev-nav-glass-light" />
              <ColorInput label="Dark Mode Glass" configKey="--dev-nav-glass-dark" />

            </div>

            {/* ── SIDEBAR ── */}
            <div className="bg-[#151515] rounded-2xl border border-gray-800/80 p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"/>
                <h2 className="font-semibold text-white">Sidebar</h2>
              </div>

              <Section title="Layout & Spacing" />
              <Slider label="Top Margin" configKey="--sidebar-top" min={60} max={200} />
              <Slider label="Item Horizontal Padding" configKey="--sidebar-item-px" min={0} max={40} />
              <Slider label="Icon-to-Label Gap" configKey="--sidebar-item-gap" min={0} max={40} />

              <Section title="Icons (all icons linked)" />
              <Slider label="All Icon Sizes (Nav + Dark/Light + Expand)" configKey="--sidebar-icon-size" min={14} max={64} />
              <Slider label="Menu Label Text Size" configKey="--sidebar-text-size" min={10} max={32} />
              <Slider label="Jamsbot Orb Size" configKey="--jamsbot-size" min={24} max={90} />

              <Section title="Mobile View Bottom Dock" />
              <Slider label="Mobile Dock Height" configKey="--mob-dock-height" min={40} max={100} />
              <Slider label="Mobile Dock Bottom Margin" configKey="--mob-dock-bottom" min={0} max={60} />
              <Slider label="Mobile Dock Padding" configKey="--mob-dock-px" min={0} max={40} />
              <Slider label="Mobile Dock Gap" configKey="--mob-dock-gap" min={0} max={80} />
              <Slider label="Mobile Dock Icon Size" configKey="--mob-dock-icon-size" min={16} max={48} />

              <Section title="Glass Color" />
              <ColorInput label="Light Mode Glass" configKey="--dev-side-glass-light" />
              <ColorInput label="Dark Mode Glass" configKey="--dev-side-glass-dark" />

              <Section title="Icon Colors" />
              <ColorInput label="Idle Icon — Light Mode" configKey="--dev-icon-idle-light" />
              <ColorInput label="Idle Icon — Dark Mode" configKey="--dev-icon-idle-dark" />
            </div>

            {/* ── AUTH CARDS ── */}
            <div className="bg-[#151515] rounded-2xl border border-gray-800/80 p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500"/>
                <h2 className="font-semibold text-white">Sign-Up / Auth Components</h2>
              </div>
              <p className="text-gray-500 text-xs mb-4 leading-relaxed">Controls the glass appearance of auth modal boxes and form input fields on Sign-in and Sign-up pages.</p>

              <Section title="Card Background Glass" />
              <ColorInput label="Light Mode Card Glass" configKey="--dev-card-glass-light" />
              <ColorInput label="Dark Mode Card Glass" configKey="--dev-card-glass-dark" />

              <Section title="Input Field Glass" />
              <ColorInput label="Light Mode Input" configKey="--dev-input-glass-light" />
              <ColorInput label="Dark Mode Input" configKey="--dev-input-glass-dark" />

              <Section title="Auth Box — Desktop Position" />
              <SelectInput
                label="Vertical Alignment"
                configKey="--auth-box-align"
                options={[
                  { label: 'Top', value: 'flex-start' },
                  { label: 'Middle', value: 'center' },
                  { label: 'Bottom', value: 'flex-end' },
                ]}
              />
              <Slider label="Max Width" configKey="--auth-box-max-w" unit="px" min={280} max={680} />
              <Slider label="Inner Padding" configKey="--auth-box-padding" unit="px" min={8} max={64} />
              <Slider label="Left Offset" configKey="--auth-box-left-offset" unit="px" min={-100} max={100} />

              <Section title="Auth Box — Mobile Position" />
              <SelectInput
                label="Mobile Vertical Alignment"
                configKey="--auth-box-align-mob"
                options={[
                  { label: 'Top', value: 'flex-start' },
                  { label: 'Middle', value: 'center' },
                  { label: 'Bottom', value: 'flex-end' },
                ]}
              />
              <Slider label="Mobile Max Width" configKey="--auth-box-max-w-mob" unit="px" min={240} max={420} />
              <Slider label="Mobile Inner Padding" configKey="--auth-box-padding-mob" unit="px" min={8} max={40} />
            </div>

            {/* ── QUOTES & MOTION ── */}
            <div className="bg-[#151515] rounded-2xl border border-gray-800/80 p-5 xl:col-span-3 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"/>
                <h2 className="font-semibold text-white">Quotes & Motion</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Motion Config */}
                <div>
                  <Section title="Motion Settings" />
                  
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm text-gray-300">Enable Animation</label>
                    <button
                      onClick={() => handleMotionChange('enabled', !motion.enabled)}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${motion.enabled ? 'bg-cyan-600' : 'bg-gray-700'}`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${motion.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-sm text-gray-300">Transition Speed</label>
                      <span className="text-cyan-400 text-sm font-mono">{motion.transitionMs}ms</span>
                    </div>
                    <input type="range" min={200} max={2000} step={50} value={motion.transitionMs} onChange={e => handleMotionChange('transitionMs', Number(e.target.value))} className="w-full accent-cyan-500" />
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-sm text-gray-300">Display Interval</label>
                      <span className="text-cyan-400 text-sm font-mono">{motion.intervalMs}ms</span>
                    </div>
                    <input type="range" min={1000} max={10000} step={500} value={motion.intervalMs} onChange={e => handleMotionChange('intervalMs', Number(e.target.value))} className="w-full accent-cyan-500" />
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-sm text-gray-300">Motion Intensity (Y Offset)</label>
                      <span className="text-cyan-400 text-sm font-mono">{motion.motionPx}px</span>
                    </div>
                    <input type="range" min={0} max={100} step={5} value={motion.motionPx} onChange={e => handleMotionChange('motionPx', Number(e.target.value))} className="w-full accent-cyan-500" />
                  </div>
                  
                  <Section title="Typography Bounds (Desktop)" />
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-sm text-gray-300">Max Size (Desktop)</label>
                      <span className="text-cyan-400 text-sm font-mono">{motion.sizeMax}px</span>
                    </div>
                    <input type="range" min={24} max={80} step={1} value={motion.sizeMax} onChange={e => handleMotionChange('sizeMax', Number(e.target.value))} className="w-full accent-cyan-500" />
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-sm text-gray-300">Font Weight</label>
                      <span className="text-cyan-400 text-sm font-mono">{motion.fontWeight}</span>
                    </div>
                    <input type="range" min={100} max={900} step={100} value={motion.fontWeight} onChange={e => handleMotionChange('fontWeight', Number(e.target.value))} className="w-full accent-cyan-500" />
                  </div>
                </div>

                {/* Quotes CRUD */}
                <div>
                  <Section title="Quotes Gallery" />
                  
                  <div className="flex gap-2 mb-4">
                    <input 
                      type="text" 
                      value={newQuoteText} 
                      onChange={e => setNewQuoteText(e.target.value)} 
                      onKeyDown={e => e.key === 'Enter' && addQuote()}
                      placeholder="Add new quote..."
                      className="flex-1 bg-[#1e1e1e] border border-gray-700 text-white px-3 py-2 rounded-lg text-sm outline-none focus:border-cyan-500"
                    />
                    <button onClick={addQuote} className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      Add
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-2">
                    {quotes.map((q, i) => (
                      <div key={i} className="flex items-center gap-2 bg-[#1a1a1a] border border-gray-800 rounded-lg p-2 group">
                        <span className="text-gray-500 text-xs w-4">{i + 1}.</span>
                        <input 
                          type="text" 
                          value={q} 
                          onChange={e => updateQuote(i, e.target.value)}
                          className="flex-1 bg-transparent border-none text-gray-200 text-sm outline-none focus:text-white"
                        />
                        <button 
                          onClick={() => removeQuote(i)}
                          disabled={quotes.length <= 1}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-400/10 p-1.5 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
