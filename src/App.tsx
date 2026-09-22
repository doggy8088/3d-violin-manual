import { useCallback, useEffect, useState } from "react";
import { Overlay } from "./components/Overlay";
import { Scene } from "./components/Scene";
import { CHAPTERS, type ChapterId } from "./data/handbook";
import { playString, setMuted } from "./lib/audio";

export default function App() {
  const [chapter, setChapter] = useState<ChapterId>("cover");
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [exploded, setExploded] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const [bowTechnique, setBowTechnique] = useState<string | null>(null);
  const [muted, setMutedState] = useState(false);
  const [intro, setIntro] = useState(true);
  const [playingString, setPlayingString] = useState<string | null>(null);
  const [highlightString, setHighlightString] = useState<string | null>(null);
  const [help, setHelp] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setIntro(false), 2300);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    setMuted(muted);
  }, [muted]);

  useEffect(() => {
    setSelectedPart(null);
    setExploded(false);
    setHighlightString(null);
    setMenuOpen(false);
    if (chapter === "bowing") setBowTechnique("detache");
    else setBowTechnique(null);
    setAutoRotate(chapter === "cover");
    if (chapter === "anatomy") setShowHotspots(true);
  }, [chapter]);

  const goChapter = useCallback((id: ChapterId) => {
    setChapter(id);
  }, []);

  const handleSelectPart = useCallback((id: string) => {
    setSelectedPart(id ? id : null);
    setAutoRotate(false);
  }, []);

  const handlePlayString = useCallback((id: string) => {
    void playString(id);
    setPlayingString(id);
    setHighlightString(id);
    window.setTimeout(() => setPlayingString(null), 1700);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      const idx = CHAPTERS.findIndex((c) => c.id === chapter);
      if (e.key === "ArrowRight" && idx < CHAPTERS.length - 1) {
        setChapter(CHAPTERS[idx + 1].id);
      } else if (e.key === "ArrowLeft" && idx > 0) {
        setChapter(CHAPTERS[idx - 1].id);
      } else if (e.key === "e" || e.key === "E") {
        if (chapter === "anatomy") setExploded((v) => !v);
      } else if (e.key === "?" || e.key === "h" || e.key === "H") {
        setHelp((v) => !v);
      } else if (e.key === "Escape") {
        setSelectedPart(null);
        setHelp(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chapter]);

  return (
    <div className="relative h-svh w-full overflow-hidden bg-[#0a0608]">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-35"
        style={{ backgroundImage: `url(/images/hero-stage.jpg)` }}
      />
      <div className="vignette absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />
      <div className="film-grain z-20" />

      <div className="absolute inset-0 touch-none">
        <Scene
          chapter={chapter}
          selectedPart={selectedPart}
          onSelectPart={handleSelectPart}
          exploded={exploded}
          showHotspots={chapter === "anatomy" && showHotspots}
          highlightString={highlightString}
          onPlayString={handlePlayString}
          showFingers={chapter === "leftHand"}
          playingString={playingString}
          bowTechnique={bowTechnique}
          autoRotate={autoRotate}
          onUserInteract={() => setAutoRotate(false)}
        />
      </div>

      <Overlay
        chapter={chapter}
        onChapter={goChapter}
        selectedPart={selectedPart}
        onSelectPart={handleSelectPart}
        exploded={exploded}
        onToggleExplode={() => setExploded((v) => !v)}
        showHotspots={showHotspots}
        onToggleHotspots={() => setShowHotspots((v) => !v)}
        highlightString={highlightString}
        onPlayString={handlePlayString}
        bowTechnique={bowTechnique}
        onBowTechnique={(id) => {
          setBowTechnique(id);
          setAutoRotate(false);
        }}
        autoRotate={autoRotate}
        onToggleRotate={() => setAutoRotate((v) => !v)}
        muted={muted}
        onToggleMute={() => setMutedState((v) => !v)}
        help={help}
        onToggleHelp={() => setHelp((v) => !v)}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((v) => !v)}
      />

      {intro && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#0a0608]">
          <div className="flex flex-col items-center gap-6">
            <svg width="88" height="88" viewBox="0 0 88 88" fill="none" aria-hidden>
              <path
                d="M44 8c1.2 8-1.4 14-6 19-6 6.4-9 12-9 20 0 11 7.4 21 15 21s15-10 15-21"
                stroke="#c9a84c"
                strokeWidth="1.4"
                strokeLinecap="round"
                style={{
                  strokeDasharray: 400,
                  strokeDashoffset: 400,
                  animation: "draw-line 1.6s ease forwards",
                }}
              />
              <path
                d="M38 68c2 6 4.5 10 6 14 1.5-4 4-8 6-14"
                stroke="#e8d5a3"
                strokeWidth="1.2"
                strokeLinecap="round"
                style={{
                  strokeDasharray: 400,
                  strokeDashoffset: 400,
                  animation: "draw-line 1.8s ease 0.2s forwards",
                }}
              />
              <circle cx="44" cy="44" r="3" fill="#c9a84c" />
            </svg>
            <p className="ornament text-[11px] text-[#e8d5a3]">The Violin Atlas</p>
            <p className="font-serif text-xl text-[#f4ecd9]">小提琴 3D 互動教學手冊</p>
          </div>
        </div>
      )}
    </div>
  );
}
