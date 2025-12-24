import { AspectRatio, Vibe, TextLayout, SlideStyle } from './types';

export const ASPECT_RATIOS = [
  { value: AspectRatio.SQUARE, label: 'Quadrado (1:1)', class: 'aspect-square' },
  { value: AspectRatio.PORTRAIT, label: 'Retrato (4:5)', class: 'aspect-[4/5]' },
  { value: AspectRatio.STORY, label: 'Story (9:16)', class: 'aspect-[9/16]' },
];

export const VIBES = [
  { value: Vibe.MINIMALIST, label: 'Minimalista', color: 'bg-gray-200 text-gray-900' },
  { value: Vibe.BOLD, label: 'Bold', color: 'bg-black text-white border border-white' },
  { value: Vibe.NEON, label: 'Neon', color: 'bg-purple-900 text-green-400 border border-green-400' },
  { value: Vibe.PASTEL, label: 'Pastel', color: 'bg-pink-100 text-pink-800' },
  { value: Vibe.RETRO, label: 'Retro', color: 'bg-orange-200 text-blue-800' },
  { value: Vibe.PROFESSIONAL, label: 'Pro', color: 'bg-blue-900 text-white' },
  { value: Vibe.DARK_MODE, label: 'Dark', color: 'bg-zinc-900 text-zinc-300' },
];

export const FONT_OPTIONS = [
  { label: 'Inter (Padrão)', value: 'Inter, sans-serif' },
  { label: 'Montserrat (Moderno)', value: 'Montserrat, sans-serif' },
  { label: 'Playfair (Elegante)', value: '"Playfair Display", serif' },
  { label: 'Merriweather (Clássico)', value: 'Merriweather, serif' },
  { label: 'Oswald (Impacto)', value: 'Oswald, sans-serif' },
  { label: 'Pacifico (Manuscrito)', value: 'Pacifico, cursive' },
  { label: 'Roboto Mono (Tech)', value: '"Roboto Mono", monospace' },
  { label: 'Abril Fatface (Bold)', value: '"Abril Fatface", cursive' },
];

export const LAYOUT_CLASSES: Record<TextLayout, string> = {
  [TextLayout.CENTER]: 'justify-center items-center text-center',
  [TextLayout.TOP_LEFT]: 'justify-start items-start text-left',
  [TextLayout.TOP_CENTER]: 'justify-start items-center text-center',
  [TextLayout.TOP_RIGHT]: 'justify-start items-end text-right',
  [TextLayout.MIDDLE_LEFT]: 'justify-center items-start text-left',
  [TextLayout.MIDDLE_RIGHT]: 'justify-center items-end text-right',
  [TextLayout.BOTTOM_LEFT]: 'justify-end items-start text-left',
  [TextLayout.BOTTOM_CENTER]: 'justify-end items-center text-center',
  [TextLayout.BOTTOM_RIGHT]: 'justify-end items-end text-right',
};

export const GRADIENT_PRESETS = [
  { name: 'Sunset', value: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)' },
  { name: 'Ocean', value: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
  { name: 'Purple', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: 'Nature', value: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)' },
  { name: 'Dark', value: 'linear-gradient(135deg, #232526 0%, #414345 100%)' },
  { name: 'Glass', value: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 100%)' },
  { name: 'Instagram', value: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' },
  { name: 'Midnight', value: 'linear-gradient(to right, #0f2027, #203a43, #2c5364)' }
];

export const DEFAULT_STYLE: SlideStyle = {
  showTitle: true,
  showBody: true,
  
  // Title Defaults
  titleFont: 'Inter, sans-serif',
  titleSize: 28,
  titleColor: '#ffffff',
  titleOffsetX: 0,
  titleOffsetY: 0,
  titleScale: 100,
  titleBgEnabled: false,
  titleBgColor: '#000000',
  titleBgOpacity: 1,
  titleBgGradient: null,
  titleBgRadius: 8,
  titleBgWidth: 0,
  titleBgPaddingX: 16,
  titleBgPaddingY: 8,

  // Body Defaults
  bodyFont: 'Montserrat, sans-serif',
  bodySize: 16,
  bodyColor: '#e4e4e7', // zinc-200
  bodyOffsetX: 0,
  bodyOffsetY: 0,
  bodyScale: 100,
  bodyBgEnabled: false,
  bodyBgColor: '#000000',
  bodyBgOpacity: 1,
  bodyBgGradient: null,
  bodyBgRadius: 8,
  bodyBgWidth: 0,
  bodyBgPaddingX: 16,
  bodyBgPaddingY: 8,

  // Container Defaults
  containerColor: '#000000',
  containerOpacity: 0.6,
  containerBlur: 4, 
  containerRadius: 12, 
  containerWidth: 100, 
  containerHeight: 0, // 0 = Auto
  containerScope: 'both', 
  containerGradient: null,
  isTransparent: false,

  // Image Defaults
  imageBrightness: 100, 
  imageSaturation: 100, 
  imageScale: 100, 
  imageOffsetX: 0,
  imageOffsetY: 0,
  imageRepeat: false,
};

export const INITIAL_SLIDES_COUNT = 5;

export const GOOGLE_FONTS_URL = "https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Inter:wght@300;400;500;600;700;800;900&family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&family=Montserrat:wght@400;600;800&family=Oswald:wght@400;700&family=Pacifico&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Roboto+Mono:wght@400;700&display=swap";