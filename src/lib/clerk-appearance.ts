// TradeNotti-branded Clerk theme: clean white card, dark primary button (matches
// the app's CTAs), purple accent for links/focus, Inter type. Social buttons and
// the Clerk badge are additionally hidden via globals.css.
export const clerkAppearance = {
  variables: {
    colorPrimary: "#6f61f5", // indigo accent — buttons, links, focus
    colorText: "#f3f4f8",
    colorTextSecondary: "#9298a7",
    colorBackground: "#14161f",
    colorInputBackground: "#1a1d29",
    colorInputText: "#f3f4f8",
    colorDanger: "#f87171",
    colorNeutral: "#f3f4f8",
    borderRadius: "0.7rem",
    fontFamily: "var(--font-sans), system-ui, sans-serif",
    fontSize: "0.95rem",
  },
  elements: {
    rootBox: "w-full",
    card: "shadow-2xl shadow-accent/10 ring-1 ring-accent/10 border border-accent/10 rounded-2xl bg-surface px-8 py-7 backdrop-blur",
    headerTitle: "text-ink font-bold tracking-tight text-xl",
    headerSubtitle: "text-muted",
    formButtonPrimary:
      "bg-gradient-to-r from-accent to-[#7b6bf9] text-white hover:opacity-90 transition-opacity normal-case font-semibold text-[14px] shadow-lg shadow-accent/25",
    formFieldLabel: "text-ink-soft font-medium",
    formFieldInput:
      "border-line bg-surface text-ink focus:border-accent focus:ring-2 focus:ring-accent/20",
    footerActionText: "text-faint",
    footerActionLink: "text-accent hover:text-accent font-semibold",
    identityPreviewEditButton: "text-accent",
    formResendCodeLink: "text-accent hover:text-accent",
    otpCodeFieldInput: "border-line focus:border-accent",
  },
};
