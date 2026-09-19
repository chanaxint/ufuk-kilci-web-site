const COUNT = 18
const CENTER = 130
const TOP = 56
const SPAN = 286

type Props = {
  /** Cobb açısı (derece) */
  angle: number
  /** Evre rengi */
  color: string
  className?: string
}

/**
 * Cobb açısına göre yanal olarak eğilen, şematik omurga çizimi.
 * Geçişler CSS ile yapılır; açı değiştiğinde her omur kendi konumuna
 * yumuşakça kayar (kare başına React render'ı yok).
 */
export default function SpineCurve({ angle, color, className = '' }: Props) {
  const vertebrae = Array.from({ length: COUNT }, (_, i) => {
    const t = i / (COUNT - 1)
    const y = TOP + t * SPAN
    const w = 26 + t * 22
    const h = 11 + t * 3
    const dx = Math.sin(t * Math.PI) * angle * 0.85
    const rot = Math.cos(t * Math.PI) * angle * 0.5
    return { t, y, w, h, dx, rot }
  })

  const shoulderTilt = -angle * 0.3
  const hipTilt = angle * 0.12
  const cobbTop = vertebrae[2]
  const cobbBottom = vertebrae[COUNT - 3]

  return (
    <svg viewBox="0 0 260 440" className={className} role="img" aria-label={`${angle} derecelik omurga eğriliği`}>
      {/* Şakül çizgisi */}
      <line
        x1={CENTER}
        y1="28"
        x2={CENTER}
        y2="410"
        stroke="#0b1f38"
        strokeOpacity="0.12"
        strokeDasharray="3 6"
      />

      {/* Omuz ve kalça hattı */}
      <g style={{ transition: 'transform 320ms cubic-bezier(0.16,1,0.3,1)' }} transform={`rotate(${shoulderTilt} ${CENTER} 42)`}>
        <line x1={CENTER - 62} y1="42" x2={CENTER + 62} y2="42" stroke="#0b1f38" strokeOpacity="0.25" strokeWidth="2" strokeLinecap="round" />
        <circle cx={CENTER - 62} cy="42" r="3" fill="#0b1f38" fillOpacity="0.3" />
        <circle cx={CENTER + 62} cy="42" r="3" fill="#0b1f38" fillOpacity="0.3" />
      </g>
      <g style={{ transition: 'transform 320ms cubic-bezier(0.16,1,0.3,1)' }} transform={`rotate(${hipTilt} ${CENTER} 372)`}>
        <line x1={CENTER - 48} y1="372" x2={CENTER + 48} y2="372" stroke="#0b1f38" strokeOpacity="0.25" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Cobb açısı çizgileri */}
      <g style={{ transition: 'opacity 320ms ease' }} opacity={angle > 4 ? 1 : 0}>
        <g style={{ transition: 'transform 320ms cubic-bezier(0.16,1,0.3,1)' }} transform={`rotate(${-angle / 2} ${CENTER + cobbTop.dx} ${cobbTop.y})`}>
          <line
            x1={CENTER + cobbTop.dx - 74}
            y1={cobbTop.y}
            x2={CENTER + cobbTop.dx + 74}
            y2={cobbTop.y}
            stroke={color}
            strokeWidth="1.5"
            strokeDasharray="6 5"
            strokeLinecap="round"
          />
        </g>
        <g style={{ transition: 'transform 320ms cubic-bezier(0.16,1,0.3,1)' }} transform={`rotate(${angle / 2} ${CENTER + cobbBottom.dx} ${cobbBottom.y})`}>
          <line
            x1={CENTER + cobbBottom.dx - 74}
            y1={cobbBottom.y}
            x2={CENTER + cobbBottom.dx + 74}
            y2={cobbBottom.y}
            stroke={color}
            strokeWidth="1.5"
            strokeDasharray="6 5"
            strokeLinecap="round"
          />
        </g>
      </g>

      {/* Omurlar */}
      {vertebrae.map((v, i) => (
        <rect
          key={i}
          x={CENTER - v.w / 2}
          y={v.y - v.h / 2}
          width={v.w}
          height={v.h}
          rx={v.h / 2}
          fill="url(#vertebraFill)"
          stroke="#0b1f38"
          strokeOpacity="0.14"
          style={{
            transform: `translateX(${v.dx}px) rotate(${v.rot}deg)`,
            transformOrigin: `${CENTER}px ${v.y}px`,
            transition: 'transform 320ms cubic-bezier(0.16,1,0.3,1)',
          }}
        />
      ))}

      {/* Leğen kemiği */}
      <g
        style={{
          transform: `translateX(${vertebrae[COUNT - 1].dx * 0.35}px) rotate(${hipTilt}deg)`,
          transformOrigin: `${CENTER}px 372px`,
          transition: 'transform 320ms cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Sol ve sağ kanat + sakrum */}
        <path
          d={`M ${CENTER - 9} 344 C ${CENTER - 32} 334, ${CENTER - 57} 344, ${CENTER - 56} 368
              C ${CENTER - 55} 392, ${CENTER - 38} 406, ${CENTER - 26} 398
              C ${CENTER - 15} 390, ${CENTER - 9} 368, ${CENTER - 9} 344 Z`}
          fill="url(#vertebraFill)"
          stroke="#0b1f38"
          strokeOpacity="0.14"
        />
        <path
          d={`M ${CENTER + 9} 344 C ${CENTER + 32} 334, ${CENTER + 57} 344, ${CENTER + 56} 368
              C ${CENTER + 55} 392, ${CENTER + 38} 406, ${CENTER + 26} 398
              C ${CENTER + 15} 390, ${CENTER + 9} 368, ${CENTER + 9} 344 Z`}
          fill="url(#vertebraFill)"
          stroke="#0b1f38"
          strokeOpacity="0.14"
        />
        <path
          d={`M ${CENTER - 10} 342 L ${CENTER + 10} 342 L ${CENTER + 5} 392 Q ${CENTER} 400, ${CENTER - 5} 392 Z`}
          fill="url(#vertebraFill)"
          stroke="#0b1f38"
          strokeOpacity="0.14"
        />
      </g>

      <defs>
        <linearGradient id="vertebraFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#f2e9dc" />
          <stop offset="100%" stopColor="#d9cbb8" />
        </linearGradient>
      </defs>
    </svg>
  )
}
