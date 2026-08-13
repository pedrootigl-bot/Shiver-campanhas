export type StatusApi = "agendada" | "ativa" | "finalizada"

export type MaterialApi = {
  id: number
  campanha_id: number
  nome?: string | null
  titulo?: string | null
  tipo?: string | null
  formato?: string | null
  url?: string | null
  thumbnail?: string | null
}

export type CopyApi = {
  id: number
  campanha_id: number
  titulo?: string | null
  texto?: string | null
  canal?: string | null
  tipo?: string | null
  ordem?: number | null
}

export type RegraApi = {
  id: number
  campanha_id: number
  titulo?: string | null
  descricao?: string | null
  ordem?: number | null
}

export type AnguloApi = {
  id: number
  campanha_id: number
  titulo?: string | null
  descricao?: string | null
  ordem?: number | null
}

export type KitApi = {
  id: number
  campanha_id: number
  url?: string | null
  tipo?: string | null
}

export type DestaqueApi = {
  id?: number
  campanha_id?: number | null
  titulo?: string | null
  descricao?: string | null
  copy?: string | null
  texto?: string | null
  imagem?: string | null
  storyUrl?: string | null
  ativo?: boolean
}

export type CampanhaApi = {
  id: number
  titulo?: string | null
  texto_header?: string | null
  descricao?: string | null
  resumo?: string | null
  categoria?: string | null
  objetivo?: string | null
  publico_recomendado?: string | null
  mecanica?: string[] | string | null
  premio?: string | null
  cupom?: string | null
  deposito_minimo?: string | number | null
  data_inicio?: string | null
  data_fim?: string | null
  status?: StatusApi | string | null
  pronta_publicacao?: boolean | string | number | null
  imagem_card?: string | null
  banner?: string | null
  created_at?: string | null
  materiais?: MaterialApi[]
  copies?: CopyApi[]
  regras?: RegraApi[]
  angulos?: AnguloApi[]
  kits?: KitApi[]
  destaque?: DestaqueApi | null
}
