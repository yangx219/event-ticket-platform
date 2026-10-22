import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { purchaseTicket } from "@/lib/api";
import { ArrowLeft, CheckCircle, CreditCard, LockKeyhole } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate, useParams } from "react-router";

const PurchaseTicketPage: React.FC = () => {
  const { eventId, ticketTypeId } = useParams();
  const { isLoading, user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | undefined>();
  const [isPurchaseSuccess, setIsPurchaseASuccess] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    if (!isPurchaseSuccess) {
      return;
    }
    const timer = setTimeout(() => {
      navigate("/dashboard/tickets");
    }, 3000);

    return () => clearTimeout(timer);
  }, [isPurchaseSuccess, navigate]);

  const handlePurchase = async () => {
    if (isLoading || !user?.access_token || !eventId || !ticketTypeId) {
      return;
    }
    try {
      setError(undefined);
      setIsPurchasing(true);
      await purchaseTicket(user.access_token, eventId, ticketTypeId);
      setIsPurchaseASuccess(true);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === "string") {
        setError(err);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  if (isPurchaseSuccess) {
    return (
      <div className="bg-black min-h-screen text-white flex items-center">
        <div className="max-w-md mx-auto p-8 text-center">
          <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm text-black">
            <div className="space-y-2">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold text-green-600">Thank you!</h2>
              <p className="text-gray-600">
                Your ticket purchase was successful.
              </p>
              <p className="text-gray-600 text-sm">
                Opening your ticket wallet in a few seconds...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050508] px-4 text-white">
      <div className="mx-auto max-w-md py-12 md:py-20">
        <button className="mb-6 flex items-center gap-2 text-sm text-gray-400 hover:text-white" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Back to ticket selection
        </button>
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-400">Demo checkout</p>
          <h1 className="mt-2 text-3xl font-bold">Complete your booking</h1>
          <p className="mt-2 text-gray-400">No real payment will be processed.</p>
        </div>
        <div className="space-y-5 rounded-2xl border border-gray-800 bg-gray-900 p-7 shadow-2xl">
          {error && (
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <div className="text-red-500 text-sm">
                <strong>Error:</strong> {error}
              </div>
            </div>
          )}

          {/* Credit Card Number */}
          <div className="space-y-2">
                <Label className="text-gray-300">Demo Card Number</Label>
            <div className="relative">
              <Input
                type="text"
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                className="border-gray-700 bg-gray-950 text-white pl-10"
              />
              <CreditCard className="absolute h-4 w-4 text-gray-400 top-2.5 left-3" />
            </div>
          </div>

          <div className="space-y-2">
              <Label className="text-gray-300">Cardholder Name</Label>
            <div className="relative">
              <Input
                type="text"
                placeholder="John Smith"
                className="border-gray-700 bg-gray-950 text-white pl-10"
              />
              <CreditCard className="absolute h-4 w-4 text-gray-400 top-2.5 left-3" />
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              className="h-12 w-full bg-violet-600 font-semibold hover:bg-violet-500 cursor-pointer"
              onClick={handlePurchase}
              disabled={isLoading || isPurchasing}
            >
              {isPurchasing ? "Purchasing..." : "Purchase Ticket"}
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 text-center text-xs text-gray-500">
            <LockKeyhole className="h-4 w-4" /> This is a simulation. Never enter real payment details.
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseTicketPage;
