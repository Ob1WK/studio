'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, addDocumentNonBlocking } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import type { Song } from "@/lib/types";

export default function NewSongPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { user } = useUser();
    const firestore = useFirestore();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        if (!user || !firestore) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "You must be logged in to add a song.",
            });
            return;
        }

        const formData = new FormData(event.currentTarget);
        const title = formData.get('title') as string;
        const artist = formData.get('artist') as string;
        const chords = formData.get('content') as string;

        const songsCollectionRef = collection(firestore, 'users', user.uid, 'songs');

        const newSong: Omit<Song, 'id'> = {
            userId: user.uid,
            title,
            artist,
            chords,
            uploadDate: new Date().toISOString(),
            variations: [],
        };
        
        addDocumentNonBlocking(songsCollectionRef, newSong);

        toast({
            title: "Song Submitted!",
            description: "Your new song has been added successfully.",
        });
        
        router.push('/dashboard');
    }

    return (
        <div className="container mx-auto">
            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Add a New Song</CardTitle>
                        <CardDescription>Fill in the details below to share a new song with the community.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="title">Song Title</Label>
                                <Input id="title" name="title" placeholder="e.g., Amazing Grace" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="artist">Artist</Label>
                                <Input id="artist" name="artist" placeholder="e.g., John Newton" required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="content">Lyrics & Chords</Label>
                            <Textarea
                                id="content"
                                name="content"
                                rows={15}
                                placeholder="[G]Amazing grace how [C]sweet the sound..."
                                className="font-code"
                                required
                            />
                            <p className="text-sm text-muted-foreground">
                                Use square brackets for chords, e.g., `[C]`. They will be displayed above the lyrics.
                            </p>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                            <Button type="submit">Save Song</Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
