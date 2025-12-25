
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    console.log("DEBUG: Authorization Header present:", !!authHeader);
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: {
            Authorization: authHeader!,
          },
        },
      }
    );

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const {
      action,
      topic,
      vibe,
      count,
      language,
      currentCount,
      imagePrompt,
      type,
      contextText,
      currentValue
    } = await req.json();

    const {
      data: { user },
      error: userError
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: creditData, error: creditError } = await supabaseAdmin
      .from("user_credits")
      .select("credits")
      .eq("user_id", user.id)
      .single();

    if (creditError || !creditData || creditData.credits <= 0) {
      return new Response(JSON.stringify({ error: "Insufficient credits" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
        return new Response(JSON.stringify({ error: "Server misconfiguration: API Key missing" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
    const genAI = new GoogleGenerativeAI(apiKey);

    let result;
    // Use gemini-2.5-flash (recommended free tier model - balanced speed and quality)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    if (action === "carousel-text") {
       const systemInstruction = `
        Você é um especialista em Social Media Marketing e Design. 
        Sua tarefa é criar roteiros para carrosséis do Instagram altamente engajadores e legendas complementares.
        O tom de voz deve ser: ${vibe}.
        O idioma deve ser: ${language || 'pt-BR'}.
        Retorne APENAS JSON.
      `;

      const prompt = `
        Crie um conteúdo completo para um post carrossel no Instagram sobre o tema: "${topic}".
        
        1. Crie exatamente ${count} slides seguindo esta estrutura:
           - SLIDE 1 (CAPA): Título curto e de ALTO IMPACTO (Hook) e um Subtítulo curto (campo 'body').
           - SLIDES 2 a ${count}: Conteúdo explicativo. Título + Texto de corpo resumido.
           - Para TODOS os slides: Prompt visual em INGLÊS para gerar a imagem (estilo ${vibe}, sem texto na imagem).
        
        2. Crie uma legenda (caption) engajadora para o post:
           - Use uma 'hook' na primeira linha.
           - Inclua uma chamada para ação (CTA) no final.
           - Adicione 5-10 hashtags relevantes.

        Responda seguindo estritamente este Schema JSON:
        {
          "slides": [
            { "title": "string", "body": "string", "imagePrompt": "string" }
          ],
          "caption": "string"
        }
      `;
      
      const finalPrompt = `${systemInstruction}\n\n${prompt}`;
      
      try {
        const response = await model.generateContent(finalPrompt);
        const text = response.response.text();
        
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        result = JSON.parse(cleanedText);
      } catch (geminiError: any) {
        console.error("Gemini API Error:", geminiError);
        throw new Error(`Gemini API Error: ${geminiError.message || JSON.stringify(geminiError)}`);
      }

    } else if (action === "slide-image") {
       throw new Error("Image generation requires specific server configuration.");

    } else if (action === "next-slide") {
        const prompt = `
            O carrossel é sobre: "${topic}".
            Já existem ${currentCount} slides.
            
            Crie o conteúdo para o PRÓXIMO slide (Slide número ${currentCount + 1}).
            Deve ser uma continuação lógica.
            
            Responda em JSON: { "title": "...", "body": "...", "imagePrompt": "..." }
        `;
        const resultGen = await model.generateContent(`${prompt} \n Responda apenas JSON.`);
        const text = resultGen.response.text();
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        result = JSON.parse(cleanedText);

    } else if (action === "regenerate-field") {
        const prompt = `
            O post é sobre: "${topic}".
            Estou editando um slide.
            ${type === 'title' ? `Texto atual do corpo: "${contextText}".` : `Título atual: "${contextText}".`}
            Reescreva o ${type === 'title' ? 'TÍTULO' : 'TEXTO DO CORPO'} deste slide.
            Texto original: "${currentValue}".
            Retorne APENAS o novo texto.
        `;
        const resultGen = await model.generateContent(prompt);
        result = { text: resultGen.response.text().trim() };
    }

    if (result) {
        const { error: deductError } = await supabaseAdmin
            .from("user_credits")
            .update({ credits: creditData.credits - 1 })
            .eq("user_id", user.id);
            
        if (deductError) console.error("Error deducting credit:", deductError);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Edge Function Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Unknown error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
