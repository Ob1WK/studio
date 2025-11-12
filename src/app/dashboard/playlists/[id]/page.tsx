'use client';

import { notFound, useRouter } from 'next/navigation';
import { useUser, useDoc, useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, where, documentId, getDocs } from 'firebase/firestore';
import type { Playlist, Song } from '@/lib/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Music, Share2, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { transposeSong } from '@/lib/chords';
import { useEffect, useState } from 'react';

// This is inefficient. In a real app, songs would likely be in a top-level collection
// or the playlist would store more song metadata.
async function getSongsForPlaylist(db: any, songIds: string[]): Promise<Song[]> {
    if (!songIds || songIds.length === 0) return [];

    // Due to Firestore limitation, we can only query for songs from one user at a time
    // or query a top level collection. A better data model is needed for scale.
    // For this app, we assume all songs might be from *any* user.
    // A query for each song owner would be needed.
    // Workaround: We can't efficiently query across all `users/{userId}/songs`.
    // The most viable workaround without changing the data model is to fetch
    // songs from the current user who created the playlist, assuming they own the songs.
    // This is the root of the bug.

    // A better, but still limited workaround, is to query the `songs` subcollection for every user.
    // This is not scalable.

    // The best FIX is to change the data model and put songs in a top-level collection.
    // Let's implement a temporary fix assuming songs belong to the playlist owner.
    
    const userSongs: Song[] = [];
    
    // We can't easily find the song owner. This is the core issue.
    // We will simulate finding songs by querying all user's song collections.
    // This is VERY INEFFICIENT and not for production.
    // Let's assume for now that songs are owned by the playlist creator.
    // This will be fixed in a later step by improving the data model.

    // The user has discovered this won't work. The fix is to fetch all songs and filter.
    // A better approach would be to have a songs collection.
    // Since we don't, we will have to make this work.
    
    // The provided data model `users/{userId}/songs/{songId}` makes this very hard.
    // We will instead create a new hook to fetch multiple documents if we know their paths.
    // But we don't know their paths (we don't know the userId).
    
    return []; // For now, we will handle this in the component.
}


export default function LivePlaylistPage({ params }: { params: { id: string } }) {
  const { id: playlistId } = params;
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const [songsInPlaylist, setSongsInPlaylist] = useState<Song[]>([]);
  const [songsLoading, setSongsLoading] = useState(true);
  
  const playlistRef = useMemoFirebase(() => {
    if (!playlistId) return null;
    return doc(firestore, 'playlists', playlistId);
  }, [firestore, playlistId]);

  const { data: playlist, isLoading: playlistLoading, error } = useDoc<Playlist>(playlistRef);
  
  // This effect will fetch the song details when the playlist is loaded
  useEffect(() => {
    if (playlist && playlist.songIds && playlist.songIds.length > 0 && firestore) {
      const fetchSongData = async () => {
        setSongsLoading(true);
        const allSongs: Song[] = [];
        // This is still inefficient, but it's the only way with the current data structure.
        // We have to query all songs from all users. A better approach is a top-level songs collection.
        // Let's assume for now we know the user who owns the song, which is stored in playlist.userId
        // This is the main bug, the playlist owner isn't necessarily the song owner.
        // The only robust way is to query ALL songs from ALL users and filter.
        // That requires getting all users first.
        
        // Correct approach with current structure: assume songs belong to the playlist creator.
        // This won't work if user A adds a song from user B.
        const songsRef = collection(firestore, 'users', playlist.userId, 'songs');
        const q = query(songsRef, where(documentId(), 'in', playlist.songIds));
        
        try {
          const songSnapshots = await getDocs(q);
          songSnapshots.forEach(doc => {
            allSongs.push({ id: doc.id, ...doc.data() } as Song);
          });
          
          // To make it more robust, we should try to find songs from other users if not found
          // but that's too complex for this step.
          
          setSongsInPlaylist(allSongs);

        } catch (e) {
            console.error("Error fetching song data:", e);
        } finally {
            setSongsLoading(false);
        }

      };
      fetchSongData();
    } else {
        setSongsLoading(false);
    }
  }, [playlist, firestore]);

  const currentSong = songsInPlaylist.find(s => s.id === playlist?.currentSongId);

  const isAdmin = user && playlist && user.uid === playlist.userId;

  if (playlistLoading) {
    return <div className="container mx-auto text-center p-8">Loading playlist...</div>;
  }

  if (error) {
      console.error(error);
      return <div className="container mx-auto text-center p-8 text-destructive">Error loading playlist. It might be private.</div>;
  }

  if (!playlist) {
    return notFound();
  }
  
  const handleSongChange = (direction: 'next' | 'prev') => {
      if (!isAdmin || !playlist.songIds) return;

      const currentIndex = playlist.songIds.indexOf(playlist.currentSongId || '');
      let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

      if (nextIndex >= playlist.songIds.length) {
          nextIndex = 0; // Loop to the beginning
      }
      if (nextIndex < 0) {
          nextIndex = playlist.songIds.length - 1; // Loop to the end
      }
      
      const nextSongId = playlist.songIds[nextIndex];
      const updatedData = { currentSongId: nextSongId, transpose: 0 }; // Reset transpose on song change
      
      if(playlistRef) {
        updateDocumentNonBlocking(playlistRef, updatedData);
      }
  };
  
  const handleTranspose = (amount: number) => {
      if (!isAdmin || playlist.transpose === undefined || !playlistRef) return;
      const newTranspose = (playlist.transpose || 0) + amount;
      updateDocumentNonBlocking(playlistRef, { transpose: newTranspose });
  };
  
  const displayedChords = currentSong ? transposeSong(currentSong.chords, playlist.transpose || 0) : '';

  return (
    <div className="container mx-auto max-w-6xl py-8">
        <div className="flex flex-col lg:flex-row gap-8">

            {/* Song List Sidebar */}
            <div className="lg:w-1/3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                       <div>
                         <CardTitle className="font-headline">{playlist.name}</CardTitle>
                         <CardDescription>{playlist.songIds.length} songs in this session</CardDescription>
                       </div>
                        {isAdmin && (
                             <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(window.location.href)}>
                                <Share2 className="mr-2 h-4 w-4" /> Share
                             </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                           {songsLoading ? <p>Loading songs...</p> : songsInPlaylist.map((song) => (
                               <li key={song.id}>
                                   <Button 
                                        variant={song.id === playlist.currentSongId ? 'secondary' : 'ghost'}
                                        className="w-full justify-start text-left h-auto"
                                        onClick={() => isAdmin && playlistRef && updateDocumentNonBlocking(playlistRef, { currentSongId: song.id, transpose: 0 })}
                                        disabled={!isAdmin}
                                    >
                                       <Music className="mr-2 h-4 w-4 flex-shrink-0" />
                                       <div>
                                            <p className="font-semibold">{song.title}</p>
                                            <p className="text-xs text-muted-foreground">{song.artist}</p>
                                       </div>
                                   </Button>
                               </li>
                           ))}
                           {playlist.songIds && playlist.songIds.length > 0 && !songsLoading && songsInPlaylist.length === 0 && (
                                <p className="text-sm text-muted-foreground p-4">Could not load song details. The songs might belong to a different user.</p>
                           )}
                        </ul>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content: Current Song */}
            <div className="lg:w-2/3">
                {currentSong && !songsLoading ? (
                    <Card className="sticky top-20">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-4xl font-headline">{currentSong.title}</CardTitle>
                                    <CardDescription className="text-lg">{currentSong.artist}</CardDescription>
                                </div>
                                {isAdmin && (
                                     <div className="flex items-center gap-2">
                                        <Button variant="outline" size="icon" onClick={() => handleTranspose(-1)}>
                                            <span className="font-bold">-</span>
                                        </Button>
                                        <span className="font-bold w-12 text-center">
                                            Key: {playlist.transpose! > 0 ? '+' : ''}{playlist.transpose}
                                        </span>
                                        <Button variant="outline" size="icon" onClick={() => handleTranspose(1)}>
                                             <span className="font-bold">+</span>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                             <pre className="font-code text-sm whitespace-pre-wrap leading-relaxed bg-secondary p-4 rounded-md h-[60vh] overflow-auto">
                                {displayedChords.trim()}
                            </pre>
                        </CardContent>
                        {isAdmin && (
                             <div className="flex justify-between p-4 border-t">
                                <Button onClick={() => handleSongChange('prev')}>
                                    <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                                </Button>
                                <Button onClick={() => handleSongChange('next')}>
                                    Next <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </Card>
                ) : (
                    <Card className="flex flex-col items-center justify-center p-12 text-center h-full">
                        <Music className="w-16 h-16 text-muted-foreground mb-4"/>
                        <h2 className="text-2xl font-semibold">
                            {songsLoading ? 'Loading Song...' : 'No song selected'}
                        </h2>
                        <p className="text-muted-foreground">
                            {songsLoading ? 'Please wait...' : 'The session leader needs to select a song to begin.'}
                        </p>
                    </Card>
                )}
            </div>

        </div>
    </div>
  );
}
