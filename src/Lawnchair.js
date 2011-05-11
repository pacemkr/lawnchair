/**
 * Lawnchair
 * =========
 * A lightweight JSON document store.
 *
 */
var Lawnchair = function(opts, cb) {
    if (typeof cb == 'undefined') throw "Please provide a callback as second parameter to Lawnchair constructor; this shit's async, yo.";
    if (!JSON || !JSON.stringify) throw "Native JSON functions unavailable - please include http://www.json.org/json2.js or run on a decent browser :P";
	this.init(opts);
	cb.call(this);
}

Lawnchair.prototype = {
	
	init:function(opts) {
		var adaptors = {
			'webkit':window.WebkitSQLiteAdaptor,
			'gears':window.GearsSQLiteAdaptor,
			'dom':window.DOMStorageAdaptor,
			'cookie':window.CookieAdaptor,
			'air':window.AIRSQLiteAdaptor,
			'userdata':window.UserDataAdaptor,
			'air-async':window.AIRSQLiteAsyncAdaptor,
			'blackberry':window.BlackBerryPersistentStorageAdaptor,
            'couch':window.CouchAdaptor,
            'server':window.ServerAdaptor
		};
		this.adaptor = opts.adaptor ? new adaptors[opts.adaptor](opts) : new DOMStorageAdaptor(opts);
	},
	
	// Save an object to the store. If a key is present then update. Otherwise create a new record.
	save:function(obj, onSuccess, onFailure) {this.adaptor.save(obj, onSuccess, onFailure)},
	
	// Invokes a callback on an object with the matching key.
	get:function(key, onSuccess, onFailure) {this.adaptor.get(key, onSuccess, onFailure)},

	// Returns whether a key exists to a callback.
	exists:function(onSuccess, onFailure) {this.adaptor.exists(onSuccess, onFailure)},
	
	// Returns all rows to a callback.
	all:function(onSuccess, onFailure) {this.adaptor.all(onSuccess, onFailure)},
	
	// Removes a json object from the store.
	remove:function(keyOrObj, onSuccess, onFailure) {this.adaptor.remove(keyOrObj, onSuccess, onFailure)},
	
	// Removes all documents from a store and returns self.
	nuke:function(onSuccess, onFailure) {this.adaptor.nuke(onSuccess, onFailure);return this},
	
	// Returns a page of results based on offset provided by user and perPage option
	paged:function(page, onSuccess, onFailure) {this.adaptor.paged(page, onSuccess, onFailure)},
	
	/**
	 * Iterator that accepts two paramters (methods or eval strings):
	 *
	 * - conditional test for a record
	 * - callback to invoke on matches
	 *
	 */
	find:function(condition, onSuccess, onFailure) {
		var is = (typeof condition == 'string') ? function(r){return eval(condition)} : condition
		  , cb = this.adaptor.terseToVerboseCallback(onSuccess);
	
		this.each(function(record, index) {
			if (is(record)) cb(record, index); // thats hot
		}, onFailure);
	},


	/**
	 * Classic iterator.
	 * - Passes the record and the index as the second parameter to the callback.
	 * - Accepts a string for eval or a method to be invoked for each document in the collection.
	 */
	each:function(onSuccess, onFailure) {
		var cb = this.adaptor.terseToVerboseCallback(onSuccess);
		this.all(function(results) {
			var l = results.length;
			for (var i = 0; i < l; i++) {
				cb(results[i], i);
			}
		}, onFailure);
	}
// --
};
