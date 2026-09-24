import Panel from "@/components/ui/Panel";
import { testimonials } from "@/data/public";

// Buyer testimonials, three-up on desktop.
export default function TestimonialsSection() {
  return (
    <section className="w-full px-4 py-10 sm:px-6">
      <h2 className="font-heading font-bold text-ink text-[22px] mb-4">
        What Buyers Say
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {testimonials.map((testimonial) => (
          <Panel key={testimonial.id} bodyClassName="p-4 flex flex-col gap-3">
            <p className="font-body text-text text-[13px] leading-[1.5]">
              &ldquo;{testimonial.quote}&rdquo;
            </p>
            <div>
              <p className="font-heading font-semibold text-ink text-[13px]">
                {testimonial.author}
              </p>
              <p className="font-body text-text-dim text-[12px]">{testimonial.role}</p>
            </div>
          </Panel>
        ))}
      </div>
    </section>
  );
}
