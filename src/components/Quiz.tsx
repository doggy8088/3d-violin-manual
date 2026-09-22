import { useEffect, useMemo, useRef, useState } from "react";
import { QUIZ } from "../data/handbook";
import { cn } from "../utils/cn";

export function Quiz() {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const nextRef = useRef<HTMLButtonElement>(null);
  const q = QUIZ[index];
  const progress = useMemo(() => ((done ? QUIZ.length : index) / QUIZ.length) * 100, [done, index]);

  // 作答後選項即失效，因此把焦點移到「下一題」，避免鍵盤使用者停在已停用的選項上。
  useEffect(() => {
    if (picked !== null) nextRef.current?.focus();
  }, [picked]);

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.a) setScore((s) => s + 1);
  };

  const next = () => {
    if (index >= QUIZ.length - 1) {
      setDone(true);
      return;
    }
    setIndex((n) => n + 1);
    setPicked(null);
  };

  const reset = () => {
    setIndex(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  };

  if (done) {
    const ratio = score / QUIZ.length;
    const line =
      ratio === 1
        ? "完美。克雷莫納會為你留一扇門。"
        : ratio >= 0.75
          ? "音色已經很準。再把弓走得更從容一些。"
          : ratio >= 0.5
            ? "骨架有了。回去翻一翻解剖與四弦兩章。"
            : "沒關係——耳朵是練來的。再走一遍手冊吧。";
    return (
      <div className="space-y-5" role="status">
        <p className="ornament text-[10px] text-[#8a5a28]">Examen</p>
        <h3 className="font-serif text-2xl">你的分數</h3>
        <p className="font-display text-5xl text-[#7a4a14]">
          {score}
          <span className="text-2xl text-[#7a4a14]/50"> / {QUIZ.length}</span>
        </p>
        <p className="text-sm leading-relaxed text-[#4a3224]">{line}</p>
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-[#2a1810] px-5 py-2 text-sm tracking-wide text-[#f4ecd9]"
        >
          再考一次
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="ornament text-[10px] text-[#8a5a28]">Examen</p>
        <p className="text-xs tracking-widest text-[#8a5a28]" aria-hidden>
          {String(index + 1).padStart(2, "0")} / {String(QUIZ.length).padStart(2, "0")}
        </p>
      </div>
      <div className="h-[2px] w-full overflow-hidden rounded bg-[#2a1810]/10">
        <div className="h-full bg-[#c9a84c] transition-all" style={{ width: `${progress}%` }} />
      </div>
      <h3 className="font-serif text-xl leading-snug">
        <span className="visually-hidden">
          第 {index + 1} 題，共 {QUIZ.length} 題：
        </span>
        {q.q}
      </h3>
      <div className="space-y-2">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.a;
          const isPick = i === picked;
          const answered = picked !== null;
          return (
            <button
              type="button"
              key={opt}
              onClick={() => choose(i)}
              aria-disabled={answered}
              className={cn(
                "block w-full rounded-xl border px-4 py-3 text-left text-sm transition",
                !answered && "border-[#2a1810]/15 hover:border-[#c9a84c] hover:bg-[#c9a84c]/10",
                answered && isCorrect && "border-[#2f6b3a] bg-[#2f6b3a]/12 text-[#1d3d24]",
                answered && isPick && !isCorrect && "border-[#8a2a2a] bg-[#8a2a2a]/10 text-[#5a1818]",
                answered && !isPick && !isCorrect && "border-transparent opacity-50",
              )}
            >
              <span className="mr-2 font-display text-xs text-[#8a5a28]">
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-[#4a3224]" role="status">
            <strong className="font-serif">
              {picked === q.a ? "答對了。" : "答錯了。"}
            </strong>
            {q.explain}
          </p>
          <button
            ref={nextRef}
            type="button"
            onClick={next}
            className="rounded-full bg-[#2a1810] px-5 py-2 text-sm tracking-wide text-[#f4ecd9]"
          >
            {index === QUIZ.length - 1 ? "看結果" : "下一題"}
          </button>
        </div>
      )}
    </div>
  );
}
