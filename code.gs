/* Route
 * All Request with Method Get will be proces here
 */
var db = SpreadsheetApp.openById("");
var USER_MODEL = ["id", "name", "email", "profilephoto"];
var IDEA_MODEL = ["id","title","description","email","timestamp","createdOn"];
var VOTE_MODEL = ["id", "ideaId", "email"];

function doGet(req) {
  
  var action = req.parameter.action;
  var tableName = req.parameter.table;
  var currentTable = db.getSheetByName(tableName);
   
   switch(action) {
       case "read":
           return doRead(req, currentTable);
           break;
       case "insert":
           return doInsert(req, currentTable,tableName);
           break;
       case "delete":
           return doDelete(req, currentTable);
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

function IDEA(id, title, description, email) { 
  this.id = id;
  this.title = title;
  this.description = description;
  this.email = email;
  this.timestamp = Date.now();
  this.createdOn = new Date().toLocaleString();
}

function VOTE(id, ideaId,email) { 
  this.id = id;
  this.ideaId = ideaId;
  this.email = email;
  this.timestamp = Date.now();
  this.createdOn = new Date().toLocaleString();
}

function USER(id, name,email,profilephoto) { 
  this.id = id;
  this.name = name;
  this.email = email;
  this.profilephoto = profilephoto;
  this.timestamp = Date.now();
  this.createdOn = new Date().toLocaleString();
}

function filterReqBody(instance,ideaModel,data) {
 for(var key in data) {
   if(ideaModel.includes(key))
     instance[key] = data[key];
 }
 return Object.values(instance); 
} 

/* Insert
 *  Request for inser new record
 *  @request-parameter | action<string>, table=<string>, data=<json>
 *  @example-request | ?action=insert&table=idea&data={title:"Test"}
 */
function doInsert(req,currentTable,tableName) {
  var data = "";
  var id    = 0;
  var flag = 1; 
  var bodyData = JSON.parse(req.parameter.data);
  
  var Row = currentTable.getLastRow();
  for (var i = 1; i <= Row; i++) {
    var id1 = currentTable.getRange(i, 1).getValue();
    if(id1>id) id=id1;
  }
  bodyData["id"] = id+1;
  
  switch(tableName) {
    case "idea":
      var idea = new IDEA();
      data = filterReqBody(idea,IDEA_MODEL,bodyData);
      break;
    case "vote":
      var vote = new VOTE();
      data = filterReqBody(vote,VOTE_MODEL,bodyData);
      break;
    case "user":
      var user = new USER();
      data = filterReqBody(user,USER_MODEL,bodyData);
      break;
    default:
      flag = 0;
      var result = "Table name is wrong";
      break;
  }
  
  if (flag == 1) {  
    var timestamp = Date.now();
    var currentTime = new Date().toLocaleString(); // Full Datetime
    var rowData = currentTable.appendRow(data);
    var result = "Insertion successful";
  }
  
  return response().json({
    result: result
  });
}

/* Delete
 * Request for delete
 *
 * @request-parameter | action<string>, id<number>
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
         var result = "Deleted successfully";
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