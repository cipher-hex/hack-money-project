import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./index.html",
    "./src/components/safe-pay/ClaimTransfer.tsx",
    "./src/components/safe-pay/SendTransfer.tsx",
    "./src/components/safe-pay/TransactionHistory.tsx",
    "./src/components/safe-pay/RegisterUsername.tsx",
    "./src/components/safe-pay/Navbar.tsx",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#10B981", // Neon green
        secondary: "#1F2937",
        background: "#111827",
      },
    },
  },
  plugins: [],
};
export default config;
