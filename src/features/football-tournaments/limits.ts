export const footballFormLimits = {
  tournamentName: 70,
  tournamentCategory: 30,
  tournamentDescription: 280,
  categoryName: 80,
  categorySlug: 100,
  teamName: 60,
  teamShortName: 3,
  teamCaptainName: 60,
  teamContactPhone: 30,
  teamNotes: 300,
  matchRoundLabel: 40,
  playerFirstName: 60,
  playerLastName: 60,
  playerPublicName: 80,
  playerDocumentNumber: 30,
  playerPhone: 30,
  playerNotes: 300,
  rosterNotes: 300,
} as const;

export const teamPhotoMaxBytes = 5 * 1024 * 1024;
export const teamPhotoMaxLabel = "5 MB";
