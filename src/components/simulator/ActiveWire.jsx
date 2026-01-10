import React, { memo, useEffect } from 'react';
import { useReactFlow, useViewport } from '@xyflow/react';
import useSimulationStore from '../../store/useSimulationStore';

const ActiveWire = memo(() => {
    const { drawing, updateWiringPos, addWiringWaypoint } = useSimulationStore(); // Store Actions
    const { screenToFlowPosition } = useReactFlow();
    const { x, y, zoom } = useViewport(); // Align overlay with the viewport

    // Global Mouse Listener for smooth tracking & Clicks for waypoints
    useEffect(() => {
        if (!drawing.active) return;

        const handleMouseMove = (e) => {
            const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
            // Snap to grid (10px) (Flow Coordinates)
            const snapped = {
                x: Math.round(flowPos.x / 10) * 10,
                y: Math.round(flowPos.y / 10) * 10
            };
            updateWiringPos(snapped);
        };

        const handleClick = (e) => {
            // Prevent adding waypoint if we clicked a Handle (which triggers completeWiring elsewhere)
            // Handles usually have class 'react-flow__handle'
            if (e.target.classList.contains('react-flow__handle')) return;
            addWiringWaypoint();
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('click', handleClick);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('click', handleClick);
        };
    }, [drawing.active, screenToFlowPosition, updateWiringPos, addWiringWaypoint]);

    if (!drawing.active) return null;

    // Build SVG Path with strictly orthogonal segments
    // drawing.points are in Flow Coordinates.
    // We render inside a transformed SVG so they map 1:1.
    const allPoints = [...drawing.points, drawing.currentPos];
    if (allPoints.length < 2) return null;

    const start = allPoints[0];
    let path = `M ${start.x},${start.y}`;

    // Iterate through all subsequent points (history + current mouse)
    for (let i = 1; i < allPoints.length; i++) {
        const prev = allPoints[i - 1];
        const curr = allPoints[i];
        // Vertical then Horizontal approach (V-H)
        // Move Y first, then X.
        path += ` L ${prev.x},${curr.y} L ${curr.x},${curr.y}`;
    }

    return (
        <svg style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1000,
            overflow: 'visible',
            // CRITICAL FIX: Sync with React Flow Viewport
            transform: `translate(${x}px, ${y}px) scale(${zoom})`,
            transformOrigin: '0 0'
        }}>
            <path
                d={path}
                stroke="#2ED573"
                strokeWidth="2"
                strokeDasharray="5,5" // Dashed line while drawing
                fill="none"
                strokeLinecap="round"
            />
            {/* Render dots at waypoints */}
            {allPoints.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="3" fill="#2ED573" />
            ))}
        </svg>
    );
});

export default ActiveWire;
