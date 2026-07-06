/**
 * ============================================================
 * WARNING — MOCK DATA SEED
 * ============================================================
 * These profile UUIDs are randomly generated for local/staging
 * development ONLY.  In production, you MUST create real users
 * via Supabase Auth first (Dashboard → Authentication → Users
 * or the Admin API), then replace every UUID below with the
 * actual auth.users.id values Supabase assigned.
 *
 * Inserting profiles with fabricated UUIDs will break RLS
 * policies that join profiles to auth.users.
 * ============================================================
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
import { db } from '../index'
import {
  profiles,
  categories,
  products,
  clients,
  priceLists,
  priceListRules,
  quotes,
  quoteItems,
  clientScores,
  noPurchaseAlerts,
  appConfig,
  interestLists,
  interestListItems,
  voiceConsultations,
  scoringConfig,
} from '../schema'

// ---------------------------------------------------------------------------
// Static UUIDs
// In production these come from Supabase Auth — create auth users first.
// ---------------------------------------------------------------------------
const ID = {
  // Staff
  diego: '11111111-0000-4000-a000-000000000001',
  laura: '11111111-0000-4000-a000-000000000002',
  martin: '11111111-0000-4000-a000-000000000003',
  sofia: '11111111-0000-4000-a000-000000000004',

  // Client profiles
  clientProfile1: '22222222-0000-4000-a000-000000000001',
  clientProfile2: '22222222-0000-4000-a000-000000000002',
  clientProfile3: '22222222-0000-4000-a000-000000000003',
  clientProfile4: '22222222-0000-4000-a000-000000000004',
  clientProfile5: '22222222-0000-4000-a000-000000000005',

  // Categories
  catBolas: '33333333-0000-4000-a000-000000000001',
  catRodillos: '33333333-0000-4000-a000-000000000002',
  catConicos: '33333333-0000-4000-a000-000000000003',
  catAgricolas: '33333333-0000-4000-a000-000000000004',
  catSellos: '33333333-0000-4000-a000-000000000005',
  catAccesorios: '33333333-0000-4000-a000-000000000006',

  // Products (20)
  p01: '44444444-0000-4000-a000-000000000001',
  p02: '44444444-0000-4000-a000-000000000002',
  p03: '44444444-0000-4000-a000-000000000003',
  p04: '44444444-0000-4000-a000-000000000004',
  p05: '44444444-0000-4000-a000-000000000005',
  p06: '44444444-0000-4000-a000-000000000006',
  p07: '44444444-0000-4000-a000-000000000007',
  p08: '44444444-0000-4000-a000-000000000008',
  p09: '44444444-0000-4000-a000-000000000009',
  p10: '44444444-0000-4000-a000-000000000010',
  p11: '44444444-0000-4000-a000-000000000011',
  p12: '44444444-0000-4000-a000-000000000012',
  p13: '44444444-0000-4000-a000-000000000013',
  p14: '44444444-0000-4000-a000-000000000014',
  p15: '44444444-0000-4000-a000-000000000015',
  p16: '44444444-0000-4000-a000-000000000016',
  p17: '44444444-0000-4000-a000-000000000017',
  p18: '44444444-0000-4000-a000-000000000018',
  p19: '44444444-0000-4000-a000-000000000019',
  p20: '44444444-0000-4000-a000-000000000020',

  // Clients (CRM records)
  client1: '55555555-0000-4000-a000-000000000001',
  client2: '55555555-0000-4000-a000-000000000002',
  client3: '55555555-0000-4000-a000-000000000003',
  client4: '55555555-0000-4000-a000-000000000004',
  client5: '55555555-0000-4000-a000-000000000005',

  // Price lists
  listaA: '66666666-0000-4000-a000-000000000001',
  listaB: '66666666-0000-4000-a000-000000000002',

  // Quotes (8)
  q1: '77777777-0000-4000-a000-000000000001',
  q2: '77777777-0000-4000-a000-000000000002',
  q3: '77777777-0000-4000-a000-000000000003',
  q4: '77777777-0000-4000-a000-000000000004',
  q5: '77777777-0000-4000-a000-000000000005',
  q6: '77777777-0000-4000-a000-000000000006',
  q7: '77777777-0000-4000-a000-000000000007',
  q8: '77777777-0000-4000-a000-000000000008',

  // Interest lists
  il1: '88888888-0000-4000-a000-000000000001',
  il2: '88888888-0000-4000-a000-000000000002',
} as const

// ---------------------------------------------------------------------------
// 1. Profiles
// ---------------------------------------------------------------------------
async function seedProfiles() {
  await db
    .insert(profiles)
    .values([
      {
        id: ID.diego,
        fullName: 'Diego Rodríguez',
        companyName: 'Seeking Business',
        phone: '+54 11 4567-8901',
        role: 'admin_general',
      },
      {
        id: ID.laura,
        fullName: 'Laura Méndez',
        companyName: 'Seeking Business',
        phone: '+54 11 4567-8902',
        role: 'admin_secundario',
      },
      {
        id: ID.martin,
        fullName: 'Martín Ferreyra',
        companyName: 'Seeking Business',
        phone: '+54 11 4567-8903',
        role: 'vendedor',
      },
      {
        id: ID.sofia,
        fullName: 'Sofía Paz',
        companyName: 'Seeking Business',
        phone: '+54 11 4567-8904',
        role: 'vendedor',
      },
      {
        id: ID.clientProfile1,
        fullName: 'Carlos Ibáñez',
        companyName: 'Maquinarias del Sur S.A.',
        phone: '+54 341 421-0001',
        role: 'cliente',
        assignedSalespersonId: ID.martin,
      },
      {
        id: ID.clientProfile2,
        fullName: 'Patricia Suárez',
        companyName: 'Metalúrgica Rosario S.R.L.',
        phone: '+54 341 421-0002',
        role: 'cliente',
        assignedSalespersonId: ID.martin,
      },
      {
        id: ID.clientProfile3,
        fullName: 'Roberto Villalba',
        companyName: 'Agro San Luis S.A.',
        phone: '+54 266 421-0003',
        role: 'cliente',
        assignedSalespersonId: ID.sofia,
      },
      {
        id: ID.clientProfile4,
        fullName: 'Jorge García',
        companyName: 'Talleres García e Hijos',
        phone: '+54 11 4523-0004',
        role: 'cliente',
        assignedSalespersonId: ID.sofia,
      },
      {
        id: ID.clientProfile5,
        fullName: 'Alejandra Ríos',
        companyName: 'Distribuidora Córdoba S.R.L.',
        phone: '+54 351 421-0005',
        role: 'cliente',
        assignedSalespersonId: ID.martin,
      },
    ])
    .onConflictDoNothing()

  console.log('✓ Seeded profiles (4 staff + 5 clients)')
}

// ---------------------------------------------------------------------------
// 2. Categories
// ---------------------------------------------------------------------------
async function seedCategories() {
  await db
    .insert(categories)
    .values([
      {
        id: ID.catBolas,
        name: 'Rodamientos de Bolas',
        slug: 'rodamientos-bolas',
        sortOrder: 1,
        active: true,
      },
      {
        id: ID.catRodillos,
        name: 'Rodamientos de Rodillos',
        slug: 'rodamientos-rodillos',
        sortOrder: 2,
        active: true,
      },
      {
        id: ID.catConicos,
        name: 'Rodamientos Cónicos',
        slug: 'rodamientos-conicos',
        sortOrder: 3,
        active: true,
      },
      {
        id: ID.catAgricolas,
        name: 'Rodamientos Agrícolas',
        slug: 'rodamientos-agricolas',
        sortOrder: 4,
        active: true,
      },
      {
        id: ID.catSellos,
        name: 'Sellos y Retenes',
        slug: 'sellos-retenes',
        sortOrder: 5,
        active: true,
      },
      {
        id: ID.catAccesorios,
        name: 'Accesorios y Lubricantes',
        slug: 'accesorios-lubricantes',
        sortOrder: 6,
        active: true,
      },
    ])
    .onConflictDoNothing()

  console.log('✓ Seeded categories (6)')
}

// ---------------------------------------------------------------------------
// 3. Products (20)
// ---------------------------------------------------------------------------
async function seedProducts() {
  await db
    .insert(products)
    .values([
      // — Rodamientos de Bolas (6 products) —
      {
        id: ID.p01,
        categoryId: ID.catBolas,
        sku: '6205-2RS',
        name: 'Rodamiento de Bola 6205-2RS',
        description: 'Rodamiento rígido de bolas con dos sellos de caucho. Uso general industrial.',
        specs: {
          diametro_interior: '25mm',
          diametro_exterior: '52mm',
          ancho: '15mm',
          carga_dinamica: '14.0 kN',
          carga_estatica: '7.8 kN',
          velocidad_limite: '13000 rpm',
          material: 'Acero Cromado',
          origen: 'China',
          marca: 'NSK / FAG compatible',
        },
        active: true,
      },
      {
        id: ID.p02,
        categoryId: ID.catBolas,
        sku: '6303-2Z',
        name: 'Rodamiento de Bola 6303-2Z',
        description: 'Rodamiento rígido de bolas con dos tapas metálicas. Alta velocidad.',
        specs: {
          diametro_interior: '17mm',
          diametro_exterior: '47mm',
          ancho: '14mm',
          carga_dinamica: '11.4 kN',
          carga_estatica: '5.85 kN',
          velocidad_limite: '16000 rpm',
          material: 'Acero Cromado',
          origen: 'China',
          marca: 'SKF compatible',
        },
        active: true,
      },
      {
        id: ID.p03,
        categoryId: ID.catBolas,
        sku: '6008-ZZ',
        name: 'Rodamiento de Bola 6008-ZZ',
        description: 'Rodamiento rígido de bolas sellado. Ideal para electrodomésticos y motores.',
        specs: {
          diametro_interior: '40mm',
          diametro_exterior: '68mm',
          ancho: '15mm',
          carga_dinamica: '16.8 kN',
          carga_estatica: '10.0 kN',
          velocidad_limite: '9000 rpm',
          material: 'Acero Cromado',
          origen: 'China',
        },
        active: true,
      },
      {
        id: ID.p04,
        categoryId: ID.catBolas,
        sku: '6210-C3',
        name: 'Rodamiento de Bola 6210 C3',
        description: 'Rodamiento abierto con holgura interna C3. Para aplicaciones con variaciones térmicas.',
        specs: {
          diametro_interior: '50mm',
          diametro_exterior: '90mm',
          ancho: '20mm',
          carga_dinamica: '35.0 kN',
          carga_estatica: '21.6 kN',
          velocidad_limite: '7500 rpm',
          holgura: 'C3',
          material: 'Acero Cromado',
          origen: 'Japón',
        },
        active: true,
      },
      {
        id: ID.p05,
        categoryId: ID.catBolas,
        sku: '6000-2RS',
        name: 'Rodamiento de Bola 6000-2RS Miniatura',
        description: 'Rodamiento miniatura sellado. Electronica, instrumentación y pequeños motores.',
        specs: {
          diametro_interior: '10mm',
          diametro_exterior: '26mm',
          ancho: '8mm',
          carga_dinamica: '4.55 kN',
          carga_estatica: '1.96 kN',
          velocidad_limite: '22000 rpm',
          material: 'Acero Inoxidable',
          origen: 'Japón',
        },
        active: true,
      },
      {
        id: ID.p06,
        categoryId: ID.catBolas,
        sku: '6306-2RSC3',
        name: 'Rodamiento de Bola 6306-2RS C3',
        description: 'Rodamiento sellado holgura C3 para motores eléctricos y bombas.',
        specs: {
          diametro_interior: '30mm',
          diametro_exterior: '72mm',
          ancho: '19mm',
          carga_dinamica: '28.1 kN',
          carga_estatica: '14.6 kN',
          velocidad_limite: '10000 rpm',
          holgura: 'C3',
          material: 'Acero Cromado',
          origen: 'China',
        },
        active: true,
      },

      // — Rodamientos de Rodillos (3 products) —
      {
        id: ID.p07,
        categoryId: ID.catRodillos,
        sku: 'NU208-ECP',
        name: 'Rodamiento Cilíndrico NU208 ECP',
        description: 'Rodamiento de rodillos cilíndricos de una hilera. Soporta altas cargas radiales.',
        specs: {
          diametro_interior: '40mm',
          diametro_exterior: '80mm',
          ancho: '18mm',
          carga_dinamica: '62.0 kN',
          carga_estatica: '48.0 kN',
          velocidad_limite: '9000 rpm',
          tipo: 'Cilíndrico NU',
          material: 'Acero Cromado',
          origen: 'Alemania',
          marca: 'FAG compatible',
        },
        active: true,
      },
      {
        id: ID.p08,
        categoryId: ID.catRodillos,
        sku: 'NJ312-ECP',
        name: 'Rodamiento Cilíndrico NJ312 ECP',
        description: 'Rodamiento NJ312 con pestaña guía. Permite desplazamiento axial controlado.',
        specs: {
          diametro_interior: '60mm',
          diametro_exterior: '130mm',
          ancho: '31mm',
          carga_dinamica: '148.0 kN',
          carga_estatica: '132.0 kN',
          velocidad_limite: '5300 rpm',
          tipo: 'Cilíndrico NJ',
          material: 'Acero Cromado',
          origen: 'Alemania',
        },
        active: true,
      },
      {
        id: ID.p09,
        categoryId: ID.catRodillos,
        sku: 'RNA4908',
        name: 'Rodamiento de Agujas RNA4908',
        description: 'Rodamiento de agujas sin aro interior. Muy compacto, alta capacidad radial.',
        specs: {
          diametro_interior: '45mm',
          diametro_exterior: '62mm',
          ancho: '22mm',
          carga_dinamica: '42.0 kN',
          carga_estatica: '52.0 kN',
          tipo: 'Agujas sin aro interior',
          material: 'Acero Cromado',
          origen: 'China',
        },
        active: true,
      },

      // — Rodamientos Cónicos (3 products) —
      {
        id: ID.p10,
        categoryId: ID.catConicos,
        sku: '32210',
        name: 'Rodamiento Cónico 32210',
        description: 'Rodamiento de rodillos cónicos de una hilera. Muy usado en transmisiones y ejes de vehículos.',
        specs: {
          diametro_interior: '50mm',
          diametro_exterior: '90mm',
          ancho: '24.75mm',
          angulo_contacto: '12.57°',
          carga_dinamica: '95.0 kN',
          carga_estatica: '108.0 kN',
          velocidad_limite: '5000 rpm',
          material: 'Acero Cromado',
          origen: 'China',
          marca: 'Timken compatible',
        },
        active: true,
      },
      {
        id: ID.p11,
        categoryId: ID.catConicos,
        sku: '30207',
        name: 'Rodamiento Cónico 30207',
        description: 'Rodamiento cónico liviano. Ejes traseros de vehículos livianos y cajas de cambio.',
        specs: {
          diametro_interior: '35mm',
          diametro_exterior: '72mm',
          ancho: '18.25mm',
          angulo_contacto: '14.04°',
          carga_dinamica: '54.0 kN',
          carga_estatica: '55.0 kN',
          velocidad_limite: '7000 rpm',
          material: 'Acero Cromado',
          origen: 'China',
        },
        active: true,
      },
      {
        id: ID.p12,
        categoryId: ID.catConicos,
        sku: '32305-B',
        name: 'Rodamiento Cónico 32305-B',
        description: 'Rodamiento cónico pesado ángulo grande. Cargas axiales y radiales combinadas.',
        specs: {
          diametro_interior: '25mm',
          diametro_exterior: '62mm',
          ancho: '25.25mm',
          angulo_contacto: '17.90°',
          carga_dinamica: '56.0 kN',
          carga_estatica: '57.0 kN',
          velocidad_limite: '8000 rpm',
          material: 'Acero Cromado',
          origen: 'Alemania',
          marca: 'FAG original',
        },
        active: true,
      },

      // — Rodamientos Agrícolas (3 products) —
      {
        id: ID.p13,
        categoryId: ID.catAgricolas,
        sku: 'UCF208',
        name: 'Unidad de Chumacera UCF208',
        description: 'Chumacera brida cuadrada con rodamiento UC208. Para ejes de maquinaria agrícola.',
        specs: {
          diametro_eje: '40mm',
          tipo_alojamiento: 'Brida cuadrada (F)',
          material_alojamiento: 'Hierro fundido',
          sello: 'Triple labio',
          lubricacion: 'Grasa NLGI 2',
          aplicacion: 'Sembradoras, cosechadoras, implementos',
          origen: 'China',
          marca: 'FYH compatible',
        },
        active: true,
      },
      {
        id: ID.p14,
        categoryId: ID.catAgricolas,
        sku: 'UCFL207',
        name: 'Unidad de Chumacera UCFL207',
        description: 'Chumacera brida ovalada. Para transportadores y sembradoras.',
        specs: {
          diametro_eje: '35mm',
          tipo_alojamiento: 'Brida ovalada (FL)',
          material_alojamiento: 'Hierro fundido',
          sello: 'Triple labio',
          lubricacion: 'Grasa NLGI 2',
          origen: 'China',
        },
        active: true,
      },
      {
        id: ID.p15,
        categoryId: ID.catAgricolas,
        sku: 'W208PPB6',
        name: 'Rodamiento Disco de Arado W208PPB6',
        description: 'Rodamiento de bola especial para discos de arado. Alta protección contra tierra y polvo.',
        specs: {
          diametro_interior: '36.5mm',
          diametro_exterior: '80mm',
          ancho: '42.9mm',
          tipo_sello: 'Caucho vulcanizado',
          aplicacion: 'Discos de arado, rastras',
          resistencia: 'IP68 equivalente',
          origen: 'China',
          marca: 'Peer compatible',
        },
        active: true,
      },

      // — Sellos y Retenes (3 products) —
      {
        id: ID.p16,
        categoryId: ID.catSellos,
        sku: 'SD-40-60-10',
        name: 'Reten de Aceite 40x60x10mm',
        description: 'Sello radial de eje simple labio NBR. Estanco a aceites y grasas.',
        specs: {
          diametro_eje: '40mm',
          diametro_externo: '60mm',
          ancho: '10mm',
          material: 'NBR (Nitrilo)',
          temperatura: '-40°C a +120°C',
          presion_max: '0.3 bar',
          origen: 'Brasil',
        },
        active: true,
      },
      {
        id: ID.p17,
        categoryId: ID.catSellos,
        sku: 'SD-50-72-10-FKM',
        name: 'Reten de Aceite 50x72x10mm FKM',
        description: 'Sello radial Viton (FKM) para alta temperatura. Aplicaciones de motor y turbo.',
        specs: {
          diametro_eje: '50mm',
          diametro_externo: '72mm',
          ancho: '10mm',
          material: 'FKM (Viton)',
          temperatura: '-20°C a +200°C',
          presion_max: '0.5 bar',
          origen: 'Alemania',
        },
        active: true,
      },

      // — Accesorios y Lubricantes (2 products) —
      {
        id: ID.p18,
        categoryId: ID.catAccesorios,
        sku: 'LGEP2-0.4',
        name: 'Grasa Rodamientos SKF LGEP2 400g',
        description: 'Grasa de EP para rodamientos bajo cargas extremas. NLGI 2.',
        specs: {
          clasificacion: 'NLGI 2',
          tipo: 'Jabón de litio con EP',
          temperatura: '-30°C a +110°C',
          contenido: '400g',
          aprobaciones: 'NSF H1, USDA',
          origen: 'Suecia',
        },
        active: true,
      },
      {
        id: ID.p19,
        categoryId: ID.catAccesorios,
        sku: 'SKF-TMFT36',
        name: 'Calentador de Rodamientos SKF TMFT36',
        description: 'Calentador inductivo de rodamientos hasta 36 kg. Montaje seguro sin dañar temple.',
        specs: {
          capacidad_max: '36 kg',
          temperatura_max: '230°C',
          corriente: '220V / 50Hz',
          automatico: true,
          demagnetizacion: 'Automática',
          origen: 'Suecia',
        },
        active: true,
      },
      {
        id: ID.p20,
        categoryId: ID.catAccesorios,
        sku: 'EXT-PULLER-3J',
        name: 'Extractor de Rodamientos 3 Garras Universal',
        description: 'Extractor mecánico 3 garras para desmontaje de rodamientos. Capacidad 5 ton.',
        specs: {
          garras: '3',
          capacidad: '5 toneladas',
          alcance_max: '150mm',
          material: 'Acero forjado',
          incluye: 'Juego de brazos intercambiables',
          origen: 'China',
        },
        active: true,
      },
    ])
    .onConflictDoNothing()

  console.log('✓ Seeded products (20)')
}

// ---------------------------------------------------------------------------
// 4. Clients
// ---------------------------------------------------------------------------
async function seedClients() {
  // Price lists must exist before assigning them — seeded in seedPriceLists()
  // This function is called AFTER seedPriceLists()
  await db
    .insert(clients)
    .values([
      {
        id: ID.client1,
        profileId: ID.clientProfile1,
        cuit: '30-71234567-8',
        razonSocial: 'Maquinarias del Sur S.A.',
        afipStatus: 'validated',
        afipCachedAt: new Date(),
        bcraStatus: 'clear',
        bcraCachedAt: new Date(),
        industry: 'Agrícola',
        validationPending: false,
        priceListId: ID.listaA,
      },
      {
        id: ID.client2,
        profileId: ID.clientProfile2,
        cuit: '30-68901234-5',
        razonSocial: 'Metalúrgica Rosario S.R.L.',
        afipStatus: 'validated',
        afipCachedAt: new Date(),
        bcraStatus: 'clear',
        bcraCachedAt: new Date(),
        industry: 'Industrial',
        validationPending: false,
        priceListId: ID.listaA,
      },
      {
        id: ID.client3,
        profileId: ID.clientProfile3,
        cuit: '30-59876543-2',
        razonSocial: 'Agro San Luis S.A.',
        afipStatus: 'validated',
        afipCachedAt: new Date(),
        bcraStatus: 'clear',
        bcraCachedAt: new Date(),
        industry: 'Agrícola',
        validationPending: false,
        priceListId: ID.listaB,
      },
      {
        id: ID.client4,
        profileId: ID.clientProfile4,
        cuit: '20-23456789-4',
        razonSocial: 'Talleres García e Hijos',
        afipStatus: 'validated',
        afipCachedAt: new Date(),
        bcraStatus: 'risk',
        bcraRiskLevel: 'con_seguimiento',
        bcraCachedAt: new Date(),
        industry: 'Automotriz',
        validationPending: false,
        priceListId: ID.listaB,
      },
      {
        id: ID.client5,
        profileId: ID.clientProfile5,
        cuit: '30-45678901-2',
        razonSocial: 'Distribuidora Córdoba S.R.L.',
        afipStatus: 'validated',
        afipCachedAt: new Date(),
        bcraStatus: 'risk',
        bcraRiskLevel: 'riesgo',
        bcraCachedAt: new Date(),
        industry: 'Industrial',
        validationPending: false,
        priceListId: ID.listaB,
      },
    ])
    .onConflictDoNothing()

  console.log('✓ Seeded clients (5)')
}

// ---------------------------------------------------------------------------
// 5. Price Lists + Rules
// ---------------------------------------------------------------------------
async function seedPriceLists() {
  await db
    .insert(priceLists)
    .values([
      {
        id: ID.listaA,
        name: 'Lista A — Clientes Preferenciales',
        description: 'Margen reducido para clientes con volumen y buen historial crediticio.',
        createdBy: ID.diego,
      },
      {
        id: ID.listaB,
        name: 'Lista B — Clientes Estándar',
        description: 'Margen estándar aplicado a clientes nuevos o sin historial suficiente.',
        createdBy: ID.diego,
      },
    ])
    .onConflictDoNothing()

  // Rules: one per category per list (margin applied to all products in that category)
  const categoryIds = [
    ID.catBolas,
    ID.catRodillos,
    ID.catConicos,
    ID.catAgricolas,
    ID.catSellos,
    ID.catAccesorios,
  ]

  const rulesA = categoryIds.map((catId) => ({
    priceListId: ID.listaA,
    categoryId: catId,
    marginPercent: '15.00',
  }))

  const rulesB = categoryIds.map((catId) => ({
    priceListId: ID.listaB,
    categoryId: catId,
    marginPercent: '25.00',
  }))

  await db
    .insert(priceListRules)
    .values([...rulesA, ...rulesB])
    .onConflictDoNothing()

  console.log('✓ Seeded price lists (2) + rules (12)')
}

// ---------------------------------------------------------------------------
// 6. Quotes (8) + Quote Items
// ---------------------------------------------------------------------------
async function seedQuotes() {
  const now = new Date()
  const approvedAt = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) // 3 days ago

  await db
    .insert(quotes)
    .values([
      // draft
      {
        id: ID.q1,
        clientId: ID.client1,
        salespersonId: ID.martin,
        status: 'draft',
        notes: 'Cotización inicial para repuesto de rodamientos de siembra.',
      },
      // draft
      {
        id: ID.q2,
        clientId: ID.client3,
        salespersonId: ID.sofia,
        status: 'draft',
        notes: 'Cliente pide presupuesto para recambio anual de chumaceras.',
      },
      // pending_approval
      {
        id: ID.q3,
        clientId: ID.client2,
        salespersonId: ID.martin,
        status: 'pending_approval',
        notes: 'Pedido urgente — falta de piezas en planta.',
      },
      // pending_approval
      {
        id: ID.q4,
        clientId: ID.client4,
        salespersonId: ID.sofia,
        status: 'pending_approval',
        notes: 'Cliente solicitó plazo de pago a 60 días — requiere aprobación.',
      },
      // approved
      {
        id: ID.q5,
        clientId: ID.client1,
        salespersonId: ID.martin,
        status: 'approved',
        approvedBy: ID.diego,
        approvedAt,
        notes: 'Aprobado. Listo para enviar.',
      },
      // approved
      {
        id: ID.q6,
        clientId: ID.client2,
        salespersonId: ID.sofia,
        status: 'approved',
        approvedBy: ID.laura,
        approvedAt,
        notes: 'Segunda cotización del ciclo anual. Aprobada sin cambios.',
      },
      // sent
      {
        id: ID.q7,
        clientId: ID.client3,
        salespersonId: ID.martin,
        status: 'sent',
        approvedBy: ID.diego,
        approvedAt,
        notes: 'Enviada por email el día de aprobación.',
      },
      // accepted
      {
        id: ID.q8,
        clientId: ID.client5,
        salespersonId: ID.sofia,
        status: 'accepted',
        approvedBy: ID.diego,
        approvedAt,
        notes: 'Cliente aceptó y confirmó orden de compra.',
      },
    ])
    .onConflictDoNothing()

  // Quote items — 2 to 4 items per quote
  await db
    .insert(quoteItems)
    .values([
      // Q1 — draft — client1 (Maquinarias del Sur, Lista A 15%)
      { quoteId: ID.q1, productId: ID.p13, quantity: 4, unitPrice: '4200.00', marginPercent: '15.00', subtotal: '16800.00' },
      { quoteId: ID.q1, productId: ID.p15, quantity: 2, unitPrice: '3800.00', marginPercent: '15.00', subtotal: '7600.00' },
      { quoteId: ID.q1, productId: ID.p01, quantity: 10, unitPrice: '1250.00', marginPercent: '15.00', subtotal: '12500.00' },

      // Q2 — draft — client3 (Agro San Luis, Lista B 25%)
      { quoteId: ID.q2, productId: ID.p14, quantity: 6, unitPrice: '3950.00', marginPercent: '25.00', subtotal: '23700.00' },
      { quoteId: ID.q2, productId: ID.p13, quantity: 2, unitPrice: '4200.00', marginPercent: '25.00', subtotal: '8400.00' },

      // Q3 — pending_approval — client2 (Metalúrgica Rosario, Lista A 15%)
      { quoteId: ID.q3, productId: ID.p07, quantity: 2, unitPrice: '8500.00', marginPercent: '15.00', subtotal: '17000.00' },
      { quoteId: ID.q3, productId: ID.p08, quantity: 1, unitPrice: '14200.00', marginPercent: '15.00', subtotal: '14200.00' },
      { quoteId: ID.q3, productId: ID.p18, quantity: 3, unitPrice: '2100.00', marginPercent: '15.00', subtotal: '6300.00' },

      // Q4 — pending_approval — client4 (Talleres García, Lista B 25%)
      { quoteId: ID.q4, productId: ID.p10, quantity: 4, unitPrice: '5800.00', marginPercent: '25.00', subtotal: '23200.00' },
      { quoteId: ID.q4, productId: ID.p11, quantity: 4, unitPrice: '3600.00', marginPercent: '25.00', subtotal: '14400.00' },
      { quoteId: ID.q4, productId: ID.p16, quantity: 8, unitPrice: '850.00', marginPercent: '25.00', subtotal: '6800.00' },
      { quoteId: ID.q4, productId: ID.p17, quantity: 4, unitPrice: '1900.00', marginPercent: '25.00', subtotal: '7600.00' },

      // Q5 — approved — client1 (Maquinarias del Sur, Lista A 15%)
      { quoteId: ID.q5, productId: ID.p01, quantity: 20, unitPrice: '1250.00', marginPercent: '15.00', subtotal: '25000.00' },
      { quoteId: ID.q5, productId: ID.p06, quantity: 5, unitPrice: '2800.00', marginPercent: '15.00', subtotal: '14000.00' },

      // Q6 — approved — client2 (Metalúrgica Rosario, Lista A 15%)
      { quoteId: ID.q6, productId: ID.p09, quantity: 2, unitPrice: '6700.00', marginPercent: '15.00', subtotal: '13400.00' },
      { quoteId: ID.q6, productId: ID.p07, quantity: 3, unitPrice: '8500.00', marginPercent: '15.00', subtotal: '25500.00' },
      { quoteId: ID.q6, productId: ID.p18, quantity: 2, unitPrice: '2100.00', marginPercent: '15.00', subtotal: '4200.00' },

      // Q7 — sent — client3 (Agro San Luis, Lista B 25%)
      { quoteId: ID.q7, productId: ID.p15, quantity: 4, unitPrice: '3800.00', marginPercent: '25.00', subtotal: '15200.00' },
      { quoteId: ID.q7, productId: ID.p14, quantity: 4, unitPrice: '3950.00', marginPercent: '25.00', subtotal: '15800.00' },

      // Q8 — accepted — client5 (Distribuidora Córdoba, Lista B 25%)
      { quoteId: ID.q8, productId: ID.p02, quantity: 15, unitPrice: '980.00', marginPercent: '25.00', subtotal: '14700.00' },
      { quoteId: ID.q8, productId: ID.p03, quantity: 10, unitPrice: '1450.00', marginPercent: '25.00', subtotal: '14500.00' },
      { quoteId: ID.q8, productId: ID.p04, quantity: 5, unitPrice: '3200.00', marginPercent: '25.00', subtotal: '16000.00' },
      { quoteId: ID.q8, productId: ID.p19, quantity: 1, unitPrice: '12800.00', marginPercent: '25.00', subtotal: '12800.00' },
    ])
    .onConflictDoNothing()

  console.log('✓ Seeded quotes (8) + quote items (22)')
}

// ---------------------------------------------------------------------------
// 7. Client Scores
// ---------------------------------------------------------------------------
async function seedClientScores() {
  const configSnapshot = { volume: 40, frequency: 30, payment: 30 }

  await db
    .insert(clientScores)
    .values([
      // Maquinarias del Sur — excelente cliente
      {
        clientId: ID.client1,
        score: '4.80',
        calculatedAt: new Date(),
        scoringConfigSnapshot: configSnapshot,
      },
      // Metalúrgica Rosario — muy bueno
      {
        clientId: ID.client2,
        score: '4.20',
        calculatedAt: new Date(),
        scoringConfigSnapshot: configSnapshot,
      },
      // Agro San Luis — bueno
      {
        clientId: ID.client3,
        score: '3.50',
        calculatedAt: new Date(),
        scoringConfigSnapshot: configSnapshot,
      },
      // Talleres García — con seguimiento BCRA
      {
        clientId: ID.client4,
        score: '2.10',
        calculatedAt: new Date(),
        scoringConfigSnapshot: configSnapshot,
      },
      // Distribuidora Córdoba — riesgo crediticio
      {
        clientId: ID.client5,
        score: '1.50',
        calculatedAt: new Date(),
        scoringConfigSnapshot: configSnapshot,
      },
    ])
    .onConflictDoNothing()

  console.log('✓ Seeded client scores (5)')
}

// ---------------------------------------------------------------------------
// 8. Scoring Config (idempotent — same as scoring-config.ts seed)
// ---------------------------------------------------------------------------
async function seedScoringConfig() {
  await db
    .insert(scoringConfig)
    .values([
      { factor: 'volume', weight: 40, enabled: true },
      { factor: 'frequency', weight: 30, enabled: true },
      { factor: 'payment', weight: 30, enabled: true },
    ])
    .onConflictDoNothing()

  console.log('✓ Seeded scoring config (volume 40 / frequency 30 / payment 30)')
}

// ---------------------------------------------------------------------------
// 9. App Config
// ---------------------------------------------------------------------------
async function seedAppConfig() {
  await db
    .insert(appConfig)
    .values([
      {
        key: 'no_purchase_threshold_days',
        value: 60,
        updatedBy: ID.diego,
      },
      {
        key: 'afip_cache_ttl_hours',
        value: 24,
        updatedBy: ID.diego,
      },
      {
        key: 'bcra_cache_ttl_hours',
        value: 24,
        updatedBy: ID.diego,
      },
    ])
    .onConflictDoNothing()

  console.log('✓ Seeded app config (3 keys)')
}

// ---------------------------------------------------------------------------
// 10. Interest Lists
// ---------------------------------------------------------------------------
async function seedInterestLists() {
  await db
    .insert(interestLists)
    .values([
      {
        id: ID.il1,
        clientId: ID.client1,
        name: 'Repuestos Temporada 2025',
      },
      {
        id: ID.il2,
        clientId: ID.client3,
        name: 'Rodamientos Agrícolas — Campaña',
      },
    ])
    .onConflictDoNothing()

  await db
    .insert(interestListItems)
    .values([
      // Maquinarias del Sur — 3 products
      { interestListId: ID.il1, productId: ID.p13, quantity: 8, notes: 'Chumaceras para eje de siembra' },
      { interestListId: ID.il1, productId: ID.p15, quantity: 4, notes: 'Discos de arado — recambio anual' },
      { interestListId: ID.il1, productId: ID.p01, quantity: 20, notes: 'Rodamientos generales para taller' },

      // Agro San Luis — 2 products
      { interestListId: ID.il2, productId: ID.p14, quantity: 6, notes: 'Repuesto estándar de cosechadora' },
      { interestListId: ID.il2, productId: ID.p15, quantity: 6, notes: 'Para rastras nuevas de la campaña' },
    ])
    .onConflictDoNothing()

  console.log('✓ Seeded interest lists (2) + items (5)')
}

// ---------------------------------------------------------------------------
// 11. No-Purchase Alerts
// ---------------------------------------------------------------------------
async function seedNoPurchaseAlerts() {
  // Talleres García — último rodamiento comprado hace 75 días
  const lastPurchase = new Date()
  lastPurchase.setDate(lastPurchase.getDate() - 75)

  await db
    .insert(noPurchaseAlerts)
    .values([
      {
        clientId: ID.client4,
        lastPurchaseAt: lastPurchase,
        daysSincePurchase: 75,
        thresholdDays: 60,
        status: 'pending',
      },
    ])
    .onConflictDoNothing()

  console.log('✓ Seeded no-purchase alerts (1)')
}

// ---------------------------------------------------------------------------
// 12. Voice Consultations (3)
// ---------------------------------------------------------------------------
async function seedVoiceConsultations() {
  await db
    .insert(voiceConsultations)
    .values([
      // pending — client1 — Maquinarias del Sur
      {
        clientId: ID.client1,
        recipientRole: 'vendedor',
        transcript:
          'Hola, soy Carlos de Maquinarias del Sur. Necesito saber si tienen disponible el rodamiento 6205-2RS ' +
          'en cantidad de cincuenta unidades. También me interesa saber si tienen el UCF208 para eje de cuarenta. ' +
          'Si hay stock me van a avisar porque es para una entrega de la próxima semana.',
        audioUrl: null,
        status: 'pending',
        assignedTo: ID.martin,
      },
      // pending — client3 — Agro San Luis
      {
        clientId: ID.client3,
        recipientRole: 'vendedor',
        transcript:
          'Buenos días, llamo de Agro San Luis. Precisamos cotización para rodamientos de disco de arado, ' +
          'el W208PPB6. Son diez unidades para reponer antes de que empiece la siembra. ' +
          'Además quería consultar si manejan grasa EP en envases de medio kilo, para repuesto de nuestro taller.',
        audioUrl: null,
        status: 'pending',
        assignedTo: ID.sofia,
      },
      // resolved — client2 — Metalúrgica Rosario
      {
        clientId: ID.client2,
        recipientRole: 'admin_general',
        transcript:
          'Hola, Patricia de Metalúrgica Rosario. Les consulto si el rodamiento cilíndrico NU208 ECP ' +
          'que compramos el mes pasado tiene garantía de proveedor. Tuvimos uno que falló a los quince días ' +
          'de uso en el torno. Necesitamos saber el proceso para la devolución o el reemplazo.',
        audioUrl: null,
        status: 'resolved',
        assignedTo: ID.diego,
      },
    ])
    .onConflictDoNothing()

  console.log('✓ Seeded voice consultations (3)')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('\n🌱 Starting mock data seed — seekingbusiness-crm\n')

  await seedProfiles()
  await seedCategories()
  await seedProducts()
  await seedPriceLists()
  await seedClients()       // needs price lists to exist first
  await seedQuotes()
  await seedClientScores()
  await seedScoringConfig()
  await seedAppConfig()
  await seedInterestLists()
  await seedNoPurchaseAlerts()
  await seedVoiceConsultations()

  console.log('\n✅ Mock data seed complete!')
  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
