const TWO_PI = Math.PI * 2;

class DotField {
  constructor(container, options = {}) {
    this.container = container;
    
    // Set up options with defaults
    this.dotRadius = options.dotRadius !== undefined ? options.dotRadius : 1.5;
    this.dotSpacing = options.dotSpacing !== undefined ? options.dotSpacing : 14;
    this.cursorRadius = options.cursorRadius !== undefined ? options.cursorRadius : 500;
    this.cursorForce = options.cursorForce !== undefined ? options.cursorForce : 0.1;
    this.bulgeOnly = options.bulgeOnly !== undefined ? options.bulgeOnly : true;
    this.bulgeStrength = options.bulgeStrength !== undefined ? options.bulgeStrength : 67;
    this.glowRadius = options.glowRadius !== undefined ? options.glowRadius : 160;
    this.sparkle = options.sparkle !== undefined ? options.sparkle : false;
    this.waveAmplitude = options.waveAmplitude !== undefined ? options.waveAmplitude : 0;
    this.gradientFrom = options.gradientFrom || 'rgba(168, 85, 247, 0.35)';
    this.gradientTo = options.gradientTo || 'rgba(180, 151, 207, 0.25)';
    this.glowColor = options.glowColor || '#120F17';
    
    // Internal states
    this.dots = [];
    this.mouse = { x: -9999, y: -9999, prevX: -9999, prevY: -9999, speed: 0 };
    this.size = { w: 0, h: 0, offsetX: 0, offsetY: 0 };
    this.glowOpacity = 0;
    this.engagement = 0;
    this.frameCount = 0;
    this.rafId = null;
    this.speedInterval = null;
    this.resizeTimer = null;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    
    this.glowId = `dot-field-glow-${Math.random().toString(36).slice(2, 9)}`;
    
    this.init();
  }

  init() {
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.inset = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.container.appendChild(this.canvas);
    
    this.ctx = this.canvas.getContext('2d', { alpha: true });
    
    // Create SVG and defs/circle for radial glow
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.style.position = 'absolute';
    this.svg.style.inset = '0';
    this.svg.style.width = '100%';
    this.svg.style.height = '100%';
    this.svg.style.pointerEvents = 'none';
    
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const radialGrad = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
    radialGrad.setAttribute('id', this.glowId);
    
    const stop0 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop0.setAttribute('offset', '0%');
    stop0.setAttribute('stop-color', this.glowColor);
    
    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '100%');
    stop1.setAttribute('stop-color', 'transparent');
    
    radialGrad.appendChild(stop0);
    radialGrad.appendChild(stop1);
    defs.appendChild(radialGrad);
    this.svg.appendChild(defs);
    
    this.glowEl = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.glowEl.setAttribute('cx', '-9999');
    this.glowEl.setAttribute('cy', '-9999');
    this.glowEl.setAttribute('r', this.glowRadius);
    this.glowEl.setAttribute('fill', `url(#${this.glowId})`);
    this.glowEl.style.opacity = '0';
    this.glowEl.style.willChange = 'opacity';
    
    this.svg.appendChild(this.glowEl);
    this.container.appendChild(this.svg);
    
    // Add container class styling helper
    this.container.classList.add('dot-field-container');
    
    // Bind event handlers
    this.handleResize = () => {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => this.doResize(), 100);
    };
    
    this.handleMouseMove = (e) => {
      this.mouse.x = e.pageX - this.size.offsetX;
      this.mouse.y = e.pageY - this.size.offsetY;
    };
    
    this.updateMouseSpeed = () => {
      const m = this.mouse;
      const dx = m.prevX - m.x;
      const dy = m.prevY - m.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      m.speed += (dist - m.speed) * 0.5;
      if (m.speed < 0.001) m.speed = 0;
      m.prevX = m.x;
      m.prevY = m.y;
    };
    
    // Perform initial resize
    this.doResize();
    
    // Setup listeners (listen globally on window so mouse interaction is captured over cards)
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('mousemove', this.handleMouseMove, { passive: true });
    
    this.speedInterval = setInterval(this.updateMouseSpeed, 20);
    
    // Start animation loop
    this.tick = () => {
      this.frameCount++;
      const dots = this.dots;
      const m = this.mouse;
      const { w, h } = this.size;
      const len = dots.length;
      const t = this.frameCount * 0.02;
      
      const targetEngagement = Math.min(m.speed / 5, 1);
      this.engagement += (targetEngagement - this.engagement) * 0.06;
      if (this.engagement < 0.001) this.engagement = 0;
      const eng = this.engagement;
      
      this.glowOpacity += (eng - this.glowOpacity) * 0.08;
      
      if (this.glowEl) {
        this.glowEl.setAttribute('cx', m.x);
        this.glowEl.setAttribute('cy', m.y);
        this.glowEl.style.opacity = this.glowOpacity;
      }
      
      this.ctx.clearRect(0, 0, w, h);
      
      let fromColor = this.gradientFrom;
      let toColor = this.gradientTo;

      if (document.body.classList.contains('incorrect-bg')) {
        fromColor = 'rgba(255, 45, 65, 0.95)';
        toColor = 'rgba(255, 120, 130, 0.85)';
      } else if (document.body.classList.contains('correct-bg')) {
        fromColor = 'rgba(0, 255, 102, 0.95)';
        toColor = 'rgba(100, 255, 170, 0.85)';
      }

      const grad = this.ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, fromColor);
      grad.addColorStop(1, toColor);
      this.ctx.fillStyle = grad;
      
      const cr = this.cursorRadius;
      const crSq = cr * cr;
      const rad = this.dotRadius / 2;
      const isBulge = this.bulgeOnly;
      
      this.ctx.beginPath();
      
      for (let i = 0; i < len; i++) {
        const d = dots[i];
        const dx = m.x - d.ax;
        const dy = m.y - d.ay;
        const distSq = dx * dx + dy * dy;
        
        if (distSq < crSq && eng > 0.01) {
          const dist = Math.sqrt(distSq);
          if (isBulge) {
            const t = 1 - dist / cr;
            const push = t * t * this.bulgeStrength * eng;
            const angle = Math.atan2(dy, dx);
            d.sx += (d.ax - Math.cos(angle) * push - d.sx) * 0.15;
            d.sy += (d.ay - Math.sin(angle) * push - d.sy) * 0.15;
          } else {
            const angle = Math.atan2(dy, dx);
            const move = (500 / dist) * (m.speed * this.cursorForce);
            d.vx += Math.cos(angle) * -move;
            d.vy += Math.sin(angle) * -move;
          }
        } else if (isBulge) {
          d.sx += (d.ax - d.sx) * 0.1;
          d.sy += (d.ay - d.sy) * 0.1;
        }
        
        if (!isBulge) {
          d.vx *= 0.9;
          d.vy *= 0.9;
          d.x = d.ax + d.vx;
          d.y = d.ay + d.vy;
          d.sx += (d.x - d.sx) * 0.1;
          d.sy += (d.y - d.sy) * 0.1;
        }
        
        let drawX = d.sx;
        let drawY = d.sy;
        if (this.waveAmplitude > 0) {
          drawY += Math.sin(d.ax * 0.03 + t) * this.waveAmplitude;
          drawX += Math.cos(d.ay * 0.03 + t * 0.7) * this.waveAmplitude * 0.5;
        }
        
        if (this.sparkle) {
          const hash = ((i * 2654435761) ^ (this.frameCount >> 3)) >>> 0;
          if ((hash % 100) < 3) {
            this.ctx.moveTo(drawX + rad * 1.8, drawY);
            this.ctx.arc(drawX, drawY, rad * 1.8, 0, TWO_PI);
          } else {
            this.ctx.moveTo(drawX + rad, drawY);
            this.ctx.arc(drawX, drawY, rad, 0, TWO_PI);
          }
        } else {
          this.ctx.moveTo(drawX + rad, drawY);
          this.ctx.arc(drawX, drawY, rad, 0, TWO_PI);
        }
      }
      
      this.ctx.fill();
      
      this.rafId = requestAnimationFrame(this.tick);
    };
    
    this.rafId = requestAnimationFrame(this.tick);
  }
  
  doResize() {
    const rect = this.container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    
    this.canvas.width = w * this.dpr;
    this.canvas.height = h * this.dpr;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    
    this.size = {
      w,
      h,
      offsetX: rect.left + window.scrollX,
      offsetY: rect.top + window.scrollY,
    };
    
    this.buildDots(w, h);
  }
  
  buildDots(w, h) {
    const step = this.dotRadius + this.dotSpacing;
    const cols = Math.floor(w / step);
    const rows = Math.floor(h / step);
    const padX = (w % step) / 2;
    const padY = (h % step) / 2;
    const dots = new Array(rows * cols);
    let idx = 0;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const ax = padX + col * step + step / 2;
        const ay = padY + row * step + step / 2;
        dots[idx++] = { ax, ay, sx: ax, sy: ay, vx: 0, vy: 0, x: ax, y: ay };
      }
    }
    this.dots = dots;
  }
  
  destroy() {
    cancelAnimationFrame(this.rafId);
    clearInterval(this.speedInterval);
    clearTimeout(this.resizeTimer);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('mousemove', this.handleMouseMove);
    
    // Clean DOM
    if (this.canvas && this.canvas.parentElement === this.container) {
      this.container.removeChild(this.canvas);
    }
    if (this.svg && this.svg.parentElement === this.container) {
      this.container.removeChild(this.svg);
    }
    this.container.classList.remove('dot-field-container');
  }
}

window.DotField = DotField;
