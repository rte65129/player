import { PlaybackStrategy } from './PlaybackStrategy.js';

export class RepeatOneStrategy extends PlaybackStrategy {
  get name() { return 'repeat-one'; }

  nextTrack(playlist) {
    return playlist.current;
  }

  previousTrack(playlist) {
    return playlist.current;
  }
}