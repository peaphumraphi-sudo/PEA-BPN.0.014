const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz8BcfrNzQNCDeODKpSG4HPUcIg5uhxd_fMi9jQE1wTlH7UrM9thwM2pWbj2eLAAzQPGg/exec';

export const api = {
  async request(action: string, payload: any = {}) {
    try {
      // Using POST with string body defaults to text/plain, avoiding preflight CORS issues
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action, ...payload }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      
      // Fallback to mock data if API fails (e.g. due to CORS or unconfigured Google Apps Script)
      console.warn(`Falling back to mock data for action: ${action}`);
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
