import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';

import useStudyStore from '../../store/useStudyStore';

// Performance: Detect low-end devices
const isLowEnd = () => {
    if (typeof navigator === 'undefined') return false;
    const cores = navigator.hardwareConcurrency || 4;
    const memory = navigator.deviceMemory || 4; // GB (Chrome only)
    return cores <= 2 || memory <= 2;
};

// Respect user's OS-level motion preference
const prefersReducedMotion = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const Stars = ({ particleCount }) => {
    const ref = useRef();
    const sphere = useMemo(
        () => random.inSphere(new Float32Array(particleCount * 3), { radius: 1.5 }),
        [particleCount]
    );
    const { settings } = useStudyStore();
    const isDark = settings.theme === 'dark';
    const reduceMotion = prefersReducedMotion();

    // Throttled animation: skip frames on low-end
    const frameCount = useRef(0);
    useFrame((state, delta) => {
        if (reduceMotion) return; // No animation if user prefers reduced motion
        frameCount.current++;
        // Update every frame for smooth animation (delta already handles frame rate)
        ref.current.rotation.x -= delta / 12;
        ref.current.rotation.y -= delta / 18;
    });

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
                <PointMaterial
                    transparent
                    color={isDark ? "#8b5cf6" : "#94a3b8"}
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

    // Determine particle count based on device capability
    const particleCount = useMemo(() => {
        if (isLowEnd()) return 800;   // Low-end: minimal particles
        return 2000;                   // Normal: balanced (was 6000)
    }, []);

    // If user explicitly disabled effects in settings, show static bg only
    if (settings.reducedEffects) {
        return (
            <div className={`fixed inset-0 z-0 transition-colors duration-500 ${isDark ? 'bg-slate-900' : 'bg-transparent'}`} />
        );
    }

    return (
        <div className={`fixed inset-0 z-0 transition-colors duration-500 ${isDark ? 'bg-slate-900' : 'bg-transparent'}`}>
            <Canvas
                camera={{ position: [0, 0, 1] }}
                dpr={[1, 1.5]}          // Limit pixel ratio (was using device default, which can be 2-3x)
                gl={{ antialias: false, powerPreference: 'low-power' }} // Request low-power GPU
                frameloop="always"
            >
                <Stars particleCount={particleCount} />
            </Canvas>
        </div>
    );
};

export default Background3D;
