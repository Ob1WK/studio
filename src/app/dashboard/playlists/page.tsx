import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { playlists } from '@/lib/data';
import { PlusCircle } from 'lucide-react';

export default function PlaylistsPage() {
    return (
        <div className="container mx-auto">
             <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-headline font-bold">My Playlists</h1>
                    <p className="text-muted-foreground">Your collections of songs for worship and rehearsal.</p>
                </div>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Create Playlist
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {playlists.map((playlist) => (
                    <Link href={`/dashboard/playlists/${playlist.id}`} key={playlist.id}>
                        <Card className="group overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                            <div className="relative">
                                <Image
                                    src={playlist.coverArtUrl}
                                    alt={playlist.name}
                                    width={400}
                                    height={400}
                                    className="object-cover w-full h-48 group-hover:scale-105 transition-transform duration-300"
                                    data-ai-hint="music worship"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            </div>
                            <CardHeader className="p-4 z-10 -mt-12">
                                <CardTitle className="font-headline text-lg text-white">{playlist.name}</CardTitle>
                                <CardDescription className="text-sm text-gray-300">{playlist.songs.length} songs</CardDescription>
                            </CardHeader>
                             <CardContent className="p-4 pt-0 flex-grow">
                                <p className="text-muted-foreground text-sm">{playlist.description}</p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
