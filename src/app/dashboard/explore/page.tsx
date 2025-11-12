'use client';

import { useState } from 'react';
import { collection, query, where, getDocs, Firestore } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User } from '@/lib/types';
import Link from 'next/link';
import { Search, User as UserIcon } from 'lucide-react';

export default function ExplorePage() {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    setSearched(true);
    setResults([]);

    const usersRef = collection(firestore, 'users');
    // Firestore doesn't support full-text search. This is a basic prefix search.
    const q = query(
      usersRef,
      where('username', '>=', searchTerm),
      where('username', '<=', searchTerm + '\uf8ff')
    );

    try {
      const querySnapshot = await getDocs(q);
      const foundUsers = querySnapshot.docs.map(doc => doc.data() as User);
      setResults(foundUsers);
    } catch (error) {
      console.error('Error searching for users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-bold">Explore Community</h1>
        <p className="text-muted-foreground">Find other musicians and discover new songs.</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8 max-w-lg mx-auto">
        <Input
          type="search"
          placeholder="Search by username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow"
        />
        <Button type="submit" disabled={isLoading}>
          <Search className="mr-2 h-4 w-4" />
          {isLoading ? 'Searching...' : 'Search'}
        </Button>
      </form>

      <div>
        {isLoading && <p className="text-center">Searching for users...</p>}
        
        {!isLoading && searched && results.length === 0 && (
            <Card className="text-center p-12 border-dashed">
                <UserIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="text-xl font-semibold mt-4">No Users Found</h3>
                <p className="text-muted-foreground mt-2">Try a different search term.</p>
            </Card>
        )}

        {!isLoading && results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((user) => (
              <Link href={`/profile/${user.id}`} key={user.id}>
                <Card className="hover:bg-secondary transition-colors">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.profilePictureUrl} alt={user.username} data-ai-hint="person portrait" />
                      <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle>{user.username}</CardTitle>
                      <CardDescription>{user.email}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}