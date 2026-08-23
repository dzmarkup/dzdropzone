/* DZSketch Layers System
   Manages raster and vector layers with opacity, visibility, and reordering
*/

class LayersManager {
  constructor() {
    this.layers = [];
    this.activeLayerId = null;
    this.nextId = 1;
  }

  // Create a new layer (raster or vector)
  createLayer(type = 'raster', name = null) {
    const id = this.nextId++;
    const layerNum = this.layers.length + 1;
    const displayName = name || `Layer ${layerNum}`;

    const layer = {
      id,
      name: displayName,
      displayName: `${layerNum} - ${displayName}`, // e.g., "1 - Sky"
      type, // 'raster' or 'vector'
      visible: true,
      opacity: 1.0,
      blendMode: 'normal', // 'normal', 'multiply', 'screen', 'overlay', 'color-dodge', 'darken', 'lighten'
      created: Date.now()
    };

    if (type === 'raster') {
      // Create transparent canvas for raster layer
      layer.canvas = document.createElement('canvas');
      layer.canvas.width = 1920;
      layer.canvas.height = 1080;
      layer.ctx = layer.canvas.getContext('2d', { willReadFrequently: true });
    } else if (type === 'vector') {
      // Create SVG element for vector layer
      layer.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      layer.svg.setAttribute('width', 1920);
      layer.setAttribute('height', 1080);
    }

    this.layers.push(layer);
    this.activeLayerId = id;
    return layer;
  }

  // Get layer by ID
  getLayer(id) {
    return this.layers.find(l => l.id === id);
  }

  // Get active layer
  getActiveLayer() {
    return this.getLayer(this.activeLayerId);
  }

  // Set active layer
  setActiveLayer(id) {
    if (this.getLayer(id)) {
      this.activeLayerId = id;
    }
  }

  // Toggle layer visibility
  toggleVisibility(id) {
    const layer = this.getLayer(id);
    if (layer) layer.visible = !layer.visible;
  }

  // Set layer opacity (0-1)
  setOpacity(id, opacity) {
    const layer = this.getLayer(id);
    if (layer) layer.opacity = Math.max(0, Math.min(1, opacity));
  }

  // Set layer blend mode
  setBlendMode(id, mode) {
    const layer = this.getLayer(id);
    if (layer) {
      const validModes = ['normal', 'multiply', 'screen', 'overlay', 'color-dodge', 'darken', 'lighten'];
      if (validModes.includes(mode)) {
        layer.blendMode = mode;
      }
    }
  }

  // Delete layer
  deleteLayer(id) {
    const index = this.layers.findIndex(l => l.id === id);
    if (index !== -1) {
      this.layers.splice(index, 1);
      // Renumber remaining layers
      this.renumberLayers();
      // Update active layer if needed
      if (this.activeLayerId === id) {
        this.activeLayerId = this.layers.length > 0 ? this.layers[0].id : null;
      }
    }
  }

  // Rename layer
  renameLayer(id, newName) {
    const layer = this.getLayer(id);
    if (layer) {
      layer.name = newName;
      const layerNum = this.layers.indexOf(layer) + 1;
      layer.displayName = `${layerNum} - ${newName}`;
    }
  }

  // Reorder layers (move layer at fromIndex to toIndex)
  reorderLayer(fromIndex, toIndex) {
    if (fromIndex >= 0 && fromIndex < this.layers.length &&
        toIndex >= 0 && toIndex < this.layers.length) {
      const [layer] = this.layers.splice(fromIndex, 1);
      this.layers.splice(toIndex, 0, layer);
      this.renumberLayers();
    }
  }

  // Renumber all layers for display (e.g., "1 - Sky", "2 - Trees")
  renumberLayers() {
    this.layers.forEach((layer, index) => {
      layer.displayName = `${index + 1} - ${layer.name}`;
    });
  }

  // Composite all visible layers onto a canvas
  compositeToCanvas(targetCanvas, targetCtx) {
    targetCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);

    this.layers.forEach(layer => {
      if (!layer.visible) return;

      targetCtx.globalAlpha = layer.opacity;
      targetCtx.globalCompositeOperation = layer.blendMode || 'source-over';

      if (layer.type === 'raster' && layer.canvas) {
        targetCtx.drawImage(layer.canvas, 0, 0);
      } else if (layer.type === 'vector' && layer.svg) {
        // For vectors, render the SVG to the canvas
        // This is a simplified approach; full SVG rendering can be complex
        const svgData = new XMLSerializer().serializeToString(layer.svg);
        const img = new Image();
        img.onload = () => targetCtx.drawImage(img, 0, 0);
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
      }
    });

    targetCtx.globalAlpha = 1.0;
    targetCtx.globalCompositeOperation = 'source-over';
  }

  // Get all layer data for persistence
  serialize() {
    return this.layers.map(layer => ({
      id: layer.id,
      name: layer.name,
      displayName: layer.displayName,
      type: layer.type,
      visible: layer.visible,
      opacity: layer.opacity,
      blendMode: layer.blendMode,
      created: layer.created,
      // Canvas data is stored as base64 PNG for raster layers
      canvasData: layer.canvas ? layer.canvas.toDataURL('image/png') : null,
      // SVG is stored as XML string for vector layers
      svgData: layer.svg ? new XMLSerializer().serializeToString(layer.svg) : null
    }));
  }

  // Load layer data from persistence
  deserialize(data) {
    this.layers = [];
    this.nextId = 1;

    data.forEach(layerData => {
      const layer = {
        id: layerData.id,
        name: layerData.name,
        displayName: layerData.displayName,
        type: layerData.type,
        visible: layerData.visible,
        opacity: layerData.opacity,
        blendMode: layerData.blendMode || 'normal',
        created: layerData.created
      };

      if (layerData.type === 'raster' && layerData.canvasData) {
        layer.canvas = document.createElement('canvas');
        layer.canvas.width = 1920;
        layer.canvas.height = 1080;
        layer.ctx = layer.canvas.getContext('2d');

        const img = new Image();
        img.onload = () => {
          layer.ctx.drawImage(img, 0, 0);
        };
        img.src = layerData.canvasData;
      } else if (layerData.type === 'vector' && layerData.svgData) {
        const parser = new DOMParser();
        layer.svg = parser.parseFromString(layerData.svgData, 'image/svg+xml').documentElement;
      }

      this.layers.push(layer);
      this.nextId = Math.max(this.nextId, layer.id + 1);
    });

    this.renumberLayers();
    if (this.layers.length > 0) {
      this.activeLayerId = this.layers[0].id;
    }
  }
}

// Export for use in Node.js or as a module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LayersManager;
}
