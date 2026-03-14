/**
 * Shared tattoo design constants for body placement and sizing.
 */

export const BODY_PLACEMENTS = [
  // Face & Head
  { value: "face", label: "Face", group: "Head & Face", hint: "Intricate, small-scale designs work best. Consider skin texture and movement." },
  { value: "forehead", label: "Forehead", group: "Head & Face", hint: "Bold, symmetrical designs. High visibility placement." },
  { value: "behind-ear", label: "Behind Ear", group: "Head & Face", hint: "Tiny, delicate designs. Usually 2–5 cm." },
  { value: "neck", label: "Neck", group: "Head & Face", hint: "Wraps around or sits on nape/side. Visible and expressive." },
  { value: "scalp", label: "Scalp", group: "Head & Face", hint: "Visible when hair is shaved. Bold designs recommended." },

  // Upper Body
  { value: "chest", label: "Chest", group: "Upper Body", hint: "Large canvas. Ideal for detailed, expansive artwork." },
  { value: "sternum", label: "Sternum", group: "Upper Body", hint: "Elongated vertical designs work well here." },
  { value: "shoulder", label: "Shoulder", group: "Upper Body", hint: "Wraps naturally. Great for mandalas and geometric art." },
  { value: "upper-arm", label: "Upper Arm", group: "Upper Body", hint: "Sleeve-friendly. Cylindrical canvas." },
  { value: "forearm", label: "Forearm", group: "Upper Body", hint: "Highly visible. Great for detailed line work." },
  { value: "inner-arm", label: "Inner Arm", group: "Upper Body", hint: "Sensitive area. Delicate designs recommended." },
  { value: "elbow", label: "Elbow", group: "Upper Body", hint: "Geometric or mandala designs suit the rounded surface." },
  { value: "wrist", label: "Wrist", group: "Upper Body", hint: "Small to medium. Bracelet-style or minimalist." },

  // Hands & Fingers
  { value: "hand-back", label: "Hand (Back)", group: "Hands & Fingers", hint: "Highly visible. Designs must account for skin stretching." },
  { value: "hand-palm", label: "Hand (Palm)", group: "Hands & Fingers", hint: "Fades faster due to friction. Bold, simple designs." },
  { value: "fingers", label: "Fingers", group: "Hands & Fingers", hint: "Very small canvas. Single letters, symbols, or bands." },
  { value: "knuckles", label: "Knuckles", group: "Hands & Fingers", hint: "Classic placement. Short words or symbols per knuckle." },

  // Torso & Back
  { value: "upper-back", label: "Upper Back", group: "Back & Torso", hint: "Large, flat canvas. Ideal for detailed back pieces." },
  { value: "lower-back", label: "Lower Back", group: "Back & Torso", hint: "Horizontal designs work well. Medium to large." },
  { value: "full-back", label: "Full Back", group: "Back & Torso", hint: "Maximum canvas. Epic, full-detail artwork." },
  { value: "ribs", label: "Ribs / Side", group: "Back & Torso", hint: "Elongated designs follow the rib contour." },
  { value: "stomach", label: "Stomach / Abdomen", group: "Back & Torso", hint: "Flat canvas. Designs may shift with body changes." },
  { value: "hip", label: "Hip", group: "Back & Torso", hint: "Curved surface. Flowing, organic designs work well." },

  // Lower Body
  { value: "thigh", label: "Thigh", group: "Lower Body", hint: "Large, flat canvas. Great for detailed artwork." },
  { value: "knee", label: "Knee", group: "Lower Body", hint: "Geometric or mandala designs suit the rounded surface." },
  { value: "calf", label: "Calf", group: "Lower Body", hint: "Cylindrical canvas. Great for vertical designs." },
  { value: "shin", label: "Shin", group: "Lower Body", hint: "Flat, bony surface. Bold designs recommended." },
  { value: "ankle", label: "Ankle", group: "Lower Body", hint: "Small to medium. Wrap-around or minimalist designs." },

  // Feet & Toes
  { value: "foot-top", label: "Foot (Top)", group: "Feet & Toes", hint: "Visible placement. Designs must account for skin stretching." },
  { value: "foot-sole", label: "Foot (Sole)", group: "Feet & Toes", hint: "Fades quickly. Bold, simple designs only." },
  { value: "toes", label: "Toes", group: "Feet & Toes", hint: "Very small canvas. Minimal symbols or bands." },
] as const;

export type BodyPlacementValue = (typeof BODY_PLACEMENTS)[number]["value"];

export const SIZE_OPTIONS = [
  {
    label: "XS",
    name: "Extra Small",
    description: "Coin-sized",
    cmRange: "2–4 cm",
    notes: "Perfect for minimalist symbols, single letters, tiny icons. Ideal for fingers, toes, behind-ear.",
  },
  {
    label: "S",
    name: "Small",
    description: "Palm-sized",
    cmRange: "5–8 cm",
    notes: "Great for wrists, ankles, neck. Detailed but compact designs.",
  },
  {
    label: "M",
    name: "Medium",
    description: "Hand-sized",
    cmRange: "9–15 cm",
    notes: "Versatile size for forearms, calves, shoulders. Most popular choice.",
  },
  {
    label: "L",
    name: "Large",
    description: "A5 paper",
    cmRange: "16–25 cm",
    notes: "Chest, thigh, upper arm. Allows for rich detail and shading.",
  },
  {
    label: "XL",
    name: "Extra Large",
    description: "A4 paper",
    cmRange: "26–40 cm",
    notes: "Back pieces, full sleeves, full thigh. Epic, immersive artwork.",
  },
  {
    label: "XXL",
    name: "Full Coverage",
    description: "Full body part",
    cmRange: "40+ cm",
    notes: "Full back, full sleeve, full leg. Maximum detail and impact.",
  },
] as const;

export type SizeLabel = (typeof SIZE_OPTIONS)[number]["label"];

/** Returns a size-aware prompt modifier for the given body placement and size */
export function buildSizeAndPlacementContext(
  bodyPlacement: string,
  sizeLabel: string,
  sizeInCm: string
): string {
  const placement = BODY_PLACEMENTS.find((p) => p.value === bodyPlacement);
  const size = SIZE_OPTIONS.find((s) => s.label === sizeLabel);

  const placementText = placement
    ? `The tattoo is designed for placement on the **${placement.label}** (${placement.group}). Design consideration: ${placement.hint}`
    : `Placement: ${bodyPlacement}`;

  const sizeText = size
    ? `Size: **${size.name} (${size.label})** — approximately ${sizeInCm || size.cmRange}. ${size.notes}`
    : `Size: ${sizeLabel} (${sizeInCm})`;

  return `${placementText}\n${sizeText}`;
}
