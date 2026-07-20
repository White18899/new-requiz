class ShapeGrid {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // Configurable options with defaults
    this.direction = options.direction || 'right';
    this.speed = options.speed !== undefined ? options.speed : 1;
    this.borderColor = options.borderColor || '#999';
    this.squareSize = options.squareSize || 40;
    this.hoverFillColor = options.hoverFillColor || '#222';
    this.shape = options.shape || 'square';
    this.hoverTrailAmount = options.hoverTrailAmount !== undefined ? options.hoverTrailAmount : 0;
    
    // Internal state variables
    this.numSquaresX = 0;
    this.numSquaresY = 0;
    this.gridOffset = { x: 0, y: 0 };
    this.hoveredSquare = null;
    this.trailCells = [];
    this.cellOpacities = new Map();
    this.requestRef = null;
    
    this.init();
  }
  
  init() {
    this.isHex = this.shape === 'hexagon';
    this.isTri = this.shape === 'triangle';
    this.hexHoriz = this.squareSize * 1.5;
    this.hexVert = this.squareSize * Math.sqrt(3);
    
    // Bind all method contexts
    this.resizeCanvas = this.resizeCanvas.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.updateAnimation = this.updateAnimation.bind(this);
    
    // Add window and event listeners
    window.addEventListener('resize', this.resizeCanvas);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseout', (e) => {
      // Trigger mouse leave when pointer exits the viewport
      if (!e.relatedTarget || e.relatedTarget.nodeName === "HTML") {
        this.handleMouseLeave();
      }
    });
    document.addEventListener('mouseleave', this.handleMouseLeave);
    
    this.resizeCanvas();
    this.requestRef = requestAnimationFrame(this.updateAnimation);
  }
  
  destroy() {
    window.removeEventListener('resize', this.resizeCanvas);
    window.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseleave', this.handleMouseLeave);
    if (this.requestRef) {
      cancelAnimationFrame(this.requestRef);
    }
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
    this.numSquaresX = Math.ceil(this.canvas.width / this.squareSize) + 1;
    this.numSquaresY = Math.ceil(this.canvas.height / this.squareSize) + 1;
  }
  
  drawHex(cx, cy, size) {
    const ctx = this.ctx;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const vx = cx + size * Math.cos(angle);
      const vy = cy + size * Math.sin(angle);
      if (i === 0) ctx.moveTo(vx, vy);
      else ctx.lineTo(vx, vy);
    }
    ctx.closePath();
  }
  
  drawCircle(cx, cy, size) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
    ctx.closePath();
  }
  
  drawTriangle(cx, cy, size, flip) {
    const ctx = this.ctx;
    ctx.beginPath();
    if (flip) {
      ctx.moveTo(cx, cy + size / 2);
      ctx.lineTo(cx + size / 2, cy - size / 2);
      ctx.lineTo(cx - size / 2, cy - size / 2);
    } else {
      ctx.moveTo(cx, cy - size / 2);
      ctx.lineTo(cx + size / 2, cy + size / 2);
      ctx.lineTo(cx - size / 2, cy + size / 2);
    }
    ctx.closePath();
  }
  
  drawGrid() {
    const canvas = this.canvas;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const squareSize = this.squareSize;
    const isHex = this.isHex;
    const isTri = this.isTri;
    const hexHoriz = this.hexHoriz;
    const hexVert = this.hexVert;
    const hoverFillColor = this.hoverFillColor;
    const borderColor = this.borderColor;
    const shape = this.shape;

    if (isHex) {
      const colShift = Math.floor(this.gridOffset.x / hexHoriz);
      const offsetX = ((this.gridOffset.x % hexHoriz) + hexHoriz) % hexHoriz;
      const offsetY = ((this.gridOffset.y % hexVert) + hexVert) % hexVert;

      const cols = Math.ceil(canvas.width / hexHoriz) + 3;
      const rows = Math.ceil(canvas.height / hexVert) + 3;

      for (let col = -2; col < cols; col++) {
        for (let row = -2; row < rows; row++) {
          const cx = col * hexHoriz + offsetX;
          const cy = row * hexVert + ((col + colShift) % 2 !== 0 ? hexVert / 2 : 0) + offsetY;

          const cellKey = `${col},${row}`;
          const alpha = this.cellOpacities.get(cellKey);
          if (alpha) {
            ctx.globalAlpha = alpha;
            this.drawHex(cx, cy, squareSize);
            ctx.fillStyle = hoverFillColor;
            ctx.fill();
            ctx.globalAlpha = 1;
          }

          this.drawHex(cx, cy, squareSize);
          ctx.strokeStyle = borderColor;
          ctx.stroke();
        }
      }
    } else if (isTri) {
      const halfW = squareSize / 2;
      const colShift = Math.floor(this.gridOffset.x / halfW);
      const rowShift = Math.floor(this.gridOffset.y / squareSize);
      const offsetX = ((this.gridOffset.x % halfW) + halfW) % halfW;
      const offsetY = ((this.gridOffset.y % squareSize) + squareSize) % squareSize;

      const cols = Math.ceil(canvas.width / halfW) + 4;
      const rows = Math.ceil(canvas.height / squareSize) + 4;

      for (let col = -2; col < cols; col++) {
        for (let row = -2; row < rows; row++) {
          const cx = col * halfW + offsetX;
          const cy = row * squareSize + squareSize / 2 + offsetY;
          const flip = ((col + colShift + row + rowShift) % 2 + 2) % 2 !== 0;

          const cellKey = `${col},${row}`;
          const alpha = this.cellOpacities.get(cellKey);
          if (alpha) {
            ctx.globalAlpha = alpha;
            this.drawTriangle(cx, cy, squareSize, flip);
            ctx.fillStyle = hoverFillColor;
            ctx.fill();
            ctx.globalAlpha = 1;
          }

          this.drawTriangle(cx, cy, squareSize, flip);
          ctx.strokeStyle = borderColor;
          ctx.stroke();
        }
      }
    } else if (shape === 'circle') {
      const offsetX = ((this.gridOffset.x % squareSize) + squareSize) % squareSize;
      const offsetY = ((this.gridOffset.y % squareSize) + squareSize) % squareSize;

      const cols = Math.ceil(canvas.width / squareSize) + 3;
      const rows = Math.ceil(canvas.height / squareSize) + 3;

      for (let col = -2; col < cols; col++) {
        for (let row = -2; row < rows; row++) {
          const cx = col * squareSize + squareSize / 2 + offsetX;
          const cy = row * squareSize + squareSize / 2 + offsetY;

          const cellKey = `${col},${row}`;
          const alpha = this.cellOpacities.get(cellKey);
          if (alpha) {
            ctx.globalAlpha = alpha;
            this.drawCircle(cx, cy, squareSize);
            ctx.fillStyle = hoverFillColor;
            ctx.fill();
            ctx.globalAlpha = 1;
          }

          this.drawCircle(cx, cy, squareSize);
          ctx.strokeStyle = borderColor;
          ctx.stroke();
        }
      }
    } else {
      const offsetX = ((this.gridOffset.x % squareSize) + squareSize) % squareSize;
      const offsetY = ((this.gridOffset.y % squareSize) + squareSize) % squareSize;

      const cols = Math.ceil(canvas.width / squareSize) + 3;
      const rows = Math.ceil(canvas.height / squareSize) + 3;

      for (let col = -2; col < cols; col++) {
        for (let row = -2; row < rows; row++) {
          const sx = col * squareSize + offsetX;
          const sy = row * squareSize + offsetY;

          const cellKey = `${col},${row}`;
          const alpha = this.cellOpacities.get(cellKey);
          if (alpha) {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = hoverFillColor;
            ctx.fillRect(sx, sy, squareSize, squareSize);
            ctx.globalAlpha = 1;
          }

          ctx.strokeStyle = borderColor;
          ctx.strokeRect(sx, sy, squareSize, squareSize);
        }
      }
    }

    // Vignette / Radial fade overlay (replaces React Bits CSS/RadialGradient)
    const gradient = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      0,
      canvas.width / 2,
      canvas.height / 2,
      Math.sqrt(canvas.width ** 2 + canvas.height ** 2) / 2
    );
    gradient.addColorStop(0, 'rgba(5, 5, 7, 0)');
    gradient.addColorStop(0.8, 'rgba(5, 5, 7, 0.3)');
    gradient.addColorStop(1, 'rgba(5, 5, 7, 0.7)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  updateAnimation() {
    const effectiveSpeed = Math.max(this.speed, 0.1);
    const wrapX = this.isHex ? this.hexHoriz * 2 : this.squareSize;
    const wrapY = this.isHex ? this.hexVert : this.isTri ? this.squareSize * 2 : this.squareSize;

    switch (this.direction) {
      case 'right':
        this.gridOffset.x = (this.gridOffset.x - effectiveSpeed + wrapX) % wrapX;
        break;
      case 'left':
        this.gridOffset.x = (this.gridOffset.x + effectiveSpeed + wrapX) % wrapX;
        break;
      case 'up':
        this.gridOffset.y = (this.gridOffset.y + effectiveSpeed + wrapY) % wrapY;
        break;
      case 'down':
        this.gridOffset.y = (this.gridOffset.y - effectiveSpeed + wrapY) % wrapY;
        break;
      case 'diagonal':
        this.gridOffset.x = (this.gridOffset.x - effectiveSpeed + wrapX) % wrapX;
        this.gridOffset.y = (this.gridOffset.y - effectiveSpeed + wrapY) % wrapY;
        break;
      default:
        break;
    }

    this.updateCellOpacities();
    this.drawGrid();
    this.requestRef = requestAnimationFrame(this.updateAnimation);
  }

  updateCellOpacities() {
    const targets = new Map();

    if (this.hoveredSquare) {
      targets.set(`${this.hoveredSquare.x},${this.hoveredSquare.y}`, 1);
    }

    if (this.hoverTrailAmount > 0) {
      for (let i = 0; i < this.trailCells.length; i++) {
        const t = this.trailCells[i];
        const key = `${t.x},${t.y}`;
        if (!targets.has(key)) {
          targets.set(key, (this.trailCells.length - i) / (this.trailCells.length + 1));
        }
      }
    }

    for (const [key] of targets) {
      if (!this.cellOpacities.has(key)) {
        this.cellOpacities.set(key, 0);
      }
    }

    for (const [key, opacity] of this.cellOpacities) {
      const target = targets.get(key) || 0;
      const next = opacity + (target - opacity) * 0.15;
      if (next < 0.005) {
        this.cellOpacities.delete(key);
      } else {
        this.cellOpacities.set(key, next);
      }
    }
  }

  handleMouseMove(event) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const squareSize = this.squareSize;
    const isHex = this.isHex;
    const isTri = this.isTri;
    const hexHoriz = this.hexHoriz;
    const hexVert = this.hexVert;
    const shape = this.shape;
    const hoverTrailAmount = this.hoverTrailAmount;

    let col, row;

    if (isHex) {
      const colShift = Math.floor(this.gridOffset.x / hexHoriz);
      const offsetX = ((this.gridOffset.x % hexHoriz) + hexHoriz) % hexHoriz;
      const offsetY = ((this.gridOffset.y % hexVert) + hexVert) % hexVert;
      const adjustedX = mouseX - offsetX;
      const adjustedY = mouseY - offsetY;

      col = Math.round(adjustedX / hexHoriz);
      const rowOffset = (col + colShift) % 2 !== 0 ? hexVert / 2 : 0;
      row = Math.round((adjustedY - rowOffset) / hexVert);
    } else if (isTri) {
      const halfW = squareSize / 2;
      const offsetX = ((this.gridOffset.x % halfW) + halfW) % halfW;
      const offsetY = ((this.gridOffset.y % squareSize) + squareSize) % squareSize;

      const adjustedX = mouseX - offsetX;
      const adjustedY = mouseY - offsetY;

      col = Math.round(adjustedX / halfW);
      row = Math.floor(adjustedY / squareSize);
    } else if (shape === 'circle') {
      const offsetX = ((this.gridOffset.x % squareSize) + squareSize) % squareSize;
      const offsetY = ((this.gridOffset.y % squareSize) + squareSize) % squareSize;

      const adjustedX = mouseX - offsetX;
      const adjustedY = mouseY - offsetY;

      col = Math.round(adjustedX / squareSize);
      row = Math.round(adjustedY / squareSize);
    } else {
      const offsetX = ((this.gridOffset.x % squareSize) + squareSize) % squareSize;
      const offsetY = ((this.gridOffset.y % squareSize) + squareSize) % squareSize;

      const adjustedX = mouseX - offsetX;
      const adjustedY = mouseY - offsetY;

      col = Math.floor(adjustedX / squareSize);
      row = Math.floor(adjustedY / squareSize);
    }

    if (
      !this.hoveredSquare ||
      this.hoveredSquare.x !== col ||
      this.hoveredSquare.y !== row
    ) {
      if (this.hoveredSquare && hoverTrailAmount > 0) {
        this.trailCells.unshift({ ...this.hoveredSquare });
        if (this.trailCells.length > hoverTrailAmount) {
          this.trailCells.length = hoverTrailAmount;
        }
      }
      this.hoveredSquare = { x: col, y: row };
    }
  }

  handleMouseLeave() {
    const hoverTrailAmount = this.hoverTrailAmount;
    if (this.hoveredSquare && hoverTrailAmount > 0) {
      this.trailCells.unshift({ ...this.hoveredSquare });
      if (this.trailCells.length > hoverTrailAmount) {
        this.trailCells.length = hoverTrailAmount;
      }
    }
    this.hoveredSquare = null;
  }
}

// Expose to window for browser compatibility
window.ShapeGrid = ShapeGrid;
