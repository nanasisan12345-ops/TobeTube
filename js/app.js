import { loadCatalog } from "./data-store.js";
import { countryName, createTranslator, genreName, localeForCountry } from "./i18n.js?v=20260903a";
import { YouTubePlayerController } from "./player.js";
import { getEligibleVideos, pickDiscoveryVideo, pickRandomVideo, pushRecentId } from "./randomizer.js?v=20260903a";
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
  trophy: '<path d="M8 4h8v4a4 4 0 0 1-8 0V4ZM8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4M12 12v5M8 21h8M9 17h6"/>',
  chip: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 9h6v6H9zM9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
  history: '<path d="M4 5v5h5M5 9a8 8 0 1 1-1 6M12 7v5l3 2"/>',
  hammer: '<path d="m14 5 5 5M12.5 6.5l3-3 5 5-3 3M13 11 5 19l-2 2M9 15l3 3"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18h1.5a2 2 0 0 0 0-4H12a2 2 0 0 1 0-4h5a4 4 0 0 0 4-4c0-3.3-4-6-9-6Z"/><circle cx="7.5" cy="9" r="1"/><circle cx="10" cy="6.5" r="1"/><circle cx="15" cy="7" r="1"/>',
  vehicle: '<path d="M5 17h14l-1-6-2-3H8l-2 3-1 6ZM7 17v2M17 17v2M7 13h10M8 8l-1-3M16 8l1-3"/><circle cx="8" cy="16" r="1"/><circle cx="16" cy="16" r="1"/>',
  film: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14M17 5v14M3 9h4M3 15h4M17 9h4M17 15h4"/>',
  horror: '<path d="M5 11a7 7 0 0 1 14 0v9l-3-2-2 2-2-2-2 2-2-2-3 2v-9Z"/><circle cx="9" cy="11" r="1"/><circle cx="15" cy="11" r="1"/><path d="M10 15h4"/>',
  comedy: '<circle cx="12" cy="12" r="9"/><path d="M8 10h.01M16 10h.01M8.5 14c1 2 2.1 3 3.5 3s2.5-1 3.5-3"/>',
  documentary: '<path d="M4 5h16v14H4z"/><path d="m10 9 5 3-5 3V9ZM7 2v3M17 2v3"/>',
  animation: '<path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z"/><path d="m4 7 8 4 8-4M12 11v10"/>',
  dance: '<circle cx="14" cy="5" r="2"/><path d="m12 9 3 3 4 1M12 9l-3 4-4 1M15 12l-1 4 3 4M9 13l1 4-3 3"/>',
  sound: '<path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4"/>',
  camera: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="m8 6 1.5-2h5L16 6"/><circle cx="12" cy="12.5" r="3.5"/>',
};

const elements = {
  countryGrid: document.querySelector("#country-grid"),
  contentStep: document.querySelector("#content-step"),
  genreGrid: document.querySelector("#genre-grid"),
  launchButton: document.querySelector("#launch-button"),
  launchLabel: document.querySelector("#launch-label"),
  surpriseButton: document.querySelector("#surprise-button"),
  standardModeButton: document.querySelector("#standard-mode-button"),
  discoveryModeButton: document.querySelector("#discovery-mode-button"),
  modeDescription: document.querySelector("#mode-description"),
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
const initialUrl = new URL(window.location.href);
const requestedCountry = initialUrl.searchParams.get("country");
const requestedGenre = initialUrl.searchParams.get("genre");
const requestedMode = initialUrl.searchParams.get("mode");
const state = {
  countries: [],
  genres: [],
  videos: [],
  selectedCountry: requestedCountry ?? savedState.selectedCountry,
  selectedGenre: requestedGenre ?? (requestedCountry ? null : savedState.selectedGenre),
  mode: requestedMode === "discovery" ? "discovery" : requestedCountry ? "genre" : savedState.mode,
  currentVideo: null,
  saved: savedState,
  errorTimer: null,
  errorStreak: 0,
  locale: "ja",
  t: createTranslator("ja"),
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
    state.countries = catalog.countries;
    state.genres = catalog.genres;
    state.videos = catalog.videos;
    if (!state.countries.some((country) => country.id === state.selectedCountry)) {
      state.selectedCountry = null;
      state.selectedGenre = null;
      state.mode = "genre";
      state.saved.selectedCountry = null;
      state.saved.selectedGenre = null;
      state.saved.mode = "genre";
      storage.write(state.saved);
    }
    if (state.selectedGenre !== "all" && !state.genres.some((genre) => genre.id === state.selectedGenre)) {
      state.selectedGenre = null;
    }
    if (state.mode === "discovery" && !state.selectedGenre) {
      state.selectedGenre = "all";
      state.saved.selectedGenre = "all";
      storage.write(state.saved);
    }
    applyLocale();
    renderCountries();
    renderGenres();
    updateModeSelection();
    updateLaunchButton();
    updateCollectionCounts();
    const sharedVideoId = initialUrl.searchParams.get("v");
    const sharedVideo = state.videos.find((video) => video.id === sharedVideoId);
    if (sharedVideo) {
      const sharedCountry = sharedVideo.countries?.includes(requestedCountry)
        ? requestedCountry
        : sharedVideo.countries?.[0];
      if (sharedCountry) {
        selectCountry(sharedCountry, false);
      }
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
    if (!state.selectedCountry) {
      showToast(state.t("selectCountry"));
      return;
    }
    setMode("genre");
    state.selectedGenre = "all";
    updateGenreSelection();
    updateLaunchButton();
    playNext();
  });
  elements.standardModeButton.addEventListener("click", () => setMode("genre"));
  elements.discoveryModeButton.addEventListener("click", () => setMode("discovery"));
}

function applyLocale() {
  state.locale = localeForCountry(state.selectedCountry);
  state.t = createTranslator(state.locale);
  document.documentElement.lang = state.locale;
  document.title = state.t("title");
  document.querySelector('meta[name="description"]')?.setAttribute("content", state.t("description"));
  document.querySelector('meta[property="og:title"]')?.setAttribute("content", state.t("title"));
  document.querySelector('meta[property="og:description"]')?.setAttribute("content", state.t("description"));
  document.querySelector('meta[name="twitter:title"]')?.setAttribute("content", state.t("title"));
  document.querySelector('meta[name="twitter:description"]')?.setAttribute("content", state.t("description"));

  for (const element of document.querySelectorAll("[data-i18n]")) {
    element.textContent = state.t(element.dataset.i18n);
  }
  for (const element of document.querySelectorAll("[data-i18n-aria-label]")) {
    element.setAttribute("aria-label", state.t(element.dataset.i18nAriaLabel));
  }
  for (const button of elements.countryGrid.querySelectorAll(".country-button")) {
    const country = state.countries.find((item) => item.id === button.dataset.countryId);
    if (country) button.querySelector(".country-name").textContent = countryName(country.code, state.locale, country.name);
  }
  for (const button of elements.genreGrid.querySelectorAll(".genre-button")) {
    const genre = state.genres.find((item) => item.id === button.dataset.genreId);
    if (genre || button.dataset.genreId === "all") {
      button.querySelector("strong").textContent = genreName(button.dataset.genreId, state.locale, genre?.name);
    }
  }
  applyTheme(state.saved.theme);
  if (state.currentVideo) renderCurrentVideo(state.currentVideo);
  if (elements.collectionDialog.open) renderCollection();
}

function updateCountryUrl(resetChoice) {
  const url = new URL(window.location.href);
  url.searchParams.set("country", state.selectedCountry);
  if (resetChoice) {
    url.searchParams.delete("v");
    url.searchParams.delete("genre");
    url.searchParams.delete("mode");
  }
  window.history.replaceState({}, "", url);
}

function updateChoiceUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("v");
  if (state.mode === "discovery") {
    url.searchParams.set("mode", "discovery");
    if (state.selectedGenre && state.selectedGenre !== "all") {
      url.searchParams.set("genre", state.selectedGenre);
    } else {
      url.searchParams.delete("genre");
    }
  } else {
    url.searchParams.delete("mode");
    if (state.selectedGenre && state.selectedGenre !== "all") {
      url.searchParams.set("genre", state.selectedGenre);
    } else {
      url.searchParams.delete("genre");
    }
  }
  window.history.replaceState({}, "", url);
}

function renderCountries() {
  elements.countryGrid.replaceChildren();
  for (const country of state.countries) {
    const button = document.createElement("button");
    button.className = "country-button";
    button.type = "button";
    button.dataset.countryId = country.id;
    button.setAttribute("aria-pressed", String(state.selectedCountry === country.id));

    const code = document.createElement("span");
    code.className = "country-code";
    code.textContent = country.code;
    const name = document.createElement("span");
    name.className = "country-name";
    name.textContent = countryName(country.code, state.locale, country.name);
    button.append(code, name);
    button.addEventListener("click", () => selectCountry(country.id));
    elements.countryGrid.append(button);
  }
}

function renderGenres() {
  elements.genreGrid.replaceChildren();
  const displayedGenres = [
    { id: "all", name: "すべてのジャンル", description: "全ジャンルから選ぶ", color: "#ff5c58", icon: "compass" },
    ...state.genres,
  ];
  for (const genre of displayedGenres) {
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
    name.textContent = genreName(genre.id, state.locale, genre.name);
    const description = document.createElement("small");
    description.textContent = genre.description;
    description.dataset.baseDescription = genre.description;
    copy.append(name, description);
    button.append(symbol, copy);
    button.addEventListener("click", () => selectGenre(genre.id));
    elements.genreGrid.append(button);
  }
  updateGenreAvailability();
}

function selectCountry(countryId, resetChoice = true) {
  if (!state.countries.some((country) => country.id === countryId)) {
    return;
  }

  state.selectedCountry = countryId;
  state.saved.selectedCountry = countryId;
  if (resetChoice) {
    state.mode = "genre";
    state.selectedGenre = null;
    state.saved.mode = "genre";
    state.saved.selectedGenre = null;
  }
  storage.write(state.saved);
  updateCountryUrl(resetChoice);
  applyLocale();
  updateCountrySelection();
  updateModeSelection();
  updateLaunchButton();
}

function selectGenre(genreId) {
  if (!state.selectedCountry) {
    return;
  }
  state.selectedGenre = genreId;
  state.saved.selectedGenre = genreId;
  state.saved.mode = state.mode;
  storage.write(state.saved);
  updateChoiceUrl();
  updateModeSelection();
  updateGenreSelection();
  updateLaunchButton();
}

function setMode(mode) {
  if (!state.selectedCountry) {
    return;
  }
  state.mode = mode === "discovery" ? "discovery" : "genre";
  if (state.mode === "discovery" && !state.selectedGenre) {
    state.selectedGenre = "all";
    state.saved.selectedGenre = "all";
  }
  state.saved.mode = state.mode;
  storage.write(state.saved);
  updateChoiceUrl();
  updateModeSelection();
  updateGenreSelection();
  updateLaunchButton();
}

function updateModeSelection() {
  const hasCountry = Boolean(state.selectedCountry);
  const isDiscovery = hasCountry && state.mode === "discovery";
  elements.standardModeButton.setAttribute("aria-pressed", String(!isDiscovery));
  elements.discoveryModeButton.setAttribute("aria-pressed", String(isDiscovery));
  elements.standardModeButton.disabled = !hasCountry;
  elements.discoveryModeButton.disabled = !hasCountry;
  elements.surpriseButton.disabled = !hasCountry;
  elements.contentStep.dataset.disabled = String(!hasCountry);
  elements.contentStep.inert = !hasCountry;
  elements.genreGrid.dataset.inactive = "false";
  elements.modeDescription.textContent = !hasCountry
    ? state.t("selectCountry")
    : isDiscovery
      ? state.t("discoveryDescription")
      : state.t("genreDescription");
  updateGenreAvailability();
  updateGenreSelection();
}

function updateCountrySelection() {
  for (const button of elements.countryGrid.querySelectorAll(".country-button")) {
    button.setAttribute("aria-pressed", String(button.dataset.countryId === state.selectedCountry));
  }
}

function updateGenreAvailability() {
  const buttons = [...elements.genreGrid.querySelectorAll(".genre-button")];
  for (const button of buttons) {
    const count = state.selectedCountry
      ? getEligibleVideos(state.videos, button.dataset.genreId, state.selectedCountry).length
      : 0;
    button.disabled = !state.selectedCountry || count === 0;
    const description = button.querySelector("small");
    if (description) {
      description.textContent = state.selectedCountry
        ? count > 0
          ? state.t("videoCount", { count })
          : state.t("unavailable")
        : description.dataset.baseDescription;
    }
  }

  if (state.selectedCountry) {
    buttons.sort((left, right) => Number(left.disabled) - Number(right.disabled));
    elements.genreGrid.append(...buttons);
  }
}

function updateGenreSelection() {
  for (const button of elements.genreGrid.querySelectorAll(".genre-button")) {
    button.setAttribute("aria-pressed", String(button.dataset.genreId === state.selectedGenre));
  }
}

function updateLaunchButton() {
  const genre = state.genres.find((item) => item.id === state.selectedGenre);
  if (!state.selectedCountry) {
    elements.launchButton.disabled = true;
    elements.launchLabel.textContent = state.t("selectCountryButton");
    return;
  }
  if (state.mode === "discovery") {
    elements.launchButton.disabled = getEligibleVideos(state.videos, state.selectedGenre ?? "all", state.selectedCountry).length === 0;
    elements.launchLabel.textContent = state.t("launchDiscovery");
    return;
  }
  const candidateCount = state.selectedGenre
    ? getEligibleVideos(state.videos, state.selectedGenre, state.selectedCountry).length
    : 0;
  elements.launchButton.disabled = !state.selectedGenre || candidateCount === 0;
  elements.launchLabel.textContent = state.selectedGenre === "all"
    ? state.t("launchSurprise")
    : genre
      ? state.t("launchGenre", { genre: genreName(genre.id, state.locale, genre.name) })
      : state.t("chooseGenre");
}

async function playNext() {
  if (!state.selectedCountry || (state.mode === "genre" && !state.selectedGenre) || state.videos.length === 0) {
    return;
  }

  clearTimeout(state.errorTimer);
  state.errorTimer = null;
  elements.playerError.hidden = true;
  const video = state.mode === "discovery"
    ? pickDiscoveryVideo(state.videos, {
      genreId: state.selectedGenre ?? "all",
      countryId: state.selectedCountry,
      historyIds: state.saved.history,
      recentIds: state.saved.recentIds,
      currentGenre: state.currentVideo?.genre ?? null,
    })
    : pickRandomVideo(state.videos, {
      genreId: state.selectedGenre,
      countryId: state.selectedCountry,
      recentIds: state.saved.recentIds,
    });

  if (!video) {
    showToast(state.t("noVideos"));
    return;
  }

  await playVideo(video);
}

async function playVideo(video) {
  state.currentVideo = video;
  state.saved.recentIds = pushRecentId(state.saved.recentIds, video.id);
  state.saved.history = pushRecentId(state.saved.history, video.id, 200);
  state.saved.selectedCountry = state.selectedCountry;
  state.saved.selectedGenre = state.selectedGenre;
  state.saved.mode = state.mode;
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
  const country = state.countries.find((item) => item.id === state.selectedCountry);
  elements.videoGenre.textContent = [
    country ? countryName(country.code, state.locale, country.name) : null,
    genre ? genreName(genre.id, state.locale, genre.name) : state.t("genreFallback"),
  ].filter(Boolean).join(" / ");
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
  elements.favoriteButton.setAttribute("aria-label", isFavorite ? state.t("removeFavoriteAria") : state.t("addFavoriteAria"));
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
  showToast(isFavorite ? state.t("removedFavorite") : state.t("addedFavorite"));
}

async function shareCurrentVideo() {
  if (!state.currentVideo) {
    return;
  }

  const shareData = {
    title: `${state.currentVideo.title} | TobeTube`,
    text: state.t("shareText"),
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
    showToast(state.t("copied"));
  } catch {
    showToast(state.t("copyFailed"));
  }
}

function updateShareUrl(video) {
  const url = new URL(window.location.href);
  url.searchParams.set("v", video.id);
  if (state.selectedCountry) {
    url.searchParams.set("country", state.selectedCountry);
  }
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
  renderVideoList(elements.favoritesPanel, state.saved.favorites, state.t("emptyFavorites"), true);
  renderVideoList(elements.historyPanel, state.saved.history, state.t("emptyHistory"), false);
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
      removeButton.setAttribute("aria-label", state.t("removeFavorite", { title: video.title }));
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
  const countryId = video.countries?.includes(state.selectedCountry)
    ? state.selectedCountry
    : video.countries?.[0];
  if (countryId) {
    selectCountry(countryId, false);
  }
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
  showToast(nextTheme === "dark" ? state.t("darkEnabled") : state.t("lightEnabled"));
}

function applyTheme(theme) {
  const systemDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
  const effectiveTheme = theme === "system" ? (systemDark ? "dark" : "light") : theme;
  document.documentElement.dataset.theme = effectiveTheme;
  elements.themeButton.setAttribute("aria-label", effectiveTheme === "dark" ? state.t("themeLight") : state.t("themeDark"));
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
  elements.countryGrid.replaceChildren();
  elements.genreGrid.replaceChildren();
  const message = document.createElement("p");
  message.className = "collection-empty";
  message.textContent = state.t("dataError");
  elements.countryGrid.append(message);
  elements.launchButton.disabled = true;
  elements.surpriseButton.disabled = true;
  elements.standardModeButton.disabled = true;
  elements.discoveryModeButton.disabled = true;
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
