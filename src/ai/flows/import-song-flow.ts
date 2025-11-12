'use server';
/**
 * @fileOverview A flow to import song data from a lacuerda.net URL.
 * 
 * - importSong - A function that scrapes a URL to get song details.
 * - ImportSongInput - The input type for the importSong function.
 * - ImportSongOutput - The return type for the importSong function.
 */

import { z } from 'zod';

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
    // Make the regex for chords more flexible by looking for an id that starts with _ce
    const chordsMatch = html.match(/<pre id="_ce[^"]*"[^>]*>([\s\S]*?)<\/pre>/);


    const title = titleMatch ? titleMatch[1].trim() : 'Unknown Title';
    const artist = artistMatch ? artistMatch[1].trim() : 'Unknown Artist';
    let chordsContent = chordsMatch ? chordsMatch[1] : '';

    if (!chordsContent) {
      throw new Error('Could not find chord information on the page.');
    }

    // Clean up the chord content: remove HTML tags and HTML entities
    chordsContent = chordsContent.replace(/<[^>]*>/g, ''); // remove all html tags
    chordsContent = chordsContent.replace(/&lt;/g, '<').replace(/&gt;/g, '>'); // decode html entities

    // Regex to find chords. This is a robust regex that handles various chord formats.
    const chordRegex = /[A-G](?:#|b)?(?:m|maj|min|dim|aug|sus)?[0-9]?(?:\/[A-G](?:#|b)?)?/g;
    
    const lines = chordsContent.split('\n');
    const processedLines = lines.map(line => {
        // If a line is empty or just a comment, return it as is.
        if (line.trim() === '' || line.trim().startsWith('---') || line.match(/^\s*\[.*\]\s*$/)) {
            return line;
        }

        // Replace all found chords in the line with [chord]
        let processedLine = line.replace(chordRegex, (match) => {
            // Check if what we found is inside a word (e.g., 'Am' in 'Amazing').
            // This is a simple heuristic to avoid marking parts of words as chords.
            // A more complex regex could handle this, but this is a good balance.
            const surroundingChars = line.charAt(line.indexOf(match) - 1) + line.charAt(line.indexOf(match) + match.length);
             if (/[a-zA-Z]/.test(surroundingChars)) {
                 return match; // It's likely part of a word, not a chord.
             }
            return `[${match}]`;
        });
        
        // Remove brackets from things that were incorrectly identified as chords
        processedLine = processedLine.replace(/\[([a-z]+)\]/g, '$1');

        return processedLine;
    });

    const chords = processedLines.join('\n');

    return {
      title,
      artist,
      chords,
    };
}
