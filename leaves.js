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
        top: -48px;
        width: var(--leaf-size);
        height: calc(var(--leaf-size) * .72);
        border-radius: 85% 0 85% 0;
        /* Змінено на помаранчевий градієнт */
        background: linear-gradient(135deg, #ffb74d 0%, #f57c00 58%, #e65100 100%);
        box-shadow: inset -2px -2px 3px rgba(100,30,0,.18);
        transform-origin: 50% 50%;
        user-select: none;
        will-change: transform, opacity;
        animation: leaf-fall var(--leaf-duration) linear forwards;
        opacity: 0;
        filter: drop-shadow(0 2px 3px rgba(0,0,0,.18));
      }

      .falling-leaf::after {
        content: '';
        position: absolute;
        left: 48%;
        top: 12%;
        width: 1px;
        height: 82%;
        background: rgba(128,40,0,.45);
        transform: rotate(-42deg);
        transform-origin: center;
      }

      @keyframes leaf-fall {
        0% {
          transform: translate3d(0, -50px, 0) rotate(0deg);
          opacity: 0;
        }
        8% { opacity: .86; }
        45% {
          transform: translate3d(var(--leaf-drift-a), 48vh, 0) rotate(210deg);
        }
        92% { opacity: .8; }
        100% {
          transform: translate3d(var(--leaf-drift-b), 108vh, 0) rotate(470deg);
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

    const spawnLeaf = () => {
      if (document.hidden) return;
      if (layer.childElementCount >= 20) return;

      const leaf = document.createElement('span');
      leaf.className = 'falling-leaf';
      leaf.style.left = `${Math.random() * 96}%`;
      leaf.style.setProperty('--leaf-size', `${14 + Math.random() * 11}px`);
      leaf.style.setProperty('--leaf-duration', `${6 + Math.random() * 4}s`); 
      leaf.style.setProperty('--leaf-drift-a', `${-45 + Math.random() * 90}px`);
      leaf.style.setProperty('--leaf-drift-b', `${-80 + Math.random() * 160}px`);
      layer.appendChild(leaf);

      leaf.addEventListener('animationend', () => leaf.remove(), { once: true });
    };

    const schedule = () => {
      const delay = 400 + Math.random() * 800; 
      window.setTimeout(() => {
        spawnLeaf();
        if (Math.random() < 0.45) window.setTimeout(spawnLeaf, 200 + Math.random() * 400);
        schedule();
      }, delay);
    };

    window.setTimeout(spawnLeaf, 500);
    schedule();
  }

  injectStyles();
  installAvatarHook();
  installRoleAvatarHook();
  installLeaves();
})();
