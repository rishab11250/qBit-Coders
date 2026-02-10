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
    const [theme, setTheme] = React.useState('dark');

    // Sync theme with DOM (since it's managed via data-theme attribute)
    React.useEffect(() => {
        const checkTheme = () => {
            const currentTheme = document.body.getAttribute('data-theme') || 'dark';
            setTheme(currentTheme);
        };

        // Check initially
        checkTheme();

        // Observer for theme changes
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

        return () => observer.disconnect();
    }, []);

    const isLight = theme === 'light';

    // Theme Colors
    const colors = useMemo(() => isLight ? {
        bg: 'transparent', // Canvas background
        nodeText: '#562F00',
        nodeSubText: '#8C6B45',
        labelBg: 'rgba(255, 253, 241, 0.95)', // Cream with opacity
        labelBorder: '#FFCE99',
        link: 'rgba(86, 47, 0, 0.15)',
        primary: '#FF9644', // Orange
        secondary: '#14b8a6' // Teal
    } : {
        bg: 'transparent',
        nodeText: '#e2e8f0',
        nodeSubText: '#94a3b8',
        labelBg: 'rgba(15, 23, 42, 0.85)', // Dark Slate
        labelBorder: 'rgba(255,255,255,0.1)',
        link: 'rgba(255,255,255,0.15)',
        primary: '#8b5cf6', // Violet
        secondary: '#14b8a6' // Teal
    }, [isLight]);

    const graphData = useMemo(() => {
        if (!concepts) return { nodes: [], links: [] };
        const nodes = [];
        const links = [];

        concepts.forEach((concept) => {
            const mainNodeId = concept.name;
            if (!nodes.find(n => n.id === mainNodeId)) {
                nodes.push({ id: mainNodeId, group: 1, val: 25 });
            }

            concept.related.forEach((relatedTerm) => {
                if (!nodes.find(n => n.id === relatedTerm)) {
                    nodes.push({ id: relatedTerm, group: 2, val: 12 });
                }
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
                    dagMode="td"
                    dagLevelDistance={120} // Increased vertical spacing
                    backgroundColor={colors.bg}
                    nodeAutoColorBy="group"

                    /* Link Styling */
                    linkColor={() => colors.link}
                    linkWidth={1.5}
                    linkDirectionalParticles={2}
                    linkDirectionalParticleSpeed={0.005}
                    linkDirectionalParticleWidth={2}
                    linkCurvature={0} // Straight lines for cleaner tree look

                    /* Engine Settings - Increased spacing */
                    d3VelocityDecay={0.3}
                    d3AlphaDecay={0.01}
                    cooldownTicks={150}
                    nodeRelSize={8} // Controls horizontal spacing

                    /* Custom Node Rendering */
                    nodeCanvasObject={(node, ctx, globalScale) => {
                        const label = node.id;
                        const fontSize = (node.group === 1 ? 14 : 11) / globalScale;
                        ctx.font = `${node.group === 1 ? '600' : '400'} ${fontSize}px 'Outfit', sans-serif`;

                        const textWidth = ctx.measureText(label).width;
                        const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.8);

                        // Colors
                        const nodeColor = node.group === 1 ? colors.primary : colors.secondary;

                        // Draw Node Glow
                        ctx.shadowColor = nodeColor;
                        ctx.shadowBlur = node.group === 1 ? 15 : 5;

                        // Draw Node Circle
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, (node.group === 1 ? 6 : 4), 0, 2 * Math.PI, false);
                        ctx.fillStyle = nodeColor;
                        ctx.fill();

                        // Reset Shadow for text logic
                        ctx.shadowBlur = 0;

                        // Draw Label Background (Capsule)
                        ctx.fillStyle = colors.labelBg;
                        // For light mode, adding a shadow to the label makes it pop
                        if (isLight) {
                            ctx.shadowColor = 'rgba(0,0,0,0.1)';
                            ctx.shadowBlur = 4;
                        }

                        ctx.beginPath();
                        ctx.roundRect(
                            node.x - bckgDimensions[0] / 2,
                            node.y + 12,
                            bckgDimensions[0],
                            bckgDimensions[1],
                            6
                        );
                        ctx.fill();

                        // Reset Shadow again
                        ctx.shadowBlur = 0;

                        // Border for Label
                        ctx.strokeStyle = colors.labelBorder;
                        ctx.lineWidth = 1 / globalScale;
                        ctx.stroke();

                        // Draw Label Text
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = colors.nodeText;
                        ctx.fillText(label, node.x, node.y + 12 + bckgDimensions[1] / 2);
                    }}
                />

                {/* Legend Overlay */}
                <div className="absolute bottom-4 right-4 flex gap-4 text-xs font-medium text-secondary bg-[var(--bg-secondary)]/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-primary/10 shadow-sm">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)] shadow-[0_0_8px_rgba(var(--accent-primary),0.6)]"></span>
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
