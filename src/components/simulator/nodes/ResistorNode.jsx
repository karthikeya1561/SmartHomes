import React, { memo } from 'react';
import { Position } from '@xyflow/react';
import SmartHandle from './SmartHandle';

const ResistorNode = memo(({ id, data, selected }) => {
  // Use data for future dynamic resistance band logic
  const resistance = data.value || "1k";

  return (
    <div 
      className="relative w-[200px] h-[100px]" 
      style={{ filter: selected ? 'drop-shadow(0 0 12px #00ccff)' : 'none' }}
    >
      <svg
        width="200"
        height="100"
        viewBox="0 0 200 100"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible pointer-events-none"
      >
        {/* Main Resistor Body */}
        <rect x="20" y="40" width="160" height="20" rx="10" ry="10" fill="#D8CBAF" className="pointer-events-auto" />
        
        {/* Color Bands */}
        <rect x="10" y="40" width="10" height="20" rx="5" fill="#8B5B29" />
        <rect x="30" y="40" width="10" height="20" fill="#000000" />
        <rect x="50" y="40" width="10" height="20" fill="#4CAF50" />
        <rect x="70" y="40" width="10" height="20" fill="#FFD700" />
        <rect x="90" y="40" width="10" height="20" fill="#D8CBAF" />
        <rect x="130" y="40" width="10" height="20" rx="5" fill="#FFD700" />
        <rect x="150" y="40" width="10" height="20" rx="5" fill="#8B5B29" />
        
        {/* Metal Leads */}
        <line x1="0" y1="50" x2="20" y2="50" stroke="#A9A9A9" strokeWidth="5" />
        <line x1="180" y1="50" x2="200" y2="50" stroke="#A9A9A9" strokeWidth="5" />
      </svg>

      {/* PRECISION HANDLES 
          Placed at the exact tips of your lines: (0, 50) and (200, 50)
         
      */}
      <div className="absolute" style={{ left: '0px', top: '50px' }}>
        <SmartHandle 
          type="source" 
          position={Position.Left} 
          id="p1" 
          nodeId={id} 
        />
      </div>

      <div className="absolute" style={{ left: '200px', top: '50px' }}>
        <SmartHandle 
          type="source" 
          position={Position.Right} 
          id="p2" 
          nodeId={id} 
        />
      </div>
    </div>
  );
});

export default ResistorNode;