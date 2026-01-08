import React from 'react';
import { ReactFlow, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Store & Components
import useSimulationStore from '../store/useSimulationStore';
import LEDNode from '../components/simulator/nodes/LEDNode';
import MovableWire from '../components/simulator/edges/MovableWire';
import SimulatorNavbar from '../components/layout/SimulatorNavbar';

// 1. Production Node & Edge Type Definitions
const nodeTypes = { ledNode: LEDNode };
const edgeTypes = { step: MovableWire };

const SimulatorView = () => {
  // 2. Destructure actions and state from store
  const { 
    nodes, edges, onNodesChange, onEdgesChange, onConnect, setSelection 
  } = useSimulationStore();

  return (
    <div className="flex flex-col w-screen h-screen bg-[#121212]">
      {/* 3. Independent UI Layer */}
      <SimulatorNavbar />

      <div className="flex-grow">
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
          // 4. Optimization: Production-grade interaction settings
          snapToGrid={true}
          snapGrid={[20, 20]}
          defaultEdgeOptions={{ type: 'step' }}
        >
          <Background color="#333" gap={20} variant="dots" />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
};

export default SimulatorView;