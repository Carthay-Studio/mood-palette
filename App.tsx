import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Palette } from './types';
import { generatePaletteFromPrompt, namePaletteFromColors } from './services/geminiService';
import { createAseFile } from './services/aseService';
import { encodePalette, decodePalette } from './services/shareService';

import ColorSwatch from './components/ColorSwatch';
import ActionButton from './components/ActionButton';
import SavedPalettesDrawer from './components/SavedPalettesDrawer';
import ImageUpload from './components/ImageUpload';
import CameraCapture from './components/CameraCapture';
import ColorEditModal from './components/ColorEditModal';
import { SaveIcon, DownloadIcon, ShareIcon, PaletteIcon, CoffeeIcon } from './components/icons';

declare const ColorThief: any;

const LOCAL_STORAGE_KEY = 'saved-color-palettes';
const buildNumber = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 12);

const defaultPalette: Palette = {
    name: "Synthetic Sustenance",
    colors: [
        { name: "Synthetic Green", hex: "#5E7A45" }, { name: "Processed Sludge", hex: "#4F593F" },
        { name: "Rust Belt", hex: "#784432" }, { name: "Hazy Atmosphere", hex: "#6A7B7D" },
        { name: "Bleak Concrete", hex: "#9CA8AC" }, { name: "Faded Vitality", hex: "#C8C2B5" },
        { name: "Shadowed Abyss", hex: "#36453A" }, { name: "Corroded Metal", hex: "#545C51" }
    ]
};

type AppMode = 'prompt' | 'image' | 'camera';
type ColorMode = 'HEX' | 'RGB' | 'HSL' | 'CMYK';

const App: React.FC = () => {
    const [promptModePalette, setPromptModePalette] = useState<Palette | null>(null);
    const [imageModePalette, setImageModePalette] = useState<Palette | null>(null);
    const [cameraModePalette, setCameraModePalette] = useState<Palette | null>(null);
    
    const [prompt, setPrompt] = useState('');
    const [imagePrompt, setImagePrompt] = useState('');
    const [cameraPrompt, setCameraPrompt] = useState('');

    const [imagePreview, setImagePreview] = useState<{ src: string, colors: string[] } | null>(null);
    const [cameraPreview, setCameraPreview] = useState<{ src: string, colors: string[] } | null>(null);

    const [loading, setLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('Initial Sequence');
    const [error, setError] = useState<string | null>(null);
    const [savedPalettes, setSavedPalettes] = useState<Palette[]>([]);
    const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
    const [shareMessage, setShareMessage] = useState<string>('');
    const [activeMode, setActiveMode] = useState<AppMode>('prompt');
    const [colorMode, setColorMode] = useState<ColorMode>('HEX');
    
    // Modal State
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingColorIndex, setEditingColorIndex] = useState<number | null>(null);

    const colorThief = useRef(null);
    if (!colorThief.current) {
        colorThief.current = new ColorThief();
    }

    const palette = useMemo(() => {
        if (activeMode === 'prompt') return promptModePalette;
        if (activeMode === 'image') return imageModePalette;
        if (activeMode === 'camera') return cameraModePalette;
        return null;
    }, [activeMode, promptModePalette, imageModePalette, cameraModePalette]);
    
    const setPalette = useCallback((p: Palette | null) => {
        if (activeMode === 'prompt') setPromptModePalette(p);
        if (activeMode === 'image') setImageModePalette(p);
        if (activeMode === 'camera') setCameraModePalette(p);
    }, [activeMode]);

    const updatePaletteName = (newName: string) => {
        if (!palette) return;
        const updated = { ...palette, name: newName };
        setPalette(updated);
    };

    const handleColorSave = (newName: string, newHex: string) => {
        if (!palette || editingColorIndex === null) return;
        const updatedColors = [...palette.colors];
        updatedColors[editingColorIndex] = { name: newName, hex: newHex };
        setPalette({ ...palette, colors: updatedColors });
    };

    useEffect(() => {
        try {
            const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (saved) setSavedPalettes(JSON.parse(saved));
        } catch (e) {
            console.error("Failed to load saved palettes", e);
        }

        const urlParams = new URLSearchParams(window.location.search);
        const sharedData = urlParams.get('palette');
        if (sharedData) {
            const decodedPalette = decodePalette(sharedData);
            if (decodedPalette) {
                setPromptModePalette(decodedPalette);
                setLoading(false);
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        } else {
            generateInitialPalette();
        }
    }, []);

    const generateInitialPalette = async () => {
        setLoading(true);
        setLoadingMessage('Initializing Surface');
        setError(null);
        try {
            const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
            const initialPrompt = `Generate a creative color palette inspired by a fun, optimistic, or notable event associated with today's date, ${today}. Give the palette a creative name.`;
            const newPalette = await generatePaletteFromPrompt(initialPrompt);
            setPromptModePalette(newPalette);
        } catch (err: any) {
            setError("Could not generate today's palette. Here's a default one!");
            setPromptModePalette(defaultPalette);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        const currentPrompt = activeMode === 'prompt' ? prompt : (activeMode === 'image' ? imagePrompt : cameraPrompt);
        const currentPreview = activeMode === 'image' ? imagePreview : cameraPreview;

        if (loading) return;
        if (activeMode === 'prompt' && !currentPrompt.trim()) return;
        if (activeMode !== 'prompt' && !currentPreview) return;
        
        setLoading(true);
        setLoadingMessage('Fabricating...');
        setError(null);
        setPalette(null);
        
        try {
            let newPalette: Palette;
            if (activeMode === 'prompt') {
                newPalette = await generatePaletteFromPrompt(currentPrompt);
            } else if (currentPreview) {
                newPalette = await namePaletteFromColors(currentPrompt, currentPreview.colors);
            } else {
                throw new Error("No image selected for color extraction.");
            }
            setPalette(newPalette);
        } catch (err: any) {
            setError(err.message || "Failed to generate palette.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleImageSelected = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageSrc = e.target?.result as string;
            const img = new Image();
            img.onload = () => {
                const extracted = colorThief.current.getPalette(img, 8).map((rgb: number[]) => `#${rgb.map(c => c.toString(16).padStart(2, '0')).join('')}`);
                const preview = { src: imageSrc, colors: extracted };
                if (activeMode === 'image') setImagePreview(preview);
                if (activeMode === 'camera') setCameraPreview(preview);
            };
            img.src = imageSrc;
        };
        reader.readAsDataURL(file);
    };

    const isPaletteSaved = useMemo(() => {
        if (!palette) return false;
        return savedPalettes.some(p => p.name === palette.name);
    }, [palette, savedPalettes]);
    
    const handleDownloadAse = () => {
        if (!palette) return;
        const blob = createAseFile(palette);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${palette.name.replace(/\s/g, '_')}.ase`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleShare = () => {
        if (!palette) return;
        const encoded = encodePalette(palette);
        const url = `${window.location.origin}${window.location.pathname}?palette=${encoded}`;
        navigator.clipboard.writeText(url);
        setShareMessage('Link copied!');
        setTimeout(() => setShareMessage(''), 2000);
    };

    const handleSavePalette = () => {
        if (!palette || isPaletteSaved) return;
        const newSavedPalettes = [palette, ...savedPalettes];
        setSavedPalettes(newSavedPalettes);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSavedPalettes));
    };

    const handleDeletePalette = (paletteName: string) => {
        const newSavedPalettes = savedPalettes.filter(p => p.name !== paletteName);
        setSavedPalettes(newSavedPalettes);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSavedPalettes));
    };

    const handleLoadPalette = (p: Palette) => {
        setPromptModePalette(p);
        setActiveMode('prompt');
        setIsDrawerOpen(false);
    };
    
    // Gradient Background - 2 Colors (Start & End) - Intensified (60 alpha)
    const backgroundStyle = useMemo(() => {
        if (!palette || palette.colors.length < 2) {
            return { background: '#0C0C0C' };
        }
        const c1 = palette.colors[0].hex;
        const c2 = palette.colors[palette.colors.length - 1].hex;
        
        // Increased alpha to 60 for more intensity
        return { 
            background: `linear-gradient(135deg, ${c1}60 0%, ${c2}60 100%)`,
            backgroundColor: '#0C0C0C'
        };
    }, [palette]);

    // Initial Boot Screen ("Product Label")
    if (loading && !palette) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-bg p-4 animate-fade-in">
                <div className="border-2 border-surface-alt p-12 md:p-24 flex flex-col items-center justify-center space-y-8 max-w-lg w-full relative bg-surface overflow-hidden">
                     <span className="font-brand text-2xl text-text-muted">Carthay Studio</span>
                     <h1 className="font-product italic text-5xl md:text-6xl text-text-primary tracking-tight text-center">Mood Palette</h1>
                     <div className="w-24 h-[2px] bg-surface-alt"></div>
                     <span className="font-mono text-xs uppercase tracking-[0.2em] text-text-primary animate-pulse-slow text-center">
                        Loading Palette Engine
                     </span>
                </div>
            </div>
        );
    }

    return (
        <div style={backgroundStyle} className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-16 pb-12 font-ui transition-all duration-1000 ease-carthay relative overflow-x-hidden">
            
            {/* Main Architectural Container */}
            <div 
                className="w-full max-w-6xl bg-surface/90 backdrop-blur-sm border-2 border-border p-6 md:p-12 relative animate-fade-up mb-8 flex-1"
            >
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-10 border-b-2 border-border pb-8 gap-6 md:gap-0">
                    <div className="space-y-1 w-full min-w-0">
                        {/* Carthay Studio Branding */}
                        <span className="font-brand text-3xl text-white tracking-normal block">
                            Carthay Studio
                        </span>
                        {/* Static App Name */}
                        <h1 className="text-4xl md:text-7xl font-product italic font-light text-text-primary tracking-tight leading-none">
                            Mood Palette
                        </h1>
                    </div>
                    <div className="text-left md:text-right w-full md:w-auto min-w-[200px]">
                        <p className="text-lg text-text-muted font-light whitespace-nowrap">
                            Powered by <span className="text-text-primary">Gemini</span>.
                        </p>
                    </div>
                </div>
                
                {/* Mode Selectors */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {(['prompt', 'image', 'camera'] as AppMode[]).map(mode => (
                        <button 
                            key={mode} 
                            onClick={() => setActiveMode(mode)} 
                            className={`
                                py-3 font-mono uppercase text-[10px] tracking-widest transition-all duration-300 border-2
                                ${activeMode === mode 
                                    ? 'bg-surface border-text-primary text-text-primary shadow-[0_0_15px_-5px_rgba(255,255,255,0.1)]' 
                                    : 'bg-bg border-border text-text-muted hover:border-text-muted hover:text-text-secondary'}
                            `}
                        >
                           {mode}
                        </button>
                    ))}
                </div>

                {/* Input Area */}
                <div className="mb-8">
                    {activeMode === 'prompt' && (
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe a mood, a scene, or a concept..."
                            className="w-full h-32 bg-bg border-2 border-border p-6 text-xl md:text-2xl text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-accent font-light resize-none transition-colors duration-300"
                        />
                    )}
                    
                    {activeMode === 'image' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ImageUpload onImageSelected={handleImageSelected} preview={imagePreview?.src} />
                            <textarea value={imagePrompt} onChange={e => setImagePrompt(e.target.value)} placeholder="Add context..." className="w-full h-full bg-bg border-2 border-border p-6 text-xl text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-accent font-light resize-none transition-colors duration-300"/>
                        </div>
                    )}

                    {activeMode === 'camera' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <CameraCapture onImageSelected={handleImageSelected} preview={cameraPreview?.src} />
                            <textarea value={cameraPrompt} onChange={e => setCameraPrompt(e.target.value)} placeholder="Add context..." className="w-full h-full bg-bg border-2 border-border p-6 text-xl text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-accent font-light resize-none transition-colors duration-300"/>
                        </div>
                    )}
                </div>
                
                {/* Generate Action */}
                <div className="flex flex-col items-center mb-12">
                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className={`
                            w-full py-6 text-xs font-mono uppercase tracking-[0.2em] text-text-primary 
                            bg-bg border-2 border-border 
                            hover:bg-surface hover:border-accent hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.2)]
                            transition-all duration-500 focus:outline-none 
                            disabled:opacity-50 disabled:cursor-not-allowed 
                            relative overflow-hidden group
                            ${loading ? 'animate-glow shadow-[0_0_50px_-10px_rgba(255,255,255,0.5)] border-accent' : ''}
                        `}
                    >
                        <span className="relative z-10">{loading ? loadingMessage : 'Generate Palette'}</span>
                        {loading && (
                            <div className="absolute inset-0 bg-white/5 animate-pulse-slow"></div>
                        )}
                    </button>

                    {error && <p className="mt-6 font-mono text-xs text-status-error uppercase tracking-widest">{error}</p>}
                    
                    {(imagePreview && activeMode === 'image' || cameraPreview && activeMode === 'camera') && !palette && (
                        <div className="mt-8 w-full border-t-2 border-border pt-8">
                            <p className="text-center font-mono text-[10px] text-text-muted uppercase tracking-widest mb-4">Raw Data Extraction</p>
                            <div className="flex justify-center gap-4">
                            {((activeMode === 'image' ? imagePreview : cameraPreview)?.colors || []).map((color, index) => (
                                <div key={index} style={{ backgroundColor: color }} className="h-4 w-4 border border-white/10"></div>
                            ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Palette Output */}
                {palette && !loading && (
                    <div className="animate-fade-up">
                        
                        {/* Metadata Section: Name & Color Mode */}
                        <div className="mb-8 flex flex-col items-start gap-6">
                            {/* Editable Palette Name */}
                             <div className="w-full">
                                <label className="font-mono text-[10px] uppercase tracking-widest text-text-muted block mb-2">Palette Identity</label>
                                <input 
                                    type="text"
                                    value={palette.name}
                                    onChange={(e) => updatePaletteName(e.target.value)}
                                    className="w-full text-3xl md:text-5xl font-product font-light text-text-primary bg-transparent border-b-2 border-border focus:border-accent focus:outline-none transition-colors pb-2"
                                />
                            </div>

                            {/* Color Mode Toggles */}
                            <div className="w-full">
                                <label className="font-mono text-[10px] uppercase tracking-widest text-text-muted block mb-2">Output Format</label>
                                <div className="flex flex-wrap gap-2">
                                    {(['HEX', 'RGB', 'HSL', 'CMYK'] as ColorMode[]).map(mode => (
                                        <button
                                            key={mode}
                                            onClick={() => setColorMode(mode)}
                                            className={`px-4 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors border-2 ${colorMode === mode ? 'border-text-primary text-text-primary bg-surface' : 'border-border text-text-muted hover:border-text-muted bg-bg'}`}
                                        >
                                            {mode}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Swatch Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-2 border-border mb-12">
                            {palette.colors.map((color, index) => (
                                <ColorSwatch 
                                    key={`${color.hex}-${index}`} 
                                    name={color.name} 
                                    hex={color.hex} 
                                    colorMode={colorMode}
                                    onClick={() => {
                                        setEditingColorIndex(index);
                                        setEditModalOpen(true);
                                    }}
                                />
                            ))}
                        </div>
                        
                        {/* Actions */}
                        <div className="flex flex-wrap justify-center gap-4">
                            {shareMessage && <span className="font-mono text-[10px] text-status-success uppercase tracking-widest self-center animate-fade-up w-full text-center mb-2">{shareMessage}</span>}
                            <ActionButton icon={<ShareIcon />} text="Share" onClick={handleShare} />
                            <ActionButton icon={<DownloadIcon />} text="ASE" onClick={handleDownloadAse} />
                            <ActionButton icon={<SaveIcon />} text={isPaletteSaved ? "Saved" : "Save"} onClick={handleSavePalette} disabled={isPaletteSaved} />
                            <ActionButton icon={<PaletteIcon />} text="PALETTES" onClick={() => setIsDrawerOpen(true)} />
                            <ActionButton icon={<CoffeeIcon />} text="Tip Jar" onClick={() => {}} href="https://ko-fi.com/carthaystudio" />
                        </div>
                    </div>
                )}
            </div>
            
            {/* App Footer */}
            <div className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center gap-4 font-mono text-[10px] text-text-muted uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity duration-300 animate-fade-in">
                <div className="flex gap-4">
                    <span>Carthay Studio</span>
                    <span>Build {buildNumber}</span>
                </div>
                <div className="flex gap-4">
                     <a href="https://carthaystudio.com" target="_blank" rel="noreferrer" className="hover:text-text-primary transition-colors">Website</a>
                    <a href="https://github.com/Carthay-Studio/Mood-Palette" target="_blank" rel="noreferrer" className="hover:text-text-primary transition-colors">GitHub</a>
                    <a href="https://opensource.org/licenses/MIT" target="_blank" rel="noreferrer" className="hover:text-text-primary transition-colors">MIT License</a>
                </div>
            </div>

            <SavedPalettesDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                palettes={savedPalettes}
                onLoad={handleLoadPalette}
                onDelete={handleDeletePalette}
                buildNumber={buildNumber}
            />

            {/* Color Edit Modal */}
            {palette && editingColorIndex !== null && (
                <ColorEditModal 
                    isOpen={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    name={palette.colors[editingColorIndex].name}
                    hex={palette.colors[editingColorIndex].hex}
                    colorMode={colorMode}
                    onSave={handleColorSave}
                />
            )}
        </div>
    );
};

export default App;
