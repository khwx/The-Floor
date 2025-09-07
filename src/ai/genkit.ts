import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
});

export const model = googleAI.model('gemini-2.5-flash');
