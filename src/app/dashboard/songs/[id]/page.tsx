import { songs, users } from "@/lib/data";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Share2, Plus, ListMusic } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Textarea } from "@/components/ui/textarea";

export default function SongDetailPage({ params }: { params: { id: string } }) {
    const song = songs.find(s => s.id === params.id);
    if (!song) {
        notFound();
    }

    const currentUser = users[0];

    return (
        <div className="container mx-auto max-w-4xl">
            <div className="mb-8">
                <h1 className="text-4xl font-headline font-bold">{song.title}</h1>
                <p className="text-xl text-muted-foreground mt-1">{song.artist}</p>
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <span>Uploaded by {song.author.name}</span>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-8">
                 <Dialog>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4"/> Add to Playlist</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                        <DialogTitle>Add to Playlist</DialogTitle>
                        <DialogDescription>
                            Select a playlist to add "{song.title}" to.
                        </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                             {/* Playlist selection would go here */}
                             <p className="text-sm text-muted-foreground">Playlist functionality coming soon!</p>
                             <Button className="w-full">Add</Button>
                        </div>
                    </DialogContent>
                </Dialog>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline"><Share2 className="mr-2 h-4 w-4"/> Share</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                        <DialogTitle>Share this Song</DialogTitle>
                        <DialogDescription>
                            Copy the link below to share with your friends.
                        </DialogDescription>
                        </DialogHeader>
                        <div className="flex items-center space-x-2">
                            <Input id="link" defaultValue={`https://holyharmonies.app/songs/${song.id}`} readOnly />
                            <Button type="submit" size="sm" className="px-3">
                                <span className="sr-only">Copy</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Chords & Lyrics</CardTitle>
                </CardHeader>
                <CardContent>
                    <pre className="font-code text-sm whitespace-pre-wrap leading-relaxed">
                        {song.content.trim()}
                    </pre>
                </CardContent>
            </Card>

            <section className="mt-12">
                <h2 className="text-2xl font-headline font-semibold mb-4">Community Variations</h2>
                <Accordion type="single" collapsible className="w-full">
                {song.variations.map((variation, index) => (
                    <AccordionItem value={`item-${index}`} key={variation.id}>
                        <AccordionTrigger>
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={variation.author.avatarUrl} alt={variation.author.name} data-ai-hint="person portrait"/>
                                    <AvatarFallback>{variation.author.name.substring(0,2)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{variation.author.name}'s Version</p>
                                    <p className="text-sm text-muted-foreground">Submitted on {new Date(variation.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                           <pre className="font-code text-sm whitespace-pre-wrap leading-relaxed bg-secondary p-4 rounded-md">
                                {variation.content.trim()}
                            </pre>
                        </AccordionContent>
                    </AccordionItem>
                ))}
                </Accordion>

                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle className="font-headline">Submit Your Variation</CardTitle>
                        <CardDescription>Have a different way of playing this song? Share it with the community!</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-4">
                            <Textarea rows={10} placeholder="[Verse 1]&#10;[G]Amazing grace... " className="font-code" />
                            <Button>Submit Variation</Button>
                        </form>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
