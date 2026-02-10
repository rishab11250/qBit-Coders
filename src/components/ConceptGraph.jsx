import React, { useMemo, useState, useEffect, useRef } from "react";
import Tree from 'react-d3-tree';
import useStudyStore from "../store/useStudyStore";

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
const NODE_STYLES = {
    root: {
        bgGradient: ['#7c3aed', '#6d28d9'],  // Violet
        stroke: '#a78bfa',
        textFill: '#f5f3ff',
        glowColor: 'rgba(139,92,246,0.25)',
        fontSize: 16,
        fontWeight: '700',
        paddingX: 28,
        paddingY: 14,
        borderRadius: 14,
        strokeWidth: 2,
    },
    main: {
        bgGradient: ['#0891b2', '#0e7490'],  // Cyan
        stroke: '#22d3ee',
        textFill: '#ecfeff',
        glowColor: 'rgba(6,182,212,0.2)',
        fontSize: 14,
        fontWeight: '600',
        paddingX: 22,
        paddingY: 11,
        borderRadius: 12,
        strokeWidth: 1.5,
    },
    child: {
        bgGradient: ['#1e293b', '#334155'],  // Slate
        stroke: '#475569',
        textFill: '#cbd5e1',
        glowColor: 'rgba(100,116,139,0.15)',
        fontSize: 12,
        fontWeight: '500',
        paddingX: 16,
        paddingY: 9,
        borderRadius: 10,
        strokeWidth: 1,
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

        topConcepts.forEach(concept => {
            const name = concept.name || concept.id || concept;
            const node = {
                name: name,
                attributes: { group: "main" },
                children: []
            };

            if (concept.related && Array.isArray(concept.related)) {
                concept.related.slice(0, 4).forEach(rel => {
                    node.children.push({
                        name: rel,
                        attributes: { group: "child" }
                    });
                });
            } else {
                const others = concepts.filter(c => (c.name || c) !== name).slice(0, 3);
                others.forEach(o => {
                    node.children.push({
                        name: o.name || o,
                        attributes: { group: "child" }
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

        const style = isRoot ? NODE_STYLES.root : (isMain ? NODE_STYLES.main : NODE_STYLES.child);
        const fullLabel = nodeDatum.name;
        const displayLabel = truncate(fullLabel, 24);
        const nodeId = nodeDatum.name;
        const isHovered = hoveredNode === nodeId;

        // Calculate dimensions
        const charWidth = style.fontSize * 0.58;
        const textWidth = displayLabel.length * charWidth;
        const width = textWidth + (style.paddingX * 2);
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
                    transform: isHovered ? 'translateY(-5px)' : 'translateY(0)'
                }}
            >
                {/* Gradient Definition */}
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={style.bgGradient[0]} />
                        <stop offset="100%" stopColor={style.bgGradient[1]} />
                    </linearGradient>
                    <filter id={filterId}>
                        <feDropShadow dx="0" dy={isHovered ? "8" : "2"} stdDeviation={isHovered ? "6" : "3"} floodColor={style.glowColor} floodOpacity={isHovered ? "0.4" : "0.3"} />
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
                        strokeWidth="1"
                        opacity="0.4"
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

                {/* Icon dot for main nodes */}
                {(isRoot || isMain) && (
                    <circle
                        cx={-width / 2 + 14}
                        cy={0}
                        r={3}
                        fill={style.textFill}
                        opacity={0.6}
                    />
                )}

                {/* Text Label */}
                <text
                    fill={style.textFill}
                    strokeWidth="0"
                    x={(isRoot || isMain) ? 6 : 0}
                    y="0"
                    dy=".35em"
                    fontSize={style.fontSize}
                    fontWeight={style.fontWeight}
                    fontFamily="'Outfit', sans-serif"
                    textAnchor="middle"
                    onClick={toggleNode}
                    style={{ cursor: "pointer", pointerEvents: "none", letterSpacing: '0.01em' }}
                >
                    {displayLabel}
                </text>

                {/* Children count badge for collapsible nodes */}
                {nodeDatum.children && nodeDatum.children.length > 0 && (
                    <g>
                        <circle
                            cx={width / 2 - 2}
                            cy={-height / 2 + 2}
                            r={9}
                            fill={style.bgGradient[0]}
                            stroke={style.stroke}
                            strokeWidth={1}
                        />
                        <text
                            x={width / 2 - 2}
                            y={-height / 2 + 2}
                            dy=".35em"
                            textAnchor="middle"
                            fontSize={9}
                            fontWeight="700"
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
            {/* SVG CSS for custom links */}
            <style>{`
                .concept-tree-link {
                    stroke: rgba(100, 116, 139, 0.25) !important;
                    stroke-width: 1.5px !important;
                    fill: none !important;
                    transition: stroke 0.3s ease;
                }
                .concept-tree-link:hover {
                    stroke: rgba(139, 92, 246, 0.5) !important;
                    stroke-width: 2px !important;
                }
            `}</style>

            <GraphErrorBoundary>
                <Tree
                    data={treeData}
                    orientation="vertical"
                    pathFunc="step"
                    translate={{ x: dimensions.width / 2, y: 80 }}

                    nodeSize={{ x: 340, y: 150 }}
                    separation={{ siblings: 2.7, nonSiblings: 3.2 }}

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
