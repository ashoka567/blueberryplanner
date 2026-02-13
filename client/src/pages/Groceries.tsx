import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Plus, Trash2, ShoppingCart, ShoppingBasket, X, Check, Loader2, Store, Undo2, Sparkles, RotateCcw } from "lucide-react";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useCurrentFamily, useGroceryItems, useCreateGroceryItem, useUpdateGroceryItem, useDeleteGroceryItem, useGroceryEssentials, useGroceryStores, useGroceryBuyAgain, useCreateGroceryBuyAgain, useCreateGroceryEssential, useCreateGroceryStore } from "@/hooks/useData";
import { cn } from "@/lib/utils";

const CATEGORIES = ['Vegetables', 'Fruits', 'Dairy', 'Snacks', 'Medicine', 'Beverages', 'Meat', 'Pantry', 'Frozen', 'Other'];
const ESSENTIALS = ['Milk', 'Eggs', 'Bread', 'Rice', 'Butter', 'Cheese', 'Chicken', 'Onions', 'Tomatoes', 'Bananas'];

export default function GroceriesPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const family = useCurrentFamily();
  const { data: items = [], isLoading } = useGroceryItems(family?.id);
  const createItem = useCreateGroceryItem(family?.id);
  const updateItem = useUpdateGroceryItem();
  const deleteItem = useDeleteGroceryItem();
  
  const { data: essentialsFromDb = [] } = useGroceryEssentials(family?.id);
  const { data: storesFromDb = [] } = useGroceryStores(family?.id);
  const { data: buyAgainFromDb = [] } = useGroceryBuyAgain(family?.id);
  const createBuyAgain = useCreateGroceryBuyAgain(family?.id);
  const createEssential = useCreateGroceryEssential(family?.id);
  const createStore = useCreateGroceryStore(family?.id);
  
  const [quickInput, setQuickInput] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'store'>('list');

  const parseQuickInput = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return null;

    let name = '';
    let quantity = '';
    let store = '';

    let remaining = trimmed;

    // Check for store using @ symbol (e.g., "Milk 2L @Publix")
    const atMatch = remaining.match(/@\s*(.+)$/i);
    if (atMatch) {
      store = atMatch[1].trim();
      remaining = remaining.replace(/@\s*.+$/, '').trim();
    }

    // Extract quantity
    const qtyMatch = remaining.match(/\b(\d+(\.\d+)?\s*(kg|g|l|ml|lb|oz|pack|pcs|L)?)\b/i);
    if (qtyMatch) {
      quantity = qtyMatch[1].trim();
      remaining = remaining.replace(qtyMatch[0], '').trim();
    }

    name = remaining.replace(/\s+/g, ' ').trim();
    return { name, quantity, store };
  };

  const handleQuickAdd = () => {
    if (!quickInput.trim() || !family?.id) return;
    
    const parsed = parseQuickInput(quickInput);
    if (!parsed || !parsed.name) {
      toast({ title: "Invalid input", description: "Please enter at least an item name.", variant: "destructive" });
      return;
    }

    const category = guessCategory(parsed.name);

    createItem.mutate({
      name: parsed.name,
      quantity: parsed.quantity || null,
      store: parsed.store || 'Other',
      category,
      status: 'NEEDED',
    }, {
      onSuccess: () => {
        setQuickInput('');
        toast({ title: "Added!", description: `${parsed.name} added to your list.` });
      }
    });
  };

  const guessCategory = (name: string): string => {
    const lower = name.toLowerCase();
    if (['apple', 'banana', 'orange', 'grape', 'mango', 'strawberry', 'blueberry'].some(f => lower.includes(f))) return 'Fruits';
    if (['carrot', 'potato', 'onion', 'tomato', 'lettuce', 'spinach', 'broccoli', 'cucumber'].some(v => lower.includes(v))) return 'Vegetables';
    if (['milk', 'cheese', 'yogurt', 'butter', 'cream'].some(d => lower.includes(d))) return 'Dairy';
    if (['chips', 'cookie', 'candy', 'chocolate', 'popcorn'].some(s => lower.includes(s))) return 'Snacks';
    if (['medicine', 'vitamin', 'aspirin', 'tylenol'].some(m => lower.includes(m))) return 'Medicine';
    if (['water', 'juice', 'soda', 'coffee', 'tea'].some(b => lower.includes(b))) return 'Beverages';
    if (['chicken', 'beef', 'pork', 'fish', 'salmon', 'shrimp'].some(m => lower.includes(m))) return 'Meat';
    if (['rice', 'pasta', 'flour', 'sugar', 'oil', 'salt'].some(p => lower.includes(p))) return 'Pantry';
    if (['frozen', 'ice cream', 'pizza'].some(f => lower.includes(f))) return 'Frozen';
    return 'Other';
  };

  const moveToGot = (id: string) => {
    const item = items.find(i => i.id === id);
    const currentCount = item?.purchaseCount || 0;
    updateItem.mutate({ id, updates: { status: 'GOT', purchaseCount: currentCount + 1 } });
  };

  const moveToNeeded = (id: string) => {
    updateItem.mutate({ id, updates: { status: 'NEEDED' } });
  };

  const removeItem = (id: string) => {
    const item = items.find(i => i.id === id);
    if (item && item.purchaseCount && item.purchaseCount > 0) {
      const existingBuyAgain = buyAgainFromDb.find(b => b.name.toLowerCase() === item.name.toLowerCase());
      if (!existingBuyAgain) {
        createBuyAgain.mutate({
          name: item.name,
          category: item.category || undefined,
          store: item.store || undefined,
          quantity: item.quantity || undefined,
          purchaseCount: item.purchaseCount,
        });
      }
    }
    deleteItem.mutate(id);
  };

  const neededItems = useMemo(() => items.filter(i => i.status === 'NEEDED' || i.status === 'PENDING'), [items]);
  const gotItems = useMemo(() => items.filter(i => i.status === 'GOT' || i.status === 'CHECKED'), [items]);
  const activeItems = useMemo(() => items.filter(i => i.status !== 'ARCHIVED'), [items]);

  const itemsByStore = useMemo(() => {
    const grouped: Record<string, typeof neededItems> = {};
    neededItems.forEach(item => {
      const store = item.store || 'No Store';
      if (!grouped[store]) grouped[store] = [];
      grouped[store].push(item);
    });
    return grouped;
  }, [neededItems]);

  const frequentItems = useMemo(() => {
    return buyAgainFromDb
      .sort((a, b) => (b.purchaseCount || 1) - (a.purchaseCount || 1))
      .slice(0, 15)
      .map(item => ({ name: item.name, store: item.store || 'Other' }));
  }, [buyAgainFromDb]);

  const missingEssentials = useMemo(() => {
    const neededNames = neededItems.map(i => i.name.toLowerCase());
    const essentialsList = essentialsFromDb.length > 0 
      ? essentialsFromDb.map(e => e.name)
      : ESSENTIALS;
    return essentialsList.filter(e => !neededNames.some(n => n.includes(e.toLowerCase())));
  }, [neededItems, essentialsFromDb]);

  const frequentStores = useMemo(() => {
    if (storesFromDb.length > 0) {
      return storesFromDb.slice(0, 15).map(s => s.name);
    }
    const storeCounts: Record<string, number> = {};
    items.forEach(item => {
      if (item.store && item.store !== 'Other') {
        storeCounts[item.store] = (storeCounts[item.store] || 0) + 1;
      }
    });
    return Object.entries(storeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([store]) => store);
  }, [items, storesFromDb]);

  const addSuggestion = (name: string, store: string = 'Other') => {
    if (!family?.id) return;
    createItem.mutate({
      name,
      category: guessCategory(name),
      store,
      status: 'NEEDED',
    }, {
      onSuccess: () => {
        toast({ title: "Added!", description: `${name} added to your list.` });
      }
    });
  };

  const saveToBuyAgainAndDelete = (item: typeof items[0]) => {
    if (item.purchaseCount && item.purchaseCount > 0) {
      const existingBuyAgain = buyAgainFromDb.find(b => b.name.toLowerCase() === item.name.toLowerCase());
      if (!existingBuyAgain) {
        createBuyAgain.mutate({
          name: item.name,
          category: item.category || undefined,
          store: item.store || undefined,
          quantity: item.quantity || undefined,
          purchaseCount: item.purchaseCount,
        });
      }
    }
    deleteItem.mutate(item.id);
  };

  const clearAllItems = () => {
    activeItems.forEach(item => saveToBuyAgainAndDelete(item));
    toast({ title: "Cleared!", description: `${activeItems.length} items deleted.` });
  };

  const clearAllGotIt = () => {
    gotItems.forEach(item => saveToBuyAgainAndDelete(item));
    toast({ title: "Cleared!", description: `${gotItems.length} items deleted.` });
  };

  const clearAllNeed = () => {
    neededItems.forEach(item => saveToBuyAgainAndDelete(item));
    toast({ title: "Cleared!", description: `${neededItems.length} items deleted.` });
  };

  const clearByStore = (store: string) => {
    const storeItems = neededItems.filter(i => (i.store || 'No Store') === store);
    storeItems.forEach(item => saveToBuyAgainAndDelete(item));
    toast({ title: "Cleared!", description: `${storeItems.length} items from ${store} deleted.` });
  };

  const storeNames = useMemo(() => {
    const stores = new Set<string>();
    neededItems.forEach(item => {
      stores.add(item.store || 'No Store');
    });
    return Array.from(stores);
  }, [neededItems]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#D2691E]" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center justify-end gap-2 relative z-[100]">
        <Button 
          variant={viewMode === 'list' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setViewMode('list')}
          className={viewMode === 'list' ? 'bg-[#D2691E] hover:bg-[#B8581A]' : ''}
        >
          <ShoppingBasket className="h-4 w-4 mr-1" /> List
        </Button>
        <Button 
          variant={viewMode === 'store' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setViewMode('store')}
          className={viewMode === 'store' ? 'bg-[#D2691E] hover:bg-[#B8581A]' : ''}
        >
          <Store className="h-4 w-4 mr-1" /> Store
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="border-[#D2691E] text-[#D2691E] hover:bg-[#D2691E]/10" data-testid="button-clear-groceries">
              <Trash2 className="h-4 w-4 mr-1" /> Clear
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-52 bg-white shadow-lg border rounded-md">
            <DropdownMenuItem onClick={clearAllItems} className="gap-2 cursor-pointer" disabled={activeItems.length === 0}>
              <Trash2 className="h-4 w-4 text-red-500" /> All Items ({activeItems.length})
            </DropdownMenuItem>
            <DropdownMenuItem onClick={clearAllGotIt} className="gap-2 cursor-pointer" disabled={gotItems.length === 0}>
              <Check className="h-4 w-4 text-green-600" /> Got Items ({gotItems.length})
            </DropdownMenuItem>
            <DropdownMenuItem onClick={clearAllNeed} className="gap-2 cursor-pointer" disabled={neededItems.length === 0}>
              <ShoppingCart className="h-4 w-4 text-[#D2691E]" /> Needed Items ({neededItems.length})
            </DropdownMenuItem>
            {storeNames.length > 0 && (
              <>
                <DropdownMenuSeparator />
                {storeNames.map(store => (
                  <DropdownMenuItem key={store} onClick={() => clearByStore(store)} className="gap-2 cursor-pointer">
                    <Store className="h-4 w-4 text-gray-500" /> {store} ({neededItems.filter(i => (i.store || 'No Store') === store).length})
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card className="border-none shadow-xl bg-gradient-to-r from-[#D2691E] to-[#E8954C] text-white relative z-0">
        <CardContent className="py-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input 
                value={quickInput}
                onChange={e => setQuickInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleQuickAdd()}
                placeholder="Quick add: Milk 2L @Publix"
                className="bg-white/20 border-white/30 text-white placeholder:text-white/60 focus-visible:ring-white h-11 pr-9"
                data-testid="input-quick-add-grocery"
              />
              {quickInput && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuickInput('')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-white/70 hover:text-white hover:bg-white/20"
                  data-testid="button-clear-input"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button 
              onClick={handleQuickAdd} 
              className="bg-white text-[#D2691E] hover:bg-white/90 h-11 px-6"
              disabled={createItem.isPending}
              data-testid="button-quick-add-grocery"
            >
              {createItem.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-white/70 text-xs mt-2">Type item name, quantity, and @StoreName (e.g., Milk 2L @Publix)</p>
        </CardContent>
      </Card>

      {missingEssentials.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-amber-700 font-medium flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Essentials:
          </span>
          {missingEssentials.slice(0, 8).map(item => (
            <Badge 
              key={item} 
              variant="outline" 
              className="text-xs bg-amber-50 border-amber-200 hover:bg-amber-100 cursor-pointer"
              onClick={() => setQuickInput(prev => prev.includes('@') ? `${item} ${prev.match(/@.*$/)?.[0] || ''}`.trim() : item)}
              data-testid={`badge-essential-${item.toLowerCase()}`}
            >
              {item}
            </Badge>
          ))}
        </div>
      )}

      {frequentStores.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-[#D2691E] font-medium flex items-center gap-1">
            <Store className="h-3 w-3" /> Stores:
          </span>
          {frequentStores.slice(0, 5).map(store => (
            <Badge 
              key={store} 
              variant="secondary" 
              className="text-xs bg-white border border-[#D2691E]/20 text-[#D2691E] cursor-pointer hover:bg-[#D2691E]/10"
              onClick={() => setQuickInput(prev => {
                const withoutStore = prev.replace(/@.*$/, '').trim();
                return withoutStore ? `${withoutStore} @${store}` : `@${store}`;
              })}
              data-testid={`badge-store-${store.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {store}
            </Badge>
          ))}
        </div>
      )}

      {frequentItems.filter(f => !neededItems.some(n => n.name.toLowerCase() === f.name.toLowerCase())).length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-[#D2691E] font-medium flex items-center gap-1">
            <RotateCcw className="h-3 w-3" /> Buy Again:
          </span>
          {frequentItems.filter(f => !neededItems.some(n => n.name.toLowerCase() === f.name.toLowerCase())).slice(0, 5).map(item => (
            <Badge 
              key={item.name} 
              variant="outline" 
              className="text-xs bg-[#D2691E]/5 border-[#D2691E]/30 hover:bg-[#D2691E]/10 cursor-pointer"
              onClick={() => addSuggestion(item.name, item.store)}
              data-testid={`badge-frequent-${item.name.toLowerCase()}`}
            >
              {item.name}
            </Badge>
          ))}
        </div>
      )}

      {viewMode === 'list' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><ShoppingCart className="h-4 w-4 text-[#D2691E]" /> {neededItems.length} needed</span>
              <span className="flex items-center gap-1"><Check className="h-4 w-4 text-green-500" /> {gotItems.length} got</span>
            </div>
          </div>
          {activeItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Your grocery list is empty! Add items above.</p>
            </div>
          ) : (
            <>
              {neededItems.map(item => (
                <Card key={item.id} className="overflow-hidden shadow-lg border-none" data-testid={`card-grocery-needed-${item.id}`}>
                  <div className="flex items-center p-4 gap-4">
                    <button
                      onClick={() => moveToGot(item.id)}
                      className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-[#D2691E] hover:bg-[#D2691E]/10 transition-colors"
                      data-testid={`button-got-${item.id}`}
                      aria-label={`Mark ${item.name} as got`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold truncate">{item.name}</span>
                        {item.quantity && <Badge variant="secondary" className="text-xs">{item.quantity}</Badge>}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {item.store && <span className="flex items-center gap-1"><Store className="h-3 w-3" /> {item.store}</span>}
                        {item.category && <Badge variant="outline" className="text-[10px]">{item.category}</Badge>}
                      </div>
                      {item.notes && <p className="text-xs text-muted-foreground mt-1 italic">{item.notes}</p>}
                    </div>
                    <Button 
                      onClick={() => removeItem(item.id)} 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive flex-shrink-0"
                      data-testid={`button-delete-${item.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
              {gotItems.length > 0 && neededItems.length > 0 && (
                <div className="border-t border-dashed border-green-300 my-2" />
              )}
              {gotItems.map(item => (
                <Card key={item.id} className="overflow-hidden bg-green-50/50 shadow-lg border-none" data-testid={`card-grocery-got-${item.id}`}>
                  <div className="flex items-center p-4 gap-4">
                    <button
                      onClick={() => moveToNeeded(item.id)}
                      className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-green-500 bg-green-500 flex items-center justify-center hover:bg-green-400 transition-colors"
                      data-testid={`button-needed-${item.id}`}
                      aria-label={`Move ${item.name} back to needed`}
                    >
                      <Check className="h-3.5 w-3.5 text-white" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold truncate line-through text-muted-foreground">{item.name}</span>
                        {item.quantity && <Badge variant="secondary" className="text-xs opacity-60">{item.quantity}</Badge>}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {item.store && <span className="flex items-center gap-1"><Store className="h-3 w-3" /> {item.store}</span>}
                      </div>
                    </div>
                    <Button 
                      onClick={() => removeItem(item.id)} 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive flex-shrink-0"
                      data-testid={`button-delete-got-${item.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(itemsByStore).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Store className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No items to shop for. Add some groceries!</p>
            </div>
          ) : (
            Object.entries(itemsByStore).map(([store, storeItems]) => (
              <Card key={store} className="overflow-hidden shadow-lg border-none" data-testid={`card-store-${store.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardHeader className="bg-[#D2691E]/5 border-b py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Store className="h-5 w-5 text-[#D2691E]" />
                    {store}
                    <Badge className="ml-auto bg-[#D2691E]">{storeItems.length} items</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 divide-y">
                  {storeItems.map(item => (
                    <div key={item.id} className="flex items-center p-3 gap-3" data-testid={`card-store-item-${item.id}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.name}</span>
                          {item.quantity && <span className="text-sm text-muted-foreground">({item.quantity})</span>}
                        </div>
                        {item.category && <Badge variant="outline" className="text-[10px] mt-1">{item.category}</Badge>}
                      </div>
                      <Button 
                        onClick={() => moveToGot(item.id)} 
                        size="sm" 
                        variant="outline"
                        className="gap-1 border-green-300 text-green-600 hover:bg-green-50 h-9"
                        data-testid={`button-store-got-${item.id}`}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
