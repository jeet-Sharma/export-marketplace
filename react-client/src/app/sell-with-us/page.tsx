import SellWithUsWizard from "@/components/sellWithUs/SellWithUsWizard";

export const metadata = { title: "Sell With Us | ExportHub" };

// Public vendor signup route — intentionally outside /vendor since the
// applicant isn't a vendor yet. Own centered container instead of the
// vendor sidebar shell.
export default function SellWithUsPage() {
  return (
    <main className="w-full flex-1 bg-paper px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-2xl">
        <SellWithUsWizard />
      </div>
    </main>
  );
}
