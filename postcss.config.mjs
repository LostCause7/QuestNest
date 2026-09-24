import safariSafeCss from "./lib/safari-safe-css.mjs";

const config = {
  plugins: ["@tailwindcss/postcss", safariSafeCss],
};

export default config;
