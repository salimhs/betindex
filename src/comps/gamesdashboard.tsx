import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"

// Define a type for your event data with extra parameters
interface EventData {
  sport: string
  home_team: string
  away_team: string
  event_time: string
  home_team_odds: string
  away_team_odds: string
}

// Helper function to compare times and return a CSS class
const getTimeLabelClass = (eventTime: string) => {
  const currentTime = new Date();
  const eventDate = new Date(eventTime);

  // Log both times in ISO format for debugging
  console.log("Current time (ISO):", currentTime.toISOString());
  console.log("Event time (ISO):", eventDate.toISOString());

  return eventDate.getTime() < currentTime.getTime() ? "text-red-500" : "text-green-500";
}

// Helper function to format a date string to EST in AM/PM format
export const formatEventTime = (eventTime: string) => {
  const eventDate = new Date(eventTime);
  // Format the date using America/New_York timezone for EST/EDT with AM/PM formatting.
  // Adjust options as desired.
  return eventDate.toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
}

export default function GamesDashboard() {
  // Initialize events as an empty array with type EventData[]
  const [events, setEvents] = useState<EventData[]>([])

  // Load events data from the Flask backend on component mount
  useEffect(() => {
    fetch("http://localhost:5000/api/events")
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch((error) => console.error("Error fetching events:", error))
  }, [])

  // Create a sorted version of events:
  // - Upcoming events (green) come first, sorted by event time ascending (soonest first).
  // - Past events (red) come after, sorted descending (most recent first).
  const sortedEvents = [...events].sort((a, b) => {
    const now = new Date().getTime();
    const aTime = new Date(a.event_time).getTime();
    const bTime = new Date(b.event_time).getTime();

    const aUpcoming = aTime >= now;
    const bUpcoming = bTime >= now;

    if (aUpcoming && !bUpcoming) return -1;
    if (!aUpcoming && bUpcoming) return 1;
    if (aUpcoming && bUpcoming) return aTime - bTime;
    return bTime - aTime;
  });

  return (
    <Card className="mx-auto bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm md:col-span-3 px-4 max-w-6xl">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Check className="mr-2 h-5 w-5" />
          Upcoming Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2">Sport</th>
                <th className="text-left py-3 px-2">Home Team</th>
                <th className="text-left py-3 px-2">Away Team</th>
                <th className="text-left py-3 px-2">Start Time</th>
                <th className="text-left py-3 px-2">Home Odds</th>
                <th className="text-left py-3 px-2">Away Odds</th>
              </tr>
            </thead>
            <tbody>
              {sortedEvents.map((event, index) => (
                <tr key={index} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-2">{event.sport}</td>
                  <td className="py-3 px-2">{event.home_team}</td>
                  <td className="py-3 px-2">{event.away_team}</td>
                  <td className="py-3 px-2">
                    <span className={getTimeLabelClass(event.event_time)}>
                      {formatEventTime(event.event_time)}
                    </span>
                  </td>
                  <td className="py-3 px-2">{event.home_team_odds}</td>
                  <td className="py-3 px-2">{event.away_team_odds}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
