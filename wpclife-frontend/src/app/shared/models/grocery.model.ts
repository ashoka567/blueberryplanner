export interface GroceryItem {
  id: string;
  name: string;
  category: 'PRODUCE' | 'DAIRY' | 'MEAT' | 'PANTRY' | 'OTHER';
  neededByDate?: string;
  checked: boolean;
  addedById: string;
  householdId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroceryRequest {
  name: string;
  category?: 'PRODUCE' | 'DAIRY' | 'MEAT' | 'PANTRY' | 'OTHER';
  neededByDate?: string;
}
