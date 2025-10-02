import { PlaybackStrategy } from './PlaybackStrategy.js';

export class ShuffleStrategy extends PlaybackStrategy {
  #history = [];
  #future = [];

  get name() { return 'shuffle'; }

  nextTrack(playlist) {
    if (playlist.length === 0) return null;
    
    this.#history.push(playlist.currentIndex);
    
    let nextIndex;
    if (this.#future.length > 0) {
      nextIndex = this.#future.pop();
    } else {
      const availableIndices = Array.from({length: playlist.length}, (_, i) => i)
        .filter(i => i !== playlist.currentIndex);
      nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    }
    
    playlist.setCurrentIndex(nextIndex);
    return playlist.current;
  }

  previousTrack(playlist) {
    if (this.#history.length === 0) return playlist.current;
    
    this.#future.push(playlist.currentIndex);
    const prevIndex = this.#history.pop();
    playlist.setCurrentIndex(prevIndex);
    return playlist.current;
  }
}