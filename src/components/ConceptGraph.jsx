import React, { useMemo, useState, useEffect, useRef } from "react";
import Tree from 'react-d3-tree';
import { Info, Move, ZoomIn, MousePointerClick, X } from 'lucide-react';
import useStudyStore from "../store/useStudyStore";

/* =========================================================
   USAGE GUIDE COMPONENT
   ========================================================= */
const GraphUsageGuide = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="absolute top-4 right-4 z-20 flex flex-col items-end">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border transition-all duration-300 shadow-lg group
                    ${isOpen
                        ? 'bg-violet-600 border-violet-500 text-white'
                        : 'bg-black/30 border-white/10 text-white/70 hover:bg-black/50 hover:text-white hover:border-white/30'
                    }`}
            >
                {isOpen ? <X size={18} /> : <Info size={18} />}
                <span className="text-sm font-medium">{isOpen ? 'Close Guide' : 'How to use'}</span>
            </button>

            <div className={`mt-3 transition-all duration-300 origin-top-right
                ${isOpen
                    ? 'opacity-100 scale-100 translate-y-0'
                    : 'opacity-0 scale-95 -translate-y-4 pointer-events-none'
                }`}
            >
                <div className="glass-panel p-5 rounded-2xl border border-white/10 shadow-2xl bg-[#0f172a]/80 backdrop-blur-xl w-64">
                    <h4 className="text-white font-semibold mb-3 border-b border-white/10 pb-2">Interactive Map</h4>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3 text-sm text-slate-300">
                            <div className="p-1.5 bg-violet-500/20 rounded-lg text-violet-400 mt-0.5">
                                <Move size={14} />
                            </div>
                            <div>
                                <strong className="block text-white text-xs uppercase tracking-wider mb-0.5">Pan</strong>
                                Drag anywhere to move the canvas around.
                            </div>
                        </li>
                        <li className="flex items-start gap-3 text-sm text-slate-300">
                            <div className="p-1.5 bg-cyan-500/20 rounded-lg text-cyan-400 mt-0.5">
                                <ZoomIn size={14} />
                            </div>
                            <div>
                                <strong className="block text-white text-xs uppercase tracking-wider mb-0.5">Zoom</strong>
                                Scroll to zoom in/out for details.
                            </div>
                        </li>
                        <li className="flex items-start gap-3 text-sm text-slate-300">
                            <div className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-400 mt-0.5">
                                <MousePointerClick size={14} />
                            </div>
                            <div>
                                <strong className="block text-white text-xs uppercase tracking-wider mb-0.5">Expand</strong>
                                Click nodes to reveal more connections.
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

/* =========================================================
   SAFE ERROR BOUNDARY
========================================================= */
class GraphErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ConceptGraph Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="w-full h-full flex items-center justify-center text-sm text-secondary p-4">
                    Graph crashed. (Render Error)
                </div>
            );
        }
        return this.props.children;
    }
}

/* =========================================================
   COLOR PALETTE — for node hierarchy
========================================================= */
/* =========================================================
   COLOR PALETTE — for node hierarchy
========================================================= */
const NODE_STYLES = {
    root: {
        bgGradient: ['#7c3aed', '#6d28d9'],  // Violet
        stroke: '#a78bfa',
        textFill: '#ffffff', // Pure White
        glowColor: 'rgba(139,92,246,0.6)', // Stronger Glow
        fontSize: 24, // Increased from 20
        fontWeight: '800', // Bolder
        paddingX: 40, // More padding
        paddingY: 24,
        borderRadius: 20,
        strokeWidth: 3,
    },
    main: {
        bgGradient: ['#0891b2', '#0e7490'],  // Cyan
        stroke: '#22d3ee',
        textFill: '#ffffff', // Pure White
        glowColor: 'rgba(6,182,212,0.5)',
        fontSize: 18, // Increased from 16
        fontWeight: '700', // Bolder
        paddingX: 30,
        paddingY: 18,
        borderRadius: 16,
        strokeWidth: 2.5,
    },
    child: {
        bgGradient: ['#1e293b', '#334155'],  // Slate
        stroke: '#cbd5e1', // Lighter stroke for visibility
        textFill: '#ffffff', // Pure White (was slate-100)
        glowColor: 'rgba(148,163,184,0.3)',
        fontSize: 15, // Increased from 14
        fontWeight: '600', // Bolder
        paddingX: 24,
        paddingY: 14,
        borderRadius: 12,
        strokeWidth: 2,
    },
};

/* =========================================================
   MAIN COMPONENT
========================================================= */
const ConceptGraph = ({ concepts }) => {
    const [dimensions, setDimensions] = useState({ width: 800, height: 550 });
    const containerRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [hoveredNode, setHoveredNode] = useState(null);

    // --- Resize Observer ---
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
                });
            }
        };

        window.addEventListener("resize", handleResize);
        setTimeout(handleResize, 100);

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // --- Transform Data to Hierarchy ---
    const treeData = useMemo(() => {
        if (!concepts || concepts.length === 0) return null;

        const root = {
            name: "Key Concepts",
            attributes: { isRoot: true },
            children: []
        };

        const topConcepts = concepts.slice(0, 5);

        topConcepts.forEach((concept, mainIndex) => {
            const name = concept.name || concept.id || concept;
            const node = {
                name: name,
                attributes: { group: "main", mainIndex: mainIndex + 1 },
                children: []
            };

            if (concept.related && Array.isArray(concept.related)) {
                concept.related.slice(0, 4).forEach((rel, childIndex) => {
                    node.children.push({
                        name: rel,
                        attributes: { group: "child", index: childIndex + 1 }
                    });
                });
            } else {
                const others = concepts.filter(c => (c.name || c) !== name).slice(0, 3);
                others.forEach((o, childIndex) => {
                    node.children.push({
                        name: o.name || o,
                        attributes: { group: "child", index: childIndex + 1 }
                    });
                });
            }
            root.children.push(node);
        });

        return root;
    }, [concepts]);

    // --- Helper: Truncate Text ---
    const truncate = (str, n) => {
        if (!str) return "";
        return str.length > n ? str.slice(0, n - 1) + "…" : str;
    };

    // --- Custom Node Renderer (Premium Pill Style) ---
    const renderCustomNodeElement = ({ nodeDatum, toggleNode }) => {
        const isRoot = nodeDatum.attributes?.isRoot;
        const isMain = nodeDatum.attributes?.group === "main";
        const isChild = nodeDatum.attributes?.group === "child";
        const childIndex = nodeDatum.attributes?.index;

        const style = isRoot ? NODE_STYLES.root : (isMain ? NODE_STYLES.main : NODE_STYLES.child);
        const fullLabel = nodeDatum.name;
        const displayLabel = truncate(fullLabel, 24);
        const nodeId = nodeDatum.name;
        const isHovered = hoveredNode === nodeId;

        // Calculate dimensions
        const charWidth = style.fontSize * 0.6; // Adjusted for font
        const textWidth = displayLabel.length * charWidth;
        // Extra padding for serial number
        const serialPadding = isChild ? 24 : 0;
        const width = textWidth + (style.paddingX * 2) + serialPadding;
        const height = style.fontSize + (style.paddingY * 2);

        // Gradient ID
        const gradientId = `grad-${nodeId.replace(/\s+/g, '-')}-${isRoot ? 'root' : isMain ? 'main' : 'child'}`;
        const filterId = `glow-${nodeId.replace(/\s+/g, '-')}`;

        return (
            <g
                onMouseEnter={() => setHoveredNode(nodeId)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{
                    cursor: "pointer",
                    transition: 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                    transform: isHovered ? 'translateY(-5px) scale(1.05)' : 'translateY(0) scale(1)'
                }}
            >
                {/* Gradient Definition */}
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={style.bgGradient[0]} />
                        <stop offset="100%" stopColor={style.bgGradient[1]} />
                    </linearGradient>
                    <filter id={filterId}>
                        <feDropShadow dx="0" dy={isHovered ? "8" : "4"} stdDeviation={isHovered ? "8" : "4"} floodColor={style.glowColor} floodOpacity={isHovered ? "0.6" : "0.4"} />
                    </filter>
                </defs>

                {/* Hover glow ring */}
                {isHovered && (
                    <rect
                        width={width + 8}
                        height={height + 8}
                        x={-(width + 8) / 2}
                        y={-(height + 8) / 2}
                        rx={style.borderRadius + 4}
                        fill="none"
                        stroke={style.stroke}
                        strokeWidth="1.5"
                        opacity="0.6"
                    />
                )}

                {/* Main Node */}
                <rect
                    width={width}
                    height={height}
                    x={-width / 2}
                    y={-height / 2}
                    rx={style.borderRadius}
                    fill={`url(#${gradientId})`}
                    stroke={style.stroke}
                    strokeWidth={style.strokeWidth}
                    filter={`url(#${filterId})`}
                    onClick={toggleNode}
                    style={{
                        transition: 'all 0.3s ease',
                    }}
                />

                {/* Serial Number Badge (Child Nodes) */}
                {isChild && childIndex && (
                    <g transform={`translate(${-width / 2 + 18}, 0)`}>
                        <circle
                            r={10}
                            fill="rgba(255,255,255,0.15)"
                            stroke={style.stroke}
                            strokeWidth="1"
                        />
                        <text
                            dy=".35em"
                            textAnchor="middle"
                            fontSize="10"
                            fontWeight="800"
                            fill="#ffffff"
                            style={{ pointerEvents: "none" }}
                        >
                            {childIndex}
                        </text>
                    </g>
                )}

                {/* Icon dot for main/root nodes */}
                {(isRoot || isMain) && (
                    <circle
                        cx={-width / 2 + 16}
                        cy={0}
                        r={4}
                        fill={style.textFill}
                        opacity={0.9}
                    />
                )}

                {/* Text Label */}
                <text
                    fill={style.textFill}
                    strokeWidth="0"
                    x={(isRoot || isMain) ? 8 : (isChild ? 12 : 0)}
                    y="0"
                    dy=".35em"
                    fontSize={style.fontSize}
                    fontWeight={style.fontWeight}
                    fontFamily="'Outfit', sans-serif"
                    textAnchor="middle"
                    onClick={toggleNode}
                    style={{ cursor: "pointer", pointerEvents: "none", letterSpacing: '0.02em', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
                >
                    {displayLabel}
                </text>

                {/* Children count badge for collapsible nodes */}
                {nodeDatum.children && nodeDatum.children.length > 0 && (
                    <g>
                        <circle
                            cx={width / 2 - 2}
                            cy={-height / 2 + 2}
                            r={10}
                            fill={style.bgGradient[0]}
                            stroke={style.stroke}
                            strokeWidth={1.5}
                        />
                        <text
                            x={width / 2 - 2}
                            y={-height / 2 + 2}
                            dy=".35em"
                            textAnchor="middle"
                            fontSize={10}
                            fontWeight="800"
                            fill={style.textFill}
                            style={{ pointerEvents: "none" }}
                        >
                            {nodeDatum.children.length}
                        </text>
                    </g>
                )}
            </g>
        );
    };

    if (!treeData) return null;

    return (
        <div
            ref={containerRef}
            className="w-full h-full rounded-2xl overflow-hidden relative"
            style={{ cursor: isDragging ? "grabbing" : "grab" }}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => { setIsDragging(false); setHoveredNode(null); }}
        >
            <GraphUsageGuide />

            {/* SVG CSS for custom links */}
            <style>{`
                .concept-tree-link {
                    stroke: rgba(148, 163, 184, 0.4) !important;
                    stroke-width: 2px !important;
                    fill: none !important;
                    transition: stroke 0.3s ease;
                }
                .concept-tree-link:hover {
                    stroke: rgba(139, 92, 246, 0.8) !important;
                    stroke-width: 3px !important;
                    filter: drop-shadow(0 0 4px rgba(139, 92, 246, 0.5));
                }
            `}</style>

            <GraphErrorBoundary>
                <Tree
                    data={treeData}
                    orientation="horizontal"
                    pathFunc="step"
                    translate={{ x: 100, y: dimensions.height / 2 }}

                    nodeSize={{ x: 340, y: 100 }}
                    separation={{ siblings: 0.8, nonSiblings: 1.2 }}

                    renderCustomNodeElement={renderCustomNodeElement}
                    enableLegacyTransitions={true}
                    transitionDuration={400}

                    zoomable={true}
                    draggable={true}
                    depthFactor={undefined}
                    scaleExtent={{ min: 0.3, max: 2 }}

                    pathClassFunc={() => "concept-tree-link"}
                />
            </GraphErrorBoundary>
        </div>
    );
};

export default ConceptGraph;
