const axios = require("axios");
const asyncHandler = require("express-async-handler");

const zoomApiBaseUrl = "https://api.zoom.us/v2";

let accessTokenCache = {
  value: null,
  expiry: null,
};

const getAccessToken = async () => {
  if (accessTokenCache.value && accessTokenCache.expiry > Date.now() + 60000) {
    return accessTokenCache.value;
  }

  const tokenEndpoint = "https://zoom.us/oauth/token";
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");

  const config = {
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${clientId}:${clientSecret}`
      ).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };

  try {
    const response = await axios.post(tokenEndpoint, params, config);
    accessTokenCache = {
      value: response.data.access_token,
      expiry: Date.now() + response.data.expires_in * 1000,
    };
    return accessTokenCache.value;
  } catch (error) {
    console.error(
      "Error obtaining access token:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

const createOrUpdateZoomMeet = asyncHandler(
  async (
    title,
    description,
    startDateTime,
    endDateTime,
    emails,
    meetingId,
    appointmentType
  ) => {
    const accessToken = await getAccessToken();

    // If the appointmentType is not 'Zoom Meeting', and a meetingId exists, delete the meeting
    if (appointmentType !== "Zoom Meeting" && meetingId) {
      try {
        // Call Zoom API to delete the meeting
        await axios.delete(`${zoomApiBaseUrl}/meetings/${meetingId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        // Return null or an empty object to indicate the meeting was deleted
        return {};
      } catch (error) {
        console.error(
          "Error deleting Zoom meeting:",
          error.response ? error.response.data : error.message
        );
        throw error;
      }
    }

    // Proceed with creation or update if the appointmentType is 'Zoom Meeting'
    if (appointmentType === "Zoom Meeting") {
      const meetingData = {
        topic: title,
        type: 2, // Scheduled meeting
        start_time: startDateTime,
        duration:
          (new Date(endDateTime).getTime() -
            new Date(startDateTime).getTime()) /
          60000, // Duration in minutes
        agenda: description,
        settings: {
          host_video: false,
          participant_video: false,
          join_before_host: true,
          mute_upon_entry: true,
          approval_type: 0,
          registration_type: 1,
          auto_recording: "none",
          alternative_hosts: emails.join(","),
        },
      };

      try {
        let response;
        if (meetingId) {
          // If meetingId exists, update the meeting
          response = await axios.patch(
            `${zoomApiBaseUrl}/meetings/${meetingId}`,
            meetingData,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
            }
          );
        } else {
          // If meetingId doesn't exist, create a new meeting
          response = await axios.post(
            `${zoomApiBaseUrl}/users/me/meetings`,
            meetingData,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
            }
          );
        }

        // Return the meetingId and joinUrl for the newly created or updated meeting
        return {
          meetingId: response.data.id, // The existing meetingId or the new meetingId
          joinUrl: response.data.join_url,
        };
      } catch (error) {
        console.error(
          "Error creating/updating Zoom meeting:",
          error.response ? error.response.data : error.message
        );
        throw error;
      }
    }

    // If the function hasn't returned by this point, return null or an empty object
    return {};
  }
);

module.exports = { createOrUpdateZoomMeet };
