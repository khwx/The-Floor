import { Landmark, FlaskConical, Rabbit, HelpCircle, BrainCircuit, Atom, Film, Globe, Milestone } from 'lucide-react';
import type { ComponentType } from 'react';

export const themeIcons: Record<string, ComponentType<{ className?: string }>> = {
  'historical landmarks': Landmark,
  'science': FlaskConical,
  'animals': Rabbit,
  'general trivia': HelpCircle,
  'technology': BrainCircuit,
  'physics': Atom,
  'movies': Film,
  'geography': Globe,
  'history': Milestone,
  'default': HelpCircle,
};

export function getIconForTheme(theme: string): ComponentType<{ className?: string }> {
  const normalizedTheme = theme.toLowerCase();
  return themeIcons[normalizedTheme] || themeIcons['default'];
}
