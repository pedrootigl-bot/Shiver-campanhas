# Cria a pasta partner-hub, copia o front React e gera os arquivos novos da API.
# Uso (na raiz do Shiver-Campanhas):
#   powershell -ExecutionPolicy Bypass -File .\scripts\criar-partner-hub.ps1

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
$Origem = "C:\Users\felip\Downloads\materiais shiver\materiais shiver"
$Destino = Join-Path $RepoRoot "partner-hub"

if (-not (Test-Path -LiteralPath $Origem)) {
    throw "Pasta de origem nao encontrada: $Origem"
}

function Ensure-Dir {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path | Out-Null
    }
}

function Copy-FromOrigin {
    param([string]$Relative)
    $from = Join-Path $Origem $Relative
    $to = Join-Path $Destino $Relative
    if (-not (Test-Path -LiteralPath $from)) {
        Write-Host "AVISO: origem ausente, pulando $Relative"
        return
    }
    Ensure-Dir (Split-Path -Parent $to)
    Copy-Item -LiteralPath $from -Destination $to -Force
    Write-Host "copiado  $Relative"
}

function Write-NewFile {
    param(
        [string]$Path,
        [string]$Contents
    )
    Ensure-Dir (Split-Path -Parent $Path)
    if (Test-Path -LiteralPath $Path) {
        Write-Host "existe   $($Path.Substring($RepoRoot.Length + 1))"
        return
    }
    Set-Content -LiteralPath $Path -Value $Contents -Encoding utf8
    Write-Host "criado   $($Path.Substring($RepoRoot.Length + 1))"
}

Ensure-Dir $Destino
Ensure-Dir (Join-Path $Destino "public")
Ensure-Dir (Join-Path $Destino "src\types")
Ensure-Dir (Join-Path $Destino "src\lib")
Ensure-Dir (Join-Path $Destino "src\hooks")
Ensure-Dir (Join-Path $Destino "src\components\effects")
Ensure-Dir (Join-Path $Destino "src\components\ui")
Ensure-Dir (Join-Path $Destino "src\components\partner-hub")

$copiar = @(
    "package.json",
    "vite.config.ts",
    "tsconfig.json",
    "tsconfig.app.json",
    "tsconfig.node.json",
    ".oxlintrc.json",
    "index.html",
    "public\favicon.svg",
    "public\icons.svg",
    "src\main.tsx",
    "src\App.tsx",
    "src\index.css",
    "src\types\campaign.ts",
    "src\lib\utils.ts",
    "src\lib\asset-download.ts",
    "src\lib\campaign-utils.ts",
    "src\hooks\useClipboard.ts",
    "src\hooks\useCountdown.ts",
    "src\hooks\useBodyScrollLock.ts",
    "src\components\SplashScreen.tsx",
    "src\components\effects\ChromaticWaves.tsx",
    "src\components\effects\HoverExpand.tsx",
    "src\components\effects\RotatingText.tsx",
    "src\components\effects\SmokyText.tsx",
    "src\components\effects\CoverflowGallery.tsx",
    "src\components\ui\ActionButton.tsx",
    "src\components\ui\SoftButton.tsx",
    "src\components\ui\GlowButton.tsx",
    "src\components\ui\FadeIn.tsx",
    "src\components\ui\UnavailableMaterialDialog.tsx",
    "src\components\partner-hub\PartnerHeader.tsx",
    "src\components\partner-hub\ShiverHero.tsx",
    "src\components\partner-hub\HeroMaterialsSlider.tsx",
    "src\components\partner-hub\PartnerStats.tsx",
    "src\components\partner-hub\TodayRecommendation.tsx",
    "src\components\partner-hub\CampaignCoverflow.tsx",
    "src\components\partner-hub\EndingSoon.tsx",
    "src\components\partner-hub\MomentumBanner.tsx",
    "src\components\partner-hub\CampaignTimeline.tsx",
    "src\components\partner-hub\PersonalizedCampaignTeaser.tsx",
    "src\components\partner-hub\PartnerSupport.tsx",
    "src\components\partner-hub\CampaignDrawer.tsx",
    "src\components\partner-hub\CampaignOverview.tsx",
    "src\components\partner-hub\CampaignMaterials.tsx",
    "src\components\partner-hub\CampaignCopies.tsx",
    "src\components\partner-hub\CampaignRules.tsx",
    "src\components\partner-hub\CampaignGrid.tsx",
    "src\components\partner-hub\CampaignCard.tsx",
    "src\components\partner-hub\CampaignFilters.tsx",
    "src\components\partner-hub\FeaturedCampaignHero.tsx"
)

Write-Host "=== Copiando front React ==="
foreach ($arquivo in $copiar) {
    Copy-FromOrigin $arquivo
}

Write-Host ""
Write-Host "=== Criando arquivos novos ==="

Write-NewFile (Join-Path $Destino ".gitignore") @'
node_modules
dist
dist-ssr
*.local
.DS_Store
'@

Write-NewFile (Join-Path $Destino ".env.example") @'
VITE_API_URL=http://localhost:3000
'@

Write-NewFile (Join-Path $Destino "src\vite-env.d.ts") @'
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
'@

Write-NewFile (Join-Path $Destino "src\types\api.ts") @'
/** Tipos crus da API Shiver-Campanhas. Preencher na integracao. */

export type StatusApi = "agendada" | "ativa" | "finalizada" | string

export type CampanhaApi = {
  id: number
  nome?: string
  titulo?: string
  status?: StatusApi
  data_inicio?: string
  data_fim?: string
  pronta_publicacao?: boolean | string | number
  [key: string]: unknown
}

export type MaterialApi = {
  id: number
  campanha_id: number
  nome?: string
  tipo?: string
  formato?: string
  url?: string
  [key: string]: unknown
}

export type CopyApi = {
  id: number
  campanha_id: number
  titulo?: string
  texto?: string
  canal?: string
  [key: string]: unknown
}
'@

Write-NewFile (Join-Path $Destino "src\lib\api.ts") @'
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000"

async function getJson<T>(path: string): Promise<T> {
  const resposta = await fetch(`${API_URL}${path}`)
  if (!resposta.ok) {
    throw new Error(`Falha em ${path}: ${resposta.status}`)
  }
  return resposta.json() as Promise<T>
}

export function fetchCampanhas() {
  return getJson<unknown[]>("/api/campanhas")
}

export function fetchMateriais(campanhaId: number) {
  return getJson<unknown[]>(`/api/materiais/${campanhaId}`)
}

export function fetchCopies(campanhaId: number) {
  return getJson<unknown[]>(`/api/copies/${campanhaId}`)
}

export function fetchRegras(campanhaId: number) {
  return getJson<unknown[]>(`/api/regras/${campanhaId}`)
}

export function fetchAngulos(campanhaId: number) {
  return getJson<unknown[]>(`/api/angulos/${campanhaId}`)
}

export function fetchKits(campanhaId: number) {
  return getJson<unknown[]>(`/api/kits/${campanhaId}`)
}

export function fetchStats() {
  return getJson<unknown>("/api/stats")
}

export function fetchDestaque() {
  return getJson<unknown>("/api/destaque")
}

export function fetchPartnerHubCampanhas() {
  return getJson<unknown[]>("/api/partner-hub/campanhas")
}
'@

Write-NewFile (Join-Path $Destino "src\lib\map-campaign.ts") @'
import type { Campaign } from "../types/campaign"

/** Traduz payload da API para o tipo Campaign do Partner Hub. */
export function mapCampanhaToCampaign(_raw: unknown): Campaign {
  throw new Error("mapCampanhaToCampaign ainda nao implementado")
}

export function mapCampanhasToCampaigns(rawList: unknown[]): Campaign[] {
  return rawList.map(mapCampanhaToCampaign)
}
'@

Write-NewFile (Join-Path $Destino "src\hooks\useCampaigns.ts") @'
import { useEffect, useState } from "react"
import type { Campaign } from "../types/campaign"
import { fetchPartnerHubCampanhas } from "../lib/api"
import { mapCampanhasToCampaigns } from "../lib/map-campaign"

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true

    async function carregar() {
      try {
        const dados = await fetchPartnerHubCampanhas()
        if (!ativo) return
        setCampaigns(mapCampanhasToCampaigns(Array.isArray(dados) ? dados : []))
      } catch (err) {
        if (!ativo) return
        setError(err instanceof Error ? err.message : "Erro ao carregar campanhas")
      } finally {
        if (ativo) setLoading(false)
      }
    }

    void carregar()
    return () => {
      ativo = false
    }
  }, [])

  return { campaigns, loading, error }
}
'@

Write-NewFile (Join-Path $RepoRoot "backend\routes\partnerHubRoutes.js") @'
const express = require("express");

const router = express.Router();

const supabase = require("../config/supabase");
const { responderErroInterno } = require("../utils/httpErrors");
const {
    sincronizarStatusCampanhas
} = require("../utils/campanhaStatus");

/**
 * GET /api/partner-hub/campanhas
 * Lista campanhas publicas com materiais, copies, regras, angulos e kits.
 */
router.get("/campanhas", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("campanhas")
            .select("*")
            .order("id", { ascending: false });

        if (error) {
            return responderErroInterno(
                res,
                error,
                "Erro ao buscar campanhas do partner hub"
            );
        }

        const sincronizadas = await sincronizarStatusCampanhas(
            supabase,
            data || []
        );

        // TODO: agregar materiais, copies, regras, angulos e kits por campanha
        res.json(sincronizadas);
    } catch (error) {
        return responderErroInterno(
            res,
            error,
            "Erro interno no partner hub"
        );
    }
});

module.exports = router;
'@

Write-Host ""
Write-Host "Pronto. Pasta: $Destino"
Write-Host "Proximo passo: cd partner-hub ; npm install"
Write-Host "Ainda falta ligar a rota em backend/server.js e o CORS."
