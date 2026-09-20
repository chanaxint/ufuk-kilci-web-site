/**
 * İki bölüm arasına giren ince ayraç.
 *
 * Kart yüzeyleri kalktıktan sonra sayfanın nerede bölündüğünü gösteren tek
 * işaret bu; uçları söndüğü için kutu hissi bırakmıyor.
 */
export default function SectionRule() {
  return (
    <div aria-hidden className="section-shell">
      <div className="rule" />
    </div>
  )
}
