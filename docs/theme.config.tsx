import React from "react";
import type { DocsThemeConfig } from "nextra-theme-docs";

const config: DocsThemeConfig = {
  logo: <span style={{ fontWeight: 700, letterSpacing: "0.01em" }}>HardStop Docs</span>,
  project: {
    link: "https://github.com",
  },
  docsRepositoryBase: "https://github.com/example/market-context/tree/main/docs",
  footer: {
    text: `HardStop Docs • ${new Date().getFullYear()}`,
  },
  useNextSeoProps() {
    return {
      titleTemplate: "%s – HardStop Docs",
    };
  },
};

export default config;
