type Props = { items: readonly string[] }

/** Kesintisiz kayan uzmanlık şeridi. */
export default function Marquee({ items }: Props) {
  const row = [...items, ...items]
  return (
    <div className="relative flex overflow-hidden py-1 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div className="flex w-max animate-[marquee_38s_linear_infinite] gap-3 hover:[animation-play-state:paused]">
        {row.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="inline-flex shrink-0 items-center gap-2.5 rounded-full border border-white/80 bg-white/70 px-5 py-2.5 font-display text-sm font-semibold text-ink-700 shadow-[0_1px_0_rgb(255_255_255/0.9)_inset,0_8px_20px_-14px_rgb(11_31_56/0.5)] backdrop-blur"
          >
            <span className="size-1.5 rounded-full bg-vital-500" />
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
