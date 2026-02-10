import useStudyStore from '../store/useStudyStore';

const ConceptGraph = ({ concepts }) => {
    const { settings } = useStudyStore();
    const isDark = settings.theme === 'dark';

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
                linkColor={() => isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}
                nodeCanvasObject={(node, ctx, globalScale) => {
                    const label = node.id;
                    const fontSize = 14 / globalScale;
                    ctx.font = `${fontSize}px Sans-Serif`;
                    const textWidth = ctx.measureText(label).width;
                    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.5);

                    if (isDark) {
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                    } else {
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
                    }

                    if (node.group === 1) ctx.fillStyle = isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(124, 58, 237, 0.2)'; // Violet
                    if (node.group === 2) ctx.fillStyle = isDark ? 'rgba(236, 72, 153, 0.3)' : 'rgba(219, 39, 119, 0.2)'; // Pink

                    ctx.beginPath();
                    ctx.roundRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions, 4);
                    ctx.fill();

                    // Border
                    ctx.strokeStyle = node.group === 1 ? (isDark ? '#8b5cf6' : '#7c3aed') : (isDark ? '#ec4899' : '#db2777');
                    ctx.lineWidth = 1 / globalScale;
                    ctx.stroke();

                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = isDark ? '#ffffff' : '#1e293b';
                    ctx.fillText(label, node.x, node.y);
                }}
            />
        </div>
    );
};

export default ConceptGraph;
