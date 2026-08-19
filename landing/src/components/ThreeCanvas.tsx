import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ThreeCanvas: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isCompactScreen = window.innerWidth < 768;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xf6f8ff, 9, 18);

    const camera = new THREE.PerspectiveCamera(50, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.set(0, 0.3, 9.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, prefersReducedMotion ? 1.2 : 1.8));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const root = new THREE.Group();
    scene.add(root);

    const starCount = prefersReducedMotion ? 48 : isCompactScreen ? 90 : 150;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 18;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      starPositions[i * 3 + 2] = -1.5 - Math.random() * 8;
    }

    const starsGeometry = new THREE.BufferGeometry();
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starsMaterial = new THREE.PointsMaterial({
      color: 0x8ccbf9,
      size: prefersReducedMotion ? 0.045 : 0.065,
      transparent: true,
      opacity: 0.72,
      sizeAttenuation: true,
    });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    root.add(stars);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.25);
    scene.add(ambientLight);

    const keyLight = new THREE.PointLight(0xfff1ba, 2.2, 22, 2);
    keyLight.position.set(0, 0, 4);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0x7dd3fc, 1.6, 22, 2);
    fillLight.position.set(-5, -2, 4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x6366f1, 0.9);
    rimLight.position.set(5, 4, 6);
    scene.add(rimLight);

    const sunGeometry = new THREE.SphereGeometry(0.9, 48, 48);
    const sunMaterial = new THREE.MeshPhongMaterial({
      color: 0xfff2b2,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.55,
      shininess: 80,
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    root.add(sun);

    const sunAuraGeometry = new THREE.SphereGeometry(1.38, 40, 40);
    const sunAuraMaterial = new THREE.MeshBasicMaterial({
      color: 0xfef3c7,
      transparent: true,
      opacity: 0.18,
    });
    const sunAura = new THREE.Mesh(sunAuraGeometry, sunAuraMaterial);
    root.add(sunAura);

    const orbitRings: THREE.Mesh[] = [];
    [1.9, 2.85, 3.75, 4.6].forEach((radius, index) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.01, 8, 120),
        new THREE.MeshBasicMaterial({
          color: index % 2 === 0 ? 0xc7d2fe : 0xbae6fd,
          transparent: true,
          opacity: 0.42,
        })
      );
      ring.rotation.x = Math.PI / 2.25;
      ring.rotation.z = index * 0.24;
      root.add(ring);
      orbitRings.push(ring);
    });

    const orbitGroup = new THREE.Group();
    root.add(orbitGroup);

    const planets = [
      { radius: 1.9, size: 0.22, color: 0x6366f1, speed: 0.48, offset: 0.2, y: 0.08 },
      { radius: 2.85, size: 0.32, color: 0x0ea5e9, speed: 0.3, offset: 1.4, y: -0.1 },
      { radius: 3.75, size: 0.26, color: 0xf59e0b, speed: 0.2, offset: 2.2, y: 0.15 },
      { radius: 4.6, size: 0.36, color: 0xec4899, speed: 0.14, offset: 3.4, y: -0.22 },
    ].map((config) => {
      const pivot = new THREE.Group();
      orbitGroup.add(pivot);

      const planet = new THREE.Mesh(
        new THREE.SphereGeometry(config.size, 32, 32),
        new THREE.MeshPhongMaterial({
          color: config.color,
          emissive: config.color,
          emissiveIntensity: 0.16,
          shininess: 70,
        })
      );

      planet.position.set(config.radius, config.y, 0);
      pivot.add(planet);

      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(config.size * 1.6, 24, 24),
        new THREE.MeshBasicMaterial({
          color: config.color,
          transparent: true,
          opacity: 0.08,
        })
      );
      halo.position.copy(planet.position);
      pivot.add(halo);

      return { ...config, pivot, planet, halo };
    });

    let mouseX = 0;
    let mouseY = 0;
    const handleMouse = (e: MouseEvent) => {
      if (prefersReducedMotion) return;
      mouseX = (e.clientX / window.innerWidth - 0.5) * 0.65;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.45;
    };
    if (!prefersReducedMotion) {
      window.addEventListener('mousemove', handleMouse);
    }

    const handleResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      sun.rotation.y = t * 0.25;
      sun.rotation.x = Math.sin(t * 0.4) * 0.06;

      const auraScale = 1 + Math.sin(t * 1.4) * 0.04;
      sunAura.scale.setScalar(auraScale);

      root.rotation.z = Math.sin(t * 0.16) * 0.05;
      root.rotation.x = prefersReducedMotion ? 0.08 : mouseY * 0.08;

      orbitRings.forEach((ring, index) => {
        ring.rotation.z += (index % 2 === 0 ? 1 : -1) * 0.0012;
      });

      planets.forEach((planetConfig, index) => {
        const angle = t * planetConfig.speed + planetConfig.offset;
        planetConfig.pivot.rotation.y = angle;
        planetConfig.planet.position.y = planetConfig.y + Math.sin(t * 1.3 + index) * 0.08;
        planetConfig.planet.rotation.y += 0.01;
        planetConfig.halo.position.copy(planetConfig.planet.position);
      });

      stars.rotation.z = t * 0.02;

      camera.position.x += ((prefersReducedMotion ? 0 : mouseX * 1.25) - camera.position.x) * 0.03;
      camera.position.y += ((prefersReducedMotion ? 0.3 : 0.35 - mouseY * 0.8) - camera.position.y) * 0.03;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      if (!prefersReducedMotion) {
        window.removeEventListener('mousemove', handleMouse);
      }
      window.removeEventListener('resize', handleResize);
      starsGeometry.dispose();
      starsMaterial.dispose();
      sunGeometry.dispose();
      sunMaterial.dispose();
      sunAuraGeometry.dispose();
      sunAuraMaterial.dispose();
      orbitRings.forEach((ring) => {
        (ring.geometry as THREE.BufferGeometry).dispose();
        (ring.material as THREE.Material).dispose();
      });
      planets.forEach((planetConfig) => {
        (planetConfig.planet.geometry as THREE.BufferGeometry).dispose();
        (planetConfig.planet.material as THREE.Material).dispose();
        (planetConfig.halo.geometry as THREE.BufferGeometry).dispose();
        (planetConfig.halo.material as THREE.Material).dispose();
      });
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: 'none' }}
    />
  );
};

export default ThreeCanvas;

