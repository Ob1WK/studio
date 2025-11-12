'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Music, Users, ListMusic } from 'lucide-react';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Playlist, Song } from '@/lib/types';


export default function DashboardPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const playlistsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, 'users', user.uid, 'playlists'));
    }, [firestore, user]);

    const songsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, 'songs'), where('userId', '==', user.uid));
    }, [firestore, user]);

    const { data: playlists, isLoading: playlistsLoading } = useCollection<Playlist>(playlistsQuery);
    const { data: songs, isLoading: songsLoading } = useCollection<Song>(songsQuery);
    
    if (playlistsLoading || songsLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="container mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-headline font-bold">Welcome, {user?.displayName || user?.email}!</h1>
                    <p className="text-muted-foreground">Here's what's new in your harmony space.</p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/songs/new">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Song
                    </Link>
                </Button>
            </div>

            <section>
                <h2 className="text-2xl font-headline font-semibold mb-4">My Playlists</h2>
                {playlists && playlists.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {playlists.map((playlist) => (
                            <Link href={`/playlists/${playlist.id}`} key={playlist.id}>
                                <Card className="group overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                                    <div className="relative">
                                        <Image
                                            src={playlist.coverArtUrl || "https://picsum.photos/seed/playlist/400/400"}
                                            alt={playlist.name}
                                            width={400}
                                            height={400}
                                            className="object-cover w-full h-48 group-hover:scale-105 transition-transform duration-300"
                                            data-ai-hint="music playlist"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    </div>
                                    <CardHeader className="p-4 z-10 -mt-12">
                                        <CardTitle className="font-headline text-lg text-white">{playlist.name}</CardTitle>
                                        <CardDescription className="text-sm text-gray-300">{playlist.songIds?.length || 0} songs</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0 flex-grow">
                                        <p className="text-muted-foreground text-sm">{playlist.description}</p>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <Card className="flex flex-col items-center justify-center p-12 border-dashed">
                        <ListMusic className="w-12 h-12 text-muted-foreground" />
                        <p className="mt-4 text-muted-foreground">You haven't created any playlists yet.</p>
                        <Button variant="secondary" className="mt-4" asChild>
                            <Link href="/dashboard/playlists">Create a Playlist</Link>
                        </Button>
                    </Card>
                )}
            </section>

            <section className="mt-12">
                <h2 className="text-2xl font-headline font-semibold mb-4">Recently Added Songs</h2>
                 {songs && songs.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {songs.map((song) => (
                            <Link href={`/dashboard/songs/${song.id}`} key={song.id}>
                                <Card className="hover:bg-secondary transition-colors">
                                    <CardHeader className="flex flex-row items-center justify-between p-4">
                                        <div>
                                            <CardTitle className="text-lg font-semibold">{song.title}</CardTitle>
                                            <CardDescription className="flex items-center gap-2 text-sm">
                                                <Music className="h-3 w-3" />
                                                {song.artist}
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Users className="h-4 w-4" />
                                            <span>{song.variations?.length || 0} {song.variations?.length === 1 ? 'variation' : 'variations'}</span>
                                        </div>
                                    </CardHeader>
                                </Card>
                            </Link>
                        ))}
                    </div>
                 ) : (
                    <Card className="text-center p-8 border-dashed">
                        <p className="text-muted-foreground">No songs added yet.</p>
                    </Card>
                 )}
            </section>
        </div>
    );
}