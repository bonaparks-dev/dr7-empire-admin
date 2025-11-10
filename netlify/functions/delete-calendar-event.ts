import type { Handler } from "@netlify/functions";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary";

async function getAccessToken(): Promise<string> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    throw new Error("Google credentials not configured");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error_description || "Failed to get access token");
  }

  return data.access_token;
}

async function findAndDeleteCalendarEvent(
  accessToken: string,
  bookingId: string,
  customerName: string,
  vehicleName: string
) {
  // Search for the event by booking ID in description
  const searchQuery = bookingId.substring(0, 8);
  const searchResponse = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${GOOGLE_CALENDAR_ID}/events?q=${encodeURIComponent(searchQuery)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const searchData = await searchResponse.json();

  if (!searchResponse.ok) {
    throw new Error(searchData.error?.message || "Failed to search calendar events");
  }

  // Find the matching event
  const events = searchData.items || [];
  const matchingEvent = events.find((event: any) => {
    const description = event.description || "";
    return description.includes(bookingId.substring(0, 8));
  });

  if (!matchingEvent) {
    console.log("No matching calendar event found for booking:", bookingId);
    return { deleted: false, message: "Event not found" };
  }

  // Delete the event
  const deleteResponse = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${GOOGLE_CALENDAR_ID}/events/${matchingEvent.id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!deleteResponse.ok && deleteResponse.status !== 204) {
    const errorData = await deleteResponse.json();
    throw new Error(errorData.error?.message || "Failed to delete calendar event");
  }

  return { deleted: true, eventId: matchingEvent.id };
}

export const handler: Handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { bookingId, customerName, vehicleName } = JSON.parse(event.body || "{}");

    // Validate required fields
    if (!bookingId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required field: bookingId" }),
      };
    }

    // Get access token
    const accessToken = await getAccessToken();

    // Find and delete calendar event
    const result = await findAndDeleteCalendarEvent(
      accessToken,
      bookingId,
      customerName || "",
      vehicleName || ""
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: true,
        ...result,
        message: result.deleted
          ? "Calendar event deleted successfully"
          : "No calendar event found to delete",
      }),
    };
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to delete calendar event",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
