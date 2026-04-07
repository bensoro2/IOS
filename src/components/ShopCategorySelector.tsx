 import { useState } from "react";
 import { Check, ChevronDown, Tag } from "lucide-react";
 import { cn } from "@/lib/utils";
 import { Button } from "@/components/ui/button";
 import {
   Command,
   CommandEmpty,
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList,
 } from "@/components/ui/command";
 import {
   Popover,
   PopoverContent,
   PopoverTrigger,
 } from "@/components/ui/popover";
import { SHOP_CATEGORY_GROUPS, getShopCategoryById, getLocalizedShopCategory } from "@/constants/shopCategories";
import { useLanguage } from "@/contexts/LanguageContext";

interface ShopCategorySelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const ShopCategorySelector = ({ value, onValueChange }: ShopCategorySelectorProps) => {
  const [open, setOpen] = useState(false);
  const { t, language } = useLanguage();
 
   const selectedCategory = getShopCategoryById(value);
 
   return (
     <Popover open={open} onOpenChange={setOpen} modal={true}>
       <PopoverTrigger asChild>
         <Button
           variant="outline"
           role="combobox"
           aria-expanded={open}
           className="w-full justify-between font-normal"
         >
           {selectedCategory ? (
             <span className="flex items-center gap-2">
               <Tag className="w-4 h-4 text-primary" />
              <span>{getLocalizedShopCategory(selectedCategory.name, language)}</span>
             </span>
           ) : (
             <span className="flex items-center gap-2 text-muted-foreground">
               <Tag className="w-4 h-4" />
               {t("shop.searchCategory")}
             </span>
           )}
           <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
         </Button>
       </PopoverTrigger>
       <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
         <Command>
            <CommandInput placeholder={t("shop.searchCategoryInput")} />
            <CommandList className="max-h-[300px]">
              <CommandEmpty>{t("shop.noCategoryFound")}</CommandEmpty>
             {SHOP_CATEGORY_GROUPS.map((group) => (
                <CommandGroup key={group.id} heading={`${group.emoji} ${getLocalizedShopCategory(group.name, language)}`}>
                  {group.categories.map((category) => (
                    <CommandItem
                      key={category.id}
                      value={`${category.name} ${getLocalizedShopCategory(category.name, language)} ${category.emoji} ${group.name}`}
                      onSelect={() => {
                        onValueChange(category.id);
                        setOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <span className="flex items-center gap-2 flex-1">
                        <span>{category.emoji}</span>
                        <span>{getLocalizedShopCategory(category.name, language)}</span>
                      </span>
                     <Check
                       className={cn(
                         "h-4 w-4",
                         value === category.id ? "opacity-100" : "opacity-0"
                       )}
                     />
                   </CommandItem>
                 ))}
               </CommandGroup>
             ))}
           </CommandList>
         </Command>
       </PopoverContent>
     </Popover>
   );
 };