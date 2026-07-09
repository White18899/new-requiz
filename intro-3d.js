document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('intro-bg-canvas');
    if (!container) return;

    const scene = new THREE.Scene();
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 15;

    // Particles configuration
    const particleCount = 220;
    const maxDistance = 4.0; // Distance to draw lines between particles
    const boundaryX = 16;
    const boundaryY = 9;
    const boundaryZ = 8;

    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    // Initialize random particles
    for (let i = 0; i < particleCount; i++) {
        const x = (Math.random() - 0.5) * boundaryX * 2;
        const y = (Math.random() - 0.5) * boundaryY * 2;
        const z = (Math.random() - 0.5) * boundaryZ * 2;

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        velocities.push(new THREE.Vector3(
            (Math.random() - 0.5) * 0.015,
            (Math.random() - 0.5) * 0.015,
            (Math.random() - 0.5) * 0.015
        ));
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Custom Canvas Texture for nice round particles
    const createCircleTexture = () => {
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const center = size / 2;
        ctx.beginPath();
        ctx.arc(center, center, size / 2 - 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        return new THREE.CanvasTexture(canvas);
    };

    const particleMaterial = new THREE.PointsMaterial({
        size: 0.1,
        map: createCircleTexture(),
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    // Line segments geometry & material
    const lineMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending
    });

    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = new Float32Array(particleCount * particleCount * 6); // Max possible segments buffer
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lineSegments);

    // Mouse tracking
    const mouse = new THREE.Vector2(-9999, -9999); // Start far offscreen
    const targetMouse = new THREE.Vector2(0, 0);
    const cameraRotation = new THREE.Vector2(0, 0);
    const targetCameraRotation = new THREE.Vector2(0, 0);

    window.addEventListener('mousemove', (e) => {
        targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        // Camera tilt target
        targetCameraRotation.x = targetMouse.y * 0.15;
        targetCameraRotation.y = targetMouse.x * 0.15;
    });

    window.addEventListener('mouseleave', () => {
        // Reset to center smoothly
        targetMouse.set(0, 0);
        targetCameraRotation.set(0, 0);
    });

    // Raycasting projection to 3D mouse vector
    const raycaster = new THREE.Raycaster();
    const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const mouse3D = new THREE.Vector3();

    // Animation loop
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);

        const delta = Math.min(clock.getDelta(), 0.1);
        
        // Smooth interpolation
        mouse.lerp(targetMouse, 0.05);
        cameraRotation.lerp(targetCameraRotation, 0.05);

        // Apply camera tilt (parallax)
        camera.position.x += (cameraRotation.y * 6 - camera.position.x) * 0.05;
        camera.position.y += (cameraRotation.x * 6 - camera.position.y) * 0.05;
        camera.lookAt(scene.position);

        // Project mouse coordinates to the Z=0 plane in 3D
        raycaster.setFromCamera(mouse, camera);
        raycaster.ray.intersectPlane(planeZ, mouse3D);

        const positionAttr = particleGeometry.attributes.position;
        const currentPositions = positionAttr.array;

        // Update particles
        for (let i = 0; i < particleCount; i++) {
            let px = currentPositions[i * 3];
            let py = currentPositions[i * 3 + 1];
            let pz = currentPositions[i * 3 + 2];

            // Idle movement
            px += velocities[i].x;
            py += velocities[i].y;
            pz += velocities[i].z;

            // Repulsion force from mouse
            if (mouse.x > -9000) {
                const dx = px - mouse3D.x;
                const dy = py - mouse3D.y;
                const dz = pz - mouse3D.z;
                const distSq = dx * dx + dy * dy + dz * dz;
                const dist = Math.sqrt(distSq);
                
                const forceRadius = 4.5;
                if (dist < forceRadius) {
                    const force = (1.0 - dist / forceRadius) * 0.15;
                    // Push away
                    px += (dx / dist) * force;
                    py += (dy / dist) * force;
                    pz += (dz / dist) * force;
                }
            }

            // Boundary bouncing
            if (Math.abs(px) > boundaryX) {
                velocities[i].x *= -1;
                px = Math.sign(px) * boundaryX;
            }
            if (Math.abs(py) > boundaryY) {
                velocities[i].y *= -1;
                py = Math.sign(py) * boundaryY;
            }
            if (Math.abs(pz) > boundaryZ) {
                velocities[i].z *= -1;
                pz = Math.sign(pz) * boundaryZ;
            }

            currentPositions[i * 3] = px;
            currentPositions[i * 3 + 1] = py;
            currentPositions[i * 3 + 2] = pz;
        }
        positionAttr.needsUpdate = true;

        // Update connecting lines
        let lineIndex = 0;
        const linePosAttr = lineGeometry.attributes.position;
        const linesArr = linePosAttr.array;

        for (let i = 0; i < particleCount; i++) {
            const x1 = currentPositions[i * 3];
            const y1 = currentPositions[i * 3 + 1];
            const z1 = currentPositions[i * 3 + 2];

            for (let j = i + 1; j < particleCount; j++) {
                const x2 = currentPositions[j * 3];
                const y2 = currentPositions[j * 3 + 1];
                const z2 = currentPositions[j * 3 + 2];

                const dx = x1 - x2;
                const dy = y1 - y2;
                const dz = z1 - z2;
                const distSq = dx * dx + dy * dy + dz * dz;

                if (distSq < maxDistance * maxDistance) {
                    linesArr[lineIndex++] = x1;
                    linesArr[lineIndex++] = y1;
                    linesArr[lineIndex++] = z1;
                    linesArr[lineIndex++] = x2;
                    linesArr[lineIndex++] = y2;
                    linesArr[lineIndex++] = z2;
                }
            }
        }

        // Reset the remaining line buffer positions to 0
        for (let i = lineIndex; i < linesArr.length; i++) {
            linesArr[i] = 0;
        }
        
        lineGeometry.setDrawRange(0, lineIndex / 3);
        linePosAttr.needsUpdate = true;

        renderer.render(scene, camera);
    }

    animate();

    // Handle resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});
