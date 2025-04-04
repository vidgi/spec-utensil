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
import placeholder from "./images/placeholder.png";
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
      title: "spoutstraw",
      description: "a speculative utensil designed by vidya giri",
      showSketches: true,
      zoom: 1
    },
    {
      title: "wisdom from nature",
      description: "with this groundbreaking straw inspired by lotus seed pods, the last bit of a sadhya meal (a traditional malayali meal served on a banana leaf) can be slurped up",
      camera: { position: [0, 0, 3], fov: 50 },
      background: ["#ffffff", "#ffffff"],
      wireframe: false,
      rotation: [0, 0, 0],
      zoom: 1,
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
      title: "suction chamber spout",
      description: "various suction chambers of the straw's spout allow for a variety of flavors to be sucked up in one go",
      camera: { position: [0, 0, 5], fov: 50 },
      background: ["#ffffff", "#ffffff"],
      wireframe: true,
      rotation: [0, 0, 0],
      zoom: 2,
      material: {
        type: 'basic',
        color: 'khaki'
      }
    },
    {
      title: "slurp without your hands",
      description: "a new way to enjoy a sadhya and savor every last bit, with zero hands required",
      camera: { position: [0, 0, 5], fov: 50 },
      background: ["#ffffff", "#ffffff"],
      wireframe: false,
      rotation: [0, Math.PI / 2, 0],
      zoom: 1.5,
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
    if (currentView === 0) return [0, 0, 0];
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
    if (currentView === 0) return 1;
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
            background: `linear-gradient(to bottom, ${view.background?.[0] || '#ffffff'}, ${view.background?.[1] || '#ffffff'})`,
            height: '100vh',
            position: 'relative'
          }}
        >
          <div className="view-content">
            <h1>{view.title}</h1>
            <p>{view.description}</p>
          </div>
          {view.showSketches ? (
            <div className="sketch-cluster">
                <div className="sketch-item">
                  <img src={placeholder} alt="Sketch" />
                </div>
            </div>
          ) : (
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
          )}
        </section>
        
      ))}
      <Loader />
      <footer className="footer">
        <p><small>
        made by  <a href="https://vidyagiri.com" target="_blank" rel="noopener noreferrer">vidya giri</a> 
          <br/>
          font: basteleur by keussel (velvetyne.fr) + space grotesk (google fonts)</small>
        </p>
      </footer>
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
