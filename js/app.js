import { loadCatalog } from "./data-store.js";
import { YouTubePlayerController } from "./player.js";
import { pickRandomVideo, pushRecentId } from "./randomizer.js";
import { createStorage } from "./storage.js";

const iconPaths = {
  gamepad: '<path d="M8 10h8a5 5 0 0 1 4.8 6.5l-.6 2a2.5 2.5 0 0 1-4.2 1l-1.3-1.5H9.3L8 19.5a2.5 2.5 0 0 1-4.2-1l-.6-2A5 5 0 0 1 8 10Z"/><path d="M7 13v4M5 15h4M16.5 14h.01M18.5 16h.01"/>',
  music: '<path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/>',
  paw: '<circle cx="8" cy="8" r="2"/><circle cx="16" cy="8" r="2"/><circle cx="5" cy="13" r="2"/><circle cx="19" cy="13" r="2"/><path d="M12 12c-3 0-5.5 3-5.5 5.3 0 2 1.7 3.2 3.6 2.4 1.2-.5 2.6-.5 3.8 0 1.9.8 3.6-.4 3.6-2.4C17.5 15 15 12 12 12Z"/>',
  cooking: '<path d="M5 12h14a7 7 0 0 1-14 0Z"/><path d="M8 9c-1-1-.2-2 .5-2.8S10 4.4 9 3M13 9c-1-1-.2-2 .5-2.8S15 4.4 14 3M4 21h16"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>',
  planet: '<circle cx="12" cy="12" r="5"/><path d="M3.5 15.5c-1-1.7 2-5 6.7-7.7s9-3.6 10-1.9-2 5-6.7 7.7-9 3.6-10 1.9Z"/>',
  bulb: '<path d="M9 18h6M10 22h4M8.4 15.2A7 7 0 1 1 15.6 15.2C14.8 15.8 14.5 16.6 14.5 18h-5c0-1.4-.3-2.2-1.1-2.8Z"/>',
  waves: '<path d="M3 8c2.2 0 2.2-2 4.5-2S9.8 8 12 8s2.2-2 4.5-2S18.8 8 21 8M3 13c2.2 0 2.2-2 4.5-2s2.3 2 4.5 2 2.2-2 4.5-2 2.3 2 4.5 2M3 18c2.2 0 2.2-2 4.5-2s2.3 2 4.5 2 2.2-2 4.5-2 2.3 2 4.5 2"/>',
};

const elements = {
  genreGrid: document.querySelector("#genre-grid"),
  launchButton: document.querySelector("#launch-button"),
  launchLabel: document.querySelector("#launch-label"),
  surpriseButton: document.querySelector("#surprise-button"),
  playerSection: document.querySelector("#player-section"),
  playerLoading: document.querySelector("#player-loading"),
  playerError: document.querySelector("#player-error"),
  errorNextButton: document.querySelector("#error-next-button"),
  nextButton: document.querySelector("#next-button"),
  videoGenre: document.querySelector("#video-genre"),
  playerHeading: document.querySelector("#player-heading"),
  videoChannel: document.querySelector("#video-channel"),
  tagList: document.querySelector("#tag-list"),
  favoriteButton: document.querySelector("#favorite-button"),
  shareButton: document.querySelector("#share-button"),
  themeButton: document.querySelector("#theme-button"),
  collectionButton: document.querySelector("#collection-button"),
  collectionDialog: document.querySelector("#collection-dialog"),
  collectionCloseButton: document.querySelector("#collection-close-button"),
  favoritesTab: document.querySelector("#favorites-tab"),
  historyTab: document.querySelector("#history-tab"),
  favoritesPanel: document.querySelector("#favorites-panel"),
  historyPanel: document.querySelector("#history-panel"),
  favoriteCount: document.querySelector("#favorite-count"),
  historyCount: document.querySelector("#history-count"),
  toast: document.querySelector("#toast"),
};

const storage = createStorage();
const savedState = storage.read();
const state = {
  genres: [],
  videos: [],
  selectedGenre: savedState.selectedGenre,
  currentVideo: null,
  saved: savedState,
  errorTimer: null,
  errorStreak: 0,
};

const player = new YouTubePlayerController("youtube-player", {
  onReady: hidePlayerLoading,
  onStateChange: (playerState) => {
    if ([0, 1, 2, 3, 5].includes(playerState)) {
      hidePlayerLoading();
    }
  },
  onError: handlePlayerError,
});

async function init() {
  bindEvents();
  applyTheme(state.saved.theme);
  try {
    const catalog = await loadCatalog();
    state.genres = catalog.genres;
    state.videos = catalog.videos;
    if (!state.genres.some((genre) => genre.id === state.selectedGenre)) {
      state.selectedGenre = null;
    }
    renderGenres();
    updateLaunchButton();
    updateCollectionCounts();
    const sharedVideoId = new URL(window.location.href).searchParams.get("v");
    const sharedVideo = state.videos.find((video) => video.id === sharedVideoId);
    if (sharedVideo) {
      selectGenre(sharedVideo.genre);
      await playVideo(sharedVideo);
    }
  } catch (error) {
    renderCatalogError(error);
  }
}

function bindEvents() {
  elements.launchButton.addEventListener("click", () => playNext());
  elements.nextButton.addEventListener("click", () => playNext());
  elements.errorNextButton.addEventListener("click", () => playNext());
  elements.favoriteButton.addEventListener("click", toggleFavorite);
  elements.shareButton.addEventListener("click", shareCurrentVideo);
  elements.themeButton.addEventListener("click", toggleTheme);
  elements.collectionButton.addEventListener("click", openCollection);
  elements.collectionCloseButton.addEventListener("click", () => elements.collectionDialog.close());
  elements.favoritesTab.addEventListener("click", () => selectCollectionTab("favorites"));
  elements.historyTab.addEventListener("click", () => selectCollectionTab("history"));
  elements.collectionDialog.addEventListener("click", (event) => {
    if (event.target === elements.collectionDialog) {
      elements.collectionDialog.close();
    }
  });
  document.addEventListener("keydown", handleKeyboardShortcut);
  elements.surpriseButton.addEventListener("click", () => {
    state.selectedGenre = "all";
    updateGenreSelection();
    updateLaunchButton();
    playNext();
  });
}

function renderGenres() {
  elements.genreGrid.replaceChildren();
  for (const genre of state.genres) {
    const button = document.createElement("button");
    button.className = "genre-button";
    button.type = "button";
    button.dataset.genreId = genre.id;
    button.setAttribute("aria-pressed", String(state.selectedGenre === genre.id));
    button.style.setProperty("--genre-color", `${genre.color}22`);

    const symbol = document.createElement("span");
    symbol.className = "genre-symbol";
    symbol.style.color = genre.color;
    symbol.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${iconPaths[genre.icon] ?? iconPaths.compass}</svg>`;

    const copy = document.createElement("span");
    const name = document.createElement("strong");
    name.textContent = genre.name;
    const description = document.createElement("small");
    description.textContent = genre.description;
    copy.append(name, description);
    button.append(symbol, copy);
    button.addEventListener("click", () => selectGenre(genre.id));
    elements.genreGrid.append(button);
  }
}

function selectGenre(genreId) {
  state.selectedGenre = genreId;
  state.saved.selectedGenre = genreId;
  storage.write(state.saved);
  updateGenreSelection();
  updateLaunchButton();
}

function updateGenreSelection() {
  for (const button of elements.genreGrid.querySelectorAll(".genre-button")) {
    button.setAttribute("aria-pressed", String(button.dataset.genreId === state.selectedGenre));
  }
}

function updateLaunchButton() {
  const genre = state.genres.find((item) => item.id === state.selectedGenre);
  elements.launchButton.disabled = !state.selectedGenre;
  elements.launchLabel.textContent = state.selectedGenre === "all"
    ? "完全おまかせで飛ぶ"
    : genre
      ? `${genre.name}の動画へ飛ぶ`
      : "ジャンルを選んでください";
}

async function playNext() {
  if (!state.selectedGenre || state.videos.length === 0) {
    return;
  }

  clearTimeout(state.errorTimer);
  state.errorTimer = null;
  elements.playerError.hidden = true;
  const video = pickRandomVideo(state.videos, {
    genreId: state.selectedGenre,
    recentIds: state.saved.recentIds,
  });

  if (!video) {
    showToast("このジャンルには再生できる動画がありません。");
    return;
  }

  await playVideo(video);
}

async function playVideo(video) {
  state.currentVideo = video;
  state.saved.recentIds = pushRecentId(state.saved.recentIds, video.id);
  state.saved.history = pushRecentId(state.saved.history, video.id, 50);
  state.saved.selectedGenre = state.selectedGenre;
  storage.write(state.saved);
  renderCurrentVideo(video);
  updateCollectionCounts();
  updateShareUrl(video);
  showPlayerLoading();
  const isFirstReveal = elements.playerSection.hidden;
  elements.playerSection.hidden = false;
  if (isFirstReveal) {
    elements.playerSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  try {
    await player.load(video.id);
  } catch (error) {
    handlePlayerError("network");
  }
}

function renderCurrentVideo(video) {
  const genre = state.genres.find((item) => item.id === video.genre);
  elements.videoGenre.textContent = genre?.name ?? "おまかせ";
  elements.playerHeading.textContent = video.title;
  elements.videoChannel.textContent = video.channel;
  elements.tagList.replaceChildren();
  for (const tag of video.tags ?? []) {
    const chip = document.createElement("span");
    chip.textContent = tag;
    elements.tagList.append(chip);
  }
  const isFavorite = state.saved.favorites.includes(video.id);
  elements.favoriteButton.setAttribute("aria-pressed", String(isFavorite));
  elements.favoriteButton.setAttribute("aria-label", isFavorite ? "お気に入りから外す" : "お気に入りに追加");
}

function toggleFavorite() {
  if (!state.currentVideo) {
    return;
  }

  const videoId = state.currentVideo.id;
  const isFavorite = state.saved.favorites.includes(videoId);
  state.saved.favorites = isFavorite
    ? state.saved.favorites.filter((id) => id !== videoId)
    : [videoId, ...state.saved.favorites].slice(0, 100);
  storage.write(state.saved);
  renderCurrentVideo(state.currentVideo);
  updateCollectionCounts();
  showToast(isFavorite ? "お気に入りから外しました。" : "お気に入りに追加しました。");
}

async function shareCurrentVideo() {
  if (!state.currentVideo) {
    return;
  }

  const shareData = {
    title: `${state.currentVideo.title} | TobeTube`,
    text: "TobeTubeで見つけた動画です。",
    url: window.location.href,
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }
    }
  }

  try {
    await navigator.clipboard.writeText(shareData.url);
    showToast("動画のURLをコピーしました。");
  } catch {
    showToast("URLをコピーできませんでした。アドレスバーからコピーしてください。");
  }
}

function updateShareUrl(video) {
  const url = new URL(window.location.href);
  url.searchParams.set("v", video.id);
  url.searchParams.set("genre", video.genre);
  window.history.replaceState({}, "", url);
}

function openCollection() {
  renderCollection();
  selectCollectionTab("favorites");
  elements.collectionDialog.showModal();
}

function selectCollectionTab(tabName) {
  const showFavorites = tabName === "favorites";
  elements.favoritesTab.setAttribute("aria-selected", String(showFavorites));
  elements.historyTab.setAttribute("aria-selected", String(!showFavorites));
  elements.favoritesPanel.hidden = !showFavorites;
  elements.historyPanel.hidden = showFavorites;
}

function renderCollection() {
  renderVideoList(elements.favoritesPanel, state.saved.favorites, "お気に入りはまだありません。", true);
  renderVideoList(elements.historyPanel, state.saved.history, "最近見た動画はまだありません。", false);
  updateCollectionCounts();
}

function renderVideoList(panel, videoIds, emptyMessage, removable) {
  panel.replaceChildren();
  const videos = videoIds
    .map((id) => state.videos.find((video) => video.id === id))
    .filter(Boolean);

  if (videos.length === 0) {
    const empty = document.createElement("p");
    empty.className = "collection-empty";
    empty.textContent = emptyMessage;
    panel.append(empty);
    return;
  }

  const list = document.createElement("ul");
  list.className = "collection-list";
  for (const video of videos) {
    const item = document.createElement("li");
    item.className = "collection-item";

    const thumbnail = document.createElement("img");
    thumbnail.className = "collection-thumbnail";
    thumbnail.src = `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`;
    thumbnail.alt = "";
    thumbnail.loading = "lazy";

    const copy = document.createElement("div");
    copy.className = "collection-copy";
    const playButton = document.createElement("button");
    playButton.type = "button";
    playButton.textContent = video.title;
    playButton.addEventListener("click", () => playCollectionVideo(video));
    const channel = document.createElement("p");
    channel.textContent = video.channel;
    copy.append(playButton, channel);
    item.append(thumbnail, copy);

    if (removable) {
      const removeButton = document.createElement("button");
      removeButton.className = "collection-remove";
      removeButton.type = "button";
      removeButton.setAttribute("aria-label", `${video.title}をお気に入りから外す`);
      removeButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5 5 19"/></svg>';
      removeButton.addEventListener("click", () => {
        state.saved.favorites = state.saved.favorites.filter((id) => id !== video.id);
        storage.write(state.saved);
        renderCollection();
        if (state.currentVideo?.id === video.id) {
          renderCurrentVideo(state.currentVideo);
        }
      });
      item.append(removeButton);
    } else {
      const spacer = document.createElement("span");
      spacer.setAttribute("aria-hidden", "true");
      item.append(spacer);
    }
    list.append(item);
  }
  panel.append(list);
}

async function playCollectionVideo(video) {
  elements.collectionDialog.close();
  selectGenre(video.genre);
  await playVideo(video);
}

function updateCollectionCounts() {
  elements.favoriteCount.textContent = String(state.saved.favorites.length);
  elements.historyCount.textContent = String(state.saved.history.length);
}

function toggleTheme() {
  const currentTheme = document.documentElement.dataset.theme;
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  state.saved.theme = nextTheme;
  storage.write(state.saved);
  applyTheme(nextTheme);
  showToast(nextTheme === "dark" ? "ダークテーマに切り替えました。" : "ライトテーマに切り替えました。");
}

function applyTheme(theme) {
  const systemDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
  const effectiveTheme = theme === "system" ? (systemDark ? "dark" : "light") : theme;
  document.documentElement.dataset.theme = effectiveTheme;
  elements.themeButton.setAttribute("aria-label", effectiveTheme === "dark" ? "ライトテーマに切り替える" : "ダークテーマに切り替える");
}

function handleKeyboardShortcut(event) {
  if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }
  if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) {
    return;
  }
  if (elements.collectionDialog.open) {
    return;
  }

  if (event.key.toLowerCase() === "n" && state.currentVideo) {
    event.preventDefault();
    playNext();
  }
  if (event.key.toLowerCase() === "f" && state.currentVideo) {
    event.preventDefault();
    toggleFavorite();
  }
}

function showPlayerLoading() {
  elements.playerLoading.hidden = false;
}

function hidePlayerLoading() {
  elements.playerLoading.hidden = true;
  state.errorStreak = 0;
}

function handlePlayerError() {
  state.errorStreak += 1;
  elements.playerLoading.hidden = true;
  elements.playerError.hidden = false;
  if (state.errorStreak < 3) {
    state.errorTimer = setTimeout(() => playNext(), 1800);
  }
}

function renderCatalogError(error) {
  elements.genreGrid.replaceChildren();
  const message = document.createElement("p");
  message.className = "collection-empty";
  message.textContent = "動画データを読み込めませんでした。ページを再読み込みしてください。";
  elements.genreGrid.append(message);
  elements.launchButton.disabled = true;
  elements.surpriseButton.disabled = true;
  console.error(error);
}

let toastTimer;
function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  toastTimer = setTimeout(() => {
    elements.toast.hidden = true;
  }, 2600);
}

init();
