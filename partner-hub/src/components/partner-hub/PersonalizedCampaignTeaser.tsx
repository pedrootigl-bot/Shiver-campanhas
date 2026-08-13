import { Lock, Sparkles } from 'lucide-react'
import { FadeIn } from '../ui/FadeIn'

export function PersonalizedCampaignTeaser() {
  return (
    <section className="pb-16 md:pb-20">
      <div className="container">
        <FadeIn variant="blur">
          <div className="mb-6">
            <p className="mb-2 text-[0.7rem] font-medium tracking-[0.16em] text-[var(--color-green)] uppercase">
              Próximo nível
            </p>
            <h2 className="font-display text-[clamp(1.65rem,3vw,2.25rem)] font-medium tracking-tight">
              Campanhas feitas para você
            </h2>
            <p className="mt-2 max-w-2xl text-[var(--color-muted)]">
              O próximo nível da sua divulgação está chegando. Em breve, parceiros
              poderão encontrar recomendações de campanhas, materiais e abordagens
              alinhadas ao seu público e aos seus objetivos.
            </p>
          </div>
        </FadeIn>

        <FadeIn delayMs={90} variant="scale">
          <div className="motion-card relative overflow-hidden rounded-[10px] border border-[var(--color-line)] bg-[var(--color-card)]">
            <div className="absolute inset-0 opacity-40 blur-[2px]">
              <div className="absolute top-8 left-8 h-40 w-56 rotate-[-8deg] rounded-[10px] border border-[var(--color-line)] bg-[linear-gradient(135deg,#15284a,#0a1628)]" />
              <div className="absolute top-16 right-16 h-44 w-60 rotate-[6deg] rounded-[10px] border border-[var(--color-line)] bg-[linear-gradient(135deg,#1a37f9,#0b1f4a)]" />
              <div className="absolute bottom-10 left-1/3 h-36 w-52 rotate-[-3deg] rounded-[10px] border border-[var(--color-line)] bg-[linear-gradient(135deg,#122440,#060f21)]" />
            </div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(26,55,249,0.14),transparent_55%)]" />

            <div className="relative z-[1] flex flex-col items-center px-6 py-16 text-center md:py-20">
              <span className="mb-5 inline-flex items-center gap-2 rounded-md border border-[var(--color-line-strong)] bg-[rgba(6,15,33,0.75)] px-3 py-1.5 text-[0.7rem] font-bold tracking-[0.16em] text-[var(--color-green)] uppercase backdrop-blur">
                <Lock size={12} />
                Em breve
              </span>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-[10px] border border-[var(--color-line-strong)] bg-[rgba(6,15,33,0.8)] text-[var(--color-green)] shadow-[0_0_40px_rgba(26,55,249,0.18)]">
                <Sparkles size={22} />
              </div>
              <h3 className="font-display max-w-[16ch] text-[clamp(1.45rem,2.8vw,1.9rem)] font-medium tracking-tight">
                Campanhas personalizadas para o seu público
              </h3>
              <ul className="mt-6 space-y-2 text-sm text-[var(--color-muted)]">
                <li>Recomendações inteligentes</li>
                <li>Materiais selecionados</li>
                <li>Estratégias por perfil</li>
              </ul>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
