import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Minus, Plus } from "lucide-react";
import levelCoinImg from "@/assets/level-coin.png";
import { COIN_PACKAGES, CoinPackage } from "@/config/hopeCoinPackages";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const LS_PENDING_COIN = "coin_pending_session";

const HopeCoins = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [buyingPackage, setBuyingPackage] = useState<number | null>(null);
  const [selectedPkg, setSelectedPkg] = useState<CoinPackage | null>(null);
  const [quantity, setQuantity] = useState(1);

  const fetchBalance = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await (supabase as any)
      .from("users")
      .select("hope_coins")
      .eq("id", user.id)
      .maybeSingle();
    if (data) setBalance(data.hope_coins || 0);
    setLoading(false);
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  // Verify purchase from URL or localStorage
  useEffect(() => {
    const purchase = searchParams.get("purchase");
    const sessionId = searchParams.get("session_id");
    if (purchase === "success" && sessionId) {
      localStorage.removeItem(LS_PENDING_COIN);
      verifyPurchase(sessionId);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("purchase");
      newParams.delete("session_id");
      setSearchParams(newParams, { replace: true });
    } else {
      const pending = localStorage.getItem(LS_PENDING_COIN);
      if (pending) verifyPurchase(pending);
    }
  }, []);

  const verifyPurchase = async (sessionId: string, retryCount = 0) => {
    const MAX_RETRIES = 10;
    const RETRY_DELAY = 3000;
    try {
      if (retryCount === 0) {
        toast.loading("กำลังตรวจสอบการซื้อ...", { id: "verify-coin" });
      }
      const { data, error } = await supabase.functions.invoke("verify-coin-purchase", {
        body: { session_id: sessionId },
      });
      if (error) throw error;
      if (data?.success && !data?.already_processed) {
        localStorage.removeItem(LS_PENDING_COIN);
        toast.success(`ได้รับ ${data.coins_added} Level Coin!`, { id: "verify-coin" });
        setBalance(data.new_balance);
      } else if (data?.already_processed) {
        localStorage.removeItem(LS_PENDING_COIN);
        toast.success("รายการนี้ตรวจสอบแล้ว", { id: "verify-coin" });
        fetchBalance();
      } else if (data?.pending && retryCount < MAX_RETRIES) {
        // PromptPay is async, retry after delay
        toast.loading(`รอการยืนยันจาก PromptPay... (${retryCount + 1}/${MAX_RETRIES})`, { id: "verify-coin" });
        setTimeout(() => verifyPurchase(sessionId, retryCount + 1), RETRY_DELAY);
      } else {
        localStorage.removeItem(LS_PENDING_COIN);
        toast.info("การชำระเงินยังไม่เสร็จ กรุณาลองใหม่ภายหลัง", { id: "verify-coin" });
      }
    } catch {
      toast.error("ไม่สามารถตรวจสอบการซื้อได้", { id: "verify-coin" });
    }
  };

  const openPurchaseDialog = (pkg: CoinPackage) => {
    setSelectedPkg(pkg);
    setQuantity(1);
  };

  const totalCoins = selectedPkg ? selectedPkg.coins * quantity : 0;
  const totalPrice = selectedPkg ? selectedPkg.price * quantity : 0;

  const handleBuy = async () => {
    if (!selectedPkg) return;
    setBuyingPackage(selectedPkg.coins);
    try {
      const { data, error } = await supabase.functions.invoke("create-coin-checkout", {
        body: { coins: selectedPkg.coins, quantity },
      });
      if (error) throw error;
      if (data?.url) {
        if (data.session_id) localStorage.setItem(LS_PENDING_COIN, data.session_id);
        window.location.href = data.url;
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ");
    } finally {
      setBuyingPackage(null);
      setSelectedPkg(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <img src={levelCoinImg} alt="Level Coin" className="w-6 h-6" />
          <h1 className="font-semibold text-lg">Level Coin</h1>
        </div>
        <div className="w-9" />
      </header>

      {/* Balance */}
      <div className="px-4 py-5 text-center">
        <p className="text-sm text-muted-foreground">ยอดเหรียญของคุณ</p>
        <div className="flex items-center justify-center gap-2 mt-1">
          <img src={levelCoinImg} alt="Level Coin" className="w-8 h-8" />
          <span className="text-3xl font-bold text-foreground">
            {loading ? "..." : balance.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Packages grid */}
      <main className="flex-1 overflow-y-auto pb-20 px-4">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">เลือกแพ็คเกจ</h2>
        <div className="grid grid-cols-3 gap-3">
          {COIN_PACKAGES.map((pkg) => (
            <button
              key={pkg.coins}
              onClick={() => openPurchaseDialog(pkg)}
              disabled={buyingPackage !== null}
              className="relative flex flex-col items-center gap-1 p-4 rounded-xl border border-border bg-card hover:border-primary/50 active:scale-[0.97] transition-all disabled:opacity-50"
            >
              {pkg.bonus && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                  -{pkg.bonus}
                </span>
              )}
              <img src={levelCoinImg} alt="Level Coin" className="w-10 h-10" />
              <span className="font-bold text-foreground">{pkg.label} coin</span>
              <span className="text-xs text-muted-foreground">
                ฿{pkg.price.toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </main>

      {/* Purchase Dialog */}
      <Dialog open={!!selectedPkg} onOpenChange={(open) => !open && setSelectedPkg(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <img src={levelCoinImg} alt="Level Coin" className="w-6 h-6" />
              ซื้อ Level Coin
            </DialogTitle>
          </DialogHeader>
          {selectedPkg && (
            <div className="space-y-5 pt-2">
              <div className="text-center">
                <img src={levelCoinImg} alt="Level Coin" className="w-14 h-14 mx-auto" />
                <p className="font-bold text-lg text-foreground mt-2">
                  {selectedPkg.label} coin
                </p>
                <p className="text-sm text-muted-foreground">
                  ฿{selectedPkg.price.toLocaleString()} / แพ็ค
                </p>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center active:scale-90 transition-transform disabled:opacity-30"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="text-2xl font-bold text-foreground min-w-[3rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center active:scale-90 transition-transform"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Summary */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">จำนวนเหรียญ</span>
                  <span className="font-bold text-foreground">{totalCoins.toLocaleString()} coin</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ราคารวม</span>
                  <span className="font-bold text-primary">฿{totalPrice.toLocaleString()}</span>
                </div>
              </div>

              <Button
                onClick={handleBuy}
                disabled={buyingPackage !== null}
                className="w-full"
              >
                {buyingPackage !== null ? "กำลังสร้างคำสั่งซื้อ..." : `ซื้อ ฿${totalPrice.toLocaleString()}`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HopeCoins;
