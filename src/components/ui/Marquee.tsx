type Props = { items: readonly string[] }

/** Kesintisiz kayan uzmanlık şeridi. */
export default function Marquee({ items }: Props) {
  const row = [...items, ...items]
  return (
    <div className="relative flex overflow-hidden py-1 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div className="flex w-max animate-[marquee_38s_linear_infinite] gap-7 hover:[animation-play-state:paused]">
        {row.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="inline-flex shrink-0 items-center gap-2.5 px-3 py-2.5 font-display text-sm font-semibold text-ink-700"
          >
            <span className="size-1.5 rounded-full bg-vital-500" />
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
