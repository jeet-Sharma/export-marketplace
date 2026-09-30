import EmailVerification from "@/components/public/EmailVerification";

export const metadata = { title: "Email Verification | ExportHub" };

// Public verify-email route — same card pattern (colors, typography,
// border, radius) as /login and /signup, but centered vertically as well
// as horizontally: unlike the login/signup forms, this screen's content
// is short, so top-aligned padding alone would leave it looking stranded
// near the top of a tall viewport. The card itself is also given more
// generous padding so it reads as a deliberate, spacious confirmation
// screen rather than a cramped alert.
export default function VerifyEmailPage() {
  return (
    <main className="w-full flex-1 min-h-screen bg-paper px-4 py-10 sm:px-6 flex items-center justify-center">
      <div className="mx-auto w-full max-w-lg">
        <div className="bg-panel border border-line rounded px-6 py-12 sm:px-14 sm:py-20">
          <EmailVerification />
        </div>
      </div>
    </main>
  );
}
