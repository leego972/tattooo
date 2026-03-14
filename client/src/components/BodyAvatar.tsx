import { useState } from "react";

export type Gender = "male" | "female";
export type BodyShape = "slim" | "athletic" | "average" | "plus-size";
export type AvatarView = "front" | "back";

interface BodyAvatarProps {
  gender: Gender;
  bodyShape: BodyShape;
  view: AvatarView;
  selectedZone?: string;
  tattooImageUrl?: string;
  onZoneClick?: (zone: string) => void;
}

// Zone definitions: id, label, SVG path/shape, front/back
const FRONT_ZONES = [
  { id: "face", label: "Face", shape: "ellipse", cx: 100, cy: 42, rx: 22, ry: 26 },
  { id: "neck", label: "Neck", shape: "rect", x: 88, y: 68, w: 24, h: 18 },
  { id: "chest", label: "Chest", shape: "rect", x: 62, y: 88, w: 76, h: 44 },
  { id: "sternum", label: "Sternum", shape: "rect", x: 92, y: 90, w: 16, h: 40 },
  { id: "stomach", label: "Stomach", shape: "rect", x: 66, y: 134, w: 68, h: 36 },
  { id: "hip", label: "Hip", shape: "rect", x: 62, y: 170, w: 76, h: 28 },
  { id: "shoulder", label: "Left Shoulder", shape: "ellipse", cx: 52, cy: 100, rx: 18, ry: 16 },
  { id: "shoulder-r", label: "Right Shoulder", shape: "ellipse", cx: 148, cy: 100, rx: 18, ry: 16 },
  { id: "upper-arm", label: "Upper Arm", shape: "rect", x: 28, y: 110, w: 22, h: 42 },
  { id: "upper-arm-r", label: "Upper Arm (R)", shape: "rect", x: 150, y: 110, w: 22, h: 42 },
  { id: "forearm", label: "Forearm", shape: "rect", x: 22, y: 155, w: 20, h: 44 },
  { id: "forearm-r", label: "Forearm (R)", shape: "rect", x: 158, y: 155, w: 20, h: 44 },
  { id: "wrist", label: "Wrist", shape: "rect", x: 22, y: 200, w: 20, h: 12 },
  { id: "wrist-r", label: "Wrist (R)", shape: "rect", x: 158, y: 200, w: 20, h: 12 },
  { id: "hand-back", label: "Hand", shape: "rect", x: 18, y: 214, w: 26, h: 28 },
  { id: "hand-back-r", label: "Hand (R)", shape: "rect", x: 156, y: 214, w: 26, h: 28 },
  { id: "fingers", label: "Fingers", shape: "rect", x: 16, y: 242, w: 28, h: 16 },
  { id: "fingers-r", label: "Fingers (R)", shape: "rect", x: 156, y: 242, w: 28, h: 16 },
  { id: "thigh", label: "Thigh", shape: "rect", x: 68, y: 200, w: 28, h: 52 },
  { id: "thigh-r", label: "Thigh (R)", shape: "rect", x: 104, y: 200, w: 28, h: 52 },
  { id: "knee", label: "Knee", shape: "ellipse", cx: 82, cy: 258, rx: 14, ry: 10 },
  { id: "knee-r", label: "Knee (R)", shape: "ellipse", cx: 118, cy: 258, rx: 14, ry: 10 },
  { id: "calf", label: "Calf", shape: "rect", x: 70, y: 270, w: 24, h: 48 },
  { id: "calf-r", label: "Calf (R)", shape: "rect", x: 106, y: 270, w: 24, h: 48 },
  { id: "ankle", label: "Ankle", shape: "rect", x: 72, y: 320, w: 20, h: 12 },
  { id: "ankle-r", label: "Ankle (R)", shape: "rect", x: 108, y: 320, w: 20, h: 12 },
  { id: "foot-top", label: "Foot", shape: "ellipse", cx: 80, cy: 342, rx: 18, ry: 10 },
  { id: "foot-top-r", label: "Foot (R)", shape: "ellipse", cx: 120, cy: 342, rx: 18, ry: 10 },
];

const BACK_ZONES = [
  { id: "scalp", label: "Scalp/Head", shape: "ellipse", cx: 100, cy: 42, rx: 22, ry: 26 },
  { id: "neck", label: "Neck (Back)", shape: "rect", x: 88, y: 68, w: 24, h: 18 },
  { id: "upper-back", label: "Upper Back", shape: "rect", x: 62, y: 88, w: 76, h: 44 },
  { id: "lower-back", label: "Lower Back", shape: "rect", x: 66, y: 134, w: 68, h: 36 },
  { id: "full-back", label: "Full Back", shape: "rect", x: 62, y: 88, w: 76, h: 82 },
  { id: "shoulder", label: "Left Shoulder", shape: "ellipse", cx: 52, cy: 100, rx: 18, ry: 16 },
  { id: "shoulder-r", label: "Right Shoulder", shape: "ellipse", cx: 148, cy: 100, rx: 18, ry: 16 },
  { id: "upper-arm", label: "Upper Arm", shape: "rect", x: 28, y: 110, w: 22, h: 42 },
  { id: "upper-arm-r", label: "Upper Arm (R)", shape: "rect", x: 150, y: 110, w: 22, h: 42 },
  { id: "inner-arm", label: "Inner Arm", shape: "rect", x: 22, y: 155, w: 20, h: 44 },
  { id: "inner-arm-r", label: "Inner Arm (R)", shape: "rect", x: 158, y: 155, w: 20, h: 44 },
  { id: "elbow", label: "Elbow", shape: "ellipse", cx: 32, cy: 155, rx: 12, ry: 10 },
  { id: "elbow-r", label: "Elbow (R)", shape: "ellipse", cx: 168, cy: 155, rx: 12, ry: 10 },
  { id: "ribs", label: "Ribs / Side", shape: "rect", x: 38, y: 100, w: 22, h: 60 },
  { id: "ribs-r", label: "Ribs (R)", shape: "rect", x: 140, y: 100, w: 22, h: 60 },
  { id: "thigh", label: "Thigh", shape: "rect", x: 68, y: 200, w: 28, h: 52 },
  { id: "thigh-r", label: "Thigh (R)", shape: "rect", x: 104, y: 200, w: 28, h: 52 },
  { id: "calf", label: "Calf", shape: "rect", x: 70, y: 270, w: 24, h: 48 },
  { id: "calf-r", label: "Calf (R)", shape: "rect", x: 106, y: 270, w: 24, h: 48 },
];

// Body shape scale factors
const SHAPE_SCALES: Record<BodyShape, { scaleX: number; scaleY: number }> = {
  slim: { scaleX: 0.88, scaleY: 1.0 },
  athletic: { scaleX: 1.0, scaleY: 1.0 },
  average: { scaleX: 1.06, scaleY: 1.0 },
  "plus-size": { scaleX: 1.18, scaleY: 1.03 },
};

// Body silhouette paths
function getMaleSilhouette(shape: BodyShape) {
  const s = SHAPE_SCALES[shape];
  const w = 76 * s.scaleX;
  const cx = 100;
  return (
    <g opacity="0.18">
      {/* Head */}
      <ellipse cx={cx} cy={42} rx={22} ry={26} fill="currentColor" />
      {/* Neck */}
      <rect x={cx - 10} y={67} width={20} height={20} rx={4} fill="currentColor" />
      {/* Torso */}
      <rect x={cx - w / 2} y={87} width={w} height={115} rx={8} fill="currentColor" />
      {/* Left arm */}
      <rect x={cx - w / 2 - 22} y={90} width={22} height={115} rx={8} fill="currentColor" />
      {/* Right arm */}
      <rect x={cx + w / 2} y={90} width={22} height={115} rx={8} fill="currentColor" />
      {/* Left hand */}
      <ellipse cx={cx - w / 2 - 11} cy={218} rx={13} ry={18} fill="currentColor" />
      {/* Right hand */}
      <ellipse cx={cx + w / 2 + 11} cy={218} rx={13} ry={18} fill="currentColor" />
      {/* Left leg */}
      <rect x={cx - w / 2 + 4} y={202} width={w / 2 - 6} height={155} rx={8} fill="currentColor" />
      {/* Right leg */}
      <rect x={cx + 2} y={202} width={w / 2 - 6} height={155} rx={8} fill="currentColor" />
    </g>
  );
}

function getFemaleSilhouette(shape: BodyShape) {
  const s = SHAPE_SCALES[shape];
  const shoulderW = 68 * s.scaleX;
  const waistW = 52 * s.scaleX;
  const hipW = 76 * s.scaleX;
  const cx = 100;
  return (
    <g opacity="0.18">
      {/* Head */}
      <ellipse cx={cx} cy={40} rx={20} ry={24} fill="currentColor" />
      {/* Neck */}
      <rect x={cx - 9} y={63} width={18} height={18} rx={4} fill="currentColor" />
      {/* Shoulders */}
      <rect x={cx - shoulderW / 2} y={81} width={shoulderW} height={30} rx={6} fill="currentColor" />
      {/* Waist */}
      <rect x={cx - waistW / 2} y={111} width={waistW} height={40} rx={4} fill="currentColor" />
      {/* Hips */}
      <rect x={cx - hipW / 2} y={151} width={hipW} height={50} rx={8} fill="currentColor" />
      {/* Left arm */}
      <rect x={cx - shoulderW / 2 - 20} y={84} width={20} height={110} rx={7} fill="currentColor" />
      {/* Right arm */}
      <rect x={cx + shoulderW / 2} y={84} width={20} height={110} rx={7} fill="currentColor" />
      {/* Left hand */}
      <ellipse cx={cx - shoulderW / 2 - 10} cy={208} rx={12} ry={16} fill="currentColor" />
      {/* Right hand */}
      <ellipse cx={cx + shoulderW / 2 + 10} cy={208} rx={12} ry={16} fill="currentColor" />
      {/* Left leg */}
      <rect x={cx - hipW / 2 + 4} y={200} width={hipW / 2 - 6} height={155} rx={8} fill="currentColor" />
      {/* Right leg */}
      <rect x={cx + 2} y={200} width={hipW / 2 - 6} height={155} rx={8} fill="currentColor" />
    </g>
  );
}

export default function BodyAvatar({
  gender,
  bodyShape,
  view,
  selectedZone,
  tattooImageUrl,
  onZoneClick,
}: BodyAvatarProps) {
  const zones = view === "front" ? FRONT_ZONES : BACK_ZONES;

  const renderZone = (zone: (typeof FRONT_ZONES)[0]) => {
    const isSelected = selectedZone === zone.id;
    const fill = isSelected
      ? "oklch(0.62 0.19 220 / 0.55)"
      : "oklch(0.62 0.19 220 / 0.08)";
    const stroke = isSelected
      ? "oklch(0.72 0.20 220)"
      : "oklch(0.62 0.19 220 / 0.25)";
    const strokeW = isSelected ? 1.5 : 0.8;

    const commonProps = {
      fill,
      stroke,
      strokeWidth: strokeW,
      className: `zone-hover ${isSelected ? "zone-active" : ""} cursor-pointer`,
      onClick: () => onZoneClick?.(zone.id),
      style: { filter: isSelected ? "drop-shadow(0 0 6px oklch(0.62 0.19 220 / 0.8))" : undefined },
    };

    if (zone.shape === "ellipse") {
      const z = zone as { id: string; label: string; shape: string; cx: number; cy: number; rx: number; ry: number };
      return (
        <ellipse key={zone.id} cx={z.cx} cy={z.cy} rx={z.rx} ry={z.ry} {...commonProps}>
          <title>{zone.label}</title>
        </ellipse>
      );
    } else {
      const z = zone as { id: string; label: string; shape: string; x: number; y: number; w: number; h: number };
      return (
        <rect key={zone.id} x={z.x} y={z.y} width={z.w} height={z.h} rx={4} {...commonProps}>
          <title>{zone.label}</title>
        </rect>
      );
    }
  };

  // Find selected zone for tattoo overlay position
  const selectedZoneData = zones.find((z) => z.id === selectedZone);

  return (
    <svg
      viewBox="0 0 200 370"
      className="w-full h-full"
      style={{ maxHeight: "100%", touchAction: "manipulation" }}
    >
      {/* Body silhouette */}
      <g className="text-foreground">
        {gender === "female"
          ? getFemaleSilhouette(bodyShape)
          : getMaleSilhouette(bodyShape)}
      </g>

      {/* Clickable zones */}
      {zones.map(renderZone)}

      {/* Tattoo overlay on selected zone */}
      {tattooImageUrl && selectedZoneData && (() => {
        let x = 0, y = 0, w = 40, h = 40;
        if (selectedZoneData.shape === "ellipse") {
          const z = selectedZoneData as any;
          x = z.cx - z.rx;
          y = z.cy - z.ry;
          w = z.rx * 2;
          h = z.ry * 2;
        } else {
          const z = selectedZoneData as any;
          x = z.x;
          y = z.y;
          w = z.w;
          h = z.h;
        }
        return (
          <image
            href={tattooImageUrl}
            x={x}
            y={y}
            width={w}
            height={h}
            style={{
              opacity: 0.85,
              mixBlendMode: "multiply",
              filter: "contrast(1.2) brightness(0.85)",
            }}
            preserveAspectRatio="xMidYMid meet"
          />
        );
      })()}

      {/* Zone label */}
      {selectedZoneData && (
        <text
          x={100}
          y={362}
          textAnchor="middle"
          fontSize={9}
          fill="oklch(0.62 0.19 220)"
          fontFamily="Inter, sans-serif"
        >
          {selectedZoneData.label}
        </text>
      )}
    </svg>
  );
}
