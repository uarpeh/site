(() => {
  'use strict';

  const API_BASE = 'https://api.uarpeh.xyz';
  const avatarCache = new Map();
  const PLACEHOLDER = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"%3E%3Crect width="150" height="150" rx="75" fill="%23424242"/%3E%3Ccircle cx="75" cy="58" r="26" fill="%23707070"/%3E%3Cpath d="M31 132c5-29 22-43 44-43s39 14 44 43" fill="%23707070"/%3E%3C/svg%3E';

  function injectStyles() {
    if (document.getElementById('avatar-confetti-styles')) return;

    const style = document.createElement('style');
    style.id = 'avatar-confetti-styles';
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

      .confetti-layer {
        position: fixed;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
        z-index: 1490;
      }

      .confetti {
        position: absolute;
        top: -30px;
        background: var(--c-color);
        transform-origin: center;
        user-select: none;
        will-change: transform;
        animation: confetti-fall var(--c-duration) linear forwards;
        box-shadow: 0 2px 4px rgba(0,0,0,.15);
      }

      @keyframes confetti-fall {
        0% {
          transform: translate3d(0, -50px, 0) rotate(0deg);
        }
        100% {
          transform: translate3d(var(--c-drift), 108vh, 0) rotate(var(--c-rotation));
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
        .confetti-layer { display: none !important; }
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

  function installConfetti() {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    if (document.querySelector('.confetti-layer')) return;

    const layer = document.createElement('div');
    layer.className = 'confetti-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);

    // Палитра ярких цветов для конфетти
    const colors = ['#fce18a', '#ff726d', '#b48def', '#f4306d', '#3f51b5', '#4caf50', '#ff9800', '#00bcd4'];

    const spawnConfetti = () => {
      if (document.hidden) return;
      if (layer.childElementCount >= 50) return; // Увеличили плотность, так как конфетти меньше листьев

      const confetti = document.createElement('span');
      confetti.className = 'confetti';
      confetti.style.left = `${Math.random() * 96}%`;
      
      // Рандомизация размера (квадратики от 6px до 14px)
      const size = 6 + Math.random() * 8;
      confetti.style.width = `${size}px`;
      confetti.style.height = `${size}px`;
      
      // Случайный цвет, скорость падения, смещение в сторону и количество оборотов
      confetti.style.setProperty('--c-color', colors[Math.floor(Math.random() * colors.length)]);
      confetti.style.setProperty('--c-duration', `${4 + Math.random() * 3}s`); 
      confetti.style.setProperty('--c-drift', `${-100 + Math.random() * 200}px`);
      confetti.style.setProperty('--c-rotation', `${360 + Math.random() * 1080}deg`);
      
      layer.appendChild(confetti);

      confetti.addEventListener('animationend', () => confetti.remove(), { once: true });
    };

    const schedule = () => {
      const delay = 200 + Math.random() * 400; // Частота генерации частиц
      window.setTimeout(() => {
        spawnConfetti();
        // Шанс выбросить еще одну частицу почти сразу для эффекта "взрыва"
        if (Math.random() < 0.6) window.setTimeout(spawnConfetti, 50 + Math.random() * 150);
        schedule();
      }, delay);
    };

    window.setTimeout(spawnConfetti, 500);
    schedule();
  }

  injectStyles();
  installAvatarHook();
  installRoleAvatarHook();
  installConfetti(); // Вызываем новую функцию вместо installLeaves
})();
