'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";
import type { Song } from "@/lib/types";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { formatSong } from "@/ai/flows/format-song-flow";

export default function NewSongPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { user } = useUser();
    const firestore = useFirestore();

    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState('');
    const [chords, setChords] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFormatting, setIsFormatting] = useState(false);

    const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const pastedText = e.clipboardData.getData('text');
        e.preventDefault();
        setIsFormatting(true);
        setChords("Formatting with AI... please wait.");
        try {
            const result = await formatSong({ rawContent: pastedText });
            setChords(result.formattedContent);
        } catch (error) {
            console.error("AI formatting failed:", error);
            toast({
                variant: "destructive",
                title: "Formatting Failed",
                description: "Could not format chords. Please format manually or try pasting again.",
            });
            setChords(pastedText); // Revert to pasted text on failure
        } finally {
            setIsFormatting(false);
        }
    };
    
    const handleFormatButtonClick = async () => {
        if (!chords || isFormatting) return;
        setIsFormatting(true);
        const currentContent = chords;
        setChords("Formatting with AI... please wait.");
        try {
            const result = await formatSong({ rawContent: currentContent });
            setChords(result.formattedContent);
        } catch (error) {
            console.error("AI formatting failed:", error);
            toast({
                variant: "destructive",
                title: "Formatting Failed",
                description: "Could not format chords. Please format manually or try again.",
            });
            setChords(currentContent); // Revert on failure
        } finally {
            setIsFormatting(false);
        }
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
        
        const songId = uuidv4();
        const songRef = doc(firestore, 'users', user.uid, 'songs', songId);

        const newSong: Omit<Song, 'id'> & { id: string } = {
            id: songId,
            userId: user.uid,
            title,
            artist,
            chords: chords,
            uploadDate: new Date().toISOString(),
            variations: [],
        };
        
        try {
            setDocumentNonBlocking(songRef, newSong, { merge: false });

            toast({
                title: "Song Submitted!",
                description: "Your new song has been added successfully.",
            });
            
            setTimeout(() => router.push('/dashboard/songs'), 500);

        } catch (error) {
            console.error("Error creating song:", error);
            toast({
                variant: "destructive",
                title: "Submission Error",
                description: "There was a problem saving your song.",
            });
             setIsSubmitting(false);
        }
    }

    return (
        <div className="container mx-auto">
            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Add a New Song</CardTitle>
                        <CardDescription>Fill in the details below. Paste lyrics and chords, and we'll use AI to format them for you on paste.</CardDescription>
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
                                placeholder="Paste your song here and AI will format it..."
                                className="font-code"
                                required
                                value={chords}
                                onChange={(e) => setChords(e.target.value)}
                                onPaste={handlePaste}
                                disabled={isFormatting}
                            />
                            <p className="text-sm text-muted-foreground">
                                Chords will be automatically placed into `[Brackets]` on paste. You can also <Button variant="link" type="button" onClick={handleFormatButtonClick} className="p-0 h-auto" disabled={isFormatting}>
                                    {isFormatting ? <Loader2 className="mr-2 animate-spin" /> : null}
                                    format manually
                                </Button>.
                            </p>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" type="button" onClick={() => router.back()} disabled={isSubmitting}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting || isFormatting}>
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
