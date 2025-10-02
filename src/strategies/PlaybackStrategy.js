export class PlaybackStrategy {
  get name() { return 'base'; }

  nextTrack(playlist) {
    throw new Error('Method not implemented');
  }

  previousTrack(playlist) {
    throw new Error('Method not implemented');
  }
}