import { useState } from "react";
import { cn } from "../utils/cn";

/**
 * 站內照片。外部圖庫（Pexels）可能因離線、地區限制或熱鏈政策而載入失敗，
 * 因此載入失敗時改顯示可見的替代方塊，而不是留下破圖。
 */
export function Photo({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={`${alt}：圖片暫時無法載入`}
        className={cn(
          "flex items-center justify-center rounded-xl border border-dashed border-[#2a1810]/25 bg-[#2a1810]/5 px-2 text-center text-[11px] leading-4 text-[#8a5a28]",
          className,
        )}
      >
        圖片暫時無法載入
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={cn("rounded-xl object-cover", className)}
    />
  );
}
