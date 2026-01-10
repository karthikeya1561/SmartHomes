import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';

const useSimulationStore = create((set, get) => ({
  view: 'landing',
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  isMenuOpen: false,

  drawing: {
    active: false,
    sourceNode: null,
    sourceHandle: null,
    points: [], 
    currentPos: { x: 0, y: 0 },
  },

  setView: (view) => set({ view }),
  setIsMenuOpen: (isOpen) => set({ isMenuOpen: isOpen }),

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
    get().solveCircuit();
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
    get().solveCircuit();
  },

  onConnect: (connection) => {
    set({
      edges: addEdge(
        {
          ...connection,
          type: 'smart',
          data: { waypoints: [] },
          style: { stroke: '#2ED573', strokeWidth: 2 }
        },
        get().edges
      ),
    });
    get().solveCircuit();
  },

  updateEdgePath: (edgeId, waypoints) => {
    set({
      edges: get().edges.map((e) =>
        e.id === edgeId ? { ...e, data: { ...e.data, waypoints } } : e
      ),
    });
  },

  addLED: (position) => {
    const id = `led-${Date.now()}`;
    set((state) => ({
      nodes: [...state.nodes, {
        id, type: 'ledNode', position,
        data: { color: '#FF4757', isPowered: false, label: `LED ${state.nodes.length + 1}` },
      }],
      isMenuOpen: false,
    }));
  },

  addBattery: (position) => {
    const id = `battery-${Date.now()}`;
    set((state) => ({
      nodes: [...state.nodes, {
        id, type: 'batteryNode', position,
        data: { voltage: 9, label: `Battery ${state.nodes.length + 1}` },
      }],
      isMenuOpen: false,
    }));
  },

  addResistor: (position) => {
    const id = `resistor-${Date.now()}`;
    set((state) => ({
      nodes: [...state.nodes, {
        id, type: 'resistorNode', position,
        data: { value: 1000, label: `Resistor ${state.nodes.length + 1}` },
      }],
      isMenuOpen: false,
    }));
  },

  setSelection: (nodeId, edgeId) => set({ selectedNodeId: nodeId, selectedEdgeId: edgeId, isMenuOpen: false }),

  updateColor: (color) => {
    const { selectedNodeId, selectedEdgeId, nodes, edges } = get();
    if (selectedNodeId) {
      set({ nodes: nodes.map((n) => n.id === selectedNodeId ? { ...n, data: { ...n.data, color } } : n) });
    } else if (selectedEdgeId) {
      set({ edges: edges.map((e) => e.id === selectedEdgeId ? { ...e, style: { ...e.style, stroke: color } } : e) });
    }
  },

  deleteSelection: () => {
    const { selectedNodeId, selectedEdgeId } = get();
    if (selectedNodeId) {
      set((s) => ({
        nodes: s.nodes.filter((n) => n.id !== selectedNodeId),
        edges: s.edges.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId),
        selectedNodeId: null,
      }));
    } else if (selectedEdgeId) {
      set((s) => ({
        edges: s.edges.filter((e) => e.id !== selectedEdgeId),
        selectedEdgeId: null,
      }));
    }
    get().solveCircuit();
  },

  solveCircuit: () => {
    const { nodes, edges } = get();
    const updatedNodes = nodes.map((node) => {
      if (node.type === 'ledNode') {
        const connectedEdges = edges.filter(e => e.source === node.id || e.target === node.id);
        let hasPos = false; let hasNeg = false;

        connectedEdges.forEach((edge) => {
          const isSource = edge.source === node.id;
          const myHandle = isSource ? edge.sourceHandle : edge.targetHandle;
          const otherNode = nodes.find(n => n.id === (isSource ? edge.target : edge.source));
          const otherHandle = isSource ? edge.targetHandle : edge.sourceHandle;

          if (otherNode?.type === 'batteryNode') {
            if (myHandle === 'anode' && otherHandle === 'positive') hasPos = true;
            if (myHandle === 'cathode' && otherHandle === 'negative') hasNeg = true;
          }
        });
        return { ...node, data: { ...node.data, isPowered: hasPos && hasNeg } };
      }
      return node;
    });

    if (JSON.stringify(updatedNodes) !== JSON.stringify(nodes)) {
      set({ nodes: updatedNodes });
    }
  },

  startWiring: (nodeId, handleId, position) => {
    set({ drawing: { active: true, sourceNode: nodeId, sourceHandle: handleId, points: [position], currentPos: position } });
  },

  updateWiringPos: (pos) => {
    const { drawing } = get();
    if (drawing.active) set({ drawing: { ...drawing, currentPos: pos } });
  },

  addWiringWaypoint: () => {
    const { drawing } = get();
    if (drawing.active) set({ drawing: { ...drawing, points: [...drawing.points, drawing.currentPos] } });
  },

  completeWiring: (targetNode, targetHandle) => {
    const { drawing } = get();
    if (!drawing.active) return;
    const waypoints = drawing.points.slice(1);
    set({
      edges: addEdge({
        source: drawing.sourceNode, sourceHandle: drawing.sourceHandle,
        target: targetNode, targetHandle: targetHandle,
        type: 'smart', data: { waypoints }, style: { stroke: '#2ED573', strokeWidth: 2 }
      }, get().edges),
      drawing: { active: false, sourceNode: null, sourceHandle: null, points: [], currentPos: { x: 0, y: 0 } }
    });
    get().solveCircuit();
  }
}));

export default useSimulationStore;