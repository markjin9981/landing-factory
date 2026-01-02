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
  var root = DriveApp.getRootFolder();
  var tempFile = DriveApp.createFile("temp_auth_check.txt", "Permission Check");
  tempFile.setTrashed(true);
  Logger.log("Drive Access OK: " + root.getName());
  Logger.log("Write Permission OK: File created and deleted.");
}

/**
 * [필수] 외부 통신 권한 승인 확인용 함수
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
  } else if (type === 'admin_login') {
      // Allow GET for admin login if needed to retrieve session_id easily
      // But verify security implications. Here we just strictly pass params.
      return handleAdminLogin(params);
  } else if (type === 'verify_session') {
      return handleVerifySession(params);
  } else if (type === 'revoke_session') {
      return handleRevokeSession(params);
  } else if (type === 'sync_fonts') {
  } else if (type === 'sync_fonts') {
      return handleSyncFonts(params);
  } else if (type === 'proxy_font') {
      return handleFontProxy(params);
  }

  return ContentService.createTextOutput("Backend Status: Online | Version: 3.4 (Font Proxy) | Drive Access: OK");
}

function handleFontProxy(params) {
  var fileId = params.id;
  if (!fileId) return ContentService.createTextOutput(JSON.stringify({"error": "No File ID"})).setMimeType(ContentService.MimeType.JSON);

  try {
    var file = DriveApp.getFileById(fileId);
    var blob = file.getBlob();
    var base64 = Utilities.base64Encode(blob.getBytes());
    var mimeType = file.getMimeType();
    
    // Determine format hint if possible
    var name = file.getName().toLowerCase();
    var format = 'truetype';
    if (name.endsWith('.woff2')) format = 'woff2';
    else if (name.endsWith('.woff')) format = 'woff';
    else if (name.endsWith('.otf')) format = 'opentype';

    return ContentService.createTextOutput(JSON.stringify({
      "result": "success",
      "data": base64,
      "mime": mimeType,
      "format": format
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({"error": "Fetch Failed: " + e.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleSyncFonts(params) {
  var folderName = "Landing-factory font";
  var folders = DriveApp.getFoldersByName(folderName);
  var fonts = [];
  
  if (folders.hasNext()) {
    var folder = folders.next();
    var files = folder.getFiles();
    while (files.hasNext()) {
      var file = files.next();
      var mime = file.getMimeType();
      var name = file.getName();
      
      // Simple check for font extensions or mime types
      var match = name.match(/\.(ttf|otf|woff|woff2)$/i);
      if (match || mime.indexOf('font') !== -1) {
         var ext = match ? match[1].toLowerCase() : '';
         var format = 'truetype'; // default
         if (ext === 'woff2') format = 'woff2';
         else if (ext === 'woff') format = 'woff';
         else if (ext === 'otf') format = 'opentype';

         // Create a stable ID based on file ID to prevent duplicates
         fonts.push({
           id: file.getId(), 
           name: name.replace(/\.(ttf|otf|woff|woff2)$/i, ''), // Remove extension for display name
           family: name.replace(/\.(ttf|otf|woff|woff2)$/i, '').replace(/\s+/g, ''), // CSS Family Name
           source: 'file',
           url: "https://drive.google.com/uc?export=download&id=" + file.getId(),
           format: format
         });
      }
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify(fonts)).setMimeType(ContentService.MimeType.JSON);
}

function handleConfigRetrieval(params) {
  var sheet = getOrCreateSheet("Configs");
  var id = params.id;
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      var configJson = data[i][1];
      try {
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
  
  for (var i = 1; i < data.length; i++) {
    try {
      var config = JSON.parse(data[i][1]);
      config.id = data[i][0]; 
      configs.push(config);
    } catch (e) {}
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

// =================================================================
// [UPDATED] doPost Handler (Unified)
// =================================================================
function doPost(e) {
  try {
    if (!e) {
      return ContentService.createTextOutput("Editor Test Mode: Please deploy app.");
    }

    var params = {};
    if (e.parameter) {
      for (var p in e.parameter) { params[p] = e.parameter[p]; }
    }
    if (e.postData && e.postData.contents) {
      try {
        var jsonBody = JSON.parse(e.postData.contents);
        for (var key in jsonBody) { params[key] = jsonBody[key]; }
      } catch (err) {}
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
    } else if (type === 'config_save' || type === 'config_submission') {
      return handleConfigSubmission(params);
    } else if (type === 'config_delete' || type === 'config_deletion') {
      return handleConfigDeletion(params);
    } else if (type === 'upload_image') { 
      return handleImageUpload(params);
    } else if (type === 'admin_user_add') {
      return handleAddAdminUser(params);
    } else if (type === 'admin_user_remove') {
      return handleRemoveAdminUser(params);
    } else if (type === 'lead_delete') {
      return handleLeadDeletion(params);
    } else if (type === 'virtual_data') {
      return handleVirtualData(params);
    } else { 
      // Default to lead submission
      return handleLeadSubmission(params);
    }

  } catch (criticalError) {
    return ContentService.createTextOutput(JSON.stringify({
      "result": "error",
      "message": "Critical Server Error: " + criticalError.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// =================================================================
// Handlers
// =================================================================

function handleAdminEmail(params) {
  var recipient = params.recipient;
  var subject = params.subject;
  var body = params.body;

  if (!recipient || !subject || !body) {
    return ContentService.createTextOutput(JSON.stringify({"result": "error", "message": "Missing recipient, subject, or body"})).setMimeType(ContentService.MimeType.JSON);
  }
  try {
    MailApp.sendEmail(recipient, subject, body);
    return ContentService.createTextOutput(JSON.stringify({"result": "success"})).setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({"result": "error", "message": "MailApp Error: " + e.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleGoogleLogin(params) {
  var token = params.token;
  if (!token) return ContentService.createTextOutput(JSON.stringify({"valid": false, "message": "No token"})).setMimeType(ContentService.MimeType.JSON);

  var url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + token;
  try {
    var response = UrlFetchApp.fetch(url);
    var data = JSON.parse(response.getContentText());
    var authorizedClientId = "175843490646-ngqarhsg4fsi664gc8bg5v42438nai87.apps.googleusercontent.com";
    if (data.aud !== authorizedClientId) {
       return ContentService.createTextOutput(JSON.stringify({"valid": false, "message": "Invalid Client ID"})).setMimeType(ContentService.MimeType.JSON);
    }

    var email = data.email;
    var sheet = getOrCreateSheet("AdminUsers");
    var values = sheet.getDataRange().getValues();
    var isAuthorized = false;

    if (values.length <= 1) {
       sheet.appendRow([email, "First Admin", "Auto-added"]);
       isAuthorized = true;
    } else {
       for (var i = 1; i < values.length; i++) {
         if (String(values[i][0]).toLowerCase() === String(email).toLowerCase()) {
           isAuthorized = true;
           break;
         }
       }
    }

    if (!isAuthorized) {
       return ContentService.createTextOutput(JSON.stringify({"valid": false, "message": "Unauthorized Email"})).setMimeType(ContentService.MimeType.JSON);
    }

    var sessionId = Utilities.getUuid();
    var timestamp = new Date().toLocaleString("ko-KR", {timeZone: "Asia/Seoul"});
    var ip = params.ip || "GoogleLogin";
    var device = "Google Auth";
    
    var sessionSheet = getOrCreateSheet("AdminSessions");
    // [SessionID, Timestamp, IP, Device, UserAgent(Email), Status]
    sessionSheet.appendRow([sessionId, timestamp, ip, device, email, "active"]);
    
    return ContentService.createTextOutput(JSON.stringify({
      "valid": true,
      "email": email,
      "sessionId": sessionId
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({"valid": false, "message": "Token verification failed: " + e.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleGetAdminUsers(params) {
  var sheet = getOrCreateSheet("AdminUsers");
  var data = sheet.getDataRange().getValues();
  var admins = [];
  for (var i = 1; i < data.length; i++) {
    admins.push({ email: data[i][0], name: data[i][1] || "", memo: data[i][2] || "" });
  }
  return ContentService.createTextOutput(JSON.stringify(admins)).setMimeType(ContentService.MimeType.JSON);
}

function handleAddAdminUser(params) {
  var email = params.email;
  var name = params.name || "Admin";
  var memo = params.memo || "Added via Settings";
  if (!email) return ContentService.createTextOutput(JSON.stringify({"result": "error", "message": "Email required"})).setMimeType(ContentService.MimeType.JSON);
  
  var sheet = getOrCreateSheet("AdminUsers");
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === String(email).toLowerCase()) {
       return ContentService.createTextOutput(JSON.stringify({"result": "error", "message": "User exists"})).setMimeType(ContentService.MimeType.JSON);
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

function handleAdminLogin(params) {
  var sheet = getOrCreateSheet("AdminSessions");
  var sessionId = Utilities.getUuid();
  var timestamp = new Date().toLocaleString("ko-KR", {timeZone: "Asia/Seoul"});
  var ip = params.ip || "Unknown";
  var device = params.device || "Unknown";
  var userAgent = params.user_agent || "";

  sheet.appendRow([sessionId, timestamp, ip, device, userAgent, "active"]);

  try { cleanupOldSessions(sheet); } catch(e) {}

  return ContentService.createTextOutput(JSON.stringify({ "result": "success", "session_id": sessionId })).setMimeType(ContentService.MimeType.JSON);
}

function handleGetAdminSessions(params) {
  var sheet = getOrCreateSheet("AdminSessions");
  var data = sheet.getDataRange().getValues();
  var activeSessions = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
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
  activeSessions.reverse();
  return ContentService.createTextOutput(JSON.stringify(activeSessions)).setMimeType(ContentService.MimeType.JSON);
}

function handleRevokeSession(params) {
  var targetSessionId = params.target_session_id;
  var sheet = getOrCreateSheet("AdminSessions");
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(targetSessionId)) {
        sheet.getRange(i + 1, 6).setValue("revoked");
        return ContentService.createTextOutput(JSON.stringify({"result": "success"})).setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({"result": "error", "message": "Session not found"})).setMimeType(ContentService.MimeType.JSON);
}

function handleVerifySession(params) {
  var sessionId = params.session_id;
  var sheet = getOrCreateSheet("AdminSessions");
  var data = sheet.getDataRange().getValues();
  var isValid = false;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(sessionId) && data[i][5] === "active") {
        isValid = true;
        break;
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ "valid": isValid })).setMimeType(ContentService.MimeType.JSON);
}

function cleanupOldSessions(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow > 200) {
      var rowsToDelete = lastRow - 100 - 1;
      if (rowsToDelete > 0) sheet.deleteRows(2, rowsToDelete);
  }
}

function handleImageUpload(params) {
  var folderName = params.folderName || "landing-factory image"; 
  var file;
  try {
    var data = Utilities.base64Decode(params.base64);
    var blob = Utilities.newBlob(data, params.mimeType, params.filename);
    var folder;
    var folders = DriveApp.getFoldersByName(folderName);
    if (folders.hasNext()) folder = folders.next();
    else folder = DriveApp.createFolder(folderName);
    file = folder.createFile(blob);
  } catch (createErr) {
    return ContentService.createTextOutput(JSON.stringify({"result": "error", "message": "File Create Failed: " + createErr.toString()})).setMimeType(ContentService.MimeType.JSON);
  }

  var url = "";
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    if (params.mimeType && params.mimeType.indexOf("image/") === 0) {
       url = "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=s3000";
    } else {
       url = "https://drive.google.com/uc?export=download&id=" + file.getId();
    }
  } catch (permErr) {
    url = "https://drive.google.com/file/d/" + file.getId() + "/view?usp=sharing";
  }
    
  return ContentService.createTextOutput(JSON.stringify({"result": "success", "url": url, "fileId": file.getId()})).setMimeType(ContentService.MimeType.JSON);
}

function handleConfigSubmission(params) {
  var sheet = getOrCreateSheet("Configs");
  var configId = params.id;
  var configData = params.config_data;
  var data = sheet.getDataRange().getValues();
  var found = false;
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == configId) {
      sheet.getRange(i + 1, 2).setValue(configData);
      found = true;
      break;
    }
  }
  if (!found) sheet.appendRow([configId, configData]);
  return ContentService.createTextOutput(JSON.stringify({"result":"success", "id": configId})).setMimeType(ContentService.MimeType.JSON);
}

// =================================================================
// [NEW] Virtual Data Sync Handler
// =================================================================
function handleVirtualData(params) {
  var action = params.action; // 'init_sheet' or 'sync_data'
  var landingId = params.landing_id;
  
  if (!landingId) return ContentService.createTextOutput(JSON.stringify({"result": "error", "message": "Landing ID required"})).setMimeType(ContentService.MimeType.JSON);

  var rootFolder = DriveApp.getRootFolder();
  var folderName = "Landing-factory Data";
  var folder;
  var folders = rootFolder.getFoldersByName(folderName);
  
  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    folder = rootFolder.createFolder(folderName);
  }

  var fileName = "LandingData_" + landingId;

  if (action === 'init_sheet') {
    var files = folder.getFilesByName(fileName);
    var file;
    var ss;

    if (files.hasNext()) {
      file = files.next();
      file.setTrashed(false); // Restore if trashed
    } else {
      ss = SpreadsheetApp.create(fileName);
      file = DriveApp.getFileById(ss.getId());
      file.moveTo(folder);
      
      // Initialize with template
      var sheet = ss.getSheets()[0];
      sheet.setName("VirtualData");
      sheet.getRange(1, 1, 1, 6).setValues([["이름", "전화번호", "직업", "나이", "지역", "기타"]]);
      // Add sample
      sheet.getRange(2, 1, 1, 6).setValues([["김철수", "010-1234-5678", "회사원", "30대", "서울", "-"]]);
    }

    return ContentService.createTextOutput(JSON.stringify({
      "result": "success", 
      "url": file.getUrl(),
      "fileId": file.getId()
    })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'sync_data') {
    var files = folder.getFilesByName(fileName);
    if (!files.hasNext()) {
       return ContentService.createTextOutput(JSON.stringify({"result": "error", "message": "Sheet not found. Please init first."})).setMimeType(ContentService.MimeType.JSON);
    }
    var file = files.next();
    var ss = SpreadsheetApp.openById(file.getId());
    var sheet = ss.getSheets()[0];
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn(); // Max 6 enforced in frontend usually, but read all here
    
    if (lastRow < 1) return ContentService.createTextOutput(JSON.stringify({"result": "success", "headers": [], "data": []})).setMimeType(ContentService.MimeType.JSON);

    var range = sheet.getRange(1, 1, lastRow, lastCol);
    var values = range.getDisplayValues();
    
    var headers = values[0]; // Row 1 is Header
    var data = values.slice(1); // Row 2+ is Data
    
    return ContentService.createTextOutput(JSON.stringify({
      "result": "success",
      "headers": headers,
      "data": data
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleLeadSubmission(params) {
  var sheet = getOrCreateSheet("Leads");
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var headerMap = {};
  for(var i=0; i<headers.length; i++) headerMap[headers[i].toLowerCase()] = headers[i];

  var standardMapping = { 'landing_id': 'Landing ID', 'name': 'Name', 'phone': 'Phone', 'timestamp': 'Timestamp', 'user_agent': 'User Agent', 'referrer': 'Referrer' };
  var newHeaders = [];
  
  for (var key in params) {
    if (key === 'type' || key === 'formatted_fields') continue; // Skip internal fields
    var targetHeader = standardMapping[key] || key;
    if (!headerMap[targetHeader.toLowerCase()] && !headerMap[key.toLowerCase()]) {
       newHeaders.push(targetHeader);
       headerMap[targetHeader.toLowerCase()] = targetHeader; 
    }
  }

  if (newHeaders.length > 0) {
    sheet.getRange(1, sheet.getLastColumn() + 1, 1, newHeaders.length).setValues([newHeaders]);
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }

  var timestamp = new Date().toLocaleString("ko-KR", {timeZone: "Asia/Seoul"});
  var rowData = headers.map(function(header) {
    var headerLower = header.toLowerCase();
    if (headerLower === 'timestamp') return timestamp;
    
    if (params[header] !== undefined) return params[header];
    if (params[headerLower] !== undefined) return params[headerLower];
    for (var k in standardMapping) {
      if (standardMapping[k].toLowerCase() === headerLower && params[k] !== undefined) return params[k];
    }
    return '';
  });
  
  sheet.appendRow(rowData);
  
  // Email Notification
  try {
    var recipient = "beanhull@gmail.com"; // Consider making this dynamic if needed
    var pageTitle = params.page_title || ("랜딩 ID " + params.landing_id);
    var landingId = params.landing_id || "Unknown";
    var dateObj = new Date();
    var formattedDate = Utilities.formatDate(dateObj, "Asia/Seoul", "yyyy. MM. dd. a hh:mm");
    var subject = "[" + pageTitle + "] 신규 DB 도착 [" + formattedDate + "]";
    
    var body = "새로운 문의가 접수되었습니다.\n\n";
    body += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    body += " [ 접수 내용 ]\n";
    body += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    body += "■ 랜딩페이지: " + pageTitle + " (ID: " + landingId + ")\n\n";
    
    // [NEW] Use Formatted Fields if available (Strict Order from Editor)
    if (params.formatted_fields) {
        try {
            var fields = JSON.parse(params.formatted_fields);
            // fields = [{label: '이름', value: '홍길동'}, {label: '직업', value: '학생'} ...]
            for (var i = 0; i < fields.length; i++) {
                body += "■ " + fields[i].label + ": " + fields[i].value + "\n";
            }
        } catch (jsonErr) {
            // Fallback (Should not happen)
             body += "■ (데이터 파싱 오류 - 원본 데이터 확인 필요)\n";
        }
    } else {
        // Fallback to legacy logic (Dump defined keys)
        var priorityKeys = ['name', 'phone'];
        priorityKeys.forEach(function(k) { if (params[k]) body += "■ " + k.toUpperCase() + ": " + params[k] + "\n"; });

        var systemKeys = ['type', 'page_title', 'landing_id', 'timestamp', 'user_agent', 'referrer', 'marketing_consent', 'third_party_consent', 'privacy_consent', 'ip', 'device', 'formatted_fields'];
        
        for (var k in params) {
          if (priorityKeys.indexOf(k) !== -1) continue;
          if (systemKeys.indexOf(k) !== -1) continue;
          if (k.indexOf('consent') !== -1) continue;
          body += "■ " + k + ": " + params[k] + "\n";
        }
    }
    
    body += "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    if (params['referrer']) body += "- 유입경로: " + params['referrer'] + "\n";
    if (params['user_agent']) body += "- 기기정보: " + params['user_agent'] + "\n";
    body += "\n(본 메일은 랜딩페이지 팩토리에서 자동으로 발송되었습니다.)";
    
    MailApp.sendEmail(recipient, subject, body);
  } catch (e) {
      // Mail fail suppression
  }

  return ContentService.createTextOutput(JSON.stringify({"result":"success"})).setMimeType(ContentService.MimeType.JSON);
}

function handleVisitLog(params) {
  var sheet = getOrCreateSheet("Visits");
  var timestamp = new Date().toLocaleString("ko-KR", {timeZone: "Asia/Seoul"});
  sheet.appendRow([timestamp, params.landing_id || 'Unknown', params.ip || 'Unknown', params.device || 'Unknown', params.os || 'Unknown', params.browser || 'Unknown', params.referrer || 'Unknown']);
  return ContentService.createTextOutput(JSON.stringify({"result":"success"})).setMimeType(ContentService.MimeType.JSON);
}

function handleLeadDeletion(params) {
  var targets = [];
  try { targets = JSON.parse(params.leads); } catch(e) {}
  if (!targets || targets.length === 0) return ContentService.createTextOutput(JSON.stringify({"result":"success", "count": 0})).setMimeType(ContentService.MimeType.JSON);

  var sheet = getOrCreateSheet("Leads");
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
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

  var rowsToDelete = [];

  for (var i = data.length - 1; i >= 1; i--) { 
    var row = data[i];
    var rTime = String(row[idxTimestamp] || "").trim();
    var rId = String(row[idxLandingId] || "").trim();
    var rName = (idxName !== -1) ? String(row[idxName] || "").trim() : "";
    var rPhone = (idxPhone !== -1) ? String(row[idxPhone] || "").trim() : "";

    for (var t=0; t<targets.length; t++) {
      var target = targets[t];
      var matchTime = (rTime === String(target.timestamp || "").trim());
      var matchId = (rId === String(target.landing_id || "").trim());
      
      if (matchTime && matchId) {
        if (target.phone && rPhone && target.phone !== rPhone) continue;
        if (target.name && rName && target.name !== rName) continue;
        rowsToDelete.push(i + 1);
        break; 
      }
    }
  }

  var deletedCount = 0;
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
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return ContentService.createTextOutput(JSON.stringify({"result":"success", "message": "Deleted ID " + id})).setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({"result":"error", "message": "ID not found"})).setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (name === "Leads") sheet.appendRow(["Timestamp", "Landing ID", "Name", "Phone", "Raw Data"]); 
    else if (name === "Visits") sheet.appendRow(["Timestamp", "Landing ID", "IP", "Device", "OS", "Browser", "Referrer"]);
    else if (name === "Configs") sheet.appendRow(["id", "config_json"]);
    else if (name === "AdminSessions") sheet.appendRow(["session_id", "timestamp", "ip", "device", "user_agent", "status"]);
    else if (name === "AdminUsers") sheet.appendRow(["email", "name", "memo"]);
  }
  return sheet;
}