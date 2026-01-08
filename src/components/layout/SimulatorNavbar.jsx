import React from 'react';
import useSimulationStore from '../../store/useSimulationStore';

const SimulatorNavbar = () => {
  const { 
    setView, isMenuOpen, setIsMenuOpen, addLED, 
    selectedNodeId, selectedEdgeId, updateColor, deleteSelection 
  } = useSimulationStore();

  const colors = ['red', 'green', 'blue', 'yellow', 'orange'];

  return (
    <header className="h-[50px] bg-[#1e1e1e] flex items-center px-5 border-b border-[#333] z-[100] gap-4">
      {/* Back Button */}
      <button 
        onClick={() => setView('landing')} 
        className="text-slate-400 hover:text-white material-symbols-outlined"
      >
        home
      </button>

      <h2 className="text-[#00ccff] text-[18px] font-bold">SimuLab Workspace</h2>

      {/* Component Picker */}
      <div className="relative">
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="bg-[#007acc] text-white w-8 h-8 rounded-full font-bold text-xl flex items-center justify-center hover:bg-blue-600 transition-colors"
        >
          +
        </button>

        {isMenuOpen && (
          <div className="absolute top-10 left-0 bg-[#252526] border border-[#454545] rounded-md w-[150px] shadow-2xl overflow-hidden">
            <button 
              onClick={() => addLED({ x: 100, y: 100 })}
              className="flex items-center gap-3 p-3 w-full hover:bg-[#37373d] text-[#ccc] text-sm"
            >
              <span className="material-symbols-outlined text-red-500">lightbulb</span>
              LED Component
            </button>
          </div>
        )}
      </div>

      {/* Dynamic Selection Tools */}
      {(selectedNodeId || selectedEdgeId) && (
        <div className="flex items-center gap-4 bg-[#252526] px-4 py-1.5 rounded-full border border-slate-700 animate-in fade-in slide-in-from-left-2">
          <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">
            {selectedNodeId ? 'Edit Bulb' : 'Edit Wire'}
          </span>
          <div className="flex gap-2">
            {colors.map(color => (
              <button
                key={color}
                onClick={() => updateColor(color)}
                className="w-4 h-4 rounded-full border border-white/20 transition-transform hover:scale-125"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <button 
            onClick={deleteSelection}
            className="text-red-500 hover:text-red-400 font-bold ml-2 material-symbols-outlined text-sm"
          >
            delete
          </button>
        </div>
      )}
    </header>
  );
};

export default SimulatorNavbar;