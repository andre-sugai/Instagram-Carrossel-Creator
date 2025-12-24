export enum AspectRatio {
  SQUARE = '1:1',
  PORTRAIT = '4:5',
  STORY = '9:16'
}

export enum Vibe {
  MINIMALIST = 'Minimalista',
  BOLD = 'Bold & Moderno',
  RETRO = 'Retro 90s',
  NEON = 'Cyberpunk Neon',
  PASTEL = 'Pastel Soft',
  PROFESSIONAL = 'Corporativo',
  DARK_MODE = 'Dark Luxury'
}

export enum TextLayout {
  CENTER = 'center',
  TOP_LEFT = 'top_left',
  TOP_CENTER = 'top_center',
  TOP_RIGHT = 'top_right',
  BOTTOM_LEFT = 'bottom_left',
  BOTTOM_CENTER = 'bottom_center',
  BOTTOM_RIGHT = 'bottom_right',
  MIDDLE_LEFT = 'middle_left',
  MIDDLE_RIGHT = 'middle_right'
}

export type ContainerScope = 'both' | 'title' | 'body';

export interface SlideStyle {
  showTitle: boolean;
  showBody: boolean;
  
  // Title Styling
  titleFont: string;
  titleSize: number;
  titleColor: string;
  titleOffsetX: number;
  titleOffsetY: number;
  titleScale: number;
  // Title Background
  titleBgEnabled: boolean;
  titleBgColor: string;
  titleBgOpacity: number;
  titleBgGradient: string | null;
  titleBgRadius: number;
  titleBgWidth: number;     // 0 = Auto, >0 = %
  titleBgPaddingX: number;  // Horizontal Padding
  titleBgPaddingY: number;  // Vertical Padding (Height control)

  // Body Styling
  bodyFont: string;
  bodySize: number;
  bodyColor: string;
  bodyOffsetX: number;
  bodyOffsetY: number;
  bodyScale: number;
  // Body Background
  bodyBgEnabled: boolean;
  bodyBgColor: string;
  bodyBgOpacity: number;
  bodyBgGradient: string | null;
  bodyBgRadius: number;
  bodyBgWidth: number;      // 0 = Auto, >0 = %
  bodyBgPaddingX: number;   // Horizontal Padding
  bodyBgPaddingY: number;   // Vertical Padding (Height control)

  // Container/Background Styling
  containerColor: string;
  containerOpacity: number;
  containerBlur: number;
  containerRadius: number;
  containerWidth: number;
  containerHeight: number;
  containerScope: ContainerScope;
  containerGradient: string | null;
  isTransparent: boolean;

  // Image Styling
  imageBrightness: number;
  imageSaturation: number;
  imageScale: number;
  imageOffsetX: number;
  imageOffsetY: number;
  imageRepeat: boolean; // New: Vertical Repeat
}

export interface SlideContent {
  id: number;
  title: string;
  body: string;
  imagePrompt: string;
  imageUrl?: string;
  isLoadingImage?: boolean;
  layout: TextLayout;
  customStyle?: Partial<SlideStyle>; // Overrides global settings if present
}

export interface CarouselConfig {
  topic: string;
  vibe: Vibe;
  aspectRatio: AspectRatio;
  slideCount: number;
}

export interface SavedCarousel {
  id: string;
  timestamp: number;
  title?: string; // Custom title for the project
  topic: string;
  vibe: Vibe;
  aspectRatio: AspectRatio;
  slides: SlideContent[];
  caption: string;
  globalStyle: SlideStyle;
}