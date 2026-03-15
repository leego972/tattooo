import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, CheckCircle, XCircle, DollarSign, ArrowRight } from "lucide-react";

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "border-yellow-500/30 text-yellow-400", icon: Clock },
  quote_sent: { label: "Quote Received!", color: "border-cyan-400/40 text-cyan-300", icon: DollarSign },
  deposit_paid: { label: "Deposit Paid", color: "border-cyan-500/30 text-cyan-400", icon: DollarSign },
  confirmed: { label: "Confirmed", color: "border-green-500/30 text-green-400", icon: CheckCircle },
  completed: { label: "Completed", color: "border-purple-500/30 text-purple-400", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "border-red-500/30 text-red-400", icon: XCircle },
};

export default function Bookings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) {
    setLocation("/login");
    return null;
  }

  return <BookingsContent />;
}

function BookingsContent() {
  const [, setLocation] = useLocation();
  const { data: bookingsList, isLoading } = trpc.artists.myBookings.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!bookingsList || bookingsList.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center gap-4 p-6">
        <Calendar className="w-16 h-16 text-white/20" />
        <h2 className="text-xl font-bold">No bookings yet</h2>
        <p className="text-white/50 text-center max-w-sm">
          Browse our verified tattoo artists and book a session to bring your AI design to life.
        </p>
        <Button
          className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
          onClick={() => setLocation("/artists")}
        >
          Browse Artists <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">My Bookings</h1>

        <div className="space-y-4">
          {bookingsList.map((booking) => {
            const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusConfig.icon;

            return (
              <Card key={booking.id} className="bg-[#111] border-white/10">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-white">Booking #{booking.id}</span>
                        <Badge variant="outline" className={statusConfig.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>

                      {booking.message && (
                        <p className="text-sm text-white/50 mb-3 line-clamp-2">{booking.message}</p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-white/40">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </span>
                        {booking.depositAmountCents && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            ${(booking.depositAmountCents / 100).toFixed(2)} deposit
                          </span>
                        )}
                      </div>
                    </div>

                    {booking.status === "pending" && (
                      <Button
                        size="sm"
                        className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold shrink-0"
                        onClick={() => {
                          // Redirect to Stripe checkout if needed
                          window.location.href = `/artists`;
                        }}
                      >
                        Pay Deposit
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
