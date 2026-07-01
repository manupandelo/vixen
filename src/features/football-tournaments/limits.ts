export const footballFormLimits = {
  tournamentName: 70,
  tournamentCategory: 30,
  tournamentDescription: 280,
  teamName: 60,
  teamShortName: 3,
  teamCaptainName: 60,
  teamContactPhone: 30,
  teamNotes: 300,
  matchRoundLabel: 40,
} as const;

export const teamPhotoMaxBytes = 5 * 1024 * 1024;
export const teamPhotoMaxLabel = "5 MB";
