import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';

import useStudyStore from '../../store/useStudyStore';

const Stars = (props) => {
    const ref = useRef();
    const sphere = useMemo(() => random.inSphere(new Float32Array(6000), { radius: 1.5 }), []);
    const { settings } = useStudyStore();
    const isDark = settings.theme === 'dark';

    useFrame((state, delta) => {
        ref.current.rotation.x -= delta / 10;
        ref.current.rotation.y -= delta / 15;
    });

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
                <PointMaterial
                    transparent
                    color={isDark ? "#8b5cf6" : "#94a3b8"} // Violet in Dark, Slate in Light
                    size={0.002}
                    sizeAttenuation={true}
                    depthWrite={false}
                />
            </Points>
        </group>
    );
};

const Background3D = () => {
    const { settings } = useStudyStore();
    const isDark = settings.theme === 'dark';

    return (
        <div className={`fixed inset-0 z-0 transition-colors duration-500 ${isDark ? 'bg-slate-900' : 'bg-transparent'}`}>
            <Canvas camera={{ position: [0, 0, 1] }}>
                <Stars />
            </Canvas>
        </div>
    );
};

export default Background3D;
