import React, { useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

const ConceptGraph = ({ concepts }) => {
    const graphData = useMemo(() => {
        if (!concepts) return { nodes: [], links: [] };
        const nodes = [];
        const links = [];

        concepts.forEach((concept) => {
            // Main Concept Node (Group 1)
            nodes.push({ id: concept.name, group: 1, val: 10 });

            concept.related.forEach((relatedTerm) => {
                // Related Term Node (Group 2) - prevent duplicates
                if (!nodes.find(n => n.id === relatedTerm)) {
                    nodes.push({ id: relatedTerm, group: 2, val: 5 });
                }
                // Link them
                links.push({ source: concept.name, target: relatedTerm });
            });
        });

        return { nodes, links };
    }, [concepts]);

    return (
        <div style={{ height: '100%', width: '100%', background: '#1e1e2e', borderRadius: '12px', overflow: 'hidden' }}>
            <ForceGraph2D
                graphData={graphData}
                nodeAutoColorBy="group"
                nodeLabel="id"
                width={600}
                height={400}
                backgroundColor="#1e1e2e"
                nodeCanvasObject={(node, ctx, globalScale) => {
                    const label = node.id;
                    const fontSize = 12 / globalScale;
                    ctx.font = `${fontSize}px Sans-Serif`;
                    const textWidth = ctx.measureText(label).width;
                    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

                    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                    ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);

                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = node.group === 1 ? '#6366F1' : '#EC4899';
                    ctx.fillText(label, node.x, node.y);
                }}
            />
        </div>
    );
};

export default ConceptGraph;
