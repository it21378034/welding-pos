import sys
import re

with open('src/components/PurchaseListModule.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
import_old = "import { useApp } from '../context/AppContext';"
import_new = "import { useApp } from '../context/AppContext';\nimport type { PurchaseList, PurchaseItem } from '../types';"
content = content.replace(import_old, import_new)

# 2. Remove local interfaces
interface_block = '''interface PurchaseItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  notes?: string;
}

interface PurchaseList {
  id: string;
  listNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  projectName: string;
  items: PurchaseItem[];
  notes: string;
  createdAt: string;
}

'''
content = content.replace(interface_block, "")

# 3. Use useApp for purchaseLists
module_start_old = '''export const PurchaseListModule: React.FC = () => {
  const { customers } = useApp();

  const [lists, setLists] = useState<PurchaseList[]>([]);'''
module_start_new = '''export const PurchaseListModule: React.FC = () => {
  const { customers, purchaseLists, addPurchaseList, updatePurchaseList, deletePurchaseList, duplicatePurchaseList } = useApp();
'''
content = content.replace(module_start_old, module_start_new)

# 4. Remove generateListNumber and listCounter since addPurchaseList generates it
gen_list_old = '''let listCounter = 1;
const generateListNumber = () => {
  const num = String(listCounter++).padStart(3, '0');
  return `PL-${new Date().getFullYear()}-${num}`;
};'''
content = content.replace(gen_list_old, "")

# 5. Fix handleSave
save_old = '''  const handleSave = () => {
    if (items.filter(i => i.name.trim()).length === 0) {
      alert('Please add at least one item.');
      return;
    }

    const validItems = items.filter(i => i.name.trim() !== '');

    if (editingId) {
      setLists(prev => prev.map(l => l.id === editingId ? {
        ...l,
        customerName,
        customerPhone,
        projectName,
        notes,
        items: validItems,
      } : l));
    } else {
      const newList: PurchaseList = {
        id: 'pl-' + Date.now(),
        listNumber: generateListNumber(),
        date: new Date().toISOString().split('T')[0],
        customerName,
        customerPhone,
        projectName,
        notes,
        items: validItems,
        createdAt: new Date().toISOString(),
      };
      setLists(prev => [newList, ...prev]);
    }
    setShowForm(false);
    resetForm();
  };'''

save_new = '''  const handleSave = () => {
    if (items.filter(i => i.name.trim()).length === 0) {
      alert('Please add at least one item.');
      return;
    }

    const validItems = items.filter(i => i.name.trim() !== '');

    if (editingId) {
      updatePurchaseList(editingId, {
        customerName,
        customerPhone,
        projectName,
        notes,
        items: validItems,
      });
    } else {
      addPurchaseList({
        customerName,
        customerPhone,
        projectName,
        notes,
        items: validItems,
        date: new Date().toISOString().split('T')[0],
      });
    }
    setShowForm(false);
    resetForm();
  };'''
content = content.replace(save_old, save_new)

# 6. Fix handleDelete
delete_old = '''  const handleDelete = (id: string) => {
    if (confirm('Delete this purchase list?')) {
      setLists(prev => prev.filter(l => l.id !== id));
    }
  };'''
delete_new = '''  const handleDelete = (id: string) => {
    if (confirm('Delete this purchase list?')) {
      deletePurchaseList(id);
    }
  };'''
content = content.replace(delete_old, delete_new)

# 7. Fix handleDuplicate
dup_old = '''  const handleDuplicate = (list: PurchaseList) => {
    const newList: PurchaseList = {
      ...list,
      id: 'pl-' + Date.now(),
      listNumber: generateListNumber(),
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };
    setLists(prev => [newList, ...prev]);
  };'''
dup_new = '''  const handleDuplicate = (list: PurchaseList) => {
    duplicatePurchaseList(list.id);
  };'''
content = content.replace(dup_old, dup_new)

# 8. Replace `lists.length` with `purchaseLists.length` and `lists.map` with `purchaseLists.map`
# Just simple string replacement for 'lists' variable
content = content.replace("lists.length === 0", "purchaseLists.length === 0")
content = content.replace("lists.map((list) =>", "purchaseLists.map((list) =>")


with open('src/components/PurchaseListModule.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
