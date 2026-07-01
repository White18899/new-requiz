// home-bg.js
// Dedicated background renderer for the Round Selection screen (Home).
// Loads the mobile_home.glb model as a high-quality backdrop.

(function () {
    const homeContainer = document.getElementById('home-canvas-container');
    if (!homeContainer) return;

    // Register asset for preloader
    if (typeof window.registerAsset !== 'undefined') {
        window.registerAsset('mobile_home');
    }

    let homeScene, homeCamera, homeRenderer, homeClock, homeModel, homeMixer, homeActive = false;
    let animFrameId = null;
    let targetRotationY = Math.PI / 2;

    function initHomeScene() {
        homeScene = new THREE.Scene();
        homeClock = new THREE.Clock();

        // Camera
        homeCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        homeCamera.position.set(0, 2, 10);
        homeCamera.lookAt(0, 0, 0);

        // Renderer
        homeRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
        homeRenderer.setSize(window.innerWidth, window.innerHeight);
        homeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        homeRenderer.outputEncoding = THREE.sRGBEncoding;
        homeRenderer.toneMapping = THREE.ACESFilmicToneMapping;
        homeRenderer.toneMappingExposure = 1.0;
        homeContainer.appendChild(homeRenderer.domElement);

        // Lighting
        const ambient = new THREE.AmbientLight(0xffffff, 0.8);
        homeScene.add(ambient);

        const sun = new THREE.DirectionalLight(0xffffff, 1.2);
        sun.position.set(5, 10, 7.5);
        homeScene.add(sun);

        const fill = new THREE.PointLight(0x00d2d3, 0.5);
        fill.position.set(-5, 5, 5);
        homeScene.add(fill);

        // Load Model
        const loader = new THREE.GLTFLoader();
        loader.load(
            'mobile_home.glb',
            function (gltf) {
                homeModel = gltf.scene;

                // Auto-scale and center
                const box = new THREE.Box3().setFromObject(homeModel);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 8 / maxDim;
                homeModel.scale.set(scale, scale, scale);
                homeModel.position.set(
                    -center.x * scale - .5,
                    -center.y * scale,
                    -center.z * scale + 3
                );
                homeModel.rotation.y = targetRotationY; 

                homeScene.add(homeModel);

                // Play Animations
                if (gltf.animations && gltf.animations.length) {
                    homeMixer = new THREE.AnimationMixer(homeModel);
                    gltf.animations.forEach(clip => {
                        homeMixer.clipAction(clip).play();
                    });
                }

                // Report load complete
                if (typeof window.markAssetLoaded !== 'undefined') {
                    window.markAssetLoaded('mobile_home');
                }
            },
            undefined,
            (error) => console.error('Error loading mobile_home.glb:', error)
        );
    }

    function animateHome() {
        if (!homeActive) return;
        animFrameId = requestAnimationFrame(animateHome);

        const delta = homeClock.getDelta();
        const elapsed = homeClock.getElapsedTime();

        if (homeMixer) {
            homeMixer.update(delta);
        }

        if (homeModel) {
            // Smoothly rotate towards target
            homeModel.rotation.y += (targetRotationY - homeModel.rotation.y) * 0.05;

            // Floating effect: oscillate Y position and slightly oscillate rotation
            homeModel.position.y += Math.sin(elapsed * 2) * 0.002;
            homeModel.rotation.z = Math.sin(elapsed * 1.2) * 0.02;
        }

        homeRenderer.render(homeScene, homeCamera);
    }

    // Public API
    window.rotateHomeModel = function (direction) {
        // direction -1 for left, 1 for right
        // Inverted to match carousel movement direction
        targetRotationY -= direction * (Math.PI / 4); 
    };

    window.showHomeBackground = function () {
        if (!homeScene) initHomeScene();
        homeActive = true;
        homeContainer.style.display = 'block';
        homeContainer.classList.add('show-3d');
        if (animFrameId === null) animateHome();
    };

    window.hideHomeBackground = function () {
        homeActive = false;
        homeContainer.classList.remove('show-3d');
        homeContainer.style.display = 'none';
        if (animFrameId !== null) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        }
    };

    // Resize
    window.addEventListener('resize', () => {
        if (!homeRenderer) return;
        homeCamera.aspect = window.innerWidth / window.innerHeight;
        homeCamera.updateProjectionMatrix();
        homeRenderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Initialize scene immediately to start loading assets
    initHomeScene();
})();
