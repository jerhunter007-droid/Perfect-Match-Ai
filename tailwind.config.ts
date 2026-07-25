import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#0B0E1F",
        surface: "#141833",
        raised: "#1C2145",
        line: "#2B3162",
        bone: "#EDEDF5",
        muted: "#8C90BB",
        cyan: "#FF2EC4",
        cyanDim: "#8A1E72",
        red: "#E5637A",
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
        serif: ["Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
