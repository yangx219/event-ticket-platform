import NavBar from "@/components/nav-bar";
import { SimplePagination } from "@/components/simple-pagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SpringBootPagination, TicketSummary } from "@/domain/domain";
import { listTickets } from "@/lib/api";
import { AlertCircle, ArrowRight, DollarSign, Tag, Ticket } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { Link } from "react-router";

const DashboardListTickets: React.FC = () => {
  const { isLoading, user } = useAuth();

  const [tickets, setTickets] = useState<
    SpringBootPagination<TicketSummary> | undefined
  >();
  const [error, setError] = useState<string | undefined>();
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (isLoading || !user?.access_token) {
      return;
    }

    const doUseEffect = async () => {
      try {
        setTickets(await listTickets(user.access_token, page));
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else if (typeof err === "string") {
          setError(err);
        } else {
          setError("An unknown error occurred");
        }
      }
    };

    doUseEffect();
  }, [isLoading, user?.access_token, page]);

  if (error) {
    return (
      <div className="bg-black min-h-screen text-white">
        <NavBar />
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

      {/* Title */}
      <div className="container mx-auto max-w-6xl py-8 px-4">
        <h1 className="text-2xl font-bold">Your Tickets</h1>
        <p>Tickets you have purchased</p>
      </div>

      {tickets?.empty && (
        <div className="container mx-auto max-w-2xl px-4 py-20 text-center">
          <Ticket className="mx-auto mb-5 h-14 w-14 text-violet-400" />
          <h2 className="text-2xl font-bold">Your ticket wallet is empty</h2>
          <p className="mx-auto mt-3 max-w-md text-gray-400">
            Explore upcoming experiences, choose a ticket type and complete the simulated purchase.
          </p>
          <Link to="/">
            <Button className="mt-6 bg-violet-600 hover:bg-violet-500">
              Browse events <ArrowRight />
            </Button>
          </Link>
        </div>
      )}
      <div className="container mx-auto grid max-w-6xl gap-5 px-4 md:grid-cols-2">
        {tickets?.content.map((ticketItem) => (
          <Link key={ticketItem.id} to={`/dashboard/tickets/${ticketItem.id}`}>
            <Card className="h-full border-gray-700 bg-gray-900 text-white transition-colors hover:border-violet-500">
              <CardHeader>
                <div className="flex justify-between">
                  <div className="flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-gray-400" />
                    <h3 className="font-bold text-xl">
                      {ticketItem.ticketType.name}
                    </h3>
                  </div>
                  <span>{ticketItem.status}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Price */}
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <p className="font-medium">${ticketItem.ticketType.price}</p>
                </div>

                {/* Ticket ID */}
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-gray-400" />
                  <div>
                    <h4 className="font-medium">Ticket ID</h4>
                    <p className="text-gray-400 font-mono text-sm">
                      {ticketItem.id}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <div className="flex justify-center py-8">
        {tickets && (
          <SimplePagination pagination={tickets} onPageChange={setPage} />
        )}
      </div>
    </div>
  );
};

export default DashboardListTickets;
