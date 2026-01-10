import React from 'react';
import CanvasSimulator from '../components/simulator/CanvasSimulator';

const SimulatorView = () => {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', overflow: 'hidden', background: '#2c3e50', zIndex: 9999 }}>
      <CanvasSimulator />
    </div>
  );
};

export default SimulatorView;