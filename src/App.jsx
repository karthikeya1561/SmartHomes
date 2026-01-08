import React, { useState, useCallback, useEffect } from 'react';
import { ReactFlow, addEdge, Background, Controls, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import LED from './components/TempLED'; 
import MovableWire from './components/MovableWire';
import LandingPage from './pages/LandingPage'; // Import the landing page

const nodeTypes = { ledNode: LED };
const edgeTypes = { step: MovableWire };

function App() {
  const [view, setView] = useState('landing'); // State to toggle views
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);

  const colors = ['red', 'green', 'blue', 'yellow', 'orange'];
  const wireColors = ['#00ff00', '#ff0000', '#0000ff', '#ffff00', '#ffffff'];

  useEffect(() => {
    const handleLedAction = (e) => {
      const { id, action, color } = e.detail;
      if (action === 'change-color') setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, color } } : n));
      else if (action === 'delete') setNodes((nds) => nds.filter((n) => n.id !== id));
    };
    window.addEventListener('led-action', handleLedAction);
    return () => window.removeEventListener('led-action', handleLedAction);
  }, [setNodes]);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge({ 
    ...params, type: 'step', animated: false, style: { stroke: '#00ff00', strokeWidth: 2 } 
  }, eds)), [setEdges]);

  // If view is landing, return LandingPage
  if (view === 'landing') {
    return <LandingPage onLaunch={() => setView('simulator')} />;
  }

  // Else, return your Simulator code
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#121212', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: '50px', background: '#1e1e1e', display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid #333', zIndex: 100 }}>
        {/* Back Button */}
        <button onClick={() => setView('landing')} className="mr-4 text-slate-400 hover:text-white material-symbols-outlined">home</button>
        <h2 style={{ color: '#00ccff', fontSize: '18px', marginRight: '30px' }}>SmartHomes</h2>
        
        <div style={{ position: 'relative', marginRight: 'auto' }}>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ background: '#007acc', color: 'white', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '20px', fontWeight: 'bold' }}>+</button>
          {isMenuOpen && (
            <div style={{ position: 'absolute', top: '40px', left: '0', background: '#252526', border: '1px solid #454545', borderRadius: '4px', width: '150px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
              <div onClick={() => { setNodes((nds) => nds.concat({ id: `led-${Date.now()}`, type: 'ledNode', position: { x: 100, y: 100 }, data: { color: 'red' } })); setIsMenuOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', cursor: 'pointer', color: '#ccc' }}>
                <svg width="15" height="25" viewBox="0 0 60 100"><path d="M15,30 A15,15 0 0,1 45,30 L45,55 L15,55 Z" fill="red" stroke="#fff" /><rect x="23" y="55" width="4" height="35" fill="#C0C0C0" /><rect x="33" y="55" width="4" height="25" fill="#C0C0C0" /></svg>
                <span>LED</span>
              </div>
            </div>
          )}
        </div>

        {(selectedNodeId || selectedEdgeId) && (
           <div style={{ display: 'flex', gap: '15px', alignItems: 'center', background: '#252526', padding: '5px 15px', borderRadius: '20px', border: `1px solid ${selectedNodeId ? '#00ccff' : '#00ff00'}` }}>
             <span style={{color: '#ccc', fontSize: '12px'}}>{selectedNodeId ? 'LED Color:' : 'Wire Color:'}</span>
             <div style={{ display: 'flex', gap: '8px' }}>
               {(selectedNodeId ? colors : wireColors).map(c => (
                 <div key={c} onClick={() => selectedNodeId ? setNodes(nds => nds.map(n => n.id === selectedNodeId ? {...n, data: {...n.data, color: c}} : n)) : setEdges(eds => eds.map(e => e.id === selectedEdgeId ? {...e, style: {...e.style, stroke: c}} : e))} style={{ width: '16px', height: '16px', background: c, borderRadius: '50%', cursor: 'pointer', border: '1px solid #fff' }} />
               ))}
             </div>
             <button onClick={() => selectedNodeId ? setNodes(nds => nds.filter(n => n.id !== selectedNodeId)) : setEdges(eds => eds.filter(e => e.id !== selectedEdgeId))} style={{ background: 'transparent', color: '#ff4d4d', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>✕</button>
           </div>
        )}
      </div>

      <div style={{ flexGrow: 1 }}>
        <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onNodeClick={(_, node) => { setSelectedNodeId(node.id); setSelectedEdgeId(null); }} onEdgeClick={(_, edge) => { setSelectedEdgeId(edge.id); setSelectedNodeId(null); }} onConnect={onConnect} nodeTypes={nodeTypes} edgeTypes={edgeTypes} fitView onPaneClick={() => { setIsMenuOpen(false); setSelectedNodeId(null); setSelectedEdgeId(null); }}>
          <Background color="#333" gap={20} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}

export default App; 