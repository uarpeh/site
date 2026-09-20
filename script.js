(() => {
  const searchInput = document.getElementById("search-input");
  const searchResults = document.getElementById("search-results");
  function extractText(htmlString) {
    let tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlString;
    return tempDiv.textContent || tempDiv.innerText || "";
  }

  function getMenuData(selector) {
    const items = Array.from(document.querySelectorAll(selector));
    return items.map((item, index) => {
      const titleElement = item.querySelector("b > span");
      const titleText = titleElement ? titleElement.textContent.trim() : "";
      const onClickAttr = item.getAttribute("onclick") || "";
      let modalContent = "";

      try {
        const modalMatch = onClickAttr.match(/openModalFromId\(([\s\S]*?)\)$/);
        if (modalMatch) {
          const modalArgs = modalMatch[1];
          const backtickRegex = /`([\s\S]*?)`/g;
          let backtickMatch;

          while ((backtickMatch = backtickRegex.exec(modalArgs)) !== null) {
            modalContent += " " + extractText(backtickMatch[1]);
          }

          if (modalContent.trim() === "") {
            const quoteRegex = /(["'`])((?:\\\1|[\s\S])*?)\1/g;
            let quoteMatch;
            while ((quoteMatch = quoteRegex.exec(modalArgs)) !== null) {
              let matchedStr = quoteMatch[2];
              matchedStr = matchedStr.replace(/\\n|\\t|\\r/g, " ");
              modalContent += " " + extractText(matchedStr);
            }
          }
        }
      } catch (err) {
        console.warn("Помилка при розборі openModalFromId", err);
      }

      return {
        menuItem: item,
        index: index + 1,
        title: titleText,
        content: modalContent.trim()
      };
    });
  }

  const rulesMenuData = getMenuData("#rules .menu-item");
  const kksMenuData = getMenuData("#kks .menu-item");

  function highlightTextTemporarily(el, query) {
    if (!query) return;
    
    const regex = new RegExp("(" + query + ")", "gi");
    const originalHtml = el.innerHTML;
    el.innerHTML = el.innerHTML.replace(regex, '<span class="highlighted">$1</span>');
    
    setTimeout(() => {
      el.innerHTML = originalHtml;
    }, 2000);
  }

  function scrollToElement(element, offset = 0) {
    const topPos = element.getBoundingClientRect().top + window.pageYOffset + offset;
    window.scrollTo({
      top: topPos,
      behavior: "smooth"
    });
  }

  if (typeof window.openModal === "function") {
    const originalOpenModal = window.openModal;
    window.openModal = function (...args) {
      originalOpenModal(...args);
      
      setTimeout(() => {
        const modal = document.querySelector(".modal");
        if (!modal) return;
        
        const searchValue = searchInput.value.trim();
        if (!searchValue) return;

        function highlightTextNode(node, term) {
          const termRegex = new RegExp("(" + term + ")", "i");
          const treeWalker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null);
          
          while (treeWalker.nextNode()) {
            const currentNode = treeWalker.currentNode;
            if (currentNode.nodeValue && termRegex.test(currentNode.nodeValue)) {
              const span = document.createElement("span");
              span.className = "highlighted";
              const parts = currentNode.nodeValue.split(termRegex);
              const fragment = document.createDocumentFragment();
              
              for (let i = 0; i < parts.length; i++) {
                if (parts[i].toLowerCase() === term.toLowerCase()) {
                  const highlightSpan = document.createElement("span");
                  highlightSpan.className = "highlighted";
                  highlightSpan.textContent = parts[i];
                  fragment.appendChild(highlightSpan);
                } else {
                  fragment.appendChild(document.createTextNode(parts[i]));
                }
              }
              currentNode.parentNode.replaceChild(fragment, currentNode);
              return;
            }
          }
        }
        
        highlightTextNode(modal, searchValue);
        const firstHighlight = modal.querySelector(".highlighted");
        
        if (firstHighlight) {
          firstHighlight.scrollIntoView({
            behavior: "smooth",
            block: "center"
          });
          
          setTimeout(() => {
            const allHighlights = modal.querySelectorAll(".highlighted");
            allHighlights.forEach(hlNode => {
              const parent = hlNode.parentNode;
              parent.replaceChild(document.createTextNode(hlNode.textContent), hlNode);
              parent.normalize();
            });
          }, 2000);
        }
      }, 100);
    };
  }

  searchInput.addEventListener("input", () => {
    const queryLower = searchInput.value.trim().toLowerCase();
    searchResults.innerHTML = "";
    
    if (!queryLower) return;

    const filteredData = rulesMenuData.filter(({ title = "", content = "", index: idx }) => {
      return title.toLowerCase().includes(queryLower) || 
             content.toLowerCase().includes(queryLower) || 
             idx.toString().includes(queryLower);
    });

    if (filteredData.length === 0) {
      searchResults.innerHTML = "<div>Нічого не знайдено.</div>";
      return;
    }

    filteredData.forEach(({ menuItem, title, index }) => {
      const resultItem = document.createElement("div");
      resultItem.textContent = index + ". " + title;
      resultItem.title = "Перейти до пункту: " + title;
      
      resultItem.addEventListener("click", () => {
        menuItem.click();
        setTimeout(() => {
          menuItem.scrollIntoView({
            behavior: "smooth",
            block: "center"
          });
        }, 100);
      });
      
      searchResults.appendChild(resultItem);
    });
  });

  const kksSearchInput = document.getElementById("kks-search-input");
  const kksSearchResults = document.getElementById("kks-search-results");
  if (kksSearchInput && kksSearchResults) {
    kksSearchInput.addEventListener("input", () => {
      const queryLower = kksSearchInput.value.trim().toLowerCase();
      kksSearchResults.innerHTML = "";
      
      if (!queryLower) return;

      const filteredData = kksMenuData.filter(({ title = "", content = "", index: idx }) => {
        return title.toLowerCase().includes(queryLower) || 
               content.toLowerCase().includes(queryLower) || 
               idx.toString().includes(queryLower);
      });

      if (filteredData.length === 0) {
        kksSearchResults.innerHTML = "<div>Нічого не знайдено.</div>";
        return;
      }

      filteredData.forEach(({ menuItem, title, index }) => {
        const resultItem = document.createElement("div");
        resultItem.textContent = index + ". " + title;
        resultItem.title = "Перейти до пункту: " + title;
        
        resultItem.addEventListener("click", () => {
          menuItem.click();
          setTimeout(() => {
            menuItem.scrollIntoView({
              behavior: "smooth",
              block: "center"
            });
          }, 100);
        });
        
        kksSearchResults.appendChild(resultItem);
      });
    });
  }
})();

const input = document.getElementById("search-input");
const results = document.getElementById("search-results");

input.addEventListener("input", () => {
  const val = input.value.trim();
  if (val.length > 0) {
    results.style.display = "block";
  } else {
    results.style.display = "none";
  }
});

const kksInput = document.getElementById("kks-search-input");
const kksResults = document.getElementById("kks-search-results");
if (kksInput && kksResults) {
  kksInput.addEventListener("input", () => {
    const val = kksInput.value.trim();
    if (val.length > 0) {
      kksResults.style.display = "block";
    } else {
      kksResults.style.display = "none";
    }
  });
}

function openModal(ruleHtml, penaltyHtml, ruleId) {
  document.getElementById("ruleText").innerHTML = ruleHtml;
  document.getElementById("penaltyText").innerHTML = penaltyHtml || "";
  const modalEl = document.getElementById("ruleModal");
  modalEl.setAttribute("data-id", ruleId || "");
  modalEl.style.display = "block";
  
  if (!ruleId) {
    history.replaceState(null, null, window.location.pathname + window.location.search);
    const shareLink = document.getElementById("modalShareLink");
    if (shareLink) {
      shareLink.innerHTML = "";
      shareLink.remove();
    }
  }
}

function openModalFromId(id, rule, penalty) {
  const ruleModal = document.getElementById("ruleModal");
  const backdrop = document.getElementById("modalBackdrop");
  
  if (rule === undefined && penalty === undefined) {
    openModal(id, "", "");
  } else {
    history.replaceState(null, null, "#" + id);
    openModal(rule, penalty, id);
    addShareLinkButton(id);
  }
  
  ruleModal.style.display = "block";
  backdrop.style.display = "block";
  document.body.style.overflow = "hidden";
}

function closeModal() {
  history.pushState("", document.title, window.location.pathname + window.location.search);
  const ruleModal = document.getElementById("ruleModal");
  const backdrop = document.getElementById("modalBackdrop");
  
  ruleModal.style.display = "none";
  backdrop.style.display = "none";
  document.body.style.overflow = "";
  
  const shareLink = document.getElementById("modalShareLink");
  if (shareLink) {
    shareLink.innerHTML = "";
    shareLink.remove();
  }
}

document.getElementById("modalBackdrop").addEventListener("click", closeModal);


window.addEventListener("scroll", function () {
  let items = document.querySelectorAll(".menu-item");
  items.forEach(item => {
    if (isElementInView(item)) {
      item.classList.add("visible");
    }
  });
});

function isElementInView(el) {
  let rect = el.getBoundingClientRect();
  return rect.top >= 0 && rect.top <= window.innerHeight;
}

window.addEventListener("load", function () {
  let menuItemsLoaded = document.querySelectorAll(".menu-item");
  menuItemsLoaded.forEach((menuItem, idx) => {
    setTimeout(() => {
      menuItem.classList.add("visible");
    }, idx * 300);
  });
});

window.addEventListener("scroll", function () {
  let itemsScroll = document.querySelectorAll(".menu-item");
  itemsScroll.forEach(itemScroll => {
    if (isElementInView(itemScroll)) {
      itemScroll.classList.add("visible");
    }
  });
});

function addShareLinkButton(id) {
  let shareContainer = document.getElementById("modalShareLink");
  
  if (!shareContainer) {
    shareContainer = document.createElement("div");
    shareContainer.id = "modalShareLink";
    shareContainer.style.position = "absolute";
    shareContainer.style.top = "10px";
    shareContainer.style.left = "10px";
    shareContainer.style.zIndex = "9999";
    const modal = document.getElementById("ruleModal");
    modal.prepend(shareContainer);
  }
  
  shareContainer.innerHTML = "";
  const btn = document.createElement("button");
  btn.classList.add("copy-link-btn");
  
  btn.onclick = async () => {
    const url = "" + window.location.origin + window.location.pathname + "#" + id;
    try {
      await navigator.clipboard.writeText(url);
      btn.classList.add("copied");
      setTimeout(() => {
        btn.classList.remove("copied");
      }, 2000);
    } catch (err) {
      const tempInput = document.createElement("input");
      tempInput.value = url;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand("copy");
      document.body.removeChild(tempInput);
      
      btn.classList.add("copied");
      setTimeout(() => {
        btn.classList.remove("copied");
      }, 2000);
    }
  };
  
  shareContainer.appendChild(btn);
}

window.addEventListener("DOMContentLoaded", () => {
  if (performance.navigation.type === performance.navigation.TYPE_RELOAD) {
    history.replaceState(null, null, window.location.pathname);
    return;
  }
  
  const hash = window.location.hash.replace("#", "");
  if (!hash) return;
  
  const targetItem = document.querySelector('.menu-item[data-id="' + hash + '"]');
  if (targetItem) {
    targetItem.click();
    setTimeout(() => {
      targetItem.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }, 100);
  }
});

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return "views/" + year + "-" + month + "-" + day;
}

function incrementGlobalViewCounter() {
  const dbRef = firebase.database().ref(getTodayKey());
  console.log("Інкрементуємо лічильник за ключем:", getTodayKey());
  
  dbRef.transaction(currentVal => {
    console.log("Поточне значення:", currentVal);
    return (currentVal || 0) + 1;
  }, (err, committed, snapshot) => {
    if (err) {
      console.error("Transaction failed:", err);
    } else if (!committed) {
      console.log("Transaction не зафіксовано");
    } else {
      console.log("Transaction зафіксовано, нове значення:", snapshot.val());
      localStorage.setItem("lastViewTime", Date.now());
    }
  });
}

function updateGlobalViewDisplay() {
  const viewRef = firebase.database().ref(getTodayKey());
  const counterEl = document.getElementById("viewCounter");
  
  if (!counterEl) {
    console.warn("Елемент #viewCounter не знайдено");
    return;
  }
  
  viewRef.on("value", snap => {
    const val = snap.val() || 0;
    console.log("Поточне значення з Firebase:", val);
    counterEl.innerHTML = "<strong>" + val + "</strong>";
  });
}

function tryIncrementWithLimit() {
  const nowMs = Date.now();
  const lastView = localStorage.getItem("lastViewTime");
  const limitMs = 300000;
  
  if (!lastView || nowMs - parseInt(lastView, 10) > limitMs) {
    incrementGlobalViewCounter();
  } else {
    console.log("Перегляд вже зарахований, чекати 5 хвилин");
  }
}

window.addEventListener("DOMContentLoaded", () => {
  updateGlobalViewDisplay();
  tryIncrementWithLimit();
});


function scrollToElement(idOrClass, index = null) {
  let targetEl;
  if (index === null) {
    targetEl = document.getElementById(idOrClass);
  } else {
    const elements = document.getElementsByClassName(idOrClass);
    targetEl = elements[index];
  }
  
  if (targetEl) {
    const elTop = targetEl.getBoundingClientRect().top + window.scrollY;
    const elHeight = targetEl.offsetHeight;
    const winHeight = window.innerHeight;
    const scrollPos = elTop - winHeight / 2 + elHeight / 2;
    
    window.scrollTo({
      top: scrollPos,
      behavior: "smooth"
    });
  }
}

document.addEventListener("DOMContentLoaded", function () {
  function initDropdowns() {
    const dropdowns = document.querySelectorAll(".org-dropdown");
    
    dropdowns.forEach(dd => {
      const btn = dd.querySelector(".org-dropbtn");
      const items = dd.querySelectorAll(".org-dropdown-item");
      if (!btn) return;
      
      const section = dd.closest(".org-section");
      const allTabs = section ? section.querySelectorAll(".org-tab-content") : document.querySelectorAll(".org-tab-content");
      let activeTab = section ? section.querySelector(".org-tab-content.active") : document.querySelector(".org-tab-content.active");
      
      if (!activeTab && section) {
        activeTab = section.querySelector(".org-tab-content");
        if (activeTab) {
          activeTab.classList.add("active");
        }
      }
      
      if (activeTab) {
        const activeClass = Array.from(activeTab.classList).find(cls => cls !== "org-tab-content" && cls !== "active");
        if (activeClass) {
          const matchingItem = Array.from(items).find(it => it.getAttribute("data-section") === activeClass);
          if (matchingItem) {
            btn.textContent = matchingItem.textContent;
          } else {
            const firstItem = items[0];
            if (firstItem) {
              btn.textContent = firstItem.textContent;
            }
          }
        }
      } else {
        const fallback = items[0];
        if (fallback) {
          btn.textContent = fallback.textContent;
        }
      }
      
      btn.addEventListener("click", function () {
        dd.classList.toggle("active");
      });
      
      items.forEach(item => {
        item.addEventListener("click", function () {
          const targetSection = this.getAttribute("data-section");
          btn.textContent = this.textContent;
          dd.classList.remove("active");
          
          if (section) {
            section.querySelectorAll(".org-tab-content").forEach(tab => {
              tab.classList.remove("active");
            });
          } else {
            allTabs.forEach(tab => {
              tab.classList.remove("active");
            });
          }
          
          const targetTab = section ? section.querySelector(".org-tab-content." + targetSection) : document.querySelector(".org-tab-content." + targetSection);
          if (targetTab) {
            targetTab.classList.add("active");
          }
        });
      });
    });
    
    document.addEventListener("click", function (e) {
      dropdowns.forEach(d => {
        if (!d.contains(e.target)) {
          d.classList.remove("active");
        }
      });
    });
  }
  
  function initRanks() {
    document.querySelectorAll(".rank-title").forEach(title => {
      title.addEventListener("click", function () {
        const content = this.nextElementSibling;
        const isActive = content.classList.contains("active");
        const section = this.closest(".org-section");
        
        if (section) {
          section.querySelectorAll(".rank-content").forEach(c => {
            c.classList.remove("active");
          });
        } else {
          document.querySelectorAll(".rank-content").forEach(c => {
            c.classList.remove("active");
          });
        }
        
        if (!isActive) {
          content.classList.add("active");
        }
      });
      
      title.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.click();
        }
      });
    });
  }
  
  initDropdowns();
  initRanks();
});

document.addEventListener("DOMContentLoaded", () => {
  const cards = Array.from(document.querySelectorAll(".review-card"));
  const nextBtn = document.querySelector(".arrow-next");
  const prevBtn = document.querySelector(".arrow-prev");
  let currentIndex = 0;
  let autoPlay = null;
  let isPaused = false;
  let pauseTimeout = null;

  function renderStars(contentEl) {
    const rating = parseInt(contentEl.getAttribute("data-rating")) || 0;
    const starsEl = contentEl.querySelector(".stars");
    starsEl.innerHTML = "";
    
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement("span");
      star.classList.add("star");
      star.innerHTML = "★";
      if (i <= rating) {
        star.classList.add("filled");
      }
      starsEl.appendChild(star);
    }
  }

  function showCard(index) {
    cards.forEach(c => c.classList.remove("active"));
    const card = cards[index];
    card.classList.add("active");
    const content = card.querySelector(".review-content");
    renderStars(content);
  }

  function nextCard() {
    currentIndex = (currentIndex + 1) % cards.length;
    showCard(currentIndex);
  }

  function prevCard() {
    currentIndex = (currentIndex - 1 + cards.length) % cards.length;
    showCard(currentIndex);
  }

  function randomCard() {
    if (!isPaused) {
      let randIdx;
      do {
        randIdx = Math.floor(Math.random() * cards.length);
      } while (randIdx === currentIndex && cards.length > 1);
      currentIndex = randIdx;
      showCard(currentIndex);
    }
  }

  function pauseAutoPlay() {
    isPaused = true;
    if (pauseTimeout) {
      clearTimeout(pauseTimeout);
    }
    pauseTimeout = setTimeout(() => {
      isPaused = false;
    }, 10000);
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      nextCard();
      pauseAutoPlay();
    });
  }
  
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      prevCard();
      pauseAutoPlay();
    });
  }
  
  autoPlay = setInterval(randomCard, 6000);
  showCard(currentIndex);
});

document.querySelectorAll(".faq-question").forEach(q => {
  q.addEventListener("click", () => {
    const item = q.closest(".faq-item");
    const answer = item.querySelector(".faq-answer");
    const icon = q.querySelector(".faq-icon");
    const isActive = item.classList.contains("active");
    
    document.querySelectorAll(".faq-item").forEach(otherItem => {
      if (otherItem !== item) {
        otherItem.classList.remove("active");
        otherItem.querySelector(".faq-icon").textContent = "+";
        otherItem.querySelector(".faq-answer").style.maxHeight = null;
        otherItem.querySelector(".faq-answer").style.paddingBottom = "0";
      }
    });
    
    if (!isActive) {
      item.classList.add("active");
      icon.textContent = "−";
      answer.style.maxHeight = answer.scrollHeight + "px";
      answer.style.paddingBottom = "20px";
    } else {
      item.classList.remove("active");
      icon.textContent = "+";
      answer.style.maxHeight = null;
      answer.style.paddingBottom = "0";
    }
  });
});

const fortunes = [
  "Іноді мовчання голосніше за крик.", "Той, хто знайшов спокій, більше не женеться за щастям.", "Дорога виникає під ногами того, хто йде.", "Щирість завжди перемагає.", "Хто слухає серце — не заблукає.", "Тіні зникають, коли йдеш до світла.", "Справжня сила — у вмінні чекати.", "Тиша знає відповіді на все.", "Те, що твоє, тебе знайде.", "Дива приходять до тих, хто вірить.", "Хто боїться падінь — не бачить висот.", "Кожна рана вчить мудрості.", "Іноді втратити — це знайти.", "Поспішай повільно, і прийдеш швидше.", "Серце знає те, чого не бачать очі.", "Хто посіяв добро — пожне спокій.", "Темрява потрібна, щоб побачити зірки.", "Найменший крок змінює шлях.", "Ніщо не триває вічно, крім змін.", "Секрет щастя — в простоті.", "Хто вдячний — завжди багатий.", "Мудрий чує тишу там, де інші чують шум.", "Навіть річка точить камінь терпінням.", "Той, хто шукає сенс, уже на шляху.", "Легше йти, коли не тягнеш минуле.", "Навіть з попелу виростає життя.", "Віра сильніша за страх.", "Там, де любов, немає темряви.", "Найцінніше завжди невидиме.", "Спокій — це найбільша перемога.", "Зміни починаються з малого кроку.", "Дорога того варта, хто йде нею.", "Хто відпускає — отримує більше.", "Ніч найдовша перед світанком.", "Все можливо, якщо вірити.", "Усмішка змінює світ.", "Щоб побачити світло, іноді треба заплющити очі.", "Справжня сила — у вмінні відпустити.", "Тиша знає більше, ніж ти думаєш.", "Деякі двері зачиняються, щоб ти не загубився.", "Втрачаючи одне, ми знаходимо інше.", "Не всі битви варто вигравати.", "Іноді найкоротший шлях — коло.", "Той, хто слухає серце, не помиляється.", "Ріка не питає дозволу текти.", "Все мине — і радість, і смуток.", "Найважчий крок — перший, найцінніший — останній.", "Світ змінюється тоді, коли змінюєшся ти.", "Не бійся темряви — там народжуються зірки.", "Сьогодні твій день!", "Не бійся змін — вони ведуть до кращого.", "Ти знайдеш щось цінне зовсім скоро.", "Успіх уже на порозі!", "Ти зустрінеш давнього друга.", "Довірся життю — воно мудре.", "Ти привертаєш удачу.", "Хороший настрій притягує хороші події.", "Твоя усмішка сьогодні змінить чиєсь життя.", "Все складеться найкращим чином.", "Ти знайдеш час для себе.", "Кожна мить — шанс для щастя.", "Сьогодні варто поділитися радістю.", "Кожна посмішка повертається сторицею.", "Найкращі рішення приходять спокійно.", "Нова пригода починається сьогодні.", "Хто не шукає, той не знаходить.", "Іноді заблукати — єдиний шлях знайти себе.", "Справжня свобода — всередині тебе.", "Коли зупиняєшся — чуєш більше.", "Тільки тиша відповідає на складні питання.", "Тінь не з’являється без світла.", "Щоб знайти шлях, іноді треба втратити карту.", "Той, хто чекає, завжди зустріне своє.", "Море не боїться бурі — і ти не бійся змін.", "Хто втратив усе — отримав свободу.", "Справжні скарби не мають ціни.", "Іноді кінець — це початок іншого шляху.", "Хто чекає слушного моменту, той вже запізнився.", "Ключ до свободи — всередині тебе.", "Тиша навчає більше, ніж тисячі слів.", "Кожен день — новий шанс почати.", "Той, хто не ризикує, ніколи не злітає.", "Віра в себе творить дива.", "Життя винагороджує сміливих.", "Іноді потрібно зупинитися, щоб піти далі.", "Кожен світанок несе нову надію.", "Не бійся втратити те, що не твоє.", "Справжня сила — у спокої.", "Невидимі двері відчиняються для рішучих.", "Те, що шукаєш, шукає тебе.", "Чисте серце бачить красу всюди.", "Іноді мовчання — це відповідь.", "Навіть маленький крок змінює все.", "Хто довіряє життю — знаходить шлях.", "Щастя приходить непомітно.", "Коли темно, шукай зірки.", "Твоя енергія притягує твоє життя.", "Відпусти минуле — і відкриється майбутнє.", "Справжнє багатство — час і спокій.", "Там, де вдячність, там мир.", "Іноді оминути бурю — значить втратити веселку.", "Завжди є вихід, навіть у темряві.", "Найбільші відкриття — у середині себе.", "Справжня мандрівка починається в серці.", "Мудрість приходить до тих, хто слухає.", "Навіть падіння — це рух уперед.", "Кожна зустріч має сенс.", "Випадковості — це плани Всесвіту.", "Твої думки формують твою реальність.", "Іноді шлях важливіший за мету.", "Немає обмежень, крім тих, що в голові.", "Потік життя веде тих, хто не чіпляється.", "Там, де довіра, там сила.", "Доброта повертається несподівано.", "Навіть коротка пауза може змінити все.", "Майбутнє народжується в теперішньому.", "Твій спокій дорожчий за суперечку.", "Той, хто вміє чекати, отримує більше.", "Кожна зима завершується весною.", "Справжня свобода — у прийнятті себе.", "Навіть закриті двері відкривають шлях до нового.", "Нічого не буває просто так.", "Хто шукає гармонію — знаходить її всередині.", "Дорога легша, коли йдеш із вірою.", "Тиша допомагає почути себе.", "Хто не боїться йти один — знайде свій шлях.", "Світ відкривається тому, хто відкритий світу.", "Час працює на тебе.", "Ти — джерело натхнення для інших.", "Не бійся почати з нуля.", "Справжнє щастя всередині тебе.", "Твоя енергія притягує успіх.", "Час великих звершень наближається.", "Ти здатний на більше, ніж здається.", "День буде сповнений приємних сюрпризів.", "Довіра до себе — ключ до перемоги.", "Ти відкриєш нові горизонти.", "Життя любить тих, хто посміхається.", "Твої старання принесуть плоди.", "Сьогодні ти знайдеш нове натхнення.", "Щастя любить твою компанію.", "Хто дивиться вгору, знаходить зорі.", "Справжня мудрість приходить із досвідом.", "Не бійся зробити перший крок.", "Відвага народжується у момент страху.", "Світло завжди перемагає темряву.", "Немає випадковостей — є уроки.", "Любов лікує найглибші рани.", "Кожен день — нова сторінка життя.", "Будь собою, решта вже зайняті.", "Сміливість — це дія попри сумніви.", "Сила духу важливіша за силу тіла.", "Вір у себе і в свої можливості.", "Зміни починаються з маленького кроку.", "Не шукай легких шляхів — вони не ведуть до вершин.", "Щастя — це вибір, а не обставина.", "Прощення звільняє душу.", "Кожна помилка — це крок до мети.", "Життя коротке, живи яскраво.", "Мрії реалізуються тим, хто діє.", "Ніколи не пізно почати знову.", "Терпіння відкриває двері можливостей.", "Вдячність перетворює звичайне в диво.", "Радість живе в простих речах.", "Кожен вибір формує твоє завтра.", "Слухай свій внутрішній голос.", "Успіх — це поєднання праці і віри.", "Не дозволяй страху керувати тобою.", "Пам’ятай, що ти не сам.", "Друзі — це родина, обранці серця.", "Життя — це мистецтво знаходити баланс.", "Кожен світанок — шанс змінити все.", "Навчайся на кожному кроці.", "Відкритість дарує нові можливості.", "Час лікує навіть найглибші рани.", "Ти сильніший, ніж здаєшся.", "Мрії живуть у серці сміливців.", "Доброта — це мова, яку розуміють усі.", "Не бійся бути вразливим.", "Кожна подорож починається з кроку.", "Зміни — це шлях до росту.", "Ніколи не припиняй вірити.", "Світ чекає на твої таланти.", "Роби добро, не чекаючи нагороди.", "Сміх — найкращий лікар.", "Майбутнє належить тим, хто готується сьогодні.", "Вір у дива і вони стануться.", "Твоя історія ще не закінчена.", "Справжня краса — у простоті.", "Любов іде від серця до серця.", "Живи, а не існуй.", "Будь світлом у темряві.", "Свобода — найвища цінність людини. — Василь Стус", "Свою Україну любіть. — Тарас Шевченко", "Борітеся — поборете! — Тарас Шевченко", "Народ, який не знає свого минулого, не вартий свого майбутнього. — Михайло Грушевський", "Душа людини — то великий світ. — Леся Українка", "І чужому научайтесь, й свого не цурайтесь. — Тарас Шевченко", "Без віри в себе нема сили перемагати. — Ліна Костенко", "Ідея нації — понад усе. — Степан Бандера", "Українська мова — це душа нашого народу. — Іван Франко", "Нема щастя, як любов до України. — Павло Тичина", "Доля — це не випадковість, а вибір. — Олена Теліга", "Хто стоїть на землі, той може і не впасти. — Іван Мазепа", "Життя — це боротьба за правду і свободу. — В'ячеслав Чорновіл", "Не жалій себе, працюй на свою державу. — Євген Коновалець", "Любіть Україну в своїй душі. — Володимир Сосюра", "Воля — це найвища цінність. — Симон Петлюра", "Ідея — сильніша за кулі. — Роман Шухевич", "Тільки той, хто бореться, може бути вільним. — Дмитро Донцов", "Мужність полягає у вірі і надії. — Василь Симоненко", "Не буває перемоги без боротьби. — Микола Хвильовий", "Відродження України починається з кожного з нас. — Іван Огієнко", "Україна — це святий обов’язок кожного. — Андрій Мельник", "Мова — це ключ до національної самосвідомості. — Борис Грінченко", "Пам’ятайте, що ми — нація. — Оксана Забужко", "Світло правди переможе темряву брехні. — Євген Сверстюк", "Краса України — в її простоті і душевності. — Марко Вовчок", "Україна — це не просто слово, це сенс життя. — В’ячеслав Липинський", "Віра в перемогу — це наша зброя. — Степан Левицький", "Справжня сила народу — у його єдності. — Павло Скоропадський", "Ніколи не зраджуй своїм ідеалам. — Юрій Липа", "Ми — нація сильних духом. — Василь Стус", "Свобода — це життя. — Леся Українка", "Кожен українець — творець своєї долі. — Іван Франко", "Ми маємо право на своє майбутнє. — Олег Ольжич", "Пам’ять — це міст між поколіннями. — Дмитро Павличко", "Ніколи не забувай, хто ти є. — Олесь Гончар", "Ми — народ, який не скориться. — Симон Петлюра", "Батьківщина — це любов у серці. — Василь Голобородько", "Світ змінюється завдяки людям з великою мрією. — Ліна Костенко", "Гідність — це наш непорушний фундамент. — Іван Багряний", "Життя — це боротьба, а боротьба — це життя. — Дмитро Донцов", "Ми боремося за свою землю і свободу. — Степан Бандера", "Кожен день — це шанс зробити крок вперед. — Володимир Винниченко", "Сила народу — у його культурі. — Микола Костомаров", "Ми — нація творців, а не руйнівників. — Олена Теліга", "Правда завжди сильніша за насильство. — Василь Симоненко", "Наша мова — наша душа. — Іван Франко", "Don't push the horses. — Усик", "Справжня впевненість — це навчитися говорити «ні». — GiK", "Відкидайте всіх, хто не додає світла у ваше життя. Справжня людина має робити вас щасливими. — GiK", "Я не збираюся намагатися подобатися всім, це неможливо. — Billie Eilish", "Не шукай кохання. Шукай себе, а кохання саме тебе знайде.", "Скоро на тебе чекає приємна несподіванка.", "Хтось давно думає про тебе з добром.", "Твої зусилля скоро принесуть плоди.", "Новий знайомий вплине на твоє життя позитивно.", "У найближчі дні ти отримаєш гарну новину.", "Несподівана пропозиція відкриє перед тобою двері.", "День принесе більше радості, ніж ти очікуєш.", "Твоя мрія отримає шанс здійснитися цього тижня.", "Випадкова зустріч змінить твій настрій на краще.", "Твої таланти незабаром помітять інші.", "Відповідь на твоє питання прийде сама собою.", "Скоро ти відчуєш полегшення у важливій справі.", "Фінансова удача усміхнеться тобі дуже скоро.", "Хтось із близьких приємно тебе здивує.", "Твоя доброта повернеться до тебе несподівано.", "Тобі випаде шанс спробувати щось нове.", "Здійсниться бажання, про яке ти майже забув.", "Доля подарує тобі гарний збіг обставин.", "Ти отримаєш підтримку там, де не очікував.", "Найближчий день подарує нову енергію.", "Хтось поділиться з тобою цінною інформацією.", "Ти отримаєш більше, ніж розраховував.", "Маленька подія зробить твій день особливим.", "Скоро ти відчуєш гордість за свій вибір.", "Твої старання скоро винагородяться подвійно.", "Хтось таємно планує зробити тобі приємне.", "Несподіваний подарунок зробить тебе щасливим.", "Твоя дорога буде легшою, ніж ти думав.", "Найближчий час подарує нову надію.", "Хтось із минулого з’явиться з хорошими новинами.", "Сьогодні на тебе чекає приємний сюрприз.", "Найближчим часом ти отримаєш добрі новини.", "Твої зусилля незабаром будуть винагороджені.", "Хтось думає про тебе з теплом і турботою.", "Маленький крок сьогодні відкриє великі можливості завтра.", "Новий день принесе несподівану радість.", "Сміливі рішення ведуть до великих досягнень.", "Хтось оцінить твою доброту вже сьогодні.", "Віра в себе змінить твоє життя.", "Скоро з’явиться можливість проявити себе.", "Щастя приходить до тих, хто вміє чекати.", "Кожен день — новий шанс змінити життя.", "Справжня сила в умінні залишатися спокійним.", "Чим менше страху — тим більше життя.", "Усмішка — ключ до сердець інших.", "Найцінніше в житті — час і моменти, які ми пам’ятаємо.", "Тиша часто говорить більше, ніж слова.", "Життя — це подорож, а не пункт призначення.", "Добрі справи повертаються добром.", "Надія — це маленьке світло в темряві.", "«Єдиний спосіб робити велику справу — любити те, що ти робиш.» — Стів Джобс", "«Життя — це те, що з тобою відбувається, поки ти будуєш інші плани.» — Джон Леннон", "Доля готує для тебе приємну несподіванку.", "Скоро ти зустрінеш людину, яка змінить твій день.", "Випадковість сьогодні зіграє тобі на користь.", "Не бійся спробувати нове — успіх поруч.", "Добрі наміри притягують добрі події.", "Довіра до себе відкриє нові можливості.", "Твоє терпіння буде винагороджено.", "Несподівана радість завітає до твого дому.", "Маленька перемога сьогодні приведе до великої завтра.", "Зосередься на хорошому, і воно примножиться.", "Твоє життя готує тобі приємний поворот.", "Ти знайдеш те, що давно шукав.", "Позитивний настрій сьогодні — ключ до успіху.", "Хороші новини вже в дорозі до тебе.", "Сьогодні твоя енергія приваблює успіх.", "Друзі порадують тебе неочікуваною підтримкою.", "Твої мрії ближчі, ніж здаються.", "Кожен день наближає тебе до великої радості.", "Сьогодні шанс прийде несподівано — не проґав його.", "Твоє бажання здійсниться у найнесподіваніший момент.", "Хороші події стануться там, де ти їх не чекаєш.", "Твоє добре серце приверне потрібних людей.", "Невелика зміна сьогодні приведе до великого успіху завтра.", "Твоя наполегливість сьогодні дасть плоди.", "Відкрийся новим можливостям — вони поруч.", "Хороша подія змусить тебе посміхнутися.", "Твої старання помітять і оцінять.", "Доля готує для тебе теплу зустріч.", "Хороші думки сьогодні стануть реальністю.", "Твоє життя стане яскравішим завдяки маленькій радості.", "Несподіваний дзвінок змінить твій настрій на краще.", "Доля сьогодні буде на твоєму боці.", "Твоя доброта сьогодні повернеться до тебе.", "Скоро ти отримаєш приємний подарунок долі.", "Випадкова зустріч принесе щастя.", "Твої зусилля будуть оцінені навіть тими, від кого ти цього не чекав.", "Кожен твій крок сьогодні наближає успіх.", "Ти отримаєш несподівану підтримку від близьких.", "Віра у власні сили принесе результат.", "Твої ідеї сьогодні знайдуть відгук у серцях інших.", "Хороші зміни вже почалися у твоєму житті.", "Ти отримаєш більше, ніж очікуєш.", "Твоя посмішка сьогодні принесе удачу.", "Хороший день починається з гарного настрою — у тебе все вийде.", "Ти отримаєш корисну пораду, яка змінить день на краще.", "Твій оптимізм сьогодні приверне щастя.", "Друзі здивують тебе приємною новиною.", "Твоя удача сьогодні сильніша, ніж здається.", "Ти знайдеш натхнення у несподіваному місці.", "Доля подарує шанс, про який ти мріяв.", "Кожен момент сьогодні має особливе значення.", "Ти побачиш, що навіть дрібниці приносять щастя.", "Хороші люди сьогодні з’являться у твоєму житті.", "Несподівана подія зробить день особливим.", "Твої старання принесуть плоди швидше, ніж ти думаєш.", "Твій настрій сьогодні здатний змінити багато чого.", "Хороший сюрприз зробить цей день незабутнім.", "Твоя енергія сьогодні приверне правильних людей.", "Ти зможеш зробити більше, ніж планував.", "Твоя віра у краще сьогодні особливо сильна.", "Твоє життя наповниться новими яскравими фарбами.", "Добра новина знайде тебе у несподіваний момент.", "Невеликий успіх сьогодні стане початком великого шляху.", "Твоя щирість сьогодні приверне добрі події.", "Хороший шанс з’явиться там, де ти його не чекав.", "Твоя удача поруч — довірся їй.", "Твоя мрія здійсниться у несподіваний момент.", "Найкраще ще попереду.", "Щастя прийде тоді, коли ти найменше цього чекатимеш.", "Удача посміхнеться тобі в найближчий час.", "Твої старання принесуть несподіваний результат.", "Нова можливість відкриє перед тобою двері.", "Твоє серце знайде гармонію та спокій.", "Успіх прийде через наполегливість.", "На тебе чекає зустріч, що змінить життя.", "Невеликий крок приведе до великої перемоги.", "Твоя доброта повернеться до тебе сторицею.", "Мрія, про яку ти забув, здійсниться.", "На тебе чекає приємна несподіванка.", "Несподівана подія принесе користь.", "Твоє життя отримає новий яскравий відтінок.", "Шанс, який ти шукаєш, вже поруч.", "Доля винагородить твоє терпіння.", "Ти отримаєш підтримку, про яку й не здогадувався.", "Розв’язання проблеми прийде звідти, звідки не чекав.", "Твоя усмішка приверне правильних людей.", "Випадкова зустріч змінить твій настрій.", "На тебе чекає нове натхнення.", "Твоя наполегливість приведе до бажаного результату.", "Вір у себе — це ключ до успіху.", "Дрібна удача переросте у велику перемогу.", "Добра новина на шляху до тебе.", "Твоє життя наповниться приємними подіями.", "Хтось оцінить твої старання.", "Несподівана радість увійде до твого життя.", "Маленька зміна призведе до великого щастя.", "Відповідь, яку ти шукав, з’явиться сама.", "Твоє прагнення до кращого буде винагороджене.", "З’явиться новий привід для усмішки.", "Найважливіше рішення прийде легко.", "Ти зустрінеш людину, яка підтримає тебе.", "Найближчим часом відбудеться щаслива подія.", "Мрія почне втілюватися в реальність.", "Твоя доброта зробить життя яскравішим.", "Несподівана допомога вирішить складність.", "Ти знайдеш гармонію в несподіваному місці.", "Щастя прийде через щирість і доброту.", "Маленьке диво станеться у твоєму житті.", "Випадкова порада виявиться дуже корисною.", "Твоє натхнення приведе до нових відкриттів.", "Успіх буде там, де ти менше за все його чекаєш.", "Доля підготує для тебе приємний подарунок.", "Маленька радість переросте у велику подію.", "Ти отримаєш те, про що давно мріяв.", "Життя піднесе приємний сюрприз.", "Удача буде на твоєму боці.", "Ти зможеш знайти рішення навіть складної ситуації.", "Мрія здійсниться раніше, ніж ти думаєш.", "Несподіваний шанс відкриє нові горизонти.", "Хороша подія подарує упевненість у собі.", "Твої старання принесуть бажаний результат.", "Невелика перемога стане початком великих змін.", "Доля подарує радісний момент.", "Випадкова зустріч залишить приємний слід.", "Твоя доброта повернеться вдячністю.", "Хороші зміни вже на шляху до тебе.", "Ти знайдеш спокій, якого шукав.", "Несподіване відкриття зробить тебе щасливішим.", "На тебе чекає світлий період життя.", "Твоя енергія приверне успіх.", "Невелика удача призведе до великої перемоги.", "Мрія оживе у найнесподіваніший момент.", "Ти отримаєш те, чого заслуговуєш.", "Доля готує приємний поворот подій.", "Ти отримаєш користь від несподіваного джерела.", "Невеликий шанс змінить хід твоїх справ.", "Твоя віра у добро принесе щастя.", "На тебе чекає тепла зустріч.", "Радість прийде через несподіваний подарунок.", "Невелика увага до деталей принесе удачу.", "Хтось поділиться з тобою добрими новинами.", "На твоєму шляху з’явиться корисна можливість.", "Маленький комплімент змінить твій настрій.", "Твої старання принесуть користь швидко.", "Випадковий шанс стане доленосним.", "Невелика зміна в житті принесе щастя.", "Твоє серце знайде те, що давно шукало.", "Несподівана подія зробить життя яскравішим.", "Твоя щирість приверне удачу.", "Добра справа повернеться вдячністю.", "Твоя наполегливість приведе до гарних результатів.", "Хтось подякує тобі за твої старання.", "Невелике досягнення підніме настрій.", "Мрія, про яку ти думав, здійсниться.", "Життя подарує приємний сюрприз.", "Доля піднесе несподівану допомогу.", "Твоє прагнення до нового відкриє двері можливостей.", "Випадкова розмова буде дуже корисною.", "Невеликий успіх надихне на нові звершення.", "Доля відзначить твою працю нагородою.", "Хтось приємно здивує тебе турботою.", "Твої зусилля принесуть більше, ніж ти чекав.", "Невелика радість стане початком великого щастя.", "Життя покаже, що добро завжди повертається.", "Відкривай серце – і світ відкриється тобі.", "Щирість притягує до тебе добрих людей.", "Маленькі кроки ведуть до великих звершень.", "Кожен новий день – це шанс почати заново.", "Доброта завжди знаходить шлях до серця.", "Розуміння змінює світ навколо тебе.", "Пам’ятай: найцінніше – це час і любов.", "Відвага перемагає страх і відкриває можливості.", "Ти – творець свого щастя і долі.", "Навчайся на помилках і йди вперед.", "Найкращі речі приходять несподівано.", "Надія світить навіть у найтемніші часи.", "Щастя починається з вдячності за сьогодні.", "Добро повертається сторицею.", "Сміливість змінює твоє життя на краще.", "Любов – найсильніша сила на світі.", "Відпочинок оновлює душу і тіло.", "Кожен день дарує нові можливості.", "Твої слова мають силу змінювати світ.", "Віра у себе — початок кожного великого успіху.", "Щастя не в речах, а у нас самих.", "Кожен день — це новий шанс змінити життя.", "Справжня сила — у єдності та підтримці.", "Відвага — це дія всупереч страху.", "Мрії стають реальністю, якщо в них вірити.", "Ніколи не здавайся, навіть якщо важко.", "Любов і повага об’єднують людей.", "Віра і терпіння приносять великі плоди.", "Доброта завжди знаходить шлях до серця.", "Сміливість творить історію.", "Свобода починається з внутрішньої сміливості.", "Терпіння і праця все перетруть.", "Усмішка — ключ до сердець інших.", "Маленькі кроки ведуть до великих звершень.", "Розуміння змінює світ навколо тебе.", "Твої слова мають силу змінювати світ.", "Залишайся собою, і люди цінуватимуть тебе.", "Найкращі речі приходять несподівано.", "Щастя починається з вдячності за сьогодні.", "Віра в себе відкриває шлях до успіху.", "Навчайся на помилках і йди вперед.", "Ти — творець свого щастя і долі.", "Повага починається з поваги до себе.", "Любов — найсильніша сила на світі.", "Справжня свобода — це внутрішній спокій.", "Кожен день — це нова сторінка твоєї історії.", "Доброта повертається сторицею.", "Ти сильніший, ніж здається.", "Не зупиняйся, навіть якщо шлях важкий.", "Ти маєш силу змінити своє життя.", "Мрії здійснюються тих, хто наважується діяти.", "Щастя — це шлях, а не пункт призначення.", "Кожен голос важливий.", "Рішучість приводить до перемог.", "Немає меж для тих, хто вірить.", "Добро повертається сторицею.", "Ти твориш свою реальність.", "Віра у себе — перший крок до успіху.", "Свобода — це відповідальність.", "Сміливість — перший крок до успіху.", "Зміни починаються з тебе.", "Пам’ятай, звідки ти прийшов.", "Життя — це подарунок, цінуй його.", "Кожен день — новий початок.", "Сила людини — у її душі.", "Любов і повага починаються з себе.", "Всі великі справи починаються з ідеї.", "Твоє серце знайде гармонію та спокій.", "Успіх прийде через наполегливість.", "На тебе чекає зустріч, що змінить життя.", "Невеликий крок приведе до великої перемоги.", "Твоя доброта повернеться до тебе сторицею.", "Мрія, про яку ти забув, здійсниться.", "На тебе чекає приємна несподіванка.", "Несподівана подія принесе користь.", "Твоє життя отримає новий яскравий відтінок.", "Шанс, який ти шукаєш, вже поруч.", "Доля винагородить твоє терпіння.", "Нові ідеї приведуть до великих звершень.", "Ти отримаєш допомогу тоді, коли вона буде потрібна.", "Очікуй на радість і натхнення найближчим часом.", "Твої мрії знайдуть шлях до втілення.", "Внутрішній спокій дасть сили для нових звершень.", "Доля подарує шанс змінити своє життя на краще.", "Ти будеш здивований своїми власними можливостями.", "Очікуй на приємні новини і зустрічі."
];

function getMidnightTimestamp() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function canOpenCookie() {
  const lastOpened = localStorage.getItem("fortuneCookieLastOpened");
  if (!lastOpened) return true;
  
  const lastDate = new Date(parseInt(lastOpened));
  const now = new Date();
  
  return now.getDate() !== lastDate.getDate() || 
         now.getMonth() !== lastDate.getMonth() || 
         now.getFullYear() !== lastDate.getFullYear();
}

function getTimeLeft() {
  const nowDate = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - nowDate.getTime();
}

function updateLastOpened() {
  localStorage.setItem("fortuneCookieLastOpened", Date.now().toString());
}

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return hours.toString().padStart(2, "0") + ":" + 
         minutes.toString().padStart(2, "0") + ":" + 
         seconds.toString().padStart(2, "0");
}

let countdownInterval;

function openCookie() {
  const backdrop = document.getElementById("fortuneBackdrop");
  const paper = document.getElementById("fortunePaper");
  const text = document.getElementById("fortuneText");
  
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
  
  if (canOpenCookie()) {
    text.textContent = fortunes[Math.floor(Math.random() * fortunes.length)];
    updateLastOpened();
  } else {
    let timeLeft = getTimeLeft();
    text.innerHTML = "Печенько можна відкривати лише раз на добу.<br><br>Зачекайте: " + formatTime(timeLeft);
    
    countdownInterval = setInterval(() => {
      timeLeft -= 1000;
      if (timeLeft <= 0) {
        clearInterval(countdownInterval);
        text.textContent = "Тепер ви можете відкрити печенько знову!";
      } else {
        text.innerHTML = "Печенько можна відкривати лише раз на добу.<br><br>Зачекайте: " + formatTime(timeLeft);
      }
    }, 1000);
  }
  
  backdrop.style.display = "flex";
  paper.style.animation = "unroll 0.6s ease forwards";
  backdrop.onclick = closeCookie;
  paper.onclick = closeCookie;
  
  text.onclick = function (e) {
    e.stopPropagation();
  };
}

function closeCookie() {
  const backdrop = document.getElementById("fortuneBackdrop");
  const paper = document.getElementById("fortunePaper");
  
  paper.style.animation = "none";
  backdrop.style.display = "none";
  backdrop.onclick = null;
  paper.onclick = null;
  
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
}

const categories = ["Адміністрація", "Суд", "ДБР", "СБС", "ДАРШ", "НПС", "Мерія", "МВС", "Прокуратура", "Інше"];
const categoriesWrapper = document.getElementById("categoriesWrapper");
const rolesContainer = document.getElementById("rolesContainer");
const noticeContainer = document.getElementById("noticeContainer");
const searchInputEl = document.getElementById("searchInput");
const searchResultEl = document.getElementById("searchResult");
const mobileCategoryBtn = document.getElementById("mobileCategoryBtn");
const mobileCategoriesDropdown = document.getElementById("mobileCategoriesDropdown");
const mobileCategoryText = mobileCategoryBtn.querySelector("span");

let activeCategory = "Адміністрація";
let activeBtn = null;
let mobileActiveItem = null;

function createCategoryList() {
  categories.forEach(cat => {
    const li = document.createElement("li");
    li.className = "category";
    li.innerHTML = '<span class="dot"></span>' + cat;
    li.addEventListener("click", () => setActiveCategory(cat, li));
    categoriesWrapper.appendChild(li);
    if (cat === "Адміністрація") {
      li.classList.add("active");
      activeBtn = li;
    }
  });
  
  categories.forEach(cat => {
    const div = document.createElement("div");
    div.className = "mobile-category-item";
    div.textContent = cat;
    div.addEventListener("click", () => {
      setActiveCategory(cat, null);
      mobileCategoryText.textContent = cat;
      mobileCategoriesDropdown.classList.remove("show");
      mobileCategoryBtn.classList.remove("active");
      if (mobileActiveItem) {
        mobileActiveItem.classList.remove("active");
      }
      div.classList.add("active");
      mobileActiveItem = div;
    });
    
    mobileCategoriesDropdown.appendChild(div);
    if (cat === "Адміністрація") {
      div.classList.add("active");
      mobileActiveItem = div;
      mobileCategoryText.textContent = "Адміністрація";
    }
  });
}

mobileCategoryBtn.addEventListener("click", e => {
  e.stopPropagation();
  mobileCategoriesDropdown.classList.toggle("show");
  mobileCategoryBtn.classList.toggle("active");
});

document.addEventListener("click", e => {
  if (!mobileCategoryBtn.contains(e.target) && !mobileCategoriesDropdown.contains(e.target)) {
    mobileCategoriesDropdown.classList.remove("show");
    mobileCategoryBtn.classList.remove("active");
  }
});

function setActiveCategory(category, btnEl) {
  if (activeCategory === category) return;
  
  if (activeBtn) activeBtn.classList.remove("active");
  if (mobileActiveItem) mobileActiveItem.classList.remove("active");
  
  activeCategory = category;
  
  if (btnEl) {
    btnEl.classList.add("active");
    activeBtn = btnEl;
  }
  
  mobileCategoryText.textContent = category;
  const mobileItems = mobileCategoriesDropdown.querySelectorAll(".mobile-category-item");
  
  mobileItems.forEach(mi => {
    if (mi.textContent === category) {
      mi.classList.add("active");
      mobileActiveItem = mi;
    }
  });
  
  showRoles(category);
  
  rolesContainer.style.opacity = 0;
  rolesContainer.style.transform = "translateY(-10px)";
  
  setTimeout(() => {
    rolesContainer.style.transition = "all 0.35s ease";
    rolesContainer.style.opacity = 1;
    rolesContainer.style.transform = "translateY(0)";
  }, 10);
}

function showRoles(categoryName) {
  rolesContainer.innerHTML = "";
  noticeContainer.innerHTML = "";
  const rolesDiv = document.createElement("div");
  rolesDiv.className = "roles";
  let hasRoles = false;
  
  if (typeof players !== "undefined" && players[categoryName] && players[categoryName].length > 0) {
    hasRoles = true;
    players[categoryName].forEach(roleData => {
      let tgLink = "";
      if (roleData.telegram) {
          if (roleData.telegram.startsWith("t.me/") || roleData.telegram.startsWith("https://")) {
              tgLink = roleData.telegram.startsWith("http") ? roleData.telegram : "https://" + roleData.telegram;
          } else {
              tgLink = "tg://openmessage?user_id=" + roleData.telegram;
          }
      }
      const tgHtml = roleData.telegram ? `<a href="${tgLink}" target="_blank" rel="noopener noreferrer">${roleData.telegram.replace('https://t.me/', 't.me/')}</a>` : 'Не вказано';

      const roleDiv = document.createElement("div");
      roleDiv.className = "role";
      roleDiv.innerHTML = `
        <div class="role-inner">
          <img class="avatar" src="${roleData.avatar || 'https://via.placeholder.com/150'}" alt="${roleData.username}" />
          <div class="role-info">
            <strong>${roleData.role}</strong><br>
            Username: <b>${roleData.username}</b><br>
            Telegram: ${tgHtml}
            ${roleData.status ? '<div class="role-status">' + roleData.status + '</div>' : ''}
          </div>
        </div>
      `;
      rolesDiv.appendChild(roleDiv);
    });
  }
  
  if (!hasRoles) {
    rolesDiv.innerHTML = "<p><b>У цій категорії немає ролей.</b></p>";
  }
  rolesContainer.appendChild(rolesDiv);
}

createCategoryList();
setTimeout(() => {
  showRoles("Адміністрація");
}, 100);

const firebaseConfig = {
  apiKey: "AIzaSyAy7OL4vRX_jOCjsY4t7kswy5KLI7_xTDc",
  authDomain: "globalviewcounter.firebaseapp.com",
  databaseURL: "https://globalviewcounter-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "globalviewcounter",
  storageBucket: "globalviewcounter.firebasestorage.app",
  messagingSenderId: "298007727934",
  appId: "1:298007727934:web:610bab7e3ed1a757c5666f",
  measurementId: "G-ZRNEWXQDZT"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

function activateTab(tabId) {
  const btn = document.querySelector('.tab-btn[data-tab="' + tabId + '"]');
  const panel = document.getElementById(tabId);
  if (!btn || !panel) return;
  
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  panel.classList.add("active");
}

function scrollToFaq(id, offset = 200) {
  const el = document.getElementById(id);
  if (!el) return;
  const title = el.querySelector(".faq-title");
  
  if (title) {
    setTimeout(() => {
      const topPos = title.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({
        top: topPos,
        behavior: "smooth"
      });
    }, 10);
  }
}

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const tab = btn.getAttribute("data-tab");
    history.pushState(null, "", "#" + tab);
    activateTab(tab);
  });
});

window.addEventListener("load", () => {
  const hash = window.location.hash.substring(1);
  if (hash) {
    activateTab(hash);
    scrollToFaq(hash, 200);
  } else {
    const firstBtn = document.querySelector(".tab-btn");
    if (firstBtn) {
      activateTab(firstBtn.getAttribute("data-tab"));
    }
  }
});

window.addEventListener("hashchange", () => {
  const hash = window.location.hash.substring(1);
  if (hash) {
    activateTab(hash);
    scrollToFaq(hash, 200);
  }
});

document.querySelectorAll(".photo img").forEach(img => {
  img.addEventListener("click", () => {
    document.querySelector("#photo-modal").style.display = "flex";
    document.querySelector("#photo-modal img").src = img.src;
    document.body.style.overflow = "hidden";
  });
});

document.querySelector(".photo-close").addEventListener("click", () => {
  document.querySelector("#photo-modal").style.display = "none";
  document.body.style.overflow = "";
});

document.querySelector("#photo-modal").addEventListener("click", e => {
  if (e.target.id === "photo-modal") {
    e.target.style.display = "none";
    document.body.style.overflow = "";
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const photoOfTheWeek = document.querySelector(".photo-of-the-week");
  const tabContainer = document.querySelector(".tab-container");
  const parent = photoOfTheWeek.parentNode;
  const nextSibling = photoOfTheWeek.nextElementSibling;
  
  function repositionPhoto() {
    if (window.innerWidth <= 768) {
      if (tabContainer && tabContainer.nextElementSibling !== photoOfTheWeek) {
        tabContainer.insertAdjacentElement("afterend", photoOfTheWeek);
      }
    } else if (nextSibling) {
      parent.insertBefore(photoOfTheWeek, nextSibling);
    } else {
      parent.appendChild(photoOfTheWeek);
    }
  }
  
  repositionPhoto();
  window.addEventListener("resize", repositionPhoto);
});

const originalImages = document.querySelectorAll(".photo img");

originalImages.forEach(img => {
  img.removeEventListener("click", img._listener);
  
  const listener = e => {
    if (e.target.closest(".event-button")) return;
    
    document.querySelector("#photo-modal").style.display = "flex";
    document.querySelector("#photo-modal img").src = img.src;
    document.body.style.overflow = "hidden";
  };
  
  img.addEventListener("click", listener);
  img._listener = listener;
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    const modal = document.querySelector("#photo-modal");
    if (modal && modal.style.display === "flex") {
      modal.style.display = "none";
      document.body.style.overflow = "";
    }
  }
});

window.handleSelectChange = function (select) {
  const val = select.value;
  const usernameInput = document.getElementById("username");
  
  if (val) {
    usernameInput.disabled = false;
  } else {
    usernameInput.disabled = true;
    usernameInput.value = "";
  }
};

window.checkLicense = function () {
  const licType = document.getElementById("licenseType").value;
  const username = document.getElementById("username").value.trim();
  const modal = document.getElementById("pv-modal");
  const content = document.getElementById("pv-modal-content");
  
  if (!licType && !username) {
    content.innerHTML = '<p class="error">Виберіть категорію для перевірки та введіть username.</p>';
    showModal();
    return;
  }
  
  if (!licType) {
    content.innerHTML = '<p class="error">Виберіть категорію для перевірки.</p>';
    showModal();
    return;
  }
  
  if (!username) {
    content.innerHTML = '<p class="error">Введіть username власника.</p>';
    showModal();
    return;
  }
  
  const searchName = username.trim().toLowerCase();
  let licData = null;
  
  if (licenses[licType]) {
    if (Array.isArray(licenses[licType])) {
      licData = licenses[licType].filter(l => l.username.toLowerCase() === searchName);
    } else if (typeof licenses[licType] === "object") {
      const key = Object.keys(licenses[licType]).find(k => k.toLowerCase() === searchName);
      licData = key ? licenses[licType][key] : null;
    }
  }
  
  if (licType === "business") {
    if (licData && licData.length > 0) {
      if (licData.length === 1) {
        const biz = licData[0];
        const isCanceled = biz.cans && biz.cans.startsWith("CANS");
        const cancelReason = isCanceled ? biz.cans.slice(4).trim() : null;
        
        if (isCanceled) {
          content.innerHTML = `
            <h2>Реєстрацію Бізнесу Скасовано</h2>
            <p>Реєстрацію вашого бізнесу <i>${biz.status}</i> скасовано <strong>${cancelReason}</strong></p>
            <p>Username власника: <strong>${biz.username}</strong><br>
            Telegram власника: <strong>${biz.telegram}</strong></p>
          `;
        } else {
          content.innerHTML = `
            <h2>Інформація про Бізнес ${biz.username}</h2>
            <p>Назва: <strong>${biz.role}</strong><br>
            Ідентифікаційний код: <strong>${biz.status}</strong><br>
            Telegram власника: <strong>${biz.telegram}</strong>
            ${biz.suspended ? '<br><strong style="color:red;">Відсторонено: ' + biz.suspended + '</strong>' : ''}</p>
          `;
        }
      } else {
        const bizHtml = licData.map((b, idx) => {
          const bCanceled = b.cans && b.cans.startsWith("CANS");
          const bReason = bCanceled ? b.cans.slice(4).trim() : null;
          
          return `
            <p>
              <strong>${idx + 1}. ${b.role}</strong><br>
              Ідентифікаційний код: <strong>${b.status}</strong><br>
              ${bCanceled ? '<span style="color:red;">Реєстрацію цього бізнесу скасовано <strong>' + bReason + '</strong></span>' : ''}
              ${b.suspended ? '<br><strong style="color:red;">Відсторонено: ' + b.suspended + '</strong>' : ''}
            </p>
            <hr>
          `;
        }).join("");
        
        content.innerHTML = `
          <h2>Наявні Бізнеси у ${username}</h2>
          ${bizHtml}
          <p>Telegram власника: <strong>${licData[0].telegram}</strong></p>
        `;
      }
    } else {
      content.innerHTML = `<p class="error">У ${username} немає зареєстрованих бізнесів.</p>`;
    }
    showModal();
    return;
    
  } else if (licType === "police") {
    if (licData) {
      let html = `<h2>Інформація про Поліцейського ${username}</h2>`;
      const rLower = (licData.role || "").toLowerCase();
      
      if (rLower.includes("sbs")) {
        html += `<p><strong style="color: red;">УВАГА! Це співробітник СБС.</strong><br>
                 Він має право відігравати роль СБС, навіть будучи копом лише за Police Undercover або SSC.</p>`;
      } else if (rLower.includes("dbr")) {
        html += `<p><strong style="color: red;">УВАГА! Це співробітник ДБР.</strong><br>
                 Він має право відігравати роль ДБР, навіть будучи копом лише за Police Undercover або SSC.</p>`;
      } else if (rLower.includes("court")) {
        html += `<p><strong style="color: red;">УВАГА! Це Суддя.</strong><br>
                 Він має право виконувати функції судді або брати участь у судових процесах, навіть будучи копом лише за Police Undercover.</p>`;
      } else if (rLower.includes("admin")) {
        html += `<p><strong style="color: red;">УВАГА! Це представник адміністрації сервера.</strong><br>
                 Він має повноваження адміністратора, навіть будучи копом лише за Police Undercover.</p>`;
      } else if (rLower.includes("secr")) {
        html += `<p><strong style="color: red;">УВАГА! Це співробітник охорони.</strong><br>
                 Він може виконувати обов’язки охоронця, будучи копом.</p>`;
      } else {
        const rNum = parseInt(licData.role.replace(/\s/g, ""), 10);
        let rankName = "";
        
        if (!isNaN(rNum)) {
          if (rNum <= 2999) rankName = "Кадет";
          else if (rNum <= 5999) rankName = "Молодший патрульний";
          else if (rNum <= 9999) rankName = "Патрульний";
          else if (rNum <= 12999) rankName = "Старший патрульний";
          else if (rNum <= 15499) rankName = "Молодший сержант";
          else if (rNum <= 18499) rankName = "Сержант";
          else if (rNum <= 21999) rankName = "Старший сержант";
          else if (rNum <= 25999) rankName = "Лейтенант";
          else if (rNum <= 29999) rankName = "Капітан";
          else rankName = "Ветеран";
        } else {
          rankName = licData.role;
        }
        
        html += `<p><strong>Звання: ${rankName}</strong><br>
                 ID: <strong>${licData.status || "відсутній"}</strong><br>
                 Підрозділ: <strong>${licData.expiry || "відсутній"}</strong><br>
                 Telegram: <strong>${licData.telegram || "відсутній"}</strong>
                 ${licData.suspended ? '<br><strong style="color:red;">Відсторонено: ' + licData.suspended + '</strong>' : ''}</p>`;
      }
      content.innerHTML = html;
    } else {
      content.innerHTML = `<p class="error">У ${username} немає затвердженого звання.</p>`;
    }
    
  } else if (licType === "sbs") {
    if (licData) {
      content.innerHTML = `
        <h2>Інформація про Співробітника СБС ${username}</h2>
        <p>
          <strong>Звання: ${licData.role}</strong><br>
          ID: <strong>${licData.status}</strong><br>
          Telegram: <strong>${licData.telegram}</strong>
          ${licData.suspended ? '<br><strong style="color:red;">Відсторонено: ' + licData.suspended + '</strong>' : ''}
        </p>
      `;
    } else {
      content.innerHTML = `<p class="error">${username} не є співробітником СБС.</p>`;
    }
  } else if (licType === "dbr") {
    if (licData) {
      content.innerHTML = `
        <h2>Інформація про Співробітника ДБР ${username}</h2>
        <p>
          <strong>Звання: ${licData.role}</strong><br>
          ID: <strong>${licData.status}</strong><br>
          Telegram: <strong>${licData.telegram}</strong>
          ${licData.suspended ? '<br><strong style="color:red;">Відсторонено: ' + licData.suspended + '</strong>' : ''}
        </p>
      `;
    } else {
      content.innerHTML = `<p class="error">${username} не є співробітником ДБР.</p>`;
    }
  } else if (licType === "nabs") {
    if (licData) {
      content.innerHTML = `
        <h2>Інформація про Співробітника НАБС ${username}</h2>
        <p>
          <strong>Звання: ${licData.role}</strong><br>
          ID: <strong>${licData.status}</strong><br>
          Telegram: <strong>${licData.telegram}</strong>
          ${licData.suspended ? '<br><strong style="color:red;">Відсторонено: ' + licData.suspended + '</strong>' : ''}
        </p>
      `;
    } else {
      content.innerHTML = `<p class="error">${username} не є співробітником НАБС.</p>`;
    }
  } else if (licType === "presslicense") {
    if (licData) {
      if (licData.cans && licData.cans.startsWith("CANS")) {
        const reason = licData.cans.slice(4).trim();
        content.innerHTML = `
          <h2>Журналістську Ліцензію Скасовано</h2>
          <p>Прес-карту <i>№${licData.status} (редакція «${licData.role}»)</i> скасовано <strong>${reason}</strong></p>
          <p>Username: <strong>${username}</strong><br>
          Telegram: <strong>${licData.telegram}</strong></p>
        `;
      } else {
        content.innerHTML = `
          <h2>Інформація про журналістську ліцензію</h2>
          <p>Номер: <strong>№${licData.status}</strong>
          <br>Username: <strong>${username}</strong>
          <br>Редакція: <strong>${licData.role}</strong>
          <br>Telegram: <strong>${licData.telegram}</strong>
          ${licData.suspended ? '<br><strong style="color:red;">Відсторонено: ' + licData.suspended + '</strong>' : ''}</p>
        `;
      }
    } else {
      content.innerHTML = `<p class="error">Журналістська ліцензія у ${username} відсутня.</p>`;
    }
  } else if (licType === "press") {
    if (licData) {
      if (licData.cans && licData.cans.startsWith("CANS")) {
        const reason = licData.cans.slice(4).trim();
        content.innerHTML = `
          <h2>Реєстрацію ЗМІ Скасовано</h2>
          <p>Реєстрацію ЗМІ „<i>${licData.status}</i>” скасовано <strong>${reason}</strong></p>
          <p>Username власника: <strong>${username}</strong><br>
          Telegram власника: <strong>${licData.telegram}</strong></p>
        `;
      } else {
        content.innerHTML = `
          <h2>Інформація про ЗМІ</h2>
          Назва: <strong>${licData.status}</strong>
          <br>Username власника: <strong>${username}</strong>
          <br>Telegram власника: <strong>${licData.telegram}</strong>
          ${licData.suspended ? '<br><strong style="color:red;">Відсторонено: ' + licData.suspended + '</strong>' : ''}
        `;
      }
    } else {
      content.innerHTML = `<p class="error">${username} не є власником жодного зареєстрованого ЗМІ.</p>`;
    }
  } else if (licType === "mafia") {
    if (licData) {
      if (licData.cans && licData.cans.startsWith("CANS")) {
        const reason = licData.cans.slice(4).trim();
        content.innerHTML = `
          <h2>Легалізацію ОЗУ Скасовано</h2>
          <p>Легалізацію ОЗУ (тип: ${licData.role}) „<i>${licData.status}</i>” скасовано <strong>${reason}</strong></p>
          <p>Username власника: <strong>${username}</strong><br>
          Telegram власника: <strong>${licData.telegram}</strong></p>
        `;
      } else {
        content.innerHTML = `
          <h2>Інформація про легалізоване ОЗУ</h2>
          Назва: <strong>${licData.status}</strong>
          <br>Тип: <strong>${licData.role}</strong>
          <br>Username власника: <strong>${username}</strong>
          <br>Telegram власника: <strong>${licData.telegram}</strong>
        `;
      }
    } else {
      content.innerHTML = `<p class="error">${username} не є власником легалізованого ОЗУ.</p>`;
    }
  } else if (licType === "taxi") {
    if (licData) {
      if (licData.cans && licData.cans.startsWith("CANS")) {
        const reason = licData.cans.slice(4).trim();
        content.innerHTML = `
          <h2>Таксистську Ліцензію Скасовано</h2>
          Ліцензію <i>${licData.status}</i> скасовано <strong>${reason}</strong>
          <br><br>Username: <strong>${username}</strong>
          <br>Telegram: <strong>${licData.telegram}</strong>
        `;
      } else {
        content.innerHTML = `
          <h2>Інформація про таксистську ліцензію ${username}</h2>
          Номер: <strong>${licData.status}</strong>
          <br>Telegram: <strong>${licData.telegram}</strong>
          ${licData.suspended ? '<br><strong style="color:red;">Відсторонено: ' + licData.suspended + '</strong>' : ''}
        `;
      }
    } else {
      content.innerHTML = `<p class="error">Таксистська ліцензія у ${username} відсутня.</p>`;
    }
  } else if (licType === "advocat") {
    if (licData) {
      if (licData.cans && licData.cans.startsWith("CANS")) {
        const reason = licData.cans.slice(4).trim();
        content.innerHTML = `
          <h2>Адвокатську Ліцензію Скасовано</h2>
          Адвокатську ліцензію <i>${licData.status}</i> скасовано <strong>${reason}</strong>
          <br>Username: <strong>${username}</strong>
          <br>Telegram: <strong>${licData.telegram}</strong>
        `;
      } else {
        content.innerHTML = `
          <h2>Інформація про адвокатську ліцензію</h2>
          <p>Номер: <strong>${licData.status}</strong></p>
          <p>Username: <strong>${username}</strong><br>
          Telegram: <strong>${licData.telegram}</strong>
          ${licData.suspended ? '<br><strong style="color:red;">Відсторонено: ' + licData.suspended + '</strong>' : ''}</p>
        `;
      }
    } else {
      content.innerHTML = `<p class="error">Адвокатська ліцензія у ${username} відсутня.</p>`;
    }
  } else if (licType === "weapon") {
    if (licData) {
      if (licData.expiry === "00.00.0000") {
        content.innerHTML = `
          <h3>Інформація про ліцензію на зброю для ${username}</h3>
          <p>
            Статус: <strong>скасовано через ${licData.status}</strong><br>
            <small>Ліцензія не підлягає відновленню. Якщо ви вважаєте інакше, будь ласка, подайте апеляцію до суду.</small><br><br>
            Telegram: <strong>${licData.telegram}</strong>
          </p>`;
      } else {
        const now = new Date();
        let startDate, endDate;
        let hasTo = licData.expiry.includes("to");
        let statusStr = "";
        let dateStr = "";
        
        if (hasTo) {
          const [start, end] = licData.expiry.split("to").map(s => s.trim());
          const [d1, m1, y1] = start.split(".");
          const [d2, m2, y2] = end.split(".");
          
          startDate = new Date(`${y1}-${m1}-${d1}T00:00:00`);
          endDate = new Date(`${y2}-${m2}-${d2}T23:59:59`);
          
          if (now < startDate) {
            statusStr = `Неактивна. <br>Буде активна з ${start} до ${end}</strong>`;
          } else if (now > endDate) {
            statusStr = "Не дійсна. <br>Для поновлення зв'яжіться з адміністратором.";
          } else {
            statusStr = "Дійсна";
            dateStr = ` з ${start} до ${end}`;
          }
        } else {
          const [d, m, y] = licData.expiry.split(".");
          startDate = new Date("2000-01-01T00:00:00");
          endDate = new Date(`${y}-${m}-${d}T23:59:59`);
          
          if (now > endDate) {
            statusStr = "Не дійсна. <br>Для поновлення зв'яжіться з адміністратором.";
          } else {
            statusStr = "Дійсна";
            dateStr = `<br>Дійсна до: <strong>${licData.expiry}</strong>`;
          }
        }
        
        content.innerHTML = `
          <h2>Інформація про ліцензію на зброю</h2>
          <p>
            Username: <strong>${username}</strong><br>
            Статус: <strong>${statusStr}</strong>${hasTo ? dateStr : ""}${!hasTo ? dateStr : ""}<br>
            Telegram: <strong>${licData.telegram}</strong>
            ${licData.suspended ? '<br><strong style="color:red;">Відсторонено: ' + licData.suspended + '</strong>' : ''}
          </p>`;
      }
    } else {
      content.innerHTML = `<p class="error">Ліцензія для ${username} не знайдена.</p>`;
    }
  }
  
  showModal();
};

function showModal() {
  const modal = document.getElementById("pv-modal");
  modal.classList.add("show");
}

function pvCloseModal() {
  const modal = document.getElementById("pv-modal");
  modal.classList.remove("show");
}

document.getElementById("username").addEventListener("input", function () {
  if (this.value.trim() === "") {
    pvCloseModal();
  }
});

function togglePvSelect() {
    const options = document.getElementById("customPvSelectOptions");
    const arrow = document.getElementById("customPvSelectArrow");
    options.classList.toggle("show");
    arrow.classList.toggle("open");
}

function selectPvOption(value, text) {
    document.getElementById("customPvSelectSelected").innerText = text;
    
    const nativeSelect = document.getElementById("licenseType");
    nativeSelect.value = value;
    
    const event = new Event('change', { bubbles: true });
    nativeSelect.dispatchEvent(event);
    
    togglePvSelect();
}

document.addEventListener("click", function(e) {
    const customSelect = document.getElementById("customLicenseSelect");
    if (customSelect && !customSelect.contains(e.target)) {
        const options = document.getElementById("customPvSelectOptions");
        const arrow = document.getElementById("customPvSelectArrow");
        if (options && options.classList.contains("show")) {
            options.classList.remove("show");
            arrow.classList.remove("open");
        }
    }
});

(function () {
  const modal = document.getElementById("ruleModal");
  if (!modal) return;

  const PAD = 14;
  const RIGHT_OFFSET = 20; 

  // Build the custom scrollbar overlay
  const track = document.createElement("div");
  track.id = "rule-scrollbar";
  const thumb = document.createElement("div");
  thumb.id = "rule-scrollbar-thumb";
  track.appendChild(thumb);
  document.body.appendChild(track);

  function isRuleOpen() {
    const d = modal.style.display;
    if (d && d !== "none") return true;
    if (d === "none") return false;
    return window.getComputedStyle(modal).display !== "none";
  }

  function metrics() {
    const rect = modal.getBoundingClientRect();
    const trackH = Math.max(0, rect.height - PAD * 2);
    const clientH = modal.clientHeight;
    const scrollH = modal.scrollHeight;
    const maxScroll = Math.max(0, scrollH - clientH);
    const thumbH = maxScroll > 0 ? Math.max(36, (clientH / scrollH) * trackH) : trackH;
    const maxThumbTop = Math.max(0, trackH - thumbH);
    return { rect, trackH, clientH, scrollH, maxScroll, thumbH, maxThumbTop };
  }

  function apply() {
    if (!isRuleOpen()) return false;
    const m = metrics();
    if (m.maxScroll <= 0) return false;
    track.style.top = (m.rect.top + PAD) + "px";
    track.style.left = (m.rect.right - RIGHT_OFFSET) + "px";
    track.style.height = m.trackH + "px";
    const thumbTop = (modal.scrollTop / m.maxScroll) * m.maxThumbTop;
    thumb.style.height = m.thumbH + "px";
    thumb.style.transform = "translateY(" + thumbTop + "px)";
    return true;
  }

  function refresh() {
    if (apply()) track.classList.add("visible");
    else track.classList.remove("visible");
  }

  let followId = null, followFrames = 0;
  function followLoop() {
    refresh();
    if (isRuleOpen() && followFrames-- > 0) {
      followId = requestAnimationFrame(followLoop);
    } else {
      followId = null;
    }
  }
  function startFollow() {
    followFrames = 45; 
    if (followId === null) followId = requestAnimationFrame(followLoop);
  }

  modal.addEventListener("scroll", refresh, { passive: true });
  window.addEventListener("resize", refresh);

  let dragging = false, dragStartY = 0, dragStartScroll = 0;
  thumb.addEventListener("pointerdown", function (e) {
    dragging = true;
    dragStartY = e.clientY;
    dragStartScroll = modal.scrollTop;
    try { thumb.setPointerCapture(e.pointerId); } catch (err) {}
    document.body.style.userSelect = "none";
    e.preventDefault();
    e.stopPropagation();
  });
  thumb.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    const m = metrics();
    const dy = e.clientY - dragStartY;
    const delta = m.maxThumbTop > 0 ? (dy / m.maxThumbTop) * m.maxScroll : 0;
    modal.scrollTop = dragStartScroll + delta;
  });
  function endDrag() {
    dragging = false;
    document.body.style.userSelect = "";
  }
  thumb.addEventListener("pointerup", endDrag);
  thumb.addEventListener("pointercancel", endDrag);

  track.addEventListener("pointerdown", function (e) {
    if (e.target === thumb) return;
    const m = metrics();
    const rect = track.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const targetThumbTop = Math.min(Math.max(0, clickY - m.thumbH / 2), m.maxThumbTop);
    const target = m.maxThumbTop > 0 ? (targetThumbTop / m.maxThumbTop) * m.maxScroll : 0;
    modal.scrollTo({ top: target, behavior: "smooth" });
  });

  new MutationObserver(function () {
    if (isRuleOpen()) {
      startFollow();
    } else {
      refresh();
    }
  }).observe(modal, { attributes: true, attributeFilter: ["style"] });

  refresh();
})();

(function () {
  // Build the menu once
  const menu = document.createElement("div");
  menu.id = "rule-context-menu";
  menu.innerHTML =
    '<button class="rule-ctx-item" data-action="copy-link"><i class="rule-ctx-ico fas fa-link"></i>Копіювати посилання</button>' +
    '<button class="rule-ctx-item" data-action="copy-text"><i class="rule-ctx-ico fas fa-copy"></i>Копіювати текст</button>' +
    '<button class="rule-ctx-item" data-action="top"><i class="rule-ctx-ico fas fa-arrow-up"></i>Нагору</button>' +
    '<div class="rule-ctx-sep"></div>' +
    '<button class="rule-ctx-item" data-action="reload"><i class="rule-ctx-ico fas fa-rotate-right"></i>Оновити сторінку</button>';
  document.body.appendChild(menu);

  function hideMenu() {
    menu.classList.remove("open");
  }

  function copyText(text) {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function () {});
    } else {
      const tmp = document.createElement("textarea");
      tmp.value = text;
      document.body.appendChild(tmp);
      tmp.select();
      try { document.execCommand("copy"); } catch (err) {}
      document.body.removeChild(tmp);
    }
  }

  function runAction(action) {
    if (action === "copy-link") {
      copyText(window.location.href);
    } else if (action === "copy-text") {
      const sel = window.getSelection ? String(window.getSelection()) : "";
      copyText(sel || window.location.href);
    } else if (action === "top") {
      const rm = document.getElementById("ruleModal");
      if (rm && rm.style.display !== "none" && rm.style.display !== "") {
        rm.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else if (action === "reload") {
      window.location.reload();
    }
  }

  menu.addEventListener("click", function (e) {
    const item = e.target.closest(".rule-ctx-item");
    if (!item) return;
    runAction(item.getAttribute("data-action"));
    hideMenu();
  });

  document.addEventListener("contextmenu", function (e) {
    e.preventDefault();
    const mw = menu.offsetWidth;
    const mh = menu.offsetHeight;
    let x = e.clientX;
    let y = e.clientY;
    if (x + mw + 8 > window.innerWidth) x = window.innerWidth - mw - 8;
    if (y + mh + 8 > window.innerHeight) y = window.innerHeight - mh - 8;
    menu.style.left = Math.max(8, x) + "px";
    menu.style.top = Math.max(8, y) + "px";
    menu.classList.add("open");
  });

  document.addEventListener("click", function (e) {
    if (!menu.contains(e.target)) hideMenu();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") hideMenu();
  });
  window.addEventListener("scroll", hideMenu, { passive: true });
  window.addEventListener("resize", hideMenu);
})();


document.addEventListener('DOMContentLoaded', () => {
    const p = document.querySelector('.welcome-text p');
    if (!p) return;
    
    function wrapLetters(node) {
        if (node.nodeType === 3) {
            const text = node.nodeValue;
            const fragment = document.createDocumentFragment();
            for (let i = 0; i < text.length; i++) {
                if (text[i] === ' ' || text[i] === '\n') {
                    fragment.appendChild(document.createTextNode(text[i]));
                } else {
                    const span = document.createElement('span');
                    span.className = 'hover-letter';
                    span.textContent = text[i];
                    fragment.appendChild(span);
                }
            }
            node.parentNode.replaceChild(fragment, node);
        } else if (node.nodeType === 1 && node.tagName !== 'BR') {
            Array.from(node.childNodes).forEach(wrapLetters);
        }
    }
    
    Array.from(p.childNodes).forEach(wrapLetters);
});

(function () {
  const wrapper = document.querySelector('.map-mobile-wrapper');
  if (!wrapper) return;

  const container = wrapper.querySelector('.map-container');
  const img = wrapper.querySelector('.eh-map-img');
  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const zoomResetBtn = document.getElementById('zoomResetBtn');
  const fullscreenBtn = document.getElementById('mapFullscreenBtn');

  let scale = 1;
  let translateX = 0;
  let translateY = 0;
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;

  const MIN_SCALE = 1;
  const MAX_SCALE = 5;
  const ZOOM_STEP = 0.5;

  function applyTransform() {
    container.style.transform = 'translate(' + translateX + 'px, ' + translateY + 'px) scale(' + scale + ')';
  }

  function clampTranslation() {
    const wRect = wrapper.getBoundingClientRect();
    const maxX = (container.offsetWidth * scale - wRect.width) / 2;
    const maxY = (container.offsetHeight * scale - wRect.height) / 2;
    if (maxX > 0) {
      translateX = Math.max(-maxX, Math.min(maxX, translateX));
    } else {
      translateX = 0;
    }
    if (maxY > 0) {
      translateY = Math.max(-maxY, Math.min(maxY, translateY));
    } else {
      translateY = 0;
    }
  }

  function zoomTo(newScale) {
    scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
    clampTranslation();
    applyTransform();
  }

  zoomInBtn.addEventListener('click', function () { zoomTo(scale + ZOOM_STEP); });
  zoomOutBtn.addEventListener('click', function () { zoomTo(scale - ZOOM_STEP); });
  zoomResetBtn.addEventListener('click', function () {
    scale = 1; translateX = 0; translateY = 0;
    applyTransform();
  });

  wrapper.addEventListener('wheel', function (e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP * 0.5 : ZOOM_STEP * 0.5;
    zoomTo(scale + delta);
  }, { passive: false });


  wrapper.addEventListener('mousedown', function (e) {
    if (scale <= 1) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    lastX = translateX;
    lastY = translateY;
    wrapper.classList.add('dragging');
    e.preventDefault();
  });
  document.addEventListener('mousemove', function (e) {
    if (!isDragging) return;
    translateX = lastX + (e.clientX - startX);
    translateY = lastY + (e.clientY - startY);
    clampTranslation();
    applyTransform();
  });
  document.addEventListener('mouseup', function () {
    if (isDragging) {
      isDragging = false;
      wrapper.classList.remove('dragging');
    }
  });


  let lastTouchDist = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchLastX = 0;
  let touchLastY = 0;

  function getTouchDist(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  wrapper.addEventListener('touchstart', function (e) {
    if (e.touches.length === 2) {
      lastTouchDist = getTouchDist(e.touches);
    } else if (e.touches.length === 1 && scale > 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchLastX = translateX;
      touchLastY = translateY;
    }
  }, { passive: true });
  wrapper.addEventListener('touchmove', function (e) {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = getTouchDist(e.touches);
      const delta = (dist - lastTouchDist) * 0.01;
      lastTouchDist = dist;
      zoomTo(scale + delta);
    } else if (e.touches.length === 1 && scale > 1) {
      e.preventDefault();
      translateX = touchLastX + (e.touches[0].clientX - touchStartX);
      translateY = touchLastY + (e.touches[0].clientY - touchStartY);
      clampTranslation();
      applyTransform();
    }
  }, { passive: false });


  container.style.transformOrigin = 'center center';
  container.style.transition = 'transform 0.15s ease-out';
  applyTransform();
})();
