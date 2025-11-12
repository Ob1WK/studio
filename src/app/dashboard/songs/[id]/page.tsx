'use client';

import { useRouter } from 'next/navigation';
import { useUser, useDoc, useFirestore, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Song } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
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
} from '@/components/ui/alert-dialog';

export default function SongDetailPage({ params }: { params: { id: string } }) {
  const { id: songId } = params;
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [chords, setChords] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const songRef = useMemoFirebase(() => {
    if (!songId) return null;
    // Songs are now in a top-level collection
    return doc(firestore, 'songs', songId);
  }, [firestore, songId]);

  const { data: song, isLoading, error } = useDoc<Song>(songRef);

  useEffect(() => {
    if (song) {
      setTitle(song.title);
      setArtist(song.artist);
      setChords(song.chords);
    }
  }, [song]);

  const handleSaveChanges = () => {
    if (!songRef) return;
    setIsSaving(true);
    updateDocumentNonBlocking(songRef, {
      title,
      artist,
      chords,
    });
    toast({
      title: 'Song Updated',
      description: `"${title}" has been saved.`,
    });
    setIsSaving(false);
  };
  
   const handleDeleteSong = () => {
    if (!songRef) return;
    deleteDocumentNonBlocking(songRef);
    toast({
        title: 'Song Deleted',
        description: `"${title}" has been removed.`,
        variant: 'destructive'
    });
    router.push('/dashboard/songs');
   }


  if (isLoading) {
    return <div className="container mx-auto max-w-4xl text-center p-8">Loading song...</div>;
  }

  if (error || !song) {
    return <div className="container mx-auto max-w-4xl text-center p-8 text-destructive">Could not load song. It may not exist or you don't have permission to view it.</div>;
  }
  
  const isOwner = user && song && user.uid === song.userId;


  return (
    <div className="container mx-auto max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <Label htmlFor="title" className="text-xs text-muted-foreground">Title</Label>
              <Input id="title" value={title} onChange={e => setTitle(e.target.value)} className="text-4xl font-headline font-bold h-auto p-0 border-0 shadow-none focus-visible:ring-0" disabled={!isOwner} />
              <Label htmlFor="artist" className="text-xs text-muted-foreground mt-2">Artist</Label>
              <Input id="artist" value={artist} onChange={e => setArtist(e.target.value)} className="text-xl text-muted-foreground mt-1 p-0 border-0 shadow-none focus-visible:ring-0 h-auto" disabled={!isOwner} />
            </div>
             {isOwner && (
                <div className="flex gap-2">
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                        <Save className="mr-2" /> {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon">
                                <Trash2 />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the song
                                    "{song.title}".
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteSong} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Label htmlFor="chords" className="text-xs text-muted-foreground">Chords & Lyrics</Label>
          <Textarea
            id="chords"
            value={chords}
            onChange={e => setChords(e.target.value)}
            className="font-code text-sm whitespace-pre-wrap leading-relaxed min-h-[50vh] mt-1"
            disabled={!isOwner}
          />
        </CardContent>
      </Card>

      {/* Community variations can be re-implemented here later */}
    </div>
  );
}
