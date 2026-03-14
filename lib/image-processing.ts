"use client";

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function generateAssets(file: File) {
  const base64 = await fileToBase64(file);
  const img = await loadImage(base64);
  
  const CANVAS_SIZE = 1000;
  
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  
  // Fill the frame (crop to fill)
  const scale = Math.max(CANVAS_SIZE / img.width, CANVAS_SIZE / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  const x = (CANVAS_SIZE - w) / 2;
  const y = (CANVAS_SIZE - h) / 2;
  
  ctx.drawImage(img, x, y, w, h);
  const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.9);

  const transparentCanvas = document.createElement('canvas');
  transparentCanvas.width = CANVAS_SIZE;
  transparentCanvas.height = CANVAS_SIZE;
  const tCtx = transparentCanvas.getContext('2d')!;
  tCtx.drawImage(img, x, y, w, h);
  
  const gradients: string[][] = [];
  for (let i = 0; i < 50; i++) {
    const h1 = Math.floor((i * 137.5) % 360);
    const h2 = (h1 + 40) % 360;
    const h3 = (h2 + 40) % 360;
    const h4 = (h3 + 40) % 360;
    gradients.push([
      `hsl(${h1}, 80%, 60%)`,
      `hsl(${h2}, 85%, 65%)`,
      `hsl(${h3}, 90%, 70%)`,
      `hsl(${h4}, 85%, 65%)`
    ]);
  }
  
  const drawStickers = (cx: CanvasRenderingContext2D, seed: number, numStickers: number, stickerSize: number, totalInset: number, gradientColors: string[]) => {
    const stickerTexts = ["BEST SELLER", "BEST PRODUCT", "BEST QUALITY"];
    
    const positions = [
      { x: totalInset + 15, y: totalInset + 15 },
      { x: CANVAS_SIZE - totalInset - stickerSize - 15, y: totalInset + 15 },
      { x: totalInset + 15, y: CANVAS_SIZE - totalInset - stickerSize - 15 },
      { x: CANVAS_SIZE - totalInset - stickerSize - 15, y: CANVAS_SIZE - totalInset - stickerSize - 15 },
      { x: CANVAS_SIZE / 2 - stickerSize / 2, y: totalInset + 15 }, // top middle edge
      { x: CANVAS_SIZE / 2 - stickerSize / 2, y: CANVAS_SIZE - totalInset - stickerSize - 15 } // bottom middle edge
    ];
    
    // Shuffle positions based on seed
    for (let i = positions.length - 1; i > 0; i--) {
      const j = (seed * i * 31) % (i + 1);
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    
    const shapes = ['circular', 'shield', 'ribbon', 'star', 'hexagon'];
    
    for (let i = 0; i < numStickers; i++) {
      const pos = positions[i];
      const text = stickerTexts[(seed + i) % stickerTexts.length];
      const shape = shapes[(seed + i * 7) % shapes.length];
      const primaryColor = gradientColors[i % gradientColors.length];
      const secondaryColor = '#FFD700'; // Gold
      
      const cx_center = pos.x + stickerSize / 2;
      const cy_center = pos.y + stickerSize / 2;

      cx.save();
      cx.translate(cx_center, cy_center);

      // Shadow
      cx.shadowColor = 'rgba(0,0,0,0.25)';
      cx.shadowBlur = 8;
      cx.shadowOffsetY = 4;

      if (shape === 'circular') {
        cx.beginPath();
        cx.arc(0, 0, stickerSize/2, 0, Math.PI * 2);
        cx.fillStyle = secondaryColor;
        cx.fill();
        
        cx.shadowColor = 'transparent';
        cx.beginPath();
        cx.arc(0, 0, stickerSize/2 - 6, 0, Math.PI * 2);
        cx.fillStyle = primaryColor;
        cx.fill();
        
        cx.beginPath();
        cx.arc(0, 0, stickerSize/2 - 10, 0, Math.PI * 2);
        cx.strokeStyle = 'rgba(255,255,255,0.8)';
        cx.lineWidth = 1.5;
        cx.setLineDash([3, 3]);
        cx.stroke();
        cx.setLineDash([]);
      } else if (shape === 'shield') {
        cx.beginPath();
        cx.moveTo(0, -stickerSize/2);
        cx.lineTo(stickerSize/2, -stickerSize/2 + 15);
        cx.lineTo(stickerSize/2, 10);
        cx.lineTo(0, stickerSize/2);
        cx.lineTo(-stickerSize/2, 10);
        cx.lineTo(-stickerSize/2, -stickerSize/2 + 15);
        cx.closePath();
        cx.fillStyle = secondaryColor;
        cx.fill();
        
        cx.shadowColor = 'transparent';
        cx.beginPath();
        cx.moveTo(0, -stickerSize/2 + 6);
        cx.lineTo(stickerSize/2 - 6, -stickerSize/2 + 18);
        cx.lineTo(stickerSize/2 - 6, 8);
        cx.lineTo(0, stickerSize/2 - 6);
        cx.lineTo(-stickerSize/2 + 6, 8);
        cx.lineTo(-stickerSize/2 + 6, -stickerSize/2 + 18);
        cx.closePath();
        cx.fillStyle = primaryColor;
        cx.fill();
      } else if (shape === 'ribbon') {
        cx.fillStyle = secondaryColor;
        cx.beginPath();
        cx.moveTo(-stickerSize/2 - 10, 15);
        cx.lineTo(-stickerSize/2 + 10, 35);
        cx.lineTo(0, 15);
        cx.fill();
        
        cx.beginPath();
        cx.moveTo(stickerSize/2 + 10, 15);
        cx.lineTo(stickerSize/2 - 10, 35);
        cx.lineTo(0, 15);
        cx.fill();
        
        cx.beginPath();
        cx.roundRect(-stickerSize/2, -stickerSize/2 + 10, stickerSize, stickerSize - 30, 8);
        cx.fillStyle = primaryColor;
        cx.fill();
        
        cx.shadowColor = 'transparent';
        cx.beginPath();
        cx.roundRect(-stickerSize/2 + 4, -stickerSize/2 + 14, stickerSize - 8, stickerSize - 38, 4);
        cx.strokeStyle = 'rgba(255,255,255,0.5)';
        cx.lineWidth = 1;
        cx.stroke();
      } else if (shape === 'star') {
        const spikes = 12;
        const outerRadius = stickerSize/2;
        const innerRadius = stickerSize/2 - 10;
        
        cx.beginPath();
        for (let j = 0; j < spikes * 2; j++) {
          const radius = j % 2 === 0 ? outerRadius : innerRadius;
          const angle = (j * Math.PI) / spikes;
          if (j === 0) cx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
          else cx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        }
        cx.closePath();
        cx.fillStyle = secondaryColor;
        cx.fill();
        
        cx.shadowColor = 'transparent';
        cx.beginPath();
        cx.arc(0, 0, innerRadius - 4, 0, Math.PI * 2);
        cx.fillStyle = primaryColor;
        cx.fill();
      } else if (shape === 'hexagon') {
        cx.beginPath();
        for (let j = 0; j < 6; j++) {
          const angle = (j * Math.PI) / 3;
          const x = Math.cos(angle) * (stickerSize/2);
          const y = Math.sin(angle) * (stickerSize/2);
          if (j === 0) cx.moveTo(x, y);
          else cx.lineTo(x, y);
        }
        cx.closePath();
        cx.fillStyle = secondaryColor;
        cx.fill();
        
        cx.shadowColor = 'transparent';
        cx.beginPath();
        for (let j = 0; j < 6; j++) {
          const angle = (j * Math.PI) / 3;
          const x = Math.cos(angle) * (stickerSize/2 - 6);
          const y = Math.sin(angle) * (stickerSize/2 - 6);
          if (j === 0) cx.moveTo(x, y);
          else cx.lineTo(x, y);
        }
        cx.closePath();
        cx.fillStyle = primaryColor;
        cx.fill();
      }

      // Text
      cx.shadowColor = 'transparent';
      cx.fillStyle = '#FFFFFF';
      cx.font = 'bold 10px "Arial Black", sans-serif';
      cx.textAlign = 'center';
      cx.textBaseline = 'middle';
      
      const words = text.split(' ');
      if (words.length === 2) {
        cx.fillText(words[0], 0, -6);
        cx.fillText(words[1], 0, 6);
      } else {
        cx.fillText(text, 0, 0);
      }

      cx.restore();
    }
  };

  const drawGradientBorder = (gradientColors: string[], borderSizeMm: number, withStickers: boolean, seed: number) => {
    const c = document.createElement('canvas');
    c.width = CANVAS_SIZE;
    c.height = CANVAS_SIZE;
    const cx = c.getContext('2d')!;
    
    const borderPx = borderSizeMm * 4;
    const paddingPx = 8; // 2mm white padding
    
    // Draw gradient border
    const grad = cx.createLinearGradient(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    grad.addColorStop(0, gradientColors[0]);
    grad.addColorStop(0.33, gradientColors[1]);
    grad.addColorStop(0.66, gradientColors[2]);
    grad.addColorStop(1, gradientColors[3]);
    cx.fillStyle = grad;
    cx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // Draw white padding
    cx.fillStyle = '#ffffff';
    cx.fillRect(borderPx, borderPx, CANVAS_SIZE - borderPx * 2, CANVAS_SIZE - borderPx * 2);
    
    // Draw product image
    const totalInset = borderPx + paddingPx;
    const innerSize = CANVAS_SIZE - totalInset * 2;
    cx.drawImage(canvas, 0, 0, CANVAS_SIZE, CANVAS_SIZE, totalInset, totalInset, innerSize, innerSize);
    
    if (withStickers) {
      const numStickers = (seed % 2) + 1; // 1 or 2
      const stickerSize = 85; // ~0.5-0.8% of image area (1,000,000 * 0.007 = 7000 => sqrt(7000) ~ 83)
      drawStickers(cx, seed, numStickers, stickerSize, totalInset, gradientColors);
    }
    
    return c.toDataURL('image/jpeg', 0.9);
  };
  
  const gradientImages: string[] = [];
  const stickerImages: string[] = [];
  
  for (let i = 0; i < 25; i++) {
    let borderSizeMm = 6;
    if (i >= 10 && i < 20) borderSizeMm = 8;
    if (i >= 20) borderSizeMm = 10;
    gradientImages.push(drawGradientBorder(gradients[i], borderSizeMm, false, i * 11));
  }
  
  for (let i = 25; i < 50; i++) {
    let borderSizeMm = 6;
    if (i >= 35 && i < 45) borderSizeMm = 8;
    if (i >= 45) borderSizeMm = 10;
    stickerImages.push(drawGradientBorder(gradients[i], borderSizeMm, true, i * 13));
  }
  
  const lightColors = [
    '#ffe5b4', '#89cff0', '#98ff98', '#e6e6fa', '#f08080',
    '#b0e0e6', '#afeeee', '#fffacd', '#c8a2c8', '#ffe4e1',
    '#ffceb4', '#d8bfd8', '#e0ffff', '#fffdd0', '#f5f5dc',
    '#87cefa', '#fdfd96', '#aaf0d1', '#ffb6c1', '#b2ac88'
  ];

  const drawLightBgImage = (bgColor: string, gradientColors: string[], seed: number) => {
    const c = document.createElement('canvas');
    c.width = CANVAS_SIZE;
    c.height = CANVAS_SIZE;
    const cx = c.getContext('2d')!;
    
    const borderPx = 24; // 6mm
    const paddingPx = 8; // 2mm white padding
    
    // Draw gradient border
    const grad = cx.createLinearGradient(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    grad.addColorStop(0, gradientColors[0]);
    grad.addColorStop(0.33, gradientColors[1]);
    grad.addColorStop(0.66, gradientColors[2]);
    grad.addColorStop(1, gradientColors[3]);
    cx.fillStyle = grad;
    cx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // Draw white padding
    cx.fillStyle = '#ffffff';
    cx.fillRect(borderPx, borderPx, CANVAS_SIZE - borderPx * 2, CANVAS_SIZE - borderPx * 2);
    
    const totalInset = borderPx + paddingPx;
    const innerSize = CANVAS_SIZE - totalInset * 2;
    
    // Draw light background inside padding
    cx.fillStyle = bgColor;
    cx.fillRect(totalInset, totalInset, innerSize, innerSize);
    
    // Draw product image normally (NO multiply blend mode to preserve original colors)
    cx.drawImage(transparentCanvas, 0, 0, CANVAS_SIZE, CANVAS_SIZE, totalInset, totalInset, innerSize, innerSize);
    
    // Add 1-2 badge stickers
    const numStickers = (seed % 2) + 1; // 1 or 2
    const stickerSize = 85; // ~0.5-0.8% of image area
    
    drawStickers(cx, seed, numStickers, stickerSize, totalInset, gradientColors);
    
    return c.toDataURL('image/jpeg', 0.9);
  };
  
  const lightBgImages: string[] = [];
  for (let i = 0; i < 20; i++) {
    lightBgImages.push(drawLightBgImage(lightColors[i], gradients[i], i * 137));
  }
  
  // CTR Optimized Image
  const ctrCanvas = document.createElement('canvas');
  ctrCanvas.width = CANVAS_SIZE;
  ctrCanvas.height = CANVAS_SIZE;
  const ctrCtx = ctrCanvas.getContext('2d')!;
  
  ctrCtx.fillStyle = '#ffffff';
  ctrCtx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  
  const ctrPadding = 100; // 80% of frame (1000 - 200 = 800)
  const ctrMaxDim = CANVAS_SIZE - ctrPadding * 2;
  const ctrScale = Math.min(ctrMaxDim / img.width, ctrMaxDim / img.height);
  const ctrW = img.width * ctrScale;
  const ctrH = img.height * ctrScale;
  const ctrX = (CANVAS_SIZE - ctrW) / 2;
  const ctrY = (CANVAS_SIZE - ctrH) / 2;
  
  ctrCtx.shadowColor = 'rgba(0,0,0,0.15)';
  ctrCtx.shadowBlur = 25;
  ctrCtx.shadowOffsetY = 15;
  
  ctrCtx.filter = 'brightness(1.05) contrast(1.05)';
  ctrCtx.drawImage(img, ctrX, ctrY, ctrW, ctrH);
  
  ctrCtx.shadowColor = 'transparent';
  ctrCtx.shadowBlur = 0;
  ctrCtx.shadowOffsetY = 0;
  ctrCtx.filter = 'none';
  
  const ctrThickness = 15; // 4mm
  const ctrGrad = ctrCtx.createLinearGradient(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  const ctrColors = gradients[1]; // gold -> orange -> red
  ctrColors.forEach((color, index) => {
    ctrGrad.addColorStop(index / (ctrColors.length - 1), color);
  });
  
  ctrCtx.lineWidth = ctrThickness;
  ctrCtx.strokeStyle = ctrGrad;
  ctrCtx.strokeRect(ctrThickness/2, ctrThickness/2, CANVAS_SIZE - ctrThickness, CANVAS_SIZE - ctrThickness);
  
  const ctrWhitePadding = 8;
  ctrCtx.lineWidth = ctrWhitePadding;
  ctrCtx.strokeStyle = '#ffffff';
  ctrCtx.strokeRect(ctrThickness + ctrWhitePadding/2, ctrThickness + ctrWhitePadding/2, CANVAS_SIZE - ctrThickness*2 - ctrWhitePadding, CANVAS_SIZE - ctrThickness*2 - ctrWhitePadding);
  
  const ctrOptimizedImage = ctrCanvas.toDataURL('image/jpeg', 0.9);
  
  return {
    optimizedBase64,
    gradientImages,
    stickerImages,
    lightBgImages,
    ctrOptimizedImage
  };
}

export async function generateCustomBorder(
  base64Image: string,
  borderColor: string,
  borderSizeMm: number,
  addSticker: boolean,
  stickerIndex: number = 0
): Promise<string> {
  const CANVAS_SIZE = 1000;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = CANVAS_SIZE;
      c.height = CANVAS_SIZE;
      const cx = c.getContext('2d');
      if (!cx) return reject(new Error("Could not get 2d context"));

      // Fill white background
      cx.fillStyle = '#ffffff';
      cx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Calculate border size in pixels (1mm ≈ 3.78px)
      const borderSizePx = borderSizeMm * 3.78;
      const whitePadding = 8;
      const totalInset = borderSizePx + whitePadding;

      // Draw image
      const padding = totalInset + 20; // Additional padding for image
      const maxDim = CANVAS_SIZE - padding * 2;
      const scale = Math.min(maxDim / img.width, maxDim / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (CANVAS_SIZE - w) / 2;
      const y = (CANVAS_SIZE - h) / 2;

      cx.drawImage(img, x, y, w, h);

      // Draw border
      if (borderSizePx > 0) {
        cx.lineWidth = borderSizePx;
        cx.strokeStyle = borderColor;
        cx.strokeRect(borderSizePx / 2, borderSizePx / 2, CANVAS_SIZE - borderSizePx, CANVAS_SIZE - borderSizePx);

        cx.lineWidth = whitePadding;
        cx.strokeStyle = '#ffffff';
        cx.strokeRect(borderSizePx + whitePadding / 2, borderSizePx + whitePadding / 2, CANVAS_SIZE - borderSizePx * 2 - whitePadding, CANVAS_SIZE - borderSizePx * 2 - whitePadding);
      }

      // Draw sticker if requested
      if (addSticker) {
        const stickerTexts = ["BEST SELLER", "BEST PRODUCT", "BEST QUALITY", "TOP RATED", "NEW ARRIVAL"];
        const shapes = ['circular', 'shield', 'ribbon', 'star', 'hexagon'];
        const stickerSize = 85;
        const pos = { x: totalInset + 15, y: totalInset + 15 }; // Top left
        
        const text = stickerTexts[stickerIndex % stickerTexts.length];
        const shape = shapes[stickerIndex % shapes.length];
        const primaryColor = borderColor;
        const secondaryColor = '#FFD700'; // Gold

        const cx_center = pos.x + stickerSize / 2;
        const cy_center = pos.y + stickerSize / 2;

        cx.save();
        cx.translate(cx_center, cy_center);

        // Shadow
        cx.shadowColor = 'rgba(0,0,0,0.25)';
        cx.shadowBlur = 10;
        cx.shadowOffsetY = 5;

        // Draw shape
        cx.fillStyle = primaryColor;
        cx.beginPath();
        if (shape === 'circular') {
          cx.arc(0, 0, stickerSize/2, 0, Math.PI * 2);
        } else if (shape === 'shield') {
          cx.moveTo(0, -stickerSize/2);
          cx.lineTo(stickerSize/2, -stickerSize/2 + 15);
          cx.lineTo(stickerSize/2, 10);
          cx.lineTo(0, stickerSize/2);
          cx.lineTo(-stickerSize/2, 10);
          cx.lineTo(-stickerSize/2, -stickerSize/2 + 15);
        } else if (shape === 'ribbon') {
          cx.moveTo(-stickerSize/2 - 10, 15);
          cx.lineTo(-stickerSize/2 + 10, 35);
          cx.lineTo(-stickerSize/2 + 10, -15);
          cx.lineTo(stickerSize/2 - 10, -15);
          cx.lineTo(stickerSize/2 + 10, 15);
          cx.lineTo(stickerSize/2 - 10, 35);
          cx.lineTo(stickerSize/2 - 10, 15);
        } else if (shape === 'star') {
          const outerRadius = stickerSize/2;
          const innerRadius = stickerSize/2 - 10;
          for (let j = 0; j < 10; j++) {
            const radius = j % 2 === 0 ? outerRadius : innerRadius;
            const angle = (j * Math.PI) / 5 - Math.PI / 2;
            const px = Math.cos(angle) * radius;
            const py = Math.sin(angle) * radius;
            if (j === 0) cx.moveTo(px, py);
            else cx.lineTo(px, py);
          }
        } else { // hexagon
          for (let j = 0; j < 6; j++) {
            const angle = (j * Math.PI) / 3 - Math.PI / 2;
            const px = Math.cos(angle) * (stickerSize/2);
            const py = Math.sin(angle) * (stickerSize/2);
            if (j === 0) cx.moveTo(px, py);
            else cx.lineTo(px, py);
          }
        }
        cx.closePath();
        cx.fill();

        // Inner decoration
        cx.shadowColor = 'transparent';
        cx.strokeStyle = secondaryColor;
        cx.lineWidth = 2;
        cx.stroke();

        // Text
        cx.fillStyle = '#ffffff';
        cx.font = 'bold 12px "Arial Black", sans-serif';
        cx.textAlign = 'center';
        cx.textBaseline = 'middle';
        
        const words = text.split(' ');
        if (words.length > 1) {
          cx.fillText(words[0], 0, -6);
          cx.fillText(words[1], 0, 8);
        } else {
          cx.fillText(text, 0, 0);
        }

        cx.restore();
      }

      resolve(c.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = base64Image;
  });
}
