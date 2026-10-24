import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OrderSummary, PublishedEventDetails, PublishedEventTicketTypeDetails } from "@/domain/domain";
import { createOrder, getPublishedEvent } from "@/lib/api";
import { AlertCircle, ArrowLeft, CheckCircle, LockKeyhole, Minus, Plus, ReceiptText, Ticket } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "react-oidc-context";
import { Link, useNavigate, useParams } from "react-router";

const PurchaseTicketPage: React.FC = () => {
  const { eventId, ticketTypeId } = useParams();
  const { isLoading: isAuthLoading, user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<PublishedEventDetails>();
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string>();
  const [order, setOrder] = useState<OrderSummary>();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const ticketType: PublishedEventTicketTypeDetails | undefined = useMemo(
    () => event?.ticketTypes.find((item) => item.id === ticketTypeId),
    [event, ticketTypeId],
  );
  const maximumQuantity = Math.max(1, Math.min(10, ticketType?.totalAvailable ?? 10));

  useEffect(() => {
    if (!eventId) return;
    let active = true;
    getPublishedEvent(eventId)
      .then((result) => active && setEvent(result))
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load checkout");
      });
    return () => { active = false; };
  }, [eventId]);

  const handlePurchase = async () => {
    if (isAuthLoading || !user?.access_token || !eventId || !ticketTypeId || !ticketType) return;
    const storageKey = `eventpilot-order-key:${eventId}:${ticketTypeId}:${quantity}`;
    let idempotencyKey = window.localStorage.getItem(storageKey);
    if (!idempotencyKey) {
      idempotencyKey = crypto.randomUUID();
      window.localStorage.setItem(storageKey, idempotencyKey);
    }

    try {
      setError(undefined);
      setIsPurchasing(true);
      const createdOrder = await createOrder(user.access_token, idempotencyKey, {
        eventId,
        ticketTypeId,
        quantity,
      });
      window.localStorage.removeItem(storageKey);
      setOrder(createdOrder);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to complete checkout");
    } finally {
      setIsPurchasing(false);
    }
  };

  if (order) {
    return (
      <div className="flex min-h-screen items-center bg-[#050508] px-4 text-white">
        <div className="mx-auto w-full max-w-lg rounded-3xl border border-emerald-900 bg-gray-900 p-8 text-center shadow-2xl">
          <CheckCircle className="mx-auto h-16 w-16 text-emerald-400" />
          <p className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Order confirmed</p>
          <h1 className="mt-2 text-3xl font-bold">Your tickets are ready</h1>
          <p className="mt-3 text-gray-400">Order <span className="font-mono text-gray-300">{order.id}</span></p>
          <div className="my-6 rounded-xl bg-gray-950 p-5 text-left">
            <div className="flex justify-between"><span>{order.items[0]?.ticketName}</span><span>× {order.items[0]?.quantity}</span></div>
            <div className="mt-3 flex justify-between border-t border-gray-800 pt-3 font-bold"><span>Total</span><span>{new Intl.NumberFormat("en-GB", { style: "currency", currency: order.currency }).format(order.totalAmount)}</span></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link to="/dashboard/orders"><Button className="w-full bg-violet-600 hover:bg-violet-500"><ReceiptText /> View order</Button></Link>
            <Link to="/dashboard/tickets"><Button variant="outline" className="w-full border-gray-700 bg-transparent"><Ticket /> Open wallet</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  const unitPrice = ticketType?.price ?? 0;
  const total = unitPrice * quantity;

  return (
    <div className="min-h-screen bg-[#050508] px-4 text-white">
      <div className="mx-auto max-w-2xl py-12 md:py-20">
        <button className="mb-7 flex items-center gap-2 text-sm text-gray-400 hover:text-white" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /> Back to ticket selection</button>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-400">Secure demo checkout</p>
        <h1 className="mt-2 text-3xl font-bold">Review your booking</h1>
        <p className="mt-2 text-gray-400">This checkout uses a simulated payment. Never enter real card information.</p>

        {error && <Alert variant="destructive" className="mt-6 border-red-800 bg-red-950/40"><AlertCircle className="h-4 w-4" /><AlertTitle>Checkout failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

        <div className="mt-7 overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl">
          <div className="border-b border-gray-800 p-7"><p className="text-sm text-gray-500">Event</p><h2 className="mt-1 text-2xl font-bold">{event?.name ?? "Loading event..."}</h2><p className="mt-1 text-gray-400">{event?.venue}</p></div>
          <div className="space-y-6 p-7">
            <div className="flex items-start justify-between gap-4"><div><p className="font-semibold">{ticketType?.name ?? "Loading ticket..."}</p><p className="mt-1 text-sm text-gray-400">{ticketType?.description}</p></div><strong>{unitPrice === 0 ? "Free" : `€${unitPrice.toFixed(2)}`}</strong></div>
            <div>
              <Label htmlFor="quantity" className="text-gray-300">Quantity</Label>
              <div className="mt-2 flex w-fit items-center overflow-hidden rounded-lg border border-gray-700">
                <Button variant="ghost" size="icon" disabled={quantity <= 1 || isPurchasing} onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus /></Button>
                <Input id="quantity" type="number" min={1} max={maximumQuantity} value={quantity} onChange={(e) => setQuantity(Math.min(maximumQuantity, Math.max(1, Number(e.target.value) || 1)))} className="h-10 w-16 rounded-none border-y-0 border-gray-700 bg-gray-950 text-center" />
                <Button variant="ghost" size="icon" disabled={quantity >= maximumQuantity || isPurchasing} onClick={() => setQuantity((value) => Math.min(maximumQuantity, value + 1))}><Plus /></Button>
              </div>
              <p className="mt-2 text-xs text-gray-500">Maximum 10 tickets per order. Final availability is checked during checkout.</p>
            </div>
            <div className="rounded-xl bg-gray-950 p-5"><div className="flex justify-between text-gray-400"><span>{ticketType?.name} × {quantity}</span><span>€{total.toFixed(2)}</span></div><div className="mt-4 flex justify-between border-t border-gray-800 pt-4 text-xl font-bold"><span>Total</span><span>€{total.toFixed(2)}</span></div></div>
            <Button className="h-12 w-full bg-violet-600 font-semibold hover:bg-violet-500" onClick={handlePurchase} disabled={isAuthLoading || isPurchasing || !ticketType || ticketType.totalAvailable === 0}>{isPurchasing ? "Creating secure order..." : `Confirm order · €${total.toFixed(2)}`}</Button>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500"><LockKeyhole className="h-4 w-4" /> Idempotency protection prevents duplicate tickets.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseTicketPage;
