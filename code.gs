/* Route
 * All Request with Method Get will be proces here
 */
var db = SpreadsheetApp.openById("");
var USER_MODEL = ["id", "name", "email", "profilephoto"];
var IDEA_MODEL = ["id","title","description","email","startTime","endTime","tags"];
var VOTE_MODEL = ["id", "ideaId", "email"];

var TABLES = {
  IDEA : "idea",
  VOTE : "vote",
  USER : "user"
}; 

var API_ROUTE = {
  READ : "read",
  INSERT : "insert",
  DELETE : "delete",
  UPDATE : "update"
}

var MESSAGE = {
  EMSG : {
    E001 : "APIs not found",
    E002 : "Table name is wrong",
    E003 : "Record not found",
    E004 : "ID not found"
  },
  SMSG : {
    S001 : "Insertion successful",
    S002 : "Updation successful",
    S003 : "Deleted successfully"
  }
};

function doGet(req) {
  
  var action = req.parameter.action;
  var tableName = req.parameter.table;
  var currentTable = db.getSheetByName(tableName);
   
   switch(action) {
       case API_ROUTE.READ:
           return doRead(req, currentTable);
           break;
       case API_ROUTE.INSERT:
           return doInsert(req, currentTable);
           break;
       case API_ROUTE.DELETE:
           return doDelete(req, currentTable);
           break;
       case API_ROUTE.UPDATE:
           return doUpdate(req, currentTable);
           break;
       default:
           return response().json({
              status: false,
              message: MESSAGE.EMSG.E001
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
function doInsert(req,currentTable) {
  var result = "";
  var data = "";
  var id    = 0;
  var flag = 1; // If value is 1 then it will create a new record and value is 0 means somthing went wrong
  var bodyData = JSON.parse(req.parameter.data);
  var tableName = req.parameter.table;
  var row = currentTable.getLastRow();
  for (var i = 1; i <= row; i++) {
    var idTemp = currentTable.getRange(i, 1).getValue();
    if(idTemp>id) id=idTemp;
  }
  bodyData["id"] = id+1;
  
  switch(tableName) {
    case TABLES.IDEA:
      var idea = new IDEA();
      data = filterReqBody(idea,IDEA_MODEL,bodyData);
      break;
    case TABLES.VOTE:
      var vote = new VOTE();
      data = filterReqBody(vote,VOTE_MODEL,bodyData);
      break;
    case TABLES.USER:
      var user = new USER();
      data = filterReqBody(user,USER_MODEL,bodyData);
      break;
    default:
      flag = 0;
      result = MESSAGE.EMSG.E002
      break;
  }
  
  if (flag == 1) {  
    var rowData = currentTable.appendRow(data);
    return response().json({
      status: "ok",
      result: MESSAGE.SMSG.S001,
      data : bodyData
    });
  } else {
    return response().json({
      status: "error",
      result: result
    });
  }
  
  
}

/* Insert
 *  Request for inser new record
 *  @request-parameter | action<string>, table=<string>, data=<json>
 *  @example-request | ?action=insert&table=idea&data={title:"Test",description:"Test desc"}
 */
function doUpdate(req,currentTable) {
  var result = "";
  var flag = 1;
  var data = "";
  var bodyData = JSON.parse(req.parameter.data);
  var tableName = req.parameter.table;
  switch(tableName) {
    case TABLES.IDEA:
      var idea = new IDEA();
      data = filterReqBody(idea,IDEA_MODEL,bodyData);
      break;
    case TABLES.VOTE:
      var vote = new VOTE();
      data = filterReqBody(vote,VOTE_MODEL,bodyData);
      break;
    case TABLES.USER:
      var user = new USER();
      data = filterReqBody(user,USER_MODEL,bodyData);
      break;
    default:
      flag = 0;
      result = MESSAGE.EMSG.E002
      break;
  }
  
  let selectedData = getFilterData(bodyData.id);
  var values = [data];
  if (selectedData["hiddenRows"].length == 0){
    flag = 0;
    result = MESSAGE.EMSG.E002
  } else {
    currentTable.getRange(selectedData["hiddenRows"][0], 1, values.length, values[0].length).setValues(values);
  }   
  
  if (flag == 1) {
    return response().json({
      status: "ok",
      result: MESSAGE.SMSG.S002,
      data : bodyData
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
         var result = MESSAGE.SMSG.S003
         flag = 1;
      }
   }

   if (flag == 0) {
      return response().json({
         status: false,
         message: MESSAGE.EMSG.E004
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

function VOTE(id, ideaId, email) { 
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

function getFilterData(selectedId) {
  var filterValues = [selectedId]; // Please set the filter values.
  var column = 1; // In this case, it's the column "C". Please set the column number.
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  var values = sheet.getDataRange().getValues();
  var object = values.reduce(function(o, e, i) {
    if (filterValues.indexOf(e[column - 1]) > -1) {
      o.hiddenRows.push(i + 1);
      o.hiddenRowValues.push(e);
    } else {
      // o.shownRows.push(i + 1);
      // o.shownRowValues.push(e);
    }
    return o;
  }, {hiddenRows: [], hiddenRowValues: [], shownRows: [], shownRowValues: []});
  return object;
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
