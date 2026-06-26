import { SignIn } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <SignIn signUpUrl="/signup" fallbackRedirectUrl="/today" />
    </div>
  );
}
