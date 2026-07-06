import { db } from '@/db'
import { clients, profiles, clientScores } from '@/db/schema'
import { eq, ilike, or, and, desc } from 'drizzle-orm'

export async function getClientByProfileId(profileId: string) {
  const rows = await db
    .select()
    .from(clients)
    .where(eq(clients.profileId, profileId))
    .limit(1)
  return rows[0] ?? null
}

export async function getClientByCuit(cuit: string) {
  const rows = await db
    .select()
    .from(clients)
    .where(eq(clients.cuit, cuit))
    .limit(1)
  return rows[0] ?? null
}

export interface GetAllClientsOptions {
  search?: string
  validationStatus?: 'pending' | 'validated' | 'invalid' | 'all'
  bcraRiskLevel?: string
  page?: number
  pageSize?: number
}

export async function getAllClients(options: GetAllClientsOptions = {}) {
  const { search, validationStatus = 'all', bcraRiskLevel, page = 1, pageSize = 20 } = options
  const offset = (page - 1) * pageSize

  const conditions = []

  if (search) {
    conditions.push(
      or(
        ilike(clients.razonSocial, `%${search}%`),
        ilike(clients.cuit, `%${search}%`)
      )
    )
  }

  if (validationStatus !== 'all') {
    conditions.push(eq(clients.afipStatus, validationStatus))
  }

  if (bcraRiskLevel) {
    conditions.push(eq(clients.bcraRiskLevel, bcraRiskLevel))
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const rows = await db
    .select({
      id: clients.id,
      profileId: clients.profileId,
      cuit: clients.cuit,
      razonSocial: clients.razonSocial,
      afipStatus: clients.afipStatus,
      bcraStatus: clients.bcraStatus,
      bcraRiskLevel: clients.bcraRiskLevel,
      validationPending: clients.validationPending,
      createdAt: clients.createdAt,
      fullName: profiles.fullName,
      phone: profiles.phone,
      assignedSalespersonId: profiles.assignedSalespersonId,
    })
    .from(clients)
    .innerJoin(profiles, eq(profiles.id, clients.profileId))
    .where(where)
    .orderBy(desc(clients.createdAt))
    .limit(pageSize)
    .offset(offset)

  return rows
}

export async function getClientWithScore(clientId: string) {
  const [client] = await db
    .select({
      id: clients.id,
      profileId: clients.profileId,
      cuit: clients.cuit,
      razonSocial: clients.razonSocial,
      afipStatus: clients.afipStatus,
      bcraStatus: clients.bcraStatus,
      bcraRiskLevel: clients.bcraRiskLevel,
      validationPending: clients.validationPending,
      createdAt: clients.createdAt,
      updatedAt: clients.updatedAt,
      fullName: profiles.fullName,
      companyName: profiles.companyName,
      phone: profiles.phone,
      assignedSalespersonId: profiles.assignedSalespersonId,
      industry: clients.industry,
      score: clientScores.score,
      scoreLastCalculatedAt: clientScores.calculatedAt,
    })
    .from(clients)
    .innerJoin(profiles, eq(profiles.id, clients.profileId))
    .leftJoin(clientScores, eq(clientScores.clientId, clients.id))
    .where(eq(clients.id, clientId))
    .limit(1)

  return client ?? null
}

export async function getClientValidationStatus(clientId: string) {
  const rows = await db
    .select({
      afipStatus: clients.afipStatus,
      afipCachedAt: clients.afipCachedAt,
      bcraStatus: clients.bcraStatus,
      bcraCachedAt: clients.bcraCachedAt,
      bcraRiskLevel: clients.bcraRiskLevel,
      validationPending: clients.validationPending,
    })
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1)

  return rows[0] ?? null
}
