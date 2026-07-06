'use client'

import Image from 'next/image'

const brands = [
  { name: 'EBI',    src: '/marcas/ebi.png'    },
  { name: 'FAG',    src: '/marcas/faag.jpeg'  },
  { name: 'Fersa',  src: '/marcas/fersa.png'  },
  { name: 'INA',    src: '/marcas/inaa.png'   },
  { name: 'KG',     src: '/marcas/kg.jpeg'    },
  { name: 'Koyo',   src: '/marcas/koyo.jpg'   },
  { name: 'NTN',    src: '/marcas/ntn.png'    },
  { name: 'SKF',    src: '/marcas/skf.png'    },
  { name: 'Timken', src: '/marcas/timken.jpeg'},
  { name: 'ZNL',    src: '/marcas/znl.webp'   },
]

export function BrandsMarquee() {
  const doubled = [...brands, ...brands]

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Marcas que trabajamos</h2>
    <section className="border-t border-b py-6 overflow-hidden">
      <div className="relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div
          className="flex items-center gap-10 animate-marquee"
          style={{ animationDuration: '28s' }}
        >
          {doubled.map((brand, i) => (
            <div
              key={i}
              className="shrink-0 flex items-center justify-center bg-white rounded-lg border w-36 h-20 px-3 py-2"
            >
              <Image
                src={brand.src}
                alt={brand.name}
                width={120}
                height={64}
                className="object-contain w-full h-full"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
    </div>
  )
}
