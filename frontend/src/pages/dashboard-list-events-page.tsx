import NavBar from "@/components/nav-bar";
import { SimplePagination } from "@/components/simple-pagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  EventSummary,
  EventStatusEnum,
  SpringBootPagination,
} from "@/domain/domain";
import { deleteEvent, listEvents } from "@/lib/api";
import {
  AlertCircle,
  Calendar,
  Clock,
  Edit,
  MapPin,
  Tag,
  Trash,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { Link } from "react-router";

const DashboardListEventsPage: React.FC = () => {
  const { isLoading, user } = useAuth();
  const [events, setEvents] = useState<
    SpringBootPagination<EventSummary> | undefined
  >();
  const [error, setError] = useState<string | undefined>();
  const [deleteEventError, setDeleteEventError] = useState<
    string | undefined
  >();

  const [page, setPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<
    EventSummary | undefined
  >();

  const refreshEvents = useCallback(async (accessToken: string) => {
    try {
      setEvents(await listEvents(accessToken, page));
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === "string") {
        setError(err);
      } else {
        setError("An unknown error has occurred");
      }
    }
  }, [page]);

  useEffect(() => {
    if (isLoading || !user?.access_token) {
      return;
    }
    refreshEvents(user.access_token);
  }, [isLoading, user?.access_token, refreshEvents]);

  const formatDate = (date?: Date) => {
    if (!date) {
      return "TBD";
    }
    return new Date(date).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (date?: Date) => {
    if (!date) {
      return "";
    }
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatStatusBadge = (status: EventStatusEnum) => {
    switch (status) {
      case EventStatusEnum.DRAFT:
        return "bg-gray-700 text-gray-200";
      case EventStatusEnum.PUBLISHED:
        return "bg-green-700 text-green-100";
      case EventStatusEnum.CANCELLED:
        return "bg-red-700 text-red-100";
      case EventStatusEnum.COMPLETED:
        return "bg-blue-700 text-blue-100";
      default:
        return "bg-gray-700 text-gray-200";
    }
  };

  const handleOpenDeleteEventDialog = (eventToDelete: EventSummary) => {
    setEventToDelete(undefined);
    setEventToDelete(eventToDelete);
    setDialogOpen(true);
  };

  const handleCancelDeleteEventDialog = () => {
    setEventToDelete(undefined);
    setEventToDelete(undefined);
    setDialogOpen(false);
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete || isLoading || !user?.access_token) {
      return;
    }

    try {
      setDeleteEventError(undefined);
      await deleteEvent(user.access_token, eventToDelete.id);
      setEventToDelete(undefined);
      setDialogOpen(false);
      refreshEvents(user.access_token);
    } catch (err) {
      if (err instanceof Error) {
        setDeleteEventError(err.message);
      } else if (typeof err === "string") {
        setDeleteEventError(err);
      } else {
        setDeleteEventError("An unknown error has occurred");
      }
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Alert variant="destructive" className="bg-gray-900 border-red-700">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen text-white">
      <NavBar />

      <main className="container mx-auto max-w-7xl px-4 pb-10">
        {/* Title */}
        <div className="py-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Your Events</h1>
            <p className="text-gray-400">
              {events
                ? `${events.totalElements} event${events.totalElements === 1 ? "" : "s"} created`
                : "Loading your events..."}
            </p>
          </div>
          <div>
            <Link to="/dashboard/events/create">
              <Button className="bg-purple-700 hover:bg-purple-500 cursor-pointer">
                Create Event
              </Button>
            </Link>
          </div>
        </div>

        {/* Event Cards */}
        {events?.empty ? (
          <div className="rounded-xl border border-dashed border-gray-700 py-20 text-center">
            <h2 className="text-xl font-semibold">No events yet</h2>
            <p className="mt-2 text-gray-400">
              Create your first event to start selling tickets.
            </p>
          </div>
        ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {events?.content.map((eventItem) => (
            <Card
              key={eventItem.id}
              className="flex h-full flex-col bg-gray-900 border-gray-700 text-white transition-colors hover:border-purple-600"
            >
              <CardHeader>
                <div className="flex justify-between">
                  <h3 className="font-bold text-xl">{eventItem.name}</h3>
                  <span
                    className={`flex items-center px-2 py-1 rounded-lg text-xs ${formatStatusBadge(eventItem.status)}`}
                  >
                    {eventItem.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Event Start & End */}
                <div className="flex space-x-2">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">
                      {formatDate(eventItem.start)} to{" "}
                      {formatDate(eventItem.end)}
                    </p>
                    <p className="text-gray-400">
                      {formatTime(eventItem.start)} -{" "}
                      {formatTime(eventItem.end)}
                    </p>
                  </div>
                </div>
                {/* Sales start and end */}
                <div className="flex space-x-2">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <h4 className="font-medium">Sales Period</h4>
                    <p className="text-gray-400">
                      {formatDate(eventItem.salesStart)} to{" "}
                      {formatDate(eventItem.salesEnd)}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{eventItem.venue}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Tag className="h-5 w-5 text-gray-400" />
                  <div>
                    <h4 className="font-medium">Ticket Types</h4>
                    <ul>
                      {eventItem.ticketTypes.map((ticketType) => (
                        <li
                          key={ticketType.id}
                          className="flex gap-2 text-gray-400"
                        >
                          <span>{ticketType.name}</span>
                          <span>${ticketType.price}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="mt-auto flex justify-end gap-2">
                <Link to={`/dashboard/events/update/${eventItem.id}`}>
                  <Button
                    type="button"
                    className="bg-gray-700 hover:bg-gray-500 cursor-pointer"
                  >
                    <Edit />
                  </Button>
                </Link>
                <Button
                  type="button"
                  className="bg-red-700/80 hover:bg-red-500 cursor-pointer"
                  onClick={() => handleOpenDeleteEventDialog(eventItem)}
                >
                  <Trash />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        )}
      <div className="flex flex-col items-center gap-2 py-8">
        {events && (
          <>
            <SimplePagination pagination={events} onPageChange={setPage} />
            {events.totalPages > 1 && (
              <p className="text-xs text-gray-500">
                Showing {events.numberOfElements} of {events.totalElements} events
              </p>
            )}
          </>
        )}
      </div>
      </main>
      <AlertDialog open={dialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete your event '{eventToDelete?.name}' and cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteEventError && (
            <Alert variant="destructive" className="border-red-700">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{deleteEventError}</AlertDescription>
            </Alert>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDeleteEventDialog}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDeleteEvent()}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DashboardListEventsPage;
