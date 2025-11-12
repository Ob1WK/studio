'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, addDocumentNonBlocking } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Song } from "@/lib/types";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function NewSongPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { user } = useUser();
    const firestore = useFirestore();

    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState('');
    const [chords, setChords] = useState('');

    const formatChords = (rawText: string): string => {
        const lines = rawText.split('\n');
        const chordRegex = /([A-G](?:#|b)?(?:m|maj|min|dim|aug|sus|add)?[0-9]?(?:\/[A-G](?:#|b)?)?)/g;
        
        let formattedLines: string[] = [];
        let chordLineBuffer: string[] = [];

        for (let i = 0; i < lines.length; i++) {
            const currentLine = lines[i];
            const isChordLine = chordRegex.test(currentLine) && !/[a-z]/.test(currentLine);

            if (isChordLine) {
                chordLineBuffer.push(currentLine);
            } else {
                let lyricLine = currentLine;
                if (chordLineBuffer.length > 0) {
                    // Process from the last chord line backwards
                    let chordLine = chordLineBuffer.pop() || '';
                    
                    const chordsWithPositions: { chord: string, pos: number }[] = [];
                    let match;
                    const chordOnlyRegex = /([A-G](?:#|b)?(?:m|maj|min|dim|aug|sus|add)?[0-9]?(?:\/[A-G](?:#|b)?)?)/g;

                    while ((match = chordOnlyRegex.exec(chordLine)) !== null) {
                         chordsWithPositions.push({ chord: `[${match[0]}]`, pos: match.index });
                    }

                    // Insert chords into lyric line from end to start to not mess up indices
                    for (let j = chordsWithPositions.length - 1; j >= 0; j--) {
                        const { chord, pos } = chordsWithPositions[j];
                        lyricLine = lyricLine.slice(0, pos) + chord + lyricLine.slice(pos);
                    }
                    formattedLines.push(lyricLine);

                    // If there were more chord lines in buffer, add them as is (e.g. intros)
                    if (chordLineBuffer.length > 0) {
                        formattedLines.push(...chordLineBuffer);
                    }
                    chordLineBuffer = [];
                } else {
                     formattedLines.push(lyricLine);
                }
            }
        }
         // Add any remaining chord lines from buffer (e.g. if the song ends with chords)
        if(chordLineBuffer.length > 0){
            formattedLines.push(...chordLineBuffer.map(line => line.replace(chordRegex, '[$1]')));
        }


        return formattedLines.join('\n');
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const rawValue = e.target.value;
        setChords(rawValue);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const pastedText = e.clipboardData.getData('text');
        const formattedText = formatChords(pastedText);
        setChords(formattedText);
        e.preventDefault();
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
            chords: formatChords(chords),
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
                        <CardDescription>Fill in the details below. You can paste lyrics with chords from sites like LaCuerda.net and they will be auto-formatted.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
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
                                placeholder="Paste your song here...

C#m7        F#7
Él es Jesús Hijo de Dios
        A            G#7
Y en El nada se puede perder

... and it will be formatted on save."
                                className="font-code"
                                required
                                value={chords}
                                onChange={handleContentChange}
                                onPaste={handlePaste}
                            />
                            <p className="text-sm text-muted-foreground">
                                Chords will be automatically placed into `[Brackets]` on save or paste.
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
