// map.js - Leaflet map controller, no ES module syntax

const initMap = () => {
  // If map already exists, just return
  if (state.map) return;

  // Use the ID 'map' which is inside 'map-container'
  const mapElement = document.getElementById('map');
  if (!mapElement) return;

  const map = L.map('map', {
    zoomControl: false,
    attributionControl: false
  }).setView([35.6762, 139.6503], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
  
  // Save to global state
  updateState({ map: map });

  // Try to get current position
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const loc = [pos.coords.latitude, pos.coords.longitude];
      map.setView(loc, 15);
      // Accuracy circle
      L.circleMarker(loc, { 
        radius: 8, 
        fillColor: '#2b82cb', 
        color: 'white', 
        weight: 2, 
        fillOpacity: 1 
      }).addTo(map);
      updateState({ userLocation: loc });
    }, (err) => {
      console.warn('Geolocation failed:', err);
    });
  }
};

const getMarkerColor = (store) => {
  if (!store.isVisited) return '#8E8E93'; // Gray for wishlist
  const r = store.overallRating;
  if (r >= 4.0) return '#FF3B30'; // Red for high
  if (r >= 3.0) return '#FFCC00'; // Yellow for mid
  return '#007AFF'; // Blue for low
};

const updateMapMarkers = () => {
  if (!state.map) return;

  // Clear existing markers from the map and state
  if (state.markers) {
    Object.values(state.markers).forEach(m => m.remove());
  }
  
  const newMarkers = {};

  state.groupedStores.forEach(store => {
    if (!store.lat || !store.lng) return;
    
    const color = getMarkerColor(store);
    const iconHtml = `
      <div style="position:relative; width:48px; height:48px; display:flex; flex-direction:column; align-items:center;">
        <div style="background:${color}; width:38px; height:38px; border-radius:50%; border:3px solid white; box-shadow:0 3px 10px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; z-index:2; overflow:hidden;">
          ${store.isVisited ? `<div style="display:flex;flex-direction:column;align-items:center;margin-top:2px;">${window.pigSVG ? window.pigSVG(true,'white',16) : '🐷'}<span style="color:white;font-size:9px;font-weight:900;line-height:1;margin-top:-2px;">${store.overallRating.toFixed(1)}</span></div>` : '⭐'}
        </div>
        <div style="width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:8px solid white; margin-top:-2px; z-index:1;"></div>
      </div>
    `;

    const icon = L.divIcon({
      className: 'custom-map-marker',
      html: iconHtml,
      iconSize: [48, 48],
      iconAnchor: [24, 48]
    });

    const marker = L.marker([store.lat, store.lng], { icon }).addTo(state.map);
    
    // Click behavior
    marker.on('click', () => {
      openDetail(store);
    });
    
    newMarkers[`${store.name}_${store.address}`] = marker;
  });

  updateState({ markers: newMarkers });
};
