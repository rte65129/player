export class AudioPlayer extends EventTarget {
  #audio;
  #playlist;
  #strategy;
  #isPlaying = false;
  #volume = 1;
  #isMuted = false;
  #currentTrackLoadPromise = null;

  constructor({ playlist, strategy }) {
    // Инициализация и события
    super();
    this.#audio = new Audio();
    this.#playlist = playlist;
    this.#strategy = strategy;

    this.#setupAudioEvents();
  }
  // Система событий 
  #setupAudioEvents() {
    this.#audio.addEventListener('loadedmetadata', () => {
      if (this.currentTrack) {
        this.currentTrack.duration = this.#audio.duration;
        this.dispatchEvent(new CustomEvent('durationchange', {
          detail: { duration: this.#audio.duration }
        }));
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

    this.#audio.addEventListener('error', (e) => {
      console.error('Audio error:', e, this.#audio.error);
      this.dispatchEvent(new CustomEvent('error', {
        detail: { error: this.#audio.error }
      }));
    });

    this.#audio.addEventListener('loadstart', () => {
      this.dispatchEvent(new CustomEvent('loadstart'));
    });

    this.#audio.addEventListener('canplay', () => {
      this.dispatchEvent(new CustomEvent('canplay'));
    });
  }

  get currentTrack() { return this.#playlist.current; }
  get playlist() { return this.#playlist; }
  get strategy() { return this.#strategy; }
  get isPlaying() { return this.#isPlaying; }
  get volume() { return this.#volume; }
  get isMuted() { return this.#isMuted; }
  // Загрузка треков
  async #loadTrack(track) {
    if (!track) return Promise.reject(new Error('No track provided'));

    // Сбрасываем текущее состояние
    this.#audio.pause();
    this.#audio.src = '';
    this.#audio.load();

    return new Promise((resolve, reject) => {
      const onCanPlay = () => {
        cleanup();
        resolve();
      };

      const onError = () => {
        cleanup();
        reject(new Error(`Failed to load track: ${track.title}`));
      };

      const cleanup = () => {
        this.#audio.removeEventListener('canplay', onCanPlay);
        this.#audio.removeEventListener('error', onError);
      };

      this.#audio.addEventListener('canplay', onCanPlay);
      this.#audio.addEventListener('error', onError);

      try {
        this.#audio.src = track.url;
        this.#audio.load();
        
        // Таймаут на загрузку
        setTimeout(() => {
          if (this.#audio.readyState < 2) { // HAVE_CURRENT_DATA
            cleanup();
            reject(new Error('Track loading timeout'));
          }
        }, 10000);
      } catch (error) {
        cleanup();
        reject(error);
      }
    });
  }
  // Управление воспроизведением
  async play() {
    if (!this.currentTrack) {
      console.warn('No current track to play');
      return;
    }
    
    try {
      // Загружаем трек если нужно
      if (this.#audio.src !== this.currentTrack.url || this.#audio.readyState === 0) {
        await this.#loadTrack(this.currentTrack);
      }
      
      await this.#audio.play();
      
    } catch (error) {
      console.error('Play failed:', error);
      if (error.name === 'NotAllowedError') {
        this.dispatchEvent(new CustomEvent('userinteractionrequired'));
      } else {
        this.dispatchEvent(new CustomEvent('error', {
          detail: { error }
        }));
      }
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
  // Стратегии воспроизведения
  async next() {
    const track = this.#strategy.nextTrack(this.#playlist);
    if (track) {
      try {
        await this.#loadTrack(track);
        this.dispatchEvent(new CustomEvent('trackchange', {
          detail: { track }
        }));
        if (this.#isPlaying) {
          await this.play();
        }
      } catch (error) {
        console.error('Failed to load next track:', error);
        this.dispatchEvent(new CustomEvent('error', {
          detail: { error }
        }));
      }
    }
  }

  async previous() {
    const track = this.#strategy.previousTrack(this.#playlist);
    if (track) {
      try {
        await this.#loadTrack(track);
        this.dispatchEvent(new CustomEvent('trackchange', {
          detail: { track }
        }));
        if (this.#isPlaying) {
          await this.play();
        }
      } catch (error) {
        console.error('Failed to load previous track:', error);
        this.dispatchEvent(new CustomEvent('error', {
          detail: { error }
        }));
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
    if (this.#audio.duration && !isNaN(time)) {
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

  async selectTrack(trackId) {
    const wasPlaying = this.#isPlaying;
    
    if (wasPlaying) {
      this.pause();
    }
    
    this.#playlist.setCurrentById(trackId);
    
    try {
      await this.#loadTrack(this.currentTrack);
      this.dispatchEvent(new CustomEvent('trackchange', {
        detail: { track: this.currentTrack }
      }));
      
      if (wasPlaying) {
        await this.play();
      }
    } catch (error) {
      console.error('Failed to select track:', error);
      this.dispatchEvent(new CustomEvent('error', {
        detail: { error }
      }));
    }
  }
}