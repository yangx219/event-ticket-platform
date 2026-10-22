import { useAuth } from "react-oidc-context";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router";
import { Input } from "@/components/ui/input";
import { AlertCircle, ArrowRight, Search, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { PublishedEventSummary, SpringBootPagination } from "@/domain/domain";
import { listPublishedEvents, searchPublishedEvents } from "@/lib/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import PublishedEventCard from "@/components/published-event-card";
import { SimplePagination } from "@/components/simple-pagination";

const AttendeeLandingPage: React.FC = () => {
  const { isAuthenticated, isLoading, signinRedirect, signoutRedirect } =
    useAuth();

  const navigate = useNavigate();

  const [page, setPage] = useState(0);
  const [publishedEvents, setPublishedEvents] = useState<
    SpringBootPagination<PublishedEventSummary> | undefined
  >();
  const [error, setError] = useState<string | undefined>();
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");

  useEffect(() => {
    const loadPublishedEvents = async () => {
      try {
        const result = activeQuery
          ? await searchPublishedEvents(activeQuery, page)
          : await listPublishedEvents(page);
        setPublishedEvents(result);
        setError(undefined);
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
    loadPublishedEvents();
  }, [activeQuery, page]);

  const queryPublishedEvents = () => {
    const nextQuery = query.trim();
    setPage(0);
    setActiveQuery(nextQuery);
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

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      {/* Nav */}
      <div className="container mx-auto flex max-w-7xl items-center justify-between p-4">
        <div className="text-xl font-bold tracking-tight">
          Ticket<span className="text-violet-400">Flow</span>
        </div>
        {isAuthenticated ? (
          <div className="flex gap-4">
            <Button
              onClick={() => navigate("/dashboard")}
              className="cursor-pointer bg-violet-600 hover:bg-violet-500"
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
      {/* Hero */}
      <div className="container mx-auto max-w-7xl px-4 pb-12 pt-4">
        <div className="relative min-h-[430px] overflow-hidden rounded-3xl bg-[url(/organizers-landing-hero.png)] bg-cover bg-center">
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-violet-950/20" />
          <div className="relative flex min-h-[430px] max-w-3xl flex-col justify-center p-8 md:p-16">
            <div className="mb-5 flex w-fit items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-sm text-violet-200">
              <Sparkles className="h-4 w-4" /> Live experiences, unforgettable nights
            </div>
            <h1 className="mb-5 text-4xl font-black tracking-tight md:text-6xl">
              Your next great story starts with a ticket.
            </h1>
            <p className="mb-8 max-w-xl text-lg text-gray-300">
              Discover concerts, workshops, festivals and remarkable gatherings across Paris.
            </p>
            <div className="flex max-w-2xl gap-2 rounded-2xl border border-white/10 bg-black/50 p-2 backdrop-blur">
              <Input
                className="h-12 border-0 bg-white text-black"
                placeholder="Search by event or venue..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Button className="h-12 bg-violet-600 px-6 hover:bg-violet-500" onClick={queryPublishedEvents}>
                <Search /> <span className="hidden sm:inline">Search</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Published Event Cards */}
      <section className="container mx-auto max-w-7xl px-4 pb-10">
        <div className="mb-7 flex items-end justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-violet-400">Curated for you</p>
            <h2 className="text-3xl font-bold">Upcoming experiences</h2>
          </div>
          <div className="hidden items-center gap-2 text-sm text-gray-400 sm:flex">
            {publishedEvents?.totalElements ?? 0} events <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {publishedEvents?.content?.map((publishedEvent) => (
          <PublishedEventCard
            publishedEvent={publishedEvent}
            key={publishedEvent.id}
          />
        ))}
      </div>

      {publishedEvents?.empty && (
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-xl font-semibold">No events found</h2>
          <p className="mt-2 text-gray-400">
            Try another search or check back soon for new events.
          </p>
        </div>
      )}

      {publishedEvents && (
        <div className="w-full flex justify-center py-8">
          <SimplePagination
            pagination={publishedEvents}
            onPageChange={setPage}
          />{" "}
        </div>
      )}
      </section>
    </div>
  );
};

export default AttendeeLandingPage;
