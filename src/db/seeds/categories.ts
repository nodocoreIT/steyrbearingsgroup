import { db } from '@/db'
import { categories } from '@/db/schema'

const data = [
  { name: 'Rodamiento de Ruedas',    slug: 'rodamiento-de-ruedas',    sortOrder: 1 },
  { name: 'Rodamientos de Cajas',    slug: 'rodamientos-de-cajas',    sortOrder: 2 },
  { name: 'Rodamientos Diferencial', slug: 'rodamientos-diferencial', sortOrder: 3 },
  { name: 'Rodamientos Agrícolas',   slug: 'rodamientos-agricolas',   sortOrder: 4 },
  { name: 'Rodamiento de Usos',      slug: 'rodamiento-de-usos',      sortOrder: 5 },
  { name: 'Crapodinas de Embrague',  slug: 'crapodinas-de-embrague',  sortOrder: 6 },
]

async function seed() {
  for (const cat of data) {
    await db
      .insert(categories)
      .values(cat)
      .onConflictDoNothing()
  }
  console.log('Categorías insertadas.')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
