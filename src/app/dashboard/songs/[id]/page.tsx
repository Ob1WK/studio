'use client';

import { useRouter } from 'next/navigation';
import { useUser, useDoc, useFirestore, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking, useCollection } from '@/firebase';
import { doc, collection, query } from 'firebase/firestore';
import type { Song, Variation } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Trash2, GitBranchPlus, User as UserIcon } from 'lucide-react';
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
import { AddVariationDialog } from '@/components/AddVariationDialog';
import Link from 'next/link';
import { format } from 'date-fns'; // Import format from date-fns

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
    return doc(firestore, 'songs', songId);
  }, [firestore, songId]);

  const variationsQuery = useMemoFirebase(() => {
    if (!songId) return null;
    return query(collection(firestore, 'songs', songId, 'variations'));
  }, [firestore, songId]);

  const { data: song, isLoading, error } = useDoc<Song>(songRef);
  const { data: variations, isLoading: variationsLoading } = useCollection<Variation>(variationsQuery);

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
      <Card className="mb-8">
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

      <section className="mt-8">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-headline font-semibold">Community Variations</h2>
            {user && <AddVariationDialog songId={songId} />}
        </div>
        {variationsLoading ? (
            <p>Loading variations...</p>
        ) : variations && variations.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
                {variations.map(variation => (
                    <Card key={variation.id}>
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">Variation by <Link href={`/profile/${variation.userId}`} className="underline">{variation.userId}</Link></CardTitle>
                            <CardDescription className="flex items-center gap-2 text-sm">
                                <UserIcon className="h-3 w-3" />
                                Submitted on {format(new Date(variation.submissionDate), 'PPP')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <pre className="font-code text-sm whitespace-pre-wrap leading-relaxed bg-secondary p-4 rounded-md max-h-60 overflow-auto">
                                {variation.variationText.trim()}
                            </pre>
                        </CardContent>
                    </Card>
                ))}
            </div>
        ) : (
            <Card className="text-center p-12 border-dashed">
                <GitBranchPlus className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="text-xl font-semibold mt-4">No Variations Yet</h3>
                <p className="text-muted-foreground mt-2">Be the first to add a variation to this song!</p>
                {user && <AddVariationDialog songId={songId} />}
            </Card>
        )}
      </section>
    </div>
  );
}