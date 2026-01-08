import React, { memo, useMemo } from 'react';
import { BaseEdge, EdgeLabelRenderer } from '@xyflow/react';

const MovableWire = memo(({ 
  id, sourceX, sourceY, targetX, targetY, 
  style = {}, selected, data 
}) => {
  // 1. Ported Pathfinding Logic
  const edgePath = useMemo(() => {
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const dist = Math.hypot(dx, dy);
    
    // Calculate curve intensity based on distance (mimicking friend's 'baseHeight')
    const curveHeight = Math.min(dist * 0.4, 100);
    
    // Create the Bezier curve string
    // Control points are pushed "outward" to create the natural loop seen in the HTML version
    const ctrl1X = sourceX;
    const ctrl1Y = sourceY + curveHeight;
    const ctrl2X = targetX;
    const ctrl2Y = targetY + curveHeight;

    return `M ${sourceX},${sourceY} C ${ctrl1X},${ctrl1Y} ${ctrl2X},${ctrl2Y} ${targetX},${targetY}`;
  }, [sourceX, sourceY, targetX, targetY]);

  return (
    <>
      {/* 2. Selection Glow (Friend's visual style) */}
      {selected && (
        <BaseEdge 
          path={edgePath} 
          style={{ 
            stroke: style.stroke || '#2ED573', 
            strokeWidth: 12, 
            opacity: 0.3, 
            filter: 'blur(4px)' 
          }} 
        />
      )}

      {/* 3. Main Wire Path */}
      <BaseEdge 
        path={edgePath} 
        style={{ 
          ...style, 
          strokeWidth: selected ? 6 : 4, 
          stroke: style.stroke || '#2ED573', 
          transition: 'stroke-width 0.2s',
          strokeLinecap: 'round'
        }} 
      />
    </>
  );
});

export default MovableWire;