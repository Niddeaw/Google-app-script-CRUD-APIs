/* Route
 * All Request with Method Get will be proces here
 */
function doGet(req) {
  var db = SpreadsheetApp.openById(""); 
  var action = req.parameter.action;
  var table = req.parameter.table;
 
  var sheetUsers = db.getSheetByName(table);
   
   switch(action) {
       case "read":
           return doRead(req, sheetUsers);
           break;
       case "insert":
           return doInsert(req, sheetUsers);
           break;
       case "update":
           return doUpdate(req, sheetUsers);
           break;
       case "delete":
           return doDelete(req, sheetUsers);
           break;
       default:
           return response().json({
              status: false,
              message: 'APIs not found'
           });
   }
}

/* Read
 * request for all Data
 *
 * @request-parameter | action<string>
 * @example-request | ?action=read
 */
function doRead(request, sheetObject) 
{
   var data = {};
   
   data.records = _readData(sheetObject);

   return response().json(data);

}

/* Insert
 *  Request for inser new record
 *  @request-parameter | action<string>, title=<string>, description=<string>, email=<string>
 *  @example-request | ?action=insert&title=demo&description=This is demo test&email=demo@gmail.com
 */
function doInsert(req, sheet) {
   var title = req.parameter.title;
   var description = req.parameter.description;
   var email = req.parameter.email;
   var id    = 0;
   var flag = 1; 
   var Row = sheet.getLastRow();
  
   for (var i = 1; i <= Row; i++) {
      var id1 = sheet.getRange(i, 1).getValue();
      if(id1>id) id=id1;
      var titleTemp = sheet.getRange(i, 2).getValue();
      if (titleTemp == title) {
         flag = 0;
         var result = "Title already exist";
      }
   }
   
   if (flag == 1) {
      id = id+1;
      var timestamp = Date.now();
      var currentTime = new Date().toLocaleString(); // Full Datetime
      var rowData = sheet.appendRow([
         id,
         title,
         description,
         email,
         timestamp,
         currentTime
      ]);
      var result = "Insertion successful";
   }

   return response().json({
      result: result
   });
}

/* Update
 * request for Update
 *
 * @request-parameter | action<string>, id<string>, data<JSON>, 
 * @example-request | ?action=update&id=1&data={"title":"demo","description":"This is demo", "email":"demo@gmail.com"}
 */
function doUpdate(req, sheet) 
{
   var id = req.parameter.id;
   var updates = JSON.parse(req.parameter.data);
   var lr = sheet.getLastRow();

   var headers = _getHeaderRow(sheet);
   var updatesHeader = Object.keys(updates);
   
   // Looping for row
   for (var row = 1; row <= lr; row++) {
      // Looping for available header / column
      for (var i = 0; i <= (headers.length - 1); i++) {
         var header = headers[i];
         // Looping for column need to updated
         for (var update in updatesHeader) {
            if (updatesHeader[update] == header) {
               // Get ID for every row
               var rid = sheet.getRange(row, 1).getValue();
               if (rid == id) {
                  // Lets Update
                  sheet.getRange(row, i + 1).setValue(updates[updatesHeader[update]]);
               }
            }
         }
      }
   }

   
   // Output
   return response().json({
      status: true,
      message: "Update successfully"
   });
}


/* Delete
 * Request for delete
 *
 * @request-parameter | action<string>,id<number>
 * @example-request | ?action=delete&id=2
 */
 
function doDelete(req, sheet) {
   var id = req.parameter.id;
   var flag = 0;

   var Row = sheet.getLastRow();
   for (var i = 1; i <= Row; i++) {
      var idTemp = sheet.getRange(i, 1).getValue();
      if (idTemp == id) {
         sheet.deleteRow(i);
         
         var result = "deleted successfully";
         flag = 1;
      }

   }

   if (flag == 0) {
      return response().json({
         status: false,
         message: "ID not found"
      });
   }

   return response().json({
      status: true,
      message: result
   });
}


/* Service
 */
function _readData(sheetObject, properties) {

   if (typeof properties == "undefined") {
      properties = _getHeaderRow(sheetObject);
      properties = properties.map(function (p) {
         return p.replace(/\s+/g, '_');
      });
   }

   var rows = _getDataRows(sheetObject),
   data = [];
  
   if(!rows) return data;
  
   for (var r = 0, l = rows.length; r < l; r++) {
      var row = rows[r],
          record = {};

      for (var p in properties) {
         record[properties[p]] = row[p];
      }

      data.push(record);
   }
   return data;
}

function _getDataRows(sheetObject) {
   var sh = sheetObject;
  try {
    return sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
  } catch(e) {
    return false;
   }
}

function _getHeaderRow(sheetObject) {
   var sh = sheetObject;

   return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
}

function response() {
   return {
      json: function(data) {
         return ContentService
            .createTextOutput(JSON.stringify(data))
            .setMimeType(ContentService.MimeType.JSON);
      }
   }
}
