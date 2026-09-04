// Garante compatibilidade com GOOGLE_GENAI_API_KEY e GEMINI_API_KEY (Vercel usa qualquer uma)
if (!process.env.GOOGLE_GENAI_API_KEY && process.env.GEMINI_API_KEY) {
  process.env.GOOGLE_GENAI_API_KEY = process.env.GEMINI_API_KEY;
}

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
});

export const model = googleAI.model('gemini-2.5-flash');
