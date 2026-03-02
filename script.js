// 🔒 Capture globale des erreurs JS
window.addEventListener("error", e => console.error("JS ERROR:", e.message));

// 🔹 Utilitaire pour normaliser les animés
function normalizeAnime(anime) {
  return {
    id: anime.id || Date.now(),
    title: anime.title || "Sans titre",
    status: anime.status || "planned",
    rating: Number(anime.rating) || 0,
    image: anime.image || "https://via.placeholder.com/200x280",
    episodesWatched: Number(anime.episodesWatched) || 0,
    episodesTotal: Number(anime.episodesTotal) || 0,
    notes: anime.notes && typeof anime.notes === "object" ? anime.notes : {
      personal: "", characters: "", genres: "", summary: ""
    }
  };
}

// 🔹 Variables globales
let animes = [];
let currentSort = null;
let sortDirection = "desc";
let currentFilter = "all";
let searchTerm = "";
let currentAnimeId = null;

// 🔹 Charger depuis localStorage
try {
  const stored = localStorage.getItem("animes");
  animes = stored ? JSON.parse(stored) : [];
} catch(e){
  console.warn("LocalStorage corrompu ou vide", e);
  animes = [];
}

// 🔹 Charger depuis JSON si localStorage vide
if(!Array.isArray(animes) || animes.length === 0){
  fetch("animes.json")
    .then(res => res.json())
    .then(data => {
      animes = data.map(normalizeAnime);
      saveToLocalStorage();
      renderAnimes();
      updateStats();
    })
    .catch(err => console.error("Erreur chargement animes.json :", err));
} else {
  animes = animes.map(normalizeAnime);
}

// 🔹 Sauvegarde
function saveToLocalStorage() {
  localStorage.setItem("animes", JSON.stringify(animes));
}

// 🔹 Stats
function updateStats() {
  const total = animes.length;
  const completed = animes.filter(a=>a.status==="completed").length;
  const watching = animes.filter(a=>a.status==="watching").length;
  const planned = animes.filter(a=>a.status==="planned").length;
  const average = total>0 ? (animes.reduce((sum,a)=>sum+Number(a.rating||0),0)/total).toFixed(1) : 0;

  ["totalStat","completedStat","watchingStat","plannedStat"].forEach((id,index)=>{
    const el = document.getElementById(id);
    if(el) el.textContent = [total,completed,watching,planned][index];
  });

  const avgEl = document.getElementById("averageStat");
  if(avgEl) avgEl.textContent = average;

  const progressPercent = total>0?Math.round((completed/total)*100):0;
  const progressText = document.getElementById("progressPercent");
  const progressFill = document.getElementById("progressFill");
  if(progressText) progressText.textContent = progressPercent;
  if(progressFill) progressFill.style.width = progressPercent+"%";
}

// 🔹 Affichage des animés
function renderAnimes() {
  const grid = document.querySelector(".anime-grid");
  if(!grid) return;

  grid.classList.add("fade");
  setTimeout(()=>{
    grid.innerHTML = "";
    let filtered = animes;

    if(currentFilter!=="all") filtered = filtered.filter(a=>a.status===currentFilter);
    if(searchTerm!=="") filtered = filtered.filter(a=>a.title.toLowerCase().includes(searchTerm.toLowerCase()));

    // Tri
    if(currentSort){
      if(currentSort==="rating") filtered.sort((a,b)=>sortDirection==="desc"?b.rating-a.rating:a.rating-b.rating);
      if(currentSort==="title") filtered.sort((a,b)=>sortDirection==="desc"?b.title.localeCompare(a.title):a.title.localeCompare(b.title));
      if(currentSort==="recent") filtered.sort((a,b)=>sortDirection==="desc"?b.id-a.id:a.id-b.id);
    }

    filtered.forEach((anime,index)=>{
      const watched = anime.episodesWatched;
      const total = anime.episodesTotal;
      const progress = total>0?Math.round((watched/total)*100):0;
      let color = progress===100?"green":progress>=75?"yellow":progress>=25?"orange":"red";

      const card = document.createElement("div");
      card.classList.add("anime-card");
      card.style.animationDelay = `${index*0.05}s`;
      card.innerHTML=`
        <button class="delete-btn" data-id="${anime.id}">🗑️</button>
        <img src="${anime.image}" alt="Affiche">
        <h3>${anime.title}</h3>
        <p class="status ${anime.status}">${anime.status==="watching"?"En cours":anime.status==="completed"?"Vu":"À regarder"}</p>
        <p class="rating">⭐ Note : ${anime.rating}/10</p>
        ${anime.notes && (anime.notes.personal||anime.notes.characters||anime.notes.genres||anime.notes.summary)?`
          <div class="notes-preview">
            <button class="toggle-notes">📘 Voir les notes</button>
            <div class="notes-content hidden">
              ${anime.notes.personal?`<p><strong>📝 Notes :</strong> ${anime.notes.personal}</p>`:""}
              ${anime.notes.characters?`<p><strong>👤 Personnages :</strong> ${anime.notes.characters}</p>`:""}
              ${anime.notes.genres?`<p><strong>🎭 Genres :</strong> ${anime.notes.genres}</p>`:""}
              ${anime.notes.summary?`<p><strong>📖 Résumé :</strong> ${anime.notes.summary}</p>`:""}
            </div>
          </div>`:""}
        <p class="episodes">📺 ${watched} / ${total} épisodes</p>
        <div class="progress-bar">
          <div class="progress-fill ${color}" style="width:${progress}%"></div>
        </div>
        <p class="progress-text">📊 Progression : ${progress}%</p>
      `;
      grid.appendChild(card);

      // Toggle notes
      const toggleBtn = card.querySelector(".toggle-notes");
      const notesContent = card.querySelector(".notes-content");
      if(toggleBtn && notesContent){
        toggleBtn.addEventListener("click",e=>{
          e.stopPropagation();
          notesContent.classList.toggle("hidden");
          toggleBtn.textContent = notesContent.classList.contains("hidden")?"📘 Voir les notes":"📕 Masquer les notes";
        });
      }

      // Delete
      const deleteBtn = card.querySelector(".delete-btn");
      deleteBtn.addEventListener("click",()=>{
        animes = animes.filter(a=>a.id!==anime.id);
        saveToLocalStorage();
        renderAnimes();
        updateStats();
      });

      // Click modale
      card.addEventListener("click",e=>{
        if(e.target.closest(".delete-btn")) return;
        openEditModal(anime);
      });

    });

    grid.classList.remove("fade");
    updateStats();
  },200);
}

// 🔹 Ajouter un animé
document.getElementById("addAnime").addEventListener("click",()=>{
  const anime = {
    title: document.getElementById("animeTitle").value.trim(),
    status: document.getElementById("animeStatus").value,
    rating: Number(document.getElementById("animeRating").value),
    image: document.getElementById("animeImage").value.trim() || "https://via.placeholder.com/200x280",
    episodesWatched: Number(document.getElementById("animeEpisodesWatched").value) || 0,
    episodesTotal: Number(document.getElementById("animeEpisodesTotal").value) || 0,
    notes: {
      personal: document.getElementById("animeNotePersonal").value.trim(),
      characters: document.getElementById("animeNoteCharacters").value.trim(),
      genres: document.getElementById("animeNoteGenres").value.trim(),
      summary: document.getElementById("animeNoteSummary").value.trim()
    }
  };

  if(!anime.title || isNaN(anime.rating)) return alert("Merci de remplir tous les champs !");
  animes.push(normalizeAnime(anime));
  saveToLocalStorage();
  renderAnimes();
  ["animeTitle","animeRating","animeImage","animeEpisodesWatched","animeEpisodesTotal","animeNotePersonal","animeNoteCharacters","animeNoteGenres","animeNoteSummary"]
    .forEach(id=>document.getElementById(id).value="");
});

// 🔹 Filtres
["filterAll","filterCompleted","filterWatching","filterPlanned"].forEach(id=>{
  document.getElementById(id).addEventListener("click",()=>{
    currentFilter=id.replace("filter","").toLowerCase()==="all"?"all":id.replace("filter","").toLowerCase();
    renderAnimes();
  });
});

// 🔹 Recherche
document.getElementById("searchInput").addEventListener("input",e=>{
  searchTerm = e.target.value;
  renderAnimes();
});

// 🔹 Tri
["sortRating","sortTitle","sortRecent"].forEach(id=>{
  document.getElementById(id).addEventListener("click",()=>{
    const type = id.replace("sort","").toLowerCase();
    if(currentSort===type) sortDirection = sortDirection==="desc"?"asc":"desc";
    else {currentSort=type; sortDirection="desc";}
    renderAnimes();
  });
});

// 🔹 Modale édition
const modal = document.getElementById("editModal");
const saveEdit = document.getElementById("saveEdit");
const cancelEdit = document.getElementById("cancelEdit");

function openEditModal(anime){
  currentAnimeId = anime.id;
  modal.classList.remove("hidden");
  ["editStatus","editRating","editImage","editEpisodesWatched","editEpisodesTotal","editNotePersonal","editNoteCharacters","editNoteGenres","editNoteSummary"]
    .forEach(id=>document.getElementById(id).value = anime[id.replace("edit","").charAt(0).toLowerCase()+id.replace("edit","").slice(1)] || anime[id.replace("edit","").charAt(0).toLowerCase()+id.replace("edit","").slice(1)] || "");
}

cancelEdit.addEventListener("click",()=>modal.classList.add("hidden"));

saveEdit.addEventListener("click",()=>{
  const anime = animes.find(a=>a.id===currentAnimeId);
  if(!anime) return alert("Anime introuvable");

  anime.status = document.getElementById("editStatus").value;
  anime.rating = Number(document.getElementById("editRating").value);
  anime.image = document.getElementById("editImage").value.trim() || anime.image;
  anime.episodesWatched = Number(document.getElementById("editEpisodesWatched").value) || 0;
  anime.episodesTotal = Number(document.getElementById("editEpisodesTotal").value) || 0;
  anime.notes = {
    personal: document.getElementById("editNotePersonal").value.trim(),
    characters: document.getElementById("editNoteCharacters").value.trim(),
    genres: document.getElementById("editNoteGenres").value.trim(),
    summary: document.getElementById("editNoteSummary").value.trim()
  };

  saveToLocalStorage();
  renderAnimes();
  updateStats();
  modal.classList.add("hidden");
});

// 🔹 Thème clair/sombre
const themeToggle = document.getElementById("themeToggle");
document.body.classList.add(localStorage.getItem("theme")||"light");
themeToggle.addEventListener("click",()=>{
  document.body.classList.toggle("dark");
  document.body.classList.toggle("light");
  localStorage.setItem("theme",document.body.classList.contains("dark")?"dark":"light");
});

// 🔹 Export / import JSON
document.getElementById("exportJson").addEventListener("click",()=>{
  const blob = new Blob([JSON.stringify(animes,null,2)],{type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download="anime-list.json";
  a.click();
  URL.revokeObjectURL(a.href);
});

const importInput = document.getElementById("importJson");
document.getElementById("importBtn").addEventListener("click",()=>importInput.click());
importInput.addEventListener("change",e=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=> {
    try {
      const imported = JSON.parse(reader.result);
      if(!Array.isArray(imported)) return alert("Fichier invalide");
      animes = imported.map(normalizeAnime);
      saveToLocalStorage();
      renderAnimes();
      updateStats();
      alert("Import réussi ✅");
    } catch(err){ alert("Erreur import JSON"); }
  };
  reader.readAsText(file);
});

// 🔹 Service Worker
if("serviceWorker" in navigator){
  navigator.serviceWorker.register("./service-worker.js")
    .then(()=>console.log("SW enregistré"))
    .catch(err=>console.error("SW erreur :",err));
}

// 🔹 Initialisation
renderAnimes();
updateStats();