// 3d-bg.js
// Specialized renderer for the Aptitude Test (Round 1).
// Optimized to show a single, auto-rotating low-poly featured model.

let scene, camera, renderer, clock, raycaster, mouse;
let featuredModel = null;
let mixers = [];
let targetZ = 30; // Increased from 20 to zoom out
let currentZ = 30;
let modelBasePos = new THREE.Vector3(0, 0, 0);
// Smooth transition tracking
let currentOrbitRadius = 18;
let currentOrbitHeight = 16;
let currentLookXOffset = 25;
let currentLookYOffset = 6;

function init3DBackground() {
    if (scene) return;
    let container = document.getElementById('canvas-container');
    if (!container) return;

    // 1. Scene Setup
    scene = new THREE.Scene();

    // 2. Camera Setup
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    // Positioned higher and slightly further back for the three-quarter view
    camera.position.set(20, 15, 25);
    camera.lookAt(0, 0, 0);

    // Set Scene Background (True black for maximum contrast)
    scene.background = new THREE.Color(0x000000);

    // 3. Renderer Setup
    renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputEncoding = THREE.sRGBEncoding;
    // Enable Shadows
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Reverted tonemapping to default
    container.appendChild(renderer.domElement);

    // 4. Lighting & Time
    clock = new THREE.Clock();
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2(-9999, -9999);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3); // Significantly darkened for deeper shadows
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.2);
    directionalLight.position.set(15, 25, 15);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048; // Sharper shadows
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);
}

// Model Loading function
window.load3DModel = function (modelPath) {
    if (!scene) init3DBackground();

    // Clear old state
    if (featuredModel) {
        scene.remove(featuredModel);
        featuredModel.traverse(node => {
            if (node.geometry) node.geometry.dispose();
            if (node.material) {
                if (Array.isArray(node.material)) node.material.forEach(m => m.dispose());
                else node.material.dispose();
            }
        });
    }
    featuredModel = null;
    mixers = [];

    // Register asset for preloader
    if (typeof window.registerAsset !== 'undefined') {
        window.registerAsset(modelPath);
    }

    const loader = new THREE.GLTFLoader();
    loader.load(
        modelPath,
        function (gltf) {
            featuredModel = gltf.scene;
            const animations = gltf.animations;

            // Auto-scale and Center
            const box = new THREE.Box3().setFromObject(featuredModel);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 14 / maxDim;

            featuredModel.scale.set(scale, scale, scale);
            // Center the model at the origin
            modelBasePos.set(-center.x * scale, -center.y * scale, -center.z * scale);
            featuredModel.position.copy(modelBasePos);
            console.log("Model Position Updated:", modelBasePos);

            // Resetting rotation to straight (Upright and front-facing)
            featuredModel.rotation.set(0, 0, 0);

            featuredModel.traverse((node) => {
                if (node.isMesh) {
                    if (node.material) node.material.side = THREE.DoubleSide;
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });

            scene.add(featuredModel);

            if (animations && animations.length) {
                const mixer = new THREE.AnimationMixer(featuredModel);
                animations.forEach((clip) => {
                    mixer.clipAction(clip).play();
                });
                mixers.push(mixer);
            }

            // Report load complete
            if (typeof window.markAssetLoaded !== 'undefined') {
                window.markAssetLoaded(modelPath);
            }
        },
        undefined,
        (error) => console.error('Error loading featured model:', error)
    );
};

// Public API for script.js
window.isQuestionZoomed = false;

window.showAptitudeBackground = function () {
    if (!scene) init3DBackground();
    targetZ = 25;
    currentZ = 25;
    camera.position.set(20, 15, 25);
    camera.lookAt(0, 0, 0);
    const container = document.getElementById('canvas-container');
    if (container) {
        container.style.display = 'block';
        setTimeout(() => container.style.opacity = '1', 10);
        container.classList.add('show-3d');
    }
    window.load3DModel('cabin_on_the_edge.glb');
};

window.hideAptitudeBackground = function () {
    const container = document.getElementById('canvas-container');
    if (container) {
        container.style.opacity = '0';
        container.classList.remove('show-3d');
        setTimeout(() => {
            if (!container.classList.contains('show-3d')) {
                container.style.display = 'none';
            }
        }, 500);
    }
};

// Window resize handler
function onWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize, false);

// Mouse move listener
window.addEventListener('mousemove', (event) => {
    if (!mouse) return;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

let lastRenderTime = 0;
const targetFPS = 30;
const renderInterval = 1 / targetFPS;

function animate() {
    requestAnimationFrame(animate);

    if (!scene || !camera || !renderer) return;

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    if (elapsedTime - lastRenderTime < renderInterval) return;
    lastRenderTime = elapsedTime;

    mixers.forEach(mixer => mixer.update(delta));

    // Orbital Camera Rotation
    if (featuredModel) {
        const orbitSpeed = 4.2; // Adjusted for a stable side-profile view
        
        // Target values based on state
        const targetRadius = window.isQuestionZoomed ? 15 : 18;
        const targetHeight = window.isQuestionZoomed ? 12 : 16;
        const targetLookX = window.isQuestionZoomed ? 0 : 25;
        const targetLookY = window.isQuestionZoomed ? 12 : 6;

        // Smoothly interpolate towards targets (Lerp)
        const lerpFactor = 0.05;
        currentOrbitRadius += (targetRadius - currentOrbitRadius) * lerpFactor;
        currentOrbitHeight += (targetHeight - currentOrbitHeight) * lerpFactor;
        currentLookXOffset += (targetLookX - currentLookXOffset) * lerpFactor;
        currentLookYOffset += (targetLookY - currentLookYOffset) * lerpFactor;

        // Use the stored base position for the pivot
        const pivotX = modelBasePos.x;
        const pivotY = modelBasePos.y;
        const pivotZ = modelBasePos.z;

        camera.position.x = pivotX + Math.sin(orbitSpeed) * currentOrbitRadius;
        camera.position.z = pivotZ + Math.cos(orbitSpeed) * currentOrbitRadius;
        camera.position.y = pivotY + currentOrbitHeight;

        // Use smoothed offsets for a fluid lookAt transition
        camera.lookAt(pivotX + currentLookXOffset, pivotY + currentLookYOffset, pivotZ - 1);

        // Stable floating effect using the base position
        featuredModel.position.x = pivotX;
        featuredModel.position.z = pivotZ;
        featuredModel.position.y = pivotY + Math.sin(elapsedTime * 1.5) * 0.25;
    }

    renderer.render(scene, camera);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    init3DBackground();
    animate();
});
