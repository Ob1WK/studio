'use server';
/**
 * @fileOverview A flow to import song data from a lacuerda.net URL.
 * 
 * - importSong - A function that scrapes a URL to get song details.
 * - ImportSongInput - The input type for the importSong function.
 * - ImportSongOutput - The return type for the importSong function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ImportSongInputSchema = z.object({
  url: z.string().url().describe('The URL of the song page on lacuerda.net'),
});
export type ImportSongInput = z.infer<typeof ImportSongInputSchema>;

const ImportSongOutputSchema = z.object({
  title: z.string().describe('The title of the song.'),
  artist: z.string().describe('The artist of the song.'),
  chords: z.string().describe('The full content of the song with chords and lyrics.'),
});
export type ImportSongOutput = z.infer<typeof ImportSongOutputSchema>;

// This is the exported function that the client will call.
export async function importSong(input: ImportSongInput): Promise<ImportSongOutput> {
  return importSongFlow(input);
}

// This is the Genkit flow definition.
const importSongFlow = ai.defineFlow(
  {
    name: 'importSongFlow',
    inputSchema: ImportSongInputSchema,
    outputSchema: ImportSongOutputSchema,
  },
  async (input) => {
    // Fetch the HTML content from the URL
    const response = await fetch(input.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }
    const html = await response.text();

    // Basic parsing to extract title, artist, and chords.
    // This is brittle and depends on lacuerda.net's HTML structure.
    const titleMatch = html.match(/<div id="_titulo">(.*?)<\/div>/);
    const artistMatch = html.match(/<div id="_artista">(?:<a.*?>)?(.*?)(?:<\/a>)?<\/div>/);
    const chordsMatch = html.match(/<pre id="_ce" class="ce">([\s\S]*?)<\/pre>/);

    const title = titleMatch ? titleMatch[1].trim() : 'Unknown Title';
    const artist = artistMatch ? artistMatch[1].trim() : 'Unknown Artist';
    let chordsContent = chordsMatch ? chordsMatch[1] : '';

    if (!chordsContent) {
      throw new Error('Could not find chord information on the page.');
    }

    // Clean up the chord content: remove HTML tags and HTML entities
    chordsContent = chordsContent.replace(/<a.*?>/g, '').replace(/<\/a>/g, ''); // remove links
    chordsContent = chordsContent.replace(/&lt;/g, '<').replace(/&gt;/g, '>'); // decode html entities

    // Regex to find chords (one or more uppercase letters, optionally with #, b, m, 7, etc.)
    // This is a simplified regex. A more robust one might be needed for complex chords.
    const chordRegex = /([A-G](?:#|b)?(?:m|maj|min|dim|aug|sus)?[0-9]*)/g;

    const lines = chordsContent.split('\n');
    const processedLines = lines.map(line => {
        // If a line contains lyrics (heuristically: has lowercase letters), don't process it.
        if (/[a-z]/.test(line)) {
            return line;
        }
        // Otherwise, assume it's a chord line and wrap chords in brackets.
        return line.replace(chordRegex, '[$1]');
    });

    const chords = processedLines.join('\n');

    return {
      title,
      artist,
      chords,
    };
  }
);
