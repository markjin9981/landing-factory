/**
 * GOOGLE APPS SCRIPT CODE
 * Copy this into your Google Sheet's Script Editor
 * IMPORTANT: Deploy as Web App -> Execute as 'Me' -> Who has access 'Anyone'
 */

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

  var params = e.parameter;
  var type = params.type; 

  if (type === 'visit') {
    return handleVisitLog(params);
  } else if (type === 'email') { // FIX: Match frontend 'type' for admin notifications
    return handleEmail(params);
  } else if (type === 'config_save') {
    return handleConfigSubmission(params);
  } else { // Default to lead
    return handleLeadSubmission(params);
  }
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
  
  // =================================================================
  // NEW: Dynamically add new columns if they don't exist
  // =================================================================
  var newHeaders = [];
  // Iterate over all submitted parameters
  for (var key in params) {
    // If a parameter is not 'type' and not found in existing headers, add it for creation
    if (key !== 'type' && headers.indexOf(key) === -1) {
      newHeaders.push(key);
    }
  }
  
  // If there are any new fields, append them to the header row
  if (newHeaders.length > 0) {
    sheet.getRange(1, sheet.getLastColumn() + 1, 1, newHeaders.length).setValues([newHeaders]);
    // Re-fetch headers to include the newly added ones
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }
  // =================================================================

  // Create row data based on the final (potentially updated) header order
  var timestamp = new Date().toLocaleString("ko-KR", {timeZone: "Asia/Seoul"});
  var rowData = headers.map(function(header) {
    if (header === 'timestamp') return timestamp; // Always set the timestamp
    return params[header] || ''; // Map param value to header, or empty string if not present
  });
  
  sheet.appendRow(rowData);
  
  return ContentService.createTextOutput(JSON.stringify({"result":"success"})).setMimeType(ContentService.MimeType.JSON);
}

function handleVisitLog(params) {
  var sheet = getOrCreateSheet("Visits");
  var timestamp = new Date().toLocaleString("ko-KR", {timeZone: "Asia/Seoul"});
  
  sheet.appendRow([
    timestamp,
    params.landing_id || 'unknown',
    params.ip || '',
    params.device || 'Unknown',
    params.os || '',
    params.browser || '',
    params.referrer || 'Direct'
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({"result":"success"})).setMimeType(ContentService.MimeType.JSON);
}

function handleEmail(params) {
  var recipient = params.to; // FIX: Frontend sends 'to', not 'recipient'
  var subject = params.subject;
  var body = params.body;
  
  if(recipient) {
    try {
      MailApp.sendEmail(recipient, subject, body);
    } catch(e) {
      // Mail might fail if quota is exceeded or permissions are wrong
      Logger.log("Email failed: " + e.toString());
    }
  }
  return ContentService.createTextOutput(JSON.stringify({"result":"success"})).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  // -----------------------------------------------------------------------
  // [Safety Check] Run directly in editor -> params undefined
  // -----------------------------------------------------------------------
  if (!e) {
    Logger.log("⚠️ 경고: 이 함수(doGet)는 에디터에서 직접 실행할 수 없습니다.");
    return ContentService.createTextOutput("Editor Test Mode: Please deploy app.");
  }

  var type = e.parameter.type;
  var id = e.parameter.id;
  var sheetName;

  if (type === 'visits') {
    sheetName = "Visits";
  } else if (type === 'configs' || type === 'config') {
    sheetName = "Configs";
  } else {
    sheetName = "Leads";
  }
  
  var sheet = getOrCreateSheet(sheetName);
  var data = sheet.getDataRange().getValues();
  
  if (data.length < 2) {
      // If only header row exists, return empty array
      return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  }

  var headers = data[0];
  var rows = data.slice(1);
  
  // Handle single config fetch
  if (type === 'config' && id) {
    for (var i = 0; i < rows.length; i++) {
      if (rows[i][0] == id) { // ID is in the first column
        try {
          var configObj = JSON.parse(rows[i][1]); // Config JSON is in the second column
          return ContentService.createTextOutput(JSON.stringify(configObj)).setMimeType(ContentService.MimeType.JSON);
        } catch (err) {
          // Fallback for corrupted JSON
          return ContentService.createTextOutput(JSON.stringify({error: "Invalid JSON format"})).setMimeType(ContentService.MimeType.JSON);
        }
      }
    }
    return ContentService.createTextOutput(JSON.stringify(null)).setMimeType(ContentService.MimeType.JSON);
  }

  // Handle list fetch
  var result = rows.map(function(row) {
    var obj = {};
    if (sheetName === 'Configs') {
      try {
        // For config list, return the full parsed config object
        obj = JSON.parse(row[1]);
      } catch (err) {
        // Provide a graceful fallback for malformed JSON entries
        obj = { id: row[0], title: "Error: Invalid JSON", hero: { headline: 'Configuration Error' } };
      }
    } else {
      // For Leads/Visits, map headers to row values
      headers.forEach(function(header, i) {
        obj[header] = row[i];
      });
    }
    return obj;
  }).reverse(); // Show newest entries first
  
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}


function getOrCreateSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (name === "Leads") {
      // Set up a minimal, essential set of headers. Others will be added dynamically.
      sheet.appendRow(["timestamp", "landing_id", "name", "phone", "user_agent", "referrer"]);
    } else if (name === "Visits") {
      sheet.appendRow(["Timestamp", "Landing ID", "IP", "Device", "OS", "Browser", "Referrer"]);
    } else if (name === "Configs") {
      sheet.appendRow(["id", "config_json"]);
    }
  }
  return sheet;
}