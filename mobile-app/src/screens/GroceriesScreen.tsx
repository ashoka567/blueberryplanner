import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useGroceryItems, useCreateGroceryItem, useUpdateGroceryItem } from '../hooks/useData';

const ESSENTIALS = ['Milk', 'Eggs', 'Bread', 'Rice', 'Butter', 'Cheese', 'Chicken', 'Onions', 'Tomatoes', 'Bananas'];

const BURNT_ORANGE = '#D2691E';
const BURNT_ORANGE_LIGHT = '#E8954C';

export default function GroceriesScreen() {
  const { familyId } = useAuth();
  const { data: items = [], isLoading, refetch } = useGroceryItems(familyId);
  const createItem = useCreateGroceryItem(familyId);
  const updateItem = useUpdateGroceryItem(familyId);

  const [refreshing, setRefreshing] = useState(false);
  const [quickInput, setQuickInput] = useState('');
  const [activeTab, setActiveTab] = useState<'need' | 'got'>('need');

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const parseQuickInput = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return null;

    let name = '';
    let quantity = '';
    let store = '';

    let remaining = trimmed;

    const atMatch = remaining.match(/@\s*(.+)$/i);
    if (atMatch) {
      store = atMatch[1].trim();
      remaining = remaining.replace(/@\s*.+$/, '').trim();
    }

    const qtyMatch = remaining.match(/\b(\d+(\.\d+)?\s*(kg|g|l|ml|lb|oz|pack|pcs|L)?)\b/i);
    if (qtyMatch) {
      quantity = qtyMatch[1].trim();
      remaining = remaining.replace(qtyMatch[0], '').trim();
    }

    name = remaining.replace(/\s+/g, ' ').trim();
    return { name, quantity, store };
  };

  const guessCategory = (name: string): string => {
    const lower = name.toLowerCase();
    if (['apple', 'banana', 'orange', 'grape', 'mango'].some(f => lower.includes(f))) return 'Fruits';
    if (['carrot', 'potato', 'onion', 'tomato', 'lettuce'].some(v => lower.includes(v))) return 'Vegetables';
    if (['milk', 'cheese', 'yogurt', 'butter', 'cream'].some(d => lower.includes(d))) return 'Dairy';
    if (['chicken', 'beef', 'pork', 'fish'].some(m => lower.includes(m))) return 'Meat';
    return 'Other';
  };

  const handleQuickAdd = async () => {
    if (!quickInput.trim()) return;

    const parsed = parseQuickInput(quickInput);
    if (!parsed || !parsed.name) return;

    try {
      await createItem.mutateAsync({
        name: parsed.name,
        quantity: parsed.quantity || null,
        store: parsed.store || 'Other',
        category: guessCategory(parsed.name),
        status: 'NEEDED',
      });
      setQuickInput('');
    } catch (error) {
      console.error('Failed to add item', error);
    }
  };

  const addSuggestion = async (name: string, store: string = 'Other') => {
    try {
      await createItem.mutateAsync({
        name,
        category: guessCategory(name),
        store,
        status: 'NEEDED',
      });
    } catch (error) {
      console.error('Failed to add item', error);
    }
  };

  const moveToGot = async (id: string, currentCount: number) => {
    try {
      await updateItem.mutateAsync({
        id,
        data: { status: 'GOT', purchaseCount: currentCount + 1 },
      });
    } catch (error) {
      console.error('Failed to update item', error);
    }
  };

  const moveToNeeded = async (id: string) => {
    try {
      await updateItem.mutateAsync({
        id,
        data: { status: 'NEEDED' },
      });
    } catch (error) {
      console.error('Failed to update item', error);
    }
  };

  const archiveItem = async (id: string) => {
    try {
      await updateItem.mutateAsync({
        id,
        data: { status: 'ARCHIVED' },
      });
    } catch (error) {
      console.error('Failed to archive item', error);
    }
  };

  const neededItems = useMemo(() => items.filter((i: any) => i.status === 'NEEDED' || i.status === 'PENDING'), [items]);
  const gotItems = useMemo(() => items.filter((i: any) => i.status === 'GOT' || i.status === 'CHECKED'), [items]);

  const frequentItems = useMemo(() => {
    const itemData: Record<string, { count: number; store: string }> = {};
    items.forEach((item: any) => {
      const count = item.purchaseCount || 0;
      if (count > 0 && (!itemData[item.name] || count > itemData[item.name].count)) {
        itemData[item.name] = { count, store: item.store || 'Other' };
      }
    });
    return Object.entries(itemData)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 15)
      .map(([name, data]) => ({ name, store: data.store }));
  }, [items]);

  const missingEssentials = useMemo(() => {
    const neededNames = neededItems.map((i: any) => i.name.toLowerCase());
    return ESSENTIALS.filter(e => !neededNames.some((n: string) => n.includes(e.toLowerCase())));
  }, [neededItems]);

  const frequentStores = useMemo(() => {
    const storeCounts: Record<string, number> = {};
    items.forEach((item: any) => {
      if (item.store && item.store !== 'Other') {
        storeCounts[item.store] = (storeCounts[item.store] || 0) + 1;
      }
    });
    return Object.entries(storeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([store]) => store);
  }, [items]);

  const buyAgainItems = frequentItems.filter(f => !neededItems.some((n: any) => n.name.toLowerCase() === f.name.toLowerCase()));

  const storeNames = useMemo(() => {
    const stores = new Set<string>();
    neededItems.forEach((item: any) => {
      stores.add(item.store || 'No Store');
    });
    return Array.from(stores);
  }, [neededItems]);

  const [showClearMenu, setShowClearMenu] = useState(false);

  const clearAllGotIt = async () => {
    for (const item of gotItems) {
      await updateItem.mutateAsync({ id: item.id, data: { status: 'ARCHIVED' } });
    }
    setShowClearMenu(false);
  };

  const clearAllNeed = async () => {
    for (const item of neededItems) {
      await updateItem.mutateAsync({ id: item.id, data: { status: 'ARCHIVED' } });
    }
    setShowClearMenu(false);
  };

  const clearByStore = async (store: string) => {
    const storeItems = neededItems.filter((i: any) => (i.store || 'No Store') === store);
    for (const item of storeItems) {
      await updateItem.mutateAsync({ id: item.id, data: { status: 'ARCHIVED' } });
    }
    setShowClearMenu(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BURNT_ORANGE} />}
    >
      <View style={styles.header}>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.clearButton2} onPress={() => setShowClearMenu(true)}>
            <Ionicons name="trash-outline" size={16} color={BURNT_ORANGE} />
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => {}}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showClearMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClearMenu(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowClearMenu(false)}>
          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle}>Clear Items</Text>
            
            <TouchableOpacity 
              style={[styles.menuItem, gotItems.length === 0 && styles.menuItemDisabled]} 
              onPress={clearAllGotIt}
              disabled={gotItems.length === 0}
            >
              <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
              <Text style={styles.menuItemText}>All Got it ({gotItems.length})</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.menuItem, neededItems.length === 0 && styles.menuItemDisabled]} 
              onPress={clearAllNeed}
              disabled={neededItems.length === 0}
            >
              <Ionicons name="cart" size={20} color={BURNT_ORANGE} />
              <Text style={styles.menuItemText}>All Need ({neededItems.length})</Text>
            </TouchableOpacity>

            {storeNames.length > 0 && (
              <>
                <View style={styles.menuDivider} />
                {storeNames.map(store => (
                  <TouchableOpacity 
                    key={store}
                    style={styles.menuItem} 
                    onPress={() => clearByStore(store)}
                  >
                    <Ionicons name="storefront-outline" size={20} color="#666" />
                    <Text style={styles.menuItemText}>
                      {store} ({neededItems.filter((i: any) => (i.store || 'No Store') === store).length})
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            )}

            <TouchableOpacity style={styles.menuCancel} onPress={() => setShowClearMenu(false)}>
              <Text style={styles.menuCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <View style={styles.quickAddContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.quickAddInput}
            value={quickInput}
            onChangeText={setQuickInput}
            placeholder="Quick add: Milk 2L @Publix"
            placeholderTextColor="rgba(255,255,255,0.6)"
            onSubmitEditing={handleQuickAdd}
            returnKeyType="done"
          />
          {quickInput.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={() => setQuickInput('')}>
              <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.quickAddButton} onPress={handleQuickAdd}>
          <Ionicons name="add" size={24} color={BURNT_ORANGE} />
        </TouchableOpacity>
      </View>
      <Text style={styles.quickAddHint}>Type item name, quantity, and @StoreName</Text>

      {missingEssentials.length > 0 && (
        <View style={styles.tagSection}>
          <View style={styles.tagHeader}>
            <Ionicons name="sparkles" size={14} color="#b45309" />
            <Text style={styles.tagLabel}>Essentials:</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagScroll}>
            {missingEssentials.slice(0, 8).map(item => (
              <TouchableOpacity
                key={item}
                style={styles.essentialTag}
                onPress={() => setQuickInput(prev => prev.includes('@') ? `${item} ${prev.match(/@.*$/)?.[0] || ''}`.trim() : item)}
              >
                <Text style={styles.essentialTagText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {frequentStores.length > 0 && (
        <View style={styles.tagSection}>
          <View style={styles.tagHeader}>
            <Ionicons name="storefront-outline" size={14} color={BURNT_ORANGE} />
            <Text style={[styles.tagLabel, { color: BURNT_ORANGE }]}>Stores:</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagScroll}>
            {frequentStores.slice(0, 5).map(store => (
              <TouchableOpacity
                key={store}
                style={styles.storeTag}
                onPress={() => setQuickInput(prev => {
                  const withoutStore = prev.replace(/@.*$/, '').trim();
                  return withoutStore ? `${withoutStore} @${store}` : `@${store}`;
                })}
              >
                <Text style={styles.storeTagText}>{store}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {buyAgainItems.length > 0 && (
        <View style={styles.tagSection}>
          <View style={styles.tagHeader}>
            <Ionicons name="refresh" size={14} color={BURNT_ORANGE} />
            <Text style={[styles.tagLabel, { color: BURNT_ORANGE }]}>Buy Again:</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagScroll}>
            {buyAgainItems.slice(0, 5).map(item => (
              <TouchableOpacity
                key={item.name}
                style={styles.buyAgainTag}
                onPress={() => addSuggestion(item.name, item.store)}
              >
                <Text style={styles.buyAgainTagText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'need' && styles.activeTab]}
          onPress={() => setActiveTab('need')}
        >
          <Ionicons name="cart-outline" size={16} color={activeTab === 'need' ? '#fff' : BURNT_ORANGE} />
          <Text style={[styles.tabText, activeTab === 'need' && styles.activeTabText]}>
            Need ({neededItems.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'got' && styles.activeTab]}
          onPress={() => setActiveTab('got')}
        >
          <Ionicons name="checkmark-circle-outline" size={16} color={activeTab === 'got' ? '#fff' : BURNT_ORANGE} />
          <Text style={[styles.tabText, activeTab === 'got' && styles.activeTabText]}>
            Got it ({gotItems.length})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listSection}>
        {activeTab === 'need' ? (
          neededItems.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="cart-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No items needed. Your list is empty!</Text>
            </View>
          ) : (
            neededItems.map((item: any) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemContent}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <View style={styles.itemMeta}>
                    {item.quantity && <Text style={styles.itemQuantity}>{item.quantity}</Text>}
                    {item.store && (
                      <View style={styles.itemStoreTag}>
                        <Ionicons name="storefront-outline" size={10} color="#6b7280" />
                        <Text style={styles.itemStoreText}>{item.store}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.gotButton}
                  onPress={() => moveToGot(item.id, item.purchaseCount || 0)}
                >
                  <Ionicons name="checkmark" size={16} color="#fff" />
                  <Text style={styles.gotButtonText}>Got it</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => archiveItem(item.id)}>
                  <Ionicons name="trash-outline" size={18} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            ))
          )
        ) : (
          gotItems.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No items purchased yet.</Text>
            </View>
          ) : (
            gotItems.map((item: any) => (
              <View key={item.id} style={[styles.itemCard, styles.gotItemCard]}>
                <View style={styles.itemContent}>
                  <Text style={[styles.itemName, styles.gotItemName]}>{item.name}</Text>
                  {item.quantity && <Text style={styles.itemQuantity}>{item.quantity}</Text>}
                </View>
                <TouchableOpacity
                  style={styles.needAgainButton}
                  onPress={() => moveToNeeded(item.id)}
                >
                  <Ionicons name="arrow-forward" size={14} color={BURNT_ORANGE} />
                  <Text style={styles.needAgainText}>Need Again</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => archiveItem(item.id)}>
                  <Ionicons name="trash-outline" size={18} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            ))
          )
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: BURNT_ORANGE,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  quickAddContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
    backgroundColor: BURNT_ORANGE,
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
  },
  quickAddInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 8,
    padding: 12,
    paddingRight: 40,
    fontSize: 16,
    color: '#fff',
  },
  clearButton: {
    position: 'absolute',
    right: 8,
    top: '50%',
    marginTop: -12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddButton: {
    backgroundColor: '#fff',
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddHint: {
    backgroundColor: BURNT_ORANGE,
    paddingHorizontal: 16,
    paddingBottom: 16,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  tagSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  tagLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b45309',
  },
  tagScroll: {
    flexDirection: 'row',
  },
  essentialTag: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fcd34d',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
  },
  essentialTagText: {
    fontSize: 12,
    color: '#92400e',
  },
  storeTag: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(210,105,30,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
  },
  storeTagText: {
    fontSize: 12,
    color: BURNT_ORANGE,
  },
  buyAgainTag: {
    backgroundColor: 'rgba(210,105,30,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(210,105,30,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
  },
  buyAgainTagText: {
    fontSize: 12,
    color: BURNT_ORANGE,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: 'rgba(210,105,30,0.1)',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 6,
    gap: 6,
  },
  activeTab: {
    backgroundColor: BURNT_ORANGE,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: BURNT_ORANGE,
  },
  activeTabText: {
    color: '#fff',
  },
  listSection: {
    padding: 16,
    paddingTop: 0,
  },
  emptyCard: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
    textAlign: 'center',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  gotItemCard: {
    backgroundColor: 'rgba(34,197,94,0.05)',
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  gotItemName: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  itemQuantity: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  itemStoreTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemStoreText: {
    fontSize: 12,
    color: '#6b7280',
  },
  gotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
    marginRight: 8,
  },
  gotButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  needAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BURNT_ORANGE,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
    marginRight: 8,
  },
  needAgainText: {
    fontSize: 12,
    color: BURNT_ORANGE,
  },
  deleteButton: {
    padding: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  clearButton2: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BURNT_ORANGE,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  clearButtonText: {
    fontSize: 14,
    color: BURNT_ORANGE,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '80%',
    maxWidth: 300,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  menuSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    marginTop: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 12,
  },
  menuItemDisabled: {
    opacity: 0.4,
  },
  menuItemText: {
    fontSize: 16,
    color: '#1f2937',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  menuCancel: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  menuCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
});
