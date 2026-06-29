import { SignUp } from "@clerk/nextjs";
import Logo from "@/components/Logo";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-8 overflow-hidden bg-canvas px-4 py-10">
      {/* soft brand glow behind the card */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl"
        aria-hidden
      />
      <div className="relative flex flex-col items-center gap-3">
        <Logo />
        <p className="text-sm text-muted">Your voice-first trading journal.</p>
      </div>
      <div className="relative">
        <SignUp signInUrl="/login" fallbackRedirectUrl="/today" />
      </div>
    </div>
  );
}
