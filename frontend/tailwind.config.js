/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg:             "var(--color-bg)",
        surface:        "var(--color-surface)",
        "surface-raised": "var(--color-surface-raised)",
        border:         "var(--color-border)",
        "border-subtle":"var(--color-border-subtle)",
        ink:            "var(--color-ink)",
        "ink-muted":    "var(--color-ink-muted)",
        "ink-faint":    "var(--color-ink-faint)",
        primary:        "var(--color-primary)",
        "primary-hover":"var(--color-primary-hover)",
        "primary-subtle":"var(--color-primary-subtle)",
        "primary-text": "var(--color-primary-text)",
        accent:         "var(--color-accent)",
        "accent-subtle":"var(--color-accent-subtle)",
        unpaid:         "var(--color-unpaid)",
        "unpaid-bg":    "var(--color-unpaid-bg)",
        partial:        "var(--color-partial)",
        "partial-bg":   "var(--color-partial-bg)",
        paid:           "var(--color-paid)",
        "paid-bg":      "var(--color-paid-bg)",
        danger:         "var(--color-danger)",
        "danger-bg":    "var(--color-danger-bg)",
      },
      fontFamily: {
        body: "var(--font-body)",
      },
      borderRadius: {
        sm:   "var(--radius-sm)",
        md:   "var(--radius-md)",
        lg:   "var(--radius-lg)",
        full: "var(--radius-full)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      spacing: {
        "safe-bottom": "env(safe-area-inset-bottom)",
      },
      transitionDuration: {
        fast:   "var(--duration-fast)",
        normal: "var(--duration-normal)",
        slow:   "var(--duration-slow)",
      },
    },
  },
  plugins: [],
}
