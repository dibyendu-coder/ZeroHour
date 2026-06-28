export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
}

/**
 * Fetch upcoming Google Calendar events
 */
export async function listUpcomingEvents(accessToken: string, maxResults = 25): Promise<CalendarEvent[]> {
  const timeMin = new Date().toISOString();
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&singleEvents=true&orderBy=startTime&maxResults=${maxResults}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to fetch calendar events: ${response.status} ${errText}`);
  }

  const data = await response.json();
  return data.items || [];
}

/**
 * Create a new event on primary calendar
 */
export async function createCalendarEvent(
  accessToken: string,
  event: {
    summary: string;
    description: string;
    startTime: string; // ISO string
    endTime: string;   // ISO string
  }
): Promise<CalendarEvent> {
  const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      summary: event.summary,
      description: event.description,
      start: {
        dateTime: event.startTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: event.endTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to create calendar event: ${response.status} ${errText}`);
  }

  return response.json();
}
