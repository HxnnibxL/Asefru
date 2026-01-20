import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Language, Quote, QuotesDatabase, Theme } from './types';
import { Sun, Moon, Keyboard, Copy, Check, History as HistoryIcon, ArrowUpRight, Share2, X, Twitter, Facebook, Linkedin, Mail, MessageCircle, Languages, Info, Menu, Search } from 'lucide-react';
import LightRays from './LightRays';
// Import direct des données (Correction Vercel)
import quotesData from './quotes.json';

const TypewriterIntro: React.FC = () => {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    // 1. Détection de la taille de l'écran
    const width = window.innerWidth;
    
    // Mobile : Moins de 768px
    const isMobile = width < 768;
    
    // Tablette : Entre 768px et 1024px (Format iPad classique et Pro Portrait)
    const isTablet = width >= 768 && width <= 1024;

    // 2. Choix du texte selon l'appareil
    let fullText = "Appuyez sur la barre Espace pour générer des citations"; // Par défaut (Desktop)

    if (isMobile) {
      fullText = "Touchez l'écran pour découvrir une citation";
    } else if (isTablet) {
      // Tu peux personnaliser cette phrase pour tablette ici :
      fullText = "Touchez l'écran pour générer une citation"; 
    }

    // 3. Animation Machine à écrire
    let i = 0;
    setDisplayText(''); // Reset
    
    const interval = setInterval(() => {
      setDisplayText(fullText.slice(0, i + 1));
      i++;
      if (i === fullText.length) {
        clearInterval(interval);
      }
    }, 40); // Vitesse de frappe

    return () => clearInterval(interval);
  }, []); // Se lance une fois au chargement

  return (
    <div className="text-[#0d0c0c] dark:text-zinc-100 font-courier tracking-tight text-[20px] md:text-[24px] text-center leading-tight typewriter-cursor max-w-4xl mx-auto px-4 font-medium transition-colors duration-500">
      {displayText}
    </div>
  );
};

const App: React.FC = () => {
  // --- ÉTATS (STATE) ---
  const [theme, setTheme] = useState<Theme>('dark');
  const [lang, setLang] = useState<Language>(Language.FR);
  
  // CORRECTION : Initialisation directe avec les données importées (plus de null, plus de fetch)
  const [db, setDb] = useState<QuotesDatabase>(quotesData as unknown as QuotesDatabase);
  
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [history, setHistory] = useState<Quote[]>([]);
  const [isAnimate, setIsAnimate] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // CORRECTION : Initialisation des indices directement
  const [remainingIndices, setRemainingIndices] = useState<{ [key in Language]: number[] }>(() => ({
    [Language.FR]: Array.from({ length: quotesData[Language.FR].length }, (_, i) => i),
    [Language.KAB]: Array.from({ length: quotesData[Language.KAB].length }, (_, i) => i)
  }));
  
  // Custom Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [quoteToShare, setQuoteToShare] = useState<Quote | null>(null);
  
  const historyRef = useRef<HTMLDivElement>(null);
  const shareModalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Background Palettes
  const palettes = useMemo(() => ({
    [Language.FR]: {
      light: ['#f8fafc', '#f1f5f9', '#eff6ff'], // Slate, Blue-ish
      dark: ['#0f172a', '#020617', '#171717']
    },
    [Language.KAB]: {
      light: ['#fff7ed', '#fefce8', '#f0fdf4'], // Warm Orange, Yellow, Green (Berber colors)
      dark: ['#1a0f02', '#0f1402', '#02140f']
    }
  }), []);

  const currentBg = useMemo(() => {
    if (showIntro) return theme === 'dark' ? '#0e0d0d' : '#fcfcfc';
    return palettes[lang][theme][paletteIndex];
  }, [lang, theme, paletteIndex, showIntro, palettes]);


  // Sync theme with HTML class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  // Handle click outside components to close them
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(event.target as Node)) {
        setIsHistoryOpen(false);
      }
      if (shareModalRef.current && !shareModalRef.current.contains(event.target as Node)) {
        setIsShareModalOpen(false);
      }
    };
    if (isHistoryOpen || isShareModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isHistoryOpen, isShareModalOpen]);

  const copyToClipboard = useCallback(async (quote: Quote, index: number | 'current') => {
    const textToCopy = `"${quote.text}" — ${quote.author}${quote.source ? `, ${quote.source}` : ''}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      if (index === 'current') {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } else {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }, []);

  const openShareModal = useCallback((quote: Quote) => {
    setQuoteToShare(quote);
    setIsShareModalOpen(true);
    setIsMobileMenuOpen(false);
  }, []);

  const getNextQuote = useCallback((targetLang: Language = lang) => {
    if (!db) return;
    const quotes = db[targetLang];
    if (!quotes || quotes.length === 0) return;
    
    // Add current quote to history before switching
    if (currentQuote) {
      setHistory(prev => {
        if (prev.length > 0 && prev[0].text === currentQuote.text) return prev;
        const newHistory = [currentQuote, ...prev];
        return newHistory.slice(0, 3);
      });
    }

    if (showIntro) setShowIntro(false);
    
    setIsCopied(false);
    setIsShared(false);
    setIsHistoryOpen(false);
    setIsShareModalOpen(false);
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
    setIsAnimate(false);
    
    setTimeout(() => {
      setRemainingIndices(prevPool => {
        let pool = [...prevPool[targetLang]];
        
        // If pool is empty or nearing end, replenish it
        if (pool.length === 0) {
          pool = Array.from({ length: quotes.length }, (_, i) => i);
        }

        // Select a random index from the remaining ones
        const randomIndexInPool = Math.floor(Math.random() * pool.length);
        const selectedIndexInDb = pool[randomIndexInPool];
        
        // Remove the selected index from the pool
        pool.splice(randomIndexInPool, 1);

        // Update display
        setCurrentQuote(quotes[selectedIndexInDb]);
        setPaletteIndex(prev => (prev + 1) % palettes[Language.FR].light.length);
        
        requestAnimationFrame(() => {
          setTimeout(() => setIsAnimate(true), 50);
        });

        return {
          ...prevPool,
          [targetLang]: pool
        };
      });
    }, 400); 
  }, [db, lang, showIntro, palettes, currentQuote]);

  const selectQuote = useCallback((quote: Quote, targetLang: Language) => {
    if (currentQuote && currentQuote.text === quote.text) {
      setIsHistoryOpen(false);
      setIsMobileMenuOpen(false);
      setIsSearchOpen(false);
      return;
    }

    if (currentQuote) {
      setHistory(prev => {
        const filtered = prev.filter(q => q.text !== quote.text);
        const newHistory = [currentQuote, ...filtered];
        return newHistory.slice(0, 3);
      });
    }

    if (showIntro) setShowIntro(false);
    setLang(targetLang);
    setIsCopied(false);
    setIsShared(false);
    setIsHistoryOpen(false);
    setIsShareModalOpen(false);
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
    setIsAnimate(false);

    // If a quote is manually selected, remove its index from the remaining pool
    // to prevent it from appearing again in the same cycle
    if (db) {
      const dbIndex = db[targetLang].findIndex(q => q.text === quote.text);
      if (dbIndex !== -1) {
        setRemainingIndices(prev => ({
          ...prev,
          [targetLang]: prev[targetLang].filter(idx => idx !== dbIndex)
        }));
      }
    }

    setTimeout(() => {
      setCurrentQuote(quote);
      setPaletteIndex(prev => (prev + 1) % palettes[Language.FR].light.length);
      requestAnimationFrame(() => {
        setTimeout(() => setIsAnimate(true), 50);
      });
    }, 400);
  }, [currentQuote, palettes, showIntro, db]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const handleLangSelect = useCallback((newLang: Language) => {
    setLang(prevLang => {
      if (newLang === prevLang) return prevLang;
      if (!showIntro) {
        getNextQuote(newLang);
      }
      return newLang;
    });
    setIsMobileMenuOpen(false);
  }, [showIntro, getNextQuote]);

  // CORRECTION : Écouteur clavier unique et nettoyé
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      
      if (document.activeElement?.tagName === 'INPUT') {
        if (key === 'escape') {
          setIsSearchOpen(false);
        }
        return;
      }

      if (event.code === 'Space') {
        event.preventDefault();
        // Petite sécurité supplémentaire
        if (typeof getNextQuote === 'function') {
           getNextQuote();
        }
      } else if (event.key === '1') {
        handleLangSelect(Language.FR);
      } else if (event.key === '2') {
        handleLangSelect(Language.KAB);
      } else if (key === 't') {
        toggleTheme();
      } else if (key === 'h') {
        setIsHistoryOpen(prev => !prev);
      } else if (key === 's') {
        setIsSearchOpen(true);
      } else if (key === 'escape') {
        setIsShareModalOpen(false);
        setIsHistoryOpen(false);
        setIsMobileMenuOpen(false);
        setIsSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [getNextQuote, handleLangSelect, toggleTheme]);

  
  const filteredQuotes = useMemo(() => {
    if (!db || searchQuery.length < 2) return [];
    const query = searchQuery.toLowerCase();
    const results: { quote: Quote; lang: Language }[] = [];

    [Language.FR, Language.KAB].forEach(l => {
      db[l].forEach(q => {
        if (
          q.text.toLowerCase().includes(query) ||
          q.author.toLowerCase().includes(query) ||
          (q.source && q.source.toLowerCase().includes(query)) ||
          (q.def && q.def.toLowerCase().includes(query))
        ) {
          results.push({ quote: q, lang: l });
        }
      });
    });

    return results;
  }, [db, searchQuery]);

  const handleSocialShare = (platform: string) => {
    if (!quoteToShare) return;
    const shareText = `"${quoteToShare.text}" — ${quoteToShare.author}${quoteToShare.source ? `, ${quoteToShare.source}` : ''}`;
    const url = window.location.href;
    
    let shareUrl = '';
    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent("Une citation pour vous")}&body=${encodeURIComponent(shareText + '\n\nSource : ' + url)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
    setIsShareModalOpen(false);
  };

  return (
    <div 
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden transition-colors duration-1000"
      style={{ backgroundColor: currentBg }}
    >
      {/* Light Rays Background Effect */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <LightRays
          raysOrigin="top-center"
          raysColor={theme === 'dark' ? '#f2f2f2' : '#4a90e2'}
          raysSpeed={1.2}
          lightSpread={0.3}
          rayLength={1.5}
          fadeDistance={1.1}
          followMouse={true}
          mouseInfluence={0.3}
          noiseAmount={0.05}
          distortion={0.03}
          className="custom-rays"
        />
      </div>

      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-black/10 dark:from-white/5" />
      
      {/* Mobile Burger Menu Button */}
      <div className="md:hidden fixed top-8 right-8 z-[70]">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5 backdrop-blur-xl border border-black/10 dark:border-white/10 text-[#0d0c0c] dark:text-white transition-all active:scale-90"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Desktop Controls Overlay (Top) */}
      <div className="hidden md:flex fixed top-10 left-1/2 -translate-x-1/2 items-center gap-6 px-6 py-3 rounded-full bg-black/5 dark:bg-white/5 backdrop-blur-2xl border border-[#0d0c0c]/10 dark:border-white/10 z-[60] shadow-xl transition-all duration-500">
        <div className="flex items-center gap-5">
          <button onClick={() => handleLangSelect(Language.FR)} className={`flex items-center gap-1.5 transition-all focus:outline-none ${lang === Language.FR ? 'text-[#0d0c0c] dark:text-white font-bold' : 'text-[#0d0c0c] dark:text-white opacity-30 hover:opacity-100'}`} title="Français (1)">
            <span className="text-[12px] tracking-widest font-montserrat uppercase">FR</span>
          </button>
          <button onClick={() => handleLangSelect(Language.KAB)} className={`flex items-center gap-1.5 transition-all focus:outline-none ${lang === Language.KAB ? 'text-[#0d0c0c] dark:text-white font-bold' : 'text-[#0d0c0c] dark:text-white opacity-30 hover:opacity-100'}`} title="Kabyle (2)">
            <span className="text-[12px] tracking-widest font-montserrat uppercase">KAB</span>
          </button>
        </div>
        <div className="w-[1px] h-4 bg-[#0d0c0c]/20 dark:bg-white/20" />
        <button onClick={toggleTheme} className="hover:scale-110 active:scale-95 transition-all text-[#0d0c0c] dark:text-white focus:outline-none" title="Thème (T)">
          {theme === 'dark' ? <Sun size={18} strokeWidth={2.5} /> : <Moon size={18} strokeWidth={2.5} />}
        </button>
        <div className="w-[1px] h-4 bg-[#0d0c0c]/20 dark:bg-white/20" />
        
        <button onClick={() => setIsSearchOpen(true)} className="flex items-center gap-2 text-[10px] text-[#0d0c0c] dark:text-zinc-400 opacity-60 hover:opacity-100 font-bold tracking-[0.2em] focus:outline-none transition-opacity" title="Rechercher (S)">
          <Search size={14} />
          <span>RECHERCHER</span>
        </button>

        <div className="w-[1px] h-4 bg-[#0d0c0c]/20 dark:bg-white/20" />
        
        <div className="relative" ref={historyRef}>
          <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className={`flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] focus:outline-none transition-all ${isHistoryOpen ? 'text-[#0d0c0c] dark:text-white opacity-100' : 'text-[#0d0c0c] dark:text-zinc-400 opacity-60 hover:opacity-100'}`}>
            <HistoryIcon size={14} />
            <span>HISTORIQUE</span>
          </button>
          {isHistoryOpen && (
            <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-4 transition-all duration-300 transform visible opacity-100 translate-y-0 scale-100 z-[70]`}>
              <div className="bg-[#fcfcfc] dark:bg-[#1a1a1a] border border-[#0d0c0c]/10 dark:border-white/10 rounded-2xl p-5 shadow-2xl min-w-[300px] max-w-[350px] backdrop-blur-3xl">
                <div className="flex flex-col gap-4">
                  <span className="text-[10px] font-bold text-[#0d0c0c]/40 dark:text-zinc-500 tracking-[0.2em] uppercase mb-1">Dernières citations</span>
                  {history.length === 0 ? (
                    <span className="text-[11px] text-[#0d0c0c]/60 dark:text-zinc-400 italic">Aucun historique pour le moment.</span>
                  ) : (
                    history.map((h, idx) => (
                      <div key={idx} className="group/item flex flex-col gap-2 border-b border-[#0d0c0c]/5 dark:border-white/5 pb-3 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex flex-col gap-1 flex-1">
                             <p onClick={() => selectQuote(h, lang)} className="text-[12px] text-[#0d0c0c] dark:text-zinc-200 line-clamp-2 leading-relaxed cursor-pointer hover:text-blue-500 dark:hover:text-blue-400 transition-colors">"{h.text}"</p>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-[#0d0c0c]/50 dark:text-zinc-500 font-bold uppercase tracking-wider">— {h.author}{h.source ? `, ${h.source}` : ''}</span>
                              {h.def && <span title="Traduction disponible" className="flex items-center"><Info size={10} className="text-[#0d0c0c]/30 dark:text-white/30" /></span>}
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0 items-center">
                            <button onClick={() => openShareModal(h)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#0d0c0c]/40 dark:text-zinc-500 hover:text-[#0d0c0c] dark:hover:text-white transition-all focus:outline-none" title="Partager">
                              <Share2 size={14} />
                            </button>
                            <button onClick={() => copyToClipboard(h, idx)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#0d0c0c]/40 dark:text-zinc-500 hover:text-[#0d0c0c] dark:hover:text-white transition-all focus:outline-none" title="Copier">
                              {copiedIndex === idx ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                            </button>
                            <button onClick={() => selectQuote(h, lang)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#0d0c0c]/40 dark:text-zinc-500 hover:text-[#0d0c0c] dark:hover:text-white transition-all focus:outline-none" title="Afficher à nouveau">
                              <ArrowUpRight size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="w-3 h-3 bg-[#fcfcfc] dark:bg-[#1a1a1a] border-l border-t border-[#0d0c0c]/10 dark:border-white/10 rotate-45 mx-auto -mt-1.5 transform translate-y-[-1px]" />
            </div>
          )}
        </div>
        <div className="w-[1px] h-4 bg-[#0d0c0c]/20 dark:bg-white/20" />
        <div className="relative group">
          <button className="flex items-center gap-2 text-[10px] text-[#0d0c0c] dark:text-zinc-400 opacity-60 hover:opacity-100 font-bold tracking-[0.2em] focus:outline-none transition-opacity">
            <Keyboard size={14} />
            <span>RACCOURCIS</span>
          </button>
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-95 group-hover:scale-100 pointer-events-none">
            <div className="bg-[#fcfcfc] dark:bg-[#1a1a1a] border border-[#0d0c0c]/10 dark:border-white/10 rounded-2xl p-5 shadow-2xl min-w-[260px] backdrop-blur-3xl">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center gap-8">
                  <span className="text-[11px] text-[#0d0c0c]/60 dark:text-zinc-400 font-medium text-left">Citation suivante</span>
                  <span className="px-2 py-0.5 rounded bg-[#0d0c0c]/5 dark:bg-white/5 text-[9px] font-bold text-[#0d0c0c] dark:text-white border border-[#0d0c0c]/10 dark:border-white/10">ESPACE</span>
                </div>
                <div className="flex justify-between items-center gap-8">
                  <span className="text-[11px] text-[#0d0c0c]/60 dark:text-zinc-400 font-medium text-left">Français</span>
                  <span className="px-2 py-0.5 rounded bg-[#0d0c0c]/5 dark:bg-white/5 text-[9px] font-bold text-[#0d0c0c] dark:text-white border border-[#0d0c0c]/10 dark:border-white/10">1</span>
                </div>
                <div className="flex justify-between items-center gap-8">
                  <span className="text-[11px] text-[#0d0c0c]/60 dark:text-zinc-400 font-medium text-left">Kabyle</span>
                  <span className="px-2 py-0.5 rounded bg-[#0d0c0c]/5 dark:bg-white/5 text-[9px] font-bold text-[#0d0c0c] dark:text-white border border-[#0d0c0c]/10 dark:border-white/10">2</span>
                </div>
                <div className="flex justify-between items-center gap-8">
                  <span className="text-[11px] text-[#0d0c0c]/60 dark:text-zinc-400 font-medium text-left">Changer de thème</span>
                  <span className="px-2 py-0.5 rounded bg-[#0d0c0c]/5 dark:bg-white/5 text-[9px] font-bold text-[#0d0c0c] dark:text-white border border-[#0d0c0c]/10 dark:border-white/10">T</span>
                </div>
                <div className="flex justify-between items-center gap-8">
                  <span className="text-[11px] text-[#0d0c0c]/60 dark:text-zinc-400 font-medium text-left">Rechercher</span>
                  <span className="px-2 py-0.5 rounded bg-[#0d0c0c]/5 dark:bg-white/5 text-[9px] font-bold text-[#0d0c0c] dark:text-white border border-[#0d0c0c]/10 dark:border-white/10">S</span>
                </div>
                <div className="flex justify-between items-center gap-8">
                  <span className="text-[11px] text-[#0d0c0c]/60 dark:text-zinc-400 font-medium text-left">Historique</span>
                  <span className="px-2 py-0.5 rounded bg-[#0d0c0c]/5 dark:bg-white/5 text-[9px] font-bold text-[#0d0c0c] dark:text-white border border-[#0d0c0c]/10 dark:border-white/10">H</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[65] bg-white/60 dark:bg-[#0d0c0c]/60 backdrop-blur-2xl p-12 flex flex-col justify-center gap-10 animate-in fade-in duration-500">
          <div className="flex flex-col gap-6">
            <span className="text-[10px] font-bold tracking-[0.3em] text-[#0d0c0c]/40 dark:text-white/40 uppercase">Action</span>
            <button onClick={() => { setIsSearchOpen(true); setIsMobileMenuOpen(false); }} className="flex items-center gap-4 text-2xl font-bold text-[#0d0c0c] dark:text-white">
              <Search size={24} />
              Rechercher
            </button>
          </div>

          <div className="flex flex-col gap-6">
            <span className="text-[10px] font-bold tracking-[0.3em] text-[#0d0c0c]/40 dark:text-white/40 uppercase">Langues</span>
            <div className="flex flex-col gap-6">
              <button onClick={() => handleLangSelect(Language.FR)} className={`text-3xl font-bold tracking-tight text-left transition-colors ${lang === Language.FR ? 'text-[#0d0c0c] dark:text-white' : 'text-[#0d0c0c]/20 dark:text-white/20'}`}>Français</button>
              <button onClick={() => handleLangSelect(Language.KAB)} className={`text-3xl font-bold tracking-tight text-left transition-colors ${lang === Language.KAB ? 'text-[#0d0c0c] dark:text-white' : 'text-[#0d0c0c]/20 dark:text-white/20'}`}>Tamazight (Kabyle)</button>
            </div>
          </div>
          
          <div className="flex flex-col gap-6">
            <span className="text-[10px] font-bold tracking-[0.3em] text-[#0d0c0c]/40 dark:text-white/40 uppercase">Thème</span>
            <button onClick={toggleTheme} className="flex items-center gap-4 text-2xl font-bold text-[#0d0c0c] dark:text-white">
              {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
              {theme === 'dark' ? 'Mode Clair' : 'Mode Sombre'}
            </button>
          </div>

          <div className="flex flex-col gap-6">
            <span className="text-[10px] font-bold tracking-[0.3em] text-[#0d0c0c]/40 dark:text-white/40 uppercase">Historique</span>
            <button onClick={() => { setIsHistoryOpen(true); setIsMobileMenuOpen(false); }} className="flex items-center gap-4 text-2xl font-bold text-[#0d0c0c] dark:text-white">
              <HistoryIcon size={24} />
              Voir les dernières citations
            </button>
          </div>
        </div>
      )}

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[110] bg-white/95 dark:bg-[#0d0c0c]/95 backdrop-blur-3xl flex flex-col animate-in fade-in duration-300">
          <div className="max-w-4xl w-full mx-auto px-6 py-12 flex flex-col h-full gap-10">
            <div className="flex justify-between items-center">
              <h2 className="text-[12px] font-bold tracking-[0.4em] text-[#0d0c0c]/40 dark:text-white/40 uppercase">Recherche</h2>
              <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-[#0d0c0c] dark:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#0d0c0c]/30 dark:text-white/30" size={24} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Un mot, un auteur, une source..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-[24px] py-6 pl-16 pr-8 text-2xl md:text-3xl font-semibold text-[#0d0c0c] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-[#0d0c0c]/20 dark:placeholder:text-white/10"
              />
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {searchQuery.length < 2 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4">
                  <Keyboard size={48} strokeWidth={1} />
                  <p className="text-[14px] font-medium tracking-wide">Commencez à taper pour rechercher...</p>
                </div>
              ) : filteredQuotes.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4">
                  <Info size={48} strokeWidth={1} />
                  <p className="text-[14px] font-medium tracking-wide">Aucun résultat trouvé pour "{searchQuery}"</p>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {filteredQuotes.map(({ quote, lang: resultLang }, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => selectQuote(quote, resultLang)}
                      className="group flex flex-col gap-3 p-6 rounded-[28px] border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <span className="text-[10px] font-bold tracking-[0.2em] text-blue-500 uppercase">{resultLang === Language.FR ? 'Français' : 'Kabyle'}</span>
                        <ArrowUpRight size={16} className="opacity-0 group-hover:opacity-40 transition-opacity" />
                      </div>
                      <p className="text-xl md:text-2xl font-semibold leading-relaxed text-[#0d0c0c] dark:text-zinc-100 italic">
                        "{quote.text}"
                      </p>
                      <div className="flex items-center gap-3">
                          <span className="text-[11px] font-bold text-[#0d0c0c]/60 dark:text-zinc-500 tracking-[0.2em] uppercase">
                          — {quote.author}{quote.source ? `, ${quote.source}` : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl w-full px-10 text-center">
        {showIntro ? (
          <div className="flex justify-center items-center">
            <TypewriterIntro />
          </div>
        ) : (
          currentQuote && (
            <div className="flex flex-col items-center gap-8 select-none">
              <div className="flex flex-col items-center gap-12">
                <p className={`text-[25px] md:text-[30px] leading-[1.6] font-semibold tracking-tight text-[#0d0c0c] dark:text-white w-full text-center transition-all duration-700 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] transform ${isAnimate ? 'opacity-100 translate-y-0 blur-0 scale-100' : 'opacity-0 translate-y-10 blur-md scale-[0.98]'}`}>
                  "{currentQuote.text}"
                </p>
                <div className={`w-full flex flex-col items-center transition-all duration-700 delay-150 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] transform ${isAnimate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  <span className="text-[14px] font-bold text-[#0d0c0c] dark:text-zinc-400 tracking-[0.4em] uppercase opacity-80">
                    — {currentQuote.author}{currentQuote.source ? `, ${currentQuote.source}` : ''}
                  </span>
                  
                  {/* Kabyle Translation Toggle */}
                  {currentQuote.def && (
                    <div className="group relative mt-6 flex justify-center">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-black/20 dark:border-white/20 bg-black/10 dark:bg-white/10 cursor-help hover:bg-black/15 dark:hover:bg-white/15 transition-all shadow-sm">
                        <Languages size={14} className="text-[#0d0c0c] dark:text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#0d0c0c] dark:text-white opacity-80 group-hover:opacity-100 transition-opacity">TRADUCTION</span>
                      </div>
                      
                      {/* Tooltip Translation */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 md:w-80 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500 pointer-events-none z-50">
                        <div className="bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-xl p-5 rounded-2xl shadow-2xl border border-black/10 dark:border-white/20">
                          <p className="text-[13px] md:text-[14px] italic leading-relaxed text-[#0d0c0c] dark:text-zinc-100">
                            {currentQuote.def}
                          </p>
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-[6px] border-transparent border-t-white/95 dark:border-t-[#1a1a1a]/95" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-4 mt-4">
                <button onClick={() => copyToClipboard(currentQuote, 'current')} className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-500 hover:bg-black/5 dark:hover:bg-white/5 active:scale-90 focus:outline-none text-[#0d0c0c] dark:text-white group transform ${isAnimate ? 'opacity-40 hover:opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} title="Copier la citation">
                  {isCopied ? <Check size={18} className="text-green-500 transition-all scale-110" /> : <Copy size={18} className="transition-all group-hover:scale-110" />}
                </button>
                <button onClick={() => openShareModal(currentQuote)} className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-500 hover:bg-black/5 dark:hover:bg-white/5 active:scale-90 focus:outline-none text-[#0d0c0c] dark:text-white group transform ${isAnimate ? 'opacity-40 hover:opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} title="Partager la citation">
                  <Share2 size={18} className="transition-all group-hover:scale-110" />
                </button>
              </div>
            </div>
          )
        )}
      </main>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsShareModalOpen(false)} />
          
          {/* Modal Container */}
          <div ref={shareModalRef} className="relative w-full max-w-[400px] bg-white dark:bg-[#111] rounded-[32px] p-8 shadow-2xl border border-black/5 dark:border-white/10 animate-in zoom-in-95 fade-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[14px] font-bold tracking-[0.2em] text-[#0d0c0c] dark:text-white uppercase opacity-50">Partager</h3>
              <button onClick={() => setIsShareModalOpen(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-[#0d0c0c] dark:text-white">
                <X size={18} />
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-6">
              {[
                { name: 'WhatsApp', icon: <MessageCircle size={24} />, platform: 'whatsapp' },
                { name: 'Twitter', icon: <Twitter size={24} />, platform: 'twitter' },
                { name: 'Facebook', icon: <Facebook size={24} />, platform: 'facebook' },
                { name: 'LinkedIn', icon: <Linkedin size={24} />, platform: 'linkedin' },
                { name: 'Email', icon: <Mail size={24} />, platform: 'email' },
                { name: 'Copier', icon: <Copy size={24} />, platform: 'copy' },
              ].map((item) => (
                <button
                  key={item.platform}
                  onClick={() => {
                    if (item.platform === 'copy' && quoteToShare) {
                      copyToClipboard(quoteToShare, 'current');
                      setIsShareModalOpen(false);
                    } else {
                      handleSocialShare(item.platform);
                    }
                  }}
                  className="flex flex-col items-center gap-3 group focus:outline-none"
                >
                  <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-[#0d0c0c]/5 dark:bg-white/5 text-[#0d0c0c] dark:text-white group-hover:bg-[#0d0c0c]/10 dark:group-hover:bg-white/10 transition-all transform group-hover:-translate-y-1">
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-bold tracking-wider text-[#0d0c0c] dark:text-zinc-500 group-hover:text-[#0d0c0c] dark:group-hover:text-white uppercase transition-colors">{item.name}</span>
                </button>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-black/5 dark:border-white/5">
              <p className="text-[11px] text-[#0d0c0c]/40 dark:text-zinc-500 text-center leading-relaxed">
                Transmettez l'inspiration à vos proches.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile click area for next quote */}
      <div className="md:hidden absolute inset-0 z-0" onClick={() => getNextQuote()} />
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.1);
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
        }
      `}</style>
    </div>
  );
};

export default App;