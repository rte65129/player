// Импортируем необходимые классы: плейлист, трек, аудиоплеер, стратегии воспроизведения и рендерер UI
const { Playlist } = require ( './models/Playlist.js')
const { Track } = require ( './models/Track.js')
const { AudioPlayer } = require ( './core/AudioPlayer.js')
const { SequentialStrategy } = require ( './strategies/SequentialStrategy.js')
const { ShuffleStrategy } = require ( './strategies/ShuffleStrategy.js')
const { RepeatOneStrategy } = require ( './strategies/RepeatOneStrategy.js')
const { Renderer } = require ( './ui/Renderer.js')

// Ключ для хранения состояния плеера в localStorage
const STORAGE_KEY = 'audio-player-oop:state'

// Загружает сохранённое состояние плеера из localStorage (текущий трек, стратегия)
function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {}
  } catch {
    return {}
  }
}

// Сохраняет состояние плеера в localStorage
function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

// Возвращает экземпляр стратегии воспроизведения по её имени
function strategyFromName(name) {
  switch (name) {
    case 'shuffle':
      return new ShuffleStrategy()
    case 'repeat-one':
      return new RepeatOneStrategy()
    default:
      return new SequentialStrategy()
  }
}

// Демо-треки для плейлиста (можно заменить на свои)
const demoTracks = [
  new Track({
    id: '1',
    title: 'Scott Joplin - Maple Leaf Rag (demo)',
    artist: 'Scott Joplin',
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_3b5bbf0f76.mp3?filename=maple-leaf-rag-21623.mp3',
  }),
  new Track({
    id: '2',
    title: 'Acoustic Breeze (demo)',
    artist: 'Benjamin Tissot',
    url: 'https://www.bensound.com/bensound-music/bensound-acousticbreeze.mp3',
  }),
  new Track({
    id: '3',
    title: 'Creative Minds (demo)',
    artist: 'Benjamin Tissot',
    url: 'https://www.bensound.com/bensound-music/bensound-creativeminds.mp3',
  }),
]

// Загружаем состояние (текущий трек, стратегия) из localStorage
const state = loadState()
// Создаём плейлист из демо-треков
const playlist = new Playlist(demoTracks)
// Если в состоянии был сохранён id текущего трека — устанавливаем его
if (state.currentId) playlist.setCurrentById(state.currentId)

// Создаём экземпляр аудиоплеера с плейлистом и стратегией воспроизведения
const player = new AudioPlayer({
  playlist,
  strategy: strategyFromName(state.strategy),
})

// Подписываемся на событие смены трека — сохраняем id текущего трека и стратегию в localStorage
player.addEventListener('trackchange', (e) => {
  const { track } = e.detail
  saveState({ ...state, currentId: track.id, strategy: player.strategy.name })
})

// Подписываемся на событие смены стратегии — сохраняем стратегию и текущий трек в localStorage
player.addEventListener('strategychange', () => {
  saveState({
    ...state,
    currentId: playlist.current?.id ?? null,
    strategy: player.strategy.name,
  })
})

// Получаем корневой DOM-элемент для плеера
const root = document.getElementById('app')
// Создаём UI-рендерер, который отрисует плеер и привяжет обработчики
new Renderer(root, player)

// Глобальный обработчик кликов по кнопкам стратегий (Sequential, Shuffle, Repeat One)
document.addEventListener('click', (ev) => {
  const target = ev.target
  if (!(target instanceof HTMLButtonElement)) return
  const text = target.textContent || ''
  if (text === 'Sequential') player.setStrategy(new SequentialStrategy())
  if (text === 'Shuffle') player.setStrategy(new ShuffleStrategy())
  if (text === 'Repeat One') player.setStrategy(new RepeatOneStrategy())
})
