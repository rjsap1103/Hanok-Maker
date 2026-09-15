export interface AIGalleryCardData {
  id: string;
  title: string;
  category: 'HANOK' | 'ARCHITECTURE' | 'DETAIL' | 'LANDSCAPE' | 'MATERIAL' | 'CONCEPT';
  imagePlaceholderColor: string;
  aiTool: string;
  prompt: string;
  style: string;
}

export const DUMMY_GALLERY_ITEMS: AIGalleryCardData[] = [
  {
    id: 'ai-1',
    title: 'DUSK OVER SERENE PAVILION',
    category: 'HANOK',
    imagePlaceholderColor: '#36454F',
    aiTool: 'Midjourney v6.1',
    prompt: 'Korean hanok pavilion at dusk, celadon jade tiles glowing softly, charcoal wood texture, hyper-detailed architectural photograph',
    style: 'Neo-Korean Architectural Realism',
  },
  {
    id: 'ai-2',
    title: 'MINIMALIST WOOD JOINERY',
    category: 'DETAIL',
    imagePlaceholderColor: '#4B3621',
    aiTool: 'DALL-E 3',
    prompt: 'Macro photography of interlocking Korean mortise and tenon wooden joint, deep grain, natural sunlight, depth of field',
    style: 'Structural Detail Macro',
  },
  {
    id: 'ai-3',
    title: 'MISTY MOUNTAIN SANCTUARY',
    category: 'LANDSCAPE',
    imagePlaceholderColor: '#2F4F4F',
    aiTool: 'Flux.1 Schnell',
    prompt: 'Hanok courtyard overlooking pine forest covered in morning fog, stone path, tranquil atmosphere, cinematic lighting',
    style: 'Atmospheric Landscape',
  },
  {
    id: 'ai-4',
    title: 'MODERN STEEL & HANOK ROOF',
    category: 'ARCHITECTURE',
    imagePlaceholderColor: '#2c3e50',
    aiTool: 'Midjourney v6.1',
    prompt: 'Contemporary glass museum embedded with curved Korean traditional hip-and-gable roof structure, twilight reflections',
    style: 'Futuristic Heritage Fusion',
  },
  {
    id: 'ai-5',
    title: 'RAMMED EARTH & CHARCOAL FINISH',
    category: 'MATERIAL',
    imagePlaceholderColor: '#3d312a',
    aiTool: 'Stable Diffusion XL',
    prompt: 'Close up of traditional Korean rammed earth wall, textured straw fibers, charcoal stain finish, tactility',
    style: 'Material Study',
  },
  {
    id: 'ai-6',
    title: 'CYBER-CELADON TEAHOUSE',
    category: 'CONCEPT',
    imagePlaceholderColor: '#1a3330',
    aiTool: 'Midjourney v6.1',
    prompt: 'Futuristic Korean tea room with floating hanji screens and subtle celadon neon lines, meditative zen ambiance',
    style: 'Cyber Korean Minimalism',
  },
];

export interface AIVideoCardData {
  id: string;
  title: string;
  tool: string;
  duration: string;
  tag: string;
  bgGradient: string;
}

export const DUMMY_VIDEOS: AIVideoCardData[] = [
  {
    id: 'vid-1',
    title: 'HANOK MORNING',
    tool: 'Veo 2',
    duration: '00:12',
    tag: 'VIDEO',
    bgGradient: 'linear-gradient(135deg, #202526 0%, #354e4a 100%)',
  },
  {
    id: 'vid-2',
    title: 'RAIN ON GIWA TILES',
    tool: 'Sora',
    duration: '00:18',
    tag: 'VIDEO',
    bgGradient: 'linear-gradient(135deg, #15181A 0%, #2a3c39 100%)',
  },
  {
    id: 'vid-3',
    title: 'COURTYARD SHADOWS AT DUSK',
    tool: 'Kling 1.5',
    duration: '00:15',
    tag: 'VIDEO',
    bgGradient: 'linear-gradient(135deg, #2b1f24 0%, #4B2438 100%)',
  },
  {
    id: 'vid-4',
    title: 'WOODEN JOINERY TIME-LAPSE',
    tool: 'Runway Gen-3',
    duration: '00:24',
    tag: 'VIDEO',
    bgGradient: 'linear-gradient(135deg, #261f1c 0%, #C56A3D 100%)',
  },
];
