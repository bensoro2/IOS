import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RotateCw } from "lucide-react";
import levelCoinImg from "@/assets/level-coin.png";

const FUNDING_TARGET = 1_000_000_000_000;

export const FundingBar = () => {
  const navigate = useNavigate();
  const [currentAmount, setCurrentAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [direction, setDirection] = useState<"increase" | "decrease">("increase");
  const [amount, setAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userCoins, setUserCoins] = useState(0);

  const fetchPool = useCallback(async () => {
    const { data } = await (supabase as any)
      .from("funding_pool")
      .select("current_amount, target_amount")
      .eq("is_active", true)
      .maybeSingle();
    if (data) setCurrentAmount(data.current_amount);
    setLoading(false);
  }, []);

  const fetchUserCoins = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await (supabase as any)
      .from("users")
      .select("hope_coins")
      .eq("id", user.id)
      .maybeSingle();
    if (data) setUserCoins(data.hope_coins || 0);
  }, []);

  useEffect(() => {
    fetchPool();
  }, [fetchPool]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPool();
    setRefreshing(false);
  };

  const parsedAmount = parseInt(amount);
  const isOverBalance = parsedAmount > userCoins;
  const isDecreaseOverLimit = direction === "decrease" && parsedAmount > currentAmount;

  const handleSubmit = async () => {
    if (!parsedAmount || parsedAmount < 10) {
      toast.error("กรุณาระบุจำนวนอย่างน้อย 10");
      return;
    }
    if (isDecreaseOverLimit) return;

    setProcessing(true);
    try {
      const { data, error } = await (supabase as any).rpc("spend_hope_coins_on_funding", {
        _amount: parsedAmount,
        _direction: direction,
      });

      if (error) throw error;

      if (data?.error) {
        if (data.error === "insufficient_coins") {
          toast.error(`เหรียญไม่เพียงพอ (คงเหลือ ${data.balance})`);
        } else if (data.error === "exceeds_pool") {
          toast.error("ไม่สามารถลดแต้มเกินยอดปัจจุบัน");
        } else {
          toast.error(data.error);
        }
        return;
      }

      if (data?.was_reset) {
        toast.success("🎉 เป้าหมายครบแล้ว! รีเซ็ต EXP และเลเวลทั้งหมด");
      } else {
        toast.success(direction === "increase" ? "เพิ่มแต้มสำเร็จ!" : "ลดแต้มสำเร็จ!");
      }

      if (typeof data?.current_amount === "number") setCurrentAmount(data.current_amount);
      if (typeof data?.coins_remaining === "number") setUserCoins(data.coins_remaining);
      else fetchUserCoins();

      setDialogOpen(false);
      setAmount("");
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setProcessing(false);
    }
  };

  const percentage = Math.min(100, (currentAmount / FUNDING_TARGET) * 100);

  if (loading) return null;

  return (
    <div className="px-4 pt-3 pb-0">
      {/* Progress bar */}
      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="relative w-full h-8 rounded-full bg-secondary overflow-hidden border border-border active:opacity-80 disabled:opacity-70 cursor-pointer"
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${Math.max(3, percentage)}%`,
            background: "linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(280 70% 55%) 100%)",
          }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground drop-shadow-sm gap-1">
          {refreshing && <RotateCw className="w-3 h-3 animate-spin" />}
          {currentAmount.toLocaleString()}/{FUNDING_TARGET.toLocaleString()}
        </span>
      </button>

      <div className="flex items-center justify-between mt-1.5">
        <button
          onClick={() => { setDirection("decrease"); setAmount(""); fetchUserCoins(); setDialogOpen(true); }}
          className="text-sm font-bold text-primary px-4 py-1 rounded-full border border-primary active:opacity-70"
        >
          📉 ลดแต้ม
        </button>

        {/* Center coin button → navigate to purchase page */}
        <button
          onClick={() => navigate("/hope-coins")}
          className="active:scale-90 transition-transform"
        >
          <img src={levelCoinImg} alt="Level Coin" className="w-10 h-10" />
        </button>

        <button
          onClick={() => { setDirection("increase"); setAmount(""); fetchUserCoins(); setDialogOpen(true); }}
          className="text-sm font-bold text-primary px-4 py-1 rounded-full border border-primary active:opacity-70"
        >
          💰 เพิ่มแต้ม
        </button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {direction === "increase" ? "💰 เพิ่มแต้ม" : "📉 ลดแต้ม"} (Level Coin)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              ระบุจำนวน Level Coin ที่ต้องการ{direction === "increase" ? "เพิ่ม" : "ลด"}แต้มในหลอด
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <img src={levelCoinImg} alt="Level Coin" className="w-5 h-5" />
              คงเหลือ: <span className="font-bold text-foreground">{userCoins.toLocaleString()}</span> coin
            </div>
            <Input
              type="number"
              placeholder="ระบุจำนวน Level Coin (ขั้นต่ำ 10)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={1}
              autoFocus
            />
            {isOverBalance && (
              <p className="text-sm text-destructive">
                เหรียญไม่เพียงพอ (คงเหลือ {userCoins.toLocaleString()})
              </p>
            )}
            {isDecreaseOverLimit && (
              <p className="text-sm text-destructive">
                ไม่สามารถลดเกินยอดปัจจุบัน ({currentAmount.toLocaleString()})
              </p>
            )}
            <Button
              onClick={handleSubmit}
              disabled={processing || isOverBalance || isDecreaseOverLimit || !parsedAmount}
              className="w-full"
            >
              {processing ? "กำลังดำเนินการ..." : "ยืนยัน"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
