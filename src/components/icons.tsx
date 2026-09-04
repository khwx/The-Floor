import {
  Landmark, FlaskConical, Rabbit, HelpCircle, BrainCircuit, Atom, Film, Globe, Milestone,
  Utensils, Tv, Trophy, Building2, Music, Dog, TreePine, Palette, Bike, Star, BookOpen,
  Shirt, GraduationCap, Banknote, Church, MapPin, Scale, Heart, Baby, Smile,
  Wine, Dumbbell, Train, Crown, Drama, Mic, PawPrint, Scissors,
  Apple, Award, Box, Calculator, Calendar, Camera, Gamepad2, Bird, Waves, Users,
  Lightbulb, Compass, Flame, Bug, Fish, Cog, Flag,
  type LucideIcon
} from 'lucide-react';

const themeIcons: Record<string, LucideIcon> = {
  // Português - mapeamento de categories.ts
  'figuras notáveis': Star,
  'realizadores internacionais': Film,
  'frutas': Apple,
  'eletrodomésticos e utensílios': Cog,
  'invenções': Lightbulb,
  'dispositivos médicos': Flame,
  'casamento': Heart,
  'mamíferos': Rabbit,
  'programas de tv': Tv,
  'emblemas de clubes desportivos': Trophy,
  'topografia estrangeira': Globe,
  'padaria e pastelaria': Utensils,
  'vencedores de óscares': Award,
  'edifícios e construções icónicas': Building2,
  'comediantes': Smile,
  'cantores portugueses': Mic,
  'gaveta de tralhas': Box,
  'vegetais': TreePine,
  'decoração de interiores': Palette,
  'desportos e modalidades': Dumbbell,
  'plantas': TreePine,
  'obras de arte mundiais': Palette,
  'lazer e tempo livre': Gamepad2,
  'bandeiras': Flag,
  'operações aritméticas': Calculator,
  'capas de álbuns': Music,
  'equipamentos de futebol': Dumbbell,
  'música brasileira': Music,
  'tradições e costumes portugueses': Landmark,
  'insetos e rastejantes': Bug,
  'roupas e acessórios': Shirt,
  'profissões': GraduationCap,
  'notas e moedas': Banknote,
  'religião': Church,
  'atrações turísticas mundiais': MapPin,
  'políticos do século xx': Scale,
  'políticos portugueses': Scale,
  'lanches': Utensils,
  'equipamentos desportivos': Dumbbell,
  'transportes': Train,
  'membros da realeza': Crown,
  'cinema a preto e branco': Film,
  'regresso às aulas': BookOpen,
  'inglês': BookOpen,
  'líderes mundiais': Globe,
  'duplas famosas': Users,
  'figuras mitológicas': Star,
  'títulos de filmes': Film,
  'casais famosos': Heart,
  'bebés e crianças': Baby,
  'festival da canção': Mic,
  'rappers': Mic,
  'mecânica de automóveis': Cog,
  'futebolistas estrangeiros': Dumbbell,
  'pássaros': Bird,
  'praia': Waves,
  'treinadores de futebol': Dumbbell,
  'personagens de cinema': Drama,
  'escritores portugueses': BookOpen,
  'instrumentos musicais': Music,
  'povos do mundo': Globe,
  'aperitivos': Utensils,
  'estrelas de cinema e tv dos anos 80': Star,
  'jogos e brinquedos': Gamepad2,
  'sobremesas e doces': Apple,
  'bandas': Music,
  'futebolistas portugueses': Dumbbell,
  'atletas olímpicos portugueses': Trophy,
  'música popular portuguesa': Music,
  'mercearia': Utensils,
  'figuras públicas internacionais': Star,
  'radialistas e animadores': Mic,
  'especiarias e condimentos': Utensils,
  'gastronomia portuguesa': Utensils,
  'símbolos e pictogramas': Compass,
  'fotografias históricas': Camera,
  'ilhas e arquipélagos': Globe,
  'capitais do mundo': MapPin,
  'animais aquáticos': Fish,
  'tecnologia e jogos': Gamepad2,
  'ciclismo': Bike,
  'jogadores de basquetebol': Dumbbell,
  'flores': TreePine,
  'cantoras internacionais': Mic,
  'raças de cães': Dog,
  'material de laboratório': FlaskConical,
  'atrizes': Drama,
  'espanhol': BookOpen,
  'música dos anos 80': Music,
  'jogadores de ténis': Dumbbell,
  'tabela periódica': Atom,
  'estádios de futebol': Dumbbell,
  'ferramentas e bricolage': Scissors,
  'pratos internacionais': Utensils,
  'corpo humano': Flame,
  'animais famosos': PawPrint,
  'espaço e astronomia': Globe,
  'eventos e datas comemorativas': Calendar,
  'monumentos nacionais': Landmark,
  'cantores internacionais': Mic,

  // English fallback
  'historical landmarks': Landmark,
  'science': FlaskConical,
  'animals': Rabbit,
  'general trivia': HelpCircle,
  'technology': BrainCircuit,
  'physics': Atom,
  'movies': Film,
  'geography': Globe,
  'history': Milestone,
  'food': Utensils,
  'music': Music,
  'sports': Dumbbell,
  'nature': TreePine,
  'art': Palette,
  'space': Globe,
};

function fuzzyMatch(theme: string): LucideIcon | null {
  const lower = theme.toLowerCase();
  if (themeIcons[lower]) return themeIcons[lower];

  for (const [key, icon] of Object.entries(themeIcons)) {
    if (lower.includes(key) || key.includes(lower)) {
      return icon;
    }
  }

  if (/animal|mamífero|cão|gato|pássaro|peixe|inseto|cobra|raça/i.test(lower)) return Rabbit;
  if (/música|banda|cantor|rapper|instrumento|álbum|festival/i.test(lower)) return Music;
  if (/filme|cinema|série|tv|drama|ator/i.test(lower)) return Film;
  if (/desporto|futebol|basquete|ténis|ciclismo|olimp|treinador|tenis/i.test(lower)) return Dumbbell;
  if (/comida|gastronomia|fruta|vegetal|doce|padaria|especiaria|prato|lanche/i.test(lower)) return Utensils;
  if (/histór|monumento|edifício|construção|memorial/i.test(lower)) return Landmark;
  if (/arte|pintura|desenho|fotografia|museu|decoração/i.test(lower)) return Palette;
  if (/país|capital|mapa|bandeira|geografia|mundo|ilha/i.test(lower)) return Globe;
  if (/ciência|física|química|laboratório|átomo|tabela/i.test(lower)) return Atom;
  if (/espaço|planeta|estrela|astronomia|lua|sol/i.test(lower)) return Globe;
  if (/tecnologia|computador|jogo|app|programa|digital/i.test(lower)) return BrainCircuit;
  if (/profissão|trabalho|escola|universidade|estudo/i.test(lower)) return GraduationCap;
  if (/religião|igreja|catedral|mesquita/i.test(lower)) return Church;
  if (/natureza|planta|flor|árvore|floresta/i.test(lower)) return TreePine;
  if (/transporte|carro|comboio|avião|navio|bicicleta/i.test(lower)) return Train;
  if (/moda|roupa|sapato|acessório/i.test(lower)) return Shirt;
  if (/política|governo|presidente|ministro/i.test(lower)) return Scale;
  if (/livro|escritor|poeta|romance/i.test(lower)) return BookOpen;
  if (/bebida|vinho|cerveja|café/i.test(lower)) return Wine;
  if (/energia|força|potência|motor/i.test(lower)) return Flame;
  if (/mar|rio|oceano|praia|onda/i.test(lower)) return Waves;

  return null;
}

export function getIconForTheme(theme: string): LucideIcon {
  return fuzzyMatch(theme) || HelpCircle;
}
