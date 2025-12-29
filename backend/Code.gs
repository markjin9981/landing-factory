/**
 * GOOGLE APPS SCRIPT CODE
 * Copy this into your Google Sheet's Script Editor
 * IMPORTANT: Deploy as Web App -> Execute as 'Me' -> Who has access 'Anyone'
 */

/**
 * [필수] 권한 승인 확인용 함수 (강력 Ver.)
 * 이 함수를 실행하여 "승인(Allow)"을 해야만 이미지 업로드가 가능합니다.
 * 실행 후 "Drive Access OK" 로그가 뜨면 성공입니다.
 */
function checkDrivePermissions() {
  // 1. 읽기 권한 확인
  var root = DriveApp.getRootFolder();
  
  // 2. 쓰기(파일 생성) 권한 강제 확인
  // 실제로 파일을 하나 만들었다가 바로 지웁니다.
  // 이 과정을 거쳐야 "DriveApp.createFile" 권한이 확실히 부여됩니다.
  var tempFile = DriveApp.createFile("temp_auth_check.txt", "Permission Check");
  tempFile.setTrashed(true); // 바로 휴지통으로 이동
  
  Logger.log("Drive Access OK: " + root.getName());
  Logger.log("Write Permission OK: File created and deleted.");
}

// =================================================================
// [UPDATED] doGet for Data Retrieval
// =================================================================
function doGet(e) {
  var params = e.parameter;
  var type = params.type;

  if (type === 'config') {
    return handleConfigRetrieval(params);
  } else if (type === 'configs') {
    return handleConfigsRetrieval(params);
  } else if (type === 'leads') {
    return handleLeadsRetrieval(params);
  } else if (type === 'visits') {
    return handleVisitsRetrieval(params);
  }

  return ContentService.createTextOutput("Backend Status: Online | Version: 3.0 (Read/Write) | Drive Access: OK");
}

// ... existing doPost ...
// (We leave doPost as is, but ensure it's not deleted. The tool only replaces the target range if I specify it right, 
// but here I am replacing the whole file or huge chunks? 
// No, I will target the `function doGet(e) { ... }` block and append the new handler functions at the end.)

// [Handlers for GET]

function handleConfigRetrieval(params) {
  var sheet = getOrCreateSheet("Configs");
  var id = params.id;
  var data = sheet.getDataRange().getValues();
  
  // Skip header (row 0)
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      var configJson = data[i][1];
      try {
        // Return pure JSON
        return ContentService.createTextOutput(configJson).setMimeType(ContentService.MimeType.JSON);
      } catch (e) {
        return ContentService.createTextOutput(JSON.stringify({error: "Invalid JSON in DB"})).setMimeType(ContentService.MimeType.JSON);
      }
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({error: "Config not found"})).setMimeType(ContentService.MimeType.JSON);
}

function handleConfigsRetrieval(params) {
  var sheet = getOrCreateSheet("Configs");
  var data = sheet.getDataRange().getValues();
  var configs = [];
  
  // Skip header
  for (var i = 1; i < data.length; i++) {
    try {
      var config = JSON.parse(data[i][1]);
      // Ensure ID matches the column
      config.id = data[i][0]; 
      configs.push(config);
    } catch (e) {
      // Skip invalid rows
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify(configs)).setMimeType(ContentService.MimeType.JSON);
}

function handleLeadsRetrieval(params) {
  var sheet = getOrCreateSheet("Leads");
  var data = sheet.getDataRange().getDisplayValues();
  var leads = [];
  var headers = data[0];
  
  for (var i = 1; i < data.length; i++) {
    var lead = {};
    for (var j = 0; j < headers.length; j++) {
      lead[headers[j]] = data[i][j];
    }
    leads.push(lead);
  }
  
  return ContentService.createTextOutput(JSON.stringify(leads)).setMimeType(ContentService.MimeType.JSON);
}

function handleVisitsRetrieval(params) {
  var sheet = getOrCreateSheet("Visits");
  var data = sheet.getDataRange().getDisplayValues();
  var visits = [];
  var headers = data[0];
  
  for (var i = 1; i < data.length; i++) {
    var visit = {};
    for (var j = 0; j < headers.length; j++) {
      visit[headers[j]] = data[i][j];
    }
    visits.push(visit);
  }
  
  return ContentService.createTextOutput(JSON.stringify(visits)).setMimeType(ContentService.MimeType.JSON);
}

// ... existing handleConfigSubmission ...

function doPost(e) {
  try {
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
        // JSON parse error or not JSON -> but might still have query params
      }
    }

    var type = params.type; 

    if (type === 'visit') {
      return handleVisitLog(params);
    } else if (type === 'email' || type === 'admin_email') { 
      return handleAdminEmail(params);
    } else if (type === 'admin_login') {
      return handleAdminLogin(params);
    } else if (type === 'admin_sessions') {
      return handleGetAdminSessions(params);
    } else if (type === 'revoke_session') {
      return handleRevokeSession(params);
    } else if (type === 'verify_session') {
      return handleVerifySession(params);
    } else if (type === 'config_save') {
      return handleConfigSubmission(params);
    } else if (type === 'config_delete') {
      return handleConfigDeletion(params);
    } else if (type === 'upload_image') { 
      // [CRITICAL] Ensure handleImageUpload catches its own errors, 
      // but if something else fails here, the outer catch will handle it.
      return handleImageUpload(params);
    } else { 
      return handleLeadSubmission(params);
    }

  } catch (criticalError) {
    // [GLOBAL CATCH]
    // If ANY unexpected error occurs in doPost (e.g. undefined variables, etc.),
    // return a valid JSON response so the frontend doesn't get a CORS/Network Error.
    return ContentService.createTextOutput(JSON.stringify({
      "result": "error",
      "message": "Critical Server Error: " + criticalError.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// =================================================================
// [NEW] Handle Admin Email Notification
// =================================================================
// =================================================================
// [NEW] Handle Admin Email Notification
// =================================================================
function handleAdminEmail(params) {
  var recipient = params.recipient;
  var subject = params.subject;
  var body = params.body;

  if (!recipient || !subject || !body) {
    return ContentService.createTextOutput(JSON.stringify({
       "result": "error", 
       "message": "Missing recipient, subject, or body"
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    MailApp.sendEmail(recipient, subject, body);
    return ContentService.createTextOutput(JSON.stringify({"result": "success"})).setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({
      "result": "error", 
      "message": "MailApp Error: " + e.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// =================================================================
// [NEW] Session Management Handlers
// =================================================================

function handleAdminLogin(params) {
  var sheet = getOrCreateSheet("AdminSessions");
  var sessionId = Utilities.getUuid();
  var timestamp = new Date().toLocaleString("ko-KR", {timeZone: "Asia/Seoul"});
  var ip = params.ip || "Unknown";
  var device = params.device || "Unknown";
  var userAgent = params.user_agent || "";

  // Append: [SessionID, Timestamp, IP, Device, UserAgent, Status]
  sheet.appendRow([sessionId, timestamp, ip, device, userAgent, "active"]);

  // Clean up old sessions (> 30 days) casually
  try {
     cleanupOldSessions(sheet);
  } catch(e) {}

  return ContentService.createTextOutput(JSON.stringify({
    "result": "success",
    "session_id": sessionId
  })).setMimeType(ContentService.MimeType.JSON);
}

function handleGetAdminSessions(params) {
  var sheet = getOrCreateSheet("AdminSessions");
  var data = sheet.getDataRange().getValues();
  var activeSessions = [];
  
  // Skip header
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    // row[5] is Status
    if (row[5] === "active") {
        activeSessions.push({
            session_id: row[0],
            timestamp: row[1],
            ip: row[2],
            device: row[3],
            user_agent: row[4]
        });
    }
  }
  
  // Return most recent first
  activeSessions.reverse();

  return ContentService.createTextOutput(JSON.stringify(activeSessions)).setMimeType(ContentService.MimeType.JSON);
}

function handleRevokeSession(params) {
  var targetSessionId = params.target_session_id;
  var sheet = getOrCreateSheet("AdminSessions");
  var data = sheet.getDataRange().getValues();
  var found = false;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(targetSessionId)) {
        // Update Status column (6th column, index 5) to 'revoked'
        sheet.getRange(i + 1, 6).setValue("revoked");
        found = true;
        break;
    }
  }
  
  if (found) {
    return ContentService.createTextOutput(JSON.stringify({"result": "success"})).setMimeType(ContentService.MimeType.JSON);
  } else {
    return ContentService.createTextOutput(JSON.stringify({"result": "error", "message": "Session not found"})).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleVerifySession(params) {
  var sessionId = params.session_id;
  var sheet = getOrCreateSheet("AdminSessions");
  var data = sheet.getDataRange().getValues();
  var isValid = false;

  for (var i = 1; i < data.length; i++) {
    // Check ID match AND Status is active
    if (String(data[i][0]) === String(sessionId) && data[i][5] === "active") {
        isValid = true;
        break;
    }
  }

  return ContentService.createTextOutput(JSON.stringify({
    "valid": isValid
  })).setMimeType(ContentService.MimeType.JSON);
}

function cleanupOldSessions(sheet) {
  // Simple check: if > 1000 rows, delete first 100? 
  // Or real date check. Safe limit: keep last 100 sessions.
  var lastRow = sheet.getLastRow();
  if (lastRow > 200) {
      // Keep headers + last 100
      // Delete rows 2 to (lastRow - 100)
      var rowsToDelete = lastRow - 100 - 1;
      if (rowsToDelete > 0) {
          sheet.deleteRows(2, rowsToDelete);
      }
  }
}

// =================================================================
// [NEW] Handle Image Upload to Google Drive
// =================================================================
// =================================================================
// [NEW] Handle Image Upload to Google Drive (Robust Version)
// =================================================================
// =================================================================
// [NEW] Handle Image Upload to Google Drive (Robust Version)
// - Uploads to specific folder: "landing-factory image"
// =================================================================
function handleImageUpload(params) {
  // 1. Base64 Decoding Safe Guard
  var file;
  var folderName = "landing-factory image"; // [UPDATE] Target Folder Name
  
  try {
    var data = Utilities.base64Decode(params.base64);
    var blob = Utilities.newBlob(data, params.mimeType, params.filename);
    
    // 2. [UPDATE] Find or Create Folder
    var folder;
    var folders = DriveApp.getFoldersByName(folderName);
    
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
    }
    
    // 3. Create File in Specific Folder
    file = folder.createFile(blob);
    
  } catch (createErr) {
    return ContentService.createTextOutput(JSON.stringify({
      "result": "error",
      "message": "File Create Failed: " + createErr.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // 4. Set Permissions (Try-Catch for Enterprise Restrictions)
  var url = "";
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    // Direct link for <img> tag (only works if public)
    // [UPDATE] Use 'thumbnail' link to bypass 3rd-party cookie blocking issues
    // sz=s3000 allows high-res up to 3000px (defaults to small otherwise)
    url = "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=s3000";
  } catch (permErr) {
    // If sharing fails, fallback to standard view link (user can click to view)
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
  // =================================================================
  // [NEW] Send Email Notification (Added by User Request)
  // =================================================================
  try {
    var recipient = "beanhull@gmail.com";
    var pageTitle = params.page_title || ("랜딩 ID " + params.landing_id);
    var landingId = params.landing_id || "Unknown";
    
    // [UPDATE] Timestamp format: YYYY. MM. DD. AM/PM HH:MM (No Seconds)
    var dateObj = new Date();
    var formattedDate = Utilities.formatDate(dateObj, "Asia/Seoul", "yyyy. MM. dd. a hh:mm");
    
    // [UPDATE] Subject format: [Page Title] 신규 DB 도착 [Timestamp]
    var subject = "[" + pageTitle + "] 신규 DB 도착 [" + formattedDate + "]";
    
    // [UPDATED] Email Body Construction
    // Strategy:
    // 1. Name, Phone first
    // 2. All Custom Fields (anything not system)
    // 3. Footer with technical info
    
    var body = "새로운 문의가 접수되었습니다.\n\n";
    body += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    body += " [ 접수 내용 ]\n";
    body += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    body += "■ 랜딩페이지: " + pageTitle + " (ID: " + landingId + ")\n\n";
    
    // 1. Priority Fields (Name, Phone)
    var priorityKeys = ['name', 'phone'];
    priorityKeys.forEach(function(k) {
       if (params[k]) {
          body += "■ " + k.toUpperCase() + ": " + params[k] + "\n";
       }
    });

    // 2. Custom Fields (Added Items)
    // Filter out priority keys and system keys
    var systemKeys = [
      'type', 'page_title', 'landing_id', 'timestamp', 
      'user_agent', 'referrer', 'marketing_consent', 
      'third_party_consent', 'privacy_consent', 'ip', 'device'
    ];
    
    for (var k in params) {
      // Skip if it's a priority key (already shown) or a system key
      if (priorityKeys.indexOf(k) !== -1) continue;
      if (systemKeys.indexOf(k) !== -1) continue;
      if (k.indexOf('consent') !== -1) continue; // Skip other consent fields

      // Show Custom Field
      // Try to make key look a bit better if it's just a raw code, but usually we just print key
      body += "■ " + k + ": " + params[k] + "\n";
    }
    
    body += "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    
    // 3. Detailed/Technical Info (Optional - maybe just User Agent/Referrer)
    if (params['referrer']) body += "- 유입경로: " + params['referrer'] + "\n";
    if (params['user_agent']) body += "- 기기정보: " + params['user_agent'] + "\n";
    
    body += "\n(본 메일은 랜딩페이지 팩토리에서 자동으로 발송되었습니다.)";
    
    MailApp.sendEmail(recipient, subject, body);
  } catch (e) {
    Logger.log("Email Notification Failed: " + e.toString());
    // Email failure should not fail the whole request
  }
  // =================================================================

  return ContentService.createTextOutput(JSON.stringify({"result":"success"})).setMimeType(ContentService.MimeType.JSON);
}

function handleConfigDeletion(params) {
  var sheet = getOrCreateSheet("Configs");
  var id = params.id;
  var data = sheet.getDataRange().getValues();
  
  // We need to find the row and delete it
  // Header is row 1
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      // Row index is i + 1
      sheet.deleteRow(i + 1);
      return ContentService.createTextOutput(JSON.stringify({"result":"success", "message": "Deleted ID " + id})).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({"result":"error", "message": "ID not found"})).setMimeType(ContentService.MimeType.JSON);
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
    } else if (name === "AdminSessions") {
      sheet.appendRow(["session_id", "timestamp", "ip", "device", "user_agent", "status"]);
    }
  }
  return sheet;
}