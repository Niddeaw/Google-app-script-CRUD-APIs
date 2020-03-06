/* Route
 * All Request with Method Get will be proces here
 */
var db = SpreadsheetApp.openById("13gplpaV4zHk6Q5Y5-KVYgIr4EqKYO6YpxZYa4GlbKGI");
var USER_MODEL = ["id", "name", "email", "profilephoto"];
var IDEA_MODEL = ["id","title","description","email","startTime","endTime","tags"];
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
 * @request-parameter | action<string>, table<string>
 * @example-request | ?action=read&table=vote
 */
function doRead(req, currentTable) 
{
   var data = {};
   data.records = _readData(currentTable);
   return response().json(data);

}


/* Insert
 *  Request for inser new record
 *  @request-parameter | action<string>, table=<string>, data=<json>
 *  @example-request | ?action=insert&table=idea&data={title:"Test"}
 */
function doInsert(req,currentTable,tableName) {
  var result = "";
  var data = "";
  var id    = 0;
  var flag = 1; // If value is 1 then it will create a new record and value is 0 means somthing went wrong
  var bodyData = JSON.parse(req.parameter.data);
  
  var row = currentTable.getLastRow();
  for (var i = 1; i <= row; i++) {
    var idTemp = currentTable.getRange(i, 1).getValue();
    if(idTemp>id) id=idTemp;
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
      result = "Table name is wrong";
      break;
  }
  
  if (flag == 1) {  
    var rowData = currentTable.appendRow(data);
    return response().json({
      status: "ok",
      result: "Insertion successful",
      data : rowData
    });
  } else {
    return response().json({
      status: "error",
      result: result
    });
  }
  
  
}

/* Delete
 * Request for delete
 *
 * @request-parameter | action<string>,table<string> id<number>
 * @example-request | ?action=delete&table=idea&id=2
 */
 
function doDelete(req, currentTable) {
   var id = req.parameter.id;
   var flag = 0;

   var row = currentTable.getLastRow();
   for (var i = 1; i <= row; i++) {
      var idTemp = currentTable.getRange(i, 1).getValue();
      if (idTemp == id) {
         currentTable.deleteRow(i);
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


/* Schema model
 */

function IDEA(id, title, description, email,startTime,endTime, tags) { 
  this.id = id;
  this.title = title;
  this.description = description;
  this.email = email;
  this.startTime = startTime;
  this.endTime = endTime;
  this.tags = tags;
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

/* Service
 */

function filterReqBody(instance,schemaModel,data) {
 for(var key in data) {
   if(schemaModel.includes(key))
     instance[key] = data[key];
 }
 return Object.values(instance); 
} 

function _readData(currentTable, properties) {
   if (typeof properties == "undefined") {
      properties = _getHeaderRow(currentTable);
      properties = properties.map(function (p) {
         return p.replace(/\s+/g, '_');
      });
   }

   var rows = _getDataRows(currentTable),
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


function _getDataRows(currentTable) {
   var sh = currentTable;
  try {
    return sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
  } catch(e) {
    return false;
   }
}

function _getHeaderRow(currentTable) {
   var sh = currentTable;
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
