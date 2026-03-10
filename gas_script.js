// Google Apps Script for PEA BPN Inventory
// Spreadsheet ID: ใส่ ID ของ Google Sheet ของคุณที่นี่
const SPREADSHEET_ID = '1OeQxH-Ck_RkwD83CwNyxtPtChqwrLXkZlOSyOVJKpB8'; // <--- เปลี่ยนเป็น ID ของคุณ

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    let result = {};

    switch (action) {
      case 'login':
        result = handleLogin(data.username, data.pin);
        break;
      case 'getMainInventory':
        result = getMainInventory();
        break;
      case 'transaction':
        result = handleTransaction(data.type, data.itemCode, data.quantity, data.user);
        break;
      case 'withdrawToVehicle':
        result = handleWithdrawToVehicle(data.itemCode, data.quantity, data.user);
        break;
      case 'getVehicleInventory':
        result = getVehicleInventory();
        break;
      case 'saveVehicleChecklist':
        result = saveVehicleChecklist(data.items, data.sender, data.receiver);
        break;
      case 'getVehicleTools':
        result = getVehicleTools();
        break;
      case 'saveToolChecklist':
        result = saveToolChecklist(data.tools, data.sender, data.receiver);
        break;
      case 'getDashboardData':
        result = getDashboardData();
        break;
      case 'getUsers':
        result = getUsers();
        break;
      case 'addUser':
      case 'updateUser':
        result = saveUser(data.user);
        break;
      case 'deleteUser':
        result = deleteUser(data.username);
        break;
      default:
        result = { success: false, message: 'Invalid action' };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getSheet(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    // Initialize headers based on sheet name
    if (sheetName === 'Users') {
      sheet.appendRow(['Username', 'PIN', 'Role', 'Name']);
      sheet.appendRow(['admin', '1234', 'admin', 'ผู้ดูแลระบบ']);
    } else if (sheetName === 'MainInventory') {
      sheet.appendRow(['ItemCode', 'ItemName', 'InitialQty', 'MinQty', 'CurrentQty']);
      sheet.appendRow(['P001', 'สายไฟ THW 1x4', 1000, 200, 1000]);
    } else if (sheetName === 'Transactions') {
      sheet.appendRow(['Timestamp', 'Type', 'ItemCode', 'ItemName', 'Quantity', 'User']);
    } else if (sheetName === 'VehicleInventory') {
      sheet.appendRow(['ItemCode', 'ItemName', 'MinQty', 'CurrentQty']);
      sheet.appendRow(['V001', 'หมวกนิรภัย', 2, 2]);
    } else if (sheetName === 'VehicleChecklist') {
      sheet.appendRow(['Timestamp', 'ItemCode', 'ItemName', 'RemainingQty', 'Sender', 'Receiver']);
    } else if (sheetName === 'VehicleTools') {
      sheet.appendRow(['ToolCode', 'ToolName', 'Qty']);
      sheet.appendRow(['T001', 'ประแจเลื่อน 12 นิ้ว', 2]);
    } else if (sheetName === 'ToolChecklist') {
      sheet.appendRow(['Timestamp', 'ToolCode', 'ToolName', 'Status', 'Sender', 'Receiver']);
    }
  }
  return sheet;
}

function handleLogin(username, pin) {
  const sheet = getSheet('Users');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == username && data[i][1] == pin) {
      return { 
        success: true, 
        user: { username: data[i][0], role: data[i][2], name: data[i][3] } 
      };
    }
  }
  return { success: false, message: 'Invalid credentials' };
}

function getMainInventory() {
  const sheet = getSheet('MainInventory');
  const data = sheet.getDataRange().getValues();
  const items = [];
  
  for (let i = 1; i < data.length; i++) {
    items.push({
      id: data[i][0],
      name: data[i][1],
      initial: data[i][2],
      min: data[i][3],
      current: data[i][4]
    });
  }
  return { success: true, items: items };
}

function handleTransaction(type, itemCode, quantity, user) {
  const mainSheet = getSheet('MainInventory');
  const transSheet = getSheet('Transactions');
  const data = mainSheet.getDataRange().getValues();
  
  let itemFound = false;
  let itemName = '';
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == itemCode) {
      itemFound = true;
      itemName = data[i][1];
      let currentQty = parseInt(data[i][4]);
      let qty = parseInt(quantity);
      
      if (type === 'out' && currentQty < qty) {
        return { success: false, message: 'Insufficient quantity' };
      }
      
      let newQty = type === 'in' ? currentQty + qty : currentQty - qty;
      mainSheet.getRange(i + 1, 5).setValue(newQty);
      break;
    }
  }
  
  if (!itemFound) return { success: false, message: 'Item not found' };
  
  transSheet.appendRow([new Date(), type, itemCode, itemName, quantity, user]);
  return { success: true, message: 'Transaction successful' };
}

function handleWithdrawToVehicle(itemCode, quantity, user) {
  // 1. Deduct from MainInventory
  const mainResult = handleTransaction('out', itemCode, quantity, user);
  if (!mainResult.success) return mainResult;
  
  // 2. Add to VehicleInventory
  const vehicleSheet = getSheet('VehicleInventory');
  const vData = vehicleSheet.getDataRange().getValues();
  let found = false;
  
  for (let i = 1; i < vData.length; i++) {
    if (vData[i][0] == itemCode) {
      found = true;
      let currentQty = parseInt(vData[i][3]) || 0;
      vehicleSheet.getRange(i + 1, 4).setValue(currentQty + parseInt(quantity));
      break;
    }
  }
  
  if (!found) {
    // Find item name from MainInventory
    const mainSheet = getSheet('MainInventory');
    const mData = mainSheet.getDataRange().getValues();
    let itemName = 'พัสดุ ' + itemCode;
    for (let i = 1; i < mData.length; i++) {
      if (mData[i][0] == itemCode) {
        itemName = mData[i][1];
        break;
      }
    }
    vehicleSheet.appendRow([itemCode, itemName, 0, quantity]);
  }
  
  return { success: true, message: 'Withdraw to vehicle successful' };
}

function getVehicleInventory() {
  const sheet = getSheet('VehicleInventory');
  const data = sheet.getDataRange().getValues();
  const items = [];
  
  for (let i = 1; i < data.length; i++) {
    items.push({
      id: data[i][0],
      name: data[i][1],
      min: data[i][2],
      current: data[i][3]
    });
  }
  return { success: true, items: items };
}

function saveVehicleChecklist(items, sender, receiver) {
  const checklistSheet = getSheet('VehicleChecklist');
  const vehicleSheet = getSheet('VehicleInventory');
  const timestamp = new Date();
  
  // 1. Save to Checklist log
  items.forEach(item => {
    checklistSheet.appendRow([timestamp, item.id, item.name, item.current, sender, receiver]);
  });
  
  // 2. Update current quantities in VehicleInventory sheet
  const vData = vehicleSheet.getDataRange().getValues();
  items.forEach(item => {
    let found = false;
    for (let i = 1; i < vData.length; i++) {
      if (vData[i][0] == item.id) {
        vehicleSheet.getRange(i + 1, 4).setValue(item.current);
        found = true;
        break;
      }
    }
    if (!found) {
      vehicleSheet.appendRow([item.id, item.name, item.min || 0, item.current]);
    }
  });
  
  return { success: true, message: 'Checklist saved and inventory updated' };
}

function getVehicleTools() {
  const sheet = getSheet('VehicleTools');
  const data = sheet.getDataRange().getValues();
  const tools = [];
  
  for (let i = 1; i < data.length; i++) {
    tools.push({
      id: data[i][0],
      name: data[i][1],
      qty: data[i][2],
      status: 'complete' // Default status
    });
  }
  return { success: true, tools: tools };
}

function saveToolChecklist(tools, sender, receiver) {
  const sheet = getSheet('ToolChecklist');
  const timestamp = new Date();
  
  tools.forEach(tool => {
    sheet.appendRow([timestamp, tool.id, tool.name, tool.status, sender, receiver]);
  });
  
  return { success: true, message: 'Checklist saved' };
}

function getDashboardData() {
  const mainSheet = getSheet('MainInventory');
  const transSheet = getSheet('Transactions');
  
  const mainData = mainSheet.getDataRange().getValues();
  let totalItems = mainData.length > 1 ? mainData.length - 1 : 0;
  let lowStockItems = 0;
  
  for (let i = 1; i < mainData.length; i++) {
    if (parseInt(mainData[i][4]) <= parseInt(mainData[i][3])) {
      lowStockItems++;
    }
  }
  
  const transData = transSheet.getDataRange().getValues();
  const recentTransactions = [];
  
  // Get last 5 transactions
  const startIdx = Math.max(1, transData.length - 5);
  for (let i = transData.length - 1; i >= startIdx; i--) {
    recentTransactions.push({
      id: i,
      date: Utilities.formatDate(new Date(transData[i][0]), "GMT+7", "yyyy-MM-dd HH:mm"),
      type: transData[i][1],
      item: transData[i][3],
      qty: transData[i][4],
      user: transData[i][5]
    });
  }
  
  return {
    success: true,
    totalItems: totalItems,
    lowStockItems: lowStockItems,
    recentTransactions: recentTransactions
  };
}

function getUsers() {
  const sheet = getSheet('Users');
  const data = sheet.getDataRange().getValues();
  const users = [];
  for (let i = 1; i < data.length; i++) {
    users.push({
      username: data[i][0],
      pin: data[i][1],
      role: data[i][2],
      name: data[i][3]
    });
  }
  return { success: true, users: users };
}

function saveUser(user) {
  const sheet = getSheet('Users');
  const data = sheet.getDataRange().getValues();
  let found = false;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == user.username) {
      sheet.getRange(i + 1, 2).setValue(user.pin);
      sheet.getRange(i + 1, 3).setValue(user.role);
      sheet.getRange(i + 1, 4).setValue(user.name);
      found = true;
      break;
    }
  }
  if (!found) {
    sheet.appendRow([user.username, user.pin, user.role, user.name]);
  }
  return { success: true };
}

function deleteUser(username) {
  const sheet = getSheet('Users');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == username) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
  return { success: true };
}
// เพิ่มฟังก์ชันนี้เพื่อให้รองรับการเปิด URL ผ่าน Browser หรือการดึงข้อมูลแบบ GET
function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'getData') {
    const result = getMainInventory();
    return ContentService.createTextOutput(JSON.stringify(result.items))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput("Service is running. Please use POST for data operations or ?action=getData to fetch inventory.")
    .setMimeType(ContentService.MimeType.TEXT);
}