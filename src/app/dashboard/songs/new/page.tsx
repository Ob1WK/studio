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
import { useState } from "react";
import { importSong } from "@/ai/flows/import-song-flow";
import { Loader2 } from "lucide-react";

export default function NewSongPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { user } = useUser();
    const firestore = useFirestore();

    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState('');
    const [chords, setChords] = useState('');
    const [isImporting, setIsImporting] = useState(false);


    const handleImport = async (url: string) => {
        if (!url.includes('acordes.lacuerda.net')) {
            return;
        }
        setIsImporting(true);
        try {
            const songData = await importSong({ url });
            if (songData) {
                setTitle(songData.title);
                setArtist(songData.artist);
                setChords(songData.chords);
                toast({
                    title: "Song Imported!",
                    description: "The song details have been filled in. Please review and save.",
                });
            }
        } catch (error) {
            console.error("Error importing song:", error);
            toast({
                variant: "destructive",
                title: "Import Failed",
                description: "Could not import the song from the provided URL.",
            });
        } finally {
            setIsImporting(false);
        }
    };


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
        
        router.push('/dashboard/songs');
    }

    return (
        <div className="container mx-auto">
            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Add a New Song</CardTitle>
                        <CardDescription>Fill in the details below, or import a song from a LaCuerda.net URL.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2 relative">
                            <Label htmlFor="import-url">Import from LaCuerda.net</Label>
                            <Input 
                                id="import-url" 
                                name="import-url" 
                                placeholder="Paste a URL from acordes.lacuerda.net..." 
                                onChange={(e) => handleImport(e.target.value)}
                                disabled={isImporting}
                            />
                             {isImporting && (
                                <div className="absolute right-2 top-1/2 mt-1">
                                    <Loader2 className="animate-spin" />
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="title">Song Title</Label>
                                <Input 
                                    id="title" 
                                    name="title" 
                                    placeholder="e.g., Amazing Grace" 
                                    required 
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="artist">Artist</Label>
                                <Input 
                                    id="artist" 
                                    name="artist" 
                                    placeholder="e.g., John Newton" 
                                    required 
                                    value={artist}
                                    onChange={(e) => setArtist(e.target.value)}
                                />
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
                                value={chords}
                                onChange={(e) => setChords(e.target.value)}
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
