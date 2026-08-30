let apiPromise;

export function loadYouTubeApi(targetWindow = window, targetDocument = document) {
  if (targetWindow.YT?.Player) {
    return Promise.resolve(targetWindow.YT);
  }
  if (apiPromise) {
    return apiPromise;
  }

  apiPromise = new Promise((resolve, reject) => {
    const previousReady = targetWindow.onYouTubeIframeAPIReady;
    targetWindow.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      resolve(targetWindow.YT);
    };

    const existingScript = targetDocument.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (existingScript) {
      existingScript.addEventListener("error", () => reject(new Error("YouTubeプレイヤーを読み込めませんでした。")), { once: true });
      return;
    }

    const script = targetDocument.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.addEventListener("error", () => reject(new Error("YouTubeプレイヤーを読み込めませんでした。")), { once: true });
    targetDocument.head.append(script);
  });

  return apiPromise;
}

export class YouTubePlayerController {
  constructor(elementId, { onReady, onError, onStateChange } = {}) {
    this.elementId = elementId;
    this.onReady = onReady;
    this.onError = onError;
    this.onStateChange = onStateChange;
    this.player = null;
    this.pendingVideoId = null;
  }

  async load(videoId) {
    this.pendingVideoId = videoId;

    if (this.player?.loadVideoById) {
      this.player.loadVideoById(videoId);
      return;
    }

    const YT = await loadYouTubeApi();
    const initialVideoId = this.pendingVideoId;
    this.player = new YT.Player(this.elementId, {
      host: "https://www.youtube-nocookie.com",
      videoId: initialVideoId,
      playerVars: {
        autoplay: 1,
        playsinline: 1,
        rel: 0,
        modestbranding: 1,
      },
      events: {
        onReady: (event) => {
          if (this.pendingVideoId !== initialVideoId) {
            event.target.loadVideoById(this.pendingVideoId);
          } else {
            event.target.playVideo();
          }
          this.onReady?.(event);
        },
        onError: (event) => this.onError?.(event.data),
        onStateChange: (event) => this.onStateChange?.(event.data),
      },
    });
  }
}
