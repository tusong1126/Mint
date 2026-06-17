import { useState, useRef, useCallback, cloneElement, isValidElement } from "react";

interface TooltipProps {
  children: React.ReactNode;
  text: string;
}

export default function Tooltip({ children, text }: TooltipProps) {
  const ref = useRef<HTMLElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const handleEnter = useCallback(() => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      setPos({ x: rect.left + rect.width / 2, y: rect.top });
    }
  }, []);

  const popup = pos && (
    <span
      className="fixed -translate-x-1/2 -translate-y-full px-2 py-1 rounded-md bg-gray-800 text-white text-[11px] leading-tight whitespace-nowrap pointer-events-none z-[9999]"
      style={{ left: pos.x, top: pos.y, marginTop: -6 }}
    >
      {text}
    </span>
  );

  if (isValidElement(children)) {
    const child = children as React.ReactElement & { ref?: React.Ref<HTMLElement> };
    return (
      <>
        {cloneElement(child, {
          ref,
          onMouseEnter: (e: React.MouseEvent) => {
            handleEnter();
            (child.props as any).onMouseEnter?.(e);
          },
          onMouseLeave: (e: React.MouseEvent) => {
            setPos(null);
            (child.props as any).onMouseLeave?.(e);
          },
        })}
        {popup}
      </>
    );
  }

  return <>{children}</>;
}