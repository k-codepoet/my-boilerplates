import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: "GameGlue",
    },
    links: [
      { text: "Play", url: "/play" },
    ],
    // TODO: Re-enable when fumadocs docs route works in SPA mode
    searchToggle: { enabled: false },
  };
}
