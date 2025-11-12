'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser, useCollection, useFirestore, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, doc, where } from 'firebase/firestore';
import { PlusCircle, Users, Trash2 } from 'lucide-react';
import type { Playlist, Song } from '@/lib/types';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { v4 as uuidv4 } from 'uuid';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function PlaylistsPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedSongs, setSelectedSongs] = useState<string[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);


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


    const handleSongSelection = (songId: string) => {
        setSelectedSongs(prev => 
            prev.includes(songId) 
                ? prev.filter(id => id !== songId)
                : [...prev, songId]
        );
    };

    const handleCreatePlaylist = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        if (!user || !firestore) return;

        const formData = new FormData(event.currentTarget);
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const isPublic = formData.get('isPublic') === 'on';

        const userPlaylistsCollectionRef = collection(firestore, 'users', user.uid, 'playlists');
        
        const playlistId = uuidv4();
        
        // Select a random playlist cover art
        const randomCoverArt = PlaceHolderImages.filter(img => img.id.startsWith('playlist-cover-'))[Math.floor(Math.random() * PlaceHolderImages.filter(img => img.id.startsWith('playlist-cover-')).length)];


        const newPlaylistData: Playlist = {
            id: playlistId,
            userId: user.uid,
            name,
            description,
            isPublic,
            songIds: selectedSongs,
            coverArtUrl: randomCoverArt?.imageUrl || "https://picsum.photos/seed/playlist/400/400", // Assign random cover art
            liveSessionId: uuidv4(), // Generate a new live session ID
            currentSongId: selectedSongs.length > 0 ? selectedSongs[0] : '',
            transpose: 0,
            isSessionActive: false,
        };

        try {
            // Add to the user's private collection
            const userDocRef = doc(userPlaylistsCollectionRef, playlistId);
            setDocumentNonBlocking(userDocRef, {id: playlistId, name: name}, { merge: true });


            if (isPublic) {
                // Add to the public collection with the same ID
                const publicPlaylistsCollectionRef = collection(firestore, 'playlists');
                const publicDocRef = doc(publicPlaylistsCollectionRef, playlistId);
                setDocumentNonBlocking(publicDocRef, newPlaylistData, { merge: false });
            }
            setDialogOpen(false); // Close dialog on success
            setSelectedSongs([]); // Reset selection
            router.push(`/playlists/${playlistId}`);
        } catch (error) {
            console.error("Error creating playlist:", error);
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const handleDeletePlaylist = (playlist: Playlist) => {
        if (!user || !firestore) return;

        // Delete from user's private collection
        const userPlaylistRef = doc(firestore, 'users', user.uid, 'playlists', playlist.id);
        deleteDocumentNonBlocking(userPlaylistRef);

        // If it's a public playlist, delete from the public collection as well
        if (playlist.isPublic) {
            const publicPlaylistRef = doc(firestore, 'playlists', playlist.id);
            deleteDocumentNonBlocking(publicPlaylistRef);
        }

        toast({
            title: 'Playlist Deleted',
            description: `"${playlist.name}" has been removed.`,
        });
    }

    return (
        <div className="container mx-auto">
             <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-headline font-bold">My Playlists</h1>
                    <p className="text-muted-foreground">Your collections of songs for worship and rehearsal.</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" /> Create Playlist
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <form onSubmit={handleCreatePlaylist}>
                            <DialogHeader>
                                <DialogTitle>Create New Playlist</DialogTitle>
                                <DialogDescription>
                                    Give your new playlist a name and add some songs.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">Name</Label>
                                    <Input id="name" name="name" className="col-span-3" required />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="description" className="text-right">Description</Label>
                                    <Input id="description" name="description" className="col-span-3" />
                                </div>

                                <div className="grid grid-cols-4 items-start gap-4">
                                     <Label className="text-right pt-2">Songs</Label>
                                     <ScrollArea className="h-40 w-full rounded-md border col-span-3">
                                        <div className="p-4">
                                            {songsLoading && <p>Loading songs...</p>}
                                            {songs && songs.length > 0 ? songs.map(song => (
                                                <div key={song.id} className="flex items-center space-x-2 mb-2">
                                                    <Checkbox 
                                                        id={`song-${song.id}`}
                                                        onCheckedChange={() => handleSongSelection(song.id)}
                                                        checked={selectedSongs.includes(song.id)}
                                                    />
                                                    <label
                                                        htmlFor={`song-${song.id}`}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                    >
                                                        {song.title}
                                                    </label>
                                                </div>
                                            )) : (
                                                <p className="text-sm text-muted-foreground">No songs found. <Link href="/dashboard/songs/new" className="underline">Add one!</Link></p>
                                            )}
                                        </div>
                                     </ScrollArea>
                                </div>

                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="isPublic" className="text-right">Live Session?</Label>
                                    <div className="col-span-3 flex items-center space-x-2">
                                      <Switch id="isPublic" name="isPublic" />
                                      <Label htmlFor="isPublic">Allow others to join via a link</Label>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="secondary" onClick={() => setSelectedSongs([])}>Cancel</Button>
                                </DialogClose>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? 'Creating...' : 'Create & Open'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            
            {playlistsLoading ? <p>Loading playlists...</p> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {playlists?.map((playlist) => (
                    <Card key={playlist.id} className="group overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                        <Link href={`/playlists/${playlist.id}`} className='flex flex-col h-full'>
                            <div className="relative">
                                <Image
                                    src={playlist.coverArtUrl || "https://picsum.photos/seed/playlist/400/400"}
                                    alt={playlist.name}
                                    width={400}
                                    height={400}
                                    className="object-cover w-full h-48 group-hover:scale-105 transition-transform duration-300"
                                    data-ai-hint="music worship"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                {playlist.isPublic && (
                                     <div className="absolute top-2 right-2 bg-accent text-accent-foreground text-xs font-bold py-1 px-2 rounded-full flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        LIVE
                                    </div>
                                )}
                            </div>
                            <CardHeader className="p-4 z-10 -mt-12">
                                <CardTitle className="font-headline text-lg text-white">{playlist.name}</CardTitle>
                                <CardDescription className="text-sm text-gray-300">{playlist.songIds.length} songs</CardDescription>
                            </CardHeader>
                             <CardContent className="p-4 pt-0 flex-grow">
                                <p className="text-muted-foreground text-sm">{playlist.description}</p>
                            </CardContent>
                        </Link>
                        <div className="p-2 border-t mt-auto opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                        <Trash2 className="h-4 w-4 mr-1"/> Delete
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the playlist
                                            "{playlist.name}".
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeletePlaylist(playlist)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </Card>
                ))}
            </div>
            )}
        </div>
    );
}