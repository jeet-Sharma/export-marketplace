import LoginForm from "@/components/auth/LoginForm";

export const metadata = { title: "Log In | ExportHub" };

// Public login route — same centered-card pattern as /sell-with-us
// (own container, no vendor sidebar shell, since the visitor isn't
// authenticated yett).
export default function LoginPage() {
  return (
    <main className="w-full flex-1 bg-paper px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-md">
        <div className="bg-panel border border-line rounded px-5 py-6 sm:px-8 sm:py-8">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
