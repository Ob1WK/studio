'use client';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { PlusCircle, Music, Edit } from 'lucide-react';
import type { Song } from '@/lib/types';

export default function SongsPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const songsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, 'users', user.uid, 'songs'));
    }, [firestore, user]);

    const { data: songs, isLoading: songsLoading } = useCollection<Song>(songsQuery);

    return (
        <div className="container mx-auto">
             <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-headline font-bold">My Songs</h1>
                    <p className="text-muted-foreground">All your uploaded songs in one place.</p>
                </div>
                 <Button asChild>
                    <Link href="/dashboard/songs/new">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Song
                    </Link>
                </Button>
            </div>
            
            {songsLoading ? <p>Loading songs...</p> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {songs?.map((song) => (
                    <Card key={song.id} className="group flex flex-col">
                        <CardHeader>
                            <CardTitle className="font-headline text-xl">{song.title}</CardTitle>
                            <CardDescription>{song.artist}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                           <div className="flex items-center text-sm text-muted-foreground">
                               <Music className="mr-2 h-4 w-4"/>
                               <span>{song.chords.split('[').length - 1} chords</span>
                           </div>
                        </CardContent>
                        <div className="border-t p-2 flex justify-end">
                            <Button asChild variant="ghost" size="sm">
                                <Link href={`/dashboard/songs/${song.id}`}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                </Link>
                            </Button>
                        </div>
                    </Card>
                ))}
                 {songs?.length === 0 && (
                    <div className="col-span-full">
                        <Card className="text-center p-12 border-dashed">
                            <h3 className="text-xl font-semibold">No songs yet!</h3>
                            <p className="text-muted-foreground mt-2">Looks like you haven't added any songs.</p>
                            <Button asChild className="mt-4">
                                <Link href="/dashboard/songs/new">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add your first song
                                </Link>
                            </Button>
                        </Card>
                    </div>
                )}
            </div>
            )}
        </div>
    );
}
