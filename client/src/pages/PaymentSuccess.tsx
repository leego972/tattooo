import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { CheckCircle, Sparkles } from "lucide-react";

export default function PaymentSuccess() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  useEffect(() => {
    // Refresh credit balance after successful payment
    utils.credits.balance.invalidate();
  }, [utils]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Payment Successful!</h1>
        <p className="text-zinc-400 mb-8">
          Your credits have been added to your account. Start designing your perfect tattoo now!
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => navigate("/studio")}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Start Designing
          </Button>
          <Button
            onClick={() => navigate("/my-tatts")}
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            View My Tatts
          </Button>
        </div>
      </div>
    </div>
  );
}
