import SignupForm from "@/components/auth/SignupForm";

export const metadata = { title: "Sign Up | ExportHub" };

// Public signup route — same centered-card pattern as /login and
// /sell-with-us (own container, no vendor sidebar shell).
export default function SignupPage() {
  return (
    <main className="w-full flex-1 bg-paper px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-md">
        <div className="bg-panel border border-line rounded px-5 py-6 sm:px-8 sm:py-8">
          <SignupForm />
        </div>
      </div>
    </main>
  );
}
