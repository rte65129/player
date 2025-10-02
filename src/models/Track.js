export class Track {
  #id;
  #title;
  #artist;
  #url;
  #duration;

  constructor({ id, title, artist, url, duration = 0 }) {
    this.#id = id;
    this.#title = title;
    this.#artist = artist;
    this.#url = url;
    this.#duration = duration;
  }

  get id() { return this.#id; }
  get title() { return this.#title; }
  get artist() { return this.#artist; }
  get url() { return this.#url; }
  get duration() { return this.#duration; }

  set duration(value) { this.#duration = value; }

  toJSON() {
    return {
      id: this.#id,
      title: this.#title,
      artist: this.#artist,
      url: this.#url,
      duration: this.#duration
    };
  }
}