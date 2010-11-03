/**
 * ServerAdaptor
 * ===================
 * Lawnchair implementation that leverages a server-side endpoint with a basic key/value store API available.
 * Requires that you have a server-side implementation exposed that returns JSON and accepts GET parameters as follows:
   * id (optional, pass with all requests): some unique ID to differentiate between clients. Optional, up to you if you want to support it in your server-side implementation. 
   * nuke: presence of this parameter destroys the store.
   * get=key: returns object associated with key passed into 'get' parameter.
   * save=key: saves an object with key passed into the 'save' querystring parameter. server-side should read POST data for the JSON object to save.
   * all: presence of this parameter should return an array of all JSON objects stored.
   * remove=key: removes an object with key passed into the 'remove' querystring parameter.
 * 
 * NOTE: Initial purpose of this adapter is to use together with session-based server-side storage, for clients that have weak client-side storage support.
 */
var ServerAdaptor = function(options) {
	for (var i in LawnchairAdaptorHelpers) {
		this[i] = LawnchairAdaptorHelpers[i];
	}
	this.init(options);
};

ServerAdaptor.prototype = {
	init:function(options){
        if (typeof options.endpoint == 'undefined') throw "Server adapter requires an 'endpoint' parameter, defining a server-side endpoint/API to use.";
        this.endpoint = options.endpoint;
        if (typeof options.id != 'undefined') this.id = options.id
        else options.id = null;
	},
	get:function(key, callback){
		if (obj) {
			obj.key = key;
		}
		if (callback)
            this.terseToVerboseCallback(callback)(obj);
	},
	save:function(obj, callback){
		var id = obj.key || this.uuid();
		delete obj.key;
        obj.key = id;
		if (callback)
			this.terseToVerboseCallback(callback)(obj);
	},
	all:function(callback){
		var cb = this.terseToVerboseCallback(callback);
		if (cb)
			cb(yar);
	},
	remove:function(keyOrObj, callback) {
		var key = (typeof keyOrObj == 'string') ? keyOrObj : keyOrObj.key;
		if (callback)
		    this.terseToVerboseCallback(callback)();
	},
	nuke:function(callback) {
	}
};