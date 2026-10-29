import type { Metadata } from "next";
import { LoginScreen } from "@/features/auth/components/LoginScreen";

export const metadata: Metadata = {
  title: "Log in · Export Marketplace",
  description: "Sign in to your Export Marketplace account.",
};

export default function LoginPage() {
  return <LoginScreen />;
}
