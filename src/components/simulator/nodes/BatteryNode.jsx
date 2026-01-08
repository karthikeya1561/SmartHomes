import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const BatteryNode = memo(({ data, selected }) => {
  const voltage = data.voltage || 9;

  return (
    <div className="relative w-[70px] h-[60px]" style={{ filter: selected ? 'drop-shadow(0 0 10px #00ccff)' : 'none' }}>
      {/* 1. Battery Body Visuals */}
      <svg width="70" height="60" viewBox="0 0 70 60" className="overflow-visible pointer-events-none">
        <defs>
          <linearGradient id="batGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1a252f" />
            <stop offset="50%" stopColor="#34495e" />
            <stop offset="100%" stopColor="#1a252f" />
          </linearGradient>
        </defs>
        
        {/* Main Body */}
        <rect x="5" y="2" width="60" height="56" rx="6" fill="url(#batGradient)" className="pointer-events-auto" />
        
        {/* Decorative Details */}
        <rect x="7" y="4" width="56" height="10" rx="2" fill="rgba(255,255,255,0.1)" />
        <rect x="7" y="20" width="56" height="20" fill="rgba(52, 152, 219, 0.25)" />
        
        {/* Voltage Text */}
        <text x="35" y="35" fill="#3498db" fontSize="16" fontWeight="bold" textAnchor="middle" style={{ filter: 'drop-shadow(0 0 5px rgba(52,152,219,0.5))' }}>
          {voltage}V
        </text>

        {/* Polarity Indicators */}
        <text x="15" y="15" fill="#e74c3c" fontSize="14" fontWeight="bold" textAnchor="middle">+</text>
        <text x="55" y="15" fill="#95a5a6" fontSize="14" fontWeight="bold" textAnchor="middle">−</text>
      </svg>

      {/* 2. Precision Terminals (Zero-Gap) */}
      {/* Positive Terminal (Matches red pad in friend's code) */}
      <div className="absolute" style={{ left: '5px', top: '40px' }}>
        <div className="w-3 h-3 rounded-full bg-[#e74c3c] border border-white/20 shadow-lg" />
        <Handle 
          type="source" 
          position={Position.Bottom} 
          id="positive" 
          className="!opacity-0 !w-0 !h-0" 
        />
      </div>

      {/* Negative Terminal (Matches gray pad in friend's code) */}
      <div className="absolute" style={{ left: '65px', top: '40px' }}>
        <div className="w-3 h-3 rounded-full bg-[#95a5a6] border border-white/20 shadow-lg" />
        <Handle 
          type="source" 
          position={Position.Bottom} 
          id="negative" 
          className="!opacity-0 !w-0 !h-0" 
        />
      </div>
    </div>
  );
});

export default BatteryNode;