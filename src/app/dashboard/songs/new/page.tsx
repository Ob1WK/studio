'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import type { Song } from "@/lib/types";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

export default function NewSongPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { user } = useUser();
    const firestore = useFirestore();

    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState('');
    const [chords, setChords] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formatChords = (rawText: string): string => {
        const lines = rawText.split('\n');
        const formattedLines = lines.map(line => {
            // A line is considered a chord line if it's not empty and contains
            // characters typically found in chords, and few lowercase letters.
            // This regex is a heuristic. It looks for common chord patterns.
            const chordLineRegex = /^[A-G][#b]?(m|maj|min|dim|aug|sus|add|M)?[0-9]?(\/[A-G][#b]?)?/;
            const containsChords = chordLineRegex.test(line.trim());
            const hasLowercase = /[a-z]/.test(line);

            if (containsChords && !hasLowercase) {
                // This is likely a chord line. Wrap each "word" (chord) in brackets.
                return line.trim().replace(/(\S+)/g, '[$1]');
            }
            // Otherwise, it's a lyric line or something else, return as is.
            return line;
        });
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
    
    const handleFormatButtonClick = () => {
        const formattedText = formatChords(chords);
        setChords(formattedText);
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        
        if (!user || !firestore) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "You must be logged in to add a song.",
            });
            setIsSubmitting(false);
            return;
        }

        // Apply formatting one last time on save
        const finalChords = formatChords(chords);
        const songId = uuidv4();
        const songRef = doc(firestore, 'users', user.uid, 'songs', songId);

        const newSong: Omit<Song, 'id'> & { id: string } = {
            id: songId,
            userId: user.uid,
            title,
            artist,
            chords: finalChords,
            uploadDate: new Date().toISOString(),
            variations: [],
        };
        
        try {
            // Use setDocumentNonBlocking for a single, reliable write operation.
            setDocumentNonBlocking(songRef, newSong, { merge: false });

            toast({
                title: "Song Submitted!",
                description: "Your new song has been added successfully.",
            });
            
            // Redirect after a short delay to allow optimistic update to process
            setTimeout(() => router.push('/dashboard/songs'), 500);

        } catch (error) {
            console.error("Error creating song:", error);
            toast({
                variant: "destructive",
                title: "Submission Error",
                description: "There was a problem saving your song.",
            });
        } finally {
            // We keep submitting state until redirect happens
            // setIsSubmitting(false);
        }
    }

    return (
        <div className="container mx-auto">
            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Add a New Song</CardTitle>
                        <CardDescription>Fill in the details below. You can paste lyrics with chords from sites like LaCuerda.net and they will be auto-formatted on paste or save.</CardDescription>
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

... and it will be formatted on paste or save."
                                className="font-code"
                                required
                                value={chords}
                                onChange={handleContentChange}
                                onPaste={handlePaste}
                            />
                            <p className="text-sm text-muted-foreground">
                                Chords will be automatically placed into `[Brackets]` on save or paste. You can also <Button variant="link" type="button" onClick={handleFormatButtonClick} className="p-0 h-auto">format manually</Button>.
                            </p>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" type="button" onClick={() => router.back()} disabled={isSubmitting}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                                {isSubmitting ? "Saving..." : "Save Song"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
