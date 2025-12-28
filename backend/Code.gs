/**
 * GOOGLE APPS SCRIPT CODE
 * Copy this into your Google Sheet's Script Editor
 * IMPORTANT: Deploy as Web App -> Execute as 'Me' -> Who has access 'Anyone'
 */

/**
 * [필수] 권한 승인 확인용 함수
 * 이 함수를 상단 메뉴에서 선택하고 '실행(Run)' 버튼을 눌러주세요.
 * "권한 검토(Review Permissions)" 창이 뜨면 승인해야 이미지 업로드가 작동합니다.
 */
function checkDrivePermissions() {
  var root = DriveApp.getRootFolder();
  Logger.log("Drive Access OK: " + root.getName());
}

function doGet(e) {
  return ContentService.createTextOutput("Backend Status: Online | Version: 2.1 (JSON Patch) | Drive Access: OK");
}

function doPost(e) {
  // -----------------------------------------------------------------------
  // [Safety Check] Editor에서 '실행' 버튼을 누르면 e가 없어서 에러가 납니다.
  // 이 함수는 웹에서 요청이 올 때만 자동으로 실행됩니다.
  // -----------------------------------------------------------------------
  if (!e) {
    Logger.log("⚠️ 경고: 이 함수(doPost)는 에디터에서 직접 실행할 수 없습니다.");
    Logger.log("웹 앱으로 배포(Deploy) 후, 실제 데이터를 전송하여 테스트해야 합니다.");
    return ContentService.createTextOutput("Editor Test Mode: Please deploy app.");
  }

  // 1. Initialize params object (merged from query and body)
  var params = {};
  
  // 2. Add Query Parameters
  if (e.parameter) {
    for (var p in e.parameter) {
       params[p] = e.parameter[p];
    }
  }
  
  // 3. Add POST Body (JSON)
  if (e.postData && e.postData.contents) {
    try {
      var jsonBody = JSON.parse(e.postData.contents);
      for (var key in jsonBody) {
        params[key] = jsonBody[key];
      }
    } catch (err) {
      // JSON parse error or not JSON
    }
  }

  var type = params.type; 

  if (type === 'visit') {
    return handleVisitLog(params);
  } else if (type === 'email') { 
    return handleEmail(params);
  } else if (type === 'config_save') {
    return handleConfigSubmission(params);
  } else if (type === 'upload_image') { 
    return handleImageUpload(params);
  } else { 
    return handleLeadSubmission(params);
  }
}

// =================================================================
// [NEW] Handle Image Upload to Google Drive
// =================================================================
// =================================================================
// [NEW] Handle Image Upload to Google Drive (Robust Version)
// =================================================================
function handleImageUpload(params) {
  // 1. Base64 Decoding Safe Guard
  var file;
  try {
    var data = Utilities.base64Decode(params.base64);
    var blob = Utilities.newBlob(data, params.mimeType, params.filename);
    
    // 2. Create File
    file = DriveApp.createFile(blob);
  } catch (createErr) {
    return ContentService.createTextOutput(JSON.stringify({
      "result": "error",
      "message": "File Create Failed: " + createErr.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // 3. Set Permissions (Try-Catch for Enterprise Restrictions)
  var url = "";
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    // Direct link for <img> tag (only works if public)
    url = "https://drive.google.com/uc?export=view&id=" + file.getId();
  } catch (permErr) {
    // If sharing fails, fallback to standard view link
    url = "https://drive.google.com/file/d/" + file.getId() + "/view?usp=sharing";
  }
    
  return ContentService.createTextOutput(JSON.stringify({
    "result": "success",
    "url": url,
    "fileId": file.getId()
  })).setMimeType(ContentService.MimeType.JSON);
}

function handleConfigSubmission(params) {
  var sheet = getOrCreateSheet("Configs");
  var configId = params.id;
  var configData = params.config_data;

  var data = sheet.getDataRange().getValues();
  var found = false;
  // Start from 1 to skip header row
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == configId) { // Check if ID exists in the first column
      sheet.getRange(i + 1, 2).setValue(configData); // Update JSON in the second column
      found = true;
      break;
    }
  }

  if (!found) {
    sheet.appendRow([configId, configData]);
  }

  return ContentService.createTextOutput(JSON.stringify({"result":"success", "id": configId})).setMimeType(ContentService.MimeType.JSON);
}



function handleLeadSubmission(params) {
  var sheet = getOrCreateSheet("Leads");
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // 1. Build a map of Lowercase Header -> Real Header Name
  var headerMap = {};
  for(var i=0; i<headers.length; i++) {
    headerMap[headers[i].toLowerCase()] = headers[i];
  }

  // 2. Define standard field mappings (Frontend Key -> Sheet Header Name)
  // If the sheet header already exists (even if Title Case), we prioritize that.
  var standardMapping = {
    'landing_id': 'Landing ID',
    'name': 'Name',
    'phone': 'Phone',
    'timestamp': 'Timestamp',
    'user_agent': 'User Agent',
    'referrer': 'Referrer'
  };

  // 3. Process params to find missing headers
  var newHeaders = [];
  
  for (var key in params) {
    if (key === 'type') continue;

    var targetHeader = key; // Default to key itself
    
    // Check if it's a standard key
    if (standardMapping[key]) {
      targetHeader = standardMapping[key];
    }

    // Check if this target header (lowercase) already exists
    if (!headerMap[targetHeader.toLowerCase()] && !headerMap[key.toLowerCase()]) {
       // Only add if NEITHER the mapped name NOR the raw key exists
       newHeaders.push(targetHeader);
       // Add to map immediately to prevent duplicates within this loop
       headerMap[targetHeader.toLowerCase()] = targetHeader; 
    }
  }

  // 4. Add new headers if any
  if (newHeaders.length > 0) {
    sheet.getRange(1, sheet.getLastColumn() + 1, 1, newHeaders.length).setValues([newHeaders]);
    // Refresh headers
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    // Rebuild map (simple version)
    for(var i=0; i<headers.length; i++) {
      headerMap[headers[i].toLowerCase()] = headers[i];
    }
  }

  // 5. Create Row Data
  var timestamp = new Date().toLocaleString("ko-KR", {timeZone: "Asia/Seoul"});
  
  var rowData = headers.map(function(header) {
    var headerLower = header.toLowerCase();
    
    // Special Case: Timestamp
    if (headerLower === 'timestamp') return timestamp;
    
    // Find value in params
    // We need to reverse-lookup: which param key maps to this header?
    
    // Strategy: check direct match or mapped match
    // 1. Check if params has 'Name' (exact)
    if (params[header] !== undefined) return params[header];
    
    // 2. Check if params has 'name' (lowercase)
    if (params[headerLower] !== undefined) return params[headerLower];
    
    // 3. Check standard mapping reverse
    // (e.g. header is 'Landing ID', param is 'landing_id')
    for (var k in standardMapping) {
      if (standardMapping[k].toLowerCase() === headerLower) {
        if (params[k] !== undefined) return params[k];
      }
    }
    
    return ''; // Not found
  });
  
  sheet.appendRow(rowData);
  
  // =================================================================
  // [NEW] Send Email Notification (Added by User Request)
  // =================================================================
  try {
    var recipient = "beanhull@gmail.com";
    var pageTitle = params.page_title || ("랜딩 ID " + params.landing_id);
    var subject = "[랜딩 알림] " + pageTitle + " - 신규 DB가 도착했습니다.";
    
    var body = "새로운 문의가 접수되었습니다.\n\n";
    body += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    body += " [ 접수 내용 ]\n";
    body += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    
    // Sort keys for better readability if possible, or just iterate
    var keyOrder = ['name', 'phone', 'option', 'memo']; // Priority keys
    
    // 1. Priority fields first
    keyOrder.forEach(function(k) {
       if (params[k]) {
          body += "■ " + k.toUpperCase() + ": " + params[k] + "\n";
       }
    });

    body += "\n--- 상세 정보 ---\n";

    // 2. All other fields
    for (var k in params) {
      if (k === 'type' || k === 'page_title' || keyOrder.indexOf(k) !== -1) continue;
       body += "- " + k + ": " + params[k] + "\n";
    }
    
    body += "\n\n(본 메일은 랜딩페이지 팩토리에서 자동으로 발송되었습니다.)";
    
    MailApp.sendEmail(recipient, subject, body);
  } catch (e) {
    Logger.log("Email Notification Failed: " + e.toString());
    // Email failure should not fail the whole request
  }
  // =================================================================

  return ContentService.createTextOutput(JSON.stringify({"result":"success"})).setMimeType(ContentService.MimeType.JSON);
}

// ... (Other functions remain, update getOrCreateSheet below)

function getOrCreateSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (name === "Leads") {
      // Changed to Title Case to match standard
      sheet.appendRow(["Timestamp", "Landing ID", "Name", "Phone", "Raw Data"]); 
    } else if (name === "Visits") {
      sheet.appendRow(["Timestamp", "Landing ID", "IP", "Device", "OS", "Browser", "Referrer"]);
    } else if (name === "Configs") {
      sheet.appendRow(["id", "config_json"]);
    }
  }
  return sheet;
}