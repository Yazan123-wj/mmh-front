export type ArtworkKind = "generic-identification" | "name-only-tile";

export interface CatalogArtworkSource {
  productId: string;
  kind: ArtworkKind;
  background: string;
  invertLogo?: boolean;
  title: string;
  alt: string;
  /** Wikimedia Commons file page. A URL is not by itself a reuse grant. */
  sourcePageUrl?: string;
  sourceUrl?: string;
  license?: string;
  permissionNote: string;
  denominationSpecific: false;
}

const TRADEMARK_NOTE =
  "Wikimedia Commons lists this file as public-domain text or shape. The depicted mark remains a trademark of its owner. MMH stores a copy only as nominative identification on a solid-color tile. This is not official gift-card photography, not denomination-specific, and is not an endorsement. A source URL is not proof of a commercial license.";

const NAME_ONLY_NOTE =
  "MMH-original identification tile. No permitted official card photograph or public-domain wordmark was available for this SKU. The tile is not a replica of branded card artwork and must not be described as official packaging.";

function commons(file: string, uploadPath: string): Pick<CatalogArtworkSource, "sourcePageUrl" | "sourceUrl" | "license"> {
  return {
    sourcePageUrl: `https://commons.wikimedia.org/wiki/File:${file}`,
    sourceUrl: `https://upload.wikimedia.org/wikipedia/commons/${uploadPath}`,
    license: "Public domain (PD-textlogo / PD-shape); trademarked",
  };
}

export const CATALOG_ARTWORK: CatalogArtworkSource[] = [
  {
    productId: "psn-store",
    kind: "generic-identification",
    background: "#17182B",
    invertLogo: true,
    title: "PlayStation",
    alt: "PlayStation identification mark for PlayStation Store wallet codes. Generic brand artwork, not a face-value card photo.",
    ...commons("PlayStation_logo.svg", "0/00/PlayStation_logo.svg"),
    permissionNote: TRADEMARK_NOTE,
    denominationSpecific: false,
  },
  {
    productId: "ps-plus",
    kind: "generic-identification",
    background: "#17182B",
    invertLogo: true,
    title: "PlayStation",
    alt: "PlayStation identification mark for PlayStation Plus membership codes. Generic brand artwork, not a plan-specific card photo.",
    ...commons("PlayStation_logo.svg", "0/00/PlayStation_logo.svg"),
    permissionNote: TRADEMARK_NOTE,
    denominationSpecific: false,
  },
  {
    productId: "steam-wallet",
    kind: "generic-identification",
    background: "#17182B",
    invertLogo: false,
    title: "Steam",
    alt: "Steam identification mark for Steam Wallet codes. Generic brand artwork, not a face-value card photo.",
    ...commons("Steam_icon_logo.svg", "8/83/Steam_icon_logo.svg"),
    permissionNote: `${TRADEMARK_NOTE} Valve asks that the Steam mark stand alone on a solid field; this tile adds no extra words or objects on the mark.`,
    denominationSpecific: false,
  },
  {
    productId: "xbox-gift",
    kind: "generic-identification",
    background: "#17182B",
    invertLogo: false,
    title: "Xbox",
    alt: "Xbox identification mark for Xbox gift-card codes. Generic brand artwork, not a face-value card photo.",
    ...commons("Xbox_one_logo.svg", "f/f9/Xbox_one_logo.svg"),
    permissionNote: TRADEMARK_NOTE,
    denominationSpecific: false,
  },
  {
    productId: "nintendo-eshop",
    kind: "generic-identification",
    background: "#17182B",
    invertLogo: false,
    title: "Nintendo",
    alt: "Nintendo identification mark for Nintendo eShop codes. Generic brand artwork, not a face-value card photo.",
    ...commons("Nintendo.svg", "0/0d/Nintendo.svg"),
    permissionNote: TRADEMARK_NOTE,
    denominationSpecific: false,
  },
  {
    productId: "apple-gift",
    kind: "generic-identification",
    background: "#F7F9FF",
    invertLogo: false,
    title: "Apple",
    alt: "Apple identification mark for Apple Gift Card codes. Generic brand artwork, not a face-value card photo.",
    ...commons("Apple_logo_black.svg", "f/fa/Apple_logo_black.svg"),
    permissionNote: TRADEMARK_NOTE,
    denominationSpecific: false,
  },
  {
    productId: "google-play",
    kind: "generic-identification",
    background: "#17182B",
    invertLogo: false,
    title: "Google Play",
    alt: "Google Play identification mark for Google Play gift-card codes. Generic brand artwork, not a face-value card photo.",
    ...commons("Google_Play_2022_icon.svg", "2/2f/Google_Play_2022_icon.svg"),
    permissionNote: TRADEMARK_NOTE,
    denominationSpecific: false,
  },
  {
    productId: "razer-gold",
    kind: "generic-identification",
    background: "#17182B",
    invertLogo: false,
    title: "Razer",
    alt: "Razer identification mark for Razer Gold PIN codes. Generic brand artwork, not a face-value card photo.",
    ...commons("Razer_wordmark.svg", "5/52/Razer_wordmark.svg"),
    permissionNote: TRADEMARK_NOTE,
    denominationSpecific: false,
  },
  {
    productId: "roblox-card",
    kind: "generic-identification",
    background: "#17182B",
    invertLogo: true,
    title: "Roblox",
    alt: "Roblox identification mark for Roblox gift-card PIN codes. Generic brand artwork, not a Robux top-up illustration.",
    ...commons("Roblox_Logo_2022.svg", "4/4b/Roblox_Logo_2022.svg"),
    permissionNote: TRADEMARK_NOTE,
    denominationSpecific: false,
  },
  {
    productId: "pubg-uc",
    kind: "generic-identification",
    background: "#17182B",
    invertLogo: true,
    title: "PUBG Mobile",
    alt: "PUBG Mobile identification mark for Player ID UC top-up. Generic brand artwork, not a redeemable UC code card.",
    ...commons("PUBG_Mobile_simple_logo_black.svg", "2/27/PUBG_Mobile_simple_logo_black.svg"),
    permissionNote: TRADEMARK_NOTE,
    denominationSpecific: false,
  },
  {
    productId: "ea-fc-points",
    kind: "generic-identification",
    background: "#17182B",
    invertLogo: true,
    title: "EA",
    alt: "Electronic Arts identification mark for EA Sports FC Points codes. Generic brand artwork, not a face-value points card photo.",
    ...commons("Electronic_Arts_logo_black.svg", "6/64/Electronic_Arts_logo_black.svg"),
    permissionNote: TRADEMARK_NOTE,
    denominationSpecific: false,
  },
  {
    productId: "valorant-points",
    kind: "generic-identification",
    background: "#17182B",
    invertLogo: true,
    title: "Valorant",
    alt: "Valorant identification mark for Valorant Points codes. Generic brand artwork, not a VP denomination card photo.",
    ...commons("Valorant_logo_-_black_color_version.svg", "1/11/Valorant_logo_-_black_color_version.svg"),
    permissionNote: TRADEMARK_NOTE,
    denominationSpecific: false,
  },
  {
    productId: "fortnite-vbucks",
    kind: "generic-identification",
    background: "#17182B",
    invertLogo: true,
    title: "Fortnite",
    alt: "Fortnite identification mark for V-Bucks codes. Generic brand artwork, not a V-Bucks denomination card photo.",
    ...commons("Fortnite_logo_2.svg", "a/a0/Fortnite_logo_2.svg"),
    permissionNote: TRADEMARK_NOTE,
    denominationSpecific: false,
  },
  {
    productId: "lol-card",
    kind: "generic-identification",
    background: "#17182B",
    invertLogo: false,
    title: "League of Legends",
    alt: "League of Legends identification mark for Riot prepaid codes. Generic brand artwork, not a face-value RP card photo.",
    ...commons("League_of_Legends_2019_vector.svg", "d/d8/League_of_Legends_2019_vector.svg"),
    permissionNote: TRADEMARK_NOTE,
    denominationSpecific: false,
  },
  {
    productId: "free-fire",
    kind: "name-only-tile",
    background: "#17182B",
    title: "Free Fire Diamonds",
    alt: "MMH identification tile for Free Fire Diamonds Player ID top-up. Not official Garena card artwork.",
    permissionNote: NAME_ONLY_NOTE,
    denominationSpecific: false,
  },
  {
    productId: "mlbb-diamonds",
    kind: "name-only-tile",
    background: "#17182B",
    title: "Mobile Legends Diamonds",
    alt: "MMH identification tile for Mobile Legends Diamonds User ID and Zone ID top-up. Not official Moonton card artwork.",
    permissionNote: NAME_ONLY_NOTE,
    denominationSpecific: false,
  },
];

export function artworkForProduct(productId: string) {
  return CATALOG_ARTWORK.find((item) => item.productId === productId);
}

export function catalogPublicPath(productId: string, ext = "svg") {
  return `/catalog/${productId}.${ext}`;
}

export function catalogStoredName(productId: string, ext = "svg") {
  return `catalog-${productId}.${ext}`;
}

export function isCatalogManagedStoredName(storedName: string) {
  return /^catalog-[a-z0-9-]+\.(svg|webp|png|jpe?g|avif)$/i.test(storedName);
}
