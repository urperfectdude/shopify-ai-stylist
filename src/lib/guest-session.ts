export type GuestBudgetRange = {
  min: number | null;
  max: number | null;
};

export type GuestStyleProfile = {
  displayName: string;
  userImage: string | null;
  skinTone: string;
  hairColor: string;
  eyeColor: string;
  ageRange: string;
  gender: string;
  bodyType: string;
  fitPreference: string;
  sizes: string[];
  preferredStyles: string[];
  preferredColors: string[];
  preferredMaterials: string[];
  budget: GuestBudgetRange;
  occasion: string;
  mood: string;
  updatedAt: string | null;
};

export type GuestCartLine = {
  merchandiseId: string;
  quantity: number;
};

export type GuestCartIntent = {
  lines: GuestCartLine[];
  seedProductId: string | null;
  createdAt: string;
};

export type GuestSessionSnapshot = {
  guestToken: string;
  profile: GuestStyleProfile;
  cartIntent: GuestCartIntent | null;
};

const STORAGE_KEY = "ai-stylist.guest-session";

export const emptyGuestStyleProfile: GuestStyleProfile = {
  displayName: "",
  userImage: null,
  skinTone: "",
  hairColor: "",
  eyeColor: "",
  ageRange: "",
  gender: "",
  bodyType: "",
  fitPreference: "",
  sizes: [],
  preferredStyles: [],
  preferredColors: [],
  preferredMaterials: [],
  budget: {
    min: null,
    max: null,
  },
  occasion: "",
  mood: "",
  updatedAt: null,
};

function canUseBrowserStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function createGuestToken(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function createEmptyGuestSnapshot(): GuestSessionSnapshot {
  return {
    guestToken: "",
    profile: emptyGuestStyleProfile,
    cartIntent: null,
  };
}

export function buildGuestCartIntent(
  merchandiseIds: string[],
  seedProductId?: string | null,
): GuestCartIntent {
  const uniqueIds = [...new Set(merchandiseIds.filter(Boolean))];

  return {
    lines: uniqueIds.map((merchandiseId) => ({
      merchandiseId,
      quantity: 1,
    })),
    seedProductId: seedProductId ?? null,
    createdAt: new Date().toISOString(),
  };
}

export function loadGuestSession(): GuestSessionSnapshot {
  if (!canUseBrowserStorage()) {
    return createEmptyGuestSnapshot();
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);
  if (!rawValue) {
    const snapshot = {
      ...createEmptyGuestSnapshot(),
      guestToken: createGuestToken(),
    };
    persistGuestSession(snapshot);
    return snapshot;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<GuestSessionSnapshot>;
    return {
      guestToken: parsed.guestToken || createGuestToken(),
      profile: parsed.profile ?? createEmptyGuestSnapshot().profile,
      cartIntent: parsed.cartIntent ?? null,
    };
  } catch {
    const snapshot = {
      ...createEmptyGuestSnapshot(),
      guestToken: createGuestToken(),
    };
    persistGuestSession(snapshot);
    return snapshot;
  }
}

export function persistGuestSession(snapshot: GuestSessionSnapshot): void {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

export function saveGuestProfile(profile: GuestStyleProfile): GuestSessionSnapshot {
  const current = loadGuestSession();
  const next: GuestSessionSnapshot = {
    ...current,
    profile: {
      ...profile,
      updatedAt: new Date().toISOString(),
    },
  };
  persistGuestSession(next);
  return next;
}

export function saveGuestCartIntent(cartIntent: GuestCartIntent): GuestSessionSnapshot {
  const current = loadGuestSession();
  const next: GuestSessionSnapshot = {
    ...current,
    cartIntent,
  };
  persistGuestSession(next);
  return next;
}
