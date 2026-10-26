type HeroVariant = "services" | "products" | "projects" | "contact" | "about" | "factory"

const heroImages: Record<HeroVariant, string> = {
  services: "/images/heroes/services-hero.jpg",
  products: "/images/heroes/products-hero.jpg",
  projects: "/images/heroes/projects-hero.jpg",
  contact: "/images/heroes/contact-hero.jpg",
  about: "/images/heroes/about-hero.jpg",
  factory: "/images/heroes/services-hero.jpg",
}

export function PageHero({ eyebrow, title, description, variant = "factory" }: { eyebrow: string; title: string; description: string; variant?: HeroVariant }) {
  return <section className="industrial-hero text-white">
    <img className="industrial-hero__image" src={heroImages[variant]} alt="" fetchPriority="high" />
    <div className="industrial-hero__shade"/>
    <div className="container-page relative z-10 flex min-h-[22rem] items-end py-12 lg:min-h-[26rem] lg:py-16">
      <div className="max-w-[760px]"><p className="text-sm font-semibold text-orange-300">{eyebrow}</p><h1 className="heading-hero mt-3 max-w-3xl">{title}</h1><p className="mt-4 max-w-2xl text-base leading-7 text-emerald-50/80 sm:text-lg">{description}</p></div>
    </div>
  </section>
}
