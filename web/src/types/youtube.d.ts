// YouTube IFrame API type declarations
// These are needed because the YouTube API loads dynamically

declare namespace YT {
  enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5,
  }

  interface PlayerOptions {
    videoId?: string;
    width?: number | string;
    height?: number | string;
    playerVars?: {
      autoplay?: 0 | 1;
      controls?: 0 | 1;
      modestbranding?: 0 | 1;
      rel?: 0 | 1;
      playsinline?: 0 | 1;
      origin?: string;
      start?: number;
    };
    events?: {
      onReady?: (event: PlayerEvent) => void;
      onStateChange?: (event: OnStateChangeEvent) => void;
      onError?: (event: OnErrorEvent) => void;
    };
  }

  interface PlayerEvent {
    target: Player;
  }

  interface OnStateChangeEvent {
    data: PlayerState;
    target: Player;
  }

  interface OnErrorEvent {
    data: number;
    target: Player;
  }

  class Player {
    constructor(elementId: string | HTMLElement, options: PlayerOptions);
    playVideo(): void;
    pauseVideo(): void;
    stopVideo(): void;
    seekTo(seconds: number, allowSeekAhead?: boolean): void;
    destroy(): void;
    getPlayerState(): PlayerState;
    getCurrentTime(): number;
    getDuration(): number;
    getVolume(): number;
    setVolume(volume: number): void;
    mute(): void;
    unMute(): void;
    isMuted(): boolean;
  }
}
