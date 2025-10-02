import { PlaybackStrategy } from './PlaybackStrategy.js';

export class SequentialStrategy extends PlaybackStrategy {
  get name() { return 'sequential'; }

  nextTrack(playlist) {
    return playlist.next();
  }

  previousTrack(playlist) {
    return playlist.previous();
  }
}