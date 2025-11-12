'use client';
import Link from 'next/link';
import { Menu, Music, LogOut, PlusCircle, User, ListMusic, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from './logo';
import { useAuth, useUser } from '@/firebase';

export function AppHeader() {
  const auth = useAuth();
  const { user } = useUser();

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          <Logo className="h-6 w-6 text-primary" />
          <span className="sr-only">HolyHarmonies</span>
        </Link>
        <Link
          href="/dashboard"
          className="text-foreground transition-colors hover:text-foreground"
        >
          Dashboard
        </Link>
         <Link
          href="/dashboard/songs"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          My Songs
        </Link>
        <Link
          href="/dashboard/playlists"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          Playlists
        </Link>
        <Link
          href="/dashboard/explore"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          Explore
        </Link>
      </nav>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <Logo className="h-6 w-6 text-primary" />
              <span className="font-headline">HolyHarmonies</span>
            </Link>
            <Link href="/dashboard" className="hover:text-foreground">
              Dashboard
            </Link>
            <Link
                href="/dashboard/songs"
                className="text-muted-foreground hover:text-foreground"
            >
                My Songs
            </Link>
            <Link
              href="/dashboard/playlists"
              className="text-muted-foreground hover:text-foreground"
            >
              Playlists
            </Link>
             <Link
              href="/dashboard/explore"
              className="text-muted-foreground hover:text-foreground"
            >
              Explore
            </Link>
            <Link
              href="/dashboard/songs/new"
              className="text-muted-foreground hover:text-foreground"
            >
              Add Song
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 sm:flex-initial">
            <Button asChild>
                <Link href="/dashboard/songs/new"><PlusCircle/> New Song</Link>
            </Button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <Avatar>
                <AvatarImage src={user?.photoURL || "https://picsum.photos/seed/avatar1/200/200"} alt={user?.displayName || "User"} data-ai-hint="person portrait"/>
                <AvatarFallback>{user?.displayName?.substring(0,2) || user?.email?.substring(0,2)?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user?.displayName || user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link href="/dashboard/profile"><User className="mr-2 h-4 w-4"/>Profile</Link>
            </DropdownMenuItem>
             <DropdownMenuItem asChild>
                <Link href="/dashboard/songs"><ListMusic className="mr-2 h-4 w-4"/>My Songs</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <Link href="/dashboard/explore"><Search className="mr-2 h-4 w-4"/>Explore</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <Link href="/dashboard/songs/new"><PlusCircle className="mr-2 h-4 w-4"/>Add Song</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4"/>Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}