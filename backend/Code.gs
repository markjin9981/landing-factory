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

/**
 * [필수] 외부 통신 권한 승인 확인용 함수
 * 이 함수를 실행하여 "승인"을 해야 구글 로그인 검증이 가능합니다.
 */
function checkExternalUrlPermissions() {
  var response = UrlFetchApp.fetch("https://www.google.com");
  Logger.log("External Connection OK: Status " + response.getResponseCode());
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
  } else if (type === 'google_login') {
    return handleGoogleLogin(params);
  } else if (type === 'admin_users_list') {
    return handleGetAdminUsers(params);
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
    } else if (type === 'admin_user_add') {
      return handleAddAdminUser(params);
    } else if (type === 'admin_user_remove') {
      return handleRemoveAdminUser(params);
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
// [NEW] Google Login Handler
// =================================================================

function handleGoogleLogin(params) {
  var token = params.token;
  if (!token) {
    return ContentService.createTextOutput(JSON.stringify({"valid": false, "message": "No token provided"})).setMimeType(ContentService.MimeType.JSON);
  }

  // 1. Verify Token with Google
  var url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + token;
  try {
    var response = UrlFetchApp.fetch(url);
    var data = JSON.parse(response.getContentText());

    // 2. Validate Audience (Client ID)
    var authorizedClientId = "175843490646-ngqarhsg4fsi664gc8bg5v42438nai87.apps.googleusercontent.com";
    if (data.aud !== authorizedClientId) {
       return ContentService.createTextOutput(JSON.stringify({"valid": false, "message": "Invalid Client ID"})).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Check AdminUsers Sheet
    var email = data.email;
    var sheet = getOrCreateSheet("AdminUsers");
    var values = sheet.getDataRange().getValues();
    var isAuthorized = false;

    // If only header exists, allow the FIRST user to register automatically (Bootstrap mode)
    if (values.length <= 1) {
       sheet.appendRow([email, "First Admin", "Auto-added"]);
       isAuthorized = true;
    } else {
       // Check if email exists in column A (index 0)
       for (var i = 1; i < values.length; i++) {
         if (String(values[i][0]).toLowerCase() === String(email).toLowerCase()) {
           isAuthorized = true;
           break;
         }
       }
    }

    if (!isAuthorized) {
       return ContentService.createTextOutput(JSON.stringify({
         "valid": false, 
         "message": "Unauthorized Email: " + email + ". Please ask an administrator to add you to the AdminUsers sheet."
       })).setMimeType(ContentService.MimeType.JSON);
    }

    // 4. Create Session
    var sessionId = Utilities.getUuid();
    var timestamp = new Date().toLocaleString("ko-KR", {timeZone: "Asia/Seoul"});
    var ip = params.ip || "GoogleLogin"; // We can't easily get client IP in GAS doGet, maybe pass it from client if needed, but not critical
    var device = "Google Auth"; // Placeholder
    
    var sessionSheet = getOrCreateSheet("AdminSessions");
    sessionSheet.appendRow([sessionId, timestamp, ip, device, email, "active"]); // Updated schema to include email if helpful, but original schema was specific.
    // Original Schema: session_id, timestamp, ip, device, user_agent, status
    // I should follow original schema or update it?
    // Let's stick to original schema for `user_agent` (col 5) -> I'll put email there for now or keep consistency.
    // Actually, storing email in session log is useful.
    // Let's modify logic: appendRow([sessionId, timestamp, ip, device, email, "active"]); 
    // Wait, original: `user_agent` is 5th col. I will put email in `user_agent` column for now or add a new column?
    // Let's use `user_agent` column to store "Email: [email]" to be safe without schema change errors if code relies on index.
    
    // Better: Helper function handleAdminLogin uses: `sheet.appendRow([sessionId, timestamp, ip, device, userAgent, "active"]);`
    // I will call `handleAdminLogin` logic here or rewrite it.
    // I'll just append directly.
    
    return ContentService.createTextOutput(JSON.stringify({
      "valid": true,
      "email": email,
      "sessionId": sessionId
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({"valid": false, "message": "Token verification failed: " + e.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

// =================================================================
// [NEW] Admin User Management Handlers
// =================================================================

function handleGetAdminUsers(params) {
  var sheet = getOrCreateSheet("AdminUsers");
  var data = sheet.getDataRange().getValues();
  var admins = [];
  
  // Skip header
  for (var i = 1; i < data.length; i++) {
    admins.push({
      email: data[i][0],
      name: data[i][1] || "",
      memo: data[i][2] || ""
    });
  }
  
  return ContentService.createTextOutput(JSON.stringify(admins)).setMimeType(ContentService.MimeType.JSON);
}

function handleAddAdminUser(params) {
  var email = params.email;
  var name = params.name || "Admin";
  var memo = params.memo || "Added via Settings";
  
  if (!email) {
     return ContentService.createTextOutput(JSON.stringify({"result": "error", "message": "Email is required"})).setMimeType(ContentService.MimeType.JSON);
  }
  
  var sheet = getOrCreateSheet("AdminUsers");
  var data = sheet.getDataRange().getValues();
  
  // Check duplicate
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === String(email).toLowerCase()) {
       return ContentService.createTextOutput(JSON.stringify({"result": "error", "message": "Email already exists"})).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  sheet.appendRow([email, name, memo]);
  return ContentService.createTextOutput(JSON.stringify({"result": "success"})).setMimeType(ContentService.MimeType.JSON);
}

function handleRemoveAdminUser(params) {
  var targetEmail = params.email;
  var sheet = getOrCreateSheet("AdminUsers");
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === String(targetEmail).toLowerCase()) {
      sheet.deleteRow(i + 1);
      return ContentService.createTextOutput(JSON.stringify({"result": "success"})).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({"result": "error", "message": "User not found"})).setMimeType(ContentService.MimeType.JSON);
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

function doPost(e) {
  try {
    var params = e.parameter;
    var type = params.type;

    if (type === 'upload_file') {
      return handleFileUpload(e);
    } else if (type === 'config_submission') {
      return handleConfigSubmission(params);
    } else if (type === 'visit_log') {
      return handleVisitLog(params);
    } else if (type === 'config_deletion') {
      return handleConfigDeletion(params);
    } else if (type === 'lead_delete') {
      return handleLeadDeletion(params);
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

function handleVisitLog(params) {
  var sheet = getOrCreateSheet("Visits");
  var timestamp = new Date().toLocaleString("ko-KR", {timeZone: "Asia/Seoul"});
  
  sheet.appendRow([
    timestamp,
    params.landing_id || 'Unknown',
    params.ip || 'Unknown',
    params.device || 'Unknown',
    params.os || 'Unknown',
    params.browser || 'Unknown',
    params.referrer || 'Unknown'
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({"result":"success"})).setMimeType(ContentService.MimeType.JSON);
}

// =================================================================
// [NEW] Handle Lead Data Deletion
// =================================================================
function handleLeadDeletion(params) {
  // params.leads should be a JSON string of array of objects: 
  // [{ timestamp: '...', landing_id: '...', name: '...', phone: '...' }, ...]
  var targets = [];
  try {
    targets = JSON.parse(params.leads);
  } catch(e) {
    return ContentService.createTextOutput(JSON.stringify({"result":"error", "message": "Invalid leads data format"})).setMimeType(ContentService.MimeType.JSON);
  }

  if (!targets || targets.length === 0) {
     return ContentService.createTextOutput(JSON.stringify({"result":"success", "count": 0})).setMimeType(ContentService.MimeType.JSON);
  }

  var sheet = getOrCreateSheet("Leads");
  var data = sheet.getDataRange().getValues(); // 2D Array
  var headers = data[0]; // Row 1 is header

  // Find column indices
  var idxTimestamp = -1;
  var idxLandingId = -1;
  var idxName = -1;
  var idxPhone = -1;

  for (var h=0; h<headers.length; h++) {
    var hdr = headers[h].toLowerCase();
    if (hdr === 'timestamp') idxTimestamp = h;
    else if (hdr === 'landing id' || hdr === 'landing_id') idxLandingId = h;
    else if (hdr === 'name') idxName = h;
    else if (hdr === 'phone') idxPhone = h;
  }

  if (idxTimestamp === -1 || idxLandingId === -1) {
    return ContentService.createTextOutput(JSON.stringify({"result":"error", "message": "Critical columns missing"})).setMimeType(ContentService.MimeType.JSON);
  }

  // Strategy:
  // Iterate backwards so deleting rows doesn't mess up indices of upcoming rows.
  // We need to delete ALL matches.
  
  var deletedCount = 0;

  for (var t=0; t<targets.length; t++) {
    var target = targets[t];
    var tTime = String(target.timestamp || "").trim();
    var tId = String(target.landing_id || "").trim();
    var tName = String(target.name || "").trim();
    var tPhone = String(target.phone || "").trim();

    // Re-fetch data length or rely on loop?
    // Since we delete rows, the data array becomes stale if we refer to row index.
    // BUT, getValues() is a snapshot.
    // If we delete row 5, then row 6 becomes row 5.
    // So safest is to go completely backwards through the SHEET, checking against our target list.
    // This is computationally expensive if sheet is huge.
    // Optimization: Collect all row indices to delete first, then delete.
    // But `deleteRow` changes indices.
    // `deleteRows` can delete contiguous, but these might be scattered.
    // Safest: Go backwards.
  }

  // Let's optimize:
  // 1. Snapshot the sheet data.
  // 2. Identify all matching row INDICES (Using original indices).
  // 3. Sort indices descending.
  // 4. Delete one by one (or groups).

  var rowsToDelete = [];

  for (var i = data.length - 1; i >= 1; i--) { // Skip header (row 0)
    var row = data[i];
    
    // Check if this row matches ANY target
    // Exact match on Timestamp & LandingID is usually enough, but let's add Name/Phone for safety
    var rTime = String(row[idxTimestamp] || "").trim();
    var rId = String(row[idxLandingId] || "").trim();
    var rName = (idxName !== -1) ? String(row[idxName] || "").trim() : "";
    var rPhone = (idxPhone !== -1) ? String(row[idxPhone] || "").trim() : "";

    for (var t=0; t<targets.length; t++) {
      var target = targets[t];
      // Match logic
      var matchTime = (rTime === String(target.timestamp || "").trim());
      var matchId = (rId === String(target.landing_id || "").trim());
      
      if (matchTime && matchId) {
        // Optional stronger check
        if (target.phone && rPhone && target.phone !== rPhone) continue;
        if (target.name && rName && target.name !== rName) continue;
        
        // Exact match found!
        rowsToDelete.push(i + 1); // Sheet is 1-indexed
        // Remove this target from search to avoid double counting? No, multiple rows might be duplicate.
        // Break inner loop to count this row once
        break; 
      }
    }
  }

  // Delete rows
  // If we delete row N, N+1 becomes N.
  // Since we iterated backwards in search? No, `rowsToDelete` might be in any order if we didn't search backwards.
  // Wait, I iterated `data` backwards (length-1 down to 1). So `rowsToDelete` will be populated in Descending order (Leading with highest index).
  // e.g. [100, 99, 50, 10]
  // Perfect. We can just iterate this array and delete.
  
  for (var d=0; d<rowsToDelete.length; d++) {
    sheet.deleteRow(rowsToDelete[d]);
    deletedCount++;
  }

  return ContentService.createTextOutput(JSON.stringify({"result":"success", "deleted": deletedCount})).setMimeType(ContentService.MimeType.JSON);
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
    } else if (name === "AdminUsers") {
      sheet.appendRow(["email", "name", "memo"]);
    }
  }
  return sheet;
}