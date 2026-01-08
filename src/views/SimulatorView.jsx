import React from 'react';
import { ReactFlow, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './SimulatorView.css'; // We will put the friend's styles here

import useSimulationStore from '../store/useSimulationStore';
import LEDNode from '../components/simulator/nodes/LEDNode';
import BatteryNode from '../components/simulator/nodes/BatteryNode';
import MovableWire from '../components/simulator/edges/MovableWire';

const nodeTypes = { ledNode: LEDNode, batteryNode: BatteryNode };
const edgeTypes = { bezier: MovableWire };

const SimulatorView = () => {
  const { 
    nodes, edges, onNodesChange, onEdgesChange, onConnect, 
    setSelection, selectedNodeId, selectedEdgeId, 
    updateColor, changeBatteryVoltage, deleteSelection, clearAll,
    addLED, addBattery, setView
  } = useSimulationStore();

  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const selectedEdge = edges.find(e => e.id === selectedEdgeId);

  return (
    <div className="sv-body">
      <div className="sv-container">
        {/* 1. Header Section */}
        <header className="sv-header">
          <div className="sv-logo-wrap">
            <div className="sv-logo-icon">⚡</div>
            <h2>Circuit Lab Pro</h2>
          </div>
          <div className="sv-btn-group">
            <button className="sv-btn sv-btn-home" onClick={() => setView('landing')}>Home</button>
            <button className="sv-btn" onClick={() => addLED({ x: 100, y: 100 })}>+ Add LED</button>
            <button className="sv-btn" onClick={() => addBattery({ x: 200, y: 200 })}>+ Add Battery</button>
            <button className="sv-btn sv-btn-delete" onClick={deleteSelection} disabled={!selectedNodeId && !selectedEdgeId}>Delete</button>
            <button className="sv-btn sv-btn-clear" onClick={clearAll}>Clear All</button>
          </div>
        </header>

        {/* 2. Main Canvas Area */}
        <main className="sv-canvas-area">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodeClick={(_, node) => setSelection(node.id, null)}
            onEdgeClick={(_, edge) => setSelection(null, edge.id)}
            onPaneClick={() => setSelection(null, null)}
            fitView
            defaultEdgeOptions={{ type: 'bezier' }}
          >
            <Background color="#333" gap={30} variant="dots" />
            <Controls />
          </ReactFlow>
        </main>

        {/* 3. Sidebar Inspector */}
        <aside className="sv-sidebar">
          <h3>Inspector</h3>
          
          {/* LED Controls */}
          {selectedNode?.type === 'ledNode' && (
            <div className="sv-picker-section">
              <span className="sv-picker-label">LED Body Color</span>
              <div className="sv-color-grid">
                {['#FF4757', '#FFA502', '#FFEB3B', '#4CAF50', '#2196F3', '#9C27B0'].map(c => (
                  <div 
                    key={c} 
                    className={`sv-color-circle ${selectedNode.data.color === c ? 'active' : ''}`}
                    style={{ background: c }}
                    onClick={() => updateColor(c)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Battery Controls */}
          {selectedNode?.type === 'batteryNode' && (
            <div className="sv-picker-section">
              <span className="sv-picker-label">Battery Voltage</span>
              <div className="sv-voltage-btns">
                {[1.5, 3, 9].map(v => (
                  <button key={v} className="sv-btn" onClick={() => changeBatteryVoltage(v)}>{v}V</button>
                ))}
              </div>
            </div>
          )}

          {/* Wire Controls */}
          {selectedEdgeId && (
            <div className="sv-picker-section">
              <span className="sv-picker-label">Wire Color</span>
              <div className="sv-color-grid">
                {['#FF4757', '#FFA502', '#4CAF50', '#2196F3', '#9E9E9E'].map(c => (
                  <div 
                    key={c} 
                    className={`sv-color-circle ${selectedEdge?.style?.stroke === c ? 'active' : ''}`}
                    style={{ background: c }}
                    onClick={() => updateColor(c)}
                  />
                ))}
              </div>
            </div>
          )}

          {!selectedNodeId && !selectedEdgeId && (
            <p className="sv-hint-text">💡 <b>Add a battery</b> and connect it to LEDs to make them glow!<br/><br/>🔋 <b>Connect + to Anode</b> and <b>- to Cathode</b> for proper circuit.</p>
          )}

          {/* 4. Real-time Stats */}
          <div className="sv-stats">
            <StatItem val={nodes.filter(n => n.type === 'ledNode').length} label="LEDs" />
            <StatItem val={nodes.filter(n => n.type === 'batteryNode').length} label="Batteries" />
            <StatItem val={edges.length} label="Wires" />
          </div>

          <div className="sv-shortcuts">
            <b>Keyboard Shortcuts:</b><br/>
            Delete - Remove selected<br/>
            Escape - Deselect<br/>
            Drag - Move components
          </div>
        </aside>
      </div>
    </div>
  );
};

const StatItem = ({ val, label }) => (
  <div className="sv-stat-item">
    <div className="sv-stat-value">{val}</div>
    <div className="sv-stat-label">{label}</div>
  </div>
);

export default SimulatorView;