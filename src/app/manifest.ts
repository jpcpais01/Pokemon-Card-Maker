import type { MetadataRoute } from "next";

/**
 * Bump whenever the icon artwork changes.
 *
 * An installed Android app doesn't re-read these files - Chrome baked them into a
 * WebAPK at install time, and it only rebuilds that when it notices the *manifest*
 * changed. Replacing the bytes behind an unchanged URL is exactly the case it can
 * miss, so the version is what actually makes a new icon reach an existing install.
 * (iOS is a lost cause either way: Safari snapshots the icon when you add the app to
 * the home screen and never looks again.)
 */
const ICON_VERSION = "2";

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
      { src: `/icon-192.png?v=${ICON_VERSION}`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `/icon-512.png?v=${ICON_VERSION}`, sizes: "512x512", type: "image/png", purpose: "any" },
      // Separate art for `maskable`: launchers crop these to their own shape (circle,
      // squircle, ...), so this one keeps the mark inside the safe zone with a pastel
      // bleed behind it instead of losing Pikachu's ears to the crop.
      {
        src: `/icon-maskable-512.png?v=${ICON_VERSION}`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
