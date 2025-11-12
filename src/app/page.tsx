import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Music, Users, ListMusic, Share2 } from 'lucide-react';
import { Logo } from '@/components/logo';

const features = [
  {
    icon: <Music className="h-8 w-8 text-primary" />,
    title: 'Upload Songs',
    description: 'Easily upload your songs with lyrics and chord progressions for everyone to learn.',
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: 'Community Variations',
    description: 'Collaborate with the community by sharing and discovering different variations of songs.',
  },
  {
    icon: <ListMusic className="h-8 w-8 text-primary" />,
    title: 'Create Playlists',
    description: 'Organize your favorite songs into personal playlists for rehearsals, services, or quiet time.',
  },
  {
    icon: <Share2 className="h-8 w-8 text-primary" />,
    title: 'Share with Friends',
    description: 'Share your favorite songs and playlists with your band, friends, and community.',
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-headline font-bold">HolyHarmonies</h1>
        </div>
        <nav>
          <Button asChild variant="ghost">
            <Link href="/login">Log In</Link>
          </Button>
          <Button asChild className="ml-2">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-grow">
        <section className="text-center py-20 lg:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-6xl font-headline font-bold tracking-tight">
              Your Digital Hymnal, Reimagined
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
              Create, share, and collaborate on Christian music. Build playlists for worship and grow together in harmony.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/signup">Get Started for Free</Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 lg:py-24 bg-secondary">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h3 className="text-3xl font-headline font-bold">Everything You Need to Make Music</h3>
              <p className="mt-2 text-muted-foreground">All in one simple, beautiful platform.</p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <Card key={feature.title} className="text-center shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="mx-auto bg-primary/10 rounded-full h-16 w-16 flex items-center justify-center">
                      {feature.icon}
                    </div>
                    <CardTitle className="mt-4 font-headline">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        <section className="text-center py-20 lg:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-lg overflow-hidden">
                <Image
                    src="https://picsum.photos/seed/worship/1200/600"
                    alt="Worship concert"
                    width={1200}
                    height={600}
                    className="w-full h-auto object-cover"
                    data-ai-hint="worship concert"
                />
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center p-8">
                    <h3 className="text-4xl font-headline font-bold text-white">Join a Growing Community</h3>
                    <p className="mt-2 text-lg text-white/90 max-w-xl">Connect with fellow musicians, share your heart of worship, and find inspiration for your next service.</p>
                    <Button asChild size="lg" className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90">
                        <Link href="/signup">Start Your Journey Today</Link>
                    </Button>
                </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 bg-secondary">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} HolyHarmonies. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
