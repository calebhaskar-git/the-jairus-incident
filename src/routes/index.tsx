import { createFileRoute } from "@tanstack/react-router";

import { Experience } from "@/components/jairus/experience";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jairus.exe | Birthday Chaos" },
      { name: "description", content: "An interactive birthday scrapbook and affectionate roast for Jairus Melchiah — the bunny of the group." },
      { property: "og:title", content: "Jairus.exe | Birthday Chaos" },
      { property: "og:description", content: "Enter at your own risk. A chaotic birthday scrapbook for Jairus, from the group chat." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Experience,
});
