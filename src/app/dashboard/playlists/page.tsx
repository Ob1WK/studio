'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser, useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, query, serverTimestamp, doc } from 'firebase/firestore';
import { PlusCircle, Users } from 'lucide-react';
import type { Playlist } from '@/lib/types';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { v4 as uuidv4 } from 'uuid';

export default function PlaylistsPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const playlistsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, 'users', user.uid, 'playlists'));
    }, [firestore, user]);

    const { data: playlists, isLoading: playlistsLoading } = useCollection<Playlist>(playlistsQuery);

    const handleCreatePlaylist = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        if (!user || !firestore) return;

        const formData = new FormData(event.currentTarget);
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const isPublic = formData.get('isPublic') === 'on';

        const userPlaylistsCollectionRef = collection(firestore, 'users', user.uid, 'playlists');
        const publicPlaylistsCollectionRef = collection(firestore, 'playlists');
        
        const liveSessionId = uuidv4();

        const newPlaylist: Omit<Playlist, 'id'> = {
            userId: user.uid,
            name,
            description,
            isPublic,
            songIds: [],
            liveSessionId: liveSessionId,
            currentSongId: '',
            transpose: 0,
        };

        try {
            // Add to the user's private collection
            const userDocRef = await addDocumentNonBlocking(userPlaylistsCollectionRef, newPlaylist);
            if (isPublic) {
                // Add to the public collection with the same ID
                const publicDocRef = doc(publicPlaylistsCollectionRef, userDocRef.id);
                setDocumentNonBlocking(publicDocRef, newPlaylist, { merge: false });
            }
            document.getElementById('close-dialog')?.click();
            router.push(`/dashboard/playlists/${userDocRef.id}`);
        } catch (error) {
            console.error("Error creating playlist:", error);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="container mx-auto">
             <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-headline font-bold">My Playlists</h1>
                    <p className="text-muted-foreground">Your collections of songs for worship and rehearsal.</p>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" /> Create Playlist
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleCreatePlaylist}>
                            <DialogHeader>
                                <DialogTitle>Create New Playlist</DialogTitle>
                                <DialogDescription>
                                    Give your new playlist a name and description. You can add songs later.
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
                                    <Button type="button" variant="secondary" id="close-dialog">Cancel</Button>
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
                    <Link href={`/dashboard/playlists/${playlist.id}`} key={playlist.id}>
                        <Card className="group overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col">
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
                        </Card>
                    </Link>
                ))}
            </div>
            )}
        </div>
    );
}