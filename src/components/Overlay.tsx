import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import {
  BOW_TECHNIQUES,
  CARE_TIPS,
  CHAPTERS,
  FINGER_POSITIONS,
  HISTORY_TIMELINE,
  IMG,
  PARTS,
  POSTURE_POINTS,
  REPERTOIRE,
  STRINGS,
  type ChapterId,
} from "../data/handbook";
import { playChord } from "../lib/audio";
import { cn } from "../utils/cn";
import { Photo } from "./Photo";
import { Quiz } from "./Quiz";

function GoldRule({ className }: { className?: string }) {
  return <div className={cn("gold-line h-px w-full", className)} />;
}

/** 喇叭圖示；靜音時畫上斜線，讓開關狀態一眼可見。 */
function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden className="shrink-0">
      <path d="M8.4 2.2 4.9 5.1H2.7v5.8h2.2l3.5 2.9V2.2Z" fill="currentColor" />
      {muted ? (
        <path
          d="M10.9 6.4 14 9.6M14 6.4l-3.1 3.2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      ) : (
        <>
          <path
            d="M11 6.1a3 3 0 0 1 0 3.8"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M12.9 4.3a5.4 5.4 0 0 1 0 7.4"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
          />
        </>
      )}
    </svg>
  );
}

/** 方向鍵微調的位移；按住 Shift 走大步。 */
const DRAG_KEY_STEP = 24;
const DRAG_KEY_STEP_LARGE = 96;
/** 指標位移未達這個距離就當成「點一下」，而不是拖曳。 */
const DRAG_SLOP = 4;
/** 把手至少要有這麼多留在畫面內，才算還抓得到。 */
const HANDLE_MIN_VISIBLE_WIDTH = 24;
const HANDLE_MIN_VISIBLE_HEIGHT = 12;

type PanelOffset = { x: number; y: number };

/**
 * 元素是否還有足夠面積留在畫面內。被 display:none 收起來時量不到尺寸，一律當成
 * 沒問題，收合中的面板才不會一直被判定成「抓不到」。
 */
function isReachable(element: HTMLElement, minWidth: number, minHeight: number) {
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return true;
  const width = Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0);
  const height = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
  return width >= Math.min(minWidth, rect.width) && height >= Math.min(minHeight, rect.height);
}

/**
 * 讓說明面板可以搬家：拖曳、方向鍵微調、Home 或點一下歸位，也能整個收成圖示。
 *
 * 位移只以 transform 呈現，不動到版面，因此每一章的面板排版都維持原樣；而且直接
 * 寫入 DOM 樣式而非透過 state，拖曳過程不會連帶重新渲染整個 Overlay。位移不設限，
 * 面板可以一路拖出畫面；只有連把手都拖到抓不到時，面板才會自動收成左上角的圖示，
 * 如此就不會出現「叫不回來」的面板。
 */
function usePanelDrag(
  panelRef: RefObject<HTMLDivElement | null>,
  handleRef: RefObject<HTMLButtonElement | null>,
  layoutKey: string,
) {
  const offset = useRef<PanelOffset>({ x: 0, y: 0 });
  const drag = useRef<{
    id: number;
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
  } | null>(null);
  const moved = useRef(false);
  const restoreRef = useRef<HTMLButtonElement>(null);
  const [dragging, setDragging] = useState(false);
  // 手機的畫面小，面板一攤開就會蓋住 3D 小提琴，因此預設收成左上角的圖示。
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 640,
  );

  const apply = useCallback(
    (next: PanelOffset) => {
      offset.current = next;
      const el = panelRef.current;
      if (el) el.style.transform = `translate3d(${next.x}px, ${next.y}px, 0)`;
    },
    [panelRef],
  );

  const reset = useCallback(() => apply({ x: 0, y: 0 }), [apply]);

  /** 把手還抓得到嗎？抓不到就不該讓面板留在畫面外。 */
  const handleLost = useCallback(() => {
    const handle = handleRef.current;
    return (
      !!handle && !isReachable(handle, HANDLE_MIN_VISIBLE_WIDTH, HANDLE_MIN_VISIBLE_HEIGHT)
    );
  }, [handleRef]);

  /** 拖曳或微調結束後才檢查；拖到一半就收起來會讓指標捕獲中途失效。 */
  const settle = useCallback(() => {
    if (handleLost()) setCollapsed(true);
  }, [handleLost]);

  const nudge = useCallback(
    (dx: number, dy: number) => {
      apply({ x: offset.current.x + dx, y: offset.current.y + dy });
      settle();
    },
    [apply, settle],
  );

  // 視窗縮小或換章節後版面會變，面板可能因此被擠出畫面。這不是使用者主動搬動，
  // 所以先接回原位；連原位都放不下（視窗太小）才收成圖示。
  useEffect(() => {
    const keepReachable = () => {
      const handle = handleRef.current;
      if (!handle || isReachable(handle, HANDLE_MIN_VISIBLE_WIDTH, HANDLE_MIN_VISIBLE_HEIGHT)) {
        return;
      }
      apply({ x: 0, y: 0 });
      if (!isReachable(handle, HANDLE_MIN_VISIBLE_WIDTH, HANDLE_MIN_VISIBLE_HEIGHT)) {
        setCollapsed(true);
      }
    };
    keepReachable();
    window.addEventListener("resize", keepReachable);
    return () => window.removeEventListener("resize", keepReachable);
  }, [apply, handleRef, layoutKey]);

  // 從圖示還原時，面板可能早在收起來期間被視窗變化推到抓不到的地方，要順手接回原位。
  useEffect(() => {
    if (collapsed) return;
    const handle = handleRef.current;
    if (handle && !isReachable(handle, HANDLE_MIN_VISIBLE_WIDTH, HANDLE_MIN_VISIBLE_HEIGHT)) {
      apply({ x: 0, y: 0 });
    }
  }, [collapsed, apply, handleRef]);

  // 收起後把焦點交給圖示、還原後交回把手，鍵盤使用者才不會突然迷路。
  // 只在「真的切換過」時動手，否則掛載（含 StrictMode 的二次執行）就會把焦點搶到把手上，
  // 讓載入後的 ← → 變成移動面板而不是翻章節。
  const wasCollapsed = useRef(collapsed);
  useEffect(() => {
    if (wasCollapsed.current === collapsed) return;
    wasCollapsed.current = collapsed;
    const target = collapsed ? restoreRef.current : handleRef.current;
    target?.focus({ preventScroll: true });
  }, [collapsed, handleRef]);

  const endDrag = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const state = drag.current;
      if (!state || state.id !== event.pointerId) return;
      drag.current = null;
      setDragging(false);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      settle();
    },
    [settle],
  );

  return {
    dragging,
    collapsed,
    handleRef,
    restoreRef,
    collapse: () => setCollapsed(true),
    restore: () => setCollapsed(false),
    handleProps: {
      onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => {
        if (event.button !== 0 || drag.current) return;
        // 取得指標捕獲，滑出把手後拖曳才會繼續，放手也一定收得到事件。
        event.currentTarget.setPointerCapture(event.pointerId);
        moved.current = false;
        drag.current = {
          id: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          baseX: offset.current.x,
          baseY: offset.current.y,
        };
        setDragging(true);
      },
      onPointerMove: (event: React.PointerEvent<HTMLButtonElement>) => {
        const state = drag.current;
        if (!state || state.id !== event.pointerId) return;
        const dx = event.clientX - state.startX;
        const dy = event.clientY - state.startY;
        if (!moved.current && Math.hypot(dx, dy) < DRAG_SLOP) return;
        moved.current = true;
        apply({ x: state.baseX + dx, y: state.baseY + dy });
      },
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onClick: () => {
        // 拖曳過就不要歸位，否則每次放手面板都會彈回原處。
        if (moved.current) return;
        reset();
      },
      onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => {
        const step = event.shiftKey ? DRAG_KEY_STEP_LARGE : DRAG_KEY_STEP;
        if (event.key === "ArrowLeft") nudge(-step, 0);
        else if (event.key === "ArrowRight") nudge(step, 0);
        else if (event.key === "ArrowUp") nudge(0, -step);
        else if (event.key === "ArrowDown") nudge(0, step);
        else if (event.key === "Home") reset();
        else return;
        // 把手自己用掉方向鍵，不能讓它同時觸發上層的翻章快捷鍵。
        event.preventDefault();
        event.stopPropagation();
      },
    },
  };
}

/** 六點的拖曳把手圖示。 */
function GripIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden className="shrink-0">
      {[3, 6, 9].map((cy) => (
        <g key={cy}>
          <circle cx="4" cy={cy} r="1.05" fill="currentColor" />
          <circle cx="8" cy={cy} r="1.05" fill="currentColor" />
        </g>
      ))}
    </svg>
  );
}

/** 收起面板的叉叉圖示。 */
function CloseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden className="shrink-0">
      <path
        d="M3 3l6 6M9 3l-6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** 還原用的面板圖示：一張有幾行字的小卡。 */
function PanelIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0">
      <rect x="1.6" y="2.8" width="12.8" height="10.4" rx="2.2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4.8 6.4h6.4M4.8 9.4h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

/** 平移模式：四向箭頭。 */
function PanIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0">
      <path
        d="M8 1.8v12.4M1.8 8h12.4M8 1.8 6.2 3.8M8 1.8l1.8 2M8 14.2l-1.8-2M8 14.2l1.8-2M1.8 8l2-1.8M1.8 8l2 1.8M14.2 8l-2-1.8M14.2 8l-2 1.8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** 視角歸位：逆時針的圓形箭頭。 */
function ResetViewIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0">
      <path
        d="M13.2 8a5.2 5.2 0 1 1-1.7-3.85"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path d="M13.4 1.6v3.2h-3.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 目錄在 lg 以上固定顯示，以下則收合；收合時必須讓其中的按鈕離開鍵盤順序。 */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isDesktop;
}

function SiteFooter() {
  return (
    <footer className="pointer-events-none px-4 text-right sm:px-6">
      <p className="pointer-events-auto text-[10.5px] leading-5 tracking-wide text-[#e8d5a3]/75">
        © 2026{" "}
        <a
          href="https://github.com/doggy8088"
          target="_blank"
          rel="noreferrer noopener"
          className="text-[#e8d5a3] underline underline-offset-2 hover:text-[#f0e0a8]"
        >
          Will 保哥
        </a>
        <span className="mx-1.5 text-[#c9a84c]/70" aria-hidden>
          ·
        </span>
        <a
          href="https://github.com/doggy8088/3d-violin-manual/blob/main/LICENSE"
          target="_blank"
          rel="noreferrer noopener"
          className="text-[#e8d5a3] underline underline-offset-2 hover:text-[#f0e0a8]"
        >
          MIT 授權
        </a>
        <span className="mx-1.5 text-[#c9a84c]/70" aria-hidden>
          ·
        </span>
        <a
          href="https://github.com/doggy8088/3d-violin-manual"
          target="_blank"
          rel="noreferrer noopener"
          className="text-[#e8d5a3] underline underline-offset-2 hover:text-[#f0e0a8]"
        >
          原始碼
        </a>
      </p>
    </footer>
  );
}

function Paper({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        // 面板本身要接得住事件，但外框留白不能攔住指標，否則整個畫面都會拖不動 3D 模型。
        "paper-card paper-scroll pointer-events-auto max-h-[min(42vh,540px)] overflow-y-auto rounded-2xl p-5 sm:max-h-[min(64vh,620px)] sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Kicker({ children }: { children: ReactNode }) {
  return <p className="ornament mb-2 text-[10px] text-[#8a5a28]">{children}</p>;
}

function CoverPanel({ onStart }: { onStart: () => void }) {
  return (
    <div className="animate-fade-up pointer-events-auto max-w-xl space-y-6 text-[#f4ecd9]">
      <p className="ornament text-[11px] text-[#e8d5a3]">The Violin Atlas</p>
      <h1 className="font-serif text-4xl leading-[1.15] sm:text-6xl">
        小提琴
        <span className="mt-2 block font-display text-3xl italic text-[#e8d5a3] sm:text-4xl">
          3D 互動教學手冊
        </span>
      </h1>
      <GoldRule className="max-w-48" />
      <p className="max-w-md text-sm leading-7 text-[#e8d5a3]/80 sm:text-[15px]">
        把這件最會說話的樂器轉過來、拆開、聽它的四根空弦。從克雷莫納的木頭到弓毛上的松香，這是一本可以旋轉的入門書。
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onStart}
          className="rounded-full bg-[#c9a84c] px-6 py-2.5 text-sm font-medium tracking-wide text-[#1c0f0a] shadow-lg shadow-black/30 transition hover:bg-[#e8d5a3]"
        >
          開啟手冊
        </button>
        <button
          type="button"
          onClick={() => void playChord()}
          className="rounded-full border border-[#c9a84c]/40 px-5 py-2.5 text-sm tracking-wide text-[#e8d5a3] transition hover:border-[#e8d5a3]"
        >
          聆聽空弦
        </button>
      </div>
      <p className="text-[11px] tracking-wide text-[#e8d5a3]/75">
        拖曳旋轉 · 滾輪縮放 · 平移模式可移動琴身 · 點擊部位 · ← → 翻頁
      </p>
    </div>
  );
}

function HistoryPanel() {
  return (
    <Paper className="max-w-md">
      <Kicker>Origines · 01</Kicker>
      <h2 className="font-serif text-2xl">克雷莫納的黃金時代</h2>
      <p className="mt-3 text-sm leading-7 text-[#4a3224]">
        小提琴不是突然出現的。它在十六世紀的北義大利被「寫」成現在這個句子：四根弦、沙漏輪廓、F 孔、渦捲。幾乎所有後來的故事，都從倫巴底一座叫克雷莫納的小城開始。
      </p>
      <Photo src={IMG.workshop} alt="製琴工房" className="mt-4 h-36 w-full" />
      <ol className="mt-5 space-y-4">
        {HISTORY_TIMELINE.map((item) => (
          <li key={item.year} className="grid grid-cols-[72px_1fr] gap-3">
            <span className="font-display text-sm text-[#8a5a28]">{item.year}</span>
            <div>
              <p className="font-serif text-[15px]">{item.title}</p>
              <p className="mt-1 text-xs leading-6 text-[#5a4030]">{item.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <Photo src={IMG.craft} alt="製琴" className="h-24 w-full rounded-lg" />
        <Photo src={IMG.luthier} alt="製琴師" className="h-24 w-full rounded-lg" />
      </div>
    </Paper>
  );
}

function AnatomyPanel({
  selectedPart,
  onSelect,
  exploded,
  onToggleExplode,
  showHotspots,
  onToggleHotspots,
}: {
  selectedPart: string | null;
  onSelect: (id: string) => void;
  exploded: boolean;
  onToggleExplode: () => void;
  showHotspots: boolean;
  onToggleHotspots: () => void;
}) {
  const part = PARTS.find((p) => p.id === selectedPart) ?? PARTS.find((p) => p.id === "body")!;
  return (
    <Paper className="max-w-md">
      <Kicker>Anatomia · 02</Kicker>
      <h2 className="font-serif text-2xl">把琴轉過來，點它</h2>
      <p className="mt-2 text-sm leading-6 text-[#4a3224]">
        小提琴是一座微型建築。點選 3D 模型上的部位，或從下方目錄跳轉。分解視圖會把零件輕輕推開——包括通常看不見的音柱。
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onToggleExplode}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs tracking-wide",
            exploded ? "bg-[#2a1810] text-[#f4ecd9]" : "bg-[#2a1810]/10 text-[#2a1810]",
          )}
        >
          {exploded ? "復原組合" : "分解視圖"}
        </button>
        <button
          type="button"
          onClick={onToggleHotspots}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs tracking-wide",
            showHotspots ? "bg-[#2a1810] text-[#f4ecd9]" : "bg-[#2a1810]/10 text-[#2a1810]",
          )}
        >
          {showHotspots ? "隱藏標籤" : "顯示標籤"}
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {PARTS.filter((p) => p.id !== "bow").map((p) => (
          <button
            type="button"
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px]",
              selectedPart === p.id
                ? "border-[#2a1810] bg-[#2a1810] text-[#f4ecd9]"
                : "border-[#2a1810]/15 text-[#4a3224] hover:border-[#c9a84c]",
            )}
          >
            {p.name}
          </button>
        ))}
      </div>
      <GoldRule className="my-4 opacity-70" />
      <p className="text-[11px] tracking-[0.25em] text-[#8a5a28] uppercase">{part.nameEn}</p>
      <h3 className="mt-1 font-serif text-xl">{part.name}</h3>
      <p className="mt-1 text-xs text-[#8a5a28]">{part.summary}</p>
      <p className="mt-3 text-sm leading-7 text-[#4a3224]">{part.detail}</p>
    </Paper>
  );
}

function StringsPanel({
  highlightString,
  onPlay,
}: {
  highlightString: string | null;
  onPlay: (id: string) => void;
}) {
  return (
    <Paper className="max-w-md">
      <Kicker>Chordae · 03</Kicker>
      <h2 className="font-serif text-2xl">四根弦，純五度</h2>
      <p className="mt-2 text-sm leading-7 text-[#4a3224]">
        G3 · D4 · A4 · E5。相鄰兩弦都是純五度，這讓把位移動像在格子上走路。點擊卡片或 3D 上的弦，聆聽空弦。
      </p>
      <div className="mt-4 space-y-2">
        {STRINGS.map((s) => (
          <button
            type="button"
            key={s.id}
            onClick={() => onPlay(s.id)}
            className={cn(
              "flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition",
              highlightString === s.id
                ? "border-[#c9a84c] bg-[#c9a84c]/20"
                : "border-[#2a1810]/10 hover:border-[#c9a84c]/60",
            )}
          >
            <span
              className="mt-0.5 font-display text-2xl"
              style={{ color: s.id === "G" ? "#8a5a18" : "#2a1810" }}
            >
              {s.id}
            </span>
            <span className="flex-1">
              <span className="flex items-baseline justify-between">
                <span className="font-serif">{s.name}</span>
                <span className="text-[11px] tracking-widest text-[#8a5a28]">
                  {s.note} · {s.freq.toFixed(s.id === "D" || s.id === "E" ? 2 : 0)} Hz
                </span>
              </span>
              <span className="mt-1 block text-xs leading-5 text-[#5a4030]">{s.character}</span>
              <span className="mt-1 block text-xs leading-5 text-[#4a3224]">{s.role}</span>
            </span>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => void playChord()}
        className="mt-4 w-full rounded-full bg-[#2a1810] py-2.5 text-sm text-[#f4ecd9]"
      >
        四弦齊鳴
      </button>
    </Paper>
  );
}

function PosturePanel() {
  return (
    <Paper className="max-w-md">
      <Kicker>Habitus · 04</Kicker>
      <h2 className="font-serif text-2xl">先讓身體安靜</h2>
      <Photo src={IMG.playing} alt="持琴" className="mt-3 h-40 w-full" />
      <p className="mt-3 text-sm leading-7 text-[#4a3224]">
        好的姿勢不是「看起來很標準」，而是讓左手自由、右手呼吸、脖子不幫忙夾死。樂器應該像被邀請過來，而不是被挾持。
      </p>
      <ul className="mt-4 space-y-3">
        {POSTURE_POINTS.map((p) => (
          <li key={p.title}>
            <p className="font-serif">{p.title}</p>
            <p className="text-xs leading-6 text-[#5a4030]">{p.body}</p>
          </li>
        ))}
      </ul>
      <Photo src={IMG.hands} alt="手部" className="mt-4 h-32 w-full" />
    </Paper>
  );
}

function BowingPanel({
  technique,
  onTechnique,
}: {
  technique: string | null;
  onTechnique: (id: string) => void;
}) {
  const current = BOW_TECHNIQUES.find((t) => t.id === technique) ?? BOW_TECHNIQUES[0];
  return (
    <Paper className="max-w-md">
      <Kicker>Arcus · 05</Kicker>
      <h2 className="font-serif text-2xl">右手才是畫筆</h2>
      <p className="mt-2 text-sm leading-7 text-[#4a3224]">
        聲音的子音與母音幾乎都來自弓：速度、重量、接觸點（sounding point）。選擇技法，看 3D 弓如何行走。靠近琴橋會更亮、更金屬；靠近指板則像在霧裡說話。
      </p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {BOW_TECHNIQUES.map((t) => (
          <button
            type="button"
            key={t.id}
            onClick={() => onTechnique(t.id)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px]",
              technique === t.id ? "bg-[#2a1810] text-[#f4ecd9]" : "bg-[#2a1810]/10 text-[#2a1810]",
            )}
          >
            {t.zh}
          </button>
        ))}
      </div>
      <GoldRule className="my-4 opacity-70" />
      <p className="font-display text-sm italic text-[#8a5a28]">{current.name}</p>
      <h3 className="font-serif text-xl">{current.zh}</h3>
      <p className="mt-2 text-sm leading-7 text-[#4a3224]">{current.desc}</p>
      <Photo src={IMG.varnish} alt="弓與琴" className="mt-4 h-32 w-full" />
    </Paper>
  );
}

function LeftHandPanel() {
  return (
    <Paper className="max-w-md">
      <Kicker>Manus · 06</Kicker>
      <h2 className="font-serif text-2xl">指板上沒有品格</h2>
      <p className="mt-2 text-sm leading-7 text-[#4a3224]">
        音準是耳朵的責任。第一把位在 A 弦上：空弦 A、1 指 B、2 指 C#、3 指 D、4 指 E。3 指可與 D 空弦對音，4 指可與 E 空弦對音——這是最古老的校正法。
      </p>
      <Photo src={IMG.fingerboard} alt="指板" className="mt-3 h-36 w-full" />
      <ul className="mt-4 divide-y divide-[#2a1810]/10">
        {FINGER_POSITIONS.map((f) => (
          <li key={f.finger} className="flex items-baseline gap-3 py-2">
            <span className="w-10 font-display text-lg text-[#8a5a28]">{f.finger}</span>
            <span className="flex-1">
              <span className="font-serif">{f.note}</span>
              <span className="ml-2 text-xs text-[#5a4030]">{f.hint}</span>
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4 space-y-2 text-xs leading-6 text-[#5a4030]">
        <p>
          <strong className="font-serif text-[#2a1810]">換把</strong>
          ——拇指與手一起旅行，不要把脖子當滑竿硬推。
        </p>
        <p>
          <strong className="font-serif text-[#2a1810]">揉弦</strong>
          ——從手臂、手腕或手指出發，目的是讓音「活」，不是讓音「暈」。
        </p>
        <p>
          <strong className="font-serif text-[#2a1810]">雙音與泛音</strong>
          ——兩根弦同時按準，是對手型最誠實的考試；泛音則讓弦以整數比分段振動。
        </p>
      </div>
    </Paper>
  );
}

function CarePanel() {
  return (
    <Paper className="max-w-md">
      <Kicker>Cura · 07</Kicker>
      <h2 className="font-serif text-2xl">它是木頭，會呼吸</h2>
      <Photo src={IMG.darkViolin} alt="小提琴" className="mt-3 h-36 w-full" />
      <p className="mt-3 text-sm leading-7 text-[#4a3224]">
        調音時先用弦軸做大動作，再用微調器做最後的呼吸。A 先對準 440 Hz，其餘以五度向上、向下聽「是否平靜」。五度如果會滾、會吵，就是還沒純。
      </p>
      <div className="mt-4 grid gap-3">
        {CARE_TIPS.map((t) => (
          <div key={t.title} className="rounded-xl bg-[#2a1810]/5 px-3 py-2.5">
            <p className="font-serif text-sm">{t.title}</p>
            <p className="mt-1 text-xs leading-6 text-[#5a4030]">{t.body}</p>
          </div>
        ))}
      </div>
    </Paper>
  );
}

function RepertoirePanel() {
  return (
    <Paper className="max-w-lg">
      <Kicker>Repertorium · 08</Kicker>
      <h2 className="font-serif text-2xl">幾首值得用一生靠近的作品</h2>
      <Photo src={IMG.violinScore} alt="樂譜與小提琴" className="mt-3 h-36 w-full" />
      <div className="mt-4 space-y-3">
        {REPERTOIRE.map((r) => (
          <article key={r.title} className="border-b border-[#2a1810]/10 pb-3">
            <p className="text-[10px] tracking-[0.25em] text-[#8a5a28] uppercase">
              {r.era} · {r.year}
            </p>
            <h3 className="font-serif text-lg leading-snug">{r.title}</h3>
            <p className="font-display text-sm italic text-[#8a5a28]">{r.composer}</p>
            <p className="mt-1 text-xs leading-6 text-[#5a4030]">{r.why}</p>
          </article>
        ))}
      </div>
    </Paper>
  );
}

function QuizPanel() {
  return (
    <Paper className="max-w-md">
      <Quiz />
    </Paper>
  );
}

export function Overlay({
  chapter,
  onChapter,
  selectedPart,
  onSelectPart,
  exploded,
  onToggleExplode,
  showHotspots,
  onToggleHotspots,
  highlightString,
  onPlayString,
  bowTechnique,
  onBowTechnique,
  autoRotate,
  onToggleRotate,
  panMode,
  onTogglePan,
  onResetView,
  muted,
  onToggleMute,
  help,
  onToggleHelp,
  menuOpen,
  onToggleMenu,
}: {
  chapter: ChapterId;
  onChapter: (id: ChapterId) => void;
  selectedPart: string | null;
  onSelectPart: (id: string) => void;
  exploded: boolean;
  onToggleExplode: () => void;
  showHotspots: boolean;
  onToggleHotspots: () => void;
  highlightString: string | null;
  onPlayString: (id: string) => void;
  bowTechnique: string | null;
  onBowTechnique: (id: string) => void;
  autoRotate: boolean;
  onToggleRotate: () => void;
  panMode: boolean;
  onTogglePan: () => void;
  onResetView: () => void;
  muted: boolean;
  onToggleMute: () => void;
  help: boolean;
  onToggleHelp: () => void;
  menuOpen: boolean;
  onToggleMenu: () => void;
}) {
  const current = CHAPTERS.find((c) => c.id === chapter)!;
  const idx = CHAPTERS.findIndex((c) => c.id === chapter);
  const isDesktop = useIsDesktop();
  const asideHidden = !menuOpen && !isDesktop;
  const panelRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLButtonElement>(null);
  const drag = usePanelDrag(panelRef, handleRef, chapter);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col">
      <a href="#manual-content" className="skip-link pointer-events-auto">
        跳至主要內容
      </a>

      <header className="pointer-events-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3 sm:px-6">
        {chapter !== "cover" && <h1 className="visually-hidden">小提琴 3D 互動教學手冊</h1>}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onChapter("cover")}
            aria-label="回到序章：小提琴 3D 互動教學手冊"
            className="flex items-center gap-2 text-[#e8d5a3]"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 3c.4 2.2-.2 3.6-1.4 4.8C8.8 9.6 8 11.2 8 13.2c0 2.4 1.8 4.8 4 4.8s4-2.4 4-4.8"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <circle cx="12" cy="18.5" r="1.2" fill="#c9a84c" />
            </svg>
            <span className="hidden font-serif text-sm sm:inline">小提琴手冊</span>
          </button>
          <span className="hidden text-[11px] tracking-[0.28em] text-[#e8d5a3]/75 sm:inline">
            {current.latin}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleRotate}
            aria-label={autoRotate ? "停止自動旋轉" : "開啟自動旋轉"}
            className="glass-dark rounded-full px-3 py-1.5 text-[11px] tracking-wide text-[#e8d5a3]"
          >
            {autoRotate ? "停止旋轉" : "自動旋轉"}
          </button>
          <button
            type="button"
            onClick={onTogglePan}
            aria-pressed={panMode}
            aria-label={panMode ? "結束平移模式，改回拖曳旋轉" : "開啟平移模式，拖曳可移動小提琴"}
            title="平移模式：拖曳變成移動琴身，方便看到被擋住或看不清楚的地方；雙指仍可縮放"
            className={cn(
              "glass-dark flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] tracking-wide transition",
              panMode ? "text-[#f0e0a8] ring-1 ring-[#c9a84c]/70" : "text-[#e8d5a3]",
            )}
          >
            <PanIcon />
            <span className="hidden sm:inline">{panMode ? "平移中" : "平移"}</span>
          </button>
          <button
            type="button"
            onClick={onResetView}
            aria-label="把 3D 視角帶回本章預設位置"
            title="視角歸位：回到本章的預設角度與距離"
            className="glass-dark flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] tracking-wide text-[#e8d5a3] transition hover:text-[#f0e0a8]"
          >
            <ResetViewIcon />
            <span className="hidden sm:inline">歸位</span>
          </button>
          <button
            type="button"
            onClick={onToggleMute}
            aria-pressed={!muted}
            title="切換空弦試聽的聲音"
            className={cn(
              "glass-dark flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] transition",
              muted ? "text-[#e8d5a3]/70" : "text-[#e8d5a3]",
            )}
          >
            <SpeakerIcon muted={muted} />
            {muted ? "已靜音" : "有聲"}
          </button>
          <button
            type="button"
            onClick={onToggleHelp}
            aria-expanded={help}
            aria-controls="manual-help"
            className="glass-dark rounded-full px-3 py-1.5 text-[11px] text-[#e8d5a3]"
          >
            指引
          </button>
          <button
            type="button"
            onClick={onToggleMenu}
            aria-expanded={menuOpen}
            aria-controls="manual-toc"
            className="glass-dark rounded-full px-3 py-1.5 text-[11px] text-[#e8d5a3] lg:hidden"
          >
            目錄
          </button>
        </div>
      </header>

      <SiteFooter />

      <div className="relative flex min-h-0 flex-1">
        {menuOpen && (
          <button
            type="button"
            aria-label="關閉目錄"
            className="pointer-events-auto absolute inset-0 z-10 bg-black/40 lg:hidden"
            onClick={onToggleMenu}
          />
        )}
        <aside
          id="manual-toc"
          aria-label="章節目錄"
          aria-hidden={asideHidden || undefined}
          inert={asideHidden || undefined}
          className={cn(
            "pointer-events-auto glass-dark paper-scroll absolute top-0 z-20 flex h-full w-56 flex-col gap-1 overflow-y-auto p-3 transition lg:relative lg:translate-x-0 lg:bg-transparent lg:backdrop-blur-0",
            menuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          )}
        >
          {CHAPTERS.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => {
                onChapter(c.id);
                if (menuOpen) onToggleMenu();
              }}
              aria-current={c.id === chapter ? "page" : undefined}
              aria-label={`${c.num} ${c.title}：${c.subtitle}`}
              className={cn(
                "rounded-xl px-3 py-2 text-left transition",
                c.id === chapter
                  ? "bg-[#c9a84c]/15 text-[#f0e0a8]"
                  : "text-[#e8d5a3]/75 hover:text-[#e8d5a3]",
              )}
            >
              <span className="block font-display text-[10px] tracking-[0.25em]">{c.num}</span>
              <span className="font-serif text-sm">{c.title}</span>
              <span className="ml-2 hidden text-[11px] text-[#e8d5a3]/65 xl:inline">{c.subtitle}</span>
            </button>
          ))}
        </aside>

        <div className="flex min-w-0 flex-1 items-stretch justify-between gap-4 px-4 pb-24 pt-2 sm:px-6">
          <main
            id="manual-content"
            tabIndex={-1}
            className="pointer-events-none min-w-0 max-w-full"
          >
            <div ref={panelRef} className={cn("relative", drag.collapsed && "hidden")}>
              <div className="mb-2 flex justify-end gap-1.5">
                <button
                  type="button"
                  ref={drag.handleRef}
                  {...drag.handleProps}
                  aria-label="移動說明面板：拖曳或按方向鍵移動，按一下歸位"
                  title="拖曳可移動面板；方向鍵微調，按住 Shift 加速，Home 或按一下歸位"
                  className={cn(
                    "glass-dark pointer-events-auto flex touch-none items-center gap-1.5 rounded-full px-3 py-1 text-[10.5px] tracking-wide text-[#e8d5a3]/80 transition select-none hover:text-[#f0e0a8]",
                    drag.dragging ? "cursor-grabbing text-[#f0e0a8]" : "cursor-grab",
                  )}
                >
                  <GripIcon />
                  拖曳移動
                </button>
                <button
                  type="button"
                  onClick={drag.collapse}
                  aria-label="收起說明面板"
                  title="收起面板，左上角會出現可以再打開的圖示"
                  className="glass-dark pointer-events-auto flex touch-none items-center rounded-full px-2.5 py-1 text-[#e8d5a3]/80 transition hover:text-[#f0e0a8]"
                >
                  <CloseIcon />
                </button>
              </div>
              {chapter === "cover" && <CoverPanel onStart={() => onChapter("history")} />}
              {chapter === "history" && <HistoryPanel />}
              {chapter === "anatomy" && (
                <AnatomyPanel
                  selectedPart={selectedPart}
                  onSelect={onSelectPart}
                  exploded={exploded}
                  onToggleExplode={onToggleExplode}
                  showHotspots={showHotspots}
                  onToggleHotspots={onToggleHotspots}
                />
              )}
              {chapter === "strings" && (
                <StringsPanel highlightString={highlightString} onPlay={onPlayString} />
              )}
              {chapter === "posture" && <PosturePanel />}
              {chapter === "bowing" && (
                <BowingPanel technique={bowTechnique} onTechnique={onBowTechnique} />
              )}
              {chapter === "leftHand" && <LeftHandPanel />}
              {chapter === "care" && <CarePanel />}
              {chapter === "repertoire" && <RepertoirePanel />}
              {chapter === "quiz" && <QuizPanel />}
            </div>
            {drag.collapsed && (
              <button
                type="button"
                ref={drag.restoreRef}
                onClick={drag.restore}
                aria-label="顯示說明面板"
                title="把說明面板放回畫面上"
                className="glass-dark pointer-events-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] text-[#e8d5a3] transition hover:text-[#f0e0a8]"
              >
                <PanelIcon />
                顯示說明
              </button>
            )}
          </main>
        </div>
      </div>

      <nav
        aria-label="章節導覽"
        className="pointer-events-auto glass-dark absolute bottom-3 left-1/2 z-20 w-[min(96vw,920px)] -translate-x-1/2 rounded-full px-3 py-2 sm:px-4"
      >
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={idx <= 0}
            onClick={() => onChapter(CHAPTERS[idx - 1].id)}
            className="px-2 py-1 text-[#e8d5a3] disabled:opacity-30"
            aria-label="上一章"
          >
            ←
          </button>
          <div className="flex min-w-0 flex-1 items-end justify-between gap-0.5 overflow-x-auto">
            {CHAPTERS.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => onChapter(c.id)}
                aria-current={c.id === chapter ? "page" : undefined}
                aria-label={`${c.num} ${c.title}：${c.subtitle}`}
                className="group flex min-w-[28px] flex-1 flex-col items-center gap-1 py-1"
              >
                <span
                  className={cn(
                    "text-[9px] tracking-widest",
                    c.id === chapter ? "text-[#e8d5a3]" : "text-[#e8d5a3]/65",
                  )}
                >
                  {c.num}
                </span>
                <span
                  className={cn(
                    "h-1 w-full max-w-10 rounded-full",
                    c.id === chapter ? "bg-[#c9a84c]" : "bg-[#c9a84c]/30",
                  )}
                />
                <span
                  className={cn(
                    "hidden font-serif text-[10px] sm:block",
                    c.id === chapter ? "text-[#f4ecd9]" : "text-[#e8d5a3]/65",
                  )}
                >
                  {c.title}
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={idx >= CHAPTERS.length - 1}
            onClick={() => onChapter(CHAPTERS[idx + 1].id)}
            className="px-2 py-1 text-[#e8d5a3] disabled:opacity-30"
            aria-label="下一章"
          >
            →
          </button>
        </div>
      </nav>

      {help && (
        <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/55 p-4">
          <div
            id="manual-help"
            role="dialog"
            aria-modal="true"
            aria-labelledby="manual-help-title"
            className="paper-card max-w-md rounded-2xl p-6"
          >
            <Kicker>How to read</Kicker>
            <h2 id="manual-help-title" className="font-serif text-2xl">
              閱讀方式
            </h2>
            <ul className="mt-4 space-y-2 text-sm leading-7 text-[#4a3224]">
              <li>拖曳畫面以旋轉小提琴，滾輪或捏合可縮放。</li>
              <li>
                看不清楚的時候，按右上角的「平移」把拖曳換成移動琴身，就能把琴移到想看清楚的位置；「歸位」則回到本章預設視角。桌機也可以直接按滑鼠右鍵拖曳，或按 <kbd>P</kbd> 切換平移、<kbd>R</kbd> 歸位。
              </li>
              <li>說明面板上方的「拖曳移動」把手可以拉著跑到任何位置，也能整個拖出畫面；方向鍵微調（Shift 加速），Home 或按一下把手歸位。把手旁的 ✕ 可收起面板，左上角會留下圖示，點一下就能放回來。</li>
              <li>在「解剖」章節點選部位，相機會靠過去。按 E 可分解。</li>
              <li>「四弦」章節可聽空弦；請先與頁面互動以開啟音訊，右上角可切換「有聲／已靜音」。</li>
              <li>「運弓」章節選擇技法，弓會示範動作。</li>
              <li>鍵盤：← → 翻頁，P 平移模式，R 視角歸位，Esc 取消選取，? 開關本說明。</li>
            </ul>
            <button
              type="button"
              autoFocus
              onClick={onToggleHelp}
              className="mt-5 rounded-full bg-[#2a1810] px-5 py-2 text-sm text-[#f4ecd9]"
            >
              知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
