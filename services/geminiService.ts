import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { SlideContent, Vibe, AspectRatio, TextLayout } from "../types";

// Helper to initialize AI
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please set REACT_APP_GEMINI_API_KEY.");
  }
  return new GoogleGenAI({ apiKey });
};

// Helper for delay
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry logic wrapper
const retryOperation = async <T>(
  operation: () => Promise<T>, 
  retries = 3, 
  delay = 2000,
  backoff = 2
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    const msg = error?.message || JSON.stringify(error);
    const isRateLimit = msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED") || error?.status === 429 || error?.code === 429;
    
    if (retries > 0 && isRateLimit) {
      console.warn(`Rate limit hit. Retrying in ${delay}ms...`);
      await wait(delay);
      return retryOperation(operation, retries - 1, delay * backoff, backoff);
    }
    throw error;
  }
};

const isFallbackError = (error: any): boolean => {
  const msg = error?.message || JSON.stringify(error);
  return (
    msg.includes("403") || 
    msg.includes("PERMISSION_DENIED") || 
    msg.includes("The caller does not have permission") ||
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    error?.status === 429 ||
    error?.code === 429
  );
};

const getFallbackRatio = (ratio: AspectRatio): "1:1" | "3:4" | "9:16" => {
  if (ratio === AspectRatio.PORTRAIT) return "3:4"; // 4:5 not supported in Flash, use 3:4
  if (ratio === AspectRatio.STORY) return "9:16";
  return "1:1";
};

/**
 * Generates the text structure for the carousel slides and a caption.
 */
export const generateCarouselText = async (
  topic: string,
  vibe: Vibe,
  count: number,
  language: string = 'pt-BR'
): Promise<{ slides: SlideContent[], caption: string }> => {
  const ai = getAiClient();
  
  const systemInstruction = `
    Você é um especialista em Social Media Marketing e Design. 
    Sua tarefa é criar roteiros para carrosséis do Instagram altamente engajadores e legendas complementares.
    O tom de voz deve ser: ${vibe}.
    O idioma deve ser: ${language}.
  `;

  const prompt = `
    Crie um conteúdo completo para um post carrossel no Instagram sobre o tema: "${topic}".
    
    1. Crie exatamente ${count} slides seguindo esta estrutura:
       - SLIDE 1 (CAPA): Deve funcionar como capa. Título curto e de ALTO IMPACTO (Hook) e um Subtítulo curto que resuma o benefício do post (use o campo 'body' para o subtítulo).
       - SLIDES 2 a ${count}: Conteúdo explicativo. Título + Texto de corpo resumido e direto.
       - Para TODOS os slides: Prompt visual em INGLÊS para gerar a imagem (estilo ${vibe}, sem texto na imagem).
    
    2. Crie uma legenda (caption) engajadora para o post:
       - Use uma 'hook' na primeira linha.
       - Inclua uma chamada para ação (CTA) no final.
       - Adicione 5-10 hashtags relevantes.
  `;

  try {
    // Try with Pro model first, with retries
    const response = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            slides: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  body: { type: Type.STRING },
                  imagePrompt: { type: Type.STRING }
                },
                required: ["title", "body", "imagePrompt"]
              }
            },
            caption: { 
              type: Type.STRING,
              description: "A legenda completa para o Instagram incluindo hashtags."
            }
          },
          required: ["slides", "caption"]
        }
      }
    }));

    const jsonText = response.text;
    if (!jsonText) throw new Error("No content generated");

    const parsed = JSON.parse(jsonText);
    
    // Map to add IDs and initial state
    const slides = parsed.slides.map((item: any, index: number) => ({
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
      caption: parsed.caption
    };

  } catch (error) {
    if (isFallbackError(error)) {
        console.warn("Gemini 3 Pro Text failed (429/403), falling back to Flash");
        try {
             const fallbackResponse = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: prompt,
                config: {
                    systemInstruction: systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: {
                      type: Type.OBJECT,
                      properties: {
                        slides: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              title: { type: Type.STRING },
                              body: { type: Type.STRING },
                              imagePrompt: { type: Type.STRING }
                            },
                            required: ["title", "body", "imagePrompt"]
                          }
                        },
                        caption: { type: Type.STRING }
                      },
                      required: ["slides", "caption"]
                    }
                }
             }));
             const jsonText = fallbackResponse.text;
             if (!jsonText) throw new Error("No content generated in fallback");
             const parsed = JSON.parse(jsonText);
             const slides = parsed.slides.map((item: any, index: number) => ({
                id: index,
                title: item.title,
                body: item.body,
                imagePrompt: item.imagePrompt,
                imageUrl: undefined,
                isLoadingImage: false,
                layout: TextLayout.CENTER
              }));
              return { slides, caption: parsed.caption };
        } catch (fallbackError) {
             console.error("Fallback text generation failed:", fallbackError);
             throw error; // Throw original error
        }
    }
    console.error("Error generating text:", error);
    throw error;
  }
};

/**
 * Generates content for a single additional slide
 */
export const generateNextSlideText = async (
  topic: string,
  vibe: Vibe,
  currentCount: number,
  language: string = 'pt-BR'
): Promise<Omit<SlideContent, 'id' | 'imageUrl' | 'isLoadingImage'>> => {
  const ai = getAiClient();
  
  const systemInstruction = `
    Você é um especialista em Social Media Marketing e Design. 
    Continue o roteiro de um carrossel existente.
    O tom de voz deve ser: ${vibe}.
    O idioma deve ser: ${language}.
  `;

  const prompt = `
    O carrossel é sobre: "${topic}".
    Já existem ${currentCount} slides.
    
    Crie o conteúdo para o PRÓXIMO slide (Slide número ${currentCount + 1}).
    Deve ser uma continuação lógica do conteúdo.
    
    Forneça:
    1. Título curto e chamativo.
    2. Texto de corpo resumido.
    3. Prompt visual em INGLÊS (estilo ${vibe}, sem texto).
  `;

  try {
    const response = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            body: { type: Type.STRING },
            imagePrompt: { type: Type.STRING }
          },
          required: ["title", "body", "imagePrompt"]
        }
      }
    }));

    const jsonText = response.text;
    if (!jsonText) throw new Error("No content generated");

    const parsed = JSON.parse(jsonText);
    return {
        ...parsed,
        layout: TextLayout.CENTER // Default for new slide
    };

  } catch (error) {
    if (isFallbackError(error)) {
        // Fallback
         const fallbackResponse = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    body: { type: Type.STRING },
                    imagePrompt: { type: Type.STRING }
                  },
                  required: ["title", "body", "imagePrompt"]
                }
            }
         }));
         const jsonText = fallbackResponse.text;
         if (jsonText) {
             const parsed = JSON.parse(jsonText);
             return { ...parsed, layout: TextLayout.CENTER };
         }
    }
    console.error("Error generating slide text:", error);
    throw error;
  }
};

/**
 * Regenerates a specific text field (title or body) for a slide.
 */
export const regenerateSlideField = async (
  type: 'title' | 'body',
  topic: string,
  vibe: Vibe,
  contextText: string, // The text of the OTHER field (e.g. if regen title, send body)
  currentValue: string, // The current value to be replaced
  language: string = 'pt-BR'
): Promise<string> => {
  const ai = getAiClient();

  const systemInstruction = `
    Você é um redator especialista em Instagram.
    Sua tarefa é reescrever partes de um slide de carrossel para torná-lo mais engajador.
    O tom de voz deve ser: ${vibe}.
    O idioma deve ser: ${language}.
    Responda APENAS com o novo texto, sem aspas ou explicações.
  `;

  const prompt = `
    O post é sobre: "${topic}".
    
    Estou editando um slide específico.
    ${type === 'title' ? `O conteúdo atual do corpo do slide é: "${contextText}".` : `O título atual do slide é: "${contextText}".`}
    
    Por favor, reescreva o ${type === 'title' ? 'TÍTULO (curto, impactante)' : 'TEXTO DO CORPO (conciso, direto, fácil de ler)'} deste slide.
    
    Texto atual que eu quero melhorar: "${currentValue}".
    
    Gere uma alternativa criativa e diferente.
  `;

  try {
    const response = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-3-flash-preview", // Use flash for fast single-field edits
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.9, // Higher creativity for rewriting
      }
    }));

    return response.text?.trim() || currentValue;
  } catch (error) {
    console.error(`Error regenerating ${type}:`, error);
    throw error;
  }
};

/**
 * Generates an image for a specific slide based on its prompt.
 */
export const generateSlideImage = async (
  imagePrompt: string,
  aspectRatio: AspectRatio
): Promise<string> => {
  const ai = getAiClient();
  
  let targetRatio = "1:1";
  if (aspectRatio === AspectRatio.PORTRAIT) targetRatio = "3:4"; // Pro model supports 3:4, 4:5 might need crop
  if (aspectRatio === AspectRatio.STORY) targetRatio = "9:16";

  try {
    const response = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: {
        parts: [
          { text: imagePrompt }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: targetRatio as any, // Cast to any to accept string
          numberOfImages: 1,
        }
      }
    }));

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image data found in response");

  } catch (error: any) {
    if (isFallbackError(error)) {
        console.warn("Gemini 3 Pro Image failed (429/403), falling back to Flash Image");
        try {
            const fallbackResponse = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
                model: "gemini-2.5-flash-image",
                contents: { parts: [{ text: imagePrompt }] },
                config: {
                    imageConfig: {
                        aspectRatio: getFallbackRatio(aspectRatio),
                        // numberOfImages not strictly supported in all clients for flash image
                    }
                }
            }));
            for (const part of fallbackResponse.candidates?.[0]?.content?.parts || []) {
              if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              }
            }
            throw new Error("No image data found in Gemini 2.5 Flash response");
        } catch (flashError) {
             console.warn("Gemini 2.5 Flash Image failed, trying Imagen 3", flashError);
             try {
                // Tertiary Fallback: Imagen 3
                const imagenResponse = await retryOperation<any>(() => ai.models.generateImages({
                    model: 'imagen-3.0-generate-001',
                    prompt: imagePrompt,
                    config: {
                      numberOfImages: 1,
                      aspectRatio: getFallbackRatio(aspectRatio),
                      outputMimeType: 'image/jpeg'
                    },
                }));
                const base64EncodeString = imagenResponse.generatedImages?.[0]?.image?.imageBytes;
                if (base64EncodeString) {
                    return `data:image/jpeg;base64,${base64EncodeString}`;
                }
                throw new Error("No image data in Imagen response");
             } catch (imagenError) {
                 console.error("All image generation fallbacks failed", imagenError);
                 throw error; // Throw original error
             }
        }
    }

    console.error("Error generating image:", error);
    throw error; 
  }
};