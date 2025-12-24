import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { SlideContent, AspectRatio, Vibe, SlideStyle, TextLayout } from '../types';
import { LoaderIcon, RefreshIcon, DownloadIcon, UploadIcon, LayoutIcon, SparklesIcon, CheckIcon } from './Icons';
import { ASPECT_RATIOS, LAYOUT_CLASSES } from '../constants';

interface SlideCardProps {
  slide: SlideContent;
  aspectRatio: AspectRatio;
  vibe: Vibe;
  computedStyle: SlideStyle;
  isSelected: boolean;
  isSkeleton?: boolean;
  onRegenerateImage: (slideId: number, prompt: string) => void;
  onOpenUploadModal: (slideId: number) => void;
  onEditLayout: (slideId: number) => void;
  fontEmbedCSS?: string;
}

const SlideCard: React.FC<SlideCardProps> = ({ 
  slide, 
  aspectRatio, 
  vibe, 
  computedStyle, 
  isSelected,
  isSkeleton = false,
  onRegenerateImage, 
  onOpenUploadModal, 
  onEditLayout,
  fontEmbedCSS
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  
  const ratioClass = ASPECT_RATIOS.find(r => r.value === aspectRatio)?.class || 'aspect-square';
  
  // Layout Logic
  const layoutClass = LAYOUT_CLASSES[slide.layout || TextLayout.CENTER];

  // Logic to remove padding when width is 100% to allow edge-to-edge styling
  const containerPadding = computedStyle.containerWidth >= 100 ? 'p-0' : 'p-8';

  // SKELETON RENDER
  if (isSkeleton) {
    return (
      <div className={`relative w-full ${ratioClass} overflow-hidden rounded-xl bg-surface border border-white/5 shadow-xl`}>
        {/* Background Pulse */}
        <div className="absolute inset-0 bg-zinc-800 animate-pulse" />
        
        {/* Content Placeholder */}
        <div className={`absolute inset-0 p-8 flex flex-col z-10 ${layoutClass}`}>
          <div className="p-6 w-full backdrop-blur-sm bg-black/10 rounded-xl space-y-4 border border-white/5">
             {/* Title Bone */}
             <div className="h-8 bg-white/10 rounded w-3/4 animate-pulse mb-2" />
             {/* Body Bones */}
             <div className="space-y-2">
                 <div className="h-4 bg-white/10 rounded w-full animate-pulse" />
                 <div className="h-4 bg-white/10 rounded w-5/6 animate-pulse" />
                 <div className="h-4 bg-white/10 rounded w-4/6 animate-pulse" />
             </div>
          </div>
        </div>

        {/* Slide Number Placeholder */}
        <div className="absolute bottom-4 right-4 h-6 w-6 bg-white/10 rounded-full animate-pulse z-10" />
      </div>
    );
  }

  // NORMAL RENDER
  const isCover = slide.id === 0;

  // Helper to convert hex to rgba for opacity
  const hexToRgba = (hex: string, opacity: number) => {
    if (!hex) return `rgba(0,0,0,${opacity})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const getBackgroundStyle = () => {
    if (computedStyle.isTransparent) return 'transparent';
    if (computedStyle.containerGradient) return computedStyle.containerGradient;
    return hexToRgba(computedStyle.containerColor, computedStyle.containerOpacity);
  };

  const backgroundStyleValue = getBackgroundStyle();
  const blurValue = computedStyle.containerBlur > 0 ? `blur(${computedStyle.containerBlur}px)` : 'none';
  // Force 0 radius if width is 100%
  const radiusValue = computedStyle.containerWidth >= 100 ? '0px' : `${computedStyle.containerRadius}px`;
  
  // Base style for the box that has the background
  const hasFixedHeight = computedStyle.containerHeight > 0;

  const containerBoxStyle: React.CSSProperties = {
    background: backgroundStyleValue,
    backdropFilter: blurValue,
    WebkitBackdropFilter: blurValue, // Safari support
    borderRadius: radiusValue, 
    padding: computedStyle.isTransparent ? '0' : '1.5rem',
    boxShadow: computedStyle.isTransparent ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    // Height Logic
    height: hasFixedHeight ? `${computedStyle.containerHeight}%` : 'auto',
    // Center content if fixed height
    display: hasFixedHeight ? 'flex' : 'block',
    flexDirection: 'column',
    justifyContent: 'center'
  };

  // Helper to determine if we should apply style to a specific scope
  const shouldApplyStyle = (scope: 'both' | 'title' | 'body') => {
    return computedStyle.containerScope === scope;
  };

  const handleDownload = async () => {
    if (!cardRef.current || isDownloading) return;
    setIsDownloading(true);
    setIsDownloaded(false);

    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 0.95,
        fontEmbedCSS: fontEmbedCSS, // Provide CSS manually to bypass CORS/cssRules errors
        filter: (node) => {
          if (node instanceof HTMLElement && (
            node.classList.contains('slide-actions') || 
            node.classList.contains('empty-state-btn') ||
            node.classList.contains('slide-number')
          )) {
            return false;
          }
          return true;
        }
      });
      
      const link = document.createElement('a');
      link.download = `instavibe-slide-${slide.id + 1}.png`;
      link.href = dataUrl;
      link.click();

      // Show success state
      setIsDownloaded(true);
      setTimeout(() => setIsDownloaded(false), 2000);

    } catch (err) {
      console.error('Failed to download slide:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Dynamic font sizing
  const titleSize = isCover ? computedStyle.titleSize * 1.5 : computedStyle.titleSize;
  const bodySize = isCover ? computedStyle.bodySize * 1.2 : computedStyle.bodySize;

  // Image Filter & Transform
  const imageStyle: React.CSSProperties = {
    filter: `brightness(${computedStyle.imageBrightness}%) saturate(${computedStyle.imageSaturation}%)`,
    transform: `scale(${computedStyle.imageScale / 100}) translate(${computedStyle.imageOffsetX}%, ${computedStyle.imageOffsetY}%)`,
  };

  // --- Element Specific Background Helpers ---
  const getElementBg = (
      enabled: boolean, 
      color: string, 
      opacity: number, 
      gradient: string | null, 
      radius: number,
      width: number,
      padX: number,
      padY: number
    ) => {
    if (!enabled) return {};
    const bg = gradient || hexToRgba(color, opacity);
    return {
        background: bg,
        padding: `${padY}px ${padX}px`, // Vertical, Horizontal
        borderRadius: `${radius}px`,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        width: width > 0 ? `${width}%` : 'fit-content',
        boxSizing: 'border-box' as const,
    };
  };

  const titleBgStyle = getElementBg(
      computedStyle.titleBgEnabled, 
      computedStyle.titleBgColor, 
      computedStyle.titleBgOpacity, 
      computedStyle.titleBgGradient,
      computedStyle.titleBgRadius,
      computedStyle.titleBgWidth,
      computedStyle.titleBgPaddingX,
      computedStyle.titleBgPaddingY
  );

  const bodyBgStyle = getElementBg(
      computedStyle.bodyBgEnabled, 
      computedStyle.bodyBgColor, 
      computedStyle.bodyBgOpacity, 
      computedStyle.bodyBgGradient,
      computedStyle.bodyBgRadius,
      computedStyle.bodyBgWidth,
      computedStyle.bodyBgPaddingX,
      computedStyle.bodyBgPaddingY
  );


  // New: Text Transforms (Using Margins for flow-based positioning to stretch background)
  // We switch from 'translate' to 'margin' so that the parent container (with the background)
  // expands/contracts based on the element position.
  const titleTransformStyle: React.CSSProperties = {
    transform: `scale(${computedStyle.titleScale / 100})`,
    marginLeft: `${computedStyle.titleOffsetX}px`,
    marginTop: `${computedStyle.titleOffsetY}px`,
    // Ensure it behaves as a block in flow for margins to push content
    display: 'block', 
    ...titleBgStyle
  };

  // Calculate body margin compensation
  // Since Title pushes Body down in the flow, we need to subtract title's offset from body's offset
  // to achieve "independent" movement feeling.
  const effectiveBodyMarginTop = computedStyle.showTitle 
    ? computedStyle.bodyOffsetY - computedStyle.titleOffsetY 
    : computedStyle.bodyOffsetY;

  const bodyTransformStyle: React.CSSProperties = {
    transform: `scale(${computedStyle.bodyScale / 100})`,
    marginLeft: `${computedStyle.bodyOffsetX}px`,
    marginTop: `${effectiveBodyMarginTop}px`,
    display: 'block',
    ...bodyBgStyle
  };

  return (
    <div 
      ref={cardRef}
      id={`slide-card-${slide.id}`}
      className={`relative group w-full ${ratioClass} overflow-hidden rounded-xl shadow-2xl transition-all duration-300 bg-surface border ${isSelected ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background' : 'border-white/5 hover:shadow-primary/20'}`}
    >
      
      {/* Image Layer / Empty State */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        {slide.isLoadingImage ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-800 animate-pulse">
            <LoaderIcon className="w-8 h-8 text-zinc-500 animate-spin mb-2" />
            <span className="text-xs text-zinc-500">Gerando visual...</span>
          </div>
        ) : slide.imageUrl ? (
          computedStyle.imageRepeat ? (
            <div 
              className="w-full h-full transition-transform duration-300 ease-out"
              style={{
                ...imageStyle,
                backgroundImage: `url(${slide.imageUrl})`,
                backgroundRepeat: 'repeat-y',
                backgroundSize: '100% auto',
                backgroundPosition: 'top center'
              }}
            />
          ) : (
            <img 
              src={slide.imageUrl} 
              alt={slide.title} 
              crossOrigin="anonymous"
              className="w-full h-full object-cover transition-transform duration-300 ease-out"
              style={imageStyle}
            />
          )
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 transition-colors" />
        )}
      </div>

      {/* Overlay Content Container */}
      <div className={`absolute inset-0 ${containerPadding} flex flex-col z-10 pointer-events-none ${layoutClass}`}>
        <div 
            className="max-w-full transition-all duration-300"
            style={{ 
                width: `${computedStyle.containerWidth}%`,
                // Apply combined style if scope is 'both'
                ...(shouldApplyStyle('both') ? containerBoxStyle : {})
            }}
        >
          {computedStyle.showTitle && (
            <div style={shouldApplyStyle('title') ? containerBoxStyle : { marginBottom: computedStyle.showBody ? '0.75rem' : '0' }}>
                <h3 
                className={`leading-tight ${vibe === Vibe.BOLD ? 'font-black' : 'font-bold'}`}
                style={{ 
                    fontFamily: computedStyle.titleFont,
                    fontSize: `${titleSize}px`,
                    color: computedStyle.titleColor,
                    ...titleTransformStyle // Apply Transform & Bg
                }}
                >
                {slide.title}
                </h3>
            </div>
          )}
          
          {computedStyle.showBody && (
            <div style={shouldApplyStyle('body') ? containerBoxStyle : {}}>
                <p 
                className={`opacity-90 ${vibe === Vibe.RETRO ? 'not-italic' : ''}`}
                style={{
                    fontFamily: computedStyle.bodyFont,
                    fontSize: `${bodySize}px`,
                    lineHeight: '1.5',
                    color: computedStyle.bodyColor,
                    ...bodyTransformStyle // Apply Transform & Bg
                }}
                >
                {slide.body}
                </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Slide Number */}
      <div className="slide-number absolute bottom-4 right-4 bg-black/50 backdrop-blur text-white text-xs px-2 py-1 rounded-full z-10">
        {slide.id + 1}
      </div>

      {/* Actions (Hover) */}
      <div className={`slide-actions absolute top-2 right-2 transition-opacity z-20 flex gap-2 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        
        <button 
          onClick={() => onEditLayout(slide.id)}
          className={`p-2 rounded-full backdrop-blur-md transition-colors ${isSelected ? 'bg-primary text-white' : 'bg-black/60 hover:bg-black/80 text-white'}`}
          title="Editar Slide"
        >
          <LayoutIcon className="w-4 h-4" />
        </button>

        <button 
          onClick={() => onOpenUploadModal(slide.id)}
          className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-colors"
          title="Upload de Imagem Própria"
        >
          <UploadIcon className="w-4 h-4" />
        </button>
        <button 
          onClick={handleDownload}
          disabled={isDownloading}
          className={`p-2 rounded-full backdrop-blur-md transition-colors ${isDownloaded ? 'bg-green-500/90 text-white' : 'bg-black/60 hover:bg-black/80 text-white'}`}
          title={isDownloaded ? "Salvo!" : "Download Slide"}
        >
          {isDownloading ? (
            <LoaderIcon className="w-4 h-4 animate-spin" />
          ) : isDownloaded ? (
            <CheckIcon className="w-4 h-4" />
          ) : (
            <DownloadIcon className="w-4 h-4" />
          )}
        </button>
        <button 
          onClick={() => onRegenerateImage(slide.id, slide.imagePrompt)}
          className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-colors"
          title={slide.imageUrl ? "Regenerar Imagem IA" : "Gerar Imagem IA"}
        >
          <RefreshIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default SlideCard;