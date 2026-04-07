import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ProvinceSelector } from "@/components/ProvinceSelector";
import { CreateShopDialog } from "@/components/CreateShopDialog";
import { ShopCard } from "@/components/ShopCard";
import { ShopCategorySelector } from "@/components/ShopCategorySelector";
import { 
  Store, 
  Plus, 
  Loader2,
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useLanguage } from "@/contexts/LanguageContext";
import { getSelectedCountryCode, getDefaultProvince } from "@/constants/countryProvinces";
 
 const Shop = () => {
   const [user, setUser] = useState<any>(null);
   const savedProvince = localStorage.getItem("selected_province");
   const [selectedProvince, setSelectedProvince] = useState(savedProvince || getDefaultProvince(getSelectedCountryCode()));
   const [selectedCategory, setSelectedCategory] = useState("");
   const [loading, setLoading] = useState(true);
   const [shops, setShops] = useState<any[]>([]);
   const [shopsLoading, setShopsLoading] = useState(false);
   const navigate = useNavigate();
   const { t } = useLanguage();
 
  const fetchShops = async (province: string, category?: string) => {
    setShopsLoading(true);
    try {
      let query = supabase
        .from("shops")
        .select("*")
        .eq("province", province);
      
      if (category && category.trim()) {
        query = query.eq("category", category);
      }
      
      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      setShops(data || []);
    } catch (error) {
      console.error("Error fetching shops:", error);
    } finally {
      setShopsLoading(false);
    }
  };
 
   useEffect(() => {
     const { data: { subscription } } = supabase.auth.onAuthStateChange(
       (event, session) => {
         setUser(session?.user ?? null);
         setLoading(false);
       }
     );
 
     supabase.auth.getSession().then(({ data: { session } }) => {
       setUser(session?.user ?? null);
       setLoading(false);
     });
 
     fetchShops(selectedProvince);
 
     return () => subscription.unsubscribe();
   }, []);
 
  useEffect(() => {
    fetchShops(selectedProvince, selectedCategory);
  }, [selectedProvince, selectedCategory]);
 
   if (loading) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
       </div>
     );
   }
 
   if (!user) {
     navigate("/auth");
     return null;
   }
 
   return (
     <div className="min-h-screen bg-background text-foreground flex flex-col">
       {/* Header */}
       <header className="flex items-center justify-between px-4 py-3 bg-card">
         <div className="flex items-center gap-3">
           <div className="p-2 rounded-full bg-muted">
             <Store className="w-5 h-5" />
           </div>
           <div>
            <h1 className="font-semibold text-lg">{t("shop.title")}</h1>
              <p className="text-sm text-muted-foreground">{t("shop.subtitle")}</p>
           </div>
         </div>
        <CreateShopDialog 
          selectedProvince={selectedProvince} 
          onShopCreated={() => fetchShops(selectedProvince, selectedCategory)} 
        />
      </header>

      {/* Province Selector */}
      <div className="px-4 py-2 bg-card border-b border-border">
        <ProvinceSelector 
          selectedProvince={selectedProvince} 
          onSelect={(p) => { setSelectedProvince(p); localStorage.setItem("selected_province", p); }} 
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 px-4 py-4 space-y-4">
        {/* Category Filter */}
        <div>
          <p className="text-sm text-muted-foreground mb-1">{t("shop.category")}</p>
          <ShopCategorySelector
            value={selectedCategory}
            onValueChange={(val) => setSelectedCategory(val === selectedCategory ? "" : val)}
          />
        </div>
 
         {/* Shops List */}
         <div className="space-y-4 pb-24">
           {shopsLoading ? (
             <div className="flex items-center justify-center py-12">
               <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
             </div>
           ) : shops.length === 0 ? (
             <div className="bg-card rounded-2xl p-12 flex flex-col items-center justify-center">
               <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                 <Store className="w-8 h-8 text-muted-foreground" />
               </div>
               <p className="text-muted-foreground mb-4">{t("shop.noShops")}</p>
              <CreateShopDialog 
                selectedProvince={selectedProvince}
                onShopCreated={() => fetchShops(selectedProvince, selectedCategory)}
                 trigger={
                   <button className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                     <Plus className="w-4 h-4" />
                     {t("shop.addShop")}
                   </button>
                 }
               />
             </div>
           ) : (
             <div className="space-y-4">
               {shops.map((shop) => (
                 <ShopCard
                   key={shop.id}
                   id={shop.id}
                    userId={shop.user_id}
                   name={shop.name}
                   description={shop.description}
                   imageUrl={shop.image_url}
                   category={shop.category}
                   province={shop.province}
                   isOwner={user?.id === shop.user_id}
                  onUpdate={() => fetchShops(selectedProvince, selectedCategory)}
                  onDelete={() => fetchShops(selectedProvince, selectedCategory)}
                 />
               ))}
             </div>
           )}
         </div>
       </main>
 
       {/* Bottom Navigation */}
       <BottomNav />
     </div>
   );
 };
 
 export default Shop;