// Maps grant IDs to their emphasis areas for rubric-aware reuse
// In production, this would come from the database or grant documents

export interface GrantEmphasis {
  grantId: number;
  areas: string[];
  description: string;
}

// Known emphasis areas by grant type
const grantEmphasisMap: Record<number, GrantEmphasis> = {
  // TWC / workforce grants emphasize staff
  5: {
    grantId: 5,
    areas: ["staff qualifications", "wage competitiveness", "retention strategies", "professional development"],
    description: "This grant emphasizes staff development and workforce quality.",
  },
  // CACFP emphasizes meals/nutrition
  1: {
    grantId: 1,
    areas: ["meal service", "nutrition standards", "food safety", "enrolled children"],
    description: "This grant emphasizes meal service and nutrition compliance.",
  },
  // Head Start emphasizes comprehensive services
  6: {
    grantId: 6,
    areas: ["comprehensive child development", "family engagement", "health services", "school readiness"],
    description: "This grant emphasizes comprehensive early childhood services.",
  },
};

export function getGrantEmphasis(grantId: number): GrantEmphasis {
  return (
    grantEmphasisMap[grantId] || {
      grantId,
      areas: ["program quality", "community need", "organizational capacity", "sustainability"],
      description: "Standard narrative grant — emphasize impact and feasibility.",
    }
  );
}

export function compareEmphasis(
  currentGrantId: number,
  previousGrantId: number
): {
  current: GrantEmphasis;
  previous: GrantEmphasis;
  sharedAreas: string[];
  newAreas: string[];
  droppedAreas: string[];
} {
  const current = getGrantEmphasis(currentGrantId);
  const previous = getGrantEmphasis(previousGrantId);

  const currentSet = new Set(current.areas);
  const previousSet = new Set(previous.areas);

  return {
    current,
    previous,
    sharedAreas: current.areas.filter((a) => previousSet.has(a)),
    newAreas: current.areas.filter((a) => !previousSet.has(a)),
    droppedAreas: previous.areas.filter((a) => !currentSet.has(a)),
  };
}
