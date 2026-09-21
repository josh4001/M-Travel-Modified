// Traveler Credit Score Engine & Intelligence Store
export interface CreditHistoryLog {
  id: string;
  date: string;
  action: string;
  scoreDelta: number;
  newScore: number;
  note: string;
}

export interface TravelerCreditProfile {
  userId: string;
  touristName: string;
  touristEmail: string;
  touristPhone: string;
  score: number; // 300 to 850 (Base: 750)
  tier: 'VIP Renter (A+)' | 'Good (B)' | 'Moderate Risk (C)' | 'Restricted (D)';
  isRestricted: boolean;
  restrictionReason?: string;
  completedTrips: number;
  cleanHandovers: number;
  lateReturns: number;
  damagesCount: number;
  documentsVerified: {
    nationalId: boolean;
    drivingLicense: boolean;
  };
  historyLogs: CreditHistoryLog[];
  updatedAt: string;
}

const CREDIT_PROFILES_KEY = 'mt_traveler_credit_profiles_v1';

// Seed default profiles for Sarah Ochieng and demo users
const DEFAULT_PROFILES: TravelerCreditProfile[] = [
  {
    userId: 'user-tourist-1',
    touristName: 'Sarah Ochieng',
    touristEmail: 'sarah.ochieng@gmail.com',
    touristPhone: '0712345678',
    score: 795,
    tier: 'VIP Renter (A+)',
    isRestricted: false,
    completedTrips: 4,
    cleanHandovers: 4,
    lateReturns: 0,
    damagesCount: 0,
    documentsVerified: {
      nationalId: true,
      drivingLicense: true,
    },
    historyLogs: [
      {
        id: 'log-1',
        date: new Date(Date.now() - 86400000 * 5).toISOString(),
        action: 'Account Onboarding & Document Verification',
        scoreDelta: 45,
        newScore: 795,
        note: 'Verified National ID & Driving License upon initial vehicle hire.',
      },
    ],
    updatedAt: new Date().toISOString(),
  },
];

export const getStoredCreditProfiles = (): TravelerCreditProfile[] => {
  try {
    const raw = localStorage.getItem(CREDIT_PROFILES_KEY);
    if (!raw) {
      localStorage.setItem(CREDIT_PROFILES_KEY, JSON.stringify(DEFAULT_PROFILES));
      return DEFAULT_PROFILES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PROFILES;
  }
};

export const saveCreditProfiles = (profiles: TravelerCreditProfile[]) => {
  try {
    localStorage.setItem(CREDIT_PROFILES_KEY, JSON.stringify(profiles));
    window.dispatchEvent(new CustomEvent('mt_credit_scores_updated', { detail: profiles }));
  } catch {}
};

export const getTravelerCreditProfile = (
  userId: string,
  fallbackInfo?: { name?: string; email?: string; phone?: string }
): TravelerCreditProfile => {
  const profiles = getStoredCreditProfiles();
  let found = profiles.find((p) => p.userId === userId || (p.touristEmail && p.touristEmail === fallbackInfo?.email));

  if (!found) {
    found = {
      userId,
      touristName: fallbackInfo?.name || 'Traveler Client',
      touristEmail: fallbackInfo?.email || 'client@m-travel.co.ke',
      touristPhone: fallbackInfo?.phone || '+254712345678',
      score: 750,
      tier: 'VIP Renter (A+)',
      isRestricted: false,
      completedTrips: 1,
      cleanHandovers: 1,
      lateReturns: 0,
      damagesCount: 0,
      documentsVerified: {
        nationalId: true,
        drivingLicense: true,
      },
      historyLogs: [
        {
          id: `log-${Date.now()}`,
          date: new Date().toISOString(),
          action: 'Initial Reservation Assessment',
          scoreDelta: 0,
          newScore: 750,
          note: 'Verified account standing & initial credit baseline.',
        },
      ],
      updatedAt: new Date().toISOString(),
    };
    profiles.push(found);
    saveCreditProfiles(profiles);
  }

  return found;
};

export const computeTier = (score: number): TravelerCreditProfile['tier'] => {
  if (score >= 750) return 'VIP Renter (A+)';
  if (score >= 650) return 'Good (B)';
  if (score >= 550) return 'Moderate Risk (C)';
  return 'Restricted (D)';
};

export const applyCreditScoreChange = (
  userId: string,
  delta: number,
  action: string,
  note: string,
  fallbackInfo?: { name?: string; email?: string; phone?: string }
): TravelerCreditProfile => {
  const profiles = getStoredCreditProfiles();
  let profile = getTravelerCreditProfile(userId, fallbackInfo);

  const newScore = Math.max(300, Math.min(850, profile.score + delta));
  const newTier = computeTier(newScore);
  const autoRestrict = newScore < 550;

  profile = {
    ...profile,
    score: newScore,
    tier: newTier,
    isRestricted: autoRestrict || profile.isRestricted,
    restrictionReason: autoRestrict ? 'Low Credit Rating (Below 550) due to rental violations.' : profile.restrictionReason,
    updatedAt: new Date().toISOString(),
    historyLogs: [
      {
        id: `log-${Date.now()}`,
        date: new Date().toISOString(),
        action,
        scoreDelta: delta,
        newScore,
        note,
      },
      ...profile.historyLogs,
    ],
  };

  const idx = profiles.findIndex((p) => p.userId === userId || p.touristEmail === profile.touristEmail);
  if (idx >= 0) {
    profiles[idx] = profile;
  } else {
    profiles.push(profile);
  }

  saveCreditProfiles(profiles);
  return profile;
};

export const toggleTravelerRestriction = (
  userId: string,
  isRestricted: boolean,
  reason?: string
): TravelerCreditProfile | null => {
  const profiles = getStoredCreditProfiles();
  const idx = profiles.findIndex((p) => p.userId === userId);
  if (idx < 0) return null;

  profiles[idx] = {
    ...profiles[idx],
    isRestricted,
    restrictionReason: isRestricted ? reason || 'Manual Admin Restriction Applied.' : undefined,
    updatedAt: new Date().toISOString(),
    historyLogs: [
      {
        id: `log-${Date.now()}`,
        date: new Date().toISOString(),
        action: isRestricted ? 'Admin Account Restriction' : 'Admin Restriction Lifted',
        scoreDelta: 0,
        newScore: profiles[idx].score,
        note: isRestricted ? `Account restricted by Admin: ${reason || 'Manual Flag'}` : 'Admin restored full vehicle rental privileges.',
      },
      ...profiles[idx].historyLogs,
    ],
  };

  saveCreditProfiles(profiles);
  return profiles[idx];
};
