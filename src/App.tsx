import { useCallback, useEffect, useState } from "react";
import { Overlay } from "./components/Overlay";
import { Scene } from "./components/Scene";
import { CHAPTERS, type ChapterId } from "./data/handbook";
import { playString, setMuted } from "./lib/audio";

const INTRO_MS = 2300;

/** 使用者若偏好減少動態效果，就不自動旋轉，並略過開場動畫。 */
function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Canvas 需要 WebGL。先偵測再決定要不要掛載 3D 場景，否則 WebGLRenderer 會拋出
 * 未處理的 rejection，使用者只會看到一塊空白區域，卻不知道發生什麼事。
 */
function detectWebGL() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) return false;
    // 立刻釋放偵測用的 GPU 資源，不讓它多佔一個 WebGL context。
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export default function App() {
  const [reducedMotion] = useState(prefersReducedMotion);
  const [webglAvailable] = useState(detectWebGL);
  const [chapter, setChapter] = useState<ChapterId>("cover");
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [exploded, setExploded] = useState(false);
  const [autoRotate, setAutoRotate] = useState(() => !reducedMotion);
  const [showHotspots, setShowHotspots] = useState(true);
  const [bowTechnique, setBowTechnique] = useState<string | null>(null);
  const [muted, setMutedState] = useState(false);
  const [intro, setIntro] = useState(true);
  const [playingString, setPlayingString] = useState<string | null>(null);
  const [highlightString, setHighlightString] = useState<string | null>(null);
  const [help, setHelp] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (reducedMotion) {
      setIntro(false);
      return;
    }
    const t = window.setTimeout(() => setIntro(false), INTRO_MS);
    return () => window.clearTimeout(t);
  }, [reducedMotion]);

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
    setAutoRotate(chapter === "cover" && !reducedMotion);
    if (chapter === "anatomy") setShowHotspots(true);
  }, [chapter, reducedMotion]);

  const goChapter = useCallback((id: ChapterId) => {
    setChapter(id);
  }, []);

  const current = CHAPTERS.find((c) => c.id === chapter) ?? CHAPTERS[0];

  // 開場動畫不應攔住操作：按任意鍵或點一下即可略過。
  // 只在 click 階段結束動畫；若在 pointerdown 就移除，隨後同一次手勢的 click
  // 會以新的命中測試結果為目標，變成誤觸底下的按鈕。
  useEffect(() => {
    if (!intro) return;
    const dismiss = () => setIntro(false);
    window.addEventListener("keydown", dismiss, { once: true });
    return () => window.removeEventListener("keydown", dismiss);
  }, [intro]);

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

      <div
        role="region"
        aria-label={
          webglAvailable
            ? "小提琴 3D 模型（滑鼠或觸控拖曳可旋轉、滾輪或捏合可縮放；鍵盤請改用上方與下方的章節按鈕）"
            : "小提琴 3D 模型無法顯示"
        }
        className="absolute inset-0 touch-none"
      >
        {webglAvailable ? (
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
        ) : (
          <div className="flex h-full items-center justify-center px-6 py-16">
            <p
              role="status"
              className="glass-dark max-w-md rounded-2xl px-5 py-4 text-center text-xs leading-6 text-[#e8d5a3]/85"
            >
              這個瀏覽器無法建立 WebGL 內容，因此 3D
              小提琴無法顯示。手冊的文字、章節切換與小測驗仍可正常使用；若要看到 3D
              模型，請改用支援 WebGL 的瀏覽器，或確認瀏覽器已啟用硬體加速。
            </p>
          </div>
        )}
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

      <p className="visually-hidden" role="status">
        {`目前章節：第 ${current.num} 章 ${current.title}（${current.subtitle}）`}
      </p>
      <p className="visually-hidden" role="status">
        {playingString ? `正在播放 ${playingString} 弦空弦` : ""}
      </p>

      {intro && (
        <div
          aria-hidden="true"
          onClick={() => setIntro(false)}
          className="absolute inset-0 z-40 flex items-center justify-center bg-[#0a0608]"
        >
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
