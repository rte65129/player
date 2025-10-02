export class AudioPlayer extends EventTarget {
  #audio;
  #playlist;
  #strategy;
  #isPlaying = false;
  #volume = 1;
  #isMuted = false;

  constructor({ playlist, strategy }) {
    super();
    this.#audio = new Audio();
    this.#playlist = playlist;
    this.#strategy = strategy;

    this.#setupAudioEvents();
  }

  #setupAudioEvents() {
    this.#audio.addEventListener('loadedmetadata', () => {
      if (this.currentTrack) {
        this.currentTrack.duration = this.#audio.duration;
      }
    });

    this.#audio.addEventListener('timeupdate', () => {
      this.dispatchEvent(new CustomEvent('timeupdate', {
        detail: {
          currentTime: this.#audio.currentTime,
          duration: this.#audio.duration
        }
      }));
    });

    this.#audio.addEventListener('ended', () => {
      this.next();
    });

    this.#audio.addEventListener('play', () => {
      this.#isPlaying = true;
      this.dispatchEvent(new CustomEvent('playstatechange', {
        detail: { isPlaying: true }
      }));
    });

    this.#audio.addEventListener('pause', () => {
      this.#isPlaying = false;
      this.dispatchEvent(new CustomEvent('playstatechange', {
        detail: { isPlaying: false }
      }));
    });
  }

  get currentTrack() { return this.#playlist.current; }
  get playlist() { return this.#playlist; }
  get strategy() { return this.#strategy; }
  get isPlaying() { return this.#isPlaying; }
  get volume() { return this.#volume; }
  get isMuted() { return this.#isMuted; }

  async play() {
    if (!this.currentTrack) return;
    
    this.#audio.src = this.currentTrack.url;
    try {
      await this.#audio.play();
      this.dispatchEvent(new CustomEvent('trackchange', {
        detail: { track: this.currentTrack }
      }));
    } catch (error) {
      console.error('Play failed:', error);
    }
  }

  pause() {
    this.#audio.pause();
  }

  togglePlay() {
    if (this.#isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  next() {
    const track = this.#strategy.nextTrack(this.#playlist);
    if (track) {
      this.dispatchEvent(new CustomEvent('trackchange', {
        detail: { track }
      }));
      if (this.#isPlaying) {
        this.play();
      }
    }
  }

  previous() {
    const track = this.#strategy.previousTrack(this.#playlist);
    if (track) {
      this.dispatchEvent(new CustomEvent('trackchange', {
        detail: { track }
      }));
      if (this.#isPlaying) {
        this.play();
      }
    }
  }

  setStrategy(strategy) {
    this.#strategy = strategy;
    this.dispatchEvent(new CustomEvent('strategychange', {
      detail: { strategy: strategy.name }
    }));
  }

  seek(time) {
    if (this.#audio.duration) {
      this.#audio.currentTime = Math.max(0, Math.min(time, this.#audio.duration));
    }
  }

  setVolume(volume) {
    this.#volume = Math.max(0, Math.min(1, volume));
    this.#audio.volume = this.#volume;
    this.dispatchEvent(new CustomEvent('volumechange', {
      detail: { volume: this.#volume, isMuted: this.#isMuted }
    }));
  }

  toggleMute() {
    this.#isMuted = !this.#isMuted;
    this.#audio.muted = this.#isMuted;
    this.dispatchEvent(new CustomEvent('volumechange', {
      detail: { volume: this.#volume, isMuted: this.#isMuted }
    }));
  }

  selectTrack(trackId) {
    this.#playlist.setCurrentById(trackId);
    this.dispatchEvent(new CustomEvent('trackchange', {
      detail: { track: this.currentTrack }
    }));
    if (this.#isPlaying) {
      this.play();
    }
  }
}