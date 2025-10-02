export class Renderer {
  #root;
  #player;
  #elements = {};

  constructor(root, player) {
    this.#root = root;
    this.#player = player;
    this.#init();
    this.#setupEventListeners();
  }

  #init() {
    this.#root.innerHTML = '';
    
    // Основной контейнер
    const container = document.createElement('div');
    container.className = 'audio-player';
    
    // Элементы управления
    const controls = this.#createControls();
    const progress = this.#createProgressBar();
    const volume = this.#createVolumeControl();
    const playlist = this.#createPlaylist();
    const strategy = this.#createStrategyControls();

    container.appendChild(controls);
    container.appendChild(progress);
    container.appendChild(volume);
    container.appendChild(strategy);
    container.appendChild(playlist);

    this.#root.appendChild(container);

    this.#elements = {
      playPauseBtn: container.querySelector('.play-pause'),
      prevBtn: container.querySelector('.prev'),
      nextBtn: container.querySelector('.next'),
      progressBar: container.querySelector('.progress-bar'),
      progressFill: container.querySelector('.progress-fill'),
      currentTime: container.querySelector('.current-time'),
      duration: container.querySelector('.duration'),
      volumeSlider: container.querySelector('.volume-slider'),
      volumeFill: container.querySelector('.volume-fill'),
      muteBtn: container.querySelector('.mute'),
      playlist: container.querySelector('.playlist'),
      strategyBtns: container.querySelectorAll('.strategy-btn')
    };
  }

  #createControls() {
    const controls = document.createElement('div');
    controls.className = 'controls';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'control-btn prev';
    prevBtn.textContent = '⏮';

    const playPauseBtn = document.createElement('button');
    playPauseBtn.className = 'control-btn play-pause';
    playPauseBtn.textContent = '▶';

    const nextBtn = document.createElement('button');
    nextBtn.className = 'control-btn next';
    nextBtn.textContent = '⏭';

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
      strategyContainer.appendChild(btn);
    });

    return strategyContainer;
  }

  #createPlaylist() {
    const playlist = document.createElement('div');
    playlist.className = 'playlist';

    this.#player.playlist.tracks.forEach((track, index) => {
      const trackElement = document.createElement('div');
      trackElement.className = 'track';
      trackElement.dataset.trackId = track.id;
      
      const trackInfo = document.createElement('span');
      trackInfo.className = 'track-info';
      trackInfo.textContent = `${track.title} - ${track.artist}`;

      trackElement.appendChild(trackInfo);
      playlist.appendChild(trackElement);
    });

    return playlist;
  }

  #setupEventListeners() {
    // Кнопки управления
    this.#elements.playPauseBtn.addEventListener('click', () => {
      this.#player.togglePlay();
    });

    this.#elements.prevBtn.addEventListener('click', () => {
      this.#player.previous();
    });

    this.#elements.nextBtn.addEventListener('click', () => {
      this.#player.next();
    });

    // Прогресс бар
    this.#elements.progressBar.addEventListener('click', (e) => {
      const rect = this.#elements.progressBar.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      this.#player.seek(percent * (this.#player.currentTrack?.duration || 0));
    });

    // Громкость
    this.#elements.volumeSlider.addEventListener('click', (e) => {
      const rect = this.#elements.volumeSlider.getBoundingClientRect();
      const volume = (e.clientX - rect.left) / rect.width;
      this.#player.setVolume(volume);
    });

    this.#elements.muteBtn.addEventListener('click', () => {
      this.#player.toggleMute();
    });

    // Плейлист
    this.#elements.playlist.addEventListener('click', (e) => {
      const trackElement = e.target.closest('.track');
      if (trackElement) {
        this.#player.selectTrack(trackElement.dataset.trackId);
      }
    });

    // Подписка на события плеера
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
  }

  #updatePlayButton(isPlaying) {
    this.#elements.playPauseBtn.textContent = isPlaying ? '⏸' : '▶';
  }

  #updateTrackInfo(track) {
    if (track) {
      const minutes = Math.floor(track.duration / 60);
      const seconds = Math.floor(track.duration % 60);
      this.#elements.duration.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  #updateProgress(currentTime, duration) {
    if (duration) {
      const percent = (currentTime / duration) * 100;
      this.#elements.progressFill.style.width = `${percent}%`;
      
      const currentMinutes = Math.floor(currentTime / 60);
      const currentSeconds = Math.floor(currentTime % 60);
      this.#elements.currentTime.textContent = 
        `${currentMinutes}:${currentSeconds.toString().padStart(2, '0')}`;
    }
  }

  #updateVolume(volume, isMuted) {
    this.#elements.volumeFill.style.width = `${volume * 100}%`;
    this.#elements.muteBtn.textContent = isMuted ? '🔇' : '🔊';
  }

  #highlightCurrentTrack() {
    const tracks = this.#elements.playlist.querySelectorAll('.track');
    tracks.forEach(track => track.classList.remove('active'));
    
    const currentTrack = this.#elements.playlist.querySelector(
      `[data-track-id="${this.#player.currentTrack?.id}"]`
    );
    if (currentTrack) {
      currentTrack.classList.add('active');
    }
  }

  #updateStrategyButtons(activeStrategy) {
    this.#elements.strategyBtns.forEach(btn => {
      btn.classList.toggle('active', btn.textContent.toLowerCase().includes(activeStrategy));
    });
  }
}