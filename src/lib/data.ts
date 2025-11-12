import type { User, Song, Playlist, Variation } from './types';

export const users: User[] = [
  { id: 'user-1', name: 'John Doe', email: 'john@example.com', avatarUrl: 'https://picsum.photos/seed/avatar1/200/200' },
  { id: 'user-2', name: 'Jane Smith', email: 'jane@example.com', avatarUrl: 'https://picsum.photos/seed/avatar2/200/200' },
];

export const variations: Variation[] = [
    {
        id: 'var-1',
        content: `[Verse 1]
[C]Amazing grace how [G]sweet the sound
That [C]saved a wretch like [F]me
I [C]once was lost but [G]now am found
Was [C]blind but now I [F]see`,
        author: users[1],
        createdAt: '2023-10-26T10:00:00Z',
    }
]

export const songs: Song[] = [
  {
    id: 'song-1',
    title: 'Amazing Grace',
    artist: 'John Newton',
    author: users[0],
    variations: variations,
    content: `
[Verse 1]
[G]Amazing grace how [C]sweet the sound
That [G]saved a wretch like [D]me
I [G]once was lost but [C]now am found
Was [G]blind but [D]now I [G]see

[Verse 2]
[G]'Twas grace that taught my [C]heart to fear
And [G]grace my fears re[D]lieved
How [G]precious did that [C]grace appear
The [G]hour I [D]first be[G]lieved
`
  },
  {
    id: 'song-2',
    title: '10,000 Reasons (Bless the Lord)',
    artist: 'Matt Redman',
    author: users[1],
    variations: [],
    content: `
[Chorus]
[C]Bless the Lord oh my [G]soul
Oh my [D]soul
Worship His holy [Em]name
Sing like [C]never be[G]fore
Oh my [D]soul
I'll worship Your holy [C]name [G] [D]

[Verse 1]
The [C]sun comes [G]up
It's a [D]new day [Em]dawning
It's [C]time to [G]sing Your [D]song a[Em]gain
What[C]ever may [G]pass
And what[D]ever lies be[Em]fore me
Let me be [C]singing when the [G]evening [D]comes
`
  },
    {
    id: 'song-3',
    title: 'How Great Thou Art',
    artist: 'Carl Boberg',
    author: users[0],
    variations: [],
    content: `
[Verse 1]
[A]O Lord my God, when [D]I in awesome [A]wonder
Consider all the [E7]worlds Thy hands have [A]made
I see the stars, I [D]hear the rolling [A]thunder
Thy power through[E7]out the universe dis[A]played

[Chorus]
Then sings my soul, my [D]Savior God, to [A]Thee
How great Thou art, how [E7]great Thou [A]art
Then sings my soul, my [D]Savior God, to [A]Thee
How great Thou [E7]art, how great Thou [A]art
`
  },
];

export const playlists: Playlist[] = [
  {
    id: 'playlist-1',
    name: 'Sunday Morning Worship',
    description: 'Setlist for this week\'s main service.',
    songs: [songs[0], songs[1]],
    author: users[0],
    coverArtUrl: 'https://picsum.photos/seed/sunday/400/400',
  },
  {
    id: 'playlist-2',
    name: 'Acoustic Rehearsal',
    description: 'Acoustic versions for practice.',
    songs: [songs[2], songs[0]],
    author: users[0],
    coverArtUrl: 'https://picsum.photos/seed/acoustic/400/400',
  },
];
