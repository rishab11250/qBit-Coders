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
   MAIN COMPONENT
========================================================= */
const ConceptGraph = ({ concepts }) => {
    const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
    const containerRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

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

        // Create a root node
        const root = {
            name: "Key Concepts",
            attributes: { isRoot: true },
            children: []
        };

        // Take top 5 concepts as parents
        const topConcepts = concepts.slice(0, 5);

        topConcepts.forEach(concept => {
            const name = concept.name || concept.id || concept;
            const node = {
                name: name,
                attributes: { group: "main" },
                children: []
            };

            // Add related concepts as children (fallback logic)
            if (concept.related && Array.isArray(concept.related)) {
                concept.related.slice(0, 4).forEach(rel => {
                    node.children.push({
                        name: rel,
                        attributes: { group: "child" }
                    });
                });
            } else {
                // Fallback: find other concepts
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
        return str.length > n ? str.slice(0, n - 1) + "..." : str;
    };

    // --- Custom Node Renderer (Pill Style) ---
    const renderCustomNodeElement = ({ nodeDatum, toggleNode }) => {
        const isRoot = nodeDatum.attributes?.isRoot;
        const isMain = nodeDatum.attributes?.group === "main";

        // 1. Label
        const fullLabel = nodeDatum.name;
        const displayLabel = truncate(fullLabel, 24);

        // 2. Style Config (Sizing)
        const fontSize = isRoot ? 16 : (isMain ? 14 : 12);
        const fontWeight = isRoot || isMain ? "600" : "500";
        const paddingX = isRoot ? 24 : (isMain ? 20 : 16);
        const paddingY = isRoot ? 12 : (isMain ? 10 : 8);
        const borderRadius = 8;

        // Approx width (font-dependent, 0.6em avg char width)
        const charWidth = fontSize * 0.6;
        const textWidth = displayLabel.length * charWidth;
        const width = textWidth + (paddingX * 2);
        const height = fontSize + (paddingY * 2);

        // 3. Color Hierarchy
        // Root = Purple, Parents = Indigo, Children = Slate
        let fill = "#0f172a"; // Slate-900 (Default BG)
        let stroke = "#334155"; // Slate-700 (Default Border)
        let textFill = "#cbd5e1"; // Slate-300 (Default Text)

        if (isRoot) {
            fill = "#2e1065"; // Purple-950 (optional deep bg)
            stroke = "#a855f7"; // Purple-500
            textFill = "#f3e8ff"; // Purple-100
        } else if (isMain) {
            fill = "#1e1b4b"; // Indigo-950
            stroke = "#6366f1"; // Indigo-500
            textFill = "#e0e7ff"; // Indigo-100
        }

        return (
            <g>
                <rect
                    width={width}
                    height={height}
                    x={-width / 2}
                    y={-height / 2}
                    rx={borderRadius}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={isRoot || isMain ? 2 : 1}
                    onClick={toggleNode}
                    style={{ cursor: "pointer" }}
                />
                <text
                    fill={textFill}
                    strokeWidth="0"
                    x="0"
                    y="0"
                    dy=".35em"
                    fontSize={fontSize}
                    fontWeight={fontWeight}
                    textAnchor="middle"
                    onClick={toggleNode}
                    style={{ cursor: "pointer", pointerEvents: "none" }} // Click through
                >
                    {displayLabel}
                </text>
            </g>
        );
    };

    if (!treeData) return null;

    return (
        <div
            ref={containerRef}
            className="w-full h-[500px] bg-[var(--bg-secondary)] rounded-2xl overflow-hidden relative"
            style={{ border: 'none', boxShadow: 'none', cursor: isDragging ? "grabbing" : "grab" }}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
        >
            <GraphErrorBoundary>
                <Tree
                    data={treeData}
                    orientation="vertical"
                    pathFunc="step" // Clean right angles
                    translate={{ x: dimensions.width / 2, y: 80 }}

                    // --- Sizing & Spacing ---
                    nodeSize={{ x: 340, y: 140 }}
                    separation={{ siblings: 2.7, nonSiblings: 3.2 }}

                    // --- Styling ---
                    renderCustomNodeElement={renderCustomNodeElement}
                    enableLegacyTransitions={true}
                    transitionDuration={300} // Fast snap

                    // --- Links ---
                    zoomable={true}
                    draggable={true}
                    depthFactor={undefined}

                    // --- Link Styling via CSS Class ---
                    pathClassFunc={() => "tree-link"}
                />
            </GraphErrorBoundary>

            {/* Status / Instructions */}
            <div className="absolute top-6 right-6 flex items-center gap-3 whitespace-nowrap z-10 pointer-events-none">
                <span className="text-xs font-medium text-slate-500 opacity-60">Interactive Tree Graph</span>
                <span className="text-xs text-slate-600 opacity-50">Click to collapse • Drag to pan</span>
            </div>
        </div>
    );
};

export default ConceptGraph;
