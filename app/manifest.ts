import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ChoreHall",
    short_name: "ChoreHall",
    description: "Chores become quests. Kids actually want to do.",
    start_url: "/kids",
    display: "standalone",
    background_color: "#f8f7fc",
    theme_color: "#5b3fd1",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
