import React, { Suspense, useState, useRef, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import {
  useGLTF,
  Environment,
  OrbitControls,
  MeshTransmissionMaterial,
  Loader,
} from "@react-three/drei";
import { EffectComposer, Glitch, Pixelation } from '@react-three/postprocessing';
import { GlitchMode } from 'postprocessing';
import dirtModel from "./dirt_blend.glb";
import texture from "./texture.hdr";
import "./App.css";

const easeInOutCubic = (t) => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

const lerp = (start, end, t) => {
  return start * (1 - t) + end * t;
};

export default function App() {
  const [currentView, setCurrentView] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef(null);
  // const prevRotation = useRef([0, 0, 0]);

  const handleScroll = (e) => {
    const container = containerRef.current;
    if (!container) return;

    const scrollPosition = window.scrollY;
    const windowHeight = window.innerHeight;
    const viewIndex = Math.floor(scrollPosition / windowHeight);
    const progress = (scrollPosition % windowHeight) / windowHeight;
    
    setScrollProgress(progress);
    if (viewIndex !== currentView && viewIndex >= 0 && viewIndex <= 3) {
      setCurrentView(viewIndex);
    }
  };

  React.useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentView]);

  const views = [
    {
      title: "speculative utensil",
      description: "a speculative utensil designed by vidya giri",
      camera: { position: [0, 0, 5], fov: 50 },
      background: ["#000000", "#000000"],
      wireframe: false,
      rotation: [0, 0, 0],
      zoom: 0.5,
      material: {
        type: 'basic',
        color: '#ffffff'
      },
      effects: true
    },
    {
      title: "Welcome",
      description: "Explore the intricate details of this 3D model through different perspectives. Scroll to navigate through various views.",
      camera: { position: [0, 0, 5], fov: 50 },
      background: ["#000000", "#1a1a1a"],
      wireframe: false,
      rotation: [0, 0, 0],
      zoom: 2,
      material: {
        type: 'physical',
        color: '#ffffff',
        roughness: 0.2,
        metalness: 0.8,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1
      }
    },
    {
      title: "Wireframe View",
      description: "Explore the structural complexity of the model through its wireframe representation.",
      camera: { position: [0, 0, 5], fov: 50 },
      background: ["#1a1a1a", "#000000"],
      wireframe: true,
      rotation: [0, 0, 0],
      zoom: 3,
      material: {
        type: 'basic',
        color: '#ffffff'
      }
    },
    {
      title: "Far View",
      description: "Appreciate the model's overall form and presence in the space. Click and drag to rotate, scroll to zoom.",
      camera: { position: [0, 0, 5], fov: 50 },
      background: ["#000000", "#1a1a1a"],
      wireframe: false,
      rotation: [0, Math.PI / 2, 0],
      zoom: 2,
      material: {
        type: 'physical',
        color: '#ffffff',
        roughness: 0.2,
        metalness: 0.8,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1
      },
      orbitControls: true
    }
  ];

  const currentRotation = useMemo(() => {
    const currentViewRotation = views[currentView].rotation;
    const nextViewRotation = views[Math.min(currentView + 1, views.length - 1)].rotation;
    
    const easedProgress = easeInOutCubic(scrollProgress);
    
    return [
      lerp(currentViewRotation[0], nextViewRotation[0], easedProgress),
      lerp(currentViewRotation[1], nextViewRotation[1], easedProgress),
      lerp(currentViewRotation[2], nextViewRotation[2], easedProgress)
    ];
  }, [currentView, scrollProgress]);

  const currentZoom = useMemo(() => {
    const currentViewZoom = views[currentView].zoom;
    const nextViewZoom = views[Math.min(currentView + 1, views.length - 1)].zoom;
    
    const easedProgress = easeInOutCubic(scrollProgress);
    
    return lerp(currentViewZoom, nextViewZoom, easedProgress);
  }, [currentView, scrollProgress]);

  return (
    <div ref={containerRef} className="app-container">
      {views.map((view, index) => (
        <section 
          key={index} 
          className="view-section"
          style={{ 
            background: `linear-gradient(to bottom, ${view.background[0]}, ${view.background[1]})`,
            height: '100vh',
            position: 'relative'
          }}
        >
          <div className="view-content">
            <h1>{view.title}</h1>
            <p>{view.description}</p>
          </div>
          <Canvas shadows camera={view.camera}>
            <Suspense fallback={null}>
              <Environment files={texture} />
              {view.orbitControls && <OrbitControls autoRotate enableZoom={false} enablePan={false} />}
              <DirtModel 
                position={[0, 0, 0]} 
                scale={currentZoom} 
                wireframe={view.wireframe}
                material={view.material}
                rotation={currentRotation}
              />
              {view.effects && (
                <EffectComposer>
                  <Pixelation granularity={1} />
                  <Glitch
                    delay={[0.5, 2]}
                    duration={[0.6, 1.0]}
                    strength={[0.3, 1]}
                    mode={GlitchMode.SPORADIC}
                    columns={0.05}
                    dtSize={100}
                    active
                    ratio={0.85}
                  />
                </EffectComposer>
              )}
            </Suspense>
          </Canvas>
        </section>
      ))}
      <Loader />
    </div>
  );
}

function DirtModel({ position, scale, wireframe, rotation, material }) {
  const { nodes } = useGLTF(dirtModel);
  
  return (
    <group position={position} scale={scale} rotation={rotation}>
      <mesh geometry={nodes.Mesh_0.geometry}>
        {wireframe ? (
          <meshBasicMaterial wireframe color={material.color} />
        ) : material.type === 'physical' ? (
          <meshPhysicalMaterial
            color={material.color}
            roughness={material.roughness}
            metalness={material.metalness}
            clearcoat={material.clearcoat}
            clearcoatRoughness={material.clearcoatRoughness}
          />
        ) : (
          <MeshTransmissionMaterial 
            resolution={material.resolution}
            thickness={material.thickness}
            anisotropy={material.anisotropy}
            chromaticAberration={material.chromaticAberration}
          />
        )}
      </mesh>
    </group>
  );
}
