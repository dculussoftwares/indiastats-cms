import "leaflet/dist/leaflet.css";

// Add custom styles to fix DivIcon label clipping
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
    .leaflet-marker-icon.leaflet-div-icon {
      background: none !important;
      border: none !important;
      width: auto !important;
      height: auto !important;
      overflow: visible !important;
    }
    .leaflet-marker-icon.leaflet-div-icon > div {
      display: inline-block !important;
    }
  `;
    document.head.appendChild(style);
}
