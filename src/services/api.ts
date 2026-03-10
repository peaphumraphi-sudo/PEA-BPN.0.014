import { 
  collection, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  increment
} from "firebase/firestore";
import { db, isFirebaseEnabled } from "./firebase";

// Helper to check if Firebase is configured
const isFirebaseConfigured = () => {
  return isFirebaseEnabled;
};

const GAS_URL = import.meta.env.VITE_GAS_WEBAPP_URL;

export const api = {
  async syncToGoogleSheets(action: string, payload: any) {
    if (!GAS_URL) return;
    try {
      // Use no-cors or handle CORS in GAS (GAS handles it by default if using ContentService)
      // But fetch to GAS usually needs to follow redirects
      await fetch(GAS_URL, {
        method: 'POST',
        mode: 'no-cors', // GAS Web Apps often require no-cors for simple POSTs from browser
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, ...payload }),
      });
    } catch (error) {
      console.error('Google Sheets Sync Error:', error);
    }
  },

  async fetchFromGoogleSheets() {
    if (!GAS_URL) return { success: false, message: 'ไม่ได้กำหนด URL ของ Google Apps Script' };
    try {
      const response = await fetch(`${GAS_URL}?action=getData`);
      // Note: GAS Web Apps handle CORS but fetch might need to handle redirects
      // If the GAS script is set up for GET, this will work.
      const data = await response.json();
      return { success: true, items: data };
    } catch (error) {
      console.error('Google Sheets Fetch Error:', error);
      return { success: false, message: 'ไม่สามารถดึงข้อมูลจาก Google Sheets ได้' };
    }
  },

  async request(action: string, payload: any = {}) {
    try {
      if (!isFirebaseConfigured()) {
        console.warn('Firebase not configured, using mock data or Google Sheets');
        
        // Try fetching from Google Sheets for inventory if Firebase is down
        if (action === 'getMainInventory') {
          const sheetsData = await this.fetchFromGoogleSheets();
          if (sheetsData.success) return sheetsData;
        }
        
        const mockResult = this.getMockData(action, payload);
        // If it's a mutation, we might still want to try syncing to sheets if URL exists
        if (['transaction', 'withdrawToVehicle', 'saveVehicleChecklist', 'saveToolChecklist', 'addUser', 'updateUser', 'deleteUser'].includes(action)) {
          this.syncToGoogleSheets(action, payload);
        }
        return mockResult;
      }

      let result: any = { success: false };

      switch (action) {
        case 'login': {
          const q = query(collection(db, "users"), where("username", "==", payload.username), where("pin", "==", payload.pin));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            result = { success: true, user: { username: userData.username, role: userData.role, name: userData.name } };
          } else {
            result = { success: false, message: 'ชื่อผู้ใช้หรือ PIN ไม่ถูกต้อง' };
          }
          break;
        }

        case 'getMainInventory': {
          const querySnapshot = await getDocs(collection(db, "mainInventory"));
          const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          result = { success: true, items };
          break;
        }

        case 'getVehicleInventory': {
          const querySnapshot = await getDocs(collection(db, "vehicleInventory"));
          const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          result = { success: true, items };
          break;
        }

        case 'getVehicleTools': {
          const querySnapshot = await getDocs(collection(db, "vehicleTools"));
          const tools = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          result = { success: true, tools };
          break;
        }

        case 'transaction': {
          const { type, itemCode, quantity, user } = payload;
          const itemRef = doc(db, "mainInventory", itemCode);
          const itemSnap = await getDoc(itemRef);
          
          if (!itemSnap.exists()) {
            result = { success: false, message: 'ไม่พบพัสดุในระบบ' };
          } else {
            const currentQty = itemSnap.data().current || 0;
            const newQty = type === 'in' ? currentQty + quantity : currentQty - quantity;

            if (newQty < 0) {
              result = { success: false, message: 'จำนวนพัสดุในคลังไม่เพียงพอ' };
            } else {
              await updateDoc(itemRef, { current: newQty });
              await addDoc(collection(db, "transactions"), {
                date: Timestamp.now(),
                type,
                item: itemCode,
                qty: quantity,
                user,
                source: 'main'
              });
              result = { success: true };
            }
          }
          break;
        }

        case 'withdrawToVehicle': {
          const { itemCode, quantity, user } = payload;
          
          // 1. Update Main Inventory
          const mainRef = doc(db, "mainInventory", itemCode);
          const mainSnap = await getDoc(mainRef);
          if (!mainSnap.exists()) {
            result = { success: false, message: 'ไม่พบพัสดุในคลังหลัก' };
          } else {
            const mainQty = mainSnap.data().current || 0;
            if (mainQty < quantity) {
              result = { success: false, message: 'จำนวนพัสดุในคลังหลักไม่เพียงพอ' };
            } else {
              await updateDoc(mainRef, { current: mainQty - quantity });

              // 2. Update Vehicle Inventory
              const vehicleRef = doc(db, "vehicleInventory", itemCode);
              const vehicleSnap = await getDoc(vehicleRef);
              
              if (vehicleSnap.exists()) {
                await updateDoc(vehicleRef, { current: increment(quantity) });
              } else {
                await setDoc(vehicleRef, { 
                  name: mainSnap.data().name, 
                  current: quantity, 
                  min: mainSnap.data().min || 0 
                });
              }

              // 3. Log Transaction
              await addDoc(collection(db, "transactions"), {
                date: Timestamp.now(),
                type: 'out',
                item: itemCode,
                qty: quantity,
                user,
                source: 'withdraw_to_vehicle'
              });

              result = { success: true };
            }
          }
          break;
        }

        case 'saveVehicleChecklist': {
          await addDoc(collection(db, "vehicleChecklists"), {
            ...payload,
            date: Timestamp.now()
          });
          result = { success: true };
          break;
        }

        case 'saveToolChecklist': {
          await addDoc(collection(db, "toolChecklists"), {
            ...payload,
            date: Timestamp.now()
          });
          result = { success: true };
          break;
        }

        case 'getDashboardData': {
          const mainSnap = await getDocs(collection(db, "mainInventory"));
          const items = mainSnap.docs.map(doc => doc.data());
          const lowStockItemsList = items.filter((item: any) => item.current < item.min);
          
          const transSnap = await getDocs(query(collection(db, "transactions"), orderBy("date", "desc"), limit(10)));
          const recentTransactions = transSnap.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              date: data.date?.toDate().toLocaleString('th-TH') || ''
            };
          });

          result = {
            success: true,
            totalItems: items.length,
            lowStockItems: lowStockItemsList.length,
            lowStockItemsList,
            recentTransactions
          };
          break;
        }

        case 'getUsers': {
          const querySnapshot = await getDocs(collection(db, "users"));
          const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          result = { success: true, users };
          break;
        }

        case 'addUser': {
          await setDoc(doc(db, "users", payload.user.username), payload.user);
          result = { success: true };
          break;
        }

        case 'updateUser': {
          await updateDoc(doc(db, "users", payload.user.username), payload.user);
          result = { success: true };
          break;
        }

        case 'deleteUser': {
          await deleteDoc(doc(db, "users", payload.username));
          result = { success: true };
          break;
        }

        default:
          result = this.getMockData(action, payload);
      }

      // Sync to Google Sheets if it's a mutation and successful
      if (result.success && ['transaction', 'withdrawToVehicle', 'saveVehicleChecklist', 'saveToolChecklist', 'addUser', 'updateUser', 'deleteUser'].includes(action)) {
        this.syncToGoogleSheets(action, payload);
      }

      return result;
    } catch (error) {
      console.error('Firestore Error:', error);
      return this.getMockData(action, payload);
    }
  },

  getMockData(action: string, payload: any) {
    switch (action) {
      case 'login':
        return { success: true, user: { username: payload.username, role: 'admin', name: 'ผู้ดูแลระบบ' } };
      case 'getMainInventory':
        return {
          success: true,
          items: [
            { id: 'P001', name: 'สายไฟ THW 1x4', initial: 1000, min: 200, current: 850 },
            { id: 'P002', name: 'มิเตอร์ 15(45)A', initial: 500, min: 50, current: 45 },
            { id: 'P003', name: 'เทปพันสายไฟ', initial: 200, min: 20, current: 150 },
            { id: 'P004', name: 'เบรกเกอร์ 30A', initial: 100, min: 10, current: 8 },
          ]
        };
      case 'getVehicleInventory':
        return {
          success: true,
          items: [
            { id: 'V001', name: 'หมวกนิรภัย', current: 2, min: 2 },
            { id: 'V002', name: 'ถุงมือยาง', current: 5, min: 10 },
            { id: 'V003', name: 'เข็มขัดนิรภัย', current: 2, min: 2 },
            { id: 'V004', name: 'เสื้อสะท้อนแสง', current: 3, min: 4 },
          ]
        };
      case 'getVehicleTools':
        return {
          success: true,
          tools: [
            { id: 'T001', name: 'ประแจเลื่อน 12 นิ้ว', qty: 2, status: 'complete' },
            { id: 'T002', name: 'คีมตัดสายไฟ', qty: 1, status: 'complete' },
            { id: 'T003', name: 'ไขควงเช็คไฟ', qty: 2, status: 'incomplete' },
            { id: 'T004', name: 'มัลติมิเตอร์', qty: 1, status: 'damaged' },
          ]
        };
      case 'transaction':
      case 'withdrawToVehicle':
      case 'saveVehicleChecklist':
      case 'saveToolChecklist':
        return { success: true, message: 'Mock transaction successful' };
      case 'getDashboardData':
        return {
          success: true,
          totalItems: 4,
          lowStockItems: 1,
          lowStockItemsList: [
            { id: 'P002', name: 'มิเตอร์ 15(45)A', current: 45, min: 50 }
          ],
          recentTransactions: [
            { id: 1, date: '2023-10-27 10:00', type: 'out', item: 'P001', qty: 10, user: 'admin' },
            { id: 2, date: '2023-10-27 11:30', type: 'in', item: 'P002', qty: 50, user: 'admin' }
          ]
        };
      case 'getUsers':
        return {
          success: true,
          users: [
            { username: 'admin', pin: '1234', role: 'admin', name: 'ผู้ดูแลระบบ' },
            { username: 'user1', pin: '1111', role: 'user', name: 'สมชาย ใจดี' }
          ]
        };
      case 'addUser':
      case 'updateUser':
      case 'deleteUser':
        return { success: true, message: 'Mock user action successful' };
      default:
        return { success: false, message: 'Unknown mock action' };
    }
  },

  login(username: string, pin: string) {
    return this.request('login', { username, pin });
  },

  getMainInventory() {
    return this.request('getMainInventory');
  },

  transaction(type: 'in' | 'out', itemCode: string, quantity: number, user: string) {
    return this.request('transaction', { type, itemCode, quantity, user });
  },

  withdrawToVehicle(itemCode: string, quantity: number, user: string) {
    return this.request('withdrawToVehicle', { itemCode, quantity, user });
  },

  getVehicleInventory() {
    return this.request('getVehicleInventory');
  },

  saveVehicleChecklist(items: any[], sender: string, receiver: string) {
    return this.request('saveVehicleChecklist', { items, sender, receiver });
  },

  getVehicleTools() {
    return this.request('getVehicleTools');
  },

  saveToolChecklist(tools: any[], sender: string, receiver: string) {
    return this.request('saveToolChecklist', { tools, sender, receiver });
  },

  getDashboardData() {
    return this.request('getDashboardData');
  },

  getUsers() {
    return this.request('getUsers');
  },

  addUser(user: any) {
    return this.request('addUser', { user });
  },

  updateUser(user: any) {
    return this.request('updateUser', { user });
  },

  deleteUser(username: string) {
    return this.request('deleteUser', { username });
  }
};
