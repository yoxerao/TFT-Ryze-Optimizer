
import { useState, useEffect } from 'react'
import { fetchTFTData } from './data/loader'
import { findTopComps, VALID_ORIGINS } from './utils/optimizer'
import { TeamDisplay } from './components/TeamDisplay'

function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [teamSize, setTeamSize] = useState(9)
  const [results, setResults] = useState([])
  const [calculating, setCalculating] = useState(false)
  const [emblems, setEmblems] = useState({})
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchTFTData().then((d) => {
      setData(d)
      setLoading(false)
    })
  }, [])

  const handleOptimize = () => {
    if (!data) return;
    setCalculating(true);
    setTimeout(() => {
      const topTeams = findTopComps(data, teamSize, emblems);
      setResults(topTeams);
      setCalculating(false);
    }, 100);
  };

  const updateEmblem = (trait, delta) => {
    setEmblems(prev => {
      const next = { ...prev };
      const newVal = (next[trait] || 0) + delta;
      if (newVal <= 0) delete next[trait];
      else next[trait] = newVal;
      return next;
    });
  };

  if (loading) return <div className="min-h-screen grid place-items-center text-2xl font-mono">Loading Data...</div>

  // Filter Emblems:
  // ONLY show traits in VALID_ORIGINS
  const filteredTraits = Array.from(VALID_ORIGINS)
    .filter(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort();

  return (
    <div className="min-h-screen w-full bg-gray-900 text-gray-100 p-8 font-sans box-border">
      <header className="w-full mx-auto mb-10 text-center">
        <h1 className="text-5xl font-black bg-gradient-to-r from-teal-400 to-indigo-500 bg-clip-text text-transparent mb-4">
          Ryze Origin Optimizer
        </h1>
        <p className="text-gray-400">Set {data?.setKey || "?"} • Maximize Unique Origins</p>
      </header>

      <main className="w-full mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8 pb-20">
        {/* Sidebar Controls */}
        <aside className="lg:col-span-1 space-y-6">
          {/* Team Size */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <label className="block text-sm font-bold text-gray-400 mb-2">TEAM SIZE: {teamSize}</label>
            <input
              type="range" min="9" max="20"
              value={teamSize}
              onChange={(e) => setTeamSize(parseInt(e.target.value))}
              className="w-full accent-indigo-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Emblems */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-[600px] flex flex-col">
            <h3 className="text-sm font-bold text-gray-400 mb-2">OWNED EMBLEMS ({filteredTraits.length})</h3>

            {/* Search Bar */}
            <input
              type="text"
              placeholder="Search traits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 mb-4 text-sm focus:outline-none focus:border-indigo-500 transition"
            />

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {filteredTraits.map(trait => (
                <div key={trait} className="flex justify-between items-center text-sm group">
                  <span className="truncate w-32 text-gray-300 group-hover:text-white transition">{trait}</span>
                  <div className="flex bg-gray-900 rounded border border-gray-700">
                    <button onClick={() => updateEmblem(trait, -1)} className="px-2 hover:bg-gray-700 text-gray-500 rounded-l transition">-</button>
                    <span className="w-8 text-center text-indigo-300 font-mono">{emblems[trait] || 0}</span>
                    <button onClick={() => updateEmblem(trait, 1)} className="px-2 hover:bg-gray-700 text-indigo-400 rounded-r transition">+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleOptimize}
            disabled={calculating}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-bold text-lg hover:scale-105 transition shadow-lg shadow-indigo-900/50 disabled:opacity-50 disabled:scale-100"
          >
            {calculating ? "CALCULATING..." : "OPTIMIZE"}
          </button>
        </aside>

        {/* Results */}
        <div className="lg:col-span-3">
          <TeamDisplay comps={results} loading={calculating} />
        </div>
      </main>
    </div>
  )
}

export default App
