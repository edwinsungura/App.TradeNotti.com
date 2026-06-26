import { SignIn } from "@clerk/nextjs";
import Logo from "@/components/Logo";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-canvas px-4 py-10">
      <Logo />
      <SignIn signUpUrl="/signup" fallbackRedirectUrl="/today" />
    </div>
  );
}
