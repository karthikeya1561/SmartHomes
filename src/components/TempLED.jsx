import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';

const LED = ({ data, selected }) => {
  const [hoveredTerminal, setHoveredTerminal] = useState(null);
  const ledColor = data.color || 'red';

  return (
    <div className="led-node" style={{ 
      position: 'relative', width: '60px', height: '100px',
      filter: selected ? 'drop-shadow(0 0 8px #00ccff)' : 'none',
      transition: 'filter 0.2s'
    }}>
      {/* SVG Container: overflow visible ensures labels don't get cut off */}
      <svg width="60" height="100" viewBox="0 0 60 100" style={{ pointerEvents: 'none', overflow: 'visible' }}>
        {/* Bulb Body */}
        <path 
          d="M15,30 A15,15 0 0,1 45,30 L45,55 L15,55 Z" 
          fill={ledColor} 
          stroke="#fff" 
          strokeWidth="1.5" 
          style={{ pointerEvents: 'all', cursor: 'pointer' }} 
        />
        
        {/* ANODE (+) TERMINAL - Left Pin */}
        <g 
          style={{ pointerEvents: 'all' }} 
          onMouseEnter={() => setHoveredTerminal('Anode (+)')} 
          onMouseLeave={() => setHoveredTerminal(null)}
        >
          {/* Metal Leg */}
          <rect x="23" y="55" width="4" height="35" fill="#C0C0C0" />
          
          {/* Target Box at rod tip */}
          {hoveredTerminal === 'Anode (+)' && (
            <rect x="21" y="86" width="8" height="8" fill="#555" stroke="#fff" strokeWidth="1" />
          )}

          {/* Connection Handle */}
          <foreignObject x="20" y="85" width="10" height="10">
            <Handle type="target" position={Position.Bottom} id="anode" style={{ background: 'transparent', border: 'none' }} />
          </foreignObject>
        </g>
        
        {/* CATHODE (-) TERMINAL - Right Pin */}
        <g 
          style={{ pointerEvents: 'all' }} 
          onMouseEnter={() => setHoveredTerminal('Cathode (-)')} 
          onMouseLeave={() => setHoveredTerminal(null)}
        >
          {/* Metal Leg */}
          <rect x="33" y="55" width="4" height="25" fill="#C0C0C0" />
          
          {/* Target Box at rod tip */}
          {hoveredTerminal === 'Cathode (-)' && (
            <rect x="31" y="76" width="8" height="8" fill="#555" stroke="#fff" strokeWidth="1" />
          )}

          {/* Connection Handle */}
          <foreignObject x="30" y="75" width="10" height="10">
            <Handle type="source" position={Position.Bottom} id="cathode" style={{ background: 'transparent', border: 'none' }} />
          </foreignObject>
        </g>

        {/* --- FIXED HOVER LABEL --- */}
        {hoveredTerminal && (
          <g transform="translate(0, -5)">
            <rect x="0" y="0" width="60" height="18" rx="4" fill="black" />
            <text x="30" y="13" fill="white" fontSize="9" textAnchor="middle" fontWeight="bold">
              {hoveredTerminal}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

export default LED;