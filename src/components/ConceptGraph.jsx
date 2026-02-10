import React, { useMemo } from 'react';
import useStudyStore from '../store/useStudyStore';
import ForceGraph2D from 'react-force-graph-2d';

class GraphErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Concept Graph WebGL Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="w-full h-full flex items-center justify-center text-secondary text-sm bg-black/20 rounded-2xl border border-white/10 p-4">
                    <p>Graph visualization unavailable (WebGL Context Lost). Please refresh.</p>
                </div>
            );
        }

        return this.props.children;
    }
}

const ConceptGraph = ({ concepts }) => {
    const { settings } = useStudyStore();
    // Always dark theme for this premium look, but respecting toggle if needed for text
    const isDark = true;

    const graphData = useMemo(() => {
        if (!concepts) return { nodes: [], links: [] };
        const nodes = [];
        const links = [];

        concepts.forEach((concept) => {
            // Main Concept Node (Group 1)
            const mainNodeId = concept.name;
            if (!nodes.find(n => n.id === mainNodeId)) {
                nodes.push({ id: mainNodeId, group: 1, val: 25 });
            }

            concept.related.forEach((relatedTerm) => {
                // Related Term Node (Group 2)
                if (!nodes.find(n => n.id === relatedTerm)) {
                    nodes.push({ id: relatedTerm, group: 2, val: 12 });
                }
                // Link them
                links.push({ source: mainNodeId, target: relatedTerm });
            });
        });

        return { nodes, links };
    }, [concepts]);

    return (
        <div className="w-full h-full min-h-[500px] bg-[var(--bg-secondary)] relative group">
            <GraphErrorBoundary>
                <ForceGraph2D
                    graphData={graphData}
                    dagMode="td" /* Tree Layout: Top-Down */
                    dagLevelDistance={100}
                    backgroundColor="transparent"
                    nodeAutoColorBy="group"
                    nodeLabel="id"

                    /* Link Styling */
                    linkColor={() => 'rgba(255,255,255,0.15)'}
                    linkWidth={1.5}
                    linkDirectionalParticles={2}
                    linkDirectionalParticleSpeed={0.005}
                    linkDirectionalParticleWidth={2}
                    linkCurvature={0.25}

                    /* Engine Settings */
                    d3VelocityDecay={0.3}
                    cooldownTicks={100}
                    onEngineStop={() => { }}

                    // Custom Node Rendering
                    nodeCanvasObject={(node, ctx, globalScale) => {
                        const label = node.id;
                        const fontSize = (node.group === 1 ? 14 : 11) / globalScale;
                        ctx.font = `${node.group === 1 ? '600' : '400'} ${fontSize}px 'Outfit', sans-serif`;

                        const textWidth = ctx.measureText(label).width;
                        const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.8);

                        // Premium Colors
                        const primaryColor = '#8b5cf6'; // Violet
                        const secondaryColor = '#14b8a6'; // Teal
                        const nodeColor = node.group === 1 ? primaryColor : secondaryColor;

                        // Draw Node Glow
                        ctx.shadowColor = nodeColor;
                        ctx.shadowBlur = node.group === 1 ? 15 : 5;

                        // Draw Node Circle
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, (node.group === 1 ? 6 : 4), 0, 2 * Math.PI, false);
                        ctx.fillStyle = nodeColor;
                        ctx.fill();

                        // Reset Shadow for text
                        ctx.shadowBlur = 0;

                        // Draw Label Background (Capsule)
                        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'; // Dark background
                        ctx.beginPath();
                        ctx.roundRect(
                            node.x - bckgDimensions[0] / 2,
                            node.y + 12,
                            bckgDimensions[0],
                            bckgDimensions[1],
                            4
                        );
                        ctx.fill();

                        // Border for Label
                        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                        ctx.lineWidth = 1 / globalScale;
                        ctx.stroke();

                        // Draw Label Text
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = '#e2e8f0';
                        ctx.fillText(label, node.x, node.y + 12 + bckgDimensions[1] / 2);
                    }}
                />

                {/* Legend Overlay */}
                <div className="absolute bottom-4 right-4 flex gap-4 text-xs font-medium text-secondary bg-black/40 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/5">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]"></span>
                        <span>Key Concepts</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.6)]"></span>
                        <span>Related Topics</span>
                    </div>
                </div>
            </GraphErrorBoundary>
        </div>
    );
};

export default ConceptGraph;
