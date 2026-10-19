import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kavita's Artistry",
    short_name: "Kavita's",
    description: "Handmade art & craft — order on WhatsApp",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf7ef",
    theme_color: "#16244a",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
