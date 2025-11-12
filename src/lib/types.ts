export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
}

export interface Variation {
  id: string;
  content: string;
  author: User;
  createdAt: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  content: string;
  author: User;
  variations: Variation[];
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  songs: Song[];
  author: User;
  coverArtUrl: string;
}
