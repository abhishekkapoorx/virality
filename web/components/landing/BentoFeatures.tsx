import { CORE_FEATURES } from "@/lib/landingFeatures";

const layout: Record<string, string> = {
  tall: "md:col-span-1 md:row-span-2",
  wide: "md:col-span-2 md:row-span-1",
  square: "md:col-span-1 md:row-span-1"
};

export function BentoFeatures() {
  return (
    <section id="features" className="scroll-mt-24 px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
            Built for how you actually ship content
          </h2>
          <p className="mt-4 text-base leading-relaxed text-stone-600">
            What you get as a busy leader who still wants a credible LinkedIn
            presence. Scheduling is covered in the next section.
          </p>
        </div>

        <ul className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-3 md:auto-rows-fr">
          {CORE_FEATURES.map((feature) => (
            <li
              key={feature.id}
              className={`group flex flex-col justify-between rounded-3xl border border-stone-200/90 bg-white/75 p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-lg ${layout[feature.size]}`}
            >
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-stone-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  {feature.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
