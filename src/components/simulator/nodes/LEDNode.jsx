import React, { useState, memo } from 'react';
import { Handle, Position } from '@xyflow/react';

/**
 * PRODUCTION-GRADE LED NODE
 * Precision-aligned to 0px tolerance
 */
const LEDNode = memo(({ data, selected }) => {
  const [hoveredTerminal, setHoveredTerminal] = useState(null);
  const ledColor = data.color || 'red';

  return (
    <div 
      className="relative w-[60px] h-[100px] transition-all duration-200" 
      style={{ filter: selected ? 'drop-shadow(0 0 10px #00ccff)' : 'none' }}
    >
      {/* 1. Base SVG Layer */}
      <svg 
        width="60" 
        height="100" 
        viewBox="0 0 60 100" 
        className="overflow-visible pointer-events-none"
      >
        {/* LED Bulb */}
        <path 
          d="M15,30 A15,15 0 0,1 45,30 L45,55 L15,55 Z" 
          fill={ledColor} 
          stroke="white" 
          strokeWidth="1.5" 
          className="pointer-events-auto cursor-pointer"
        />
        
        {/* Metal Rods - Visual Only */}
        {/* Left Pin (Anode): x=23 to 27, y=55 to 90 */}
        <rect x="23" y="55" width="4" height="35" fill="#C0C0C0" />
        
        {/* Right Pin (Cathode): x=33 to 37, y=55 to 80 */}
        <rect x="33" y="55" width="4" height="25" fill="#C0C0C0" />

        {/* Hover Label Layer */}
        {hoveredTerminal && (
          <g transform="translate(30, -10)">
            <rect x="-30" y="0" width="60" height="18" rx="4" fill="rgba(0,0,0,0.8)" />
            <text y="12" fill="white" fontSize="9" textAnchor="middle" className="font-bold uppercase tracking-wider">
              {hoveredTerminal}
            </text>
          </g>
        )}
      </svg>

      {/* 2. Precision Handle Layer */}
      {/* Anode Handle Placement Logic:
          Rod center: 23 + (4/2) = 25px
          Rod tip: 55 + 35 = 90px
      */}
      <div 
        className="absolute pointer-events-auto" 
        style={{ left: '25px', top: '90px' }}
        onMouseEnter={() => setHoveredTerminal('Anode (+)')}
        onMouseLeave={() => setHoveredTerminal(null)}
      >
        <Handle 
          type="target" 
          position={Position.Bottom} 
          id="anode" 
          // We use !w-0 !h-0 to make the connection point a single mathematical pixel
          className="!bg-blue-400 !border-none !w-0 !h-0 opacity-0" 
        />
      </div>

      {/* Cathode Handle Placement Logic:
          Rod center: 33 + (4/2) = 35px
          Rod tip: 55 + 25 = 80px
      */}
      <div 
        className="absolute pointer-events-auto" 
        style={{ left: '35px', top: '80px' }}
        onMouseEnter={() => setHoveredTerminal('Cathode (-)')}
        onMouseLeave={() => setHoveredTerminal(null)}
      >
        <Handle 
          type="source" 
          position={Position.Bottom} 
          id="cathode" 
          className="!bg-red-400 !border-none !w-0 !h-0 opacity-0" 
        />
      </div>
    </div>
  );
});

export default LEDNode;