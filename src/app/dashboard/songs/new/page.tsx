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
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formatChords = (rawText: string): string => {
        const lines = rawText.split('\n');
        const formattedLines: string[] = [];

        const chordRegex = /([A-G][#b]?(?:m|maj|min|dim|aug|sus|add|M)?[0-9]?(?:\/[A-G][#b]?)?)/;
        // A line is a chord line if it contains chords and very few letters, or common chord patterns
        const isChordLine = (line: string) => {
            const chordPattern = /([A-G](#|b)?(m|maj|min|dim|aug|sus|add|M)?[0-9]?(\/([A-G](#|b)?))?\s*)+/g;
            const textOnly = line.replace(chordPattern, '').replace(/\s/g, '');
            return chordPattern.test(line) && textOnly.length < 5;
        }

        for (let i = 0; i < lines.length; i++) {
            const currentLine = lines[i];

            if (isChordLine(currentLine) && i + 1 < lines.length) {
                const nextLine = lines[i + 1];
                // If the next line is NOT a chord line, we process them as a pair.
                if (!isChordLine(nextLine) && nextLine.trim() !== '') {
                    const chordsWithPositions: { chord: string, pos: number }[] = [];
                    const chordMatches = currentLine.match(/(\S+)/g) || [];

                    let searchIndex = 0;
                    chordMatches.forEach(chord => {
                        const pos = currentLine.indexOf(chord, searchIndex);
                        if (pos !== -1 && chordRegex.test(chord)) {
                            chordsWithPositions.push({ chord: `[${chord}]`, pos });
                            searchIndex = pos + chord.length;
                        }
                    });
                    
                    let lyricLineWithChords = nextLine;
                    // Insert chords from end to start to not mess up indices
                    for (let j = chordsWithPositions.length - 1; j >= 0; j--) {
                        const { chord, pos } = chordsWithPositions[j];
                        if (pos < lyricLineWithChords.length) {
                           lyricLineWithChords = lyricLineWithChords.slice(0, pos) + chord + lyricLineWithChords.slice(pos);
                        } else {
                           lyricLineWithChords += ' ' + chord;
                        }
                    }
                    formattedLines.push(lyricLineWithChords);
                    i++; // Increment i because we've processed the next line already
                } else {
                    // It's a chord line but the next line is also a chord line or empty, so just add it (e.g. for intros)
                    formattedLines.push(currentLine.replace(/(\S+)/g, '[$1]'));
                }
            } else {
                // It's a lyric line or a line we don't know how to handle, so just add it.
                formattedLines.push(currentLine);
            }
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

        const songsCollectionRef = collection(firestore, 'users', user.uid, 'songs');

        // Apply formatting one last time on save
        const finalChords = formatChords(chords);

        const newSong: Omit<Song, 'id'> = {
            userId: user.uid,
            title,
            artist,
            chords: finalChords,
            uploadDate: new Date().toISOString(),
            variations: [],
        };
        
        try {
            const docRef = await addDocumentNonBlocking(songsCollectionRef, newSong);
            setDocumentNonBlocking(doc(firestore, 'users', user.uid, 'songs', docRef.id), { id: docRef.id }, { merge: true });

            toast({
                title: "Song Submitted!",
                description: "Your new song has been added successfully.",
            });
            
            router.push('/dashboard/songs');

        } catch (error) {
            console.error("Error creating song:", error);
            toast({
                variant: "destructive",
                title: "Submission Error",
                description: "There was a problem saving your song.",
            });
        } finally {
            setIsSubmitting(false);
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
