/* DZSketch Eyedropper Tool
   Samples colors from the canvas
*/

class EyedropperTool {
  constructor() {
    this.active = false;
    this.sampledColor = '#ffffff';
  }

  // Set active state
  setActive(active) {
    this.active = active;
  }

  // Get color at canvas coordinates
  sampleColor(canvas, x, y) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const imageData = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1);
    const data = imageData.data;

    // Extract RGBA values
    const r = data[0];
    const g = data[1];
    const b = data[2];
    const a = data[3];

    // Convert to hex color
    const hex = '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('').toUpperCase();

    this.sampledColor = hex;
    return {
      hex,
      rgb: { r, g, b, a },
      rgba: `rgba(${r},${g},${b},${a / 255})`
    };
  }

  // Get current sampled color
  getColor() {
    return this.sampledColor;
  }

  // Get color as RGB values
  getColorRGB(canvas, x, y) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const imageData = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1);
    const data = imageData.data;
    return {
      r: data[0],
      g: data[1],
      b: data[2],
      a: data[3]
    };
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EyedropperTool;
}
