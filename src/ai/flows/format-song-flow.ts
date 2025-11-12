'use server';
/**
 * @fileOverview An AI flow to format song lyrics and chords.
 *
 * - formatSong - A function that takes raw song text and formats it by wrapping chords in brackets.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const FormatSongInputSchema = z.object({
  rawContent: z.string().describe('The raw song content with chords and lyrics, potentially mixed.'),
});
export type FormatSongInput = z.infer<typeof FormatSongInputSchema>;

const FormatSongOutputSchema = z.object({
  formattedContent: z.string().describe('The formatted song content with chords wrapped in square brackets.'),
});
export type FormatSongOutput = z.infer<typeof FormatSongOutputSchema>;


export async function formatSong(input: FormatSongInput): Promise<FormatSongOutput> {
    const flow = ai.defineFlow(
      {
        name: 'formatSongFlow',
        inputSchema: FormatSongInputSchema,
        outputSchema: FormatSongOutputSchema,
      },
      async (input) => {
        
        const prompt = `You are an expert musician and your task is to format song sheets.
        You will be given raw text that contains lyrics and chords, often with chords on lines above the lyrics.
        Your goal is to identify the chords and wrap them in square brackets. Do not modify the lyrics.
        A chord is typically a combination of letters (A-G), possibly with sharps (#) or flats (b), and may include numbers or symbols like 'm', 'maj', 'dim', 'sus', 'aug', 'add'.
        
        For example, if you see:
        
            C#m7        F#7
        Él es Jesús Hijo de Dios
                A            G#7
        Y en El nada se puede perder
        
        You should format the chord lines, but leave the lyric lines as they are. The output should be:
        
        [C#m7]        [F#7]
        Él es Jesús Hijo de Dios
                [A]            [G#7]
        Y en El nada se puede perder

        Only wrap the chords. Do not alter spacing or line breaks.

        Here is the raw content:
        
        {{rawContent}}
        `;

        const { output } = await ai.generate({
            prompt,
            model: 'googleai/gemini-2.5-flash',
            input: {
                rawContent: input.rawContent
            },
            output: {
              schema: FormatSongOutputSchema
            }
        });
        
        return output;
      }
    );

    return await flow(input);
}
