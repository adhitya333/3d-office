import * as THREE from 'three';

/**
 * Procedural texture generator for high-end architectural materials
 * (Warm oak wood parquet/planks, white marble, acoustic wood slats)
 */
export class OfficeTextureGenerator {
  private static woodPlankTex: THREE.CanvasTexture | null = null;
  private static marbleTex: THREE.CanvasTexture | null = null;
  private static woodSlatTex: THREE.CanvasTexture | null = null;
  private static stonePaverTex: THREE.CanvasTexture | null = null;
  private static asphaltTex: THREE.CanvasTexture | null = null;
  private static mulchTex: THREE.CanvasTexture | null = null;
  private static ashTex: THREE.CanvasTexture | null = null;
  private static cyborgGridTex: THREE.CanvasTexture | null = null;
  private static parquetTex: THREE.CanvasTexture | null = null;
  private static walnutMarbleTex: THREE.CanvasTexture | null = null;
  private static faceCache: Map<string, THREE.CanvasTexture> = new Map();

  /**
   * Generates a warm natural oak wood plank floor texture (matching the user's reference photo)
   */
  public static getWoodPlankTexture(): THREE.CanvasTexture {
    if (this.woodPlankTex) return this.woodPlankTex;

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Warm natural oak base
    ctx.fillStyle = '#C8AB87';
    ctx.fillRect(0, 0, 1024, 1024);

    // Draw horizontal wood planks (each plank ~64px tall, staggered seams)
    const plankHeight = 64;
    const plankWidths = [256, 384, 512, 320, 440];

    for (let y = 0; y < 1024; y += plankHeight) {
      // Subtle color variation per plank
      const rowIdx = y / plankHeight;
      let x = (rowIdx * 137) % 300 - 300;

      while (x < 1024) {
        const w = plankWidths[(x + y) % plankWidths.length] || 320;

        // Random plank tone variation
        const toneShift = ((Math.sin(x * 12.3 + y * 45.6) + 1) * 0.5) * 24 - 12;
        const r = Math.min(240, Math.max(160, 195 + toneShift * 1.2));
        const g = Math.min(215, Math.max(140, 168 + toneShift));
        const b = Math.min(185, Math.max(115, 138 + toneShift * 0.8));

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x + 1, y + 1, w - 2, plankHeight - 2);

        // Fine wood grain lines inside each plank
        ctx.strokeStyle = `rgba(${r - 35}, ${g - 35}, ${b - 35}, 0.28)`;
        ctx.lineWidth = 1;
        for (let gy = y + 4; gy < y + plankHeight - 4; gy += 7) {
          ctx.beginPath();
          ctx.moveTo(x, gy + Math.sin(x * 0.05) * 2);
          ctx.bezierCurveTo(
            x + w * 0.33, gy + Math.sin(x * 0.08) * 3,
            x + w * 0.66, gy + Math.cos(x * 0.07) * 3,
            x + w, gy + Math.sin(x * 0.05) * 2
          );
          ctx.stroke();
        }

        // Dark plank seam
        ctx.strokeStyle = 'rgba(70, 50, 35, 0.45)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, plankHeight);

        x += w;
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 8); // Tiling across the office floor
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 16;
    tex.needsUpdate = true;

    this.woodPlankTex = tex;
    return tex;
  }

  /**
   * Generates white marble texture for modern executive backdrop panels
   */
  public static getWhiteMarbleTexture(): THREE.CanvasTexture {
    if (this.marbleTex) return this.marbleTex;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Polished white marble base
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(0, 0, 512, 512);

    // Soft grey marble veins
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * 512, 0);
      ctx.bezierCurveTo(
        Math.random() * 512, 170,
        Math.random() * 512, 340,
        Math.random() * 512, 512
      );
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 8;
    this.marbleTex = tex;
    return tex;
  }

  /**
   * Generates vertical dark acoustic wood slat panel texture
   */
  public static getAcousticSlatTexture(): THREE.CanvasTexture {
    if (this.woodSlatTex) return this.woodSlatTex;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Dark acoustic backing
    ctx.fillStyle = '#18181B';
    ctx.fillRect(0, 0, 512, 512);

    // Warm timber vertical slats
    const slatWidth = 18;
    const slatGap = 14;
    for (let x = 0; x < 512; x += slatWidth + slatGap) {
      ctx.fillStyle = '#3E2A1D'; // Rich walnut slat
      ctx.fillRect(x, 0, slatWidth, 512);
      // Highlight on edge of slat
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fillRect(x, 0, 2, 512);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 1);
    tex.generateMipmaps = true;
    tex.anisotropy = 8;
    this.woodSlatTex = tex;
    return tex;
  }

  /**
   * Generates light-grey interlocking stone pavers for the building entrance walkway
   * (matching the paved walkway in the reference photo)
   */
  public static getStonePaversTexture(): THREE.CanvasTexture {
    if (this.stonePaverTex) return this.stonePaverTex;

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Base light stone grey
    ctx.fillStyle = '#CBD5E1';
    ctx.fillRect(0, 0, 1024, 1024);

    const paverHeight = 48;
    const paverWidth = 96;

    for (let y = 0; y < 1024; y += paverHeight) {
      const row = Math.floor(y / paverHeight);
      const offsetX = (row % 2 === 0) ? 0 : paverWidth / 2;

      for (let x = -paverWidth; x < 1024 + paverWidth; x += paverWidth) {
        const posX = x + offsetX;

        // Random tone variation per stone block
        const toneVar = ((Math.sin(posX * 23.4 + y * 77.1) + 1) * 0.5) * 28 - 14;
        const r = Math.round(185 + toneVar);
        const g = Math.round(192 + toneVar);
        const b = Math.round(200 + toneVar);

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(posX + 2, y + 2, paverWidth - 4, paverHeight - 4);

        // Subtle granite fleck noise
        ctx.fillStyle = 'rgba(100, 116, 139, 0.2)';
        for (let s = 0; s < 6; s++) {
          const fx = posX + 6 + (s * 15) % (paverWidth - 12);
          const fy = y + 6 + (s * 9) % (paverHeight - 12);
          ctx.fillRect(fx, fy, 2, 2);
        }

        // Dark mortar joint line
        ctx.strokeStyle = '#64748B';
        ctx.lineWidth = 2;
        ctx.strokeRect(posX + 1, y + 1, paverWidth - 2, paverHeight - 2);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 8);
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 16;
    this.stonePaverTex = tex;
    return tex;
  }

  /**
   * Generates dark asphalt pavement for the driveway / parking area
   */
  public static getAsphaltTexture(): THREE.CanvasTexture {
    if (this.asphaltTex) return this.asphaltTex;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Dark asphalt base
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 0, 512, 512);

    // Fine aggregate gravel texture
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const gray = Math.random() > 0.5 ? 85 : 45;
      ctx.fillStyle = `rgba(${gray}, ${gray}, ${gray}, 0.35)`;
      ctx.fillRect(x, y, 2, 2);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 6);
    tex.generateMipmaps = true;
    tex.anisotropy = 8;
    this.asphaltTex = tex;
    return tex;
  }

  /**
   * Generates landscape mulch / rich garden soil texture
   */
  public static getMulchTexture(): THREE.CanvasTexture {
    if (this.mulchTex) return this.mulchTex;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Rich dark brown mulch base
    ctx.fillStyle = '#2A1B12';
    ctx.fillRect(0, 0, 512, 512);

    // Shredded bark chips
    for (let i = 0; i < 2500; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const w = 4 + Math.random() * 10;
      const h = 2 + Math.random() * 3;
      const rot = Math.random() * Math.PI;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.fillStyle = Math.random() > 0.5 ? '#1C120C' : '#3D281B';
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.restore();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    tex.generateMipmaps = true;
    tex.anisotropy = 8;
    this.mulchTex = tex;
    return tex;
  }

  /**
   * Room 1: Scandinavian Light Ash Wood (Modern minimal Web Studio)
   */
  public static getScandinavianAshTexture(): THREE.CanvasTexture {
    if (this.ashTex) return this.ashTex;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#E2D9CC'; // Very light ash blonde
    ctx.fillRect(0, 0, 512, 512);

    const plankH = 48;
    for (let y = 0; y < 512; y += plankH) {
      ctx.fillStyle = y % 96 === 0 ? '#DDD3C4' : '#E8DFD3';
      ctx.fillRect(0, y, 512, plankH - 2);

      ctx.strokeStyle = '#B8AC99';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0, y, 512, plankH);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    tex.generateMipmaps = true;
    tex.anisotropy = 8;
    this.ashTex = tex;
    return tex;
  }

  /**
   * Room 2: Cyber-Tech Hex Matrix (Dark AI & Systems Lab)
   */
  public static getCyborgGridTexture(): THREE.CanvasTexture {
    if (this.cyborgGridTex) return this.cyborgGridTex;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Deep obsidian slate
    ctx.fillStyle = '#090D1A';
    ctx.fillRect(0, 0, 512, 512);

    // Glowing subtle grid
    const gridSize = 64;
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.28)'; // Neon Purple
    ctx.lineWidth = 2;

    for (let x = 0; x <= 512; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y <= 512; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    // Glowing node points
    ctx.fillStyle = '#8B5CF6';
    for (let x = 0; x <= 512; x += gridSize) {
      for (let y = 0; y <= 512; y += gridSize) {
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    tex.generateMipmaps = true;
    tex.anisotropy = 8;
    this.cyborgGridTex = tex;
    return tex;
  }

  /**
   * Room 3: Italian Herringbone Parquet (Growth Agency Studio)
   */
  public static getHerringboneParquetTexture(): THREE.CanvasTexture {
    if (this.parquetTex) return this.parquetTex;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#9E7449'; // Rich golden amber teak
    ctx.fillRect(0, 0, 512, 512);

    const step = 64;
    ctx.strokeStyle = 'rgba(40, 25, 15, 0.45)';
    ctx.lineWidth = 2;

    for (let x = -512; x < 1024; x += step) {
      for (let y = 0; y < 512; y += step) {
        ctx.fillStyle = ((x + y) / step) % 2 === 0 ? '#B08455' : '#8F663C';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + step, y + step);
        ctx.lineTo(x, y + step * 2);
        ctx.lineTo(x - step, y + step);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    tex.generateMipmaps = true;
    tex.anisotropy = 8;
    this.parquetTex = tex;
    return tex;
  }

  /**
   * Room 4: Dark Espresso Walnut & Calacatta Gold (Luxury CEO Boardroom)
   */
  public static getWalnutMarbleTexture(): THREE.CanvasTexture {
    if (this.walnutMarbleTex) return this.walnutMarbleTex;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Dark espresso luxury walnut
    ctx.fillStyle = '#221811';
    ctx.fillRect(0, 0, 512, 512);

    const plankH = 64;
    for (let y = 0; y < 512; y += plankH) {
      ctx.fillStyle = y % 128 === 0 ? '#2B1E15' : '#1D140E';
      ctx.fillRect(0, y + 2, 512, plankH - 4);

      // Brass / Gold inlay grain line
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.22)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, y, 512, plankH);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 3);
    tex.generateMipmaps = true;
    tex.anisotropy = 8;
    this.walnutMarbleTex = tex;
    return tex;
  }

  /**
   * Generates a stylized, expressive block character face texture
   * (Anime/Voxel eyes with pupils, white catchlights, eyebrows, mouth, and optional glasses/beard)
   */
  public static getCharacterFaceTexture(opts: {
    skinColor: string;
    hairColor: string;
    eyeColor?: string;
    hasGlasses?: boolean;
    glassesColor?: string;
    hasFacialHair?: boolean;
    facialHairColor?: string;
    expression?: 'confident' | 'friendly' | 'analytical' | 'executive';
  }): THREE.CanvasTexture {
    const cacheKey = `${opts.skinColor}_${opts.hairColor}_${opts.expression || 'friendly'}_${opts.hasGlasses}_${opts.glassesColor}_${opts.hasFacialHair}_${opts.facialHairColor}_${opts.eyeColor}`;
    if (this.faceCache.has(cacheKey)) {
      return this.faceCache.get(cacheKey)!;
    }
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // 1. Skin tone base
    ctx.fillStyle = opts.skinColor || '#F7D0B2';
    ctx.fillRect(0, 0, 256, 256);

    // 2. Gentle cheek blush
    ctx.fillStyle = 'rgba(239, 68, 68, 0.16)';
    ctx.beginPath();
    ctx.arc(58, 160, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(198, 160, 20, 0, Math.PI * 2);
    ctx.fill();

    // 3. Eyes: Sclera (Whites of eyes)
    // Left Eye
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(50, 108, 44, 40, 8);
    ctx.fill();
    // Right Eye
    ctx.beginPath();
    ctx.roundRect(162, 108, 44, 40, 8);
    ctx.fill();

    // Subtle dark upper eyelid contour
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(50, 108, 44, 6);
    ctx.fillRect(162, 108, 44, 6);

    // 4. Irises
    const irisColor = opts.eyeColor || '#1E293B';
    ctx.fillStyle = irisColor;
    ctx.beginPath();
    ctx.roundRect(62, 112, 28, 34, 6);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(166, 112, 28, 34, 6);
    ctx.fill();

    // 5. Deep Pupils
    ctx.fillStyle = '#090D16';
    ctx.beginPath();
    ctx.roundRect(68, 118, 16, 22, 4);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(172, 118, 16, 22, 4);
    ctx.fill();

    // 6. Specular White Catchlights (Make characters look alive, conscious & bright)
    ctx.fillStyle = '#FFFFFF';
    // Primary large catchlight (top-right of pupil)
    ctx.beginPath();
    ctx.roundRect(76, 114, 8, 8, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(180, 114, 8, 8, 2);
    ctx.fill();

    // Secondary micro sparkle (bottom-left)
    ctx.beginPath();
    ctx.roundRect(65, 134, 4, 4, 1);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(169, 134, 4, 4, 1);
    ctx.fill();

    // 7. Eyebrows (Matching hair color, styled per expression)
    ctx.fillStyle = opts.hairColor || '#18181B';
    const expr = opts.expression || 'friendly';

    if (expr === 'confident') {
      // Bold, energetic, confident arch
      ctx.beginPath();
      ctx.moveTo(46, 94);
      ctx.lineTo(96, 86);
      ctx.lineTo(96, 96);
      ctx.lineTo(46, 102);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(160, 86);
      ctx.lineTo(210, 94);
      ctx.lineTo(210, 102);
      ctx.lineTo(160, 96);
      ctx.closePath();
      ctx.fill();
    } else if (expr === 'analytical') {
      // Focused, calm, concentrated brow
      ctx.beginPath();
      ctx.roundRect(48, 92, 48, 8, 3);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(160, 92, 48, 8, 3);
      ctx.fill();
    } else {
      // Friendly, open, approachable curved brows
      ctx.beginPath();
      ctx.roundRect(46, 90, 50, 9, 4);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(160, 90, 50, 9, 4);
      ctx.fill();
    }

    // 8. Minimalist voxel nose shadow
    ctx.fillStyle = 'rgba(120, 53, 15, 0.22)';
    ctx.beginPath();
    ctx.roundRect(122, 152, 12, 8, 3);
    ctx.fill();

    // 9. Friendly Welcoming Smile / Mouth
    ctx.strokeStyle = '#7F1D1D';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(104, 186);
    ctx.quadraticCurveTo(128, 202, 152, 186);
    ctx.stroke();

    // Clean white smile teeth glint
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(115, 187, 26, 6, 2);
    ctx.fill();

    // 10. Optional Designer Glasses
    if (opts.hasGlasses) {
      const gColor = opts.glassesColor || '#0284C7';
      ctx.strokeStyle = gColor;
      ctx.lineWidth = 5;

      // Left Frame Rim
      ctx.beginPath();
      ctx.roundRect(44, 102, 56, 52, 8);
      ctx.stroke();

      // Right Frame Rim
      ctx.beginPath();
      ctx.roundRect(156, 102, 56, 52, 8);
      ctx.stroke();

      // Bridge
      ctx.beginPath();
      ctx.moveTo(100, 124);
      ctx.lineTo(156, 124);
      ctx.stroke();

      // Anti-reflective coating lens glint
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(54, 114);
      ctx.lineTo(76, 142);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(166, 114);
      ctx.lineTo(188, 142);
      ctx.stroke();
    }

    // 11. Optional Executive Facial Hair & Fuller Jaw for CEO
    if (opts.hasFacialHair) {
      ctx.fillStyle = opts.facialHairColor || 'rgba(30, 41, 59, 0.35)';
      // Neat jawline shadow & trimmed goatee
      ctx.beginPath();
      ctx.roundRect(112, 204, 32, 16, 4);
      ctx.fill();

      ctx.beginPath();
      ctx.roundRect(106, 176, 44, 6, 2);
      ctx.fill();

      // Subtle executive double chin crease
      ctx.strokeStyle = 'rgba(120, 53, 15, 0.28)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(128, 224, 24, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    this.faceCache.set(cacheKey, tex);
    return tex;
  }
}
