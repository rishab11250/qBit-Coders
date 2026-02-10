import React, { useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

const ConceptGraph = ({ concepts }) => {
    const graphData = useMemo(() => {
        if (!concepts) return { nodes: [], links: [] };
        const nodes = [];
        const links = [];

        concepts.forEach((concept) => {
            // Main Concept Node (Group 1)
            if (!nodes.find(n => n.id === concept.name)) {
                nodes.push({ id: concept.name, group: 1, val: 20 });
            }


            concept.related.forEach((relatedTerm) => {
                // Related Term Node (Group 2) - prevent duplicates
                if (!nodes.find(n => n.id === relatedTerm)) {
                    nodes.push({ id: relatedTerm, group: 2, val: 10 });
                }
                // Link them
                links.push({ source: concept.name, target: relatedTerm });
            });
        });

        return { nodes, links };
    }, [concepts]);

    return (
        <div className="w-full h-full">
            <ForceGraph2D
                graphData={graphData}
                nodeAutoColorBy="group"
                nodeLabel="id"
                backgroundColor="rgba(0,0,0,0)" // Transparent
                linkColor={() => 'rgba(255,255,255,0.2)'}
                nodeCanvasObject={(node, ctx, globalScale) => {
                    const label = node.id;
                    const fontSize = 14 / globalScale;
                    ctx.font = `${fontSize}px Sans-Serif`;
                    const textWidth = ctx.measureText(label).width;
                    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.5);

                    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                    if (node.group === 1) ctx.fillStyle = 'rgba(139, 92, 246, 0.3)'; // Violet
                    if (node.group === 2) ctx.fillStyle = 'rgba(236, 72, 153, 0.3)'; // Pink

                    ctx.beginPath();
                    ctx.roundRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions, 4);
                    ctx.fill();

                    // Border
                    ctx.strokeStyle = node.group === 1 ? '#8b5cf6' : '#ec4899';
                    ctx.lineWidth = 1 / globalScale;
                    ctx.stroke();

                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(label, node.x, node.y);
                }}
            />
        </div>
    );
};

export default ConceptGraph;
