import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';

const useSimulationStore = create((set, get) => ({
  // --- Global Application State ---
  view: 'landing',
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  isMenuOpen: false,

  // --- Navigation & UI Actions ---
  setView: (view) => set({ view }),
  setIsMenuOpen: (isOpen) => set({ isMenuOpen: isOpen }),

  // --- React Flow Core Handlers ---
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
    get().solveCircuit(); // Trigger power check on movement
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
    get().solveCircuit(); // Trigger power check on wire changes
  },

  onConnect: (connection) => {
    set({
      edges: addEdge(
        { 
          ...connection, 
          type: 'bezier', // Natural curve wiring from friend's logic
          style: { stroke: '#2ED573', strokeWidth: 4 } 
        }, 
        get().edges
      ),
    });
    get().solveCircuit(); // Check if new connection powers the circuit
  },

  // --- Component Creation Actions ---
  addLED: (position) => {
    const id = `led-${Date.now()}`;
    set((state) => ({
      nodes: [
        ...state.nodes,
        {
          id,
          type: 'ledNode',
          position,
          data: { color: '#FF4757', isPowered: false, label: `LED ${state.nodes.length + 1}` },
        },
      ],
      isMenuOpen: false,
    }));
  },

  addBattery: (position) => {
    const id = `battery-${Date.now()}`;
    set((state) => ({
      nodes: [
        ...state.nodes,
        {
          id,
          type: 'batteryNode',
          position,
          data: { voltage: 9, label: `Battery ${state.nodes.length + 1}` },
        },
      ],
      isMenuOpen: false,
    }));
  },

  // --- Inspector & Modification Actions ---
  setSelection: (nodeId, edgeId) => set({ 
    selectedNodeId: nodeId, 
    selectedEdgeId: edgeId,
    isMenuOpen: false 
  }),

  updateColor: (color) => {
    const { selectedNodeId, selectedEdgeId, nodes, edges } = get();
    if (selectedNodeId) {
      set({
        nodes: nodes.map((n) =>
          n.id === selectedNodeId ? { ...n, data: { ...n.data, color } } : n
        ),
      });
    } else if (selectedEdgeId) {
      set({
        edges: edges.map((e) =>
          e.id === selectedEdgeId ? { ...e, style: { ...e.style, stroke: color } } : e
        ),
      });
    }
  },

  changeBatteryVoltage: (voltage) => {
    const { selectedNodeId, nodes } = get();
    if (selectedNodeId && nodes.find(n => n.id === selectedNodeId)?.type === 'batteryNode') {
      set({
        nodes: nodes.map((n) =>
          n.id === selectedNodeId ? { ...n, data: { ...n.data, voltage } } : n
        ),
      });
      get().solveCircuit();
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

  clearAll: () => {
    set({ nodes: [], edges: [], selectedNodeId: null, selectedEdgeId: null });
  },

  // --- THE CIRCUIT SOLVER ---
  solveCircuit: () => {
    const { nodes, edges } = get();

    const updatedNodes = nodes.map((node) => {
      if (node.type === 'ledNode') {
        // Find wires connected to this LED
        const connectedEdges = edges.filter(
          (edge) => edge.source === node.id || edge.target === node.id
        );

        let hasPositiveConnection = false;
        let hasNegativeConnection = false;

        connectedEdges.forEach((edge) => {
          const isSource = edge.source === node.id;
          const myHandleId = isSource ? edge.sourceHandle : edge.targetHandle;
          const otherNodeId = isSource ? edge.target : edge.source;
          const otherHandleId = isSource ? edge.targetHandle : edge.sourceHandle;
          
          const otherNode = nodes.find((n) => n.id === otherNodeId);

          // Correct Polarity Check
          if (otherNode && otherNode.type === 'batteryNode') {
            // Anode (+) must connect to Battery Positive (+)
            if (myHandleId === 'anode' && otherHandleId === 'positive') {
              hasPositiveConnection = true;
            }
            // Cathode (-) must connect to Battery Negative (-)
            if (myHandleId === 'cathode' && otherHandleId === 'negative') {
              hasNegativeConnection = true;
            }
          }
        });

        // Power flows only if both connections are correct
        return {
          ...node,
          data: { ...node.data, isPowered: hasPositiveConnection && hasNegativeConnection },
        };
      }
      return node;
    });

    // Efficiency: Only update state if any LED power status actually changed
    const hasStatusChanged = updatedNodes.some((newNode, idx) => {
        return newNode.data.isPowered !== nodes[idx].data.isPowered;
    });

    if (hasStatusChanged) {
        set({ nodes: updatedNodes });
    }
  },
}));

export default useSimulationStore;