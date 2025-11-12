export type User = {
  id: string;
  email: string;
  username: string;
  profilePictureUrl?: string;
};

export type Variation = {
  id: string;
  songId: string;
  userId: string;
  variationText: string;
  submissionDate: string;
};

export type Song = {
  id: string;
  userId: string;
  title: string;
  artist: string;
  chords: string;
  uploadDate: string;
  sharedLink?: string;
  originalSongId?: string; // To trace back a copied song
};

export type Playlist = {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  songIds: string[];
  coverArtUrl?: string;
  liveSessionId?: string;
  currentSongId?: string;
  transpose?: number;
  isSessionActive?: boolean; // New field to track live session state
};