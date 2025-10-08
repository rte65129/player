import { SequentialStrategy } from '../strategies/SequentialStrategy.js';
import { ShuffleStrategy } from '../strategies/ShuffleStrategy.js';
import { RepeatOneStrategy } from '../strategies/RepeatOneStrategy.js';

export class Renderer {
  #root;
  #player;
  #elements = {};
  #hasUserInteracted = false;

  constructor(root, player) {
    this.#root = root;
    this.#player = player;
    this.#init();
    this.#setupEventListeners();
    
    // Обработчик первого пользовательского взаимодействия
    const enablePlayback = () => {
      this.#hasUserInteracted = true;
      this.#elements.interactionMessage.style.display = 'none';
      document.removeEventListener('click', enablePlayback);
      document.removeEventListener('keydown', enablePlayback);
    };
    document.addEventListener('click', enablePlayback);
    document.addEventListener('keydown', enablePlayback);
  }

  #init() {
    this.#root.innerHTML = '';
    
    const container = document.createElement('div');
    container.className = 'audio-player';
    
    // Сообщение о необходимости взаимодействия
    const interactionMessage = document.createElement('div');
    interactionMessage.className = 'interaction-message';
    interactionMessage.textContent = 'Click anywhere to enable audio playback';
    
    // Основные элементы управления
    const controls = this.#createControls();
    const progress = this.#createProgressBar();
    const volume = this.#createVolumeControl();
    const strategy = this.#createStrategyControls();
    const playlist = this.#createPlaylist();

    container.appendChild(interactionMessage);
    container.appendChild(controls);
    container.appendChild(progress);
    container.appendChild(volume);
    container.appendChild(strategy);
    container.appendChild(playlist);

    this.#root.appendChild(container);

    // Сохраняем ссылки на все элементы
    this.#elements = {
      container,
      interactionMessage,
      playPauseBtn: container.querySelector('.play-pause'),
      prevBtn: container.querySelector('.prev'),
      nextBtn: container.querySelector('.next'),
      progressBar: container.querySelector('.progress-bar'),
      progressFill: container.querySelector('.progress-fill'),
      currentTime: container.querySelector('.current-time'),
      duration: container.querySelector('.duration'),
      volumeBar: container.querySelector('.volume-bar'),
      volumeFill: container.querySelector('.volume-fill'),
      muteBtn: container.querySelector('.mute'),
      playlist: container.querySelector('.playlist'),
      strategyBtns: container.querySelectorAll('.strategy-btn')
    };

    // Инициализируем начальное состояние
    this.#updatePlayButton(this.#player.isPlaying);
    this.#updateVolume(this.#player.volume, this.#player.isMuted);
    this.#highlightCurrentTrack();
    this.#updateStrategyButtons(this.#player.strategy.name);
  }

  #createControls() {
    const controls = document.createElement('div');
    controls.className = 'controls';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'control-btn prev';
    prevBtn.textContent = '⏮';
    prevBtn.title = 'Previous track';

    const playPauseBtn = document.createElement('button');
    playPauseBtn.className = 'control-btn play-pause';
    playPauseBtn.textContent = '▶';
    playPauseBtn.title = 'Play/Pause';

    const nextBtn = document.createElement('button');
    nextBtn.className = 'control-btn next';
    nextBtn.textContent = '⏭';
    nextBtn.title = 'Next track';

    controls.appendChild(prevBtn);
    controls.appendChild(playPauseBtn);
    controls.appendChild(nextBtn);

    return controls;
  }

  #createProgressBar() {
    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-container';

    const timeDisplay = document.createElement('div');
    timeDisplay.className = 'time-display';

    const currentTime = document.createElement('span');
    currentTime.className = 'current-time';
    currentTime.textContent = '0:00';

    const duration = document.createElement('span');
    duration.className = 'duration';
    duration.textContent = '0:00';

    timeDisplay.appendChild(currentTime);
    timeDisplay.appendChild(document.createTextNode(' / '));
    timeDisplay.appendChild(duration);

    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';

    const progressFill = document.createElement('div');
    progressFill.className = 'progress-fill';

    progressBar.appendChild(progressFill);

    progressContainer.appendChild(timeDisplay);
    progressContainer.appendChild(progressBar);

    return progressContainer;
  }

  #createVolumeControl() {
    const volumeContainer = document.createElement('div');
    volumeContainer.className = 'volume-container';

    const muteBtn = document.createElement('button');
    muteBtn.className = 'control-btn mute';
    muteBtn.textContent = '🔊';
    muteBtn.title = 'Mute/Unmute';

    const volumeBar = document.createElement('div');
    volumeBar.className = 'volume-bar';

    const volumeFill = document.createElement('div');
    volumeFill.className = 'volume-fill';

    volumeBar.appendChild(volumeFill);

    volumeContainer.appendChild(muteBtn);
    volumeContainer.appendChild(volumeBar);

    return volumeContainer;
  }

  #createStrategyControls() {
    const strategyContainer = document.createElement('div');
    strategyContainer.className = 'strategy-container';

    const strategies = [
      { name: 'sequential', label: 'Sequential' },
      { name: 'shuffle', label: 'Shuffle' },
      { name: 'repeat-one', label: 'Repeat One' }
    ];

    strategies.forEach(strategy => {
      const btn = document.createElement('button');
      btn.className = `strategy-btn ${strategy.name}`;
      btn.textContent = strategy.label;
      btn.dataset.strategy = strategy.name;
      btn.title = `${strategy.label} playback`;
      strategyContainer.appendChild(btn);
    });

    return strategyContainer;
  }

  #createPlaylist() {
    const playlistContainer = document.createElement('div');
    playlistContainer.className = 'playlist-container';

    const playlistTitle = document.createElement('h3');
    playlistTitle.className = 'playlist-title';
    playlistTitle.textContent = 'Playlist';
    playlistContainer.appendChild(playlistTitle);

    const playlist = document.createElement('div');
    playlist.className = 'playlist';

    if (this.#player.playlist.tracks.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-playlist';
      emptyMessage.textContent = 'No tracks in playlist';
      playlist.appendChild(emptyMessage);
    } else {
      this.#player.playlist.tracks.forEach((track) => {
        const trackElement = document.createElement('div');
        trackElement.className = 'track';
        trackElement.dataset.trackId = track.id;
        
        const trackInfo = document.createElement('span');
        trackInfo.className = 'track-info';
        trackInfo.textContent = `${track.title} - ${track.artist}`;

        trackElement.appendChild(trackInfo);
        playlist.appendChild(trackElement);
      });
    }

    playlistContainer.appendChild(playlist);
    return playlistContainer;
  }
  // Система событий
  #setupEventListeners() {
    // Кнопки управления
    this.#elements.playPauseBtn.addEventListener('click', () => {
      if (!this.#hasUserInteracted) {
        this.#showInteractionMessage();
        return;
      }
      this.#player.togglePlay();
    });

    this.#elements.prevBtn.addEventListener('click', () => {
      if (!this.#hasUserInteracted) {
        this.#showInteractionMessage();
        return;
      }
      this.#player.previous();
    });

    this.#elements.nextBtn.addEventListener('click', () => {
      if (!this.#hasUserInteracted) {
        this.#showInteractionMessage();
        return;
      }
      this.#player.next();
    });

    // Прогресс бар
    this.#elements.progressBar.addEventListener('click', (e) => {
      if (!this.#hasUserInteracted) return;
      
      const rect = this.#elements.progressBar.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const duration = this.#player.currentTrack?.duration || 0;
      this.#player.seek(percent * duration);
    });

    // Громкость
    this.#elements.volumeBar.addEventListener('click', (e) => {
      const rect = this.#elements.volumeBar.getBoundingClientRect();
      const volume = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      this.#player.setVolume(volume);
    });

    this.#elements.muteBtn.addEventListener('click', () => {
      this.#player.toggleMute();
    });

    // Стратегии
    this.#elements.strategyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const strategyName = btn.dataset.strategy;
        switch(strategyName) {
          case 'shuffle':
            this.#player.setStrategy(new ShuffleStrategy());
            break;
          case 'repeat-one':
            this.#player.setStrategy(new RepeatOneStrategy());
            break;
          default:
            this.#player.setStrategy(new SequentialStrategy());
        }
      });
    });

    // Плейлист
    this.#elements.playlist.addEventListener('click', (e) => {
      if (!this.#hasUserInteracted) {
        this.#showInteractionMessage();
        return;
      }
      
      const trackElement = e.target.closest('.track');
      if (trackElement) {
        this.#player.selectTrack(trackElement.dataset.trackId);
      }
    });

    // События плеера
    this.#setupPlayerEventListeners();
  }

  #setupPlayerEventListeners() {
    this.#player.addEventListener('playstatechange', (e) => {
      this.#updatePlayButton(e.detail.isPlaying);
    });

    this.#player.addEventListener('trackchange', (e) => {
      this.#updateTrackInfo(e.detail.track);
      this.#highlightCurrentTrack();
    });

    this.#player.addEventListener('timeupdate', (e) => {
      this.#updateProgress(e.detail.currentTime, e.detail.duration);
    });

    this.#player.addEventListener('volumechange', (e) => {
      this.#updateVolume(e.detail.volume, e.detail.isMuted);
    });

    this.#player.addEventListener('strategychange', (e) => {
      this.#updateStrategyButtons(e.detail.strategy);
    });

    this.#player.addEventListener('durationchange', (e) => {
      if (this.#player.currentTrack) {
        this.#player.currentTrack.duration = e.detail.duration;
        this.#updateTrackInfo(this.#player.currentTrack);
      }
    });

    this.#player.addEventListener('userinteractionrequired', () => {
      this.#showInteractionMessage();
    });

    this.#player.addEventListener('error', (e) => {
      console.error('Player error:', e.detail.error);
      this.#showErrorMessage('Failed to play audio. Please check the file URL and CORS settings.');
    });

    this.#player.addEventListener('loadstart', () => {
      this.#showLoadingState();
    });
  }

  #updatePlayButton(isPlaying) {
    if (this.#elements.playPauseBtn) {
      this.#elements.playPauseBtn.textContent = isPlaying ? '⏸' : '▶';
      this.#elements.playPauseBtn.title = isPlaying ? 'Pause' : 'Play';
    }
  }

  #updateTrackInfo(track) {
    if (!this.#elements.duration) return;
    
    if (track && track.duration) {
      const minutes = Math.floor(track.duration / 60);
      const seconds = Math.floor(track.duration % 60);
      this.#elements.duration.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } else {
      this.#elements.duration.textContent = '0:00';
    }
  }

  #updateProgress(currentTime, duration) {
    if (!this.#elements.progressFill || !this.#elements.currentTime) return;
    
    if (duration && duration > 0) {
      const percent = (currentTime / duration) * 100;
      this.#elements.progressFill.style.width = `${percent}%`;
      
      const currentMinutes = Math.floor(currentTime / 60);
      const currentSeconds = Math.floor(currentTime % 60);
      this.#elements.currentTime.textContent = 
        `${currentMinutes}:${currentSeconds.toString().padStart(2, '0')}`;
    } else {
      this.#elements.progressFill.style.width = '0%';
      this.#elements.currentTime.textContent = '0:00';
    }
  }

  #updateVolume(volume, isMuted) {
    if (!this.#elements.volumeFill || !this.#elements.muteBtn) return;
    
    this.#elements.volumeFill.style.width = `${volume * 100}%`;
    this.#elements.muteBtn.textContent = isMuted ? '🔇' : '🔊';
    this.#elements.muteBtn.title = isMuted ? 'Unmute' : 'Mute';
  }

  #highlightCurrentTrack() {
    if (!this.#elements.playlist) return;
    
    const tracks = this.#elements.playlist.querySelectorAll('.track');
    tracks.forEach(track => track.classList.remove('active'));
    
    const currentTrackElement = this.#elements.playlist.querySelector(
      `[data-track-id="${this.#player.currentTrack?.id}"]`
    );
    if (currentTrackElement) {
      currentTrackElement.classList.add('active');
    }
  }

  #updateStrategyButtons(activeStrategy) {
    if (!this.#elements.strategyBtns) return;
    
    this.#elements.strategyBtns.forEach(btn => {
      const isActive = btn.dataset.strategy === activeStrategy;
      btn.classList.toggle('active', isActive);
    });
  }

  #showInteractionMessage() {
    if (this.#elements.interactionMessage) {
      this.#elements.interactionMessage.style.display = 'block';
    }
  }

  #showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    this.#elements.container.insertBefore(errorDiv, this.#elements.container.firstChild);
    
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 5000);
  }

  #showLoadingState() {
    if (this.#elements.currentTime) {
      this.#elements.currentTime.textContent = 'Loading...';
    }
  }
}