export class Playlist {
  #tracks;
  #currentIndex;

  constructor(tracks = []) {
    this.#tracks = tracks;
    this.#currentIndex = 0;
  }

  get tracks() { return [...this.#tracks]; }  // Копия массива треков
  get current() { return this.#tracks[this.#currentIndex] || null; }  // Текущий трек
  get currentIndex() { return this.#currentIndex; } // Текущий индекс
  get length() { return this.#tracks.length; }  // Количество треков
  // Добавление 
  addTrack(track) {
    this.#tracks.push(track);
  }
  // Удаление
  removeTrack(id) {
    this.#tracks = this.#tracks.filter(track => track.id !== id);
    if (this.#currentIndex >= this.#tracks.length) {
      this.#currentIndex = Math.max(0, this.#tracks.length - 1);
    }
  }

  setCurrentIndex(index) {
    if (index >= 0 && index < this.#tracks.length) {
      this.#currentIndex = index;
    }
  }

  setCurrentById(id) {
    const index = this.#tracks.findIndex(track => track.id === id);
    if (index !== -1) {
      this.#currentIndex = index;
    }
  }

  next() {
    if (this.#tracks.length === 0) return null;
    this.#currentIndex = (this.#currentIndex + 1) % this.#tracks.length;
    return this.current;
  }

  previous() {
    if (this.#tracks.length === 0) return null;
    this.#currentIndex = (this.#currentIndex - 1 + this.#tracks.length) % this.#tracks.length;
    return this.current;
  }
  // Получение трека по индексу
  getTrack(index) {
    return this.#tracks[index] || null;
  }
}