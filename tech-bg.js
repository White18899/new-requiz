// tech-bg.js
// Dedicated background renderer for the Technical Quiz (Round 2).
// Loads the Tokyo sunset scene as a full atmospheric backdrop.

(function () {
    const techContainer = document.getElementById('tech-canvas-container');
    if (!techContainer) return;

    // Register asset for preloader
    if (typeof window.registerAsset !== 'undefined') {
        window.registerAsset('tech_terrarium');
    }

    let techScene, techCamera, techRenderer, techMixer, techClock, techActive = false;
    let animFrameId = null;
    let techModel = null;
    let boxCenter = null;
    let modelScale = 1;

    function initTechScene() {
        techScene = new THREE.Scene();
        techClock = new THREE.Clock();

        // Camera — pulled back to frame the whole diorama
        techCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 500);
        techCamera.position.set(0, 1.5, 7);
        techCamera.lookAt(0, 0.5, 0);

        // Renderer
        techRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
        techRenderer.setSize(window.innerWidth, window.innerHeight);
        techRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        techRenderer.outputEncoding = THREE.sRGBEncoding;
        techRenderer.toneMapping = THREE.ACESFilmicToneMapping;
        techRenderer.toneMappingExposure = 1.2;
        techRenderer.shadowMap.enabled = false;
        techContainer.appendChild(techRenderer.domElement);

        // Warm sunset lighting to complement the Tokyo scene
        const ambient = new THREE.AmbientLight(0xffd5a8, 1.2);
        techScene.add(ambient);

        const sun = new THREE.DirectionalLight(0xff8c42, 2.5);
        sun.position.set(8, 10, 5);
        techScene.add(sun);

        const fillLight = new THREE.DirectionalLight(0xa0c4ff, 0.8);
        fillLight.position.set(-8, 5, -5);
        techScene.add(fillLight);

        const rimLight = new THREE.PointLight(0xff6b35, 1.5, 30);
        rimLight.position.set(0, 8, -5);
        techScene.add(rimLight);

        // Load the Tokyo scene
        const loader = new THREE.GLTFLoader();
        loader.load(
            'smol_ame_in_an_upcycled_terrarium_hololiveen.glb',
            function (gltf) {
                techModel = gltf.scene;

                // Auto-scale to fill background nicely
                const box = new THREE.Box3().setFromObject(techModel);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 5.5 / maxDim;
                techModel.scale.set(scale, scale, scale);

                // Store for lerp
                boxCenter = center;
                modelScale = scale;

                // Center it
                techModel.position.set(
                    -center.x * scale - 3,
                    -center.y * scale + 0.5,
                    -center.z * scale
                );

                // Slight right-side rotation
                techModel.rotation.y = -Math.PI / -5;

                techScene.add(techModel);

                // Play embedded animations if any
                if (gltf.animations && gltf.animations.length) {
                    techMixer = new THREE.AnimationMixer(techModel);
                    gltf.animations.forEach(clip => {
                        techMixer.clipAction(clip).play();
                    });
                }

                // Report load complete
                if (typeof window.markAssetLoaded !== 'undefined') {
                    window.markAssetLoaded('tech_terrarium');
                }
            },
            undefined,
            (err) => console.error('Tokyo scene load error:', err)
        );
    }

    // Animation loop — only runs while tech background is shown
    function animateTech() {
        if (!techActive) return;
        animFrameId = requestAnimationFrame(animateTech);

        const delta = techClock.getDelta();

        if (techMixer) techMixer.update(delta);

        // Smooth Centering, Rotation & Zoom Transition
        if (techModel && boxCenter) {
            const targetX = window.isTechCentered ? -boxCenter.x * modelScale : (-boxCenter.x * modelScale - 3);
            const targetRotY = window.isTechCentered ? 0 : (Math.PI / 5);
            const targetZ = window.isTechCentered ? 5.5 : 7; // Zoom in to 5.5 when centered
            
            techModel.position.x = THREE.MathUtils.lerp(techModel.position.x, targetX, 0.05);
            techModel.rotation.y = THREE.MathUtils.lerp(techModel.rotation.y, targetRotY, 0.05);
            techCamera.position.z = THREE.MathUtils.lerp(techCamera.position.z, targetZ, 0.05);
        }

        techRenderer.render(techScene, techCamera);
    }

    // Public API — called by script.js to show/hide
    window.isTechCentered = false;

    window.showTechBackground = function () {
        if (!techScene) initTechScene();
        techActive = true;
        techContainer.style.display = 'block';
        techContainer.classList.add('show-3d');
        document.body.classList.add('tech-quiz-active');
        if (animFrameId === null) animateTech();
    };

    window.hideTechBackground = function () {
        techActive = false;
        techContainer.classList.remove('show-3d');
        techContainer.style.display = 'none';
        document.body.classList.remove('tech-quiz-active');
        if (animFrameId !== null) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        }
    };

    // Handle resize
    window.addEventListener('resize', () => {
        if (!techRenderer) return;
        techCamera.aspect = window.innerWidth / window.innerHeight;
        techCamera.updateProjectionMatrix();
        techRenderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Initialize scene immediately to start loading assets
    initTechScene();
})();
