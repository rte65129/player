import { PlaybackStrategy } from './PlaybackStrategy.js';

export class ShuffleStrategy extends PlaybackStrategy {
  #history = [];
  #future = [];

  get name() { return 'shuffle'; }

  nextTrack(playlist) {
    if (playlist.length === 0) return null;
    
    // Сохраняем текущий трек в историю
    if (playlist.current) {
      this.#history.push(playlist.currentIndex);
    }
    
    let nextIndex;
    if (this.#future.length > 0) {
      // Берем из будущего (при использовании previous)
      nextIndex = this.#future.pop();
    } else {
      // Генерируем случайный индекс, исключая текущий
      const availableIndices = Array.from({length: playlist.length}, (_, i) => i)
        .filter(i => i !== playlist.currentIndex);
      
      if (availableIndices.length === 0) {
        // Если только один трек в плейлисте
        nextIndex = playlist.currentIndex;
      } else {
        nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      }
    }
    
    playlist.setCurrentIndex(nextIndex);
    return playlist.current;
  }

  previousTrack(playlist) {
    if (this.#history.length === 0) return playlist.current;
    
    // Сохраняем текущий трек в будущее
    this.#future.push(playlist.currentIndex);
    
    // Восстанавливаем предыдущий из истории
    const prevIndex = this.#history.pop();
    playlist.setCurrentIndex(prevIndex);
    return playlist.current;
  }
}