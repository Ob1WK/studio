'use client';

import { notFound, useRouter } from 'next/navigation';
import { useUser, useDoc, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, collection, getDoc } from 'firebase/firestore';
import type { Playlist, Song } from '@/lib/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Music, Share2, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { transposeSong } from '@/lib/chords';

export default function LivePlaylistPage({ params }: { params: { id: string } }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const playlistRef = useMemoFirebase(() => {
    if (!params.id) return null;
    // Try to get the playlist from the public collection first
    return doc(firestore, 'playlists', params.id);
  }, [firestore, params.id]);

  const { data: playlist, isLoading: playlistLoading, error } = useDoc<Playlist>(playlistRef);
  
  const currentSongRef = useMemoFirebase(() => {
      if (!playlist?.currentSongId) return null;
      // All songs are under a user's subcollection. We need the original author's ID.
      // This assumes we can get the song's original author's ID.
      // For now, we need to find the song in the database. This is inefficient.
      // A better model would have songs in a top-level collection.
      // Given the current model, this is a workaround. We will need to fetch song data separately.
      
      // Let's assume we can fetch the song if we know its ID and its owner's ID.
      // But the playlist doesn't store the song owner's ID.
      // This is a major data modeling issue. 
      // For now, we will fetch all songs from the current user and find the song.
      if (playlist.userId && playlist.currentSongId) {
          return doc(firestore, 'users', playlist.userId, 'songs', playlist.currentSongId);
      }
      return null;
  }, [firestore, playlist]);

  const { data: currentSong, isLoading: songLoading } = useDoc<Song>(currentSongRef);

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
      
      updateDocumentNonBlocking(playlistRef, updatedData);
  };
  
  const handleTranspose = (amount: number) => {
      if (!isAdmin || playlist.transpose === undefined) return;
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
                           {playlist.songIds?.map((songId) => (
                               <li key={songId}>
                                   {/* We need to fetch song details here, which is inefficient.
                                   For now, just showing IDs and highlighting the current one. */}
                                   <Button 
                                        variant={songId === playlist.currentSongId ? 'secondary' : 'ghost'}
                                        className="w-full justify-start"
                                        onClick={() => isAdmin && updateDocumentNonBlocking(playlistRef, { currentSongId: songId, transpose: 0 })}
                                        disabled={!isAdmin}
                                    >
                                       <Music className="mr-2 h-4 w-4" />
                                       Song {songId.substring(0, 5)}...
                                   </Button>
                               </li>
                           ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content: Current Song */}
            <div className="lg:w-2/3">
                {currentSong ? (
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
                        <h2 className="text-2xl font-semibold">No song selected</h2>
                        <p className="text-muted-foreground">The session leader needs to select a song to begin.</p>
                    </Card>
                )}
            </div>

        </div>
    </div>
  );
}
