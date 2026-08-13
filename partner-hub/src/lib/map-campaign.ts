import type {
  Campaign,
  CampaignCopy,
  CampaignMaterial,
  CampaignObjective,
  CampaignStatus,
  CopyChannel,
  MaterialType,
  SellingAngle,
} from "../types/campaign"
import type {
  AnguloApi,
  CampanhaApi,
  CopyApi,
  MaterialApi,
  RegraApi,
  StatusApi,
} from "../types/api"
import { kitDownloadPath } from "./api"

function asRecord(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object") {
    return raw as Record<string, unknown>
  }
  return {}
}

function asCampanhaApi(raw: unknown): CampanhaApi {
  return asRecord(raw) as CampanhaApi
}

function texto(valor: unknown, fallback = ""): string {
  if (valor == null) return fallback
  const limpo = String(valor).trim()
  return limpo || fallback
}

function dataISO(valor: unknown): string {
  const bruto = texto(valor)
  if (/^\d{4}-\d{2}-\d{2}/.test(bruto)) return bruto.slice(0, 10)
  return bruto
}

function slugify(valor: string, fallback: string): string {
  const slug = valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return slug || fallback
}

function listaDeTexto(valor: unknown): string[] {
  if (Array.isArray(valor)) {
    return valor.map((item) => texto(item)).filter(Boolean)
  }
  const bruto = texto(valor)
  if (!bruto) return []
  return bruto
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function mapStatus(status: string): CampaignStatus {
  const chave = status.toLowerCase().trim() as StatusApi | string
  switch (chave) {
    case "ativa":
      return "active"
    case "agendada":
      return "coming-soon"
    case "finalizada":
      return "finished"
    default:
      return "active"
  }
}

function mapObjectives(valor: unknown): CampaignObjective[] {
  const bruto = listaDeTexto(valor).join(" ").toLowerCase()
  const objetivos: CampaignObjective[] = []
  const candidatos: Array<[CampaignObjective, boolean]> = [
    ["acquisition", /aquis|novo/.test(bruto)],
    ["ftd", /ftd|primeiro/.test(bruto)],
    ["redeposit", /redeposit|redesp/.test(bruto)],
    ["retention", /reten/.test(bruto)],
    ["volume", /volume|opera/.test(bruto)],
  ]

  for (const [objetivo, bate] of candidatos) {
    if (bate) objetivos.push(objetivo)
  }

  return objetivos
}

function mapMaterialType(material: MaterialApi): MaterialType {
  const bruto = `${material.formato || ""} ${material.tipo || ""} ${material.nome || ""}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  if (bruto.includes("stor")) return "story"
  if (bruto.includes("feed")) return "feed"
  if (bruto.includes("video")) return "video"
  if (bruto.includes("banner")) return "banner"
  return "other"
}

function mapCopyChannel(canal: string): CopyChannel {
  const chave = canal
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  switch (true) {
    case chave.includes("whats"):
      return "whatsapp"
    case chave.includes("telegram"):
      return "telegram"
    case chave.includes("insta"):
      return "instagram"
    case chave.includes("reativ"):
      return "reactivation"
    default:
      return "commercial"
  }
}

function mapMaterials(lista: MaterialApi[] | undefined): CampaignMaterial[] {
  return (lista || [])
    .filter((item) => texto(item.url))
    .map((item) => ({
      id: String(item.id),
      type: mapMaterialType(item),
      title: texto(item.nome || item.titulo, "Material"),
      thumbnail: texto(item.thumbnail || item.url) || undefined,
      url: texto(item.url),
    }))
}

function mapCopies(lista: CopyApi[] | undefined): CampaignCopy[] {
  return (lista || [])
    .filter((item) => texto(item.texto))
    .map((item) => ({
      id: String(item.id),
      channel: mapCopyChannel(texto(item.canal || item.tipo)),
      title: texto(item.titulo, "Copy"),
      text: texto(item.texto),
    }))
}

function mapRules(lista: RegraApi[] | undefined): string[] {
  return (lista || [])
    .map((item) => {
      const titulo = texto(item.titulo)
      const descricao = texto(item.descricao)
      if (titulo && descricao) return `${titulo}: ${descricao}`
      return descricao || titulo
    })
    .filter(Boolean)
}

function mapAngles(lista: AnguloApi[] | undefined): SellingAngle[] {
  return (lista || [])
    .map((item) => ({
      title: texto(item.titulo, "Ângulo"),
      description: texto(item.descricao),
    }))
    .filter((item) => item.description || item.title)
}

function depositoMinimo(valor: unknown): number | undefined {
  if (valor == null || valor === "") return undefined
  const numero = Number(String(valor).replace(",", "."))
  return Number.isFinite(numero) ? numero : undefined
}

export function mapCampanhaToCampaign(raw: unknown): Campaign {
  const campanha = asCampanhaApi(raw)
  const id = String(campanha.id ?? "")
  const name = texto(campanha.titulo, `Campanha ${id}`)
  const materials = mapMaterials(campanha.materiais)
  const story = materials.find((item) => item.type === "story")
  const cardImage = texto(campanha.imagem_card || campanha.banner || story?.url)
  const destaque = campanha.destaque

  return {
    id,
    slug: slugify(name, id),
    name,
    headline: texto(campanha.texto_header || campanha.resumo, name),
    status: mapStatus(texto(campanha.status)),
    featured: Boolean(destaque),
    startDate: dataISO(campanha.data_inicio),
    endDate: dataISO(campanha.data_fim),
    coupon: texto(campanha.cupom) || undefined,
    minimumDeposit: depositoMinimo(campanha.deposito_minimo),
    prize: texto(campanha.premio) || undefined,
    description: texto(campanha.descricao || campanha.resumo),
    objectives: mapObjectives(campanha.objetivo || campanha.categoria),
    targetAudience: listaDeTexto(campanha.publico_recomendado),
    mechanics: listaDeTexto(campanha.mecanica),
    sellingAngles: mapAngles(campanha.angulos),
    todayRecommendation: destaque
      ? {
          title: texto(destaque.titulo, name),
          description: texto(destaque.descricao || campanha.resumo),
          copy: texto(destaque.copy || destaque.texto) || undefined,
          featuredMaterialId: story?.id,
        }
      : undefined,
    materials,
    copies: mapCopies(campanha.copies),
    rules: mapRules(campanha.regras),
    kitUrl: kitDownloadPath(id),
    heroImage: texto(campanha.banner || campanha.imagem_card) || undefined,
    cardImage,
    storyImage: story?.url || destaque?.storyUrl || destaque?.imagem || undefined,
  }
}

export function mapCampanhasToCampaigns(rawList: unknown[]): Campaign[] {
  return rawList
    .map((item) => {
      try {
        return mapCampanhaToCampaign(item)
      } catch {
        return null
      }
    })
    .filter((item): item is Campaign => Boolean(item?.id))
}
