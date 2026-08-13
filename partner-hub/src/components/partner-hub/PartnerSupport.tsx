import { FadeIn } from '../ui/FadeIn'
import { SoftButton } from '../ui/SoftButton'
import { ActionButton } from '../ui/ActionButton'

/**
 * Contatos oficiais não estavam definidos no projeto local.
 * CTAs ficam sem links inventados até haver URL/WhatsApp reais.
 */
export function PartnerSupport() {
  return (
    <section id="suporte" className="pb-20 md:pb-24">
      <div className="container">
        <FadeIn variant="up" durationMs={800}>
          <div className="motion-card rounded-[10px] border border-[var(--color-line)] bg-[var(--color-card)] px-6 py-10 md:px-10 md:py-12">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <p className="mb-2 text-[0.7rem] font-medium tracking-[0.16em] text-[var(--color-green)] uppercase">
                  Suporte ao parceiro
                </p>
                <h2 className="font-display text-[clamp(1.55rem,2.8vw,2rem)] font-semibold tracking-tight">
                  Precisa de ajuda?
                </h2>
                <p className="mt-2 text-[0.95rem] text-[var(--color-muted)]">
                  Fale com nosso time e encontre o material ideal para sua campanha.
                </p>
              </div>

              <div className="flex flex-col gap-2.5 sm:flex-row">
                <ActionButton
                  onClick={() => {
                    // Contato oficial ainda não cadastrado no projeto.
                  }}
                  aria-label="Falar com suporte (contato em breve)"
                >
                  Falar com suporte
                </ActionButton>
                <SoftButton
                  onClick={() => {
                    document.getElementById('campanhas')?.scrollIntoView({
                      behavior: 'smooth',
                    })
                  }}
                >
                  Solicitar material
                </SoftButton>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
