import React from 'react';
import useSimulationStore from '../../store/useSimulationStore';

const SimulatorNavbar = () => {
  const { setView, isMenuOpen, setIsMenuOpen, addLED, addBattery, addResistor, selectedNodeId, selectedEdgeId, updateColor, deleteSelection } = useSimulationStore();
  const colors = ['red', 'green', 'blue', 'yellow', 'orange'];

  return (
    <header className="h-[50px] bg-[#1e1e1e] flex items-center px-5 border-b border-[#333] z-[100] gap-4">
      <button onClick={() => setView('landing')} className="text-slate-400 hover:text-white material-symbols-outlined">home</button>
      <h2 className="text-[#00ccff] text-[18px] font-bold">SimuLab Workspace</h2>

      <div className="relative">
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="bg-[#007acc] text-white w-8 h-8 rounded-full font-bold text-xl flex items-center justify-center">+</button>
        {isMenuOpen && (
          <div className="absolute top-10 left-0 bg-[#252526] border border-[#454545] rounded-md w-[200px] shadow-2xl overflow-hidden">
            <button onClick={() => addLED({ x: 100, y: 100 })} className="flex items-center gap-3 p-3 w-full hover:bg-[#37373d] text-[#ccc] text-sm border-b border-[#333]">
              <span className="material-symbols-outlined text-red-500">lightbulb</span> LED Bulb
            </button>
            <button onClick={() => addBattery({ x: 150, y: 150 })} className="flex items-center gap-3 p-3 w-full hover:bg-[#37373d] text-[#ccc] text-sm border-b border-[#333]">
              <span className="material-symbols-outlined text-blue-400">battery_full</span> 9V Battery
            </button>
            <button onClick={() => addResistor({ x: 200, y: 200 })} className="flex items-center gap-3 p-3 w-full hover:bg-[#37373d] text-[#ccc] text-sm">
              <span className="material-symbols-outlined text-amber-600">reorder</span> Resistor (1kΩ)
            </button>
          </div>
        )}
      </div>

      {(selectedNodeId || selectedEdgeId) && (
        <div className="flex items-center gap-4 bg-[#252526] px-4 py-1.5 rounded-full border border-slate-700">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{selectedNodeId ? 'Edit Component' : 'Edit Wire'}</span>
          <div className="flex gap-2">
            {colors.map(c => <button key={c} onClick={() => updateColor(c)} className="w-4 h-4 rounded-full border border-white/20" style={{ background: c }} />)}
          </div>
          <button onClick={deleteSelection} className="text-red-500 material-symbols-outlined text-sm">delete</button>
        </div>
      )}
    </header>
  );
};

export default SimulatorNavbar;