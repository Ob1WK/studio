'use client';
import { useEffect, useState } from 'react';
import { doc, collection, query, where, getDocs } from 'firebase/firestore';
import { useFirestore, useUser, useDoc, setDocumentNonBlocking } from '@/firebase';
import type { User, Song } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, GitBranchPlus, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';
import { format } from 'date-fns'; // Import format from date-fns

export default function UserProfilePage({ params }: { params: { userId: string } }) {
  const { userId } = params;
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const userRef = doc(firestore, 'users', userId);
  const { data: userProfile, isLoading: userLoading } = useDoc<User>(userRef);

  const [songs, setSongs] = useState<Song[]>([]);
  const [songsLoading, setSongsLoading] = useState(true);

  useEffect(() => {
    const fetchSongs = async () => {
      if (!userId) return;
      setSongsLoading(true);
      const songsRef = collection(firestore, 'songs');
      const q = query(songsRef, where('userId', '==', userId));
      try {
        const querySnapshot = await getDocs(q);
        const userSongs = querySnapshot.docs.map(doc => doc.data() as Song);
        setSongs(userSongs);
      } catch (error) {
        console.error("Error fetching user's songs:", error);
      } finally {
        setSongsLoading(false);
      }
    };

    fetchSongs();
  }, [userId, firestore]);
  
  const handleCopyToMySongs = (song: Song) => {
    if (!currentUser || !firestore) {
        toast({ variant: 'destructive', title: 'You must be logged in.' });
        return;
    }
    
    const songId = uuidv4();
    const newSongRef = doc(firestore, 'songs', songId);

    const newSongData: Song = {
      ...song, // copy artist, title, chords
      id: songId,
      userId: currentUser.uid, // Set current user as owner
      uploadDate: new Date().toISOString(),
      // Variations are not copied directly, as they are a subcollection
      originalSongId: song.id, // Keep track of the original
    };

    setDocumentNonBlocking(newSongRef, newSongData, { merge: false });

    toast({
      title: 'Song Copied!',
      description: `"${song.title}" has been added to your songs.`,
    });
    router.push(`/dashboard/songs/${songId}`);
  };

  // The "Create Variation" button will now navigate to the song detail page
  // where the AddVariationDialog can be used.
  const handleCreateVariation = (songId: string) => {
    router.push(`/dashboard/songs/${songId}`);
  }


  if (userLoading) {
    return <div className="container mx-auto text-center p-8">Loading profile...</div>;
  }

  if (!userProfile) {
    return <div className="container mx-auto text-center p-8 text-destructive">User not found.</div>;
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <header className="flex items-center gap-6 mb-8">
        <Avatar className="w-24 h-24">
          <AvatarImage src={userProfile.profilePictureUrl} alt={userProfile.username} data-ai-hint="person portrait" />
          <AvatarFallback>{userProfile.username.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-4xl font-headline font-bold">{userProfile.username}</h1>
          <p className="text-muted-foreground">{userProfile.email}</p>
        </div>
      </header>

      <main>
        <h2 className="text-2xl font-semibold font-headline mb-4">Shared Songs</h2>
        {songsLoading ? (
          <p>Loading songs...</p>
        ) : songs.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {songs.map(song => (
              <Card key={song.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{song.title}</CardTitle>
                      <CardDescription>{song.artist}</CardDescription>
                    </div>
                    {currentUser && currentUser.uid !== song.userId && (
                       <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleCopyToMySongs(song)}>
                            <Copy className="mr-2 h-4 w-4"/> Add to My Songs
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => handleCreateVariation(song.id)}>
                            <GitBranchPlus className="mr-2 h-4 w-4"/> Create Variation
                        </Button>
                       </div>
                    )}
                     {currentUser && currentUser.uid === song.userId && (
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/songs/${song.id}`}>Edit My Song</Link>
                        </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                    <pre className="font-code text-sm whitespace-pre-wrap leading-relaxed bg-secondary p-4 rounded-md h-48 overflow-auto">
                        {song.chords.trim()}
                    </pre>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center p-12 border-dashed">
            <h3 className="text-xl font-semibold">No Songs Shared Yet</h3>
            <p className="text-muted-foreground mt-2">{userProfile.username} hasn't shared any songs publicly.</p>
          </Card>
        )}
      </main>
    </div>
  );
}