// app.js - Main entry point, no ES module syntax

// ===== SAMPLE DATA (shown when DB is empty) =====
const SAMPLE_DATA = [];

// ===== SUPABASE =====
const initSupabase = () => {
  if (!state.supabase && typeof window.supabase !== 'undefined') {
    try {
      const client = window.supabase.createClient(SB_URL, SB_KEY);
      updateState({ supabase: client });
    } catch (e) {
      console.warn('Supabase init failed:', e);
    }
  }
};

const processGroupedStores = (reviews) => {
  const storeMap = {};
  reviews.forEach(r => {
    const key = `${r.name}__${r.address || ''}`;
    if (!storeMap[key]) {
      storeMap[key] = { name: r.name, address: r.address, genre: r.genre, lat: r.lat, lng: r.lng, reviews: [] };
    }
    storeMap[key].reviews.push(r);
  });

  const grouped = Object.values(storeMap).map(store => {
    const visited = store.reviews.filter(re => re.status === 'visited');
    const isVisited = visited.length > 0;
    
    let avgOverall = 0, avgTaste = 0, avgAtmos = 0, avgCospa = 0;
    if (isVisited) {
      avgOverall = visited.reduce((acc, re) => acc + (re.ratings.overall || 0), 0) / visited.length;
      avgTaste = visited.reduce((acc, re) => acc + (re.ratings.taste || 0), 0) / visited.length;
      avgAtmos = visited.reduce((acc, re) => acc + (re.ratings.atmosphere || 0), 0) / visited.length;
      avgCospa = visited.reduce((acc, re) => acc + (re.ratings.cospa || 0), 0) / visited.length;
    }
    
    return { 
      ...store, 
      isVisited, 
      overallRating: avgOverall,
      tasteRating: avgTaste,
      atmosphereRating: avgAtmos,
      cospaRating: avgCospa
    };
  });

  updateState({ groupedStores: grouped });
  return grouped;
};

const loadData = async () => {
  if (!state.supabase) {
    processGroupedStores([...SAMPLE_DATA]);
    return;
  }
  try {
    const { data, error } = await state.supabase
      .from('restaurants').select('*').order('created_at', { ascending: false });
    if (error || !data || data.length === 0) {
      processGroupedStores([...SAMPLE_DATA]);
      return;
    }
    const mapped = data.map(db => ({
      id: db.id, userName: db.user_name, name: db.name, genre: db.genre,
      address: db.address, lat: db.lat, lng: db.lng, scenes: db.scenes || [],
      status: db.status,
      ratings: db.ratings || { taste: 0, atmosphere: 0, cospa: 0, overall: 0 },
      comment: db.comment, image: db.image, createdAt: db.created_at
    }));
    processGroupedStores(mapped);
  } catch (e) {
    console.warn('DB load failed, using sample data:', e);
    processGroupedStores([...SAMPLE_DATA]);
  }
};

const submitReview = async (payload) => {
  if (!state.supabase) throw new Error('Supabase未接続');
  const { data, error } = await state.supabase.from('restaurants').insert([payload]).select();
  if (error) throw error;
  await loadData();
  return data;
};

// ===== MODAL =====
window.closeModal = (type, event) => {
  if (event && event.target !== document.getElementById(`modal-${type}`)) return;
  document.getElementById(`modal-${type}`).classList.remove('active');
};

window.switchToAdd = (name, address, genre) => {
  document.getElementById('modal-detail').classList.remove('active');
  renderAddForm({ name, address, genre });
  document.getElementById('modal-add').classList.add('active');
};

window.toggleFormStatus = (val) => {
  const vf = document.getElementById('visited-fields');
  const lv = document.getElementById('lbl-visited');
  const lw = document.getElementById('lbl-wishlist');
  if (!vf || !lv || !lw) return;
  if (val === 'visited') {
    vf.style.display = 'block';
    lv.style.cssText += ';background:var(--primary);color:white;';
    lw.style.cssText += ';background:none;color:var(--text-muted);';
  } else {
    vf.style.display = 'none';
    lw.style.cssText += ';background:var(--primary);color:white;';
    lv.style.cssText += ';background:none;color:var(--text-muted);';
  }
};

window.updateFormSlider = (id, val) => {
  const score = document.getElementById(`score-${id}`);
  if (score) score.textContent = parseFloat(val).toFixed(1);
  if (id === 'overall') {
    renderPigRating(parseFloat(val), 'form-pig-overall', 20);
  }
};

// ===== NAVIGATION =====
const switchView = (view) => {
  if (view === 'add') {
    renderAddForm();
    document.getElementById('modal-add').classList.add('active');
    return;
  }
  if (view === 'settings') return; // placeholder

  document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

  const targetView = document.getElementById(`view-${view}`);
  const targetNav = document.querySelector(`.nav-item[data-view="${view}"]`);
  if (targetView) targetView.classList.add('active');
  if (targetNav) targetNav.classList.add('active');

  updateState({ currentTab: view });

  if (view === 'home') renderTimeline();
  if (view === 'ranking') renderRanking();
  if (view === 'map') {
    initMap();
    setTimeout(() => {
      if (state.map) state.map.invalidateSize();
      updateMapMarkers();
    }, 300);
  }
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  initSupabase();
  await loadData();

  // Navigation
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      switchView(el.dataset.view);
    });
  });

  // Form submit
  document.getElementById('add-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const userName = document.getElementById('f-user').value.trim();
    if (!userName) { alert('投稿者名を入力してください'); return; }
    localStorage.setItem('shokuboo_user', userName);

    const status = document.querySelector('input[name="status"]:checked').value;
    const payload = {
      user_name: userName,
      name: document.getElementById('f-name').value.trim(),
      genre: document.getElementById('f-genre').value,
      address: document.getElementById('f-address').value.trim(),
      lat: parseFloat(document.getElementById('f-lat').value) || null,
      lng: parseFloat(document.getElementById('f-lng').value) || null,
      status,
      ratings: status === 'wishlist'
        ? { taste: 0, atmosphere: 0, cospa: 0, overall: 0 }
        : { 
            overall: parseFloat(document.getElementById('sl-overall').value),
            taste: parseFloat(document.getElementById('sl-taste').value),
            atmosphere: parseFloat(document.getElementById('sl-atmosphere').value),
            cospa: parseFloat(document.getElementById('sl-cospa').value)
          },
      comment: document.getElementById('f-comment').value.trim(),
      image: document.getElementById('f-image-base64') ? document.getElementById('f-image-base64').value : null,
      created_at: new Date().toISOString()
    };

    const btn = e.target.querySelector('button[type="submit"]');
    const oldTxt = btn.textContent;
    btn.textContent = '投稿中...';
    btn.disabled = true;

    try {
      await submitReview(payload);
      document.getElementById('modal-add').classList.remove('active');
      switchView('home');
    } catch (err) {
      alert('エラーが発生しました: ' + err.message);
      btn.textContent = oldTxt;
      btn.disabled = false;
    }
  });

  // Hot reload for userLocation
  let lastLocStr = '';
  window.addEventListener('statechange', () => {
    if (state.userLocation && JSON.stringify(state.userLocation) !== lastLocStr) {
      lastLocStr = JSON.stringify(state.userLocation);
      if (state.currentTab === 'home') renderTimeline();
    }
  });

  // Show initial view
  renderTimeline();
});
