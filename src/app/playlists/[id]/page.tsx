'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { collection, doc, documentId, getDocs, query, where } from 'firebase/firestore';
import {
  useDoc,
  useFirestore,
  useMemoFirebase,
  useUser,
  updateDocumentNonBlocking,
} from '@/firebase';
import { getFirstChord, getNoteFromIndex, getNoteIndex, NOTES, transposeSong } from '@/lib/chords';
import type { Playlist, Song } from '@/lib/types';

import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Music, Play, Share2, Square, ChevronsUpDown } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';


export default function LivePlaylistPage({ params }: { params: { id: string } }) {
  const { id: playlistId } = params;
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const isMobile = useIsMobile(); // Hook para detectar si es móvil

  const [songsInPlaylist, setSongsInPlaylist] = useState<Song[]>([]);
  const [songsLoading, setSongsLoading] = useState(true);
  
  // CORRECTED: Generate shareUrl dynamically based on playlistId and window.location.origin
  const shareUrl = useMemo(() => {
    if (typeof window !== 'undefined' && playlistId) {
      return `${window.location.origin}/playlists/${playlistId}`;
    }
    return '';
  }, [playlistId]);

  const playlistRef = useMemoFirebase(() => {
    if (!playlistId || !firestore) return null;
    return doc(firestore, 'playlists', playlistId);
  }, [firestore, playlistId]);

  const { data: playlist, isLoading: playlistLoading, error } = useDoc<Playlist>(playlistRef);
  
  useEffect(() => {
    if (playlist && playlist.songIds && playlist.songIds.length > 0 && firestore) {
      const fetchSongData = async () => {
        setSongsLoading(true);
        // Fetch songs from the top-level 'songs' collection
        const songsRef = collection(firestore, 'songs');
        const q = query(songsRef, where(documentId(), 'in', playlist.songIds));
        
        try {
          const songSnapshots = await getDocs(q);
          const foundSongs = songSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song));
          // Preserve the order from playlist.songIds
          const orderedSongs = playlist.songIds.map(id => foundSongs.find(s => s.id === id)).filter(Boolean) as Song[];
          setSongsInPlaylist(orderedSongs);
        } catch (e) {
            console.error("Error fetching song data:", e);
        } finally {
            setSongsLoading(false);
        }
      };
      fetchSongData();
    } else if (playlist) { // Playlist loaded but has no songs
        setSongsLoading(false);
        setSongsInPlaylist([]);
    }
  }, [playlist, firestore]);
  
  const currentSong = useMemo(() => songsInPlaylist.find(s => s.id === playlist?.currentSongId), [songsInPlaylist, playlist?.currentSongId]);
  const originalKey = useMemo(() => currentSong ? getFirstChord(currentSong.chords) : null, [currentSong]);
  const displayedChords = useMemo(() => currentSong ? transposeSong(currentSong.chords, playlist?.transpose || 0) : '', [currentSong, playlist?.transpose]);

  const currentKey = useMemo(() => {
    if (!originalKey) return null;
    const originalKeyIndex = getNoteIndex(originalKey);
    if (originalKeyIndex === -1) return null;
    const newKeyIndex = (originalKeyIndex + (playlist?.transpose || 0) + 12) % 12;
    return getNoteFromIndex(newKeyIndex);
  }, [originalKey, playlist?.transpose]);


  const isAdmin = user && playlist && user.uid === playlist.userId;

  const handleSessionState = (isActive: boolean) => {
    if (!isAdmin || !playlistRef || !playlist) return;
    const firstSongId = playlist.songIds && playlist.songIds.length > 0 ? playlist.songIds[0] : '';
    updateDocumentNonBlocking(playlistRef, { 
      isSessionActive: isActive,
      currentSongId: isActive ? firstSongId : playlist.currentSongId,
      transpose: 0
    });
  }

  const handleSongChange = (direction: 'next' | 'prev') => {
      if (!isAdmin || !playlist?.songIds || playlist.songIds.length === 0 || !playlistRef) return;

      const currentIndex = playlist.songIds.indexOf(playlist.currentSongId || '');
      let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

      if (nextIndex >= playlist.songIds.length) nextIndex = 0;
      if (nextIndex < 0) nextIndex = playlist.songIds.length - 1;
      
      const nextSongId = playlist.songIds[nextIndex];
      if(playlistRef) {
        updateDocumentNonBlocking(playlistRef, { currentSongId: nextSongId, transpose: 0 });
      }
  };
  
  const handleKeyChange = (newKey: string) => {
    if (!isAdmin || !playlistRef || !originalKey) return;

    const originalKeyIndex = getNoteIndex(originalKey);
    const newKeyIndex = getNoteIndex(newKey);
    
    if (originalKeyIndex === -1 || newKeyIndex === -1) return;

    const transposeAmount = newKeyIndex - originalKeyIndex;
    updateDocumentNonBlocking(playlistRef, { transpose: transposeAmount });
  };


  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({
        title: "Link Copied!",
        description: "You can now share this session with others.",
    })
  }

  if (playlistLoading) {
    return <div className="container mx-auto text-center p-8">Loading session...</div>;
  }

  if (error || !playlist) {
    return (
        <div className="container mx-auto text-center p-8 text-destructive">
            <h2 className="text-2xl font-bold mb-4">Error</h2>
            <p>Could not load the playlist. It might be private or may not exist.</p>
            <Button asChild className="mt-4">
                <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
        </div>
    );
  }

  // SESSION NOT ACTIVE (LOBBY VIEW)
  if (!playlist.isSessionActive) {
    return (
        <>
        {!user && (
            <header className="sticky top-0 z-50 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    <Music className="h-6 w-6" />
                    <span>HolyHarmonies</span>
                </Link>
                <div>
                    <Button asChild variant="ghost"><Link href="/login">Log In</Link></Button>
                    <Button asChild><Link href="/signup">Sign Up</Link></Button>
                </div>
            </header>
        )}
        {user && <AppHeader />}
        <main className="flex-1">
            <div className="container mx-auto max-w-2xl py-12 flex flex-col items-center text-center">
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle className="font-headline text-4xl">{playlist.name}</CardTitle>
                        <CardDescription>{playlist.description || "Get ready to play."}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-4 border rounded-lg">
                            <p className="font-semibold mb-2">Share this link to invite others:</p>
                            <div className="flex items-center gap-2">
                            <input type="text" readOnly value={shareUrl} className="w-full p-2 border rounded bg-secondary"/>
                            <Button onClick={copyShareLink} size="icon" variant="outline"><Share2 /></Button>
                            </div>
                        </div>

                        {isAdmin ? (
                            <div>
                                <Button size="lg" onClick={() => handleSessionState(true)} disabled={!songsInPlaylist || songsInPlaylist.length === 0}>
                                    <Play className="mr-2 h-5 w-5" /> 
                                    {songsInPlaylist && songsInPlaylist.length > 0 ? "Start Session" : "Add Songs to Start"}
                                </Button>
                                <p className="text-sm text-muted-foreground mt-2">Only you can see this button.</p>
                            </div>
                        ) : (
                            <div className="p-4 bg-secondary rounded-lg">
                                <h3 className="font-semibold">Waiting for the session leader to start...</h3>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </main>
        </>
    )
  }

  // SESSION ACTIVE VIEW
  return (
    <>
    {!user && (
         <header className="sticky top-0 z-50 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
                <Music className="h-6 w-6" />
                <span>HolyHarmonies - Live Session</span>
            </Link>
            <div>
                <Button asChild variant="ghost"><Link href="/login">Log In</Link></Button>
                <Button asChild><Link href="/signup">Sign Up</Link></Button>
            </div>
        </header>
    )}
    {user && <AppHeader />}
    <main className="flex-1">
        <div className="container mx-auto max-w-6xl py-8">
            <div className="flex flex-col lg:flex-row gap-8">

                {/* Main Content: Current Song (prioritized on mobile) */}
                <div className="lg:w-2/3 order-1 lg:order-none"> {/* order-1 para móvil, order-none para desktop */}
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
                                            <span className="text-sm text-muted-foreground">Key</span>
                                            <Select onValueChange={handleKeyChange} value={currentKey || ''} disabled={!originalKey}>
                                                <SelectTrigger className="w-[120px]">
                                                    <SelectValue placeholder="Select key" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {NOTES.map(note => (
                                                        <SelectItem key={note} value={note}>{note}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <pre className="font-code text-sm whitespace-pre-wrap leading-relaxed bg-secondary p-4 rounded-md max-h-[calc(100vh-250px)] overflow-y-auto lg:max-h-[60vh]">
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
                            The session is active. Waiting for the leader to select a song.
                            </p>
                        </Card>
                    )}
                </div>

                {/* Song List Sidebar (after current song on mobile) */}
                <div className="lg:w-1/3 order-2 lg:order-none"> {/* order-2 para móvil, order-none para desktop */}
                    {isMobile ? (
                        <Collapsible className="w-full">
                            <CollapsibleTrigger asChild>
                                <Button variant="outline" className="w-full justify-between">
                                    <span>{playlist.name} Songs ({songsInPlaylist.length})</span>
                                    <ChevronsUpDown className="h-4 w-4" />
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <Card className="mt-4">
                                    <CardContent className="p-4">
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
                                        </ul>
                                    </CardContent>
                                </Card>
                            </CollapsibleContent>
                        </Collapsible>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-headline">{playlist.name}</CardTitle>
                                <CardDescription>Live Session</CardDescription>
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
                                </ul>
                            </CardContent>
                        </Card>
                    )}
                    {isAdmin && (
                        <Button variant="destructive" className="w-full mt-4" onClick={() => handleSessionState(false)}>
                            <Square className="mr-2 h-4 w-4"/> End Session
                        </Button>
                    )}
                </div>
            </div>
        </div>
    </main>
    </>
  );
}