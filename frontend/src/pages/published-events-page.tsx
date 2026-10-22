import RandomEventImage from "@/components/random-event-image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  PublishedEventDetails,
  PublishedEventTicketTypeDetails,
} from "@/domain/domain";
import { getPublishedEvent } from "@/lib/api";
import { AlertCircle, ArrowLeft, CalendarDays, Check, MapPin, ShieldCheck, Ticket } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { Link, useNavigate, useParams } from "react-router";

const PublishedEventsPage: React.FC = () => {
  const { isAuthenticated, isLoading, signinRedirect, signoutRedirect } =
    useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [error, setError] = useState<string | undefined>();
  const [publishedEvent, setPublishedEvent] = useState<
    PublishedEventDetails | undefined
  >();
  const [selectedTicketType, setSelectedTicketType] = useState<
    PublishedEventTicketTypeDetails | undefined
  >();

  useEffect(() => {
    if (!id) {
      setError("ID must be provided!");
      return;
    }

    const doUseEffect = async () => {
      try {
        const eventData = await getPublishedEvent(id);
        setPublishedEvent(eventData);
        if (eventData.ticketTypes.length > 0) {
          setSelectedTicketType(eventData.ticketTypes[0]);
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else if (typeof err === "string") {
          setError(err);
        } else {
          setError("An unknown error has occurred");
        }
      }
    };
    doUseEffect();
  }, [id]);

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

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      {/* Nav */}
      <div className="container mx-auto flex max-w-7xl items-center justify-between p-4">
        <Link to="/" className="text-xl font-bold tracking-tight">
          Ticket<span className="text-violet-400">Flow</span>
        </Link>
        {isAuthenticated ? (
          <div className="flex gap-4">
            <Button
              onClick={() => navigate("/dashboard/events")}
              className="cursor-pointer"
            >
              Dashboard
            </Button>
            <Button
              className="cursor-pointer"
              onClick={() => signoutRedirect()}
            >
              Log out
            </Button>
          </div>
        ) : (
          <div className="flex gap-4">
            <Button className="cursor-pointer" onClick={() => signinRedirect()}>
              Log in
            </Button>
          </div>
        )}
      </div>

      <main className="container mx-auto max-w-7xl px-4 py-8 md:py-14">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to events
        </Link>
        {/* Header */}
        <div className="mb-14 grid items-center gap-10 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-400">Featured experience</p>
            <h1 className="text-4xl font-black tracking-tight md:text-6xl">{publishedEvent?.name}</h1>
            <p className="text-lg flex gap-3 text-gray-300">
              <MapPin className="text-violet-400" />
              {publishedEvent?.venue}
            </p>
            {publishedEvent?.start && (
              <p className="flex gap-3 text-lg text-gray-300">
                <CalendarDays className="text-violet-400" />
                {format(new Date(publishedEvent.start), "EEEE, MMMM d, yyyy · HH:mm")}
              </p>
            )}
            <div className="flex flex-wrap gap-3 pt-4 text-sm text-gray-300">
              <span className="flex items-center gap-2 rounded-full border border-gray-800 px-3 py-2"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Secure account ticket</span>
              <span className="flex items-center gap-2 rounded-full border border-gray-800 px-3 py-2"><Ticket className="h-4 w-4 text-violet-400" /> Instant QR code</span>
            </div>
          </div>
          {/* Right Column */}
          <div className="h-[380px] overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-violet-950/40">
            <RandomEventImage seed={publishedEvent?.id} alt={publishedEvent?.name} />
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-400">Choose your access</p>
          <h2 className="mt-2 text-3xl font-bold">Available tickets</h2>
        </div>
        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          {/* Left */}
          <div className="space-y-3">
            {publishedEvent?.ticketTypes?.map((ticketType) => (
              <Card
                className={`cursor-pointer gap-0 border bg-gray-900 text-white transition-all hover:border-violet-500 ${selectedTicketType?.id === ticketType.id ? "border-violet-500 ring-1 ring-violet-500" : "border-gray-800"}`}
                key={ticketType.id}
                onClick={() => setSelectedTicketType(ticketType)}
              >
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">{ticketType.name}</h3>
                    <span className="text-xl font-bold text-violet-300">
                      {ticketType.price === 0 ? "Free" : `€${ticketType.price}`}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm">
                    {ticketType.description}
                  </p>
                  <p className={`mt-3 text-sm font-medium ${ticketType.totalAvailable === 0 ? "text-red-400" : ticketType.totalAvailable <= 5 ? "text-amber-400" : "text-emerald-400"}`}>
                    {ticketType.totalAvailable === 0
                      ? "Sold out"
                      : ticketType.totalAvailable <= 5
                        ? `Only ${ticketType.totalAvailable} left`
                        : `${ticketType.totalAvailable} tickets available`}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Right */}
          <div className="text-white">
            <div className="sticky top-28 rounded-2xl border border-gray-800 bg-gray-900 p-7 shadow-xl">
              <p className="mb-2 text-sm text-gray-400">Your selection</p>
              <h2 className="text-2xl font-bold">{selectedTicketType?.name}</h2>
              <div className="mb-6">
                <span className="text-3xl font-bold">
                  {selectedTicketType?.price === 0 ? "Free" : `€${selectedTicketType?.price}`}
                </span>
              </div>
              <div className="mb-6">
                <p className="text-gray-300">
                  {selectedTicketType?.description}
                </p>
              </div>
              <div className="mb-6 space-y-2 text-sm text-gray-400">
                <p className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> QR ticket generated instantly</p>
                <p className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Saved in your ticket wallet</p>
              </div>
              {selectedTicketType && selectedTicketType.totalAvailable > 0 ? (
                <Link to={`/events/${publishedEvent?.id}/purchase/${selectedTicketType.id}`}>
                  <Button className="h-12 w-full bg-violet-600 text-base font-semibold hover:bg-violet-500">
                    {isAuthenticated ? "Purchase ticket" : "Log in to purchase"}
                  </Button>
                </Link>
              ) : (
                <Button className="h-12 w-full" disabled>Sold out</Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PublishedEventsPage;
