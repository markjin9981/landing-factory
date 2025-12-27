/**
 * GOOGLE APPS SCRIPT CODE
 * Copy this into your Google Sheet's Script Editor
 * IMPORTANT: Deploy as Web App -> Execute as 'Me' -> Who has access 'Anyone'
 */

function doPost(e) {
  var params = e.parameter;
  var type = params.type; // 'lead' or 'visit' or 'admin_email'
  
  if (type === 'visit') {
    return handleVisitLog(params);
  } else if (type === 'admin_email') {
    return handleEmail(params);
  } else {
    return handleLeadSubmission(params);
  }
}

function handleLeadSubmission(params) {
  var sheet = getOrCreateSheet("Leads");
  var timestamp = new Date().toLocaleString();
  var landingId = params.landing_id || 'unknown';
  var name = params.name || '';
  var phone = params.phone || '';
  
  sheet.appendRow([
    timestamp,
    landingId,
    name,
    phone,
    JSON.stringify(params)
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({"result":"success"})).setMimeType(ContentService.MimeType.JSON);
}

function handleVisitLog(params) {
  var sheet = getOrCreateSheet("Visits");
  var timestamp = new Date().toLocaleString();
  
  // Columns: Timestamp, Landing ID, IP, Device(PC/Mobile), OS, Browser, Referrer
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
  var recipient = params.recipient;
  var subject = params.subject;
  var body = params.body;
  
  if(recipient) {
    try {
      MailApp.sendEmail(recipient, subject, body);
    } catch(e) {
      // Mail might fail if quota exceeded
    }
  }
  return ContentService.createTextOutput(JSON.stringify({"result":"success"})).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var type = e.parameter.type;
  var sheetName = (type === 'visits') ? "Visits" : "Leads";
  
  var sheet = getOrCreateSheet(sheetName);
  var data = sheet.getDataRange().getValues();
  
  if (data.length < 2) {
      return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  }

  // Convert rows to array of objects
  var headers = data[0];
  var rows = data.slice(1);
  var result = rows.map(function(row) {
    var obj = {};
    headers.forEach(function(header, i) {
      obj[header] = row[i];
    });
    return obj;
  }).reverse(); // Newest first
  
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
      sheet.appendRow(["Timestamp", "Landing ID", "Name", "Phone", "Raw Data"]);
    } else if (name === "Visits") {
      sheet.appendRow(["Timestamp", "Landing ID", "IP", "Device", "OS", "Browser", "Referrer"]);
    }
  }
  return sheet;
}

function setup() {
  getOrCreateSheet("Leads");
  getOrCreateSheet("Visits");
}