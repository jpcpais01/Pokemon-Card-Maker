import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PokeGen",
    short_name: "PokeGen",
    description: "Open a pack and generate one-of-a-kind AI Pokemon TCG artwork.",
    start_url: "/",
    display: "standalone",
    background_color: "#05060f",
    theme_color: "#05060f",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Separate art for `maskable`: launchers crop these to their own shape (circle,
      // squircle, ...), so this one keeps the mark inside the safe zone with a pastel
      // bleed behind it instead of losing Pikachu's ears to the crop.
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
