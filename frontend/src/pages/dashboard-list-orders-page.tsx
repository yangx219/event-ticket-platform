import NavBar from "@/components/nav-bar";
import { SimplePagination } from "@/components/simple-pagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { OrderSummary, SpringBootPagination } from "@/domain/domain";
import { listOrders } from "@/lib/api";
import { AlertCircle, ArrowRight, CalendarClock, ClipboardList, CreditCard, Ticket } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { Link } from "react-router";

const money = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(amount);

const DashboardListOrdersPage: React.FC = () => {
  const { isLoading, user } = useAuth();
  const [orders, setOrders] = useState<SpringBootPagination<OrderSummary>>();
  const [error, setError] = useState<string>();
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (isLoading || !user?.access_token) return;
    let active = true;
    listOrders(user.access_token, page)
      .then((result) => active && setOrders(result))
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load orders");
      });
    return () => { active = false; };
  }, [isLoading, user?.access_token, page]);

  return (
    <div className="min-h-screen bg-black text-white">
      <NavBar />
      <main className="container mx-auto max-w-6xl px-4 py-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-400">Purchase history</p>
        <h1 className="mt-2 text-3xl font-bold">My Orders</h1>
        <p className="mt-2 text-gray-400">Payment records, purchased items and issued tickets.</p>

        {error && (
          <Alert variant="destructive" className="mt-8 border-red-800 bg-red-950/40">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Could not load orders</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {orders?.empty && (
          <div className="py-24 text-center">
            <ClipboardList className="mx-auto h-14 w-14 text-violet-400" />
            <h2 className="mt-5 text-2xl font-bold">No orders yet</h2>
            <p className="mt-2 text-gray-400">Your completed bookings will appear here.</p>
            <Link to="/"><Button className="mt-6 bg-violet-600 hover:bg-violet-500">Browse events <ArrowRight /></Button></Link>
          </div>
        )}

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {orders?.content.map((order) => (
            <Card key={order.id} className="border-gray-800 bg-gray-900 text-white">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <p className="font-mono text-xs text-gray-500">{order.id}</p>
                  <h2 className="mt-2 text-xl font-bold">{order.items[0]?.ticketName ?? "Ticket order"}</h2>
                </div>
                <Badge className={order.status === "PAID" ? "bg-emerald-600" : "bg-gray-700"}>{order.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-center justify-between rounded-lg bg-gray-950 p-4">
                  <span className="flex items-center gap-2 text-gray-400"><CreditCard className="h-4 w-4" /> Total</span>
                  <strong className="text-lg">{money(order.totalAmount, order.currency)}</strong>
                </div>
                <div className="flex items-center gap-2 text-gray-300"><Ticket className="h-4 w-4 text-violet-400" /> {order.items.reduce((sum, item) => sum + item.quantity, 0)} ticket(s) issued</div>
                <div className="flex items-center gap-2 text-gray-400"><CalendarClock className="h-4 w-4" /> {new Date(order.createdAt).toLocaleString()}</div>
                <div className="flex flex-wrap gap-2">
                  {order.items.flatMap((item) => item.ticketIds).map((ticketId, index) => (
                    <Link key={ticketId} to={`/dashboard/tickets/${ticketId}`}>
                      <Button variant="outline" size="sm" className="border-gray-700 bg-transparent">Open ticket {index + 1}</Button>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {orders && !orders.empty && <div className="flex justify-center py-10"><SimplePagination pagination={orders} onPageChange={setPage} /></div>}
      </main>
    </div>
  );
};

export default DashboardListOrdersPage;
