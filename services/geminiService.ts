import { supabase } from '../lib/supabaseClient';
import { SlideContent, Vibe, AspectRatio, TextLayout } from "../types";

// Helper for image ratio mapping (still useful for prompts if needed)
const getFallbackRatio = (ratio: AspectRatio): "1:1" | "3:4" | "9:16" => {
  if (ratio === AspectRatio.PORTRAIT) return "3:4";
  if (ratio === AspectRatio.STORY) return "9:16";
  return "1:1";
};

// Helper to get auth headers for Edge Function calls
const getAuthHeaders = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  console.log('DEBUG getAuthHeaders - Session:', session ? 'Found' : 'NULL', 'Error:', error);
  console.log('DEBUG getAuthHeaders - Access Token:', session?.access_token ? `Present (${session.access_token.substring(0, 20)}...)` : 'MISSING');
  
  if (!session?.access_token) {
    throw new Error('No active session. Please log in again.');
  }
  return {
    Authorization: `Bearer ${session.access_token}`
  };
};

export const generateCarouselText = async (
  topic: string,
  vibe: Vibe,
  count: number,
  language: string = 'pt-BR'
): Promise<{ slides: SlideContent[], caption: string }> => {
  
  const headers = await getAuthHeaders();
  
  const { data, error } = await supabase.functions.invoke('generate-carousel', {
    headers,
    body: {
      action: 'carousel-text',
      topic,
      vibe,
      count,
      language
    }
  });

  if (error) {
    console.error('Edge Function Error:', error);
    throw new Error(error.message || 'Erro ao gerar carrossel');
  }
  if (data?.error) {
    console.error('Server Response Error:', data);
    throw new Error(`${data.error}${data.details ? ` - Details: ${JSON.stringify(data.details)}` : ''}`);
  }

  // Map to add IDs and initial state
  const slides = data.slides.map((item: any, index: number) => ({
    id: index,
    title: item.title,
    body: item.body,
    imagePrompt: item.imagePrompt,
    imageUrl: undefined,
    isLoadingImage: false,
    layout: TextLayout.CENTER
  }));

  return {
    slides,
    caption: data.caption
  };
};

export const generateNextSlideText = async (
  topic: string,
  vibe: Vibe,
  currentCount: number,
  language: string = 'pt-BR'
): Promise<Omit<SlideContent, 'id' | 'imageUrl' | 'isLoadingImage'>> => {
  
  const headers = await getAuthHeaders();
  
  const { data, error } = await supabase.functions.invoke('generate-carousel', {
    headers,
    body: {
        action: 'next-slide',
        topic,
        vibe,
        currentCount,
        language
    }
  });

  if (error) throw new Error(error.message);
  if (data.error) throw new Error(data.error);

  return {
      ...data,
      layout: TextLayout.CENTER
  };
};

export const regenerateSlideField = async (
  type: 'title' | 'body',
  topic: string,
  vibe: Vibe,
  contextText: string,
  currentValue: string,
  language: string = 'pt-BR'
): Promise<string> => {
  
  const headers = await getAuthHeaders();
  
  const { data, error } = await supabase.functions.invoke('generate-carousel', {
    headers,
    body: {
        action: 'regenerate-field',
        type,
        topic,
        vibe,
        contextText,
        currentValue,
        language
    }
  });

  if (error) throw new Error(error.message);
  if (data.error) throw new Error(data.error);

  return data.text;
};

export const generateSlideImage = async (
  imagePrompt: string,
  aspectRatio: AspectRatio
): Promise<string> => {
    // NOTE: Image generation is temporarily disabled or needs specific server config.
    // For now, we throw an error asking the user to implement the backend image logic or use a placeholder.
    // Ideally, you would call 'slide-image' action here.
    
    // Attempt to call server
    const headers = await getAuthHeaders();
    
    const { data, error } = await supabase.functions.invoke('generate-carousel', {
        headers,
        body: {
            action: 'slide-image',
            imagePrompt,
            aspectRatio
        }
    });

    if (error) throw new Error(error.message);
    if (data.error) throw new Error(data.error);
    
    return data.imageData; // Expecting base64 string
};