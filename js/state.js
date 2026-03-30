// Global state - no ES modules, accessed globally
const state = {
  restaurants: [],
  groupedStores: [],
  currentTab: 'home',
  filters: { scene: 'all', user: 'all', status: 'all' },
  userLocation: null,
  map: null,
  markers: {},
  supabase: null
};

window.calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const updateState = (newState) => {
  Object.assign(state, newState);
  window.dispatchEvent(new CustomEvent('statechange', { detail: state }));
};

// Initialize geolocation early
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition((position) => {
    updateState({ userLocation: { lat: position.coords.latitude, lng: position.coords.longitude } });
  });
}
