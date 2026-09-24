import { howItWorksSteps } from "@/data/public";

// 3-step "How it works" explainer: Search -> Quote -> Export Delivered.
export default function HowItWorksSection() {
  return (
    <section className="w-full px-4 py-10 sm:px-6 bg-panel">
      <h2 className="font-heading font-bold text-ink text-[22px] text-center mb-8">
        How It Works
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-[860px] mx-auto">
        {howItWorksSteps.map((item) => (
          <div key={item.id} className="flex flex-col items-center text-center gap-2">
            <span className="font-heading font-bold text-saffron text-[13px] bg-saffron-soft rounded px-3 py-1">
              {item.step}
            </span>
            <p className="font-heading font-semibold text-ink text-[16px] mt-1">
              {item.title}
            </p>
            <p className="font-body text-text-dim text-[13px]">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
