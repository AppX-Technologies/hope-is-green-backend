const axios = require("axios").default;
const asyncHandler = require("express-async-handler");

const sendEmailFromTemplate = asyncHandler(
  async (
    templateName,
    lookupObject,
    recipients = ["support@etica-financials.com"],
    attachments = []
  ) => {
    let commaSeparatedRecipients = Array.isArray(recipients)
      ? recipients.join(",")
      : recipients;
    if (!commaSeparatedRecipients) {
      throw new Error("Empty recipient list in the email request.");
    }
    let requestObject = {
      requestType: "sendEmailFromTemplate",
      recipientEmails: commaSeparatedRecipients,
      templateName,
      lookupObject: Buffer.from(JSON.stringify(lookupObject)).toString(
        "base64"
      ),
      attachments,
      apiKey: process.env.APPS_SCRIPT_SECRET,
    };
    const response = await getResponse(requestObject);
    if (!response?.data?.success)
      throw new Error(response?.data?.reason || "Unknown reason");
    return true;
  }
);

const getResponse = asyncHandler(async (requestObject) => {
  let response;
  try {
    response = await axios.post(process.env.APPS_SCRIPT_URL, requestObject);
  } catch (e) {
    return false;
  }
  return response;
});

const sendEmailFromSubjectAndBody = asyncHandler(
  async (subject, body, recipients = false) => {
    let commaSeparatedRecipients = Array.isArray(recipients)
      ? recipients.join(",")
      : recipients;
    if (!commaSeparatedRecipients) {
      throw new Error("Empty recipient list in the email request.");
    }
    let requestObject = {
      requestType: "sendEmailFromSubjectAndBody",
      recipientEmails: commaSeparatedRecipients,
      subject,
      body,
      apiKey: process.env.APPS_SCRIPT_SECRET,
    };
    let response = await getResponse(requestObject);
    if (!response?.data?.success)
      throw new Error(response?.data?.reason || "Unknown reason");

    return true;
  }
);

const sendEmailForUuidConfirmation = asyncHandler(async (lookupObject) => {
  let commaSeparatedFallbackRecipients = fallbackRecipients.join(",");
  if (!commaSeparatedFallbackRecipients) {
    throw new Error("Empty recipient list in the email request.");
  }
  let requestObject = {
    requestType: "sendEmailForUuidConfirmation",
    fallbackRecipients: commaSeparatedFallbackRecipients,
    lookupObject,
    apiKey: process.env.APPS_SCRIPT_SECRET,
  };
  let response = await getResponse(requestObject);
  if (!response?.data?.success)
    throw new Error(response?.data?.reason || "Unknown reason");
  return true;
});

const readDriveFiles = asyncHandler(async (folderId) => {
  let requestObject = {
    requestType: "readFiles",
    folderId,
    apiKey: process.env.APPS_SCRIPT_SECRET,
  };
  let response = await getResponse(requestObject);
  if (!response?.data?.success)
    throw new Error(response?.data?.reason || "Unknown reason");
  return response.data;
});

const createFolder = asyncHandler(
  async ({ folderName, emailsToShare = [] }) => {
    let requestObject = {
      requestType: "create-folder",
      apiKey: process.env.APPS_SCRIPT_SECRET,
      payload: { folderName, emailsToShare },
    };
    let response = await axios.post(process.env.APPS_SCRIPT_URL, requestObject);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.folderId;
  }
);

const updateFolder = asyncHandler(
  async ({
    folderId,
    newFolderName,
    emailsToShare = [],
    emailsToRevokeAccess = [],
  }) => {
    let requestObject = {
      requestType: "update-folder",
      apiKey: process.env.APPS_SCRIPT_SECRET,
      payload: { newFolderName, folderId, emailsToShare, emailsToRevokeAccess },
    };
    let response = await axios.post(process.env.APPS_SCRIPT_URL, requestObject);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.folderId;
  }
);

const createOrUpdateGoogleCalendarEventAndMeet = asyncHandler(
  async ({
    title,
    description,
    startDateTime,
    endDateTime,
    emails,
    eventId,
    googleMeetLink,
    appointmentType,
  }) => {
    let requestObject = {
      requestType: "createOrUpdateCalendarEvent",
      apiKey: process.env.APPS_SCRIPT_SECRET,
      title,
      description,
      startDateTime,
      endDateTime,
      emails,
      eventId,
      googleMeetLink,
      appointmentType,
    };
    let response = await getResponse(requestObject);
    if (!response?.data?.success) {
      throw new Error(response?.data?.reason || "Unknown reason");
    }

    return response.data;
  }
);

const deleteAppointment = asyncHandler(async (eventId) => {
  let requestObject = {
    requestType: "deleteCalendarEvent",
    apiKey: process.env.APPS_SCRIPT_SECRET,
    eventId,
  };
  let response = await getResponse(requestObject);
  if (!response?.data?.success) {
    throw new Error(response?.data?.reason || "Unknown reason");
  }

  return response.data;
});

const getAllCalendarEvents = asyncHandler(
  async ({ startDate, endDate, excludedIds }) => {
    let requestObject = {
      requestType: "getAllCalendarEvents",
      apiKey: process.env.APPS_SCRIPT_SECRET,
      startDate,
      endDate,
      excludedIds,
    };
    let response = await getResponse(requestObject);
    if (!response?.data?.success) {
      throw new Error(response?.data?.reason || "Unknown reason");
    }

    return response.data.events;
  }
);

module.exports = {
  sendEmailFromTemplate,
  sendEmailForUuidConfirmation,
  sendEmailFromSubjectAndBody,
  readDriveFiles,
  updateFolder,
  createFolder,
  createOrUpdateGoogleCalendarEventAndMeet,
  deleteAppointment,
  getAllCalendarEvents,
};
