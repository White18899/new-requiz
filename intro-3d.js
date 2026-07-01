document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('intro-3d-container');
    if (!container) return;

    // Set up scene, camera, and renderer
    const scene = new THREE.Scene();
    
    // We want the background to be transparent
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.z = 6;
    camera.position.y = 1;

    // Add realistic lighting for metallic materials
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight1.position.set(5, 5, 5);
    scene.add(dirLight1);
    
    const dirLight2 = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight2.position.set(-5, 5, 5);
    scene.add(dirLight2);

    const dirLight3 = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight3.position.set(0, -5, 2);
    scene.add(dirLight3);

    // Load the GLB model
    let model;
    let mixer; // Animation mixer
    const loader = new THREE.GLTFLoader();
    loader.load('cube_cascade.glb', (gltf) => {
        model = gltf.scene;
        // Center and scale the model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        
        // Scale to fit nicely (made smaller)
        const scale = 1.6 / maxDim;
        model.scale.set(scale, scale, scale);
        
        // Center it
        model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
        
        // Create an offset group just to make it float/spin around its center properly
        const group = new THREE.Group();
        group.add(model);
        scene.add(group);
        model = group;
        
        // Set up native animation
        if (gltf.animations && gltf.animations.length) {
            mixer = new THREE.AnimationMixer(model);
            const action = mixer.clipAction(gltf.animations[0]);
            action.play();
        }
        
        // Initial rotation
        model.rotation.y = -Math.PI / 6;
        model.rotation.x = Math.PI / 8;
        
    }, undefined, (error) => {
        console.error('Error loading cube_cascade.glb:', error);
    });

    // Animation loop
    const clock = new THREE.Clock();
    
    function animate() {
        requestAnimationFrame(animate);
        
        const delta = clock.getDelta();
        const time = clock.getElapsedTime();
        
        if (mixer) {
            mixer.update(delta);
        } else if (model) {
            // Fallback slow rotation if no native animation
            model.rotation.y += delta * 0.4;
            model.rotation.x = Math.sin(time * 0.8) * 0.15 + Math.PI / 8;
            model.position.y = Math.sin(time * 1.5) * 0.15;
        }

        renderer.render(scene, camera);
    }
    
    animate();

    // Handle resize
    window.addEventListener('resize', () => {
        if (!container.clientWidth) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
});
