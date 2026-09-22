(() => {
  'use strict';

  const API_BASE = 'https://api.uarpeh.xyz';
  const avatarCache = new Map();
  const PLACEHOLDER = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"%3E%3Crect width="150" height="150" rx="75" fill="%23424242"/%3E%3Ccircle cx="75" cy="58" r="26" fill="%23707070"/%3E%3Cpath d="M31 132c5-29 22-43 44-43s39 14 44 43" fill="%23707070"/%3E%3C/svg%3E';

  function injectStyles() {
    if (document.getElementById('avatar-leaves-styles')) return;

    const style = document.createElement('style');
    style.id = 'avatar-leaves-styles';
    style.textContent = `
      .pv-roblox-avatar-wrap {
        display: flex;
        justify-content: center;
        margin: 0 auto 14px;
      }

      .pv-roblox-avatar {
        width: 112px;
        height: 112px;
        object-fit: cover;
        border-radius: 18px;
        background: rgba(255,255,255,.08);
        border: 1px solid rgba(255,255,255,.18);
        box-shadow: 0 8px 24px rgba(0,0,0,.22);
      }

      .falling-leaf-layer {
        position: fixed;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
        z-index: 1490;
      }

      .falling-leaf {
        position: absolute;
        top: -30px;
        width: var(--leaf-size);
        height: var(--leaf-size); /* Робимо висоту рівною ширині для квадрата */
        background: var(--leaf-color); /* Використовуємо змінну для кольору */
        transform-origin: center;
        user-select: none;
        will-change: transform, opacity;
        animation: leaf-fall var(--leaf-duration) linear forwards;
        box-shadow: 0 2px 4px rgba(0,0,0,.15);
        opacity: 0;
      }

      @keyframes leaf-fall {
        0% {
          transform: translate3d(0, -50px, 0) rotate(0deg);
          opacity: 0;
        }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% {
          transform: translate3d(var(--leaf-drift), 108vh, 0) rotate(var(--leaf-rotation));
          opacity: 0;
        }
      }

      @media (max-width: 600px) {
        .pv-roblox-avatar {
          width: 94px;
          height: 94px;
          border-radius: 16px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .falling-leaf-layer { display: none !important; }
      }
    `;
    document.head.appendChild(style);
  }

  async function fetchRobloxHeadshot(username) {
    const key = String(username || '').trim().toLowerCase();
    if (!key) return null;
    if (avatarCache.has(key)) return avatarCache.get(key);

    const request = (async () => {
      const userResponse = await fetch(`${API_BASE}/api/user?input=${encodeURIComponent(username)}`, {
        headers: { Accept: 'application/json' }
      });

      if (!userResponse.ok) return null;

      const userData = await userResponse.json();
      const user = Array.isArray(userData?.data) ? userData.data[0] : null;
      if (!user?.id) return null;

      const avatarResponse = await fetch(`${API_BASE}/api/avatar?userId=${encodeURIComponent(user.id)}`, {
        headers: { Accept: 'application/json' }
      });

      if (!avatarResponse.ok) return null;

      const avatarData = await avatarResponse.json();
      const avatar = Array.isArray(avatarData?.data) ? avatarData.data[0] : null;
      if (!avatar?.imageUrl) return null;

      return {
        imageUrl: avatar.imageUrl,
        username: user.name || username
      };
    })().catch(() => null);

    avatarCache.set(key, request);
    return request;
  }

  function removeExistingAvatar() {
    document.querySelectorAll('.pv-roblox-avatar-wrap').forEach(el => el.remove());
  }

  async function showAvatarForCurrentCheck(username) {
    const content = document.getElementById('pv-modal-content');
    if (!content || !username) return;

    removeExistingAvatar();

    const requestedUsername = username.trim();
    if (!requestedUsername) return;

    try {
      const avatar = await fetchRobloxHeadshot(requestedUsername);
      if (!avatar) return;

      const currentUsername = document.getElementById('username')?.value?.trim();
      const modal = document.getElementById('pv-modal');
      if (!currentUsername || currentUsername.toLowerCase() !== requestedUsername.toLowerCase()) return;
      if (!modal?.classList.contains('show')) return;

      removeExistingAvatar();

      const wrapper = document.createElement('div');
      wrapper.className = 'pv-roblox-avatar-wrap';

      const img = document.createElement('img');
      img.className = 'pv-roblox-avatar';
      img.src = avatar.imageUrl;
      img.alt = `Roblox avatar: ${avatar.username}`;
      img.loading = 'eager';
      img.referrerPolicy = 'no-referrer';

      wrapper.appendChild(img);
      content.prepend(wrapper);
    } catch (_) {

    }
  }

  function installAvatarHook() {
    const originalCheckLicense = window.checkLicense;
    if (typeof originalCheckLicense !== 'function' || originalCheckLicense.__avatarHooked) return;

    function wrappedCheckLicense(...args) {
      const username = document.getElementById('username')?.value?.trim() || '';
      removeExistingAvatar();

      const result = originalCheckLicense.apply(this, args);

      if (username) showAvatarForCurrentCheck(username);
      return result;
    }

    wrappedCheckLicense.__avatarHooked = true;
    window.checkLicense = wrappedCheckLicense;
  }

  async function loadRoleAvatar(img) {
    if (!(img instanceof HTMLImageElement)) return;
    if (img.dataset.apiAvatarState === 'loading' || img.dataset.apiAvatarState === 'done') return;

    const username = (img.getAttribute('alt') || '').trim();
    if (!username) return;

    img.dataset.apiAvatarState = 'loading';
    img.src = PLACEHOLDER;
    img.alt = `Аватар ${username}`;

    const avatar = await fetchRobloxHeadshot(username);
    if (!img.isConnected) return;

    if (avatar?.imageUrl) {
      img.src = avatar.imageUrl;
      img.dataset.apiAvatarState = 'done';
    } else {
      img.dataset.apiAvatarState = 'failed';
    }
  }

  function refreshRoleAvatars(root = document) {
    root.querySelectorAll?.('#rolesContainer img.avatar').forEach(loadRoleAvatar);
  }

  function installRoleAvatarHook() {
    const rolesContainer = document.getElementById('rolesContainer');
    if (!rolesContainer) return;

    refreshRoleAvatars(rolesContainer);

    const observer = new MutationObserver(() => refreshRoleAvatars(rolesContainer));
    observer.observe(rolesContainer, { childList: true, subtree: true });
  }

  function installLeaves() {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    if (document.querySelector('.falling-leaf-layer')) return;

    const layer = document.createElement('div');
    layer.className = 'falling-leaf-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);

    // Палітра кольорів для конфетті
    const colors = ['#fce18a', '#ff726d', '#b48def', '#f4306d', '#3f51b5', '#4caf50', '#ff9800', '#00bcd4'];

    const spawnLeaf = () => {
      if (document.hidden) return;
      if (layer.childElementCount >= 50) return; // Збільшена кількість, бо конфетті дрібніше

      const leaf = document.createElement('span');
      leaf.className = 'falling-leaf'; // Назва класу залишається оригінальною
      leaf.style.left = `${Math.random() * 96}%`;
      
      const size = 6 + Math.random() * 8; // Розмір від 6px до 14px
      leaf.style.setProperty('--leaf-size', `${size}px`);
      leaf.style.setProperty('--leaf-color', colors[Math.floor(Math.random() * colors.length)]);
      leaf.style.setProperty('--leaf-duration', `${4 + Math.random() * 3}s`); 
      leaf.style.setProperty('--leaf-drift', `${-100 + Math.random() * 200}px`);
      leaf.style.setProperty('--leaf-rotation', `${360 + Math.random() * 1080}deg`);
      
      layer.appendChild(leaf);

      leaf.addEventListener('animationend', () => leaf.remove(), { once: true });
    };

    const schedule = () => {
      const delay = 200 + Math.random() * 400; // Частота генерації
      window.setTimeout(() => {
        spawnLeaf();
        if (Math.random() < 0.6) window.setTimeout(spawnLeaf, 50 + Math.random() * 150);
        schedule();
      }, delay);
    };

    window.setTimeout(spawnLeaf, 500);
    schedule();
  }

  injectStyles();
  installAvatarHook();
  installRoleAvatarHook();
  installLeaves(); // Назва функції залишається оригінальною
})();
