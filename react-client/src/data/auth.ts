// Copy for the login page. No credentials or seeded accounts live here —
// there is no auth API wired up yet (see components/auth/LoginForm.tsx),
// so this file only holds display strings, mirroring how data/sellWithUs.ts
// holds copy/config rather than submission data for that flow.
export interface LoginMeta {
  heading: string;
  subheading: string;
  googleDividerLabel: string;
  genericAuthError: string;
}

export const loginMeta: LoginMeta = {
  heading: "Log in to ExportHub",
  subheading: "Sign in to manage your vendor account or continue buying.",
  googleDividerLabel: "or continue with",
  genericAuthError: "Incorrect email or password. Please try again.",
};

export interface SignupMeta {
  heading: string;
  subheading: string;
  googleDividerLabel: string;
  genericAuthError: string;
  emailTakenError: string;
  verificationNotice: string;
}

export const signupMeta: SignupMeta = {
  heading: "Create your ExportHub account",
  subheading: "Sign up to buy from verified export suppliers worldwide.",
  googleDividerLabel: "or continue with",
  genericAuthError: "We couldn't create your account. Please try again.",
  emailTakenError: "An account with this email already exists.",
  verificationNotice: "We've sent a verification link to your email.",
};
