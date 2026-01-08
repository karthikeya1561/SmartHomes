import React from 'react';
import { getSmoothStepPath, BaseEdge } from '@xyflow/react';

const MovableWire = ({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, selected, markerEnd }) => {
  const [edgePath] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, borderRadius: 0,
  });

  return (
    <BaseEdge 
      path={edgePath} 
      markerEnd={markerEnd} 
      style={{ 
        ...style, 
        strokeWidth: selected ? 4 : 2, 
        filter: selected ? 'drop-shadow(0 0 2px #fff)' : 'none',
        transition: 'stroke-width 0.2s'
      }} 
    />
  );
};

export default MovableWire;