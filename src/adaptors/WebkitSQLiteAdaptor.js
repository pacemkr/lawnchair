/**
 * WebkitSQLiteAdaptor
 * ===================
 * Sqlite implementation for Lawnchair.
 *
 */
var WebkitSQLiteAdaptor = function(options) {
	for (var i in LawnchairAdaptorHelpers) {
		this[i] = LawnchairAdaptorHelpers[i];
	}
	this.init(options);
};


WebkitSQLiteAdaptor.prototype = {
	init:function(options) {
		     var that = this;
		     var merge = that.merge;
		     var opts = (typeof arguments[0] == 'string') ? {table:options} : options;

		     // default properties
		     this.name		= merge('Lawnchair', opts.name	  	);
		     this.version	= merge('1.0',       opts.version 	);
		     this.table 		= merge('field',     opts.table	  	);
		     this.display	= merge('shed',      opts.display 	);
		     this.max		= merge(65536,       opts.max	  	);
		     this.db			= merge(null,        opts.db		);
		     this.perPage    = merge(10,          opts.perPage   );

		     // default sqlite callbacks
		     this.onData  = function(){};

		     if(typeof opts.callback !== 'function') opts.callback = function(){};

		     // error out on shit browsers
		     if (!window.openDatabase)
			     throw('Lawnchair, "This browser does not support sqlite storage."');
		     // instantiate the store
		     if(!WebkitSQLiteAdaptor.globaldb) WebkitSQLiteAdaptor.globaldb = openDatabase(this.name, this.version, this.display, this.max);

		     this.db = WebkitSQLiteAdaptor.globaldb;

		     // create a default database and table if one does not exist
		     that.db.transaction(function(tx) {
			     tx.executeSql("CREATE TABLE IF NOT EXISTS "+ that.table + " (id NVARCHAR(32) UNIQUE PRIMARY KEY, value TEXT, timestamp REAL)", [], opts.callback, that.onFailure);
		     });
	     },
	save:function(obj, onSuccess, onFailure) {
		     var that = this;

		     var update = function(id, obj, onSuccess, onFailure) {
			     that.db.transaction(function(t) {
				     t.executeSql(
					     "UPDATE " + that.table + " SET value=?, timestamp=? WHERE id=?",
					     [that.serialize(obj), that.now(), id],
					     function() {
						     if (onSuccess != undefined) {
							     obj.key = id;
							     that.terseToVerboseCallback(onSuccess)(obj);
						     }
					     },
					     onFailure
					     );
			     });
		     };
		     var insert = function(obj, onSuccess, onFailure) {
			     that.db.transaction(function(t) {
				     var id = (obj.key == undefined) ? that.uuid() : obj.key;
				     delete(obj.key);
				     t.executeSql(
					     "INSERT INTO " + that.table + " (id, value,timestamp) VALUES (?,?,?)",
					     [id, that.serialize(obj), that.now()],
					     function() {
						     if (onSuccess != undefined) {
							     obj.key = id;
							     that.terseToVerboseCallback(onSuccess)(obj);
						     }
					     },
					     onFailure
					     );
			     });
		     };
		     if (obj.key == undefined) {
			     insert(obj, onSuccess, onFailure);
		     } else {
			     this.get(obj.key, function(r) {
				     var isUpdate = (r != null);

				     if (isUpdate) {
					     var id = obj.key;
					     delete(obj.key);
					     update(id, obj, onSuccess, onFailure);
				     } else {
					     insert(obj, onSuccess, onFailure);
				     }
			     });
		     }
	     },
	get:function(key, onSuccess, onFailure) {
		    var that = this;
		    this.db.transaction(function(t) {
			    t.executeSql(
				    "SELECT value FROM " + that.table + " WHERE id = ?",
				    [key],
				    function(tx, results) {
					    if (results.rows.length == 0) {
						    that.terseToVerboseCallback(onSuccess)(null);
					    } else {
						    var o = that.deserialize(results.rows.item(0).value);
						    o.key = key;
						    that.terseToVerboseCallback(onSuccess)(o);
					    }
				    },
				    onFailure
				    );
		    });
	    },
	all:function(onSuccess, onFailure) {
		    var cb = this.terseToVerboseCallback(onSuccess);
		    var that = this;
		    this.db.transaction(function(t) {
			    t.executeSql("SELECT * FROM " + that.table, [], function(tx, results) {
				    if (results.rows.length == 0 ) {
					    cb([]);
				    } else {
					    var r = [];
					    for (var i = 0, l = results.rows.length; i < l; i++) {
						    var raw = results.rows.item(i).value;
						    var obj = that.deserialize(raw);
						    obj.key = results.rows.item(i).id;
						    r.push(obj);
					    }
					    cb(r);
				    }
			    },
			    onFailure);
		    });
	    },
	paged:function(page, onSuccess, onFailure) {
		      var cb = this.terseToVerboseCallback(onSuccess);
		      var that = this;
		      this.db.transaction(function(t) {
			      var offset = that.perPage * (page - 1); // a little offset math magic so users don't have to be 0-based
			      var sql = "SELECT * FROM " + that.table + " ORDER BY timestamp ASC LIMIT ? OFFSET ?";
			      t.executeSql(sql, [that.perPage, offset], function(tx, results) {
				      if (results.rows.length == 0 ) {
					      cb([]);
				      } else {
					      var r = [];
					      for (var i = 0, l = results.rows.length; i < l; i++) {
						      var raw = results.rows.item(i).value;
						      var obj = that.deserialize(raw);
						      obj.key = results.rows.item(i).id;
						      r.push(obj);
					      }
					      cb(r);
				      }
			      },
			      onFailure);
		      });
	      },
	remove:function(keyOrObj, onSuccess, onFailure) {
		       var that = this;
		       if (onSuccess)
			       onSuccess = that.terseToVerboseCallback(onSuccess);
		       this.db.transaction(function(t) {
			       t.executeSql(
				       "DELETE FROM " + that.table + " WHERE id = ?",
				       [(typeof keyOrObj == 'string') ? keyOrObj : keyOrObj.key],
				       onSuccess || that.onData,
				       onFailure
				       );
		       });
	       },
	nuke:function(onSuccess, onFailure) {
		     var that = this;
		     if (onSuccess)
			     onSuccess = that.terseToVerboseCallback(onSuccess);
		     this.db.transaction(function(tx) {
			     tx.executeSql(
				     "DELETE FROM " + that.table,
				     [],
				     onSuccess || that.onData,
				     onFailure
				     );
		     });
	     }
};
