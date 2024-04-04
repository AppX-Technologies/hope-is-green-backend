const asyncHandler = require("express-async-handler");
const {
  createClubService,
  getClubDetailsService,
  updateClubDetailsService,
  updateClubSettingsService,
  addEntryFeeRecordService,
  addClubFeePaymentRecordService,
  updateClubStatusService,
  deleteClubService,
  listAllClubsService,
} = require("../services/clubServices");

// Create a new club
const createClub = asyncHandler(async (req, res) => {
  const club = await createClubService(req.body, req.user);
  res.status(201).json(club);
});

// Get details of a specific club
const getClubDetails = asyncHandler(async (req, res) => {
  const club = await getClubDetailsService(req.params.clubId, req.user);
  if (!club) {
    res.status(404).json({ message: "Club not found" });
    return;
  }
  res.status(200).json(club);
});

// Update specific details of a club
const updateClubDetails = asyncHandler(async (req, res) => {
  const club = await updateClubDetailsService(
    req.params.clubId,
    req.body,
    req.user
  );
  if (!club) {
    res.status(404).json({ message: "Club not found" });
    return;
  }
  res.status(200).json(club);
});

// Update club settings
const updateClubSettings = asyncHandler(async (req, res) => {
  const updatedClub = await updateClubSettingsService(
    req.params.clubId,
    req.body,
    req.user
  );
  if (!updatedClub) {
    res.status(404).json({ message: "Club not found or permission denied" });
    return;
  }
  res.status(200).json(updatedClub);
});

// Add entry fee record
const addEntryFeeRecord = asyncHandler(async (req, res) => {
  const updatedClub = await addEntryFeeRecordService(
    req.params.clubId,
    req.body,
    req.user
  );
  if (!updatedClub) {
    res.status(404).json({ message: "Club not found or permission denied" });
    return;
  }
  res.status(200).json(updatedClub);
});

// Add club fee payment record
const addClubFeePaymentRecord = asyncHandler(async (req, res) => {
  const updatedClub = await addClubFeePaymentRecordService(
    req.params.clubId,
    req.body,
    req.user
  );
  if (!updatedClub) {
    res.status(404).json({ message: "Club not found or permission denied" });
    return;
  }
  res.status(200).json(updatedClub);
});

// Update club status
const updateClubStatus = asyncHandler(async (req, res) => {
  const updatedClub = await updateClubStatusService(
    req.params.clubId,
    req.body.status,
    req.user
  );
  if (!updatedClub) {
    res.status(404).json({ message: "Club not found or permission denied" });
    return;
  }
  res.status(200).json(updatedClub);
});

// Delete a club
const deleteClub = asyncHandler(async (req, res) => {
  const result = await deleteClubService(req.params.clubId, req.user);
  if (!result) {
    res.status(404).json({ message: "Club not found or permission denied" });
    return;
  }
  res.status(204).send();
});

// List all clubs
const listAllClubs = asyncHandler(async (req, res) => {
  const clubs = await listAllClubsService(req.user);
  res.status(200).json(clubs);
});

module.exports = {
  createClub,
  getClubDetails,
  updateClubDetails,
  updateClubSettings,
  addEntryFeeRecord,
  addClubFeePaymentRecord,
  updateClubStatus,
  deleteClub,
  listAllClubs,
};
