document.addEventListener('DOMContentLoaded', () => {
    initScrollProgress();
    initScrollReveal();
    initNewsWebGLBackground();
});

/* 1. Scroll Progress Bar */
function initScrollProgress() {
    const progressBar = document.getElementById('scroll-progress');
    if (!progressBar) return;

    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / Math.max(docHeight, 1)) * 100;
        progressBar.style.width = `${scrollPercent}%`;
    }, { passive: true });
}

/* 2. Scroll Reveal Intersection Observer */
function initScrollReveal() {
    const observerOptions = {
        root: null,
        threshold: 0.12,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));
}

/* 3. Monochrome WebGL Background Shader using OGL */
function initNewsWebGLBackground() {
    const container = document.getElementById('news-webgl-container');
    if (!container || typeof ogl === 'undefined') return;

    const { Renderer, Program, Mesh, Triangle } = ogl;

    const renderer = new Renderer({ alpha: true, dpr: Math.min(window.devicePixelRatio || 1, 2) });
    const gl = renderer.gl;
    container.appendChild(gl.canvas);

    const geometry = new Triangle(gl);

    const vertexShader = `
        attribute vec2 position;
        attribute vec2 uv;
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = vec4(position, 0.0, 1.0);
        }
    `;

    const fragmentShader = `
        precision highp float;
        varying vec2 vUv;
        uniform float uTime;
        uniform vec2 uResolution;
        uniform float uScroll;

        float hash(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
            vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
            float scrollOffset = uScroll * 0.0003;

            // Ultra-subtle ambient dark gradient flow
            float centerDist = length(uv);
            float gradient = smoothstep(0.8, 0.0, centerDist);
            
            vec3 bgColor = vec3(0.015) + vec3(0.035) * gradient;

            // Soft floating micro dust particles
            vec2 particlePos = uv * 3.0 + vec2(uTime * 0.02, scrollOffset);
            vec2 grid = fract(particlePos) - 0.5;
            float d = length(grid);
            float pAlpha = smoothstep(0.05, 0.005, d) * hash(floor(particlePos));

            bgColor += vec3(0.4) * pAlpha * 0.15;

            gl_FragColor = vec4(bgColor, 1.0);
        }
    `;

    const program = new Program(gl, {
        vertex: vertexShader,
        fragment: fragmentShader,
        uniforms: {
            uTime: { value: 0 },
            uResolution: { value: [gl.canvas.width, gl.canvas.height] },
            uScroll: { value: 0 }
        }
    });

    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
        if (!container || !renderer) return;
        renderer.setSize(container.offsetWidth, container.offsetHeight);
        program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height];
    }
    window.addEventListener('resize', resize);
    resize();

    let scrollY = 0;
    window.addEventListener('scroll', () => {
        scrollY = window.scrollY;
    }, { passive: true });

    function update(t) {
        requestAnimationFrame(update);
        program.uniforms.uTime.value = t * 0.001;
        program.uniforms.uScroll.value = scrollY;
        renderer.render({ scene: mesh });
    }
    requestAnimationFrame(update);
}
