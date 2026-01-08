import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';

const useSimulationStore = create((set, get) => ({
  // 1. Core Simulation State
  view: 'landing',
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  isMenuOpen: false,

  // 2. Global Actions
  setView: (view) => set({ view }),
  setIsMenuOpen: (isOpen) => set({ isMenuOpen: isOpen }),

  // 3. Node & Edge Management
  onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),
  
  onConnect: (connection) => set({
    edges: addEdge({ 
      ...connection, 
      type: 'step', 
      animated: false, 
      style: { stroke: '#00ff00', strokeWidth: 2 } 
    }, get().edges)
  }),

  // 4. Component Logic
  addLED: (position) => set((state) => ({
    nodes: [
      ...state.nodes, 
      { 
        id: `led-${Date.now()}`, 
        type: 'ledNode', 
        position, 
        data: { color: 'red' } 
      }
    ],
    isMenuOpen: false
  })),

  setSelection: (nodeId, edgeId) => set({ 
    selectedNodeId: nodeId, 
    selectedEdgeId: edgeId,
    isMenuOpen: false 
  }),

  // 5. Modification Actions
  updateColor: (color) => {
    const { selectedNodeId, selectedEdgeId, nodes, edges } = get();
    if (selectedNodeId) {
      set({ nodes: nodes.map(n => n.id === selectedNodeId ? { ...n, data: { ...n.data, color } } : n) });
    } else if (selectedEdgeId) {
      set({ edges: edges.map(e => e.id === selectedEdgeId ? { ...e, style: { ...e.style, stroke: color } } : e) });
    }
  },

  deleteSelection: () => {
    const { selectedNodeId, selectedEdgeId } = get();
    if (selectedNodeId) {
      set((s) => ({ nodes: s.nodes.filter(n => n.id !== selectedNodeId), selectedNodeId: null }));
    } else if (selectedEdgeId) {
      set((s) => ({ edges: s.edges.filter(e => e.id !== selectedEdgeId), selectedEdgeId: null }));
    }
  }
}));

export default useSimulationStore;