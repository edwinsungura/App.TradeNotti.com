import { SignUp } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <SignUp signInUrl="/login" fallbackRedirectUrl="/today" />
    </div>
  );
}
