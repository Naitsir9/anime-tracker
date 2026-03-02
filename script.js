// 🔒 Capture globale des erreurs JS (debug)
window.addEventListener("error", (e) => {
  console.error("JS ERROR:", e.message);
});

// 🔹 script.js — version finale complète

// Charger les animés depuis localStorage
let animes = [];

try {
    animes = JSON.parse(localStorage.getItem("animes"));
    // Vérifier si c'est bien un tableau valide
    if(!Array.isArray(animes) || animes.length === 0){
        throw new Error("LocalStorage vide ou invalide");
    }
} catch(e){
    console.log("LocalStorage vide ou invalide, chargement depuis animes.json");

    // Charger depuis animes.json si nécessaire
    fetch("animes.json")
        .then(res => res.json())
        .then(data => {
            animes = data.map(anime => normalizeAnime(anime));
            localStorage.setItem("animes", JSON.stringify(animes));
            renderAnimes();
        })
        .catch(err => console.error("Erreur chargement animes.json :", err));
}

// Normalisation et rendu si localStorage déjà rempli
if(animes && animes.length > 0){
    animes = animes.map(normalizeAnime);
    renderAnimes();
}

// 🔹 Fonction de normalisation pour éviter les erreurs sur les anciens animés
function normalizeAnime(anime) {
    return {
        ...anime,
        notes: anime.notes && typeof anime.notes === "object"
            ? anime.notes
            : {
                personal: "",
                characters: "",
                genres: "",
                summary: ""
            }
    };
}

// 🔹 Fonction principale pour afficher les cartes d'animés
function renderAnimes(){
    const container = document.getElementById("animes-container");
    if(!container) return;

    container.innerHTML = ""; // Vider le container avant de remplir

    animes.forEach(anime => {
        const card = document.createElement("div");
        card.className = "anime-card";
        card.innerHTML = `
            <h3>${anime.title}</h3>
            <p><strong>Résumé:</strong> ${anime.notes.summary}</p>
            <p><strong>Genres:</strong> ${anime.notes.genres}</p>
            <p><strong>Personnal:</strong> ${anime.notes.personal}</p>
            <p><strong>Personnages:</strong> ${anime.notes.characters}</p>
        `;
        container.appendChild(card);
    });
}

// 🔹 Exemple d'ajout d'un nouvel animé
function addAnime(newAnime){
    animes.push(normalizeAnime(newAnime));
    localStorage.setItem("animes", JSON.stringify(animes));
    renderAnimes();
}

// 🔹 Tu peux ajouter ici toutes tes autres fonctions : editAnime, deleteAnime, etc.
const savedSort = JSON.parse(localStorage.getItem("sortSettings"));

// 🛠️ NORMALISATION DES NOTES (compatibilité anciens animés)
animes = animes.map(anime => ({
  ...anime,
  notes: anime.notes && typeof anime.notes === "object"
    ? anime.notes
    : {
        personal: "",
        characters: "",
        genres: "",
        summary: ""
      }
}));

// (optionnel mais recommandé)
localStorage.setItem("animes", JSON.stringify(animes));

let currentSort = savedSort ? savedSort.currentSort : null;
let sortDirection = savedSort ? savedSort.sortDirection : "desc";
let currentFilter = "all";
let searchTerm = "";
let currentAnimeId = null;

const CACHE_NAME = "anime-tracker-v1";
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

function calculateProgress(anime) {
  if (!anime.episodesTotal || anime.episodesTotal === 0) return 0;
  return Math.min(
    100,
    Math.round((anime.episodesWatched / anime.episodesTotal) * 100)
  );
}

function calculateProgress(anime) {
  const watched = Number(anime.episodesWatched) || 0;
  const total = Number(anime.episodesTotal) || 0;

  if (total <= 0) return 0;

  return Math.min(100, Math.round((watched / total) * 100));
}

function animateCounter(element, target) {
  let start = 0;
  const duration = 800; // durée en ms
  const stepTime = 15;
  const increment = target / (duration / stepTime);

  const counter = setInterval(() => {
    start += increment;

    if (start >= target) {
      element.textContent = target;
      clearInterval(counter);
    } else {
      element.textContent = Math.floor(start);
    }
  }, stepTime);
}

// Fonction pour sauvegarder
function saveToLocalStorage() {
  localStorage.setItem("animes", JSON.stringify(animes));
}

function updateStats() {

  const total = animes.length;

  const completed = animes.filter(a => a.status === "completed").length;
  const watching = animes.filter(a => a.status === "watching").length;
  const planned = animes.filter(a => a.status === "planned").length;

  let average = 0;

  if (total > 0) {
    const sum = animes.reduce((acc, anime) => acc + Number(anime.rating), 0);
    average = (sum / total).toFixed(1);
  }

  const totalEl = document.getElementById("totalStat");
  const completedEl = document.getElementById("completedStat");
  const watchingEl = document.getElementById("watchingStat");
  const plannedEl = document.getElementById("plannedStat");
  const averageEl = document.getElementById("averageStat");

  if (totalEl) animateCounter(totalEl, total);
  if (completedEl) animateCounter(completedEl, completed);
  if (watchingEl) animateCounter(watchingEl, watching);
  if (plannedEl) animateCounter(plannedEl, planned);
  if (averageEl) averageEl.textContent = average;

  const progressPercent = total > 0 
  ? Math.round((completed / total) * 100)
  : 0;

  const progressText = document.getElementById("progressPercent");
  const progressFill = document.getElementById("progressFill");
 
  if (progressText) progressText.textContent = progressPercent;
  if (progressFill) progressFill.style.width = progressPercent + "%";
}

const modal = document.getElementById("editModal");
const editStatus = document.getElementById("editStatus");
const editRating = document.getElementById("editRating");
const editImage = document.getElementById("editImage");
const saveEdit = document.getElementById("saveEdit");
const cancelEdit = document.getElementById("cancelEdit");
const editEpisodesWatched = document.getElementById("editEpisodesWatched");
const editEpisodesTotal = document.getElementById("editEpisodesTotal");
const editNotePersonal = document.getElementById("editNotePersonal");
const editNoteCharacters = document.getElementById("editNoteCharacters");
const editNoteGenres = document.getElementById("editNoteGenres");
const editNoteSummary = document.getElementById("editNoteSummary");

// On récupère la grille
const grid = document.querySelector(".anime-grid");
const imageInput = document.getElementById("animeImage");

function updateSortButtons() {

  const buttons = document.querySelectorAll(".sort-container button");

  buttons.forEach(button => {
    button.classList.remove("active");
    button.querySelector(".arrow").textContent = "";
  });

  if (!currentSort) return;

  let activeButton;

  if (currentSort === "rating") {
    activeButton = document.getElementById("sortRating");
  }

  if (currentSort === "title") {
    activeButton = document.getElementById("sortTitle");
  }

  if (currentSort === "recent") {
    activeButton = document.getElementById("sortRecent");
  }

  if (activeButton) {
    activeButton.classList.add("active");

    const arrow = activeButton.querySelector(".arrow");
    arrow.textContent = sortDirection === "desc" ? "↓" : "↑";
  }
}

// Fonction pour afficher les animés
function renderAnimes() {

  grid.classList.add("fade");

  setTimeout(() => {

    grid.innerHTML = "";

    let filteredAnimes = animes;

    if (currentFilter !== "all") {
      filteredAnimes = animes.filter(anime => anime.status === currentFilter);
    }

    if (searchTerm !== "") {
      filteredAnimes = filteredAnimes.filter(anime =>
        anime.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // TRI
    if (currentSort === "rating") {
      filteredAnimes.sort((a, b) =>
        sortDirection === "desc"
          ? b.rating - a.rating
          : a.rating - b.rating
      );
      localStorage.setItem("sortSettings", JSON.stringify({
        currentSort,
        sortDirection
      }));
    }

    if (currentSort === "title") {
      filteredAnimes.sort((a, b) =>
        sortDirection === "desc"
          ? b.title.localeCompare(a.title)
          : a.title.localeCompare(b.title)
      );
      localStorage.setItem("sortSettings", JSON.stringify({
        currentSort,
        sortDirection
      }));
    }

    if (currentSort === "recent") {
      filteredAnimes.sort((a, b) =>
        sortDirection === "desc"
          ? b.id - a.id
          : a.id - b.id
      );
      localStorage.setItem("sortSettings", JSON.stringify({
        currentSort,
        sortDirection
      }));
    }

    filteredAnimes.forEach((anime, index) => {

      const watched = anime.episodesWatched || 0;
      const total = anime.episodesTotal || 0;

      const progress = total > 0
          ? Math.round((watched / total) * 100)
        : 0;

      let progressColor = "red";

      if (progress >= 25) progressColor = "orange";
      if (progress >= 75) progressColor = "yellow";
      if (progress === 100) progressColor = "green";

      const card = document.createElement("div");
      card.classList.add("anime-card");
      card.style.animationDelay = `${index * 0.05}s`;

      card.innerHTML = `
        <button class="delete-btn" data-id="${anime.id}">🗑️</button>

        <img src="${anime.image}" alt="Affiche">

        <h3>${anime.title}</h3>

        <p class="status ${anime.status}">
          ${anime.status === "watching" 
            ? "En cours" 
            : anime.status === "completed" 
            ? "Vu" 
            : "À regarder"}
        </p>

        <p class="rating">⭐ Note : ${anime.rating}/10</p>

        ${
          anime.notes &&
          (anime.notes.personal ||
            anime.notes.characters ||
            anime.notes.genres ||
            anime.notes.summary)
            ? `
              <div class="notes-preview">
                <button class="toggle-notes">📘 Notes</button>

                <div class="notes-content hidden">
                  ${anime.notes?.personal ? `<p><strong>📝 Notes :</strong> ${anime.notes.personal}</p>` : ""}
                  ${anime.notes?.characters ? `<p><strong>👤 Personnages :</strong> ${anime.notes.characters}</p>` : ""}
                  ${anime.notes?.genres ? `<p><strong>🎭 Genres :</strong> ${anime.notes.genres}</p>` : ""}
                  ${anime.notes?.summary ? `<p><strong>📖 Résumé :</strong> ${anime.notes.summary}</p>` : ""}
                </div>
              </div>
           `
           : ""
        }

        <p class="episodes">
          📺 ${anime.episodesWatched || 0} / ${anime.episodesTotal || 0} épisodes
        </p>

        <div class="progress-bar">
          <div 
            class="progress-fill ${progressColor}"
            style="width: ${progress}%">
          </div>
        </div>

        <p class="progress-text">📊 Progression : ${progress}%</p>
      `;

      grid.appendChild(card);

      const toggleBtn = card.querySelector(".toggle-notes");
      const notesContent = card.querySelector(".notes-content");

      if (toggleBtn && notesContent) {
        toggleBtn.addEventListener("click", (e) => {
          e.stopPropagation(); // évite ouverture modale
          notesContent.classList.toggle("hidden");
          toggleBtn.textContent = notesContent.classList.contains("hidden")
            ? "📘 Voir les notes"
            : "📕 Masquer les notes";
        });
      }
      
      const deleteBtn = card.querySelector(".delete-btn");

      deleteBtn.addEventListener("click", () => {
        animes = animes.filter(a => a.id !== anime.id);
        saveToLocalStorage();
        renderAnimes();
      });

      card.addEventListener("click", (e) => {

        if (e.target.closest(".delete-btn")) return;

        currentAnimeId = anime.id; // 🔒 VERROUILLAGE

        console.log("Ouverture modale pour ID =", currentAnimeId);

        editStatus.value = anime.status;
        editRating.value = anime.rating;
        editImage.value = anime.image;
        editEpisodesWatched.value = anime.episodesWatched || 0;
        editEpisodesTotal.value = anime.episodesTotal || 0;
        editNotePersonal.value = anime.notes?.personal || "";
        editNoteCharacters.value = anime.notes?.characters || "";
        editNoteGenres.value = anime.notes?.genres || "";
        editNoteSummary.value = anime.notes?.summary || "";
        
        modal.classList.remove("hidden");
      });

    });

    updateStats();
    updateSortButtons();

    grid.classList.remove("fade");

  }, 200);
}

cancelEdit.addEventListener("click", () => {
  modal.classList.add("hidden");
});

saveEdit.addEventListener("click", () => {

  // 🔎 DEBUG – vérifier que l’ID est bien défini
  console.log("SAVE EDIT ID =", currentAnimeId);

  const anime = animes.find(a => a.id === currentAnimeId);
  if (!anime) {
    console.error("Anime introuvable, abort save");
    return;
  }

  const wasCompleted = anime.status === "completed";
  const newStatus = editStatus.value;

  anime.status = newStatus;

  if (newStatus === "completed" && anime.episodesTotal > 0) {
    anime.episodesWatched = anime.episodesTotal;
  }
  
  anime.rating = Number(editRating.value);
  anime.image = editImage.value;

  anime.notes = {
    personal: editNotePersonal.value.trim(),
    characters: editNoteCharacters.value.trim(),
    genres: editNoteGenres.value.trim(),
    summary: editNoteSummary.value.trim()
  };
  
  const watched = Math.max(0, Number(editEpisodesWatched.value) || 0);
  const total = Math.max(0, Number(editEpisodesTotal.value) || 0);

  anime.episodesTotal = total;
  anime.episodesWatched = Math.min(watched, total);

  if (anime.episodesTotal > 0 && anime.episodesWatched === anime.episodesTotal) {
     anime.status = "completed";
  }

  saveToLocalStorage();
  renderAnimes();
  modal.classList.add("hidden");
});

// On lance l'affichage
renderAnimes();

// Récupération des éléments
const titleInput = document.getElementById("animeTitle");
const statusInput = document.getElementById("animeStatus");
const ratingInput = document.getElementById("animeRating");
const addButton = document.getElementById("addAnime");

addButton.addEventListener("click", () => {

  const notePersonal = document.getElementById("animeNotePersonal").value.trim();
  const noteCharacters = document.getElementById("animeNoteCharacters").value.trim();
  const noteGenres = document.getElementById("animeNoteGenres").value.trim();
  const noteSummary = document.getElementById("animeNoteSummary").value.trim();

  const title = titleInput.value.trim();
  const status = statusInput.value;
  const rating = ratingInput.value;
  const image = imageInput.value.trim();

  if (title === "" || rating === "") {
    alert("Merci de remplir tous les champs !");
    return;
  }

  animes.push({
    id: Date.now(),
    title: title,
    status: status,
    rating: Number(rating),
    image: image !== "" ? image : "https://via.placeholder.com/200x280",
    notes: {
      personal: notePersonal,
      characters: noteCharacters,
      genres: noteGenres,
      summary: noteSummary
    },
    episodesWatched: Number(document.getElementById("animeEpisodesWatched").value) || 0,
    episodesTotal: Number(document.getElementById("animeEpisodesTotal").value) || 0,
  });

  saveToLocalStorage();
  renderAnimes();

  // Reset des champs
  titleInput.value = "";
  ratingInput.value = "";
  imageInput.value = "";
  document.getElementById("animeEpisodesWatched").value = "";
  document.getElementById("animeEpisodesTotal").value = "";

  document.getElementById("animeNotePersonal").value = "";
  document.getElementById("animeNoteCharacters").value = "";
  document.getElementById("animeNoteGenres").value = "";
  document.getElementById("animeNoteSummary").value = "";
});

document.getElementById("filterAll").addEventListener("click", () => {
  currentFilter = "all";
  renderAnimes();
});

document.getElementById("filterCompleted").addEventListener("click", () => {
  currentFilter = "completed";
  renderAnimes();
});

document.getElementById("filterWatching").addEventListener("click", () => {
  currentFilter = "watching";
  renderAnimes();
});

document.getElementById("filterPlanned").addEventListener("click", () => {
  currentFilter = "planned";
  renderAnimes();
});

const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("input", (e) => {
  searchTerm = e.target.value;
  renderAnimes();
});

document.getElementById("sortRating").addEventListener("click", () => {
  if (currentSort === "rating") {
    sortDirection = sortDirection === "desc" ? "asc" : "desc";
  } else {
    currentSort = "rating";
    sortDirection = "desc";
  }
  renderAnimes();
});

document.getElementById("sortTitle").addEventListener("click", () => {
  if (currentSort === "title") {
    sortDirection = sortDirection === "desc" ? "asc" : "desc";
  } else {
    currentSort = "title";
    sortDirection = "desc";
  }
  renderAnimes();
});

document.getElementById("sortRecent").addEventListener("click", () => {
  if (currentSort === "recent") {
    sortDirection = sortDirection === "desc" ? "asc" : "desc";
  } else {
    currentSort = "recent";
    sortDirection = "desc";
  }
  renderAnimes();
});

const themeToggle = document.getElementById("themeToggle");

const savedTheme = localStorage.getItem("theme") || "light";
document.body.classList.add(savedTheme);

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  document.body.classList.toggle("light");

  const activeTheme = document.body.classList.contains("dark") ? "dark" : "light";
  localStorage.setItem("theme", activeTheme);
});

document.getElementById("exportJson").addEventListener("click", () => {
  const dataStr = JSON.stringify(animes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "anime-list.json";
  a.click();

  URL.revokeObjectURL(url);
});

const importInput = document.getElementById("importJson");
const importBtn = document.getElementById("importBtn");

importBtn.addEventListener("click", () => {
  importInput.click();
});

importInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const importedData = JSON.parse(reader.result);

      if (!Array.isArray(importedData)) {
        alert("Fichier invalide");
        return;
      }

      // 🔒 sécurité minimale
      animes = importedData.map(anime => ({
        id: anime.id || Date.now(),
        title: anime.title || "Sans titre",
        status: anime.status || "planned",
        rating: Number(anime.rating) || 0,
        image: anime.image || "https://via.placeholder.com/200x280",
        episodesWatched: Number(anime.episodesWatched) || 0,
        episodesTotal: Number(anime.episodesTotal) || 0,
        notes: {
          personal: anime.notes?.personal || "",
          characters: anime.notes?.characters || "",
          genres: anime.notes?.genres || "",
          summary: anime.notes?.summary || ""
        }
      }));

      saveToLocalStorage();
      renderAnimes();
      alert("Import réussi ✅");

    } catch (err) {
      alert("Erreur lors de l'import");
    }
  };

  reader.readAsText(file);
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("./service-worker.js")
    .then(() => console.log("Service Worker enregistré"))
    .catch(err => console.error("SW erreur :", err));
}