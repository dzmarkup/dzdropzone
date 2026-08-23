/* DZSketch Magic Wand Selection Tool
   Supports area (flood fill) and color (global) selection modes
*/

class MagicWandTool {
  constructor() {
    this.tolerance = 25;
    this.mode = 'area'; // 'area' or 'color'
    this.selectedPixels = new Set(); // Store indices of selected pixels
  }

  // Set tolerance (0-250)
  setTolerance(value) {
    this.tolerance = Math.max(0, Math.min(250, parseInt(value, 10)));
  }

  // Set mode ('area' or 'color')
  setMode(mode) {
    if (['area', 'color'].includes(mode)) {
      this.mode = mode;
    }
  }

  // Get color at pixel index in image data
  getColorAt(imageData, index) {
    const i = index * 4;
    return {
      r: imageData.data[i],
      g: imageData.data[i + 1],
      b: imageData.data[i + 2],
      a: imageData.data[i + 3]
    };
  }

  // Calculate color distance (0-765 scale, where 765 = max difference)
  colorDistance(c1, c2) {
    return Math.abs(c1.r - c2.r) + Math.abs(c1.g - c2.g) + Math.abs(c1.b - c2.b);
  }

  // Convert tolerance (0-250) to color distance threshold (0-765)
  toleranceToThreshold(tolerance) {
    return (tolerance / 250) * 765;
  }

  // Flood fill (area mode) - select connected pixels
  floodFill(imageData, startIndex, width, height) {
    const threshold = this.toleranceToThreshold(this.tolerance);
    const startColor = this.getColorAt(imageData, startIndex);
    const selected = new Set();
    const queue = [startIndex];
    const visited = new Set();

    while (queue.length > 0) {
      const idx = queue.shift();
      if (visited.has(idx)) continue;
      visited.add(idx);

      const color = this.getColorAt(imageData, idx);
      const distance = this.colorDistance(color, startColor);

      if (distance <= threshold) {
        selected.add(idx);

        // Add neighbors (up, down, left, right)
        const x = idx % width;
        const y = Math.floor(idx / width);

        if (y > 0) queue.push(idx - width); // up
        if (y < height - 1) queue.push(idx + width); // down
        if (x > 0) queue.push(idx - 1); // left
        if (x < width - 1) queue.push(idx + 1); // right
      }
    }

    return selected;
  }

  // Color select (color mode) - select all matching colors
  colorSelect(imageData, startIndex) {
    const threshold = this.toleranceToThreshold(this.tolerance);
    const startColor = this.getColorAt(imageData, startIndex);
    const selected = new Set();

    for (let i = 0; i < imageData.data.length / 4; i++) {
      const color = this.getColorAt(imageData, i);
      const distance = this.colorDistance(color, startColor);

      if (distance <= threshold) {
        selected.add(i);
      }
    }

    return selected;
  }

  // Select pixels at coordinates (x, y) on canvas
  selectAt(canvas, x, y) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Convert (x, y) to pixel index
    const index = Math.floor(y) * canvas.width + Math.floor(x);

    if (index < 0 || index >= imageData.data.length / 4) {
      this.selectedPixels.clear();
      return;
    }

    // Perform selection based on mode
    if (this.mode === 'area') {
      this.selectedPixels = this.floodFill(imageData, index, canvas.width, canvas.height);
    } else if (this.mode === 'color') {
      this.selectedPixels = this.colorSelect(imageData, index);
    }
  }

  // Clear selection
  clearSelection() {
    this.selectedPixels.clear();
  }

  // Check if pixel is selected
  isSelected(index) {
    return this.selectedPixels.has(index);
  }

  // Get selected pixels as array
  getSelectedIndices() {
    return Array.from(this.selectedPixels);
  }

  // Visualize selection on canvas with marching ants / highlight
  visualizeSelection(canvas, ctx) {
    if (this.selectedPixels.size === 0) return;

    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;

    // Highlight selected pixels with semi-transparent overlay
    this.selectedPixels.forEach(idx => {
      const i = idx * 4;
      // Add a cyan highlight to selected pixels
      data[i] = Math.min(255, data[i] + 100); // more cyan
      data[i + 1] = Math.min(255, data[i + 1] + 150); // more cyan
      data[i + 2] = Math.min(255, data[i + 2] + 200); // more cyan
      data[i + 3] = 128; // semi-transparent
    });

    ctx.putImageData(imageData, 0, 0);
  }

  // Get selection statistics (for UI feedback)
  getStats() {
    return {
      pixelCount: this.selectedPixels.size,
      percentage: this.selectedPixels.size > 0 ? 'selected' : 'none'
    };
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MagicWandTool;
}
