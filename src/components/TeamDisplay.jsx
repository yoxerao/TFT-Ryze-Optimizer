
import React from 'react';

export function TeamDisplay({ comps, loading }) {
    if (loading) return <div className="p-10 text-center">Thinking...</div>;
    if (!comps.length) return <div className="p-10 text-center text-gray-400">No teams found. Make sure data is loaded and Ryze exists.</div>;

    return (
        <div className="space-y-8">
            {comps.map((comp, idx) => (
                <div key={idx} className={`rounded-xl p-6 shadow-lg border relative ${comp.isEmblemComp ? 'bg-indigo-900 border-indigo-400' : 'bg-gray-800 border-gray-700'}`}>
                    {comp.isEmblemComp && (
                        <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                            EMBLEM PRIORITY
                        </div>
                    )}
                    <div className="flex justify-between items-center mb-4">
                        <h3 className={`text-xl font-bold ${comp.isEmblemComp ? 'text-white' : 'text-yellow-400'}`}>
                            {comp.isEmblemComp ? 'Bonus Option' : `Option ${idx + 1}`}
                        </h3>
                        <div className="flex gap-4">
                            <span className="bg-purple-900 px-3 py-1 rounded text-sm font-bold border border-purple-700">Origins: {comp.details.activeOrigins}</span>
                            <span className="bg-blue-900 px-3 py-1 rounded text-sm border border-blue-700">Traits: {comp.details.activeCount}</span>
                            <span className="bg-green-900 px-3 py-1 rounded text-sm border border-green-700">Score: {Math.round(comp.score)}</span>
                        </div>
                    </div>

                    {/* Units Grid */}
                    <div className="grid grid-cols-5 md:grid-cols-9 gap-2 mb-6">
                        {comp.team.map((unit, i) => (
                            <div key={i} className="flex flex-col items-center">
                                <div className="w-16 h-16 bg-gray-600 rounded-full overflow-hidden border-2 border-indigo-500 relative">
                                    {/* Use simple name fallback or attempt icon URL */}
                                    {/* URL: https://raw.communitydragon.org/latest/game/ + unit.icon (needs correction usually) */}
                                    {/* unit.icon is usually lowercased assets... */}
                                    <img
                                        src={getIconUrl(unit.icon)}
                                        alt={unit.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.style.display = 'none' }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white bg-black/50 opacity-0 hover:opacity-100 transition">
                                        {unit.name}
                                    </div>
                                </div>
                                <span className="text-xs mt-1 text-center truncate w-full">{unit.name}</span>
                            </div>
                        ))}
                    </div>

                    {/* Active Traits */}
                    <div className="flex flex-wrap gap-2">
                        {comp.details.activatedTraits.map((t, i) => (
                            <div key={i} className="flex items-center gap-1 bg-gray-700 px-2 py-1 rounded border border-gray-600 text-xs">
                                {/* <img src={getIconUrl(t.icon)} className="w-4 h-4" /> */}
                                <span>{t.name}</span>
                                <span className="bg-black/40 px-1 rounded text-[10px]">{t.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function getIconUrl(path) {
    if (!path) return "";
    // Transform "ASSETS/Characters/..." to "https://raw.communitydragon.org/latest/game/assets/characters/..."
    const lower = path.toLowerCase();
    if (lower.endsWith(".tex") || lower.endsWith(".dds")) {
        return `https://raw.communitydragon.org/latest/game/${lower.replace('.tex', '.png').replace('.dds', '.png')}`;
    }
    return "";
}
