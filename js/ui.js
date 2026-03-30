// ui.js - All rendering logic, no ES module syntax

window.pigSVG = (filled = true, color = '#FF8A00', size = 20) => {
  const bg = filled ? color : '#E5D0C0';
  return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" style="display:block">
    <ellipse cx="32" cy="32" rx="30" ry="22" fill="${bg}" stroke="#1A0A00" stroke-width="2"/>
    <ellipse cx="22" cy="32" rx="4" ry="7" fill="#1A0A00"/>
    <ellipse cx="42" cy="32" rx="4" ry="7" fill="#1A0A00"/>
  </svg>`;
};

window.formatDistance = (lat, lng) => {
  if (!state.userLocation || !lat || !lng) return '';
  const userLat = Array.isArray(state.userLocation) ? state.userLocation[0] : state.userLocation.lat;
  const userLng = Array.isArray(state.userLocation) ? state.userLocation[1] : state.userLocation.lng;
  const d = window.calculateDistance(userLat, userLng, lat, lng);
  if (d === null) return '';
  if (d < 1) return `（現在地から ${Math.round(d * 1000)}m）`;
  return `（現在地から ${d.toFixed(1)}km）`;
};

const renderPigRating = (value, containerId, size = 18) => {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  const val = parseFloat(value) || 0;
  const full = Math.floor(val);
  const hasHalf = (val % 1) >= 0.5;
  for (let i = 0; i < full; i++) {
    container.insertAdjacentHTML('beforeend', `<div style="width:${size}px;height:${size}px">${window.pigSVG(true, '#FF8A00', size)}</div>`);
  }
  if (hasHalf) {
    container.insertAdjacentHTML('beforeend', `<div style="width:${size}px;height:${size}px;position:relative;overflow:hidden">
      <div style="position:absolute">${window.pigSVG(false, '#FF8A00', size)}</div>
      <div style="position:absolute;clip-path:inset(0 50% 0 0)">${window.pigSVG(true, '#FF8A00', size)}</div>
    </div>`);
  }
  const empty = 5 - full - (hasHalf ? 1 : 0);
  for (let i = 0; i < empty; i++) {
    container.insertAdjacentHTML('beforeend', `<div style="width:${size}px;height:${size}px">${window.pigSVG(false, '#FF8A00', size)}</div>`);
  }
};

const renderTimeline = () => {
  const container = document.getElementById('restaurant-list');
  const emptyEl = document.getElementById('empty-state');
  if (!container) return;
  container.innerHTML = '';
  const stores = state.groupedStores;
  if (stores.length === 0) {
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';

  stores.forEach((store, idx) => {
    const card = document.createElement('div');
    card.className = 'restaurant-card';
    card.onclick = () => openDetail(store);
    const reviewers = [...new Set(store.reviews.map(re => re.userName))];
    const latestReview = store.reviews[0];
    const ratingId = `cr-idx-${idx}`;
    
    card.innerHTML = `
      ${latestReview.image
        ? `<img src="${latestReview.image}" class="card-image" alt="photo">`
        : `<div class="card-image" style="display:flex;align-items:center;justify-content:center;font-size:3rem;background:#f5e6d8;">🐷</div>`}
      <div class="card-body">
        <div class="card-header">
          <div>
            <h3 class="card-name">${store.name}</h3>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">📍 ${store.address || '住所未登録'} <span style="font-weight:700;color:var(--primary);">${window.formatDistance(store.lat, store.lng)}</span></div>
          </div>
          <span class="card-genre">${store.genre || 'グルメ'}</span>
        </div>
        <div class="rating-row">
          <div id="${ratingId}" class="pig-rating"></div>
          <span style="font-weight:700;font-size:1.1rem;color:var(--primary)">${store.isVisited ? store.overallRating.toFixed(1) : '⭐'}</span>
          <span class="user-count">${reviewers.length}人の評価</span>
        </div>
        <div style="margin-top:8px;display:flex;gap:4px;flex-wrap:wrap">
          ${reviewers.map(n => `<span style="background:var(--bg);padding:2px 8px;border-radius:10px;font-size:0.65rem;color:var(--text-muted)">👤 ${n}</span>`).join('')}
        </div>
        ${store.isVisited ? `
        <div style="margin-top:8px;display:flex;gap:8px;font-size:0.75rem;color:var(--text-muted);font-weight:700;">
          <span>👅 ${store.tasteRating.toFixed(1)}</span>
          <span>✨ ${store.atmosphereRating.toFixed(1)}</span>
          <span>💰 ${store.cospaRating.toFixed(1)}</span>
        </div>` : ''}
      </div>`;
    container.appendChild(card);
    if (store.isVisited) renderPigRating(store.overallRating, ratingId, 20);
  });
};

const renderRanking = () => {
  const container = document.getElementById('ranking-list');
  if (!container) return;
  container.innerHTML = '<h2 style="padding:10px 10px 0;">🏆 評価ランキング</h2>';
  const sorted = [...state.groupedStores]
    .filter(s => s.isVisited)
    .sort((a, b) => b.overallRating - a.overallRating);
  if (sorted.length === 0) {
    container.innerHTML += '<p style="text-align:center;color:var(--text-muted);padding:20px;">評価済みのお店がまだありません</p>';
    return;
  }
  sorted.forEach((store, i) => {
    const ratingId = `rr-idx-${i}`;
    const item = document.createElement('div');
    item.className = 'restaurant-card';
    item.onclick = () => openDetail(store);
    item.innerHTML = `
      <div style="display:flex;padding:14px;gap:12px;align-items:center;">
        <div style="flex:0 0 32px;font-weight:800;font-size:1.3rem;color:${i===0?'#FFD700':i===1?'#C0C0C0':i===2?'#CD7F32':'var(--primary)'};text-align:center;">${i+1}</div>
        <div style="flex:1;">
          <div class="card-name">${store.name}</div>
          <div class="rating-row" style="margin-top:4px;">
            <div id="${ratingId}" class="pig-rating"></div>
            <span style="font-weight:700;margin-left:4px;">${store.overallRating.toFixed(1)}</span>
          </div>
        </div>
        <span class="card-genre">${store.genre}</span>
      </div>`;
    container.appendChild(item);
    renderPigRating(store.overallRating, ratingId, 14);
  });
};

const openDetail = (store) => {
  const body = document.getElementById('detail-body');
  const reviewsHtml = store.reviews.map(re => `
    <div style="background:var(--bg);border-radius:16px;padding:12px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:6px;">
        <span style="font-weight:700;">👤 ${re.userName}</span>
        <span style="color:var(--text-muted);">${new Date(re.createdAt).toLocaleDateString('ja-JP')}</span>
      </div>
      ${re.status === 'visited'
        ? `<div style="display:flex; flex-direction:column; gap:4px; margin-bottom:8px;">
             <div style="display:flex;align-items:center;gap:8px;">
               <div id="dr-all-${re.id}" class="pig-rating"></div>
               <span style="font-weight:700; color:var(--primary)">${(re.ratings.overall||0).toFixed(1)}</span>
             </div>
             <div style="display:flex; gap:10px; font-size:0.7rem; color:var(--text-muted);">
               <span>味: ${(re.ratings.taste||0).toFixed(1)}</span>
               <span>雰囲気: ${(re.ratings.atmosphere||0).toFixed(1)}</span>
               <span>コスパ: ${(re.ratings.cospa||0).toFixed(1)}</span>
             </div>
           </div>`
        : `<div style="margin-bottom:6px; font-size:0.8rem; color:var(--primary); font-weight:700;">⭐ 行きたい！</div>`}
      <p style="margin:0;font-size:0.9rem;">${re.comment || '（コメントなし）'}</p>
      ${re.image ? `<img src="${re.image}" style="width:100%;border-radius:8px;margin-top:8px;">` : ''}
    </div>`).join('');

  const safeName = store.name.replace(/'/g, "\\'");
  const safeAddr = (store.address || '').replace(/'/g, "\\'");
  const safeGenre = (store.genre || '').replace(/'/g, "\\'");

  body.innerHTML = `
    <div style="text-align:center;margin-bottom:20px;">
      <div style="width:40px;height:4px;background:#ddd;border-radius:2px;margin:0 auto 20px;"></div>
      <h2 style="margin:0;">${store.name}</h2>
      <div style="font-size:0.85rem;color:var(--text-muted);margin-top:4px;">📍 ${store.address || '住所未登録'} <span style="font-weight:700;color:var(--primary);">${window.formatDistance(store.lat, store.lng)}</span></div>
    </div>
    <div style="display:flex;gap:10px;margin-bottom:20px;">
      <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((store.name||'')+' '+(store.address||''))}"
         target="_blank" style="flex:1;background:var(--bg);padding:10px;border-radius:12px;text-decoration:none;text-align:center;color:var(--text);font-size:0.8rem;font-weight:700;">🗺 Maps</a>
      <a href="https://tabelog.com/rst/rstsearch/?sk=${encodeURIComponent(store.name||'')}"
         target="_blank" style="flex:1;background:var(--bg);padding:10px;border-radius:12px;text-decoration:none;text-align:center;color:var(--text);font-size:0.8rem;font-weight:700;">🍽 食べログ</a>
    </div>
    <div style="font-weight:700;margin-bottom:12px;">📣 みんなの投稿 (${store.reviews.length})</div>
    <div style="max-height:360px;overflow-y:auto;">${reviewsHtml}</div>
    <button onclick="window.switchToAdd('${safeName}','${safeAddr}','${safeGenre}')"
            style="width:100%;margin-top:20px;padding:16px;background:var(--primary);color:white;border:none;border-radius:16px;font-weight:700;font-size:1rem;">＋ 自分も評価を書く</button>
    <button onclick="window.closeModal('detail')"
            style="width:100%;margin-top:10px;padding:12px;background:none;border:none;color:var(--text-muted);font-size:0.8rem;">閉じる</button>`;

  document.getElementById('modal-detail').classList.add('active');
  store.reviews.forEach(re => {
    if (re.status === 'visited') renderPigRating(re.ratings.overall, `dr-all-${re.id}`, 14);
  });
};

const renderAddForm = (initialData = {}) => {
  const form = document.getElementById('add-form');
  const storedUser = localStorage.getItem('shokuboo_user') || '';
  form.innerHTML = `
    <div style="display:flex;gap:10px;margin-bottom:20px;background:var(--bg);padding:4px;border-radius:12px;">
      <label id="lbl-visited" style="flex:1;text-align:center;padding:8px;border-radius:10px;cursor:pointer;">
        <input type="radio" name="status" value="visited" checked style="display:none" onchange="window.toggleFormStatus(this.value)"> 🐷 行った
      </label>
      <label id="lbl-wishlist" style="flex:1;text-align:center;padding:8px;border-radius:10px;cursor:pointer;">
        <input type="radio" name="status" value="wishlist" style="display:none" onchange="window.toggleFormStatus(this.value)"> ⭐ 行きたい
      </label>
    </div>
    <div style="margin-bottom:14px;">
      <label style="display:block;font-size:0.75rem;font-weight:700;margin-bottom:4px;color:var(--text-muted);">👤 投稿者名</label>
      <input type="text" id="f-user" value="${storedUser}" placeholder="例: めなか" required style="width:100%;padding:12px;border:1px solid var(--border);border-radius:12px;font-size:1rem;">
    </div>
    <div style="margin-bottom:14px;">
      <label style="display:block;font-size:0.75rem;font-weight:700;margin-bottom:4px;color:var(--text-muted);">🏪 店名</label>
      <div style="display:flex; gap:8px;">
        <input type="text" id="f-name" value="${initialData.name||''}" placeholder="店名" required style="flex:1;padding:12px;border:1px solid var(--border);border-radius:12px;font-size:1rem;">
        <button type="button" onclick="window.openGoogleMaps()" style="background:#4285F4;color:white;border:none;border-radius:12px;padding:0 15px;font-weight:700;white-space:nowrap;">🗺️ Map検索</button>
      </div>
      <div style="font-size:0.65rem;color:var(--text-muted);margin-top:4px;">※「Map検索」で正しい住所を調べ、下へコピー＆ペーストしてください</div>
    </div>
    <div style="margin-bottom:14px;">
      <label style="display:block;font-size:0.75rem;font-weight:700;margin-bottom:4px;color:var(--text-muted);">📍 住所</label>
      <div style="display:flex; gap:8px;">
        <input type="text" id="f-address" value="${initialData.address||''}" placeholder="住所" style="flex:1;padding:12px;border:1px solid var(--border);border-radius:12px;font-size:1rem;">
        <button type="button" onclick="window.searchAddress()" style="background:var(--primary);color:white;border:none;border-radius:12px;padding:0 15px;font-weight:700;white-space:nowrap;">📍 座標セット</button>
      </div>
    </div>
    <div style="margin-bottom:14px;">
      <label style="display:block;font-size:0.75rem;font-weight:700;margin-bottom:4px;color:var(--text-muted);">📸 写真 (任意)</label>
      <input type="file" id="f-image" accept="image/*" style="width:100%;padding:10px;border:1px dashed var(--border);border-radius:12px;font-size:0.8rem;background:white;" onchange="window.resizeImage(event)">
      <input type="hidden" id="f-image-base64" value="">
      <img id="img-preview" style="display:none; width:100%; margin-top:10px; border-radius:12px; max-height:200px; object-fit:cover;">
    </div>
    <div style="margin-bottom:14px;">
      <label style="display:block;font-size:0.75rem;font-weight:700;margin-bottom:4px;color:var(--text-muted);">🍜 ジャンル</label>
      <select id="f-genre" style="width:100%;padding:12px;border:1px solid var(--border);border-radius:12px;background:white;font-size:1rem;">
        ${GENRES.map(g => `<option value="${g}" ${g===(initialData.genre||'')?' selected':''}>${g}</option>`).join('')}
      </select>
    </div>
    
    <div id="visited-fields">
      <div style="margin-bottom:20px; background:white; padding:15px; border-radius:16px; border:1px solid var(--border);">
        <label style="display:block;font-size:0.8rem;font-weight:800;margin-bottom:10px;color:var(--primary);">🐷 総合評価</label>
        <div style="display:flex;align-items:center;gap:12px;">
          <input type="range" id="sl-overall" min="0.5" max="5.0" step="0.5" value="3.5" style="flex:1;" oninput="window.updateFormSlider('overall', this.value)">
          <div id="form-pig-overall" style="display:flex;gap:2px;"></div>
          <span id="score-overall" style="font-weight:800;color:var(--primary);min-width:30px;">3.5</span>
        </div>
        
        <div style="margin-top:15px; border-top:1px dashed #eee; padding-top:15px; display:flex; flex-direction:column; gap:12px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <label style="width:60px; font-size:0.7rem; font-weight:700;">👅 味</label>
            <input type="range" id="sl-taste" min="0.5" max="5.0" step="0.5" value="3.0" style="flex:1;" oninput="window.updateFormSlider('taste', this.value)">
            <span id="score-taste" style="font-size:0.8rem; width:25px;">3.0</span>
          </div>
          <div style="display:flex; align-items:center; gap:10px;">
            <label style="width:60px; font-size:0.7rem; font-weight:700;">✨ 雰囲気</label>
            <input type="range" id="sl-atmosphere" min="0.5" max="5.0" step="0.5" value="3.0" style="flex:1;" oninput="window.updateFormSlider('atmosphere', this.value)">
            <span id="score-atmosphere" style="font-size:0.8rem; width:25px;">3.0</span>
          </div>
          <div style="display:flex; align-items:center; gap:10px;">
            <label style="width:60px; font-size:0.7rem; font-weight:700;">💰 コスパ</label>
            <input type="range" id="sl-cospa" min="0.5" max="5.0" step="0.5" value="3.0" style="flex:1;" oninput="window.updateFormSlider('cospa', this.value)">
            <span id="score-cospa" style="font-size:0.8rem; width:25px;">3.0</span>
          </div>
        </div>
      </div>
    </div>

    <div style="margin-bottom:20px;">
      <label style="display:block;font-size:0.75rem;font-weight:700;margin-bottom:4px;color:var(--text-muted);">💭 感想・メモ</label>
      <textarea id="f-comment" rows="3" placeholder="コメントを入力" style="width:100%;padding:12px;border:1px solid var(--border);border-radius:12px;font-family:inherit;font-size:1rem;"></textarea>
    </div>
    <input type="hidden" id="f-lat" value="${initialData.lat||''}">
    <input type="hidden" id="f-lng" value="${initialData.lng||''}">
    <button type="submit" style="width:100%;padding:16px;background:var(--primary);color:white;border:none;border-radius:16px;font-weight:700;font-size:1rem;">投稿する</button>
    <button type="button" onclick="window.closeModal('add')" style="width:100%;margin-top:10px;padding:12px;background:none;border:none;color:var(--text-muted);font-size:0.85rem;">キャンセル</button>`;

  window.toggleFormStatus('visited');
  window.updateFormSlider('overall', 3.5);
  window.updateFormSlider('taste', 3.0);
  window.updateFormSlider('atmosphere', 3.0);
  window.updateFormSlider('cospa', 3.0);
};

// Open Google Maps to let user copy the real address
window.openGoogleMaps = () => {
  const name = document.getElementById('f-name').value.trim();
  if (!name) return alert('店名を入力してください');
  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`, '_blank');
};

// Auto-geocode based on accurate address from user info or fallback to query
window.searchAddress = async () => {
  const addr = document.getElementById('f-address').value.trim();
  const name = document.getElementById('f-name').value.trim();
  const query = addr || name;
  if (!query) return alert('店名または住所を入力してください');
  const btn = event.target;
  const oldTxt = btn.textContent;
  btn.textContent = '取得中...';
  
  const geocode = async (q) => {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=jp&addressdetails=1&format=json&limit=1`);
    return await res.json();
  };

  try {
    let cleanQuery = query.replace(/〒\d{3}-\d{4}\s*/g, '').replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).trim();
    let data = await geocode(cleanQuery);
    
    // If exact query fails, try stripping block numbers
    if (!data || data.length === 0) {
      const fallbackQuery = cleanQuery.replace(/\d+[-ー]\d+[-ー]?\d*$/, '').replace(/\d+丁目.*$/, '').trim();
      if (fallbackQuery && fallbackQuery !== cleanQuery) {
        data = await geocode(fallbackQuery);
      }
    }

    if (data && data.length > 0) {
      if (!addr) {
        let addrStr = '';
        if (data[0].address) {
          const ad = data[0].address;
          addrStr = `${ad.province||''}${ad.city||ad.town||ad.village||ad.county||''}${ad.suburb||''}${ad.neighbourhood||''}${ad.quarter||''}${ad.road||''}${ad.house_number||''}`;
        }
        if (!addrStr.trim()) {
          addrStr = data[0].display_name.split(', ').reverse().join('').replace(/日本/g, '');
        }
        document.getElementById('f-address').value = addrStr;
      }
      document.getElementById('f-lat').value = data[0].lat;
      document.getElementById('f-lng').value = data[0].lon;
      alert('マップ用の「座標」を自動取得しました！');
    } else {
      alert('見つかりませんでした。Google Map等から正しい住所をコピーして、再度「座標セット」をお試しください。');
    }
  } catch(e) {
    alert('検索エラー: ' + e.message);
  } finally {
    btn.textContent = oldTxt;
  }
};

// Local image resize logic for lightweight base64 upload
window.resizeImage = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 800;
      let width = img.width;
      let height = img.height;
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      const base64 = canvas.toDataURL('image/jpeg', 0.8);
      const hiddenInput = document.getElementById('f-image-base64');
      if (hiddenInput) hiddenInput.value = base64;
      
      const preview = document.getElementById('img-preview');
      if (preview) {
        preview.src = base64;
        preview.style.display = 'block';
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

