import type { Metadata } from "next";
import { LoginScreen } from "@/features/auth/components/LoginScreen";

export const metadata: Metadata = {
  title: "Log in · Looma Market Bloom",
  description: "Sign in to your Looma Market Bloom account.",
};

export default function LoginPage() {
  return <LoginScreen />;
}
