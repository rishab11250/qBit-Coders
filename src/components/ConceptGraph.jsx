import React, { useMemo } from 'react';
import useStudyStore from '../store/useStudyStore';
import ForceGraph2D from 'react-force-graph-2d';

const ConceptGraph = ({ concepts }) => {
    const { settings } = useStudyStore();
    const isDark = settings.theme === 'dark';

    const graphData = useMemo(() => {
        if (!concepts) return { nodes: [], links: [] };
        const nodes = [];
        const links = [];

        concepts.forEach((concept, index) => {
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
        <div className="w-full h-full min-h-[400px] border border-white/10 rounded-2xl overflow-hidden bg-black/20">
            <ForceGraph2D
                graphData={graphData}
                nodeAutoColorBy="group"
                nodeLabel="id"
                backgroundColor="rgba(0,0,0,0)"
                linkColor={() => isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}
                nodeRelSize={6}
                d3VelocityDecay={0.1} // More fluid movement
                d3AlphaDecay={0.02}   // Slower settle time
                cooldownTicks={100}
                onEngineStop={() => { }} // Keep it alive if needed

                // Custom Node Rendering
                nodeCanvasObject={(node, ctx, globalScale) => {
                    const label = node.id;
                    const fontSize = (node.group === 1 ? 16 : 12) / globalScale;
                    ctx.font = `${node.group === 1 ? 'bold' : ''} ${fontSize}px Sans-Serif`;

                    const textWidth = ctx.measureText(label).width;
                    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.5);

                    // Dynamic Colors based on theme
                    const primaryColor = isDark ? '#8b5cf6' : '#7c3aed'; // Violet
                    const secondaryColor = isDark ? '#db2777' : '#be185d'; // Pink

                    const nodeColor = node.group === 1 ? primaryColor : secondaryColor;
                    const bgColor = isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)';

                    // Draw Node Circle (behind text)
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, node.val / 3, 0, 2 * Math.PI, false);
                    ctx.fillStyle = nodeColor;
                    ctx.fill();

                    // Draw Label Background
                    ctx.fillStyle = bgColor;
                    ctx.beginPath();
                    ctx.roundRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2 + (node.group === 1 ? 20 : 15), ...bckgDimensions, 4);
                    ctx.fill();

                    // Text Border
                    ctx.strokeStyle = nodeColor;
                    ctx.lineWidth = 1 / globalScale;
                    ctx.stroke();

                    // Draw Label Text
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = nodeColor;
                    ctx.fillText(label, node.x, node.y + (node.group === 1 ? 20 : 15));
                }}
            />
        </div>
    );
};

export default ConceptGraph;
