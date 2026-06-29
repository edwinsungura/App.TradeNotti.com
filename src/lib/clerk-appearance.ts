// TradeNotti-branded Clerk theme: clean white card, dark primary button (matches
// the app's CTAs), purple accent for links/focus, Inter type. Social buttons and
// the Clerk badge are additionally hidden via globals.css.
export const clerkAppearance = {
  variables: {
    colorPrimary: "#0e0f13", // ink — primary button
    colorText: "#0e0f13",
    colorTextSecondary: "#474e5c",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorInputText: "#0e0f13",
    colorDanger: "#e23b3b",
    borderRadius: "0.7rem",
    fontFamily: "var(--font-sans), system-ui, sans-serif",
    fontSize: "0.95rem",
  },
  elements: {
    rootBox: "w-full",
    card: "shadow-xl shadow-black/[0.06] border border-line rounded-2xl bg-surface px-8 py-7",
    headerTitle: "text-ink font-bold tracking-tight text-xl",
    headerSubtitle: "text-muted",
    formButtonPrimary:
      "bg-ink text-white hover:opacity-90 transition-opacity normal-case font-semibold text-[14px] shadow-none",
    formFieldLabel: "text-ink-soft font-medium",
    formFieldInput:
      "border-line bg-surface text-ink focus:border-accent focus:ring-2 focus:ring-accent/15",
    footerActionText: "text-faint",
    footerActionLink: "text-accent hover:text-accent font-semibold",
    identityPreviewEditButton: "text-accent",
    formResendCodeLink: "text-accent hover:text-accent",
    otpCodeFieldInput: "border-line focus:border-accent",
  },
};
