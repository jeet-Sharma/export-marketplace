import { appBrand } from "@/config/navigation";

// Public site footer: contact channels and feedback link, per the spec
// (Footer: contact us via whatsapp/phone/email, feedback/suggestion).
export default function PublicFooter() {
  return (
    <footer className="bg-ink">
      <div className="w-full px-4 py-8 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div>
            <p className="font-heading font-bold text-panel text-[16px]">{appBrand.name}</p>
            <p className="font-body text-blue-grey-soft text-[12px] mt-2 max-w-[320px]">
              Connecting Indian exporters with verified buyers worldwide.
            </p>
          </div>

          <div>
            <p className="font-heading font-semibold text-panel text-[13px] mb-2">
              Contact Us
            </p>
            <ul className="font-body text-blue-grey-soft text-[12px] flex flex-col gap-1">
              <li>WhatsApp: +91 98765 43210</li>
              <li>Phone: +91 22 4000 1234</li>
              <li>Email: support@exporthub.example</li>
            </ul>
          </div>

          <div>
            <p className="font-heading font-semibold text-panel text-[13px] mb-2">
              Feedback
            </p>
            <p className="font-body text-blue-grey-soft text-[12px] max-w-[240px]">
              Have a suggestion? Write to feedback@exporthub.example
            </p>
          </div>
        </div>

        <div className="border-t border-blue-grey mt-6 pt-4">
          <p className="font-body text-blue-grey-soft text-[11px]">
            {"\u00A9"} {new Date().getFullYear()} {appBrand.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
