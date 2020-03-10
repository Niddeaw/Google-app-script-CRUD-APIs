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
  var sheetId = ss.getActiveSheet().getSheetId();
  let data = getIndexesOfFilteredRows(ssId,sheetId);
  Logger.log(JSON.stringify(data));
}

function getIndexesOfFilteredRows(ssId, sheetId) {
  var object = {hiddenRows: [], hiddenRowValues: [], shownRows: [], shownRowValues: []};

  // limit what's returned from the API
  var fields = "sheets(data,properties/sheetId)";
  var sheets = Sheets.Spreadsheets.get(ssId, {fields: fields}).sheets;  
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].properties.sheetId == sheetId) {
      var data = sheets[i].data;
      var rows = data[0].rowMetadata;
      console.log(rows);
      for (var j = 0; j < rows.length; j++) {
        var r = [];
        if (data[0].rowData[j] && Array.isArray(data[0].rowData[j].values)) {
          r = data[0].rowData[j].values.map(function(e) {
            var temp = "";
            if (e.hasOwnProperty("userEnteredValue")) {
              if (e.userEnteredValue.hasOwnProperty("numberValue")) {
                temp = e.userEnteredValue.numberValue;
              } else if (e.userEnteredValue.hasOwnProperty("stringValue")) {
                temp = e.userEnteredValue.stringValue;
              }
            }
            return temp;
          });
        }
        if (r.length > 0) {
          if (!rows[j].hiddenByFilter) {
            object.shownRows.push(j);
            object.shownRowValues.push(r);
          }
        }
      }
    }
  }
  return object;
}

function getIndexesOfFilteredRows1(ssId, sheetId) {
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


function myFunction() {
  var filterValues = ["England", "France"]; // Please set the filter values.
  var column = 3; // In this case, it's the column "C". Please set the column number.
  var sheetName = "Sheet1";  // Please set the sheet name.

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  var values = sheet.getDataRange().getValues();
  var object = values.reduce(function(o, e, i) {
    if (filterValues.indexOf(e[column - 1]) > -1) {
      o.hiddenRows.push(i + 1);
      o.hiddenRowValues.push(e);
    } else {
      o.shownRows.push(i + 1);
      o.shownRowValues.push(e);
    }
    return o;
  }, {hiddenRows: [], hiddenRowValues: [], shownRows: [], shownRowValues: []});

  Logger.log(JSON.stringify(object))
}
