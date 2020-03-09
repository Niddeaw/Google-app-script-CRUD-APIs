// Create, update & clear filters + Get filtered rows

function setFilter() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var filterSettings = {};
  
  // The range of data on which you want to apply the filter.
  // optional arguments: startRowIndex, startColumnIndex, endRowIndex, endColumnIndex
  filterSettings.range = {
    sheetId: ss.getActiveSheet().getSheetId()
  };

  // Criteria for showing/hiding rows in a filter
  // https://developers.google.com/sheets/api/reference/rest/v4/FilterCriteria
  filterSettings.criteria = {};
  var columnIndex = 2;
  filterSettings['criteria'][columnIndex] = {
    'hiddenValues': ["England", "France"]
  };
  
  var request = {
    "setBasicFilter": {
      "filter": filterSettings
    }
  };
  Sheets.Spreadsheets.batchUpdate({'requests': [request]}, ss.getId());
}

function resetFilter() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ssId = ss.getId();
  var dataSheet = ss.getActiveSheet();
  var lastRow = dataSheet.getLastRow();
  var lastColumn = dataSheet.getLastColumn();
  var sheetId = dataSheet.getSheetId();
  
  var filterSettings = {
    "range": {
      "sheetId": sheetId,
      "startRowIndex": 0,
      "endRowIndex": lastRow,
      "startColumnIndex": 0,
      "endColumnIndex": lastColumn
    }
  };
  var requests = [{
    "setBasicFilter": {
      "filter": filterSettings
    }
  }];
  Sheets.Spreadsheets.batchUpdate({'requests': requests}, ssId);
}


function clearFilter() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ssId = ss.getId();
  var sheetId = ss.getActiveSheet().getSheetId();
  var requests = [{
    "clearBasicFilter": {
      "sheetId": sheetId
    }
  }];
  Sheets.Spreadsheets.batchUpdate({'requests': requests}, ssId);
}

function getFilteredRows() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ssId = ss.getId();
  var sh = ss.getActiveSheet();
  var data = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
  Logger.log(JSON.stringify(data));
}

function getIndexesOfFilteredRows(ssId, sheetId) {
  var hiddenRows = [];
  
  // limit what's returned from the API
  var fields = "sheets(data(rowMetadata(hiddenByFilter)),properties/sheetId)";
  var sheets = Sheets.Spreadsheets.get(ssId, {fields: fields}).sheets;  
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].properties.sheetId == sheetId) {
      var data = sheets[i].data;
      var rows = data[0].rowMetadata;
      for (var j = 0; j < rows.length; j++) {
        if (rows[j].hiddenByFilter) hiddenRows.push(j);
      }
    }
  }
  return hiddenRows;
} 
