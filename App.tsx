import React, { useState, useCallback, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import { toBlob } from 'html-to-image';
import { SlideContent, Vibe, AspectRatio, SavedCarousel, TextLayout, SlideStyle, ContainerScope } from './types';
import { VIBES, ASPECT_RATIOS, INITIAL_SLIDES_COUNT, FONT_OPTIONS, DEFAULT_STYLE, GOOGLE_FONTS_URL, GRADIENT_PRESETS } from './constants';
import { generateCarouselText, generateSlideImage, generateNextSlideText, regenerateSlideField } from './services/geminiService';
import SlideCard from './components/SlideCard';
import ImageUploadModal from './components/ImageUploadModal';
import { SparklesIcon, InstagramIcon, LoaderIcon, CopyIcon, CheckIcon, PlusIcon, SaveIcon, HistoryIcon, TrashIcon, RefreshIcon, LayoutIcon, ChevronDownIcon, ChevronUpIcon, TypeIcon, UploadIcon, ImageIcon, FlagBR, FlagUS, UserIcon, ChevronLeftIcon, ChevronRightIcon, EditIcon, DownloadIcon } from './components/Icons';

type Language = 'pt-BR' | 'en-US';
type ViewMode = 'create' | 'saved';

const App: React.FC = () => {
  // Auth State
  const [hasApiKey, setHasApiKey] = useState(false);

  // App State
  const [viewMode, setViewMode] = useState<ViewMode>('create');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  
  // Specific regeneration state
  const [regeneratingField, setRegeneratingField] = useState<{ slideId: number; field: 'title' | 'body' } | null>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [topic, setTopic] = useState('');
  const [carouselTitle, setCarouselTitle] = useState(''); // New state for editable title
  const [selectedVibe, setSelectedVibe] = useState<Vibe>(Vibe.MINIMALIST);
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>(AspectRatio.SQUARE);
  const [slideCount, setSlideCount] = useState<number>(INITIAL_SLIDES_COUNT);
  const [language, setLanguage] = useState<Language>('pt-BR');
  const [fontEmbedCSS, setFontEmbedCSS] = useState<string>('');
  
  // UI State
  const [activeTab, setActiveTab] = useState<'config' | 'text' | 'edit'>('config');
  const [editingSlideId, setEditingSlideId] = useState<number | null>(null);
  const [editScope, setEditScope] = useState<'global' | 'individual'>('global');
  const [expandedSections, setExpandedSections] = useState({
    layout: true,
    content: true,
    style: true,
    images: true
  });
  const [showSaveModal, setShowSaveModal] = useState(false); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Sidebar toggle state
  
  // Upload Logic - Updated to use Modal
  const [uploadModalState, setUploadModalState] = useState<{ isOpen: boolean; slideId: number | null }>({
    isOpen: false,
    slideId: null
  });
  
  // Styling State
  const [globalStyle, setGlobalStyle] = useState<SlideStyle>(DEFAULT_STYLE);

  const [slides, setSlides] = useState<SlideContent[]>([]);
  const [caption, setCaption] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  
  // LocalStorage State
  const [savedCarousels, setSavedCarousels] = useState<SavedCarousel[]>([]);
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  // Translation Object
  const t = {
    'pt-BR': {
      headerTitle: 'InstaVibe Creator',
      createCarousel: 'Criar Carrossel',
      myProjects: 'Meus Projetos',
      login: 'Entrar',
      connectKey: 'Conectar Chave',
      topicPlaceholder: 'Ex: Dicas para aumentar a produtividade no home office...',
      topicLabel: 'Sobre o que é seu post?',
      vibeLabel: 'Escolha a Vibe',
      slideCountLabel: 'Qtd. Slides',
      ratioLabel: 'Formato',
      generateBtn: 'Gerar Texto',
      generating: 'Escrevendo Roteiro...',
      configTab: 'Configuração',
      editTab: 'Edição',
      slidesTab: 'Slides',
      savedHistory: 'Histórico Salvo',
      saveBtn: 'Salvar',
      savedBtn: 'Salvo!',
      exportBtn: 'Exportar Tudo',
      exporting: 'Exportando...',
      generateImagesBtn: 'Gerar Imagens (IA)',
      generatingImages: 'Gerando Imagens...',
      addSlide: 'Adicionar Slide',
      heroTitle: 'Crie Carrosséis',
      heroSubtitle: 'Com Vibe Coding',
      heroDesc: 'Gere conteúdo completo para seu Instagram em segundos. Defina o tema e deixe a IA cuidar do roteiro e visual.',
      loadProject: 'Carregar Projeto',
      noProjects: 'Nenhum projeto salvo ainda.',
      modalTitle: 'Novo Carrossel',
      modalDesc: 'Você tem um carrossel aberto não salvo. O que deseja fazer?',
      modalSaveNew: 'Salvar e Criar Novo',
      modalDiscardNew: 'Descartar e Criar Novo',
      modalCancel: 'Cancelar'
    },
    'en-US': {
      headerTitle: 'InstaVibe Creator',
      createCarousel: 'Create Carousel',
      myProjects: 'My Projects',
      login: 'Login',
      connectKey: 'Connect Key',
      topicPlaceholder: 'Ex: 5 tips to boost productivity working from home...',
      topicLabel: 'What is your post about?',
      vibeLabel: 'Choose the Vibe',
      slideCountLabel: 'Slide Count',
      ratioLabel: 'Format',
      generateBtn: 'Generate Text',
      generating: 'Writing Script...',
      configTab: 'Configuration',
      editTab: 'Editing',
      slidesTab: 'Slides',
      savedHistory: 'Saved History',
      saveBtn: 'Save',
      savedBtn: 'Saved!',
      exportBtn: 'Export All',
      exporting: 'Exporting...',
      generateImagesBtn: 'Generate Images (AI)',
      generatingImages: 'Generating Images...',
      addSlide: 'Add Slide',
      heroTitle: 'Create Carousels',
      heroSubtitle: 'With Vibe Coding',
      heroDesc: 'Generate full Instagram content in seconds. Set the topic and let AI handle the script and visuals.',
      loadProject: 'Load Project',
      noProjects: 'No saved projects yet.',
      modalTitle: 'New Carousel',
      modalDesc: 'You have an unsaved carousel open. What would you like to do?',
      modalSaveNew: 'Save and Create New',
      modalDiscardNew: 'Discard and Create New',
      modalCancel: 'Cancel'
    }
  }[language];

  useEffect(() => {
    // Detect Browser Language
    const browserLang = navigator.language;
    if (browserLang.startsWith('en')) {
      setLanguage('en-US');
    } else {
      setLanguage('pt-BR');
    }

    // Check for API Key (Internal check only, no UI trigger)
    const checkKey = async () => {
      const aistudio = (window as any).aistudio;
      if (aistudio) {
        const has = await aistudio.hasSelectedApiKey();
        setHasApiKey(has);
      } else {
        setHasApiKey(!!process.env.API_KEY);
      }
    };
    checkKey();

    // Load saved data
    const stored = localStorage.getItem('instavibe_saved');
    if (stored) {
      try {
        setSavedCarousels(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse saved carousels", e);
      }
    }

    // Fetch Google Fonts CSS for embedding to avoid CORS issues in html-to-image
    const fetchFonts = async () => {
        try {
            const res = await fetch(GOOGLE_FONTS_URL);
            const css = await res.text();
            setFontEmbedCSS(css);
        } catch (e) {
            console.error("Failed to fetch fonts for embedding", e);
        }
    };
    fetchFonts();

  }, []);

  // Update global style based on Vibe selection initially
  useEffect(() => {
     // Optional: You could create a map of Vibe -> Default Colors here if desired
  }, [selectedVibe]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Logic to handle New Project click
  const handleNewProjectClick = () => {
    setViewMode('create');
    if (slides.length > 0) {
      setShowSaveModal(true);
    } else {
      resetCreator();
    }
  };

  const resetCreator = () => {
    setSlides([]);
    setTopic('');
    setCaption('');
    setCarouselTitle(''); // Reset title
    setEditingSlideId(null);
    setActiveTab('config');
    setViewMode('create');
    scrollToTop();
  };

  const confirmSaveAndNew = () => {
    handleSaveCarousel();
    setShowSaveModal(false);
    resetCreator();
  };

  const confirmDiscardAndNew = () => {
    setShowSaveModal(false);
    resetCreator();
  };

  const handleError = (err: any) => {
    console.error(err);
    const msg = err?.message || JSON.stringify(err);
    if (msg.includes("403") || msg.includes("PERMISSION_DENIED") || msg.includes("permission")) {
      setError("Erro de permissão/Permission Error. API Key invalid for Gemini 3.0 Pro.");
    } else if (msg.includes("API Key not found")) {
      setError("API Key not found.");
    } else {
      setError("Error generating content. Please try again.");
    }
  };

  // --- IMAGE GENERATION LOGIC ---
  const generateImagesForSlides = async (slidesList: SlideContent[]) => {
    if (!hasApiKey && !process.env.API_KEY) {
        setError("API Key required.");
        return;
    }

    setIsGeneratingImages(true);

    // Identify which slides need images
    const slidesToGenerate = slidesList.filter(s => !s.imageUrl);
    
    // 1. Visually update state to show loading spinners for these slides
    setSlides(prev => {
        return prev.map(s => 
            slidesToGenerate.some(g => g.id === s.id) ? { ...s, isLoadingImage: true } : s
        );
    });

    try {
        // 2. Sequential generation to avoid 429 Rate Limits
        for (const slide of slidesToGenerate) {
            try {
                const base64Image = await generateSlideImage(slide.imagePrompt, selectedRatio);
                
                // Update specific slide with image
                setSlides(prev => prev.map(s => 
                    s.id === slide.id 
                    ? { ...s, imageUrl: base64Image, isLoadingImage: false } 
                    : s
                ));
            } catch (err) {
                console.warn(`Failed to generate image for slide ${slide.id}`, err);
                // Turn off loading for failed slide
                setSlides(prev => prev.map(s => 
                    s.id === slide.id 
                    ? { ...s, isLoadingImage: false } 
                    : s
                ));
            }
            // Small delay between requests to be nice to the API
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
    } catch (e) {
        console.error("Batch image generation failed", e);
    } finally {
        setIsGeneratingImages(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    if (!hasApiKey && !process.env.API_KEY) {
        setError("API Key required.");
        return;
    }

    setIsGenerating(true);
    setError(null);
    setCaption('');
    setIsCopied(false);
    setEditingSlideId(null);
    setEditScope('global'); 
    setActiveTab('text'); 
    setCarouselTitle(topic); // Set initial title from topic

    // Initialize Skeleton Slides
    const skeletons: SlideContent[] = Array.from({ length: slideCount }, (_, i) => ({
      id: i,
      title: '',
      body: '',
      imagePrompt: '',
      layout: TextLayout.CENTER,
      isLoadingImage: false
    }));
    setSlides(skeletons);

    setTimeout(() => scrollToTop(), 100); 

    try {
      // 1. Generate Text Only
      const { slides: generatedSlides, caption: generatedCaption } = await generateCarouselText(topic, selectedVibe, slideCount, language);
      
      // Update state with text
      setSlides(generatedSlides);
      setCaption(generatedCaption);
      
    } catch (err: any) {
      handleError(err);
      if (slides.length === 0) setSlides([]); 
    } finally {
      setIsGenerating(false);
    }
  };

  // Manual Trigger for all missing images
  const handleGenerateAllImages = () => {
    generateImagesForSlides(slides);
  };

  const handleAddSlide = async () => {
    if (isGeneratingMore || !topic) return;

    if (!hasApiKey && !process.env.API_KEY) {
        setError("API Key required.");
        return;
    }

    setIsGeneratingMore(true);

    try {
      const nextId = slides.length;
      const newSlideContent = await generateNextSlideText(topic, selectedVibe, slides.length, language);
      
      const newSlide: SlideContent = {
        id: nextId,
        ...newSlideContent,
        isLoadingImage: false,
        layout: TextLayout.CENTER
      };

      // Add text slide only
      const updatedSlides = [...slides, newSlide];
      setSlides(updatedSlides);

    } catch (err) {
      console.error("Failed to add slide", err);
    } finally {
      setIsGeneratingMore(false);
    }
  };

  const handleRegenerateImage = useCallback(async (slideId: number, prompt: string) => {
    if (!hasApiKey && !process.env.API_KEY) {
        setError("API Key required.");
        return;
    }

    setSlides(prev => prev.map(s => s.id === slideId ? { ...s, isLoadingImage: true } : s));
    try {
      const newImage = await generateSlideImage(prompt, selectedRatio);
      setSlides(prev => prev.map(s => s.id === slideId ? { ...s, imageUrl: newImage, isLoadingImage: false } : s));
    } catch (e) {
      console.error(e);
      setSlides(prev => prev.map(s => s.id === slideId ? { ...s, isLoadingImage: false } : s));
      handleError(e);
    }
  }, [selectedRatio, hasApiKey]);

  const handleRegenerateField = async (slideId: number, field: 'title' | 'body') => {
    if (!hasApiKey && !process.env.API_KEY) {
      setError("API Key required.");
      return;
    }

    setRegeneratingField({ slideId, field });
    const slide = slides.find(s => s.id === slideId);
    if (!slide) return;

    try {
      // If we regenerate Title, we pass Body as context, and vice-versa
      const contextText = field === 'title' ? slide.body : slide.title;
      const currentValue = field === 'title' ? slide.title : slide.body;

      const newText = await regenerateSlideField(field, topic, selectedVibe, contextText, currentValue, language);
      
      setSlides(prev => prev.map(s => 
        s.id === slideId ? { ...s, [field]: newText } : s
      ));
    } catch (e) {
      console.error(e);
      handleError(e);
    } finally {
      setRegeneratingField(null);
    }
  };

  const handleManualImageUpload = (slideId: number, base64Image: string) => {
    setSlides(prev => prev.map(s => s.id === slideId ? { ...s, imageUrl: base64Image, isLoadingImage: false } : s));
  };

  const handleOpenUploadModal = (slideId: number) => {
    setUploadModalState({
      isOpen: true,
      slideId
    });
  };

  const handleCloseUploadModal = () => {
    setUploadModalState(prev => ({ ...prev, isOpen: false }));
  };

  const handleModalUpload = (base64Image: string) => {
    if (uploadModalState.slideId !== null) {
      handleManualImageUpload(uploadModalState.slideId, base64Image);
      handleCloseUploadModal();
    }
  };

  const handleToggleEditLayout = (slideId: number) => {
    setEditingSlideId(slideId);
    setEditScope('individual');
    setActiveTab('edit'); 
  };

  const handleDeselectSlide = () => {
    setEditingSlideId(null);
    setEditScope('global');
  };

  const handleUpdateLayout = (layout: TextLayout) => {
    if (editScope === 'individual' && editingSlideId === null) return;
    
    if (editScope === 'global' || editingSlideId === null) {
        setSlides(prev => prev.map(s => ({ ...s, layout })));
    } else if (editingSlideId !== null) {
        setSlides(prev => prev.map(s => s.id === editingSlideId ? { ...s, layout } : s));
    }
  };

  const handleStyleChange = (key: keyof SlideStyle, value: any) => {
    if (editScope === 'global' || editingSlideId === null) {
        setGlobalStyle(prev => ({ ...prev, [key]: value }));
    } else if (editingSlideId !== null) {
        setSlides(prev => prev.map(s => {
            if (s.id !== editingSlideId) return s;
            const currentStyle = s.customStyle || {};
            return {
                ...s,
                customStyle: { ...currentStyle, [key]: value }
            };
        }));
    }
  };

  const handleTextContentChange = (slideId: number, field: 'title' | 'body' | 'imagePrompt', value: string) => {
    setSlides(prev => prev.map(s => s.id === slideId ? { ...s, [field]: value } : s));
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const copyToClipboard = () => {
    if (!caption) return;
    navigator.clipboard.writeText(caption);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // --- SAVE & LOAD LOGIC ---
  const handleSaveCarousel = () => {
    if (slides.length === 0) return;
    const newSavedItem: SavedCarousel = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      topic,
      title: carouselTitle || topic, // Save title
      vibe: selectedVibe,
      aspectRatio: selectedRatio,
      slides,
      caption,
      globalStyle
    };
    const updatedList = [newSavedItem, ...savedCarousels];
    setSavedCarousels(updatedList);
    localStorage.setItem('instavibe_saved', JSON.stringify(updatedList));
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 2000);
  };

  const handleExportAll = async () => {
    if (slides.length === 0 || isExporting) return;
    setIsExporting(true);

    const zip = new JSZip();
    let count = 0;

    try {
        // We use Promise.all to generate blobs in parallel if possible, 
        // but sequential might be safer for memory on mobile. 
        // Let's do sequential to ensure order and stability.
        for (const slide of slides) {
            const node = document.getElementById(`slide-card-${slide.id}`);
            if (node) {
                 // Use html-to-image to get blob
                 // Filter out the actions buttons
                 const blob = await toBlob(node, {
                     quality: 0.95,
                     fontEmbedCSS: fontEmbedCSS, // Provide CSS manually to bypass CORS/cssRules errors
                     filter: (n) => {
                         if (n instanceof HTMLElement && (
                           n.classList.contains('slide-actions') || 
                           n.classList.contains('empty-state-btn') ||
                           n.classList.contains('slide-number') // Exclude slide number
                         )) {
                             return false;
                         }
                         return true;
                     }
                 });
                 if (blob) {
                     // Add 1 to index for user friendly naming (Slide 1, Slide 2...)
                     zip.file(`slide-${slide.id + 1}.png`, blob);
                     count++;
                 }
            }
        }

        if (count > 0) {
            // Generate zip file
            const content = await zip.generateAsync({ type: "blob" });
            const url = window.URL.createObjectURL(content);
            
            // Trigger download
            const link = document.createElement('a');
            link.href = url;
            const safeTitle = (carouselTitle || topic || 'instavibe-carousel').replace(/[^a-z0-9]/gi, '_').toLowerCase();
            link.download = `${safeTitle}.zip`;
            link.click();
            
            // Clean up
            setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        }
        
    } catch (e) {
        console.error("Export failed", e);
        setError("Falha na exportação. Tente novamente.");
    } finally {
        setIsExporting(false);
    }
  };

  const handleDeleteSaved = (id: string) => {
    const updatedList = savedCarousels.filter(item => item.id !== id);
    setSavedCarousels(updatedList);
    localStorage.setItem('instavibe_saved', JSON.stringify(updatedList));
  };

  const handleLoadSaved = (item: SavedCarousel) => {
    setTopic(item.topic);
    setCarouselTitle(item.title || item.topic); // Load title
    setSelectedVibe(item.vibe);
    setSelectedRatio(item.aspectRatio);
    setSlides(item.slides);
    setCaption(item.caption);
    setGlobalStyle(item.globalStyle || DEFAULT_STYLE);
    setEditingSlideId(null);
    setViewMode('create'); // Switch to create mode
    scrollToTop();
  };

  const getRatioClass = () => {
    return ASPECT_RATIOS.find(r => r.value === selectedRatio)?.class || 'aspect-square';
  };

  const getSlideStyle = (slide: SlideContent): SlideStyle => {
    return { ...globalStyle, ...(slide.customStyle || {}) };
  };

  const currentEditingSlide = editingSlideId !== null ? slides.find(s => s.id === editingSlideId) : null;
  const currentEditingStyle = (editingSlideId !== null && currentEditingSlide) ? getSlideStyle(currentEditingSlide) : globalStyle;
  const activeLayout = (editingSlideId !== null && currentEditingSlide) ? currentEditingSlide.layout : (slides[0]?.layout || TextLayout.CENTER);

  // --- MAIN APP ---
  return (
    <div className="min-h-screen bg-background text-zinc-100 relative overflow-x-hidden">
      
      {/* Save Confirmation Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-surface p-6 rounded-2xl border border-white/10 shadow-2xl max-w-sm w-full m-4">
              <h3 className="text-xl font-bold mb-2 text-white">{t.modalTitle}</h3>
              <p className="text-zinc-400 mb-6">{t.modalDesc}</p>
              <div className="flex flex-col gap-3">
                 <button 
                   onClick={confirmSaveAndNew}
                   className="w-full py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors"
                 >
                    {t.modalSaveNew}
                 </button>
                 <button 
                   onClick={confirmDiscardAndNew}
                   className="w-full py-3 bg-white/5 text-white font-medium rounded-xl hover:bg-white/10 transition-colors border border-white/5"
                 >
                    {t.modalDiscardNew}
                 </button>
                 <button 
                   onClick={() => setShowSaveModal(false)}
                   className="w-full py-2 text-zinc-500 font-medium hover:text-white transition-colors"
                 >
                    {t.modalCancel}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Image Upload Modal */}
      <ImageUploadModal 
        isOpen={uploadModalState.isOpen}
        onClose={handleCloseUploadModal}
        onUpload={handleModalUpload}
        slideIndex={uploadModalState.slideId}
      />

      {/* Header - Fixed Position */}
      <header className="fixed top-0 left-0 w-full z-50 backdrop-blur-xl bg-background/80 border-b border-white/5 h-16">
        <div className="w-full px-6 md:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-tr from-primary to-secondary rounded-lg">
              <InstagramIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
              {t.headerTitle}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Create Button */}
            <button 
                onClick={handleNewProjectClick}
                className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${viewMode === 'create' ? 'bg-primary/20 text-primary border-primary/20' : 'bg-transparent text-zinc-400 border-zinc-700 hover:text-zinc-300'}`}
            >
                <PlusIcon className="w-4 h-4" />
                {t.createCarousel}
            </button>

            {/* My Projects Button */}
            <button 
                onClick={() => setViewMode('saved')}
                className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${viewMode === 'saved' ? 'bg-zinc-800 text-white border-zinc-600' : 'bg-transparent text-zinc-400 border-zinc-700 hover:text-zinc-300'}`}
            >
                <HistoryIcon className="w-4 h-4" />
                {t.myProjects}
            </button>

            {/* Language Selector */}
            <div className="flex items-center bg-zinc-900 border border-white/10 rounded-full p-1">
                <button 
                    onClick={() => setLanguage('pt-BR')}
                    className={`p-1.5 rounded-full transition-all ${language === 'pt-BR' ? 'bg-white/10' : 'opacity-50 hover:opacity-100'}`}
                    title="Português"
                >
                    <FlagBR className="w-4 h-4 rounded-sm" />
                </button>
                <button 
                    onClick={() => setLanguage('en-US')}
                    className={`p-1.5 rounded-full transition-all ${language === 'en-US' ? 'bg-white/10' : 'opacity-50 hover:opacity-100'}`}
                    title="English"
                >
                    <FlagUS className="w-4 h-4 rounded-sm" />
                </button>
            </div>

            {/* Login Button (Visual Only) */}
            <button className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-colors">
                <UserIcon className="w-4 h-4" />
                {t.login}
            </button>

            <a href="https://ai.google.dev/" target="_blank" rel="noreferrer" className="hidden sm:block text-xs text-zinc-600 hover:text-zinc-500 transition-colors">
               Gemini API
            </a>
          </div>
        </div>
      </header>

      <main className="w-full pt-16 min-h-screen flex flex-col lg:h-screen lg:overflow-hidden">
        
        {/* FLEX LAYOUT (Replaced Grid) */}
        <div className="flex flex-col lg:flex-row items-start relative gap-0 h-full w-full">
            
            {/* LEFT COLUMN: Hero + Results OR Saved History */}
            <div className={`
                flex-1 min-w-0 flex flex-col h-full transition-all duration-500 ease-in-out
                px-6 md:px-12 lg:overflow-hidden relative z-0
            `}>
                <div className="h-full flex flex-col pr-2 py-6">
                    
                    {/* VIEW: CREATE CAROUSEL */}
                    {viewMode === 'create' && (
                        <>
                            {/* Intro / Hero - ONLY SHOW WHEN NO SLIDES */}
                            {slides.length === 0 && (
                                <div className="text-left max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 shrink-0">
                                    <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight leading-tight">
                                        {t.heroTitle} <br />
                                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-400 to-secondary">
                                        {t.heroSubtitle}
                                        </span>
                                    </h2>
                                    <p className="text-zinc-400 text-lg md:text-xl leading-relaxed">
                                        {t.heroDesc}
                                    </p>
                                </div>
                            )}

                            {/* Results Section */}
                            {slides.length > 0 && (
                            <div id="results" className="space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-700 shrink-0">

                                {/* Carousel Area */}
                                <div className="space-y-4">
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div className="flex items-center gap-4">
                                      <div className="flex items-center gap-2 group relative">
                                        <input
                                            value={carouselTitle}
                                            onChange={(e) => setCarouselTitle(e.target.value)}
                                            placeholder="Nome do Carrossel"
                                            className="text-2xl font-bold bg-transparent border-b border-transparent hover:border-white/20 focus:border-primary focus:outline-none transition-all min-w-[200px] text-white placeholder-zinc-600"
                                        />
                                        <EditIcon className="w-4 h-4 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity absolute -right-6" />
                                      </div>
                                      <div className="text-sm text-zinc-500 px-3 py-1 bg-surface rounded-full border border-white/5">
                                          {selectedRatio === AspectRatio.PORTRAIT ? '4:5' : selectedRatio === AspectRatio.STORY ? '9:16' : '1:1'}
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                        {/* Generate All Images Button */}
                                        {!slides.every(s => s.imageUrl) && !isGenerating && (
                                            <button
                                                onClick={handleGenerateAllImages}
                                                disabled={isGeneratingImages}
                                                className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold bg-primary text-white hover:bg-primary/80 transition-all shadow-lg shadow-primary/20"
                                            >
                                                {isGeneratingImages ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <SparklesIcon className="w-4 h-4" />}
                                                {isGeneratingImages ? t.generatingImages : t.generateImagesBtn}
                                            </button>
                                        )}

                                        {/* Save Button */}
                                        <button
                                        onClick={handleSaveCarousel}
                                        disabled={isGenerating}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${isSavedRecently ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 'bg-surface border border-white/10 hover:bg-white/5 text-zinc-300'}`}
                                        >
                                        {isSavedRecently ? <CheckIcon className="w-4 h-4" /> : <SaveIcon className="w-4 h-4" />}
                                        {isSavedRecently ? t.savedBtn : t.saveBtn}
                                        </button>

                                        {/* Export All Button */}
                                        <button
                                        onClick={handleExportAll}
                                        disabled={isExporting || isGenerating}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 transition-all"
                                        title={t.exportBtn}
                                        >
                                        {isExporting ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <DownloadIcon className="w-4 h-4" />}
                                        <span className="hidden sm:inline">{isExporting ? t.exporting : t.exportBtn}</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Horizontal Scroll Container */}
                                <div className="flex overflow-x-auto pb-12 gap-6 snap-x snap-mandatory -mx-6 px-6 md:-mx-12 md:px-12">
                                    {slides.map((slide) => (
                                    <div key={slide.id} className="flex-none w-[280px] md:w-[320px] snap-center">
                                        <SlideCard 
                                        slide={slide} 
                                        aspectRatio={selectedRatio} 
                                        vibe={selectedVibe}
                                        computedStyle={getSlideStyle(slide)}
                                        isSelected={editingSlideId === slide.id}
                                        isSkeleton={isGenerating}
                                        onRegenerateImage={handleRegenerateImage}
                                        onOpenUploadModal={handleOpenUploadModal}
                                        onEditLayout={handleToggleEditLayout}
                                        fontEmbedCSS={fontEmbedCSS}
                                        />
                                    </div>
                                    ))}
                                    
                                    {/* Add Slide Button (Horizontal) */}
                                    {!isGenerating && (
                                    <div className="flex-none w-[280px] md:w-[320px] snap-center">
                                        <button
                                        onClick={handleAddSlide}
                                        disabled={isGeneratingMore}
                                        className={`relative w-full ${getRatioClass()} rounded-xl border-2 border-dashed border-zinc-700 hover:border-zinc-500 hover:bg-white/5 transition-all flex flex-col items-center justify-center gap-3 group ${isGeneratingMore ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                                        >
                                        <div className="p-3 bg-zinc-800 rounded-full group-hover:bg-zinc-700 transition-colors">
                                            {isGeneratingMore ? <LoaderIcon className="w-6 h-6 animate-spin text-zinc-400" /> : <PlusIcon className="w-6 h-6 text-zinc-400 group-hover:text-white" />}
                                        </div>
                                        <span className="text-sm font-medium text-zinc-500 group-hover:text-zinc-300">
                                            {isGeneratingMore ? '...' : t.addSlide}
                                        </span>
                                        </button>
                                    </div>
                                    )}
                                </div>

                                {!isGenerating && (
                                    <p className="text-left text-zinc-500 text-sm">
                                    Dica: Clique no ícone de edição <LayoutIcon className="w-3 h-3 inline-block" /> no card para personalizar.
                                    </p>
                                )}
                                </div>
                            </div>
                            )}
                        </>
                    )}

                    {/* VIEW: SAVED PROJECTS */}
                    {viewMode === 'saved' && (
                    <div id="saved-section" className="flex-1 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-left-4 duration-500">
                        <div className="mb-8 flex items-center justify-between">
                            <h3 className="text-3xl font-black text-white flex items-center gap-3">
                                <HistoryIcon className="w-8 h-8 text-primary" />
                                {t.savedHistory}
                            </h3>
                            <button 
                                onClick={handleNewProjectClick}
                                className="md:hidden flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/30 transition-colors"
                            >
                                <PlusIcon className="w-4 h-4" />
                                {t.createCarousel}
                            </button>
                        </div>
                        
                        {savedCarousels.length === 0 ? (
                            <div className="text-center py-20 text-zinc-500 border-2 border-dashed border-white/5 rounded-2xl bg-surface/30">
                                <HistoryIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium mb-2">{t.noProjects}</p>
                                <button onClick={handleNewProjectClick} className="text-primary hover:underline">
                                    Crie seu primeiro carrossel agora
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-4">
                            {savedCarousels.map((item) => (
                                <div key={item.id} className="bg-surface border border-white/5 rounded-2xl p-6 hover:border-white/20 transition-all shadow-lg group flex flex-col h-full">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-xs text-zinc-500 font-mono bg-black/20 px-2 py-1 rounded">
                                    {new Date(item.timestamp).toLocaleDateString()}
                                    </span>
                                    <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteSaved(item.id); }}
                                    className="text-zinc-600 hover:text-red-400 transition-colors p-2 hover:bg-white/5 rounded-full"
                                    title="Excluir"
                                    >
                                    <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                
                                <h4 className="font-bold text-xl mb-3 line-clamp-2 leading-tight flex-1">{item.title || item.topic}</h4>
                                
                                <div className="flex flex-wrap gap-2 mb-6">
                                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded border border-primary/20">
                                    {item.vibe}
                                    </span>
                                    <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded border border-zinc-700">
                                    {item.slides.length} Slides
                                    </span>
                                </div>
                                
                                <button 
                                    onClick={() => handleLoadSaved(item)}
                                    className="w-full py-3 bg-white text-black hover:bg-zinc-200 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 mt-auto"
                                >
                                    {t.loadProject}
                                </button>
                                </div>
                            ))}
                            </div>
                        )}
                    </div>
                    )}
                </div>
            </div>

            {/* RIGHT COLUMN: Configuration & Editing */}
            <div className={`
                shrink-0 relative h-full transition-all duration-500 ease-in-out
                ${isSidebarOpen ? 'lg:w-[450px] px-6 md:pr-12' : 'lg:w-0 lg:px-0'}
            `}>
                
                {/* Toggle Button - Visible only on Desktop */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="absolute -left-3 top-24 z-20 hidden lg:flex items-center justify-center w-6 h-12 bg-surface border border-white/10 rounded-l-md rounded-r-none shadow-2xl hover:bg-zinc-800 hover:border-primary/50 transition-all group"
                    title={isSidebarOpen ? "Fechar painel" : "Abrir painel"}
                >
                     {isSidebarOpen ? <ChevronRightIcon className="w-4 h-4 text-zinc-400 group-hover:text-white" /> : <ChevronLeftIcon className="w-4 h-4 text-zinc-400 group-hover:text-white" />}
                </button>

                {/* Inner Container with fixed width to prevent squashing during collapse */}
                <div className={`
                    ${isSidebarOpen ? 'opacity-100' : 'opacity-0 lg:opacity-100'} 
                    transition-opacity duration-300 w-full lg:w-[420px] h-full flex flex-col py-6
                `}>
                    <div className="bg-surface border border-white/10 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col h-full">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary"></div>
                        
                        {/* Tabs Header */}
                        <div className="flex border-b border-white/10 sticky top-0 bg-surface z-10 shrink-0">
                            <button 
                                onClick={() => setActiveTab('config')}
                                className={`flex-1 py-4 text-sm font-bold tracking-wide transition-colors ${activeTab === 'config' ? 'text-white bg-white/5' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                {t.configTab}
                            </button>
                            <button 
                                className={`flex-1 py-4 text-sm font-bold tracking-wide transition-colors ${activeTab === 'edit' ? 'text-white bg-white/5' : 'text-zinc-500 hover:text-zinc-300'}`}
                                onClick={() => setActiveTab('edit')}
                            >
                                {t.editTab}
                            </button>
                            <button 
                                onClick={() => setActiveTab('text')}
                                className={`flex-1 py-4 text-sm font-bold tracking-wide transition-colors ${activeTab === 'text' ? 'text-white bg-white/5' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                {t.slidesTab}
                            </button>
                        </div>

                        {/* Content Area - SCROLLABLE */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
                            
                            {/* CONFIGURATION TAB */}
                            {activeTab === 'config' && (
                                <form onSubmit={handleGenerate} className="space-y-6 animate-in fade-in duration-300">
                                    <div className="space-y-2">
                                        <label htmlFor="topic" className="block text-sm font-medium text-zinc-400">{t.topicLabel}</label>
                                        <textarea 
                                            id="topic"
                                            value={topic}
                                            onChange={(e) => setTopic(e.target.value)}
                                            placeholder={t.topicPlaceholder}
                                            className="w-full bg-background border border-zinc-700 rounded-xl p-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all h-32 resize-none"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-zinc-400">{t.vibeLabel}</label>
                                            <select 
                                                value={selectedVibe}
                                                onChange={(e) => setSelectedVibe(e.target.value as Vibe)}
                                                className="w-full bg-background border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            >
                                                {VIBES.map(v => (
                                                    <option key={v.value} value={v.value}>{v.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-zinc-400">{t.slideCountLabel}</label>
                                            <select 
                                                value={slideCount}
                                                onChange={(e) => setSlideCount(Number(e.target.value))}
                                                className="w-full bg-background border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            >
                                                {[3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                                    <option key={n} value={n}>{n} Slides</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-zinc-400">{t.ratioLabel}</label>
                                            <div className="flex flex-col gap-2">
                                                {ASPECT_RATIOS.map((ratio) => (
                                                    <button
                                                        key={ratio.value}
                                                        type="button"
                                                        onClick={() => setSelectedRatio(ratio.value)}
                                                        className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all border ${
                                                            selectedRatio === ratio.value 
                                                            ? 'bg-zinc-800 border-primary text-white shadow-sm' 
                                                            : 'bg-background border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span>{ratio.label}</span>
                                                            {selectedRatio === ratio.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <button 
                                        type="submit" 
                                        disabled={isGenerating || !topic.trim()}
                                        className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-primary/25 ${
                                            isGenerating || !topic.trim()
                                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                                            : 'bg-white text-black hover:scale-[1.02]'
                                        }`}
                                    >
                                        {isGenerating ? (
                                            <>
                                                <LoaderIcon className="animate-spin" /> {t.generating}
                                            </>
                                        ) : (
                                            <>
                                                <SparklesIcon /> {t.generateBtn}
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                            
                            {/* TEXT / SLIDES TAB */}
                            {activeTab === 'text' && (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    {/* ... Text Tab Content ... */}
                                    {/* Keeping the existing content for text tab but not listing all of it to save space in this response unless it changed */}
                                    {isGenerating ? (
                                        <div className="space-y-4">
                                            {/* ... */}
                                            <div className="flex items-center justify-center gap-2 py-4 text-primary font-medium animate-pulse">
                                                <SparklesIcon className="w-5 h-5" />
                                                <span>Criando roteiro com IA...</span>
                                            </div>
                                            {Array.from({ length: slideCount }).map((_, i) => (
                                                <div key={i} className="bg-black/20 border border-white/5 rounded-xl p-4">
                                                    <div className="flex gap-4 animate-pulse">
                                                        {/* ... Skeleton ... */}
                                                        <div className="w-24 shrink-0 pt-6">
                                                            <div className="w-24 h-24 bg-white/5 rounded-lg" />
                                                            <div className="mt-2 h-6 w-full bg-white/5 rounded-lg" />
                                                        </div>
                                                        <div className="flex-1 space-y-3">
                                                            <div className="h-4 w-16 bg-white/10 rounded" />
                                                            <div className="space-y-1">
                                                                <div className="h-3 w-12 bg-white/5 rounded" />
                                                                <div className="h-10 w-full bg-white/5 rounded-lg" />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <div className="h-3 w-12 bg-white/5 rounded" />
                                                                <div className="h-20 w-full bg-white/5 rounded-lg" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : slides.length === 0 ? (
                                        <div className="text-center py-12 text-zinc-500">
                                            <p className="mb-2">Nenhum slide gerado.</p>
                                        </div>
                                    ) : (
                                        slides.map((slide, index) => (
                                            <div key={slide.id} className="bg-black/20 border border-white/5 rounded-xl p-4">
                                                <div className="flex gap-4">
                                                    {/* Column 1: Image (Fixed Width) */}
                                                    <div className="w-24 shrink-0 flex flex-col gap-2 pt-6">
                                                        <div 
                                                            className="relative w-24 h-24 bg-black/40 rounded-lg overflow-hidden border border-white/10 group cursor-pointer hover:border-primary/50 transition-colors"
                                                            onClick={() => handleOpenUploadModal(slide.id)}
                                                            title="Clique para alterar imagem"
                                                        >
                                                            {slide.imageUrl ? (
                                                                <img src={slide.imageUrl} className="w-full h-full object-cover" alt="Slide background" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-zinc-600 group-hover:text-zinc-400">
                                                                    <ImageIcon className="w-8 h-8" />
                                                                </div>
                                                            )}
                                                            
                                                            {/* Hover Overlay */}
                                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                                <UploadIcon className="w-6 h-6 text-white" />
                                                            </div>

                                                            {slide.isLoadingImage && (
                                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                                    <LoaderIcon className="w-6 h-6 animate-spin text-white" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => handleOpenUploadModal(slide.id)}
                                                            className="w-full py-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 rounded-lg text-[10px] font-medium transition-colors flex items-center justify-center gap-1"
                                                        >
                                                            <UploadIcon className="w-3 h-3" /> Upload
                                                        </button>
                                                    </div>

                                                    {/* Column 2: Inputs (Flexible) */}
                                                    <div className="flex-1 space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-bold text-zinc-500 uppercase">Slide {index + 1}</span>
                                                        </div>

                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Título</label>
                                                            <div className="relative group">
                                                                <input 
                                                                    value={slide.title}
                                                                    onChange={(e) => handleTextContentChange(slide.id, 'title', e.target.value)}
                                                                    className="w-full bg-background border border-zinc-700 rounded-lg p-2 pr-10 text-sm text-white focus:border-primary focus:outline-none transition-colors"
                                                                    placeholder="Título do slide..."
                                                                    disabled={regeneratingField?.slideId === slide.id && regeneratingField?.field === 'title'}
                                                                />
                                                                <button 
                                                                    onClick={() => handleRegenerateField(slide.id, 'title')}
                                                                    disabled={!!regeneratingField}
                                                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-zinc-800/80 hover:bg-primary text-zinc-400 hover:text-white rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 disabled:opacity-100"
                                                                    title="Regenerar Título com IA"
                                                                >
                                                                    {regeneratingField?.slideId === slide.id && regeneratingField?.field === 'title' ? (
                                                                        <LoaderIcon className="w-3 h-3 animate-spin" />
                                                                    ) : (
                                                                        <RefreshIcon className="w-3 h-3" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Texto</label>
                                                            <div className="relative group">
                                                                <textarea 
                                                                    value={slide.body}
                                                                    onChange={(e) => handleTextContentChange(slide.id, 'body', e.target.value)}
                                                                    className="w-full bg-background border border-zinc-700 rounded-lg p-2 pr-10 text-sm text-white focus:border-primary focus:outline-none resize-none h-20 transition-colors"
                                                                    placeholder="Conteúdo do slide..."
                                                                    disabled={regeneratingField?.slideId === slide.id && regeneratingField?.field === 'body'}
                                                                />
                                                                <button 
                                                                    onClick={() => handleRegenerateField(slide.id, 'body')}
                                                                    disabled={!!regeneratingField}
                                                                    className="absolute right-2 top-2 p-1.5 bg-zinc-800/80 hover:bg-primary text-zinc-400 hover:text-white rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 disabled:opacity-100"
                                                                    title="Regenerar Texto com IA"
                                                                >
                                                                    {regeneratingField?.slideId === slide.id && regeneratingField?.field === 'body' ? (
                                                                        <LoaderIcon className="w-3 h-3 animate-spin" />
                                                                    ) : (
                                                                        <RefreshIcon className="w-3 h-3" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* EDIT TAB */}
                            {activeTab === 'edit' && (
                                <div className="animate-in fade-in duration-300 h-full">
                                    {/* SUGGESTED CAPTION */}
                                    {(caption || isGenerating) && (
                                    <div className="mb-6 bg-surface border border-white/10 rounded-xl p-4 relative overflow-hidden shadow-lg group">
                                        {/* ... Caption content ... */}
                                        {isGenerating ? (
                                        <div className="space-y-3 animate-pulse">
                                            <div className="h-4 w-32 bg-white/10 rounded" />
                                            <div className="space-y-2">
                                                <div className="h-3 w-full bg-white/10 rounded" />
                                                <div className="h-3 w-3/4 bg-white/10 rounded" />
                                            </div>
                                        </div>
                                        ) : (
                                        <>
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-sm font-bold flex items-center gap-2 text-white">
                                                <InstagramIcon className="w-4 h-4 text-pink-500" /> 
                                                Legenda Sugerida
                                                </h3>
                                                <button 
                                                    onClick={copyToClipboard}
                                                    className={`p-1.5 rounded-lg text-xs font-medium transition-all ${isCopied ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'}`}
                                                    title="Copiar Legenda"
                                                >
                                                    {isCopied ? <CheckIcon className="w-3 h-3" /> : <CopyIcon className="w-3 h-3" />}
                                                </button>
                                            </div>
                                            
                                            <div className="bg-black/30 p-3 rounded-lg text-zinc-300 text-xs md:text-sm whitespace-pre-wrap leading-relaxed border border-white/5 font-mono max-h-60 overflow-y-auto custom-scrollbar">
                                            {caption}
                                            </div>
                                        </>
                                        )}
                                    </div>
                                    )}

                                    {slides.length === 0 ? (
                                        <div className="text-center py-12 text-zinc-500">
                                            <p className="mb-2">Nenhum slide gerado ainda.</p>
                                            <button onClick={() => setActiveTab('config')} className="text-primary hover:underline">
                                                Vá para Configuração para começar.
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {/* Header with Scope */}
                                            <div className="flex items-center justify-between pb-2 border-b border-white/5">
                                                {/* ... Scope Controls ... */}
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-zinc-500 uppercase">
                                                        {editingSlideId !== null ? `Slide ${editingSlideId + 1}` : 'Edição Global'}
                                                    </span>
                                                    {editingSlideId !== null && (
                                                        <button 
                                                            onClick={handleDeselectSlide}
                                                            className="text-[10px] text-primary hover:underline font-bold"
                                                        >
                                                            (Voltar para Todos)
                                                        </button>
                                                    )}
                                                </div>
                                                
                                                <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/5">
                                                    <button
                                                        onClick={() => setEditScope('individual')}
                                                        disabled={editingSlideId === null}
                                                        className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${editScope === 'individual' ? 'bg-primary text-white shadow-sm' : 'text-zinc-500'} ${editingSlideId === null ? 'opacity-50 cursor-not-allowed' : 'hover:text-zinc-300'}`}
                                                    >
                                                        Único
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditScope('global');
                                                            setEditingSlideId(null);
                                                        }}
                                                        className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${editScope === 'global' ? 'bg-primary text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                                                    >
                                                        Todos
                                                    </button>
                                                </div>
                                            </div>

                                            {/* 1. Layout & Position */}
                                            <div className="space-y-3 border-b border-white/5 pb-4">
                                                {/* ... Layout ... */}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleSection('layout')}
                                                    className="w-full flex items-center justify-between text-left group"
                                                >
                                                    <h5 className="text-xs font-bold text-zinc-400 group-hover:text-white transition-colors">Posição do Texto</h5>
                                                    {expandedSections.layout ? <ChevronUpIcon className="w-4 h-4 text-zinc-500" /> : <ChevronDownIcon className="w-4 h-4 text-zinc-500" />}
                                                </button>
                                                
                                                {expandedSections.layout && (
                                                <div className="grid grid-cols-3 gap-2 bg-black/40 p-3 rounded-lg border border-white/5 shadow-inner animate-in slide-in-from-top-2 duration-200">
                                                    {[
                                                    TextLayout.TOP_LEFT, TextLayout.TOP_CENTER, TextLayout.TOP_RIGHT,
                                                    TextLayout.MIDDLE_LEFT, TextLayout.CENTER, TextLayout.MIDDLE_RIGHT,
                                                    TextLayout.BOTTOM_LEFT, TextLayout.BOTTOM_CENTER, TextLayout.BOTTOM_RIGHT
                                                    ].map((l) => (
                                                    <button
                                                        key={l}
                                                        onClick={() => handleUpdateLayout(l)}
                                                        className={`w-full aspect-square rounded-md flex items-center justify-center transition-all ${activeLayout === l ? 'bg-primary text-white shadow-lg' : 'bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-white'}`}
                                                        title={l.replace('_', ' ')}
                                                    >
                                                        <div className="w-3 h-3 border border-current rounded-[1px] relative opacity-90">
                                                            <div className={`absolute w-1 h-1 bg-current rounded-[0.5px]
                                                            ${l.includes('top') ? 'top-0' : l.includes('bottom') ? 'bottom-0' : 'top-1/2 -translate-y-1/2'}
                                                            ${l.includes('left') ? 'left-0' : l.includes('right') ? 'right-0' : 'left-1/2 -translate-x-1/2'}
                                                            `}></div>
                                                        </div>
                                                    </button>
                                                    ))}
                                                </div>
                                                )}
                                            </div>

                                            {/* 2. Visibility & Typography */}
                                            <div className="space-y-4 border-b border-white/5 pb-4">
                                                {/* ... Typography & Bg Controls ... */}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleSection('content')}
                                                    className="w-full flex items-center justify-between text-left group"
                                                >
                                                    <h5 className="text-xs font-bold text-zinc-400 group-hover:text-white transition-colors">Conteúdo & Fonte</h5>
                                                    {expandedSections.content ? <ChevronUpIcon className="w-4 h-4 text-zinc-500" /> : <ChevronDownIcon className="w-4 h-4 text-zinc-500" />}
                                                </button>
                                                
                                                {expandedSections.content && (
                                                <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                                                    {/* Title Controls */}
                                                    <div className="space-y-2 bg-black/20 p-3 rounded-lg border border-white/5">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <label className="text-sm font-medium">Título</label>
                                                            <input 
                                                                type="checkbox" 
                                                                checked={currentEditingStyle.showTitle} 
                                                                onChange={(e) => handleStyleChange('showTitle', e.target.checked)}
                                                                className="accent-primary" 
                                                            />
                                                        </div>
                                                        {currentEditingStyle.showTitle && (
                                                            <div className="space-y-4">
                                                                <div className="space-y-2">
                                                                    <select 
                                                                        value={currentEditingStyle.titleFont}
                                                                        onChange={(e) => handleStyleChange('titleFont', e.target.value)}
                                                                        className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-zinc-300 focus:border-primary focus:outline-none"
                                                                    >
                                                                        {FONT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                                                    </select>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[10px] text-zinc-500 w-8">Tam.</span>
                                                                        <input 
                                                                            type="range" min="16" max="64" 
                                                                            value={currentEditingStyle.titleSize}
                                                                            onChange={(e) => handleStyleChange('titleSize', Number(e.target.value))}
                                                                            className="flex-1 accent-primary h-1 bg-zinc-700 rounded-lg appearance-none"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* Title Background Controls */}
                                                                <div className="space-y-2 pt-2 border-t border-white/5">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <span className="text-[10px] text-zinc-500 uppercase font-bold">Fundo do Título</span>
                                                                        <input 
                                                                            type="checkbox" 
                                                                            checked={currentEditingStyle.titleBgEnabled} 
                                                                            onChange={(e) => handleStyleChange('titleBgEnabled', e.target.checked)}
                                                                            className="accent-primary" 
                                                                        />
                                                                    </div>
                                                                    {currentEditingStyle.titleBgEnabled && (
                                                                        <div className="space-y-3 pl-2 border-l-2 border-white/5">
                                                                            {/* Dimensions Section */}
                                                                            <div className="space-y-2">
                                                                                 <span className="text-[10px] text-zinc-400 font-bold uppercase">Dimensões do Fundo</span>
                                                                                 {/* ... controls ... */}
                                                                                 <div className="space-y-1">
                                                                                    <div className="flex justify-between text-[10px] text-zinc-500">
                                                                                        <span>Largura</span>
                                                                                        <span>{currentEditingStyle.titleBgWidth === 0 ? 'Auto' : `${currentEditingStyle.titleBgWidth}%`}</span>
                                                                                    </div>
                                                                                    <input 
                                                                                        type="range" min="0" max="100"
                                                                                        value={currentEditingStyle.titleBgWidth}
                                                                                        onChange={(e) => handleStyleChange('titleBgWidth', Number(e.target.value))}
                                                                                        className="w-full accent-primary h-1 bg-zinc-700 rounded-lg appearance-none"
                                                                                    />
                                                                                </div>

                                                                                 <div className="space-y-1">
                                                                                    <div className="flex justify-between text-[10px] text-zinc-500">
                                                                                        <span>Altura (Padding)</span>
                                                                                        <span>{currentEditingStyle.titleBgPaddingY}px</span>
                                                                                    </div>
                                                                                    <input 
                                                                                        type="range" min="0" max="60"
                                                                                        value={currentEditingStyle.titleBgPaddingY}
                                                                                        onChange={(e) => handleStyleChange('titleBgPaddingY', Number(e.target.value))}
                                                                                        className="w-full accent-primary h-1 bg-zinc-700 rounded-lg appearance-none"
                                                                                    />
                                                                                </div>

                                                                                 <div className="space-y-1">
                                                                                    <div className="flex justify-between text-[10px] text-zinc-500">
                                                                                        <span>Espaçamento H</span>
                                                                                        <span>{currentEditingStyle.titleBgPaddingX}px</span>
                                                                                    </div>
                                                                                    <input 
                                                                                        type="range" min="0" max="60"
                                                                                        value={currentEditingStyle.titleBgPaddingX}
                                                                                        onChange={(e) => handleStyleChange('titleBgPaddingX', Number(e.target.value))}
                                                                                        className="w-full accent-primary h-1 bg-zinc-700 rounded-lg appearance-none"
                                                                                    />
                                                                                </div>
                                                                            </div>

                                                                            <div className="h-px bg-white/5 my-2" />

                                                                            <div className="flex items-center justify-between">
                                                                                <span className="text-[10px] text-zinc-400">Cor</span>
                                                                                <div className="relative overflow-hidden w-5 h-5 rounded-full ring-1 ring-white/10">
                                                                                    <input 
                                                                                        type="color" 
                                                                                        value={currentEditingStyle.titleBgColor}
                                                                                        onChange={(e) => {
                                                                                            handleStyleChange('titleBgColor', e.target.value);
                                                                                            handleStyleChange('titleBgGradient', null);
                                                                                        }}
                                                                                        className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] p-0 cursor-pointer border-none" 
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                             <div className="grid grid-cols-5 gap-1">
                                                                                {GRADIENT_PRESETS.slice(0, 5).map((grad) => (
                                                                                    <button
                                                                                        key={grad.name}
                                                                                        onClick={() => handleStyleChange('titleBgGradient', grad.value)}
                                                                                        className={`w-full aspect-square rounded-sm border transition-all ${currentEditingStyle.titleBgGradient === grad.value ? 'border-primary' : 'border-white/10'}`}
                                                                                        style={{ background: grad.value }}
                                                                                        title={grad.name}
                                                                                    />
                                                                                ))}
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <div className="flex justify-between text-[10px] text-zinc-500">
                                                                                    <span>Opacidade</span>
                                                                                    <span>{Math.round(currentEditingStyle.titleBgOpacity * 100)}%</span>
                                                                                </div>
                                                                                <input 
                                                                                    type="range" min="0" max="1" step="0.1"
                                                                                    value={currentEditingStyle.titleBgOpacity}
                                                                                    onChange={(e) => handleStyleChange('titleBgOpacity', Number(e.target.value))}
                                                                                    className="w-full accent-primary h-1 bg-zinc-700 rounded-lg appearance-none"
                                                                                />
                                                                            </div>
                                                                             <div className="space-y-1">
                                                                                <div className="flex justify-between text-[10px] text-zinc-500">
                                                                                    <span>Raio</span>
                                                                                    <span>{currentEditingStyle.titleBgRadius}px</span>
                                                                                </div>
                                                                                <input 
                                                                                    type="range" min="0" max="24"
                                                                                    value={currentEditingStyle.titleBgRadius}
                                                                                    onChange={(e) => handleStyleChange('titleBgRadius', Number(e.target.value))}
                                                                                    className="w-full accent-primary h-1 bg-zinc-700 rounded-lg appearance-none"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Title Transform Controls */}
                                                                <div className="space-y-2 pt-2 border-t border-white/5">
                                                                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Posição & Zoom</span>
                                                                    <div className="space-y-1">
                                                                        <div className="flex justify-between text-[10px] text-zinc-500">
                                                                            <span>Posição H</span>
                                                                            <span>{currentEditingStyle.titleOffsetX}px</span>
                                                                        </div>
                                                                        <input 
                                                                            type="range" min="-500" max="500"
                                                                            value={currentEditingStyle.titleOffsetX}
                                                                            onChange={(e) => handleStyleChange('titleOffsetX', Number(e.target.value))}
                                                                            className="w-full accent-primary h-1 bg-zinc-700 rounded-lg appearance-none"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <div className="flex justify-between text-[10px] text-zinc-500">
                                                                            <span>Posição V</span>
                                                                            <span>{currentEditingStyle.titleOffsetY}px</span>
                                                                        </div>
                                                                        <input 
                                                                            type="range" min="-800" max="800"
                                                                            value={currentEditingStyle.titleOffsetY}
                                                                            onChange={(e) => handleStyleChange('titleOffsetY', Number(e.target.value))}
                                                                            className="w-full accent-primary h-1 bg-zinc-700 rounded-lg appearance-none"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <div className="flex justify-between text-[10px] text-zinc-500">
                                                                            <span>Zoom</span>
                                                                            <span>{currentEditingStyle.titleScale}%</span>
                                                                        </div>
                                                                        <input 
                                                                            type="range" min="50" max="200"
                                                                            value={currentEditingStyle.titleScale}
                                                                            onChange={(e) => handleStyleChange('titleScale', Number(e.target.value))}
                                                                            className="w-full accent-primary h-1 bg-zinc-700 rounded-lg appearance-none"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Body Controls */}
                                                    <div className="space-y-2 bg-black/20 p-3 rounded-lg border border-white/5">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <label className="text-sm font-medium">Texto</label>
                                                            <input 
                                                                type="checkbox" 
                                                                checked={currentEditingStyle.showBody} 
                                                                onChange={(e) => handleStyleChange('showBody', e.target.checked)}
                                                                className="accent-primary" 
                                                            />
                                                        </div>
                                                        {currentEditingStyle.showBody && (
                                                            <div className="space-y-4">
                                                                <div className="space-y-2">
                                                                    <select 
                                                                        value={currentEditingStyle.bodyFont}
                                                                        onChange={(e) => handleStyleChange('bodyFont', e.target.value)}
                                                                        className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-zinc-300 focus:border-primary focus:outline-none"
                                                                    >
                                                                        {FONT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                                                    </select>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[10px] text-zinc-500 w-8">Tam.</span>
                                                                        <input 
                                                                            type="range" min="10" max="32" 
                                                                            value={currentEditingStyle.bodySize}
                                                                            onChange={(e) => handleStyleChange('bodySize', Number(e.target.value))}
                                                                            className="flex-1 accent-primary h-1 bg-zinc-700 rounded-lg appearance-none"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {/* Body Background Controls */}
                                                                <div className="space-y-2 pt-2 border-t border-white/5">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <span className="text-[10px] text-zinc-500 uppercase font-bold">Fundo do Texto</span>
                                                                        <input 
                                                                            type="checkbox" 
                                                                            checked={currentEditingStyle.bodyBgEnabled} 
                                                                            onChange={(e) => handleStyleChange('bodyBgEnabled', e.target.checked)}
                                                                            className="accent-primary" 
                                                                        />
                                                                    </div>
                                                                    {currentEditingStyle.bodyBgEnabled && (
                                                                        <div className="space-y-3 pl-2 border-l-2 border-white/5">
                                                                            {/* Dimensions Section */}
                                                                            <div className="space-y-2">
                                                                                 <span className="text-[10px] text-zinc-400 font-bold uppercase">Dimensões do Fundo</span>
                                                                                 
                                                                                 <div className="space-y-1">
                                                                                    <div className="flex justify-between text-[10px] text-zinc-500">
                                                                                        <span>Largura</span>
                                                                                        <span>{currentEditingStyle.bodyBgWidth === 0 ? 'Auto' : `${currentEditingStyle.bodyBgWidth}%`}</span>
                                                                                    </div>
                                                                                    <input 
                                                                                        type="range" min="0" max="100"
                                                                                        value={currentEditingStyle.bodyBgWidth}
                                                                                        onChange={(e) => handleStyleChange('bodyBgWidth', Number(e.target.value))}
                                                                                        className="w-full accent-primary h-1 bg-zinc-700 rounded-lg appearance-none"
                                                                                    />
                                                                                </div>

                                                                                 <div className="space-y-1">
                                                                                    <div className="flex justify-between text-[10px] text-zinc-500">
                                                                                        <span>Altura (Padding)</span>
                                                                                        <span>{currentEditingStyle.bodyBgPaddingY}px</span>
                                                                                    </div>
                                                                                    <input 
                                                                                        type="range" min="0" max="60"
                                                                                        value={currentEditingStyle.bodyBgPaddingY}
                                                                                        onChange={(e) => handleStyleChange('bodyBgPaddingY', Number(e.target.value))}
                                                                                        className="w-full accent-primary h-1 bg-zinc-700 rounded-lg appearance-none"
                                                                                    />
                                                                                </div>

                                                                                 <div className="space-y-1">
                                                                                    <div className="flex justify-between text-[10px] text-zinc-500">
                                                                                        <span>Espaçamento H</span>
                                                                                        <span>{currentEditingStyle.bodyBgPaddingX}px</span>
                                                                                    </div>
                                                                                    <input 
                                                                                        type="range" min="0" max="60"
                                                                                        value={currentEditingStyle.bodyBgPaddingX}
                                                                                        onChange={(e) => handleStyleChange('bodyBgPaddingX', Number(e.target.value))}
                                                                                        className="w-full accent-primary h-1 bg-zinc-700 rounded-lg appearance-none"
                                                                                    />
                                                                                </div>
                                                                            </div>

                                                                            <div className="h-px bg-white/5 my-2" />

                                                                            <div className="flex items-center justify-between">
                                                                                <span className="text-[10px] text-zinc-400">Cor</span>
                                                                                <div className="relative overflow-hidden w-5 h-5 rounded-full ring-1 ring-white/10">
                                                                                    <input 
                                                                                        type="color" 
                                                                                        value={currentEditingStyle.bodyBgColor}
                                                                                        onChange={(e) => {
                                                                                            handleStyleChange('bodyBgColor', e.target.value);
                                                                                            handleStyleChange('bodyBgGradient', null);
                                                                                        }}
                                                                                        className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] p-0 cursor-pointer border-none" 
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                             <div className="grid grid-cols-5 gap-1">
                                                                                {GRADIENT_PRESETS.slice(0, 5).map((grad) => (
                                                                                    <button
                                                                                        key={grad.name}
                                                                                        onClick={() => handleStyleChange('bodyBgGradient', grad.value)}
                                                                                        className={`w-full aspect-square rounded-sm border transition-all ${currentEditingStyle.bodyBgGradient === grad.value ? 'border-primary' : 'border-white/10'}`}
                                                                                        style={{ background: grad.value }}
                                                                                        title={grad.name}
                                                                                    />
                                                                                ))}
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <div className="flex justify-between text-[10px] text-zinc-500">
                                                                                    <span>Opacidade</span>
                                                                                    <span>{Math.round(currentEditingStyle.bodyBgOpacity * 100)}%</span>
                                                                                </div>
                                                                                <input 
                                                                                    type="range" min="0" max="1" step="0.1"
                                                                                    value={currentEditingStyle.bodyBgOpacity}
                                                                                    onChange={(e) => handleStyleChange('bodyBgOpacity', Number(e.target.value))}
                                                                                    className="w-full accent-primary h-1 bg-zinc-700 rounded-lg appearance-none"
                                                                                />
                                                                            </div>
                                                                             <div className="space-y-1">
                                                                                <div className="flex justify-between text-[10px] text-zinc-500">
                                                                                    <span>Raio</span>
                                                                                    <span>{currentEditingStyle.bodyBgRadius}px</span>
                                                                                </div>
                                                                                <input 
                                                                                    type="range" min="0" max="24"
                                                                                    value={currentEditingStyle.bodyBgRadius}
                                                                                    onChange={(e) => handleStyleChange('bodyBgRadius', Number(e.target.value))}
                                                                                    className="w-full accent-primary h-1 bg-zinc-700 rounded-lg appearance-none"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Body Transform Controls */}
                                                                <div className="space-y-2 pt-2 border-t border-white/5">
                                                                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Posição & Zoom</span>
                                                                    <div className="space-y-1">
                                                                        <div className="flex justify-between text-[10px] text-zinc-500">
                                                                            <span>Posição H</span>
                                                                            <span>{currentEditingStyle.bodyOffsetX}px</span>
                                                                        </div>
                                                                        <input 
                                                                            type="range" min="-500" max="500"
                                                                            value={currentEditingStyle.bodyOffsetX}
                                                                            onChange={(e) => handleStyleChange('bodyOffsetX', Number(e.target.value))}
                                                                            className="w-full accent-primary h-1 bg-zinc-700 rounded-lg appearance-none"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <div className="flex justify-between text-[10px] text-zinc-500">
                                                                            <span>Posição V</span>
                                                                            <span>{currentEditingStyle.bodyOffsetY}px</span>
                                                                        </div>
                                                                        <input 
                                                                            type="range" min="-800" max="800"
                                                                            value={currentEditingStyle.bodyOffsetY}
                                                                            onChange={(e) => handleStyleChange('bodyOffsetY', Number(e.target.value))}
                                                                            className="w-full accent-primary h-1 bg-zinc-700 rounded-lg appearance-none"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <div className="flex justify-between text-[10px] text-zinc-500">
                                                                            <span>Zoom</span>
                                                                            <span>{currentEditingStyle.bodyScale}%</span>
                                                                        </div>
                                                                        <input 
                                                                            type="range" min="50" max="200"
                                                                            value={currentEditingStyle.bodyScale}
                                                                            onChange={(e) => handleStyleChange('bodyScale', Number(e.target.value))}
                                                                            className="w-full accent-primary h-1 bg-zinc-700 rounded-lg appearance-none"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                )}
                                            </div>

                                            {/* 3. Colors & Background */}
                                            <div className="space-y-4 border-b border-white/5 pb-4">
                                                {/* ... (Existing code for Background Style) ... */}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleSection('style')}
                                                    className="w-full flex items-center justify-between text-left group"
                                                >
                                                    <h5 className="text-xs font-bold text-zinc-400 group-hover:text-white transition-colors">Estilo</h5>
                                                    {expandedSections.style ? <ChevronUpIcon className="w-4 h-4 text-zinc-500" /> : <ChevronDownIcon className="w-4 h-4 text-zinc-500" />}
                                                </button>
                                                
                                                {expandedSections.style && (
                                                <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                                                    <div className="p-3 bg-black/20 rounded-lg border border-white/5 space-y-4">
                                                        {/* ... (Existing Background controls: Width, Height, Radius, etc.) ... */}
                                                        {/* Width Control */}
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between text-[10px] text-zinc-500">
                                                                <span>Largura do Fundo</span>
                                                                <span>{currentEditingStyle.containerWidth}%</span>
                                                            </div>
                                                            <input 
                                                                type="range" min="50" max="100"
                                                                value={currentEditingStyle.containerWidth}
                                                                onChange={(e) => handleStyleChange('containerWidth', Number(e.target.value))}
                                                                className="w-full accent-primary h-1 bg-zinc-700 rounded-lg appearance-none"
                                                            />
                                                        </div>

                                                        {/* Height Control */}
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between text-[10px] text-zinc-500">
                                                                <span>Altura do Fundo</span>
                                                                <span>{currentEditingStyle.containerHeight === 0 ? 'Auto' : `${currentEditingStyle.containerHeight}%`}</span>
                                                            </div>
                                                            <input 
                                                                type="range" min="0" max="100"
                                                                value={currentEditingStyle.containerHeight}
                                                                onChange={(e) => handleStyleChange('containerHeight', Number(e.target.value))}
                                                                className="w-full accent-primary h-1 bg-zinc-700 rounded-lg appearance-none"
                                                            />
                                                        </div>

                                                        {/* Radius Control */}
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between text-[10px] text-zinc-500">
                                                                <span>Arredondamento</span>
                                                                <span>{currentEditingStyle.containerRadius}px</span>
                                                            </div>
                                                            <input 
                                                                type="range" min="0" max="48"
                                                                value={currentEditingStyle.containerRadius}
                                                                onChange={(e) => handleStyleChange('containerRadius', Number(e.target.value))}
                                                                className="w-full accent-primary h-1 bg-zinc-700 rounded-lg appearance-none"
                                                            />
                                                        </div>

                                                        {/* Blur Control */}
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between text-[10px] text-zinc-500">
                                                                <span>Blur (Desfoque)</span>
                                                                <span>{currentEditingStyle.containerBlur}px</span>
                                                            </div>
                                                            <input 
                                                                type="range" min="0" max="20"
                                                                value={currentEditingStyle.containerBlur}
                                                                onChange={(e) => handleStyleChange('containerBlur', Number(e.target.value))}
                                                                className="w-full accent-primary h-1 bg-zinc-700 rounded-lg appearance-none"
                                                            />
                                                        </div>

                                                        {/* Opacity Control */}
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between text-[10px] text-zinc-500">
                                                                <span>Opacidade</span>
                                                                <span>{Math.round(currentEditingStyle.containerOpacity * 100)}%</span>
                                                            </div>
                                                            <input 
                                                                type="range" min="0" max="1" step="0.1"
                                                                value={currentEditingStyle.containerOpacity}
                                                                onChange={(e) => handleStyleChange('containerOpacity', Number(e.target.value))}
                                                                className="w-full accent-primary h-1 bg-zinc-700 rounded-lg appearance-none"
                                                            />
                                                        </div>

                                                        <div className="h-px bg-white/5 my-2" />

                                                        {/* Background Color & Gradient */}
                                                        <div className="space-y-3">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <input 
                                                                    type="checkbox" 
                                                                    id="transparentBg"
                                                                    checked={currentEditingStyle.isTransparent}
                                                                    onChange={(e) => handleStyleChange('isTransparent', e.target.checked)}
                                                                    className="accent-primary" 
                                                                />
                                                                <label htmlFor="transparentBg" className="text-xs text-zinc-300">Fundo Transparente</label>
                                                            </div>

                                                            {!currentEditingStyle.isTransparent && (
                                                                <>
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-xs text-zinc-400">Cor Sólida</span>
                                                                        <div className="relative overflow-hidden w-6 h-6 rounded-full ring-1 ring-white/10">
                                                                            <input 
                                                                                type="color" 
                                                                                value={currentEditingStyle.containerColor}
                                                                                onChange={(e) => {
                                                                                    handleStyleChange('containerColor', e.target.value);
                                                                                    handleStyleChange('containerGradient', null); // Reset gradient
                                                                                }}
                                                                                className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] p-0 cursor-pointer border-none" 
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <div className="space-y-2">
                                                                        <span className="text-xs text-zinc-400">Gradientes</span>
                                                                        <div className="grid grid-cols-4 gap-2">
                                                                            {GRADIENT_PRESETS.map((grad) => (
                                                                                <button
                                                                                    key={grad.name}
                                                                                    onClick={() => handleStyleChange('containerGradient', grad.value)}
                                                                                    className={`w-full aspect-square rounded-full border transition-all ${currentEditingStyle.containerGradient === grad.value ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-black' : 'border-white/10 hover:scale-105'}`}
                                                                                    style={{ background: grad.value }}
                                                                                    title={grad.name}
                                                                                />
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>

                                                        <div className="h-px bg-white/5 my-2" />

                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm text-zinc-300">Cor Título</span>
                                                            <div className="relative overflow-hidden w-6 h-6 rounded-full ring-1 ring-white/10">
                                                                <input 
                                                                    type="color" 
                                                                    value={currentEditingStyle.titleColor}
                                                                    onChange={(e) => handleStyleChange('titleColor', e.target.value)}
                                                                    className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] p-0 cursor-pointer border-none" 
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm text-zinc-300">Cor Texto</span>
                                                            <div className="relative overflow-hidden w-6 h-6 rounded-full ring-1 ring-white/10">
                                                                <input 
                                                                    type="color" 
                                                                    value={currentEditingStyle.bodyColor}
                                                                    onChange={(e) => handleStyleChange('bodyColor', e.target.value)}
                                                                    className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] p-0 cursor-pointer border-none" 
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                )}
                                            </div>

                                            {/* 4. Images Controls */}
                                            <div className="space-y-4">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleSection('images')}
                                                    className="w-full flex items-center justify-between text-left group"
                                                >
                                                    <h5 className="text-xs font-bold text-zinc-400 group-hover:text-white transition-colors">Imagens</h5>
                                                    {expandedSections.images ? <ChevronUpIcon className="w-4 h-4 text-zinc-500" /> : <ChevronDownIcon className="w-4 h-4 text-zinc-500" />}
                                                </button>
                                                
                                                {expandedSections.images && (
                                                <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                                                    <div className="p-3 bg-black/20 rounded-lg border border-white/5 space-y-4">
                                                        
                                                        {/* NEW: Vertical Repeat Control */}
                                                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/5">
                                                            <span className="text-[10px] text-zinc-500 font-bold uppercase">Padrão / Textura</span>
                                                            <div className="flex items-center gap-2">
                                                                <label htmlFor="imgRepeat" className="text-xs text-zinc-300">Repetir Verticalmente</label>
                                                                <input 
                                                                    type="checkbox" 
                                                                    id="imgRepeat"
                                                                    checked={currentEditingStyle.imageRepeat} 
                                                                    onChange={(e) => handleStyleChange('imageRepeat', e.target.checked)}
                                                                    className="accent-primary" 
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Scale / Zoom Control */}
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between text-[10px] text-zinc-500">
                                                                <span>Zoom</span>
                                                                <span>{currentEditingStyle.imageScale}%</span>
                                                            </div>
                                                            <input 
                                                                type="range" min="100" max="300"
                                                                value={currentEditingStyle.imageScale}
                                                                onChange={(e) => handleStyleChange('imageScale', Number(e.target.value))}
                                                                className="w-full accent-primary h-1 bg-zinc-700 rounded-lg appearance-none"
                                                            />
                                                        </div>

                                                        {/* Position X */}
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between text-[10px] text-zinc-500">
                                                                <span>Posição Horizontal</span>
                                                                <span>{currentEditingStyle.imageOffsetX}%</span>
                                                            </div>
                                                            <input 
                                                                type="range" min="-100" max="100"
                                                                value={currentEditingStyle.imageOffsetX}
                                                                onChange={(e) => handleStyleChange('imageOffsetX', Number(e.target.value))}
                                                                className="w-full accent-primary h-1 bg-zinc-700 rounded-lg appearance-none"
                                                            />
                                                        </div>

                                                        {/* Position Y */}
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between text-[10px] text-zinc-500">
                                                                <span>Posição Vertical</span>
                                                                <span>{currentEditingStyle.imageOffsetY}%</span>
                                                            </div>
                                                            <input 
                                                                type="range" min="-100" max="100"
                                                                value={currentEditingStyle.imageOffsetY}
                                                                onChange={(e) => handleStyleChange('imageOffsetY', Number(e.target.value))}
                                                                className="w-full accent-primary h-1 bg-zinc-700 rounded-lg appearance-none"
                                                            />
                                                        </div>

                                                        <div className="h-px bg-white/5 my-2" />

                                                        {/* Brightness Control */}
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between text-[10px] text-zinc-500">
                                                                <span>Brilho</span>
                                                                <span>{currentEditingStyle.imageBrightness}%</span>
                                                            </div>
                                                            <input 
                                                                type="range" min="0" max="200"
                                                                value={currentEditingStyle.imageBrightness}
                                                                onChange={(e) => handleStyleChange('imageBrightness', Number(e.target.value))}
                                                                className="w-full accent-primary h-1 bg-zinc-700 rounded-lg appearance-none"
                                                            />
                                                        </div>

                                                        {/* Saturation Control */}
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between text-[10px] text-zinc-500">
                                                                <span>Saturação</span>
                                                                <span>{currentEditingStyle.imageSaturation}%</span>
                                                            </div>
                                                            <input 
                                                                type="range" min="0" max="200"
                                                                value={currentEditingStyle.imageSaturation}
                                                                onChange={(e) => handleStyleChange('imageSaturation', Number(e.target.value))}
                                                                className="w-full accent-primary h-1 bg-zinc-700 rounded-lg appearance-none"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {error && (
                                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-center text-sm">
                                {error}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

        </div>
      </main>
    </div>
  );
};

export default App;