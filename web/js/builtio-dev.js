/*!
 * Built JavaScript SDK
 * http://www.built.io
 * Copyright 2013 raw engineering, inc.
 * The built.io JavaScript SDK is freely distributable under the MIT license.
 */

var isNode = (
        (typeof exports !== 'undefined') &&
        (typeof module !== 'undefined') &&
        (typeof module.exports !== 'undefined')
            ? true : false);
var scope = ((typeof window === 'undefined') ? this : window);

function Built () {
    /**
     * contains all built.io API classes and functions.
     * @name Built
     * @class
     * @author raw engineering, inc. (www.raweng.com)
     * @version 1.3.2
     * @see Built.initialize
     * contains all built.io API classes and functions.
     */
    var Built = this;
    var urls = {
            Base: 'https://api.built.io/v1',
            register: '/application/users/',
            login: '/application/users/login/',
            logout: '/application/users/logout/',
            user: '/application/users/',
            getUserInfo: '/application/users/current/',
            classes: '/classes/',
            objects: '/objects/',
            upload: '/uploads/',
            version: '/v1/',
            host: 'api.built.io',
            proto: 'https://',
            forgotPassword: "/application/users/forgot_password/request_password_reset/",
            role:'/built_io_application_user_role/objects/',
            notification:'/push/',
            extensionURL:'/functions/',
            genAuth : 'generate_authtoken'
        },
        _Cache = "only_network",
        appUserInfo = null,
        httpRequest,
        httpModule,
        fs,
        _fallback = false;

    if (isNode) {
        //Built = module.exports = function(){};
        httpModule = require('request');
        fs = require("fs");
    } else {
        //Built = scope.Built = function(){};
    }
    
    Built.VERSION = '1.3.2';
    if (typeof console === 'undefined') {
        console = {
            log:function(){}
        }
    }
    if(typeof JSON === 'undefined'){
        JSON = {};
        JSON.parse = JSON.stringify = function(){
            throw new Error("JSON parse and stringify is not supported in this platform ," +
                " include json2 ( https://github.com/douglascrockford/JSON-js ) in your project"
            );
        }
    }
    var Headers = {},
        queryString = {},
        fallbackOnCORS = true,
        random = function () {
            return Math.floor(Math.random() * (new Date).getTime());
        },
        serializeURL = function (url) {
            return url.replace(/[\/]+/g, '/').replace(':/', '://').replace(/[\/]$/, '');
        },
        isEmptyJSON = function (obj) {
            for (var i in obj) { return false; }
            return true;
        },
        extend = function (protoProps, staticProps) {
            var parent = this;
            var model;
            if (protoProps && Object.prototype.hasOwnProperty.call(protoProps, 'constructor')) { model = protoProps.constructor }
            else { model = function () { return parent.apply(this, arguments); } }
            Built.Util.extend(model, parent, staticProps);
            var iPrototype = function () { this.constructor = model; };
            iPrototype.prototype = parent.prototype;
            model.prototype = new iPrototype;
            if (protoProps) Built.Util.extend(model.prototype, protoProps);
            model.__super__ = parent.prototype;
            return model;
        },
        buildPromise = function(options) {
            var promise = new Built.Promise();
            var opt = {};
            promise.onSuccess=promise.success;
            promise.onError=promise.error;
            promise.onAlways=promise.always;
            if(Built.Util.dataType(options)=="object"){
                opt=Built.Util.clone(options);
                promise.onSuccess(opt.onSuccess);
                promise.onSuccess(opt.success);
                promise.onError(opt.onError);
                promise.onError(opt.error);
                promise.onAlways(opt.onAlways);
                promise.onAlways(opt.always);
            }
            opt.onSuccess=opt.success=promise.resolve;
            opt.onError=opt.error=promise.reject;
            promise.__options=opt;
            return promise;
        };
/////////////////////////////////////////////////      built.io functions        ///////////////////////////////////////////////////
    (function (root) {
        var Built = root;
        /**
         * Call this method to initialize built.io sdk using your application tokens for built.io   <br/>
         * You can get your api key and app uid from <a href="https://manage.built.io" target="_blank">https://manage.built.io</a> website.
         * @param {String} appKey your built.io application API Key.
         * @param {String} appUid your built.io application uid.
         * @static
         * @memberof Built
         * @return {Built} return Built object
         */
        Built.initialize = function (apiKey, appUid) {
            Headers = {},
            queryString = {},
            appUserInfo = null;
            if (typeof apiKey === 'object') {
                if (apiKey && apiKey.application_api_key && apiKey.application_uid) {
                    Headers['application_api_key'] = apiKey.application_api_key;
                    Headers['application_uid'] = apiKey.application_uid;
                }
            } else {
                if (typeof apiKey == 'string') { Headers['application_api_key'] = apiKey }
                if (typeof appUid == 'string') { Headers['application_uid'] = appUid }
            }
            Built.User.setHeader(Headers);
            return Built;
        }
        /**@private*/  // legacy function
        Built.init=Built.initialize ;


        /**
         * set tenant for built.io application.
         * @param {String} tenant tenant uid for your application
         * @static
         * @memberof Built
         * @return {Built} returns Built object
         */
        Built.setTenant = function (tenant) {
            if(typeof tenant == 'string'){
                Built.setHeaders('tenant_uid',tenant);
            }
            return Built;
        }

        /**
         * remove tenant for built.io application.
         * @static
         * @memberof Built
         * @return {Built} returns Built object
         */
        Built.removeTenant = function () {
            return Built.removeHeader('tenant_uid');
        }

        /**
         * remove header from built.io rest calls.
         * @param {String} Name name to remove from common headers.
         * @static
         * @memberof Built
         * @return {Built} returns Built object
         */
        Built.removeHeader = function(headerName){
            if(typeof headerName === "string" && 
                headerName !== "" && 
                headerName !== "authtoken" && 
                Headers[headerName]){
                    delete Headers[headerName];
                    Built.User.setHeader(Headers);
            }
            return Built;
        }

        /**
         * set the common headers for built.io rest calls. Setting multiple headers is possible
         * by passing an object for the name, and skiping the value parameter.
         * @param {String|Object} Name|JSON Name OR JSON containing name and value.
         * @param {String} [Value] set the value for the key.
         * @static
         * @memberof Built
         * @return {Built} returns Built object
         */
        Built.setHeaders = function (key, val) {
            if (Built.Util.dataType(key) == 'object') {
                var _key= Built.Util.clone(key);
                Headers = Built.Util.mix(Headers, _key);
            } else if (typeof key == 'string' &&
                typeof val == 'string') {
                    Headers[key] = val;
            }
            Built.User.setHeader(Headers);
            return Built;
        }
        /** @private */
        Built.setHeader = Built.setHeaders;

        /**
         * Get the headers that are set for calls.
         * @static
         * @memberof Built
         * @return {Object} returns the headers JSON.
         */
        Built.getHeaders = function () {
            return Built.Util.clone(Headers);
        }
        /**
         * set the built.io host endpoint. defaults to https://api.built.io
         * @param {String} hostName hostname for built.io. defaults to api.built.io.
         * @param {String} Protocol the protocol, can be either 'http' or 'https'
         * @static
         * @memberof Built
         * @return {Built} returns Built object
         */
        Built.setURL = function (host, proto) {
            var protoMatch = /https?/ig ;
            var protoSchema = /https?:\/\//ig ;
            proto = proto || "https" ;
            if(typeof proto == "string"){
                proto = proto.match(protoMatch);
                if(proto){
                   urls.proto = proto[0] + "://";
                }
            }
            if(typeof host == "string"){
               proto = host.match(protoSchema);
               if(proto){
                    urls.proto = proto[0];
               }
               urls.host = host.replace(protoSchema,"");
            }
            urls.Base = serializeURL(urls.proto + urls.host + urls.version);
            return Built;
        }
        /**@private*/
        Built.addQueryString = function (key, val) {
            if (typeof key == 'string' && typeof val == 'string') {
                if (val == "" && queryString[key]) { delete queryString[key]; return; }
                queryString[key] = val;
            }
            return Built;
        }
        /**
         * set the fallback behaviour on unsupported cross domain platform.
         * It uses iframe internally to make the call. It's recommended to turn of this feature while making an hybrid mobile application.
         * @param {Boolean} bool set the boolean to turn on/off this feature.
         * @static
         * @memberof Built
         * @return {Built} returns Built object
         */
        Built.fallbackForCORS=function(bool){
            if(Built.Util.dataType(bool)=="boolean"){
                fallbackOnCORS = bool;
            }
            return Built;
        }
        /**
         * set master key
         * @param {String} masterKey master key.
         * @static
         * @memberof Built
         * @return {Built} returns Built object
         */
         Built.setMasterKey = function (key) {
            if(key && typeof key === "string" && key.length){
                Built.setHeaders('master_key', key);  
            }
            return Built;
        }

        /**
         * remove master key.
         * @static
         * @memberof Built
         * @return {Built} returns Built object
         */
        Built.removeMastkerKey = function(){
            return Built.removeHeader('master_key');
        }

    })(Built);

/////////////////////////////////////////////////       Built.Util               ///////////////////////////////////////////////////
    (function (root) {
        var Built = root;
        /**
         * Built Utility functions
         * @name Built.Util
         * @namespace
         * @static
         * @memberof Built
         */
        Built.Util = {}
        /**
         * Utility method to execute multiple tasks in parallel and get a final callback after completion of all tasks.
         * @param {Object} tasks Object literal containing functions.
         * @param {Function} callback function to be executed after completion of all tasks.
         * @example
         * //Create a, object having multiple tasks. Each task represents one function.
         * var tasks = {
         *  "key1": function(callback1){callback1(null, {});}
         *  "key2": function(callback2){callback2(error);}
         * }
         * Built.Util.parallel(tasks, function(results){})
         * @static
         * @memberof Built.Util
         * @return {Built.Util} returns the Util object
         */
        Built.Util.parallel = function (tasks, callback) {
            if (this.dataType(tasks) == 'object') {
                var me = this;
                var b = function () {
                    var taskCount = 0, completed = 0, err = null, results = {};
                    for (var i in tasks) { taskCount += 1 }
                    var cb = function (id) {
                        var myId = id,
                            cbs = function () {
                                return function (error, result) {
                                    if (error != null) {
                                        if (err == null && typeof callback == 'function') { callback(error, null);err=true;}
                                        error = err;
                                    } else {
                                        completed += 1;
                                        results[myId] = result;
                                        if (completed >= taskCount && typeof callback == 'function') {
                                            callback(err, results);
                                        }
                                    }
                                }
                            }
                        return new cbs;
                    }
                    for (var i in tasks) {
                        tasks[i](cb(i));
                    }
                    return me;
                }
                return new b;
            } else { throw new Error("object parameter required for parallel tasks") }
            return this;
        }
        /**
         * Utility method to create query string from JSON
         * @param {Object} JSON.
         * @param {Boolean} Unencoded boolean for URI encode.
         * @static
         * @memberof Built.Util
         * @return {String} returns Query string.
         */
        Built.Util.param = function (a, unEncoded) {
            var s = [],
                prefix,
                r20 = /%20/g,
                add = function (key, value) {
                    value = (value == null ? "" : value);
                    if (unEncoded) { s[s.length] = key + "=" + value }
                    else { s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value); }
                };

            if (this.dataType(a) == 'object') {
                for (var prefix in a) { this.__buildParams__(prefix, a[prefix], add) }
            } else {
                var x = JSON.parse(a);
                for (var prefix in x) { this.__buildParams__(prefix, x[prefix], add) }
            }
            return s.join("&").replace(r20, "+");
        }
        /**
         * @private
         */
        Built.Util.__buildParams__ = function (prefix, obj, add) {
            var rbracket = /\[\]$/;
            if (this.dataType(obj) == 'array') {
                for (var j = 0; j < obj.length; j++) {
                    if (rbracket.test(prefix)) { add(prefix, obj[j]) }
                    else { this.__buildParams__(prefix + '[' + (isNaN(j) ? j : '') + ']', obj[j], add) }
                }
            }
            else if (this.dataType(obj) == "object") {
                for (name in obj) {
                    this.__buildParams__(prefix + "[" + name + "]", obj[name], add);
                }
            } else { add(prefix, obj) }
        }
        /**
         * Utility method to get data type of variable.
         * @param {String|Object|Number|Null|Undefined} arg Variable to detect its data type.
         * @static
         * @memberof Built.Util
         * @return {String} returns the data type of the variable.
         */
        Built.Util.dataType = function (arg) {
            if (arg === null) {
                return 'null';
            }
            else if (arg && (arg.nodeType === 1 || arg.nodeType === 9)) {
                return 'element';
            }
            var type = (Object.prototype.toString.call(arg)).match(/\[object (.*?)\]/)[1].toLowerCase();
            if (type === 'number') {
                if (isNaN(arg)) {
                    return 'nan';
                }
                if (!isFinite(arg)) {
                    return 'infinity';
                }
            }
            return type;
        }
        /**
         * Utility method to create object by mixing two object.
         * @param {Object} Object First Object.
         * @param {Object} Object Second Object.
         * @static
         * @memberof Built.Util
         * @return {Object} returns newly created object.
         */
        Built.Util.mix = function (a, b) {
            if (typeof a == 'object' && typeof b == 'object') {
                var x = this.clone(a);
                for (var i in b) {
                    x[i] = b[i]
                }
                return x;
            }
        }
        /**
         * Utility function to get clone object of any object.
         * @param {Object} Object to be cloned.
         * @static
         * @memberof Built.Util
         * @return {Object} returns the clone object.
         */
        Built.Util.clone = function (obj) {
            var a = {};
            for (var i in obj) {
                a[i] = obj[i];
            }
            return a;
        }
        /**
         * Iterate any object in any context, similar to Jquery.each.
         * @param {Object} Object to iterate.
         * @param {Function} Iterator function.
         * @param {Object} [Context] object (optional).
         * @static
         * @memberof Built.Util
         */
        Built.Util.each = function (obj, iterator, context) {
            var nativeForEach = Array.prototype.forEach, //shortcut for foreach
                breaker = {}; //breaker
            if (obj == null) return;
            if (nativeForEach && obj.forEach === nativeForEach) {
                obj.forEach(iterator, context);
            } else if (obj.length === +obj.length) {
                for (var i = 0, l = obj.length; i < l; i++) {
                    if (iterator.call(context, obj[i], i, obj) === breaker) return;
                }
            } else {
                for (var key in obj) {
                    if (obj[key]) {
                        if (iterator.call(context, obj[key], key, obj) === breaker) return;
                    }
                }
            }
        }
        /**
         * Extend any object|function using extend method, very much like Backbone's extend method.
         * @param {Object} parent object.
         * @param {Object} child object.
         * @return {Object} new extended object .
         * null or undefined is treated as the empty string.
         * @static
         * @memberof Built.Util
         */
        Built.Util.extend = function (obj) {
            var slice = Array.prototype.slice; //shortcut for array slice
            this.each(slice.call(arguments, 1), function (source) {
                if (source) {
                    for (var prop in source) {
                        obj[prop] = source[prop];
                    }
                }
            });
            return obj;
        }
        /**
         * Utility method to convert query string to JSON
         * @param {String} QueryString Query string as the first param.
         * @param {Boolean} [isJSON] (optional) true to get parsed JSON, else stringified JSON will be returned.
         * @static
         * @memberof Built.Util
         * @return {String} JSON String.
         */
        Built.Util.deparam = function (params, coerce) {
            try {
                var obj = {},
                    coerce_types = { 'true': !0, 'false': !1, 'null': null };
                var iterate = params.replace(/\+/g, ' ').split('&');
                var len = iterate.length;
                for (var cutParams = 0; cutParams < len; cutParams++) {
                    var param = iterate[cutParams].split('='),
                        key = decodeURIComponent(param[0]),
                        val, cur = obj,
                        i = 0,
                        keys = key.split(']['),
                        keys_last = keys.length - 1;
                    if (/\[/.test(keys[0]) && /\]$/.test(keys[keys_last])) {
                        keys[keys_last] = keys[keys_last].replace(/\]$/, '');
                        keys = keys.shift().split('[').concat(keys);
                        keys_last = keys.length - 1;
                    } else {
                        keys_last = 0;
                    }
                    if (param.length === 2) {
                        val = decodeURIComponent(param[1]);
                        if (coerce) {
                            val = val && !isNaN(val) ? +val : val === 'undefined' ? undefined : coerce_types[val] !== undefined ? coerce_types[val] : val;
                        }

                        if (keys_last) {
                            for (; i <= keys_last; i++) {
                                key = keys[i] === '' ? cur.length : keys[i];
                                cur = cur[key] = i < keys_last ? cur[key] || (keys[i + 1] && isNaN(keys[i + 1]) ? {} : []) : val;
                            }

                        } else {
                            if (this.dataType(obj[key]) == 'array') {
                                obj[key].push(val);

                            } else if (obj[key] !== undefined) {
                                obj[key] = [obj[key], val];

                            } else {
                                obj[key] = val;
                            }
                        }

                    } else if (key) {
                        obj[key] = coerce ? undefined : '';
                    }
                }

                return obj;
            } catch (e) { throw e }
        }
        /**
         * Utility method to generate random number
         * @static
         * @memberof Built.Util
         * @return {Number} Number random number.
         */
        Built.Util.random=function(){
            return (Math.floor( Math.random() * (new Date).getTime() ));
        }

        /**
         * Utility method to trim white space from string
         * @static
         * @memberof Built.Util
         * @return {String} String trim string.
         */
        Built.Util.trim=function(str){
            return str.replace(/^\s+|\s+$/g, '');
        }

    })(Built);

////////////////////////////////////////////////        Built.Events            /////////////////////////////////////////////
    (function(root){
        var Built = root;
          /**
         * <p>Events is a module that can be mixed in to any object, giving the object a functionality to bind and trigger custom events.</p>
         * <p>
         *  <b>built.io</b> SDK triggers some global events for the developers. Here is the list of events triggered:
         * </p>
         * <ul>
         *  <li><b>http:start</b> - any http request is initiated</li>
         *  <li><b>http:end</b> - at the completion of http request</li>
         *  <li><b>upload:start</b> - any upload is initiated</li>
         *  <li><b>upload:end</b> - at the completion of upload</li>
         *  <li><b>user:register</b> - at the completion of user registration</li>
         *  <li><b>user:activate</b> - at the completion of user activation request</li>
         *  <li><b>user:deactivate</b> - at the completion of user deactivation request</li>
         *  <li><b>user:login</b> - at the completion of login request</li>
         *  <li><b>user:logout</b> - at the completion of logout request</li>
         *  <li><b>user:save-session</b> - at the time saveSession is invoked</li>
         *  <li><b>user:clear-session</b> - at the time clearSession is invoked</li>
         *  <li><b>user:set-current-user</b> - at the time setCurrentUser is invoked</li>
         * </ul>
         * @example
         * Built.Events.on("http:start", function(){
         *
         *})
         * @name Built.Events
         * @return returns Built.Events object
         * @namespace
         */
        Built.Events= {
            /**@private */
            __makeSure:function(id){
                if(!this.__listeners || typeof this.__listeners !=="object"){
                   this.__listeners={};
                }
                if(!this.__listeners[id] || typeof this.__listeners[id]!=="object"){
                    this.__listeners[id]=[];
                }
                return true;
            },

            /**
             * listen for specific event . The listeners will be invoked whenever the event is fired.
             * @example
             * listener = function(argument1, argument2){
             *   console.log('myevent occurred');
             * }
             * customObject.on('myevent', listener);
             * @param {String} eventName name of the event to listen
             * @param {function} listener listener will be invoked whenever the event is fired
             * @param {Object} [context] context object for it when the callback is invoked
             * @static
             * @memberof Built.Events
             * @return {Built.Events} returns the same object for chaining
             */
            on:function(eventName, callback, context){
                var me=this;
                if(typeof eventName =="string" &&
                    eventName !="" &&
                    typeof callback=="function"){
                        eventName=eventName.split(",");
                        Built.Util.each(eventName,function(item){
                            item=Built.Util.trim(item);
                            if(item !=""){
                                me.__makeSure(item);
                                context=(context||false);
                                me.__listeners[item].push({
                                    callback:callback,
                                    context:context,
                                    id:Built.Util.random()
                                });
                            }
                        });

                }
                return this;
            },
            /**
             * remove a specific event listener.
             * @example
             * customObject.off('myevent', listener);
             *        //OR
             * customObject.off('myevent'); // will remove all listener for myevent
             * @param {String} eventName name of the event to remove
             * @param {function} [listener] if no listener is specified, all listeners for the specified event will be removed
             * @static
             * @memberof Built.Events
             * @return {Built.Events} returns the same object for chaining
             */
            off:function(eventName, callback){
                var me=this;
                if(arguments.length==0){
                  me.__listeners={};
                  return me;
                }
                eventName=eventName.split(",");
                Built.Util.each(eventName,function(item){
                    item=Built.Util.trim(item);
                    var events=me.__listeners[item];
                    if(item &&
                      events &&
                      events.length){
                        if(typeof callback==="undefined"){
                            delete me.__listeners[item];
                        }else{
                            for(var i=0;i<events.length;i++){
                                if(callback===events[i].callback){
                                   me.__listeners[item].splice(i,1);
                                }
                            }
                        }

                    }
                });
                return this;
            },
            /**
             * trigger an event
             * @example customObject.trigger('myevent', argument1, argument2);
             * @param {String} eventName name of the event to trigger
             * @static
             * @memberof Built.Events
             * @return {Built.Events} returns the same object for chaining
             */
            trigger:function(eventName){
                var me=this;
                if(! me.__listeners ||
                    typeof me.__listeners!== "object"){
                    return me;
                }
                eventName=eventName.split(",");
                Built.Util.each(eventName,function(item){
                    item=Built.Util.trim(item);
                    var events=me.__listeners[item];
                    if(item && events){
                        var args= Array.prototype.slice.call(arguments,1);
                        Built.Util.each(events,function(_event){
                            if(typeof _event.callback=="function"){
                                var context=(_event.context || me);
                                _event.callback.apply(context,args);
                            }
                        });
                    }
                });
                return this;
            },
            /**
             * extend an object with Built.Events functionality.
             * @example
             * customeObject = Built.Events.inherit(customeObject); // extend customObject with Built.Events functionality
             * @param {String} object the object to be extneded with the Built.Events functionality
             * @static
             * @memberof Built.Events
             * @return {Object} returns Built.Events inherited object
             */
            inherit:function(object){
                object=(object||{});
                var events=Built.Util.clone(this);
                try{delete events.__listeners}catch(e){}
                if(Object.prototype.hasOwnProperty.call(object, 'prototype')){
                    return extend.call(object, events);
                }else{
                    return Built.Util.mix(object, events);
                }

            },

            /**
             * listen for specific event from other object. The listeners will be invoked whenever the event is fired.
             * @example
             * customObject.listenTo(otherObject, 'myevent');
             * customObject.on('myevent',function(){
             *
             *});
             * @param {Object} Object object to listen from
             * @param {String} eventName name of the event to listen
             * @static
             * @memberof Built.Events
             * @return {Built.Events} returns the same object for chaining
             */
            listenTo:function(outerObject, eventName){
                var me=this;
                if(outerObject &&
                    typeof outerObject=="object" &&
                    typeof outerObject.on =="function" &&
                    eventName !=""){
                        outerObject.on(eventName,function(){
                            var args = Array.prototype.slice.call(arguments, 0);
                            args.unshift(eventName)
                            me.trigger.apply(me,args);
                        });
                }
                return me;
            }

        }
        Built.Events.bind=Built.Events.on;
        Built.Events.unbind=Built.Events.off;
    
    })(Built);

/////////////////////////////////////////////////       Built.FileInternals      ///////////////////////////////////////////////////
    (function (root) {

        var Built = root;
        /** @private */
        Built.___fileInternals__ = function () {
            var fileData = {};

            /** @private */
             //var element1 = document.getElementById('propic');
             //___fileInternals__.add(
             //    HTMLelement,
             //    {tags: ['profileimage'], ACL: (new Built.ACL()).toJSON()},
             //    {id: "bcta7s7sgsuhuhs", onprogress: function(e){}
             //});

            this.add= function (file, attributes, options) {
                if (file) {
                    fileData = {file:file,attributes:attributes,options:options}
                }
                return this;
            }

             /** @private */
             //builtUpload.upload({onSuccess:function(data){}});
             //onSuccess upload method return data in JSON:
             //upload1: {content_type:'image/jpeg',file_size: "2161",filename: "pic.jpg",uid: "blt426d6fd75ee87505a"url: "https://--/download"},
             //upload2: {content_type:'image/jpeg',file_size: "2101",filename: "logo.jpg",uid: "blt426d6fd75ee6504f"url: "https://--/download"}

            this.upload= function (callback) {
                callback = callback || {};
                if(REST.VALIDATE(Headers, (callback.onError || callback.error))){
                    return {};
                }
                var me = this;
                if (isEmptyJSON(fileData) == true) {
                    throw new Error("no file found");
                }
                //Built.Util.parallel(createParallelUpload(), cb);
                //return attachCallbackToUpload(url, Headers, file, callback, data, opt);
                var update=false;
                if(typeof fileData['options'] == 'object' &&
                    fileData['options']['id']){
                    update=true;
                }
                var item = fileData;
                var url = serializeURL(urls.Base +  urls.upload + (update?item['options']['id']:"")),
                    data = item['attributes'] || {},
                    opt= item['options'] || {},
                    file = item['file'];
                return attachCallbackToUpload(url, Headers, file, callback, data, opt);
            }
            /** @private */
            var createParallelUpload = function () {
                var parallelUploads = {};
                for (var i in fileData) {
                    var update=false;
                    if(typeof fileData[i]['options'] == 'object' &&
                        fileData[i]['options']['id']){
                        update=true;
                    }
                    parallelUploads[i] = (function (item,update){
                        return function (callback) {
                            var elm = item['file'];
                            var cb = {
                                onSuccess : function (data, res) {
                                    callback(null, data);
                                },
                                onError : function (data, res) {
                                    callback(data, data);
                                }
                            };
                            var url = serializeURL(urls.Base +  urls.upload + (update?item['options']['id']:"")),
                                options = item['attributes'] || {},
                                opt= item['options'] || {};
                            attachCallbackToUpload(url, Headers, elm, cb, options,opt);
                        }
                    })(fileData[i],update);
                }
                return parallelUploads;
            }

            /** @private */
            var attachCallbackToUpload = function (url, headers, data, callback, options, opt) {
                if(urls.host =="" ||
                    typeof urls.host !=="string" ||
                    urls.host.length<=0){
                    throw new Error("set host for built.io server. eg: Built.setURL('api.built.io')");
                }
                callback = callback || {};
                var cb = function (d, res) {
                    try { d = JSON.parse(d) } catch (e) { }
                    if (typeof d == 'object' && typeof d.notice !== "undefined") {
                        if (typeof callback.onSuccess == 'function') {
                            callback.onSuccess(d.upload, res);
                        }
                    } else {
                        if (typeof callback.onError == 'function') {
                            callback.onError(d, res);
                        }
                    }
                }
                if(isNode){
                    return  uploadOnNode(url, headers, data, cb, options, opt);
                }
                return uploadWithFormData(url, headers, data, cb, options, opt);
            }
            /** @private */
            var uploadWithFormData = function (url, headers, data, callback, options, opt) {
                if(urls.host =="" || typeof urls.host !=="string" || urls.host.length<=0){
                    throw new Error("set host for built.io server. eg: Built.setURL('built.io')");
                    return;
                }
                headers = headers || {};
                options = options || {};
                if(typeof window==="object" && typeof window.FormData !=="undefined"){
                    var http = new XMLHttpRequest(),formd;
                    if (data instanceof FormData) {formd = data ;}
                    else if (Built.Util.dataType(data) == 'element') {
                        formd = new FormData();
                        if (data.getAttribute('type') == 'file') {
                            formd.append("upload[upload]", data.files[0]);
                        }else {
                            callback({ error_message: "input file element required" }, null);
                            throw new Error("input file element required");
                        }
                    }else if (typeof File !=="undefined" && data instanceof File) {
                        formd = new FormData();
                        formd.append("upload[upload]", data);
                    }else {
                        throw new Error("HTML input file element or FormData or File required");
                    }
                    var PARAM={upload:{}}
                    for(var _i in options){
                        PARAM.upload[_i]=options[_i];
                    }
                    formd.append("PARAM",JSON.stringify(PARAM));
                    if(opt && opt.id){
                        formd.append("_method","put");
                    }
                    http.open('POST', url, true);
                    if (Built.Util.dataType(headers) == 'object') {
                        for (var k in headers) {
                            http.setRequestHeader(k, headers[k]);
                        }
                    }
                    if (typeof callback == 'function') {
                        /**@private*/
                        http.onreadystatechange = function (e) {
                            if(http.readyState == 4){
                                if (http.status != 0) {
                                    callback(http.responseText, http);
                                } else if (http.__aborted__) {
                                    callback({error_message:"request aborted"},http);
                                }else{
                                    uploadWithIFrame(url, headers, data, callback, options,opt);
                                }
                                Built.Events.trigger('upload:end');
                            }
                        }
                    }
                    if(typeof opt.onprogress == 'function' && typeof http.upload =='object'){
                        /**@private*/
                        http.upload.onprogress = opt.onprogress;
                    }
                    /**@private*/
                    http.ontimeout =http.onerror= function (e) {
                        var ret = { error_message: 'error occured', http: http, event: e };
                        callback(ret, http);
                        Built.Events.trigger('upload:end');
                        callback=function(){};
                    }
                    http.__aborted__=false;
                    http.send(formd);
                    Built.Events.trigger('upload:start');
                    return {
                        _XHR:true,
                        abort:function(){
                            Built.Events.trigger('upload:end');
                            http.__aborted__=true;
                            http.abort()
                        }
                    }
                }else{
                    return uploadWithIFrame(url, headers, data, callback, options,opt);
                }

            }
            /** @private */
            var uploadWithIFrame=function(url, headers, data, callback, options,opt){
                if(typeof data[0] !=="undefined"){data=data[0]}
                if (Built.Util.dataType(data) == 'element') {
                    if (data.getAttribute('type') == 'file') {
                        var cloneElm=data.cloneNode();
                        data.style.display="none";
                        data.parentNode.insertBefore(cloneElm,data);
                        var method="POST";
                        var randNum=random().toString();
                        if(typeof Built.cbTray !="object"){Built.cbTray={}}
                        Built.cbTray[randNum]=callback;
                        var frame=createIFrame(url, headers, data, method,randNum);
                        var mdf=createUploadForm(url, headers, data, method,randNum,options,opt);
                        mdf.submit();
                        Built.Events.trigger('upload:start');
                        return (function(id){
                            return  {
                                _XHR:false,
                                abort:function(){
                                    Built.Events.trigger('upload:end');
                                    if(typeof Built.cbTray[id]==='function'){
                                        Built.cbTray[id]=function(){
                                            try{delete Built.cbTray[id];}catch(e){}
                                        }
                                        try{
                                            var ele = document.getElementById("frame_"+id);
                                            ele.parentNode.removeChild(ele);
                                        }catch(e){}
                                        try{
                                            var elem = document.getElementById("form_"+id);
                                            elem.parentNode.removeChild(elem);
                                        }catch(e){}
                                    }
                                }
                            }
                        })(randNum);
                    } else {
                        callback({error_message: "input file element required" }, null);
                        throw new Error("input file element required");
                    }
                } else {
                    callback({ error_message: "HTML input file element or FormData required for upload" }, null);
                    throw new Error("HTML input file element or FormData required for upload");
                }
            }
            /** @private */
            var createUploadForm=function(url, headers, data, method, rand, options, opt){
                if(urls.host =="" || typeof urls.host !=="string" || urls.host.length<=0){
                    throw new Error("set host for built.io server. eg: Built.setURL('built.io')");
                    return;
                }
                method = method.toUpperCase();
                var form =document.createElement('form');
                form.setAttribute('id','form_'+rand);
                //form.setAttribute('class','__built_sdk_helper_element__');
                form.setAttribute("target", 'frame_'+rand);
                form.setAttribute("method", "post");
                form.setAttribute("height","0");
                form.setAttribute("width","0");
                form.setAttribute("style","display:none");
                form.setAttribute("enctype", "multipart/form-data");
                form.setAttribute("encoding", "multipart/form-data");
                url=serializeURL(url)+'.postmessage';
                form.setAttribute("action",url);
                for(var i in headers){
                    try{form.appendChild(createInputElement(i.toString().toUpperCase(),headers[i]))}catch(e){}
                }
                data.setAttribute('name',"upload[upload]");
                form.appendChild(data);
                var PARAM={upload:{}}
                for(var _i in options){
                    PARAM.upload[_i]=options[_i];
                }
                form.appendChild(createInputElement("PARAM",JSON.stringify(PARAM)));
                if(typeof opt=='object' && opt.id){
                    form.appendChild(createInputElement("_method","put"));
                }
                form.appendChild(createInputElement("postmessage_payload",rand));
                form.appendChild(createInputElement("host",(document.location.origin?document.location.origin:(document.location.protocol+"//"+document.location.host))));
                document.body.appendChild(form);
                return form;
            }

            var uploadOnNode=function(url, headers, file, cb, options, opt){
                headers = headers || {};
                options = options || {};
                var req = httpModule.post(url,function(error, response, body){
                    Built.Events.trigger('upload:end');
                    if(error){
                       return cb(error, response);
                    }
                    cb(body,response);
                });
                Built.Events.trigger('upload:start');
                var form = req.form();
                var PARAM={upload:{}}
                for(var _i in options){
                    PARAM.upload[_i]=options[_i];
                }
                form.append("PARAM",JSON.stringify(PARAM));
                if(opt && opt.id){
                    form.append("_method","put");
                }
                for(var i in headers){
                   form.append(i.toString().toUpperCase(),headers[i]);
                }
                if(file.indexOf('://')>=0){
                    form.append("upload[upload]", httpModule(file));
                }else{
                   form.append("upload[upload]", fs.createReadStream(file));
                }
                return{
                    _XHR:true,
                    abort:function(){
                        Built.Events.trigger('upload:end');
                        req.abort();
                    }
                }
            }
        }
    
    })(Built);

////////////////////////////////////////////////        Built.File               //////////////////////////////////////////////
    (function (root) {

        var Built = root;
        /**
         * Built.File class to handle individual uploads in built.io
         * @name Built.File
         * @param {String} [uploadUid] set the upload uid for an object
         * @class
         * @static
         */
        Built.File= function (args) {
            var object_uid;
            var attributes={};
            var shadow={};
            var onProgress=null;
            if(typeof args =="string"){
                object_uid=args;
                attributes.uid=args;
            }else if(Built.Util.dataType(args)=='object' &&
                typeof args['uid'] =='string'){
                attributes=args;
                object_uid=args.uid;
            }

            /**
             * set image or file to upload.
             * @param {HTMLInputElement} file HTML Input File Element or File object  (file path in nodejs)
             * @name setFile
             * @memberOf Built.File
             * @function
             * @instance
             * @return {Built.File} returns the Built.File object
             */
            this.setFile= function (file) {
                if (file) {
                    if(isNode){
                        if(file.indexOf('://')>=0){
                            shadow['upload'] = file;
                            return this;
                        }else{
                            if(fs.existsSync(file)){
                               if(fs.statSync(file).isFile()){
                                    shadow['upload'] = file;
                                    return this;
                               }
                            }
                            throw new Error("invalid file path: "+file);
                        }
                    }else{
                        if(typeof file[0]!=="undefined"){file=file[0]}
                        if (Built.Util.dataType(file) == 'element' ||
                            (typeof FormData !== 'undefined' && file instanceof FormData)||
                            (typeof File !=='undefined' && file instanceof File)) {
                            shadow['upload'] = file;
                        } else {
                            throw new Error('The parameter is not valid or not supported by the platform. Please pass an html input elment.');
                        }
                    }
                }else{throw new Error("file parameter required")}
                return this;
            }

            /**@private*/
            this.addFile=this.setFile;


            /**
             * set tags to an upload.
             * @param {Array} tags An array or string of tags separated by comma.
             * @name setTags
             * @memberOf Built.File
             * @function
             * @instance
             * @return {Built.File} returns the Built.File object
             */
            this.setTags=function(args){
                var a=args;
                if(Built.Util.dataType(a) === "array"){
                    a=a.join(',');
                }
                if(a.indexOf(' ')>=0){
                    a=a.split(' ').join(',');
                }
                shadow['tags']=a;
                return this;
            }

            /**
             * set ACL to an upload.
             * @param {Object} builtACL add the Built.ACL Object to an upload.
             * @name setACL
             * @memberOf Built.File
             * @function
             * @instance
             * @return {Built.File} returns the Built.File object
             */
            this.setACL=function (aclObject) {
                if(typeof aclObject=='object' &&
                    typeof aclObject.toJSON=='function'){
                    var json=aclObject.toJSON();
                    shadow['ACL']=json;
                }else if(typeof aclObject==="boolean"){
                    shadow['ACL']={disable: aclObject};
                }
                return this;
            }

            /**
             * deletes the upload from built.io.
             * @param {Object} [callbacks] object containing onSuccess, and onError callbacks. eg: {onSuccess:function(data){}, onError: function(err){}}
             * @name destroy
             * @memberOf Built.File
             * @function
             * @instance
             * @return {Built.Promise} returns Built.Promise
             */
            this.destroy= function (callback) {
                if (object_uid) {
                    callback = callback || {};
                    var me = this,
                        option = {},
                        promise=buildPromise(callback);
                        callback=promise.__options;
                        var cb = function (data, res) {
                            try { data = JSON.parse(data) } catch (e) {}
                            if (typeof data == 'object' &&
                                typeof data.notice !== "undefined") {
                                object_uid = null;
                                attributes = {};
                                shadow = {};
                                if (typeof callback.onSuccess == 'function') {
                                    callback.onSuccess(data, res);
                                }
                            } else {
                                if (typeof callback.onError == 'function') {
                                    callback.onError(data, res);
                                }
                            }
                        }
                    option.uid = object_uid;
                    var rets= REST.UPLOAD.destroy(Headers, {}, cb, option);
                    promise._XHR=rets._XHR;
                    promise.abort=rets.abort;
                    return promise;
                } else {throw new Error('set upload uid') }
            }

            /**
             * fetches the specific upload from built.io. Make sure the uid is already set before invoking this function.
             * @param {Object} [callbacks] object containing onSuccess, and onError callbacks. eg: {onSuccess:function(data){}, onError: function(err){}}
             * @name fetch
             * @memberOf Built.File
             * @function
             * @instance
             * @return {Built.Promise} returns Built.Promise
             */
            this.fetch= function (callback) {
                if(object_uid){
                    callback = callback || {};
                    var me = this,
                        promise=buildPromise(callback);
                        callback=promise.__options;
                        var cb = function (data, res) {
                            try { data = JSON.parse(data) } catch (e) {}
                            if (typeof data == 'object' &&
                                typeof data.upload !== "undefined") {
                                attributes = data.upload;
                                object_uid=attributes.uid;
                                shadow = {};
                                if (typeof callback.onSuccess == 'function') {
                                    callback.onSuccess(data, res);
                                }
                            } else {
                                if (typeof callback.onError == 'function') {
                                    callback.onError(data, res);
                                }
                            }
                        }
                    var option={uid:object_uid};
                    var rets= REST.UPLOAD.fetch(Headers, {}, cb, option);
                    promise._XHR=rets._XHR;
                    promise.abort=rets.abort;
                    return promise;
                }else{
                    throw new Error ("set upload uid");
                }
            }

            /**
             * get attribute's value.
             * @param {String} Key specify key name to get the value
             * @name get
             * @memberOf Built.File
             * @function
             * @instance
             * @return {String} returns the value of an attribute.
             */
            this.get = function (key) {
                if(typeof key=='string'){
                    return attributes[key];
                }
            }

            /**
             * set uid in empty initialized Built.File to make connection with existing upload in built.io.
             * @param {String} uid set the uid for an object.
             * @name setUid
             * @memberOf Built.File
             * @function
             * @instance
             * @return {Built.File} returns the Built.File object
             */
            this.setUid= function (id) {
                if (typeof id == 'string') {
                    object_uid = id;
                    attribute.uid=id;
                }
                return this;
            }

            /**
             * saves the upload in built.io.
             * @param {Object} [callbacks] JSON containing onSuccess, and onError callbacks. eg: {onSuccess:function(data){}, onError: function(err){}}
             * @name save
             * @memberOf Built.File
             * @function
             * @instance
             * @return {Built.Promise} returns Built.Promise
             */
            this.save= function (callback){
                callback=callback||{};
                if(shadow['upload']){
                    var x= new Built.___fileInternals__();
                    var param={}  ;
                    var options={};
                    var oldSucc= callback.onSuccess;
                    callback.onSuccess=function (data, res){
                        attributes=data;
                        object_uid=attributes.uid;
                        shadow={};
                        if(typeof oldSucc=='function'){
                            oldSucc(data,res);
                        }
                    }
                    var promise=buildPromise(callback);
                    callback=promise.__options;
                    if(shadow['tags']){param.tags=shadow['tags']}
                    if(shadow['ACL']){param.ACL=shadow['ACL']}
                    if(object_uid){options['id']=object_uid}
                    if(typeof onProgress=='function'){options['onprogress']=onProgress}
                    x.add(shadow['upload'],param,options);
                    var rets=x.upload(callback);
                    promise._XHR=rets._XHR;
                    promise.abort=rets.abort;
                    return promise;
                }else{
                    throw new Error("no upload found");
                }

            }

            /**
             * returns JSON representation of object.
             * @name toJSON
             * @memberOf Built.File
             * @function
             * @instance
             * @return {Object} returns JSON.
             */
            this.toJSON= function(){
                return Built.Util.clone(attributes);
            }

            /**
             * helps to hook the onProgress event supported in xhr2.
             * @name onProgress
             * @param {Function} callback onProgress callback function.
             * @memberOf Built.File
             * @function
             * @instance
             * @return {Built.File} returns the FileObject object
             */
            this.onProgress= function (callback) {
                if(typeof callback == 'function'){
                    onProgress=callback;
                }
                return this;
            }
        }

        /** @private */
        Built.FileObject=Built.File;

    })(Built);

////////////////////////////////////////////////        Built.User               ///////////////////////////////////////////////////
    (function (root) {
        //var Built = root;
        /**
         * users are a special class that allows adding the users functionality to your application.<br />
         * features such as registration, logging in, logging out live here. <br />
         * after the log in, a session cookie will be dropped, and the "authtoken" will be given in response.<br />This authtoken is to be supplied for subsequent requests if the the request is to be identified as being from that user
         * @name Built.User
         * @class
         * @namespace
         * @static
         * @inner
         * @memberof Built
         */
        //Built.User = {}
        //root.User = new Function;
        root.User = function(){ 
            var me = this;
            var Built = {
                User : me
            }
            var _headers = root.Util.clone(Headers);
            var userInfo = root.Util.clone(appUserInfo);

            function getHeadersRef(){
                if(me instanceof root.User){
                    return _headers;
                }else{
                    return Headers;
                }    
            }

            function getAppUserInfo(){
                if(me instanceof root.User){
                    return userInfo;
                }else{
                    return appUserInfo;
                }    
            }

            function setAppUserInfo(info){
                if(me instanceof root.User){
                    userInfo = info;
                }else{
                    appUserInfo = info;
                } 
                return returnBuilt();
            }

            function getHeadersCopy(extraHeaders){
                if(extraHeaders){
                    return root.Util.mix(getHeadersRef(), extraHeaders);
                }
                return root.Util.clone(getHeadersRef());
            }

            function returnBuilt(){
                if(me instanceof root.User){
                    return me;
                }else{
                    return Built.User;
                }
            }

            /**
             * get user info of Built.User 
             * @static
             * @memberof Built.User
             * @return {Built.Promise} returns Built.Promise
             */
             Built.User.getInfo = function(authtoken){
                return root.Util.clone(userInfo);
             }

            /**
             * Set authtoken of Built.User
             * @param {String} authtoken.
             * @static
             * @memberof Built.User
             * @return {Built.Promise} returns Built.Promise
             */
             Built.User.setAuthToken = function(authtoken){
                if(authtoken && typeof(authtoken) === "string"){
                    getHeadersRef().authtoken = authtoken;
                }
                return returnBuilt();
             }

             /**
             * Remove authtoken of Built.User
             * @param {String} authtoken.
             * @static
             * @memberof Built.User
             * @return {Built.Promise} returns Built.Promise
             */
             Built.User.removeAuthToken = function(){
                if(getHeadersRef().authtoken){
                    delete getHeadersRef().authtoken; 
                }
                return returnBuilt();
             }

             /**
             * Set headers for Built.User REST call
             * @param {String|Object} key.
             * @param {String} value.
             * @static
             * @memberof Built.User
             * @return {Built.Promise} returns Built.Promise
             */
             Built.User.setHeader = function(key, value){
                if(key && value){
                    if(typeof(key) === "string" && typeof(value) === "string"){
                        getHeadersRef()[key] = value;
                    }
                }else if(key && root.Util.dataType(key) === "object"){
                    for(var i in key){
                        getHeadersRef()[i] = key[i];
                    }
                }
                return returnBuilt();
             }

             Built.User.setHeaders = Built.User.setHeader;

             /**
             * Get headers set for Built.User REST call
             * @param {String|Object} key.
             * @param {String} value.
             * @static
             * @memberof Built.User
             * @return {Built.Promise} returns Built.Promise
             */
             Built.User.getHeaders = function(){
                return root.Util.clone(getHeadersRef());
             }


            /**
             * login Built.User by providing email id and signup password
             * @param {String} email Email address that you used to signup.
             * @param {String} Your signup password.
             * @param {Object} [callback] object containing callbacks. eg: {onSuccess:function(data){}, onError: function(err){}}
             * @static
             * @memberof Built.User
             * @return {Built.Promise} returns Built.Promise
             */
            Built.User.login = function (email, pass, option) {
                option = option || {};
                var self = this;
                if (typeof email !== 'string' || typeof pass !== 'string') {
                    return option.onError({
                        error_message : "Email and Password required"
                    }, null);
                }
                var promise = buildPromise(option);
                option = promise.__options;
                var cb = function (data, res) {
                    try { data = JSON.parse(data) } catch (e) { }
                    if (typeof data === 'object' && data.application_user) {
                        appUserInfo = data.application_user;
                        userInfo = data.application_user;                       
                        getHeadersRef()['authtoken'] = data.application_user.authtoken;
                        Built.User.loginType = "built";
                        root.Events.trigger('user:login', data, 'built');
                        if (typeof option.onSuccess == 'function') {
                            option.onSuccess(data, res);
                        }
                    } else {
                        if (typeof option.onError == 'function') {
                            option.onError(data, res);
                        }
                    }
                }
                var data = { application_user: { email: email, password: pass} }
                var rets = REST.USER.login(getHeadersCopy(), data, cb, {});
                promise._XHR = rets._XHR;
                promise.abort = rets.abort;
                return promise;
            }

            /**
             * update built.io application user info.
             * @param {Object} options JSON containing new info.
             * @param {Object} [callback] object containing callbacks. eg: {onSuccess:function(data){}, onError: function(err){}}
             * @static
             * @memberof Built.User
             * @return {Built.Promise} returns Built.Promise
             */
            Built.User.update = function(options, callback){
                var self = this;
                callback = callback || {};
                options = options || {};
                var promise = buildPromise(callback);
                var headersData = getHeadersCopy();
                callback = promise.__options;
                if(userInfo &&
                    typeof userInfo === "object" &&
                    userInfo.uid &&
                    headersData.authtoken &&
                    headersData.application_api_key &&
                    headersData.application_uid){
                    var cb = function (data, res) {
                        try { data = JSON.parse(data) } catch (e) { }
                        if (typeof data == 'object' && data.notice) {
                            setAppUserInfo(data.application_user);
                            if (typeof callback.onSuccess == 'function') {
                                callback.onSuccess(data, res);
                            }
                        } else {
                            if (typeof callback.onError == 'function') {
                                callback.onError(data, res);
                            }
                        }
                    }
                    var rets= REST.USER.update(getHeadersCopy(), options, cb, userInfo);
                    promise._XHR=rets._XHR;
                    promise.abort=rets.abort;
                    return promise;

                }else{
                    if (typeof callback.onError == 'function') {
                        return callback.onError({error_message:"Parameter missing"}, null);
                    }
                }
            }

            /**
             * login using Google OAuth 2.0 access token
             * @param {String} access_token Google OAuth 2.0 Access Token
             * @param {Object} [callback] object containing callbacks. eg: {onSuccess:function(data){}, onError: function(err){}}
             * @static
             * @memberof Built.User
             * @return {Built.Promise} returns Built.Promise
             */
            Built.User.loginWithGoogle = function (accessToken,callback) {
                if(typeof accessToken === 'string'){
                    callback = callback ||{};
                    var cb = {
                        onError : callback.onError,
                        onAlways : callback.onAlways,
                        onSuccess : function (data, res) {
                            Built.User.__setUser__(data);
                            Built.User.loginType = "google";
                            root.Events.trigger('user:login', data, 'google');
                            if(typeof callback.onSuccess === 'function'){
                                callback.onSuccess(data,res);
                            }
                        }
                    }
                    var promise = buildPromise(cb);
                    cb = promise.__options;
                    var rets = Built.User.register({
                        "auth_data":{
                            "google":{
                                "access_token":accessToken
                            }
                        }
                    },cb);
                    promise._XHR = rets._XHR;
                    promise.abort = rets.abort;
                    return promise;
                }else{
                    throw new Error("Google access token required for login");
                }
                return returnBuilt();
            }

            /**
             * login using tibbr access token
             * @param {String} access_token tibbr OAuth 2.0 Access Token.
             * @param {String} hostname The host or endpoint of the tibbr installation
             * @param {Object} [callback] object containing callbacks. eg: {onSuccess:function(data){}, onError: function(err){}}
             * @static
             * @memberof Built.User
             * @return {Built.Promise} returns Built.Promise
             */
            Built.User.loginWithTibbr = function (accessToken,host,callback) {
                if(typeof accessToken=='string' && typeof host=='string'){
                    callback=callback ||{};
                    var cb={
                        onError:callback.onError,
                        onAlways:callback.onAlways,
                        onSuccess: function (data, res) {
                            Built.User.__setUser__(data);
                            Built.User.loginType="tibbr";
                            root.Events.trigger('user:login', data, 'tibbr');
                            if(typeof callback.onSuccess=='function'){
                                callback.onSuccess(data,res);
                            }
                        }
                    }
                    var promise=buildPromise(cb);
                    cb=promise.__options;
                    var rets= Built.User.register({
                        "auth_data":{
                            "tibbr":{
                                "access_token":accessToken,
                                "host":host
                            }
                        }
                    },cb);
                    promise._XHR=rets._XHR;
                    promise.abort=rets.abort;
                    return promise;
                }else{
                    throw new Error("tibbr access token and host required for login");
                }
                return returnBuilt();
            }

            /**
             * login using Facebook access token
             * @param {String} access_token Facebook OAuth Access Token
             * @param {Object} [callback] object containing callbacks. eg: {onSuccess:function(data){}, onError: function(err){}}
             * @static
             * @memberof Built.User
             * @return {Built.Promise} returns Built.Promise
             */
            Built.User.loginWithFacebook = function (accessToken,callback) {
                if(typeof accessToken=='string'){
                    callback=callback ||{};
                    var cb={
                        onError:callback.onError,
                        onAlways:callback.onAlways,
                        onSuccess: function (data, res) {
                            Built.User.__setUser__(data);
                            Built.User.loginType="facebook";
                            root.Events.trigger('user:login', data, 'facebook');
                            if(typeof callback.onSuccess=='function'){
                                callback.onSuccess(data,res);
                            }
                        }
                    }
                    var promise=buildPromise(cb);
                    cb=promise.__options;
                    var rets= Built.User.register({
                        "auth_data":{
                            "facebook":{
                                "access_token":accessToken
                            }
                        }
                    },cb);
                    promise._XHR=rets._XHR;
                    promise.abort=rets.abort;
                    return promise;
                }else{
                    throw new Error("Facebook access token required for login");
                }
                return returnBuilt();
            }

            /**
             * login with Twitter
             * @param {Object} twitterData JSON containing consumer_key, consumer_secret, token, token_secret.
             * @param {Object} [callback] object containing callbacks. eg: {onSuccess:function(data){}, onError: function(err){}}
             * @static
             * @memberof Built.User
             * @return {Built.Promise} returns Built.Promise
             */
            Built.User.loginWithTwitter = function (twrObj,callback) {
                if(typeof twrObj=='object' && twrObj.consumer_key && twrObj.consumer_secret && twrObj.token && twrObj.token_secret){
                    callback=callback ||{};
                    var cb={
                        onError:callback.onError,
                        onAlways:callback.onAlways,
                        onSuccess: function (data, res) {
                            Built.User.__setUser__(data);
                            Built.User.loginType="twitter";
                            root.Events.trigger('user:login', data,'twitter');
                            if(typeof callback.onSuccess=='function'){
                                callback.onSuccess(data,res);
                            }
                        }
                    }
                    var promise = buildPromise(cb);
                    cb = promise.__options;
                    var rets= Built.User.register({
                        "auth_data":{
                            "twitter":{
                                "consumer_key":twrObj.consumer_key,
                                "consumer_secret":twrObj.consumer_secret,
                                "token":twrObj.token,
                                "token_secret":twrObj.token_secret
                            }
                        }
                    },cb);
                    promise._XHR=rets._XHR;
                    promise.abort=rets.abort;
                    return promise;
                }else{
                    throw new Error("Twitter Consumer key, Consumer Secret, Token, Token Secret required for login");
                }
                return returnBuilt();
            }


            /**
             * saves built.io application user session locally using localStorage API.
             * @static
             * @memberof Built.User
             * @return {Built.User} returns Built.User object
             */
            Built.User.saveSession = function () {
                var headersData = getHeadersCopy();
                if (typeof localStorage === 'undefined') { return this }
                if (typeof userInfo === 'object' &&
                    typeof localStorage !== 'undefined' &&
                    headersData['application_api_key']) {
                    if(headersData.authtoken){
                        userInfo.authtoken = headersData.authtoken;
                    }
                    localStorage.setItem(headersData['application_api_key'], JSON.stringify(userInfo));
                    root.Events.trigger('user:save-session', userInfo);
                }
                return returnBuilt();
            }
            /**
             * set user defined built.io application user session.
             * @param {Object} UserSessionObject BuiltUser object. Ideally object returned by Buit.User.getSession method.
             * @example Built.User.setCurrentUser(Built.User.getSession());
             * @static
             * @memberof Built.User
             * @return {Built.User} returns Built.User object
             */
            Built.User.setCurrentUser = function (key) {
                if (typeof key === 'object' && key !== null && key.authtoken) {
                    var self = this;
                    setAppUserInfo(key);
                    if(key.authtoken){
                        getHeadersRef().authtoken = getAppUserInfo().authtoken;
                    }else if(getHeadersRef().authtoken){
                        getAppUserInfo().authtoken = getHeadersRef().authtoken;
                    }
                    root.Events.trigger('user:set-current-user', userInfo);
                }
                return returnBuilt();
            }
            /**
             * Get user session from localStorage
             * @static
             * @memberof Built.User
             * @return {Object} returns Built.User session object.
             */
            Built.User.getSession = function () {
                var headersData = getHeadersCopy();
                if (typeof headersData['application_api_key'] === 'undefined') {
                    throw new Error("initialize built.io sdk using Built.init(apiKey, appUid)");
                }
                try{
                    if(localStorage.getItem(headersData['application_api_key'])){
                        return JSON.parse(localStorage.getItem(headersData['application_api_key']));
                    }
                }catch(e){
                }
                return null;
            }
            /**
             * clears user session
             * @static
             * @memberof Built.User
             * @return {Built.User} returns Built.User object
             */
            Built.User.clearSession = function () {
                var self = this;
                appUserInfo = null;
                userInfo = null;
                var headersData = getHeadersCopy();
                if(!(self instanceof root.User)){
                    try{
                        delete Headers['authtoken'];
                    }catch(e){}    
                }               
                try{localStorage.removeItem(headersData['application_api_key'])}catch(e){}
                Built.User.loginType = null;
                root.Events.trigger('user:clear-session');
                return returnBuilt();
            }

            /**
             * logs out the currently logged in user
             * @param {Object} [callback] object containing callbacks. eg: {onSuccess:function(data){}, onError: function(err){}}
             * @static
             * @memberof Built.User
             * @return {Built.Promise} returns Built.Promise
             */
            Built.User.logout = function (option) {
                option = option || {};
                if (userInfo === null || typeof userInfo !== 'object' || typeof userInfo.authtoken ==='undefined') {
                    throw new Error("no user found");
                }
                var promise = buildPromise(option);
                option = promise.__options;
                var cb = function (data, res) {
                    try { data = JSON.parse(data) } catch (e) { }
                    if (data && typeof data === 'object' && typeof data.notice !== "undefined") {
                        Built.User.clearSession();
                        root.Events.trigger('user:logout');
                        if (typeof option.onSuccess == 'function') {
                            option.onSuccess(data, res);
                        }
                    } else {
                        if (typeof option.onError == 'function') {
                            option.onError(data, res);
                        }
                    }
                }
                var rets= REST.USER.logout(getHeadersCopy(), {}, cb, {});
                promise._XHR=rets._XHR;
                promise.abort=rets.abort;
                return promise;
            }
           /**
            * register/create new user in built.io application.
            * @param {Object} userInfo JSON containing user info.
            * @example userInfo object contains following parameters:
            * {
            *   email: required,
            *   password: required,
            *   password_confirmation: required,
            *   username: optional,
            *   first_name: optional,
            *   last_name: optional,
            *   customKey: customValue
            * }
            * @param {Object} [callback] object containing callbacks. eg: {onSuccess:function(data){}, onError: function(err){}}
            * @static
            * @memberof Built.User
            * @return {Built.Promise} returns Built.Promise
            */
            Built.User.register = function (options, callback) {
                options = options || {}
                callback = callback || {}
                if ((typeof options.email==='undefined' ||
                    typeof options.password==='undefined' ||
                    typeof options.password_confirmation==='undefined') &&
                    typeof options.auth_data ==='undefined') {
                    throw new Error("missing required parameters. provide email, password, password_confirmation or auth_data");
                    return;
                }
                var promise=buildPromise(callback);
                callback=promise.__options;
                var cb = function (data, res) {
                        try { data = JSON.parse(data) } catch (e) { }
                        if (data && typeof data == 'object' && typeof data.notice !== "undefined") {
                            root.Events.trigger('user:register',data);
                            if (typeof callback.onSuccess == 'function') {
                                callback.onSuccess(data, res);
                            }
                        } else {
                            if (typeof callback.onError == 'function') {
                                callback.onError(data, res);
                            }
                        }
                    },
                    data = { application_user: options };
                var rets= REST.USER.register(getHeadersCopy(), data, cb, {});
                promise._XHR=rets._XHR;
                promise.abort=rets.abort;
                return promise;
            }

            /**
             * activate application user in built.io application.
             * @param {String} uid user uid of the user to activate
             * @param {String} activation_token activation token
             * @param {Object} [callback] object containing callbacks. eg: {onSuccess:function(data){}, onError: function(err){}}
             * @static
             * @memberof Built.User
             * @return {Built.Promise} returns Built.Promise
             */
            Built.User.activate = function (userId,activationToken, callback) {
                if(typeof userId =='string' && typeof activationToken=='string'){
                    callback=callback={};
                    var options={userId:userId,activationToken:activationToken}
                    var promise=buildPromise(callback);
                    callback=promise.__options;
                    var cb = function (data, res) {
                        try { data = JSON.parse(data) } catch (e) { }
                        if (data && typeof data == 'object' && typeof data.notice !== "undefined") {
                            root.Events.trigger('user:activate',data);
                            if (typeof callback.onSuccess == 'function') {
                                callback.onSuccess(data, res);
                            }
                        } else {
                            if (typeof callback.onError == 'function') {
                                callback.onError(data, res);
                            }
                        }
                    }
                    var rets = REST.USER.activate(getHeadersCopy(), {}, cb, options);
                    promise._XHR=rets._XHR;
                    promise.abort=rets.abort;
                    return promise;
                }else{
                    throw new Error("user uid and activation token required");
                }
            }

            /**
             * deactivate application user in built.io application.
             * @param {String} uid user uid of the user to de-activate
             * @param {Object} [callback] object containing callbacks. eg: {onSuccess:function(data){}, onError: function(err){}}
             * @static
             * @memberof Built.User
             * @return {Built.Promise} returns Built.Promise
             */
            Built.User.deactivate = function (userId,callback) {
                var self = this;
                var headersData = getHeadersCopy();
                if (typeof headersData['authtoken']==='undefined') {
                    throw new Error("authenticated session required") ;
                }else if(typeof userId !="string"){
                    throw new Error("user uid required") ;
                }
                callback = callback || {}
                var promise = buildPromise(callback);
                callback = promise.__options;
                var cb = function (data, res) {
                    try { data = JSON.parse(data) } catch (e) { }
                    if (data && typeof data === 'object' && 
                        typeof data.notice !== "undefined") {
                            setAppUserInfo(null);
                            root.Events.trigger('user:deactivate', data);
                            if(!(self instanceof root.User)){
                                if (Headers['authtoken']) { 
                                    delete Headers['authtoken']; 
                                }    
                            }                       
                            if (typeof callback.onSuccess === 'function') {
                                callback.onSuccess(data, res);
                            }
                    } else {
                        if (typeof callback.onError === 'function') {
                            callback.onError(data, res);
                        }
                    }
                }
                var rets = REST.USER.deactivate(getHeadersCopy(), {}, cb, {userId:userId});
                promise._XHR = rets._XHR;
                promise.abort = rets.abort;
                return promise;
            }

            /**
             * Check whether user is already logged in.
             * @static
             * @memberof Built.User
             * @return {Boolean} Boolean value.
             */
            Built.User.isAuthenticated = function () {
                var headersData = getHeadersCopy();
                if (headersData['authtoken']){
                    return true;
                }
                return false;
            }
            /**
             * Get Logged In user's nformation.
             * @static
             * @memberof Built.User
             * @return {Object} returns JSON containing logged in user info or blank object.
             */
            Built.User.getCurrentUser = function () {
                 return root.Util.clone((userInfo || {}));
            }
            /**
             * fetch logged in user's information from built.io.
             * @param {Object} [callback] object containing callbacks. eg: {onSuccess:function(data){}, onError: function(err){}}
             * @static
             * @memberof Built.User
             * @return {Built.Promise} returns Built.Promise
             */
            Built.User.refreshUserInfo = function (option) {
                var self = this;
                option = option || {};
                var headersData = getHeadersCopy();
                if (typeof headersData['authtoken']==='undefined') {
                    throw new Error("no authtoken found");
                    return;
                }
                var promise = buildPromise(option);
                option = promise.__options;
                var cb = function (data, res) {
                    try { data = JSON.parse(data) } catch (e) { }
                    if (typeof data == 'object' && data.application_user) {
                        var au = getAppUserInfo().authtoken || headersData['authtoken'];
                        setAppUserInfo(data);
                        getAppUserInfo().authtoken = au;
                        if (typeof option.onSuccess == 'function') {
                            option.onSuccess(userInfo, res);
                        }
                    } else {
                        if (typeof option.onError == 'function') {
                            option.onError(data, res);
                        }
                    }
                }
                var rets= REST.USER.fetchUserInfo(getHeadersCopy(), {}, cb, {});
                promise._XHR=rets._XHR;
                promise.abort=rets.abort;
                return promise;
            }
            /**
             * send a password reset request for a specified email. If a user account exists with that email, an email will be sent to that address with instructions on how to reset their password.
             * @param {String} email Email of the account to send a reset password request.
             * @param {Object} [callback] object containing callbacks. eg: {onSuccess:function(data){}, onError: function(err){}}
             * @static
             * @memberof Built.User
             * @return {Built.Promise} returns Built.Promise
             */
            Built.User.forgotPassword = function (email, option) {
                option = option || {};
                if (typeof email !== 'string') {
                    throw new Error("email id required");
                    return;
                }
                var promise = buildPromise(option);
                option = promise.__options;
                var cb = function (data, res) {
                    try { data = JSON.parse(data) } catch (e) { }
                    if (data && typeof data === 'object' && typeof data.notice !== "undefined") {
                        if (typeof option.onSuccess === 'function') {
                            option.onSuccess(data, res);
                        }
                    } else {
                        if (typeof option.onError === 'function') {
                            option.onError(data, res);
                        }
                    }
                }
                var data = { application_user: { email: email} };
                var rets = REST.USER.forgotPassword(getHeadersCopy(), data, cb, {});
                promise._XHR = rets._XHR;
                promise.abort = rets.abort;
                return promise;
            }

            /** @private **/
            Built.User.requestResetPassword = Built.User.forgotPassword;

            /**
            * fetch user object by authtoken
            * @param {String} Authtoken authtoken of the user
            * @static
            * @memberof Built.User
            * @return {Built.Promise} returns Built.Promise
            */
            Built.User.fetchUserByAuthtoken = function(authtoken){
                var headersData = getHeadersCopy();
                var promise = new root.Promise,
                    head = {
                    application_api_key : headersData['application_api_key'],
                    application_uid : headersData['application_uid'],
                    authtoken : authtoken
                }
                var cb = function (data, res) {
                    try { data = JSON.parse(data) } catch (e) { }
                    if (typeof data === 'object' && data.application_user) {
                        data = data.application_user;
                        promise.resolve(data, res);
                    } else {
                        promise.reject(data, res);
                    }
                }
                var rets = REST.USER.fetchUserInfo(getHeadersCopy(head), {}, cb, {});
                promise._XHR = rets._XHR;
                promise.abort = rets.abort;
                return promise;
            }

            /*@private*/
            var fetchUidByMail = function(data,callback){
                var promise=buildPromise(callback);
                callback=promise.__options;
                var cb=function(d,res){
                    try{d=JSON.parse(d)}catch(e){}
                    if(typeof d=='object' && d.uid){
                        if(typeof callback.onSuccess=='function'){
                            callback.onSuccess(d,res);
                        }
                    }else{
                        if(typeof callback.onError=='function'){
                            callback.onError(d,res);
                        }
                    }
                }
                var rets= REST.USER.fetchUidByEmail(getHeadersCopy(),data,cb);
                promise._XHR=rets._XHR;
                promise.abort=rets.abort;
                return promise;
            }


            /**
             * fetch user uid by providing email
             * @param {String} email email of the user
             * @param {Object} [callback] object containing callbacks. eg: {onSuccess:function(data){}, onError: function(err){}}
             * @static
             * @memberof Built.User
             * @return {Built.Promise} returns Built.Promise
             */
            Built.User.fetchUserUidByEmail= function (email,callback) {
                if(typeof email=='string' ){
                    var data={application_user:{email:email}};
                    callback=callback||{};
                    return fetchUidByMail(data,callback);

                }else{
                    throw new Error("email id required");
                }
            }

            /**
             * fetch user uid by providing google email
             * @param {String} email google email of the user
             * @param {Object} [callback] object containing callbacks. eg: {onSuccess:function(data){}, onError: function(err){}}
             * @static
             * @memberof Built.User
             * @return {Built.Promise} returns Built.Promise
             */
            Built.User.fetchUserUidByGoogleEmail= function (email,callback) {
                if(typeof email=='string' ){
                    var data={
                        application_user:{
                            auth_data:{
                                google:{
                                    email:email
                                }
                            }
                        }
                    };
                    callback=callback||{};
                    return fetchUidByMail(data,callback);

                }else{
                    throw new Error("Google email id required");
                }
            }

            /**
             * fetch user uid by providing facebook user id
             * @param {String} userId Facebook user id
             * @param {Object} [callback] object containing callbacks. eg: {onSuccess:function(data){}, onError: function(err){}}
             * @static
             * @memberof Built.User
             * @return {Built.Promise} returns Built.Promise
             */
            Built.User.fetchUserUidByFacebookUserId= function (userId,callback) {
                if(typeof userId=='string' ){
                    var data={
                        application_user:{
                            auth_data:{
                                facebook:{
                                    user_id:userId
                                }
                            }
                        }
                    };
                    callback=callback||{};
                    return fetchUidByMail(data,callback);

                }else{
                    throw new Error("facebook user id required");
                }
            }

            /**
             * fetch user uid by providing tibbr user id
             * @param {String} userId user id of the tibbr user
             * @param {String} Host The host or endpoint of the tibbr installation
             * @param {Object} [callback] object containing callbacks. eg: {onSuccess:function(data){}, onError: function(err){}}
             * @static
             * @memberof Built.User
             * @return {Built.Promise} returns Built.Promise
             */
            Built.User.fetchUserUidByTibbrUserId= function (userId,host,callback) {
                if(typeof userId === 'string' && typeof host === 'string'){
                    var data={
                        application_user:{
                            auth_data:{
                                tibbr:{
                                    user_id:userId,
                                    host:host
                                }
                            }
                        }
                    };
                    callback=callback||{};
                    return fetchUidByMail(data,callback);

                }else{
                    throw new Error("tibbr user id and host required");
                }
                return this;
            }


            /**
             * get Built.Query object for application user's class
             * @example
             * var users=Built.User.getUserQuery();
             * users.greaterThan('age','17')
             * .exec()
             * .success(function(usersArray, responseObject){
             *    //callback logic
             * });
             * @name Built.User.getUserQuery
             * @function
             * @memberof Built.User
             * @static
             * @return {Built.Query} returns Built.Query to get application user's object.
             */
            Built.User.getUserQuery = function (){
                return (new root.Query('built_io_application_user'));
            }


            /**
             * generate application user authtoken using master key 
             * @param {Built.Query} userQuery built query object to identify particular applicaton user.
             * @param {Boolean} [insertUser] insert an application user if not exist.
             * @param {Object} [userDataObject] application user data object to update.
             * @name Built.User.generateAuthtoken
             * @function
             * @memberof Built.User
             * @static
             * @return {Built.Promise} returns Built.Promise.
             */
            Built.User.generateAuthtoken = function(query, insert, userObject){
                insert = insert || false;
                userObject = userObject || {};
                if(! query instanceof root.Query){
                    throw error("Built.Query object required for filtering user");
                }
                var promise = buildPromise();
                var cb = function (data, res) {
                    try { data = JSON.parse(data) } catch (e) { }
                    if (typeof data === 'object' && data.application_user) {
                        promise.resolve(data.application_user, res);
                    } else {
                        promise.reject(data, res);
                    }
                }
                var data = { 
                    insert : insert,
                    query : query.toJSON().query,
                    application_user : userObject
                };
                var rets= REST.USER.generateAuthtoken(data, cb);
                promise._XHR=rets._XHR;
                promise.abort=rets.abort;
                return promise;   

            }

            /**@private*/
            Built.User.__setUser__ = function (resObject) {
                var self = this;
                try{resObject=JSON.parse(resObject)}catch(e){}
                var headersData = getHeadersCopy();
                if(typeof resObject == "object" && resObject.notice &&
                    typeof resObject.application_user == 'object' &&
                    resObject.application_user.authtoken){
                    setAppUserInfo(resObject.application_user);
                    headersData['authtoken'] = resObject.application_user.authtoken;
                    return true;
                }
                return false;
            }

            /**@private*/
            Built.User.loginType = null;

        }

        var methods = new root.User;
        for(var i in methods){
          root.User[i] = methods[i];
        }
    
    })(Built);

////////////////////////////////////////////////        Built.Delta              ///////////////////////////////////////////////////
    (function (root) {
        var Built = root;
        /**
         * Built.Delta fetches objects that are modified (created/updated/deleted) at/on specified date
         * @name Built.Delta
         * @class
         */
        Built.Delta = function (class_id) {
            if (typeof class_id != 'string') { throw new Error("class uid required for delta object") }
            var __q__ = { delta: {} };
            var class_uid = class_id;

            /**
             * get delta objects created on and after certain time given by user
             * @param {String} dateTime date condition on which delta to be applied. time in format of dd-mm-yyyy OR dd-mm-yyyy hh:mm:ss.
             * @name createdAt
             * @memberOf Built.Delta
             * @function
             * @instance
             * @return {Built.Delta} returns Built.Delta object
             */
            this.createdAt= function (moment) {
                if (typeof class_uid != 'string') { throw new Error("class uid required") }
                if (typeof moment != "string") { throw new Error("time param required to query delta objects") }
                __q__.delta['created_at'] = moment;
                return this;
            }


            /**
             * get delta objects deleted on and after certain time given by user
             * @param {String} dateTime date condition on which delta to be applied. time in format of dd-mm-yyyy OR dd-mm-yyyy hh:mm:ss.
             * @name deletedAt
             * @memberOf Built.Delta
             * @function
             * @instance
             * @return {Built.Delta} returns Built.Delta object
             */
            this.deletedAt= function (moment) {
                if (typeof class_uid != 'string') { throw new Error("class uid required") }
                if (typeof moment != "string") { throw new Error("time param required to query delta objects") }
                __q__.delta['deleted_at'] = moment;
                return this;
            }

            /**
             * get delta objects updated on and after certain time given by user
             * @param {String} dateTime date condition on which delta to be applied. time in format of dd-mm-yyyy OR dd-mm-yyyy hh:mm:ss.
             * @name updatedAt
             * @memberOf Built.Delta
             * @function
             * @instance
             * @return {Built.Delta} returns Built.Delta object
             */
            this.updatedAt= function (moment) {
                if (typeof class_uid != 'string') { throw new Error("class uid required") }
                if (typeof moment != "string") { throw new Error("time param required to query delta objects") }
                __q__.delta['updated_at'] = moment;
                return this;
            }

            /**
             * get all delta objects updated, deleted, created on and after certain time given by user
             * @param {String} dateTime date condition on which delta to be applied. time in format of dd-mm-yyyy OR dd-mm-yyyy hh:mm:ss.
             * @name allDeltaAt
             * @memberOf Built.Delta
             * @function
             * @instance
             * @return {Built.Delta} returns Built.Delta object
             */
            this.allDeltaAt= function (moment) {
                if (typeof class_uid != 'string') { throw new Error("class uid required") }
                if (typeof moment != "string") { throw new Error("time param required to query delta objects") }
                __q__.delta['ALL'] = moment;
                return this;
            }

            /**
             * execute delta object query to get delta objects
             * @param {Object} [callback] object containing callbacks. eg: {onSuccess:function(data){}, onError: function(err){}}
             * @name exec
             * @memberOf Built.Delta
             * @function
             * @instance
             * @return {Built.Promise} returns Built.Promise
             */
            this.exec= function (options) {
                options = options || {};
                var self = this;
                if (typeof class_uid != 'string') { throw new Error("class uid required") }
                if (Built.Util.dataType(__q__) != 'object' || isEmptyJSON(__q__) == true) {
                    throw new Error("no delta query found");
                    return;
                }
                var nQ = new Built.Query(class_uid);
                var opt = {};
                opt.query = __q__;
                opt.model = false;
                opt.onSuccess = function (data, res) {
                    if (options.model === false) {
                        if (typeof options.onSuccess == 'function') {
                            options.onSuccess(data, res);
                        }
                    } else {
                        if (typeof data.objects.created_at !== "undefined") {
                            data.objects.created_at = nQ.__toObjectModel__(data.objects.created_at, class_uid);
                        }
                        if (typeof data.objects.updated_at !== "undefined") {
                            data.objects.updated_at = nQ.__toObjectModel__(data.objects.updated_at, class_uid);
                        }
                        if (typeof data.objects.deleted_at !== "undefined") {
                            data.objects.deleted_at = nQ.__toObjectModel__(data.objects.deleted_at, class_uid);
                        }
                        if (typeof options.onSuccess == 'function') {
                            options.onSuccess(data.objects, res);
                        }
                    }
                }
                opt.onError = options.onError
                opt.onAlways = options.onAlways;
                return nQ.exec(opt);
            }
        }
    
    })(Built);

////////////////////////////////////////////////        Built.Object             ///////////////////////////////////////////////////
    (function (root) {
        var Built = root;
        /**
         * Create, Retrieve, Update, Delete objects using Built.Object class
         * @name Built.Object
         * @param {String} classUid Class uid of the class that is created using Web UI
         * @param {Object} [objectAttributes] object attributes to instantiate with.
         * @class
         * @example
         * var myClass= Built.Object.extend("user");
         * var myObject= new myClass({name:"something"});
         * @example
         * var myObject = new Built.Object("user",{name:"something"});
         * @see Built.Object.extend
         */
        Built.Object = function (classUid, attrbs, emptyShadow) {
            var _schema = null,
              attributes = {},
              object_uid = null,
              __q = {},
              shadow = {},
              obj_options = {},
              _head = Built.Util.clone(Headers),
              userObj = {
                headers : {},
                info : {}
              };
              me = this;

            if(classUid){
                if(this.class_uid && arguments.length==1){
                    if(typeof classUid=="string"){
                        attrbs={uid:classUid}
                    }else{
                        attrbs=classUid;
                    }
                }else if(typeof classUid=="string"){
                    this.class_uid=classUid;
                }
            }

            if(typeof attrbs=="string" && attrbs !==""){
                attrbs={uid:attrbs}
            }

            if (typeof this.class_uid != 'string') {
                throw new Error("class uid required");
            }
            if (Built.Util.dataType(attrbs) === 'object') {
                attributes = Built.Util.clone(attrbs);
                if(typeof attrbs.uid === "string" && attrbs.uid !== ""){
                    object_uid = attrbs.uid;
                }
            }
            if(! emptyShadow){
                shadow = Built.Util.clone(attributes);
            }
            /** @private */
            this.initialize = function () {}

            /** @private */
            this._validate = function(){
                if(typeof this.validate=="function"){
                    return this.validate.apply(this,arguments);
                }
                return true;
            }

            function _getHeaders(extraHeaders){
                if(extraHeaders){
                    return Built.Util.mix(Built.Util.mix(_head, userObj.headers), extraHeaders);                     
                }
                return Built.Util.mix(_head, userObj.headers);
            }

            /**
             *
             * set user for this Built.Object.
             * @param {Object} builtUser pass Built.User object.
             * @name setUser
             * @memberOf Built.Object
             * @function
             * @instance
             * @return {Built.Object} returns the same object for chaining
             */
             this.setUser = function(user){
                if(user && typeof(user.getHeaders) === 'function'){
                    userObj.headers = user.getHeaders();
                    userObj.info = user.getInfo();
                }
                return me;
             }


            /**
             *
             * add tag(s) while saving object
             * @param {Array} tags an array of tag(s)
             * @name setTags
             * @memberOf Built.Object
             * @function
             * @instance
             * @return {Built.Object} returns the same object for chaining
             */

            this.setTags = function(args){
                var a=args;
                if(Built.Util.dataType(args) === "array"){
                    a= a.join(',');
                }
                if(a.indexOf(' ')>=0){
                    a=a.split(' ').join(',');
                }
                shadow['tags']=a;
                return this;
            }

            /**
             * issue a timeless update. The date of creation, updation will not change
             * @name timeless
             * @memberOf Built.Object
             * @function
             * @instance
             * @return {Built.Object} returns the same object for chaining
             */
            this.timeless = function (){
                _head['timeless']=true;
            }


            /**
             * update data of matching field uid or create new object.
             * @param {Object} object A check will be performed, whether any object has the key value pair(s) supplied in the object
             * @name upsert
             * @memberOf Built.Object
             * @function
             * @instance
             * @return {Built.Object} returns the same object for chaining
             */
            this.upsert = function (key) {
                if(Built.Util.dataType(key) =='object'){
                    if(typeof obj_options['UPSERT'] ==='undefined'){obj_options['UPSERT'] = {}}
                    obj_options['UPSERT'] = Built.Util.mix(obj_options['UPSERT'],key);
                }
            }
            /**
             * use this method only when the values of the fields inside referenced object are to be changed while creating a new object.
             * @param {String} refUid reference uid on which UPSERT is to be performed.
             * @param {Object} object A check will be performed, whether any object has the key value pair(s) supplied in the object in the reference field.
             * @name upsertForReference
             * @memberOf Built.Object
             * @function
             * @instance
             * @return {Built.Object} returns the same object for chaining
             */
            this.upsertForReference=function (ref_uid,upsertObj) {
                if(typeof ref_uid =='string' && Built.Util.dataType(upsertObj)=='object'){
                    if(typeof shadow[ref_uid] !== 'object'){shadow[ref_uid]={}};
                    shadow[ref_uid]['UPSERT']=upsertObj;
                }
                return this;
            }
            /**
             * increment the given key(number field) by given number or by 1
             * @param {String} Key the key to increment
             * @param {Number} [Number=1] by how much amount to increment
             * @name increment
             * @memberOf Built.Object
             * @function
             * @instance
             * @return {Built.Object} returns the same object for chaining
             */
            this.increment=function (key,val) {
                if(typeof key=='string' && key !=""){
                    val=(isNaN(val)==true?1:val);
                    this.set(key,{"ADD":val});
                }
                return this;
            }
            /**
             * decrement the given key(number field) by given number or by 1
             * @param {String} Key the key to decrement
             * @param {Number} [Number=1] by how much amount to decrement.
             * @name decrement
             * @memberOf Built.Object
             * @function
             * @instance
             * @return {Built.Object} returns the same object for chaining
             */
            this.decrement= function (key,val) {
                if(typeof key=='string' && key !=""){
                    val=(isNaN(val)==true?1:val);
                    this.set(key,{"SUB":val});
                }
                return this;
            }
            /**
             * multiply the given key(number field) by a given number
             * @param {String} Key the key to be multiplied by
             * @param {Number} number the number by which to multiply.
             * @name multiply
             * @memberOf Built.Object
             * @function
             * @instance
             * @return {Built.Object} returns the same object for chaining
             */
            this.multiply= function (key,val) {
                if(typeof key=='string' && key !=""){
                    val=(isNaN(val)==true?1:val);
                    this.set(key,{"MUL":val});
                }
                return this;
            }
            /**
             * divide the given key(number field) by a given number
             * @param {String} Key the key to be divided by
             * @param {Number} number the number by which to divide.
             * @name divide
             * @memberOf Built.Object
             * @function
             * @instance
             * @return {Built.Object} returns the same object for chaining
             */
            this.divide= function (key,val) {
                if(typeof key=='string' && key !=""){
                    val=(isNaN(val)==true?1:val);
                    this.set(key,{"DIV":val});
                }
                return this;
            }
            /**
             * add a value at a particular index to a field that allows multiple values
             * @param {String} Key uid of the field
             * @param {String|Array|Object} value value to append in field
             * @param {Number} [Index] index at which value is to be added
             * @name pushValue
             * @memberOf Built.Object
             * @function
             * @instance
             * @return {Built.Object} returns the same object for chaining
             */
            this.pushValue=function (key,val,index) {
                if(key && val && typeof key === "string"){
                    var pushData = {
                        "PUSH":{
                            data : val
                        }
                    }
                    if(typeof index === "number"){
                        pushData.PUSH.index = index;
                    }
                    shadow[key] = pushData;
                }
                return this;
            }
            /**
             * delete a value from a field that allows multiple values
             * @param {String} Key uid of the field
             * @param {String|Array} value or array of values to remove from the field
             * @name pullValue
             * @memberOf Built.Object
             * @function
             * @instance
             * @return {Built.Object} returns the same object for chaining
             */
            this.pullValue=function (key,value) {
                if(typeof key ==='string' && key !="" && value){
                    if(typeof shadow[key] === 'undefined'){
                        shadow[key]={}
                    };
                    if(typeof shadow[key]['PULL']==='undefined'){
                        shadow[key]['PULL']={}
                    }
                    if(typeof shadow[key]['PULL']['data']==='undefined'){
                        shadow[key]['PULL']['data']=[];
                    }
                    if(Built.Util.dataType(value)=='array'){
                        shadow[key]['PULL']['data']=shadow[key]['PULL']['data'].concat(value);
                    }else{
                        shadow[key]['PULL']['data'].push(value);
                    }
                }
                return this;
            }

            /**
             * delete a value from a field that allows multiple values
             * @param {String} Key uid of the field
             * @param {Number} index index at which the value is to be deleted
             * @name pullValueAtIndex
             * @memberOf Built.Object
             * @function
             * @instance
             * @return {Built.Object} returns the same object for chaining
             */
            this.pullValueAtIndex= function (key,index) {
                if(typeof key ==='string' && isNaN(index)==false){
                    if(typeof shadow[key] === 'undefined'){shadow[key]={}}
                    if(typeof shadow[key]['PULL']==='undefined'){
                        shadow[key]['PULL']={}
                    }
                    shadow[key]["PULL"]['index']=parseInt(index);
                }
                return this;
            }


            /**
             * set value for the given key
             * @param {String} Key the key(field uid in your class)
             * @param {String} Value the value to set
             * @name set
             * @memberOf Built.Object
             * @function
             * @instance
             * @return {Built.Object} returns the same object for chaining
             */
            this.set= function (key, val) {
                if (typeof key == 'object') {
                    for(var i in key){
                        if(me._validate(i,key[i])){
                           this.trigger('change, change:'+i,this, key[i],shadow[i]);
                           shadow[i]=key[i]
                        }
                    }
                } else if (typeof key == 'string') {
                    if(me._validate(key,val)){
                        this.trigger('change, change:'+key,this, val,shadow[key]);
                        shadow[key] = val;
                    }
                }
                object_uid=(this.get("uid") || undefined);
                return this;
            }


            /**
             * set object for reference field where the dictionary matches the objects of the referred class
             * @param {String} key The key for which you are setting the object
             * @param {Object} object This is the object against which the matching objects are set for the reference field.
             * @name setReferenceWhere
             * @memberOf Built.Object
             * @function
             * @instance
             * @return {Built.Object} returns the same object for chaining
             */
            this.setReferenceWhere= function (field_uid,obj){
                if(typeof field_uid=='string' && obj){
                    shadow[field_uid]={"WHERE":obj}
                }
                return this;
            }


            /**
             * set object/uid for reference field
             * @param {String} key for which you are setting the object
             * @param {String|Array|Object} object This can either be a uid of a referenced object or an instance of Built.Object.
             * @name setReference
             * @memberOf Built.Object
             * @function
             * @instance
             * @return {Built.Object} returns the same object for chaining
             */
            this.setReference=function (field_uid,refs){
                if(typeof field_uid =='string' && refs){
                    if(Built.Util.dataType(shadow[field_uid]) !="array"){
                        shadow[field_uid]=[];
                    }
                    if(Built.Util.dataType(refs)=='array'){
                        shadow[field_uid]=shadow[field_uid].concat(refs);
                    }else{
                        shadow[field_uid].push(refs);
                    }
                }
                return this;

            }

            /**
             * set location for an object
             * @param {Built.Location} location an object of Built.Location
             * @name setLocation
             * @memberOf Built.Object
             * @function
             * @instance
             * @return {Built.Object} returns the same object for chaining
             */
            this.setLocation= function (Location){
                if (Location instanceof Built.Location) {
                    var loc=Location.toJSON();
                    this.set('__loc',[loc.longitude,loc.latitude]);
                }else{throw new Error("Built.Location object required")}
                return this;
            }


            /**
             * get location of object
             * @name getLocation
             * @memberOf Built.Object
             * @function
             * @instance
             * @return {Built.Location} returns instance of Built.Location
             */
            this.getLocation= function (){
                return (new Built.Location(this.get('__loc')));
            }


            /**
             * update a value in a field that allows multiple values
             * @param {String} key uid of the field
             * @param {String} updatedValue new value to be updated
             * @param {Number} index index at which the value is to be updated
             * @name updateValue
             * @memberOf Built.Object
             * @function
             * @instance
             * @return {Built.Object} returns the same object for chaining
             */
            this.updateValue= function (field_uid, value, index) {
                if(typeof field_uid =='string' && isNan(index)==false && value){
                    shadow[field_uid]={"UPDATE":{data:value,index:index}}
                }
                return this;
            }

            /**
             * fetches an object provided object uid and class uid
             * @param {Object} [callback] object containing callbacks. eg: {onSuccess:function(data){}, onError: function(err){}}
             * @name fetch
             * @memberOf Built.Object
             * @function
             * @instance
             * @return {Built.Promise} returns Built.Promise
             */
            this.fetch= function (callback) {
                if (typeof this.class_uid !== 'string' ||
                    this.class_uid.length <= 0 ||
                    typeof object_uid !== 'string' ||
                    object_uid.length <= 0) {
                    throw new Error('object uid and class uid required');
                }
                callback = callback || {};
                var headers,
                    option = {};
                var promise=buildPromise(callback);
                callback=promise.__options;
                var cb = function (data, res) {
                    try { data = JSON.parse(data) } catch (e) {}
                    if (data && typeof data === 'object' && typeof data.object !== "undefined") {
                        attributes = data.object;
                        object_uid = data.object.uid;
                        shadow = {};
                        var keys = Object.keys(data);
                        for(var i =0;i<keys.length;i++){
                            if(keys[i] !== "object"){
                                me[keys[i]] = data[keys[i]];
                            }
                        }
                        me.trigger('fetch:data',data.object);
                        if (typeof callback.onSuccess == 'function') {
                            callback.onSuccess(data.object, res);
                        }
                    } else {
                        if (typeof callback.onError == 'function') {
                            callback.onError(data, res);
                        }
                    }
                }
                option.class_uid = this.class_uid;
                if (object_uid) { option.object_uid = object_uid }
                var rets= REST.OBJECT.fetch(_getHeaders(), __q, cb, option);
                promise._XHR=rets._XHR;
                promise.abort=rets.abort;
                return promise;
            }

            /**
             * save an object as draft so that it is not visible unless explicitly called for. see including drafts
             * @param {Object} [callback] object containing callbacks. eg: {onSuccess:function(data){}, onError: function(err){}}
             * @name saveAsDraft
             * @memberOf Built.Object
             * @function
             * @instance
             * @return {Built.Promise} returns Built.Promise
             */
            this.saveAsDraft= function (callback) {
                this.set({ published: false });
                return this.save(callback);
            }

            /**
            * add custom query in this object REST call.
            * @param {String} Name query name  to include.
            * @param {String} Value query value  to include.
            * @name addQuery
            * @memberOf Built.Object
            * @function
            * @instance
            * @return {Built.Object} returns the same object for chaining
            */
            this.addQuery = function(key,val){
                if(key && typeof key === 'string' && val){
                    __q[key]=val;
                }
                return this;
            }

            /** @private */
            this.includeFilter = this.addQuery;

            /**
             * set ACL to this object.
             * @param {Built.ACL} builtACL Built.ACL object to set for an object.
             * @name setACL
             * @memberOf Built.Object
             * @function
             * @instance
             * @return {Built.Object} returns the same object for chaining
             */
            this.setACL=function (aclObject) {
                if(typeof aclObject=='object' &&
                    typeof aclObject.toJSON=='function'){
                    var json=aclObject.toJSON();
                    this.set('ACL',json);
                }else if(typeof aclObject==="boolean"){
                    this.set('ACL', {disable: aclObject});
                }
                return this;
            }

            /**
             * saves the Built.Object to built.io
             * @param {Object} [callback] object containing callbacks. eg: {onSuccess:function(data){}, onError: function(err){}}
             * @name save
             * @memberOf Built.Object
             * @function
             * @instance
             * @return {Built.Promise} returns Built.Promise
             */
            this.save= function (callback) {
                callback = callback || {};
                var option = {};
                var promise=buildPromise(callback);
                callback=promise.__options;
                var cb = function (data, res) {
                    try { data = JSON.parse(data) } catch (e) {}
                    if (typeof data === "object" && typeof data.object !== "undefined") {
                        attributes = data.object;
                        object_uid = data.object.uid;
                        shadow = {};
                        var keys = Object.keys(data);
                        for(var i =0;i<keys.length;i++){
                            if(keys[i] !== "object"){
                                me[keys[i]] = data[keys[i]];
                            }
                        }
                        me.trigger('save',data.object);
                        if (typeof callback.onSuccess == 'function') {
                            callback.onSuccess(data.object, res);
                        }
                    } else {
                        if (typeof callback.onError == 'function') {
                            callback.onError(data, res);
                        }
                    }
                }
                option.class_uid = this.class_uid;
                if (object_uid) {
                    option.object_uid = object_uid;
                }
                if (typeof object_uid == 'string' && object_uid.length > 0) {
                    __q.object = shadow ;
                    var rets=REST.OBJECT.update(_getHeaders(), __q, cb, option);
                    promise._XHR=rets._XHR;
                    promise.abort=rets.abort;
                } else {
                    var dataObj = Built.Util.mix({ object: shadow },obj_options);
                    dataObj = Built.Util.mix(dataObj, __q);
                    var rets= REST.OBJECT.create(_getHeaders(), dataObj, cb, option);
                    promise._XHR=rets._XHR;
                    promise.abort=rets.abort;
                }
                return promise;
            }

            /**
             * deletes the Built.Object with specified object uid.
             * @param {Object} [callback] object containing callbacks. eg: {onSuccess:function(data){}, onError: function(err){}}
             * @name destroy
             * @memberOf Built.Object
             * @function
             * @instance
             * @return {Built.Promise} returns Built.Promise
             */
            this.destroy= function (callback) {
                callback = callback || {};
                var option = {};
                var promise=buildPromise(callback);
                callback=promise.__options;
                var cb = function (data, res) {
                    try { data = JSON.parse(data) } catch (e) {}
                    if (data && typeof data == 'object' && typeof data.notice !== "undefined") {
                        object_uid = null;
                        attributes = {};
                        shadow = {};
                        me.trigger('destroy',data);
                        if (typeof callback.onSuccess == 'function') {
                            callback.onSuccess(data, res);
                        }
                    } else {
                        if (typeof callback.onError == 'function') {
                            callback.onError(data, res);
                        }
                    }
                }
                option.class_uid = this.class_uid;
                if (object_uid) {
                    option.object_uid = object_uid;
                    var rets= REST.OBJECT.destroy(_getHeaders(), {}, cb, option);
                    promise._XHR=rets._XHR;
                    promise.abort=rets.abort;
                    return promise;
                } else {throw new Error('no object uid found') }
                return this;

            }

            /**
             * include owner information in response
             * @name includeOwner
             * @memberOf Built.Object
             * @function
             * @instance
             * @return {Built.Object} returns the same object for chaining
             */

             this.includeOwner = function(){
               __q.include_owner = true;
               return this;

             }

             /**
              * include objects count created in class.
              * @name includeCount
              * @memberOf Built.Object
              * @function
              * @instance
              * @return {Built.Object} returns the same object for chaining
              */

              this.includeCount = function(){
                __q.include_count = true;
                return this;

              }


            /**
             * fetches and returns class's schema
             * @param {Object} [callback] object containing callbacks. eg: {onSuccess:function(data){}, onError: function(err){}}
             * @name getSchema
             * @memberOf Built.Object
             * @function
             * @instance
             * @return {Built.Promise} returns Built.Promise
             */
            this.getSchema= function (callback) {
                callback = callback || {};
                var promise=buildPromise(callback);
                callback=promise.__options;
                var rets= _getSchema(callback,this);
                promise._XHR=rets._XHR;
                promise.abort=rets.abort;
                return promise;
            }
            var _getSchema=function(callback,me){
                if (Built.Util.dataType(_schema) == 'array') {
                    if(typeof callback.onSuccess=='function'){
                        callback.onSuccess(_schema);
                    }
                }
                var option = {},
                    oldCb = callback.onSuccess,
                    cb = function (data, res) {
                        try { data = JSON.parse(data) } catch (e) {}
                        if (typeof data == 'object' && data['class']) {
                            _schema = data['class'].schema;
                            me.trigger('fetch:schema',_schema);
                            if (typeof oldCb == 'function') {
                                oldCb(_schema, res);
                            }
                        } else {
                            if (typeof callback.onError == 'function') {
                                callback.onError(data, res);
                            }
                        }
                    }
                callback.onSuccess = cb;
                option.class_uid = me.class_uid;
                return REST['CLASS'].fetch(_getHeaders(), {}, cb, option);
            }

            /**
             * check attribute exist in object data.
             * @param {String} Key attribute name to check.
             * @name has
             * @memberOf Built.Object
             * @function
             * @instance
             * @return {Boolean} returns the boolean value
             */
            this.has= function (key) {
                return hasOwnProperty.call(attributes, key);
            }

            /**
             * get particular key in object data.
             * @param {String} key attribute name to get its value.
             * @name get
             * @memberOf Built.Object
             * @function
             * @instance
             * @return {Object|String} returns either object or string
             */
            this.get= function (key) {
                if(key){
                    return (typeof shadow[key] !== "undefined"?
                        shadow[key]:
                        typeof attributes[key] !== "undefined"?
                        attributes[key]:
                        undefined);
                }
                return undefined;
            }

            /**
             * set uid in empty initialized object model to make connection with existing object in built.io server.
             * @param {String} uid An uid of an object
             * @name setUid
             * @memberOf Built.Object
             * @function
             * @instance
             * @return {Built.Object} returns the same object for chaining
             */
            this.setUid= function (id) {
                return this.set('uid',id);
            }
            /**
             * create clone object.
             * @name clone
             * @memberOf Built.Object
             * @function
             * @instance
             * @return {Object} returns the new cloned object.
             */
            this.clone= function () {
                return new this.constructor(attributes);
            }
            /**
             * helps to check whether its new or existing object on built.io application.
             * @name isNew
             * @memberOf Built.Object
             * @function
             * @instance
             * @return {Boolean} returns the boolean value.
             */
            this.isNew= function () {
                return !object_uid;
            }
            /**
             * returns JSON representation of object attributes.
             * @name toJSON
             * @memberOf Built.Object
             * @function
             * @instance
             * @return {Object} returns JSON.
             */
            this.toJSON= function () {
                var attrib= Built.Util.clone(attributes);
                return Built.Util.mix(attrib,shadow) ;
            }

            /**
             * returns JSON representation of newly/changed set attributes.
             * @name dirtyJSON
             * @memberOf Built.Object
             * @function
             * @instance
             * @return {Object} returns JSON.
             */
            this.dirtyJSON= function(){
                return Built.Util.clone(shadow);
            }

            /**
             * returns JSON representation of data synced with the server or instantiated with.
             * @name oldJSON
             * @memberOf Built.Object
             * @function
             * @instance
             * @return {Object} returns JSON.
             */
            this.oldJSON=function(){
                return Built.Util.clone(attributes);
            }

            /**
             * set header for Built.Object
             * @name setHeader
             * @param {String} Name Header Name
             * @param {String} Value Header Value
             * @memberOf Built.Object
             * @function
             * @instance
             * @return {Built.Object} returns the same object for chaining
             */
            this.setHeader=function(key,val){
                if(key && val && typeof key === "string" && typeof val === "string"){
                    _head[key] = val;
                }
                return this;
            }
            /** @private */
            this.addHeader=this.setHeader;

            /**
             * remove header from this Built.Object REST call.
             * @name removeHeader
             * @param {String} Name Header Name
             * @memberOf Built.Object
             * @function
             * @instance
             * @return {Built.Object} returns the same object for chaining
             */
            this.removeHeader=function(key){
                if(key && typeof key === "string" && _head[key]){
                    delete _head[key] ;
                }
                return this;
            }

            /**
            * set master key for this Built.Object.
            * @param {String} masterKey master key.
            * @function
            * @instance
            * @name setMasterKey
            * @memberof Built.Object
            * @return {Built.Object} returns the same object for chaining
            */
            this.setMasterKey = function (key) {
                if(key && typeof key === "string" && key.length){
                    this.setHeader("master_key", key);  
                }
                return this;
            }

            /**
            * remove master key from this Built.Object.
            * @function
            * @instance
            * @name removeMastkerKey
            * @memberof Built.Object
            * @return {Built.Object} returns the same object for chaining
            */
            this.removeMastkerKey = function(){
                return this.removeHeader('master_key');
            }
        }

        Built.Object=Built.Events.inherit(Built.Object);

        /**
        * @memberof Built.Object
        * @readonly
        * @enum {string}
        */
        Built.Object.ModelType={
            /**  set the model type to backbone. It will return Backbone models.*/
            BACKBONE:"BACKBONE",

            /**  set the model type to native. It will return the Built Objects.*/
            NATIVE:"NATIVE",

            /**  set the model type to none. It will return the JSON.*/
            NONE:"NONE"
        }


        Built.Object.BACKBONE="BACKBONE";
        Built.Object.NATIVE="NATIVE";
        Built.Object.NONE="NONE";

        /**
         * Extends Built.Object with custom methods and parameters.
         * @param {String} class_uid class_uid to create an object of that particular built class.
         * @name Built.Object.extend
         * @memberof Built.Object
         * @static
         * @function
         * @return {Object} returns the extended Object .
         */
        Built.Object.extend = function (args) {
            if (typeof args == 'string') {
                args = { class_uid: args };
                return extend.call(Built.Object, args);
            }
            return extend.apply(Built.Object, arguments);
        }

    })(Built);

////////////////////////////////////////////////        Built.ACL                ///////////////////////////////////////////////////
    (function (root) {
        var Built = root;
        /**
         * A Built.ACL is used to control which users can access or modify a particular object. Each Built.Object can have its own Built.ACL.<br />
         * You can grant read and write permissions separately to specific users, to groups of users that belong to roles, or you can grant permissions to the "public" so that, eg, any user could read a particular object but only a particular set of users could write to that object.
         * @name Built.ACL
         * @class
         */
        Built.ACL = function (jsonACL) {
            var args_acl=jsonACL;
            var acl={};
            if (typeof args_acl !=='undefined') {
                if(args_acl instanceof Built.ACL){
                    args_acl=args_acl.toJSON();
                }
                if(Built.Util.dataType(args_acl)!='object'){
                    try{args_acl=JSON.parse(args_acl)}catch(e){}
                }
                if(Built.Util.dataType(args_acl)=='object'){
                    acl=args_acl;
                }
            }
            /**@private*/
            this.__getAccess=function(accessor,accessType,UID){
                if(typeof accessor ==='undefined' ||
                    typeof accessType ==='undefined' ||
                    typeof UID ==='undefined'){return undefined}
                // eg: getAccess('users','update',hsdjgsyuserID);
                var acc=acl[accessor];
                if(typeof acc !=="object" && acc !== undefined){
                    return undefined;
                }
                for(var i=0,j=acc.length;i<j;i++){
                    if(acc[i].uid &&
                        acc[i].uid==UID &&
                        acc[i][accessType] &&
                        acc[i][accessType]==true){

                        return true;
                    }
                }
                return false;
            }
            /**@private*/
            this.__setAccess=function(accessor,accessType,UID,allowed){
                if(typeof accessor ==='undefined' ||
                    typeof accessType ==='undefined' ||
                    typeof UID ==='undefined'||
                    typeof allowed ==='undefined'){return}
                // eg: getAccess('users','update',hsdjgsyuserID,true);
                if(Built.Util.dataType(allowed)=='boolean' && UID){
                    var acc=acl[accessor];
                    if(typeof acc !=="object"){
                        acl[accessor]=[];
                        acc=acl[accessor];
                    }
                    for(var i=0,j=acc.length;i<j;i++){
                        if(acc[i].uid && acc[i].uid==UID){
                            acc[i][accessType]=allowed;
                            return;
                        }
                    }
                    var newPush={};
                    newPush.uid=UID;
                    newPush[accessType]=allowed;
                    acl[accessor].push(newPush);
                }
                return this;
            }
            /**@private*/
            this.__setOthers=function(type,allowed){
                if(Built.Util.dataType(allowed)=='boolean' && type){
                    if(typeof acl.others !=="object"){acl.others={}}
                    acl.others[type]=allowed;
                }
                return this;

            }
            /**@private*/
            this.__getOthers=function(type){
                if(typeof acl.others !=="object"){return false}
                return acl.others[type];
            }
            /**@private*/
            this.__setDisable=function(bool){
                if(typeof bool ==="boolean"){
                    acl['disable']=bool;

                }
                return this;
            }
            /**@private*/
            this.__isDisabled=function(){
                return acl['disable'] ;
            }
            /**@private*/
            this.__getd= function() {
                return Built.Util.clone(acl);
            }
        }

        Built.Util.extend(Built.ACL.prototype, /** @lends Built.ACL.prototype */{
            /**
             * get whether the others is allowed to read this object.
             * @instance
             * @return {Boolean} returns true if read access is granted to others. false otherwise.
             */
            getPublicReadAccess:function () {
                return this.__getOthers('read');
            },
            /**
             * get whether the others is allowed to write this object.
             * @instance
             * @return {Boolean} returns true if write access is granted to others. false otherwise.
             */
            getPublicWriteAccess:function () {
                return this.__getOthers('update');
            },
            /**
             * get whether the others is allowed to delete this object.
             * @instance
             * @return {Boolean} returns true if delete access is granted to others. false otherwise.
             */
            getPublicDeleteAccess:function () {
                return this.__getOthers('delete');
            },
            /**
             * get whether the given user id is explicitly allowed to read this object. Even if this returns false, the user may still be able to access it if getPublicReadAccess returns true or if the user belongs to a role that has access.
             * @param {String} userUid user uid for which to check read access.
             * @instance
             * @return {Boolean} returns true if read access is granted to others. false otherwise.
             */
            getUserReadAccess:function (userId) {
                return this.__getAccess('users','read',userId);
            },
            /**
             * get whether the given user id is explicitly allowed to write this object. Even if this returns false, the user may still be able to access it if getPublicWriteAccess returns true or if the user belongs to a role that has access.
             * @param {String} userUid user uid for which to check write access.
             * @instance
             * @return {Boolean} returns true if write access is granted to others. false otherwise.
             */
            getUserWriteAccess: function (userId) {
                return this.__getAccess('users','update',userId);
            },
            /**
             * get whether the given user id is explicitly allowed to delete this object. Even if this returns false, the user may still be able to access it if getPublicDeleteAccess returns true or if the user belongs to a role that has access.
             * @param {String} userUid user id for which to check delete access.
             * @instance
             * @return {Boolean} returns true if delete access is granted to others. false otherwise.
             */
            getUserDeleteAccess: function (userId) {
                return this.__getAccess('users','delete',userId);
            },
            /**
             * get whether the users with given role are explicitly allowed to read this object. Even if this returns false, the user may still be able to access it if getPublicReadAccess returns true or if the user belongs to a role that has access.
             * @param {String} roleUid role uid for which to check read access.
             * @instance
             * @return {Boolean} returns true if read access is granted to users with role. false otherwise.
             */
            getRoleReadAccess: function (roleId) {
                return this.__getAccess('roles','read',roleId);
            },
            /**
             * get whether the users with given role are explicitly allowed to write this object. Even if this returns false, the user may still be able to access it if getPublicWriteAccess returns true or if the user belongs to a role that has access.
             * @param {String} roleUid role uid for which to check write access.
             * @instance
             * @return {Boolean} returns true if write access is granted to users with role. false otherwise.
             */
            getRoleWriteAccess: function (roleId) {
                return this.__getAccess('roles','update',roleId);
            },
            /**
             * get whether the users with given role are explicitly allowed to delete this object. Even if this returns false, the user may still be able to access it if getPublicDeleteAccess returns true or if the user belongs to a role that has access.
             * @param {String} roleUid role uid for which to check delete access.
             * @instance
             * @return {Boolean} returns true if delete access is granted to users with role. false otherwise.
             */
            getRoleDeleteAccess: function (roleId) {
                return this.__getAccess('roles','delete',roleId);
            },
            /**
             * set whether the others is allowed to read this object.
             * @param {Boolean} allowed whether read access is allowed (true or false).
             * @instance
             * @return {Built.ACL} returns the same object for chaining
             */
            setPublicReadAccess:function (boolean) {
                if(Built.Util.dataType(boolean)=='boolean'){
                    this.__setOthers('read',boolean);
                }
                return this;
            },
            /**
             * set whether the others is allowed to write this object.
             * @param {Boolean} allowed whether write access is allowed (true or false).
             * @instance
             * @return {Built.ACL} returns the same object for chaining
             */
            setPublicWriteAccess:function (boolean) {
                if(Built.Util.dataType(boolean)=='boolean'){
                    this.__setOthers('update',boolean);
                }
                return this;
            },
            /**
             * set whether the others is allowed to delete this object.
             * @param {Boolean} allowed whether delete access is allowed (true or false).
             * @instance
             * @return {Built.ACL} returns the same object for chaining
             */
            setPublicDeleteAccess:function (boolean) {
                if(Built.Util.dataType(boolean)=='boolean'){
                    this.__setOthers('delete',boolean);

                }
                return this;
            },
            /**
             * set whether the given user id is allowed to read this object.
             * @param {String} userUid user id to assign access.
             * @param {Boolean} allowed whether read access is allowed (true or false).
             * @instance
             * @return {Built.ACL} returns the same object for chaining
             */
            setUserReadAccess: function (userId,allowed) {
                return this.__setAccess('users','read',userId,allowed);
            },
            /**
             * set whether the given user id is allowed to write this object.
             * @param {String} userUid user id to assign access.
             * @param {Boolean} allowed whether write access is allowed (true or false).
             * @instance
             * @return {Built.ACL} returns the same object for chaining
             */
            setUserWriteAccess: function (userId,allowed) {
                return this.__setAccess('users','update',userId,allowed);
            },
            /**
             * set whether the given user id is allowed to delete this object.
             * @param {String} userUid The user id to assign access.
             * @param {Boolean} allowed whether delete access is allowed (true or false).
             * @instance
             * @return {Built.ACL} returns the same object for chaining
             */
            setUserDeleteAccess: function (userId,allowed) {
                return this.__setAccess('users','delete',userId,allowed);
            },
            /**
             * set whether the given users with role_uid are allowed to delete this object.
             * @param {String} roleUid The role uid to assign access.
             * @param {Boolean} allowed whether access is allowed (true or false).
             * @instance
             * @return {Built.ACL} returns the same object for chaining
             */
            setRoleReadAccess: function (roleId,allowed) {
                return this.__setAccess('roles','read',roleId,allowed);
            },
            /**
             * set whether the given users with role_uid are allowed to write this object.
             * @param {String} roleUid The role uid to assign access.
             * @param {Boolean} allowed whether write access is allowed (true or false).
             * @instance
             * @return {Built.ACL} returns the same object for chaining
             */
            setRoleWriteAccess: function (roleId,allowed) {
                return this.__setAccess('roles','update',roleId,allowed);
            },
            /**
             * set whether the given users with role_uid are allowed to delete this object.
             * @param {String} roleUid The role uid to assign access.
             * @param {Boolean} allowed whether delete access is allowed (true or false).
             * @instance
             * @return {Built.ACL} returns the same object for chaining
             */
            setRoleDeleteAccess: function (roleId,allowed) {
                return this.__setAccess('roles','delete',roleId,allowed);
            },

            /**
             * disable ACL for an object.
             * @param {Boolean} [disabled=true] It is used to turn on/off ACL on the particular object.
             * @instance
             * @return {Built.ACL} returns the same object for chaining
             */
            disable:function(bool){
                return this.__setDisable(bool);
            },

            /**
             * check whether ACL is disabled or not.
             * @instance
             * @return {Boolean} Boolean value.
             */
            isDisabled:function(){
                return this.__isDisabled();
            },
            /**
             * get JSON representation of the ACL.
             * @instance
             * @return {Object} returns JSON.
             */
            toJSON: function(){
                return this.__getd();
            }
        });

    })(Built);

////////////////////////////////////////////////        Built.Query              ///////////////////////////////////////////////////
    (function (root) {
        var Built = root;
        /**
         * a class that defines a query that is used to query for Built.Object's.
         * @name Built.Query
         * @param {String} classUid initializes and returns a Built.Query instance for a class.
         * @return returns Built.Query object.
         * @class
         */
        Built.Query = function (className) {
            if (typeof className !== 'string') { 
                throw new Error("class uid required"); 
            }
            var class_uid = className;
            var __cache = _Cache;
            var self = this,
                _schema = false;
            var queryLine = {};
            var queryOr = [];
            var queryAnd = [];
            var queryString = null;
            var _model = true;
            var _head = Built.Util.clone(Headers);
            var userObj = {
                headers : {},
                info : {}
              };

            function _getHeaders(extraHeaders){
                if(extraHeaders){
                    return Built.Util.mix(Built.Util.mix(_head, userObj.headers), extraHeaders);                     
                }
                return Built.Util.mix(_head, userObj.headers);
            }

            function _setter(key, condition, value, operator) {
                if(operator){
                    if(typeof queryLine[operator] === 'undefined'){queryLine[operator]={}}
                    if(typeof queryLine[operator][key] === 'undefined'){queryLine[operator][key]={}}
                    queryLine[operator][key][condition]=value;
                }
                return this;
            }

            function _checkOrMake(obj,key){
                if(typeof obj=='object'){
                    if(typeof obj[key] !='object'){
                        obj[key]={};
                    }
                }
            }
            function _toQueryString(args) {
                if(args && args != null && typeof args =='object'){
                    queryString=args;
                    return queryString;
                }else{
                    if(typeof queryString ==='object' &&
                        queryString != null &&
                        queryString != undefined &&
                        queryString !=""){
                        return queryString;
                    }
                    return _mergeAndOr();
                }
            }
            function _mergeAndOr(){
                var originalQuery=queryLine['query'] || null;
                var newQuery=Built.Util.clone(queryLine);
                var triggerOne=false;
                if(queryOr.length>0){
                    newQuery['query']={};
                    for(var i=0;i<queryOr.length;i++){
                        if(typeof newQuery['query']['$or'] != "object"){
                            newQuery['query']['$or']=[];
                        }
                        if(typeof queryOr[i] !== "undefined" && typeof queryOr[i]['query'] =="object"){
                            newQuery['query']['$or'].push(queryOr[i]['query']);
                        }
                    }
                    if(originalQuery != null){
                        newQuery['query']=Built.Util.mix(newQuery['query'],originalQuery);
                    }
                }
                if(queryAnd.length>0){
                    if(queryOr.length<1){
                        newQuery['query']={};
                    }
                    for(var i=0;i<queryAnd.length;i++){
                        if(typeof newQuery['query']['$and'] != "object"){
                            newQuery['query']['$and']=[];
                        }
                        if(typeof queryAnd[i] !== "undefined" && typeof queryAnd[i]['query'] =="object"){
                            newQuery['query']['$and'].push(queryAnd[i]['query']);
                        }
                    }
                    if(originalQuery != null){
                        newQuery['query']=Built.Util.mix(newQuery['query'],originalQuery);
                    }
                }
                return newQuery;
            }
            /**@private*/
            this.__toObjectModel__ = function (objects, class_id) {
                class_id = class_id || class_uid;
                if (! class_id) {
                    throw new Error("class uid required");
                 }
                //var modelProto = Built.Object.extend(class_id),
                var collection = [], model;
                if (Built.Util.dataType(objects) == 'array') {
                    for (var i = 0, j = objects.length; i < j; i++) {
                        if (typeof objects[i] == 'object' && objects[i].uid && typeof objects[i].uid == 'string') {
                            collection[collection.length] = new Built.Object(class_id, objects[i], true);
                        }
                    }
                    return collection;
                } else if (Built.Util.dataType(objects) == 'object') {
                    if (typeof objects == 'object' && objects.uid && typeof objects.uid == 'string') {
                        model = new Built.Object(class_id, objects, true);
                        return model;
                    }
                }
                return null;
            }


            /**@private*/
            this.__toBackboneModel__=function(objects,class_id){
                class_id = class_id || class_uid;
                if (!class_id) { throw new Error("class uid required") }
                var isObj="object";
                if(Built.Util.dataType(objects)=="array"){
                    isObj="array";
                    if(objects.length==0){
                        return objects;
                    }
                }
                if(typeof Backbone !== "undefined" && Backbone.Model && Backbone.Collection){
                    var model=Backbone.Model.extend({
                        idAttribute:"uid",
                        initialize:function(attribs){
                        },
                        sync:function(type,obj,options){
                            if(arguments.length==2){
                                options=obj;
                                obj={};
                            }
                            options=options||{};
                            var builtModel=new Built.Object(class_uid, this.toJSON(), true);
                            builtModel.set(this.changed);
                            if(type=="read"){
                                return builtModel.fetch(options);
                            }else if(type=="create" || type=="update"){
                                return builtModel.save(options);
                            }else if(type=="delete"){
                                return builtModel.destroy(options);
                            }
                            return null;
                        }

                    });
                    if(isObj=="object"){
                        return new model(objects);
                    }else{
                        var collection = Backbone.Collection.extend({
                            model: model,
                            sync:function(type,obj,options){
                                if(arguments.length==2){
                                    options=obj;
                                    obj={};
                                }
                                options=options||{};
                                var builtModel=new Built.Object(class_uid, this.toJSON(), true);
                                builtModel.set(this.changed);
                                if(type=="read"){
                                    var query=new Built.Query(class_uid);
                                    return query.exec(options);
                                }
                                return null;
                            }
                        });
                        collection = new collection();
                        for (var i = 0, j = objects.length; i < j; i++) {
                            if (typeof objects[i] == 'object') {
                                collection.add(new model(objects[i]));
                            }
                        }
                        return collection;
                    }
                }else{
                    return this.__toObjectModel__(objects,class_uid);
                }

            }

            /**
             *
             * set user for this Built.Query.
             * @param {Object} builtUser pass Built.User object.
             * @name setUser
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Query} returns the same object for chaining
             */
             this.setUser = function(user){
                if(user && typeof(user.getHeaders) === 'function'){
                    userObj.headers = user.getHeaders();
                    userObj.info = user.getInfo();
                }
                return me;
             }

            /**
             * set required model type.
             * @param {Built.Object.ModelType} const helps to set the constant listed under Built.Object.ModelType. Default is set to Built.Object.ModelType.Native model type.
             * @memberOf Built.Query
             * @function
             * @instance
             * @deprecated
             * @name modelType
             * @return {Built.Query} returns the same object for chaining
             */
            this.modelType = function(args){
                _model=args;
                return this;
            }

            /**
             * set required model type.
             * @param {Built.Object.ModelType} const helps to set the constant listed under Built.Object.ModelType. Default is set to Built.Object.ModelType.Native model type.
             * @memberOf Built.Query
             * @function
             * @instance
             * @name setModelType
             * @return {Built.Query} returns the same object for chaining
             */
            this.setModelType = function(args){
                _model=args;
                return this;
            }


            /**
            * set cache policy.
            * @param {Built.Query.CachePolicy} const helps to set the constant listed under Built.Query.CachePolicy.
            * @example Built.Query#setCachePolicy(Built.Query.CachePolicy.ONLY_NETWORK);
            * @function
            * @memberof Built.Query
            * @instance
            * @name setCachePolicy
            * @return {Built.Query} returns the same object for chaining
            */
            this.setCachePolicy = function(policy){
                __cache=policy;
                return self;
            }


            /*private*/
            this.getClassUid = function () {
                return class_uid;
            }

            /**
             * set header for Built.Query
             * @name setHeader
             * @param {String} Name Header Name
             * @param {String} Value Header Value
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Query} returns the same object for chaining
             */
            this.setHeader = function(key,val){
                if(key && val && typeof key=="string" && typeof val=="string"){
                    _head[key]=val;
                }
                return this;
            }

            /** @private */
            this.addHeader = this.setHeader;

            /**
             * remove header from this Built.Query REST call.
             * @name removeHeader
             * @param {String} Name Header Name
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Query} returns the same object for chaining
             */
            this.removeHeader = function(key){
                if(key && typeof key === "string" && _head[key]){
                    delete _head[key] ;
                }
                return this;
            }


            /**
            * set master key for this Built.Query.
            * @param {String} masterKey master key.
            * @function
            * @instance
            * @name setMasterKey
            * @memberof Built.Query
            * @return {Built.Query} returns the same object for chaining
            */
            this.setMasterKey = function (key) {
                if(key && typeof key === "string" && key.length){
                    this.setHeader("master_key", key);  
                }
                return this;
            }

            /**
            * remove master key from this Built.Query.
            * @function
            * @instance
            * @name removeMastkerKey
            * @memberof Built.Query
            * @return {Built.Query} returns the same object for chaining
            */
            this.removeMastkerKey = function(){
                return this.removeHeader('master_key');
            }

            /**
             * execute a Query
             * @param {Object} [callback] object containing callbacks. eg: {onSuccess:function(data){}, onError: function(err){}}
             * @name exec
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Promise} returns Built.Promise
             */
            this.exec = function (options) {
                if (typeof class_uid != 'string') { throw new Error("class uid required") }
                options = options || {}
                var me = this,
                    option = {},
                    opt = options.query ||  _toQueryString();
                option.class_uid = options.class_uid || class_uid;
                var cacheStr = JSON.stringify(_getHeaders())+option.class_uid+JSON.stringify(opt);
                try { opt = JSON.parse(opt) } catch (e) { }
                //---------------------------------------------------
                var promise = buildPromise(options);
                options = promise.__options;
                promise.__preserve(true);
                var cacheResponse=function(){
                    var base_64=Base64.encode(cacheStr);
                    var res=Store.get(base_64);
                    var resp={type:"CACHE"};
                    if(res){
                        try{
                            res=JSON.parse(res);
                            if(_model==="BACKBONE"){
                                var obj=typeof res.objects!=='undefined'?
                                    res.objects:
                                    (typeof res.object !=='undefined')?
                                        res.object:res;
                                if(typeof options.onSuccess=='function'){
                                    var objs=me.__toBackboneModel__(obj,self.class_uid);
                                    for(var i in res){
                                       if(i!=="object" && i!=="objects"){
                                            objs[i]=res[i];
                                        }
                                    }
                                    options.onSuccess(objs,resp);
                                }

                            }else if(options.model===false || _model=="NONE"){
                                if(typeof options.onSuccess=='function'){
                                    options.onSuccess(res,resp);
                                }
                            }else{
                                var obj=((typeof res.objects!=='undefined')?
                                    res.objects:
                                    (typeof res.object !=='undefined')?
                                        res.object:[]);
                                if(typeof options.onSuccess=='function'){
                                    var objs=me.__toObjectModel__(obj,me.class_uid);
                                    for(var i in res){
                                        if(i!=="object" && i!=="objects"){
                                            objs[i]=res[i];
                                        }
                                    }
                                    options.onSuccess(objs,resp);
                                }
                            }
                            if(__cache=="only_cache" || __cache=="cache_else_network"){
                                return {
                                    _XHR:null,
                                    abort:function(){
                                    }
                                };
                            }
                        }catch(e){
                            if(typeof options.onError=='function'){
                                options.onError({error_message:"no cache found"},resp);
                            }
                        }
                    }else{
                        if(__cache =="cache_else_network" &&
                            typeof execute=="function"){
                            return execute();
                        }
                        else if(typeof options.onError=='function'){
                            options.onError({error_message:"no cache found"},resp);
                        }
                    }
                    if(__cache=="cache_then_network" &&
                        typeof execute==='function'){
                        return execute();
                    }
                }
                var cb = function (data, res) {
                    res=(res||{});
                    try { data = JSON.parse(data) } catch (e) { }
                    try { res['type']="NETWORK"} catch (e) { }
                    if (data && typeof data == 'object' && typeof data.objects !=="undefined") {
                        if(__cache != "only_network"){
                            Store.set(Base64.encode(cacheStr),JSON.stringify(data));
                        }
                        var obj=((typeof data.objects!=='undefined')?
                                    data.objects:
                                    (typeof data.object !=='undefined')?
                                        data.object:[]);
                        if (_model==="BACKBONE") {
                            if (typeof options.onSuccess == 'function') {
                                var objs=me.__toBackboneModel__(obj);
                                for(var i in data){
                                    if(i!=="object" && i!=="objects"){
                                        objs[i]=data[i];
                                    }
                                }
                                options.onSuccess(objs, res);
                            }
                        }else if (options.model === false || _model==="NONE") {
                            if (typeof options.onSuccess == 'function') {
                                options.onSuccess(data, res);
                            }
                        }else {
                            if (typeof options.onSuccess == 'function') {
                                var objs=me.__toObjectModel__(obj);
                                for(var i in data){
                                    if(i!=="object" && i!=="objects"){
                                        objs[i]=data[i];
                                    }
                                }
                                options.onSuccess(objs, res);
                            }
                        }
                    }else {
                        if (typeof options.onError == 'function') {
                            options.onError(data, res);
                        }
                    }
                }
                //------------------------------------------
                var execute=function(){
                    return REST.OBJECT.fetch(_getHeaders(), opt, cb, option);
                }

                //------------------------------------------
                if(__cache==="only_cache"){
                    var rets=cacheResponse();
                    promise._XHR=rets._XHR;
                    promise.abort=rets.abort;
                    return promise;
                }
                else if(__cache==="cache_else_network"){
                    var rets=cacheResponse();
                    promise._XHR=rets._XHR;
                    promise.abort=rets.abort;
                    return promise;
                }
                else if(__cache==="network_else_cache"){
                    var errorObj=options.onError;
                    /** @private */
                    options.onError=function(){
                        /** @private */
                        options.onError=errorObj;
                        return cacheResponse();
                    }
                    var rets=execute();
                    promise._XHR=rets._XHR;
                    promise.abort=rets.abort;
                    return promise;
                }
                else if(__cache==="cache_then_network"){
                    var rets=cacheResponse();
                    promise._XHR=rets._XHR;
                    promise.abort=rets.abort;
                    return promise;
                }
                else{
                    var rets=execute();
                    promise._XHR=rets._XHR;
                    promise.abort=rets.abort;
                    return promise;
                }
            }

            /**
             * perform query based on referred objects
             * @param {String} key the key of the referred object
             * @param {Built.Query} query the query to perform on the referred object
             * @name notInQuery
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Query} returns the same object for chaining
             */
            this.notInQuery= function (keys,matchObj) {
                if(keys && matchObj){
                    var _keys,_query={},_temp,_mkey,_val;
                    if(matchObj instanceof Built.Query &&
                        typeof matchObj.toJSON==='function'){
                        _val=matchObj.toJSON().query;
                    }else{
                        _val=matchObj;
                    }
                    if(keys.indexOf('>')>=0){
                        _keys=keys.split('>');
                        _mkey=_keys[0];
                        _count=keys.length-1;
                        for(var i=_keys.length;i>0;i--){
                            if(_keys[i-1] != ""){
                                _temp=_query;
                                _query={};
                                _query[_keys[i-1]]={'$nin_query':(i==_keys.length?_val:_temp)};
                            }
                        }
                    }else{
                        _query[keys]={'$nin_query':_val}
                    }
                    if(typeof queryLine['query'] != 'object'){queryLine['query']={}};
                    queryLine['query']=Built.Util.mix(queryLine['query'],_query);
                }
                return this;
            }

            /**
             * perform query based on referred objects
             * @param {String} key the key of the referred object
             * @param {Built.Query} query the query to perform on the referred object
             * @name inQuery
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Query} returns the same object for chaining
             */
            this.inQuery=function (keys,matchObj) {
                if(keys && matchObj){
                    var _keys,_query={},_temp,_mkey,_val;
                    if(matchObj instanceof Built.Query &&
                        typeof matchObj.toJSON==='function'){
                        _val=matchObj.toJSON().query;
                    }else{
                        _val=matchObj;
                    }
                    if(keys.indexOf('>')>=0){
                        _keys=keys.split('>');
                        _mkey=_keys[0];
                        _count=keys.length-1;
                        for(var i=_keys.length;i>0;i--){
                            if(_keys[i-1] != ""){
                                _temp=_query;
                                _query={};
                                _query[_keys[i-1]]={'$in_query':(i==_keys.length?_val:_temp)};
                            }
                        }
                    }else{
                        _query[keys]={'$in_query':_val}
                    }
                    if(typeof queryLine['query'] != 'object'){queryLine['query']={}};
                    queryLine['query']=Built.Util.mix(queryLine['query'],_query);
                }
                return this;
            }
            /**
             * include tags with which to search objects
             * @param {String|Array} tags array of tags with which to search objects.
             * @name tags
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Query} returns the same object for chaining
             */
            this.tags= function (){
                queryLine['tags']=queryLine['tags'] || [];
                for(i=0;i<arguments.length;i++){
                    if(typeof arguments[i]=='string'){
                        queryLine['tags']=queryLine['tags'].concat(arguments[i].split(/[\s,]+/));
                    }else if(Built.Util.dataType(arguments[i])=='array'){
                        queryLine['tags']=queryLine['tags'].concat(arguments[i]);
                    }
                }
                return this;
            }

            /**
             * add a constraint to the query that requires a particular key’s object to be equal to the provided object.
             * @param {String} key key to be constrained.
             * @param {String} Value the object that must be equalled.
             * @name where
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Query} returns the same object for chaining
             */
            this.where= function (key, value) {
                if(typeof queryLine['query']!='object'){queryLine['query']={}}
                queryLine['query'][key] = value;
                return this;
            }

            /**
             * the number of objects to skip before returning any.
             * @param {Number} number no of objects to skip from returned objects.
             * @name skip
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Query} returns the same object for chaining
             */
            this.skip= function (number) {
                if (Built.Util.dataType(number) == 'number' && parseInt(number) >= 0) {
                    queryLine['skip']=number;
                }
                return this;
            }
            /**
             * a limit on the number of objects to return.
             * @param {Number} number no of objects to limit.
             * @name limit
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Query} returns the same object for chaining
             */
            this.limit= function (number) {
                if (Built.Util.dataType(number) == 'number' && parseInt(number) > 0) {
                    queryLine['limit']=number;
                }
                return this;
            }
            /**
             * includes schemas of all returned objects alongwith objects themselves.
             * @name includeSchema
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Query} returns the same object for chaining
             */
            this.includeSchema= function () {
                queryLine['include_schema']=true;
                return this;
            }
            /**
             * gives object count alongwith objects returned in response.
             * @name includeCount
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Query} returns the query
             */
            this.includeCount= function () {
                queryLine['include_count']=true;
                return this;
            }
            /**
             * include the owner's profile in the objects' data.
             * When set to “true”, the returned objects will also contain a key “_owner”, which will include the owner’s profile in the objects' data.
             * @name includeOwner
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Query}  returns the same object for chaining
             */
            this.includeOwner= function () {
                queryLine['include_owner']=true;
                return this;
            }
            /**
             * returns objects before specified uid.
             * @param {String} uid uid before which objects should be returned.
             * @name beforeUid
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Query} returns the same object for chaining
             */
            this.beforeUid= function (UID) {
                if (Built.Util.dataType(UID) == 'string') {
                    queryLine['before_uid']=UID;
                }
                return this;
            }
            /**
             * returns objects after specified uid.
             * @param {String} uid uid after which objects should be returned.
             * @name afterUid
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Query} returns the same object for chaining
             */
            this.afterUid= function (UID) {
                if (Built.Util.dataType(UID) == 'string') {
                    queryLine['after_uid']=UID;
                }
                return this;
            }

            /**
             * include all unpublished objects of a class.
             * @name includeDrafts
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Query} returns the same object for chaining
             */
            this.includeDrafts= function () {
                queryLine['include_unpublished']=true;
                return this;
            }
            /**
             * use this method if you want only drafts to appear in the response of a query.
             * @name onlyDrafts
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Query} returns the same object for chaining
             */
            this.onlyDrafts= function () {
                this.includeDrafts();
                if(typeof queryLine['query'] !='object'){queryLine['query']={}}
                queryLine.query['published']=false;
                return this;
            }
            /**
             * add a constraint to the query that requires a particular key’s object to be not equal to the provided object.
             * @param {String} key key to be constrained
             * @param {String} value the value that must not be equalled.
             * @name notEqualTo
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Query} returns the same object for chaining
             */
            this.notEqualTo= function (key, value) {
                _setter(key, "$ne", value, 'query');
                return this;
            }
            /**
             * add a constraint to the query that requires a particular key’s object to be less than the provided object.
             * @param {String} key key to be constrained.
             * @param {Number} value the value that must be equalled.
             * @name lessThan
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Query} returns the same object for chaining
             */
            this.lessThan= function (key, value) {
                _setter(key, "$lt", value, 'query');
                return this;
            }
            /**
             * add a constraint to the query that requires a particular key’s object to be greater than the provided object.
             * @param {String} key key to be constrained.
             * @param {Number} value the value that must be equalled.
             * @name greaterThan
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Query} returns the same object for chaining
             */
            this.greaterThan= function (key, value) {
                _setter(key, "$gt", value, 'query');
                return this;
            }
            /**
             * add a constraint to the query that requires a particular key’s object to be less than or equal to the provided object.
             * @param {String} key key to be constrained.
             * @param {Number} value the value that must be equalled.
             * @name lessThanOrEqualTo
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Query} returns the same object for chaining
             */
            this.lessThanOrEqualTo= function (key, value) {
                _setter(key, "$lte", value, 'query');
                return this;
            }
            /**
             * add a constraint to the query that requires a particular key’s object to be greater than or equal to the provided object.
             * @param {String} key key to be constrained.
             * @param {Number} value the value that must be equalled..
             * @name greaterThanOrEqualTo
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Query} returns the same object for chaining
             */
            this.greaterThanOrEqualTo= function (key, value) {
                _setter(key, "$gte", value, 'query');
                return this;
            }
            /**
             * add a constraint to the query that requires a particular key’s object not be contained in the provided array.
             * @param {String} key key to be constrained.
             * @param {Array} array the possible values for the key’s object.
             * @name containedIn
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Query} returns the same object for chaining
             */
            this.containedIn= function (key, values) {
                if(typeof values !="object"){values=[values]}
                _setter(key, "$in", values, 'query');
                return this;
            }
            /**
             * add a constraint to the query that requires a particular key’s object not be contained in the provided array.
             * @param {String} key key to be constrained.
             * @param {Array} array list of values the key’s object should not be.
             * @name notContainedIn
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Query} returns the same object for chaining
             */
            this.notContainedIn= function (key, values) {
                if(typeof values !="object"){values=[values]}
                _setter(key, "$nin", values, 'query');
                return this;
            }
            /**
             * add a constraint that requires a particular key exists.
             * @param {String} key key to be constrained.
             * @name exists
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Query} returns the same object for chaining
             */
            this.exists= function (key) {
                _setter(key, "$exists", true, 'query');
                return this;
            }
            /**
             * add a constraint that requires a key not exist.
             * @param {String} key key to be constrained.
             * @name doesNotExist
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Query} returns the same object for chaining
             */
            this.doesNotExist= function (key) {
                _setter(key, "$exists", false, 'query');
                return this;
            }
            /**
             * add a regular expression constraint for finding string values that match the provided regular expression. This may be slow for large datasets.
             * @param {String} key key to be constrained
             * @param {String} regex regular expression pattern to match.
             * @param {String} [modifier] any of the following supported Regex modifiers, like "i" for case-insensitive search.
             * @name matches
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Query} returns the same object for chaining
             */
            this.matches= function (key, regex, modifiers) {
                if(typeof queryLine['query'] === 'undefined'){queryLine['query']={}}
                if(typeof queryLine['query'][key] === 'undefined'){queryLine['query'][key]={}}
                queryLine['query'][key]['$regex']=regex;
                if(modifiers){queryLine['query'][key]['$options']=modifiers}
                return this;
            }
            /**
             * include reference objects with given key in response
             * The include parameter accepts the name of a reference field. By default, no reference field is bought along with the object, only the uids are. To include any reference, this parameter must be used. Nested references can be bought by “.” separating the references. This will work for references which are nested inside groups or references which are nested inside other references.
             * @param {String} key Array of reference keys to include in response.
             * @name include
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Query} returns the same object for chaining
             */
            this.include= function (key) {
                if(Built.Util.dataType(queryLine['include']) !='array'){
                    queryLine['include']=[];
                }
                if (Built.Util.dataType(key) == 'array') {
                    for (var i = 0, j = key.length; i < j; i++) {
                        queryLine['include'].push(key[i]);

                    }
                } else {
                    queryLine['include'].push(key);
                }
                return this;
            }
            /**
             * specifies an array of ‘only’ keys in object that would be included in the response.
             * @param {String|Array} fieldUids list of the 'only' fieldUid's to be included in response.
             * @param {String} [referenceUid] if the keys listed in the first param are from the reference class then specify the referecne field uid of the BASE class.
             * @name only
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Query} returns the same object for chaining
             */
            this.only= function (key, referenceUID) {
                if(typeof queryLine['only'] !=='object'){queryLine['only']={}}
                if (typeof referenceUID ==='string') {
                    if(typeof queryLine['only'][referenceUID] !=='object'){queryLine['only'][referenceUID]=[]}
                    if(Built.Util.dataType(key)=='array'){
                        queryLine['only'][referenceUID]=queryLine['only'][referenceUID].concat(key) ;
                    }else{
                        queryLine['only'][referenceUID].push(key);
                    }
                } else {
                    if (typeof queryLine['only']['BASE'] !=='object') { queryLine['only']['BASE'] = [] }
                    if(Built.Util.dataType(key)=='array'){
                        queryLine['only']['BASE']=queryLine['only']['BASE'].concat(key) ;
                    }else{
                        queryLine['only']['BASE'].push(key);
                    }
                }
                return this;
            }
            /**
             * specifies an array of keys that would be 'excluded' from the response.
             * @param {Array|String} fieldUid list of the 'only' keys or single key string to be 'excluded' from the response.
             * @param {String} referenceUid if the keys listed in the first param are from the reference class then specify the referecne field uid of the BASE class.
             * @name except
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Query} returns the same object for chaining
             */
            this.except= function (key, referenceUID) {
                if(typeof queryLine['except'] !=='object'){queryLine['except']={}}
                if (typeof referenceUID ==='string') {
                    if(typeof queryLine['except'][referenceUID] !=='object'){queryLine['except'][referenceUID]=[]}
                    if(Built.Util.dataType(key)=='array'){
                        queryLine['except'][referenceUID]=queryLine['except'][referenceUID].concat(key) ;
                    }else{
                        queryLine['except'][referenceUID].push(key);
                    }
                }else {
                    if(typeof queryLine['except']['BASE'] !=='object'){queryLine['except']['BASE']=[]}
                    if(Built.Util.dataType(key)=='array'){
                        queryLine['except']['BASE']=queryLine['except']['BASE'].concat(key) ;
                    }else{
                        queryLine['except']['BASE'].push(key);
                    }
                }
                return this;

            }
            /**
             * include custom query in key value string
             * @param {String} Key query name to include.
             * @param {String|Object} Value query value to include.
             * @name addQuery
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Query} returns the query
             */
            this.addQuery= function (key, val) {
                if (typeof key == 'string' && val) {
                    queryLine[key]=val;
                }
                return this;
            }

            /** @private */
            this.includeFilter = this.addQuery;

            /**
             * sort the results in ascending order with the given key.
             * @param {String} key key to order by.
             * @name ascending
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Query} returns the same object for chaining
             */
            this.ascending= function (key) {
                if (typeof key == 'string') {
                    queryLine['asc']=key;
                }
                return this;
            }
            /**
             * sort the results in descending order with the given key.
             * @param {String} key key to order by.
             * @name descending
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Query} returns the same object for chaining
             */
            this.descending= function (key) {
                if (typeof key == 'string') {
                    queryLine['desc']=key;
                }
                return this;
            }
            /**
             * accepts an array of queries, and ANDs them.
             * @param {Built.Query} BuiltQuery BuiltQuery to apply AND on.
             * @param {Built.Query} [nthBuiltQuery] nth BuiltQuery to apply AND on.
             * @name and
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Query} returns the same object for chaining
             */
            this.and=function(BuiltQuery){
                for(var i=0,j=arguments.length;i<j;i++){
                    if(arguments[i] instanceof Built.Query &&
                        typeof arguments[i]['toJSON'] ==='function'){
                        queryAnd.push(arguments[i]['toJSON']());
                    }
                }
                return this;
            }
            /**
             * accepts an array of queries, and ORs them.
             * @param {Built.Query} BuiltQuery BuiltQuery to apply OR on.
             * @param {Built.Query} [nthBuiltQuery] nth BuiltQuery to apply OR on.
             * @name or
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Query} returns the same object for chaining
             */
            this.or=function (BuiltQuery) {
                for(var i=0,j=arguments.length;i<j;i++){
                    if(arguments[i] instanceof Built.Query &&
                        typeof arguments[i]['toJSON'] ==='function'){
                        queryOr.push(arguments[i]['toJSON']());
                    }

                }
                return this;
            }
            /**
             * add a constraint to the query that requires a particular key’s object to be equal to the provided object.
             * @param {String} Key The key to be constrained.
             * @param {Built.Query} selectQuery The select query to be performed on another class.
             * @param {String} pickedKey the key for which the values should be returned after the select query is performed
             * @name select
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Query} returns the same object for chaining
             */
            this.select= function (key,queryObj,pickKey) {
                if(queryObj instanceof Built.Query &&
                    typeof queryObj['toJSON'] ==='function' &&
                    queryObj.getClassUid() !="" &&
                    queryObj.getClassUid() !=="undefined" &&
                    typeof pickKey==='string' &&
                    pickKey !=""){
                    if(typeof queryLine['query']!='object'){queryLine['query']={}}
                    queryLine['query'][key] = {
                        "$select":{
                            "query":queryObj.toJSON().query,
                            "class_uid":queryObj.getClassUid(),
                            "key":pickKey
                        }
                    };
                }else{
                    throw new Error("incorrect parameter");
                }
                return this;
            }
            /**
             * add a constraint to the query that requires a particular key’s object to be equal to the provided object.
             * @param {String} Key The key to be constrained.
             * @param {Built.Query} dontSelectQuery The dont_select query to be performed on another class. This is the inverse of the select query. Returns all the objects that do not match the conditions.
             * @param {String} pickedKey the key for which the values should be returned after the dont_select query is performed
             * @name dontSelect
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Query} returns the same object for chaining
             */
            this.dontSelect= function (key, queryObj,pickKey) {
                if(queryObj instanceof Built.Query &&
                    typeof queryObj['toJSON'] ==='function' &&
                    queryObj.getClassUid() !="" &&
                    queryObj.getClassUid() !=="undefined" &&
                    typeof pickKey==='string' &&
                    pickKey !="" ){
                    if(typeof queryLine['query']!='object'){queryLine['query']={}}
                    queryLine['query'][key] = {
                        "$dont_select":{
                            "query":queryObj.toJSON().query,
                            "class_uid":queryObj.getClassUid(),
                            "key":pickKey
                        }
                    };
                }else{
                    throw new Error("incorrect parameter");
                }
                return this;
            }
            /**
             * fetch objects that are near a specified location within a given radius
             * @param {Built.Location|String} location/objectUid the location near which you wish to query. Location can be an object of Built.Location or an object uid. In the latter case, it will use the object’s location.
             * @param {Number} [radius=1000] the radius within which you wish to query
             * @name nearLocation
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Query} returns the same object for chaining
             */
            this.nearLocation= function(Location_ObjectUid, radius) {
                radius=radius||1000;
                _checkOrMake(queryLine,'query');
                if(Location_ObjectUid instanceof Built.Location && typeof radius=='number'){
                    var point =Location_ObjectUid.toJSON();
                    queryLine['query']['$near']={
                        'coords': [point.longitude,point.latitude],
                        'radius': radius
                    }
                }else if(typeof Location_ObjectUid == 'string' && typeof radius=='number'){
                    queryLine['query']['$near']={
                        'coords': [point.longitude,point.latitude],
                        'radius': radius
                    }
                }else{
                    throw new Error("invalid parameter");
                }
                return this;
            }
            /**
             * fetch objects that are within specified locations.
             * @param {Array} location/objectUid an array of locations. Locations can have objects of Built.Location or object uids. If object uid is passed, the location of that object will be used. At least three locations need to be passed so that the search area is a polygon.
             * @name withinLocation
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Query} returns the same object for chaining
             */
            this.withinLocation= function(points) {
                _checkOrMake(queryLine,'query');
                if(Built.Util.dataType(points)=='array'){
                    if(points.length<3){
                        throw new Error("minimum 3 locations or objectUid required");
                    }
                    var withInCollection=[];
                    for(var i =0;i<points.length;i++){
                        if(points[i] instanceof Built.Location){
                            var point =points[i].toJSON();
                            withInCollection.push([point.longitude,point.latitude])
                        }else if(typeof points[i] == 'string'){
                            withInCollection.push({"object": points[i]})
                        }else{
                            throw new Error("invalid parameter, " + point[i]);
                        }
                    }
                    queryLine['query']['$within']=withInCollection;
                }
                return this;
            }
            /**
             * get or set JSON representation of Query
             * @param {Object} set Query JSON.
             * @name toJSON
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Object} returns the query JSON.
             */
            this.toJSON=function(args){
                return _toQueryString(args);
            }
            /**
             * gives only the count of objects returned in response.
             * @param {Object} [callback] object containing callbacks. eg: {onSuccess:function(data){}, onError: function(err){}}
             * @name count
             * @memberOf Built.Query
             * @function
             * @instance
             * @return {Built.Promise} returns Built.Promise
             */
            this.count= function (callback) {
                callback = callback || {};
                var promise=buildPromise(callback);
                callback=promise.__options;
                if (typeof class_uid == 'string' && class_uid.length > 0) {
                    var headers,
                        me = this,
                        option = {};
                    var cb = function (data, res) {
                        try { data = JSON.parse(data) } catch (e) {}
                        if (data && typeof data == 'object' && typeof data.objects !== "undefined") {
                            if (typeof callback.onSuccess == 'function') {
                                callback.onSuccess(data.objects, res);
                            }
                        } else {
                            if (typeof callback.onError == 'function') {
                                callback.onError(data, res);
                            }
                        }
                    }
                    option.class_uid = class_uid;
                    var d = opt = _toQueryString() || {};
                    d.count = true;
                    var rets=REST.OBJECT.fetch(_getHeaders(), d, cb, option);
                    promise._XHR=rets._XHR;
                    promise.abort=rets.abort;
                    return promise;
                } else {
                    if (typeof callback == 'object' && typeof callback.onError == 'function') { callback.onError({ error_message: 'incomplete parameters' }) }
                    throw new Error("incomplete parameter");
                }
                return this;
            }
        }

        /**
        * set global cache policy.
        * @param {Built.Query.CachePolicy} const helps to set the constant listed under Built.Query.CachePolicy.
        * @example Built.Query.setCachePolicy(Built.Query.CachePolicy.ONLY_NETWORK);
        * @static
        * @function
        * @memberof Built.Query
        * @return {Built} returns the same object for chaining
        */
        Built.Query.setCachePolicy=function(policy){
            _Cache=policy;
            return Built;
        }

        /**
        * @memberof Built.Query
        * @readonly
        * @enum {string}
        */
        Built.Query.CachePolicy={
            /**  set the cache policy to get data from cache only. */
            ONLY_CACHE:"only_cache",

            /**  set the cache policy to get data from network only. */
            ONLY_NETWORK:"only_network",

            /**  set the cache policy to get data from cache else network. */
            CACHE_ELSE_NETWORK:"cache_else_network",

            /**  set the cache policy to get data from network else cache. */
            NETWORK_ELSE_CACHE:"network_else_cache",

            /**  set the cache policy to get data from cache then network. */
            CACHE_THEN_NETWORK:"cache_then_network"
        };

    })(Built);

////////////////////////////////////////////////        Built.Location           ///////////////////////////////////////////////////
    (function(root){
        var Built = root;
        /**
         * Get new instance of Built.Location.
         * Location class for creating a location object that can be used to set location on objects using setLocation(longitude, latitude) method.<br /> Also, you can query objects on the basis of their geo locations where Built.Location is required to specify a location parameter.<br />
         * @name Built.Location
         * @param {Float} longitude longitude of the location in degrees
         * @param {Float} latitude latitude of the location in degrees
         * @example
         * var myLoc= new Built.Location(longitude, latitude);  // OR
         * var myLoc= new Built.Location({longitude: value, latitude: value});  //OR
         * var myLoc= new Built.Location([longitude, latitude]);
         * @return returns Built.Location object instance.
         * @class
         */

        Built.Location=function (args) {
            var _point={
                longitude:0,
                latitude:0
            }

            var _validate = function(longitude, latitude) {
                if(typeof longitude!='number' || typeof latitude !='number'){
                    throw new Error("invalid data type");
                }
                if (latitude < -90.0 || latitude > 90.0) {
                    throw new Error("invalid value for latitude: " + latitude);
                }
                if (longitude < -180.0 ||longitude > 180.0) {
                    throw new Error("invalid value for longitude: " +longitude );
                }
            }

            if(Built.Util.dataType(args)=='object'){
                if(args.longitude && args.longitude){
                    _validate(args.longitude,args.longitude);
                    _point.longitude=args.longitude;
                    _point.latitude=args.latitude;
                }
            }else if(Built.Util.dataType(args)=='array'){
                if(args.length>=2){
                    _validate(args[0],args[1]);
                    _point.longitude=args[0];
                    _point.latitude=args[1]
                }
            }else if(arguments.length>=2){
                _validate(arguments[0],arguments[1]);
                _point.longitude=arguments[0];
                _point.latitude=arguments[1];
            }
            /**@private*/
            this.getRadians= function (newPoint) {
                if(newPoint instanceof Built.Location){
                    var np=newPoint.toJSON();
                    var onePI = (Math.PI / 180.0),
                        _latRad = (_point.latitude * onePI),
                        _longRad = (_point.longitude * onePI),
                        latRad = (np.latitude * onePI),
                        longRad = (np.longitude * onePI),
                        dLat = (_latRad - latRad),
                        dLong = (_longRad - longRad),
                        sinDLatBy2 = Math.sin(dLat / 2),
                        sinDLongBy2 = Math.sin(dLong / 2);
                    var a = (
                        (sinDLatBy2 * sinDLatBy2) +
                            (Math.cos(_latRad) * Math.cos(latRad) *
                                sinDLongBy2 *
                                sinDLongBy2)
                        );
                    a = Math.min(1.0, a);
                    return 2 * Math.asin(Math.sqrt(a));
                }else{
                    throw new Error("Built.Location object required");
                }

            }

            /**
             * set location.
             * @param {Float} longitude longitude of the location in degrees
             * @param {Float} latitude latitude of the location in degrees
             * @name setLocation
             * @memberOf Built.Location
             * @function
             * @instance
             * @return {Built.Location} returns the same object for chaining
             */
            this.setLocation= function(lng,lat) {
                if(typeof lng =='number' && typeof lat=='number'){
                    _validate(lng,lat);
                    _point.longitude=lng;
                    _point.latitude=lat;
                }
                return this;
            }

            /**
             * returns the distance from this location to another in kilometers.
             * @param {Built.Location} location instance of Built.Location.
             * @name kilometersFrom
             * @memberOf Built.Location
             * @function
             * @instance
             * @return {Number}
             */
            this.kilometersFrom= function(point) {
                return this.getRadians(point) * 6371.0;
            },

            /**
             * returns the distance from this location to another in miles.
             * @param {Built.Location} location instance of Built.Location.
             * @name milesFrom
             * @memberOf Built.Location
             * @function
             * @instance
             * @return {Number}
             */
             this.milesFrom= function(point) {
                return this.getRadians(point) * 3958.8;
             }

            /**
             * returns JSON representation of Location.
             * @name toJSON
             * @memberOf Built.Location
             * @function
             * @instance
             * @return {Object} returns JSON
             */
            this.toJSON= function() {
                return {
                    longitude:_point.longitude,
                    latitude:_point.latitude
                }
            }


        }
        /**
         * returns the device Current location (if device supports HTML5 GeoLocation).
         * @param {Object} [callback] object containing callbacks. eg: {onSuccess:function(data){}, onError: function(err){}}
         * @static
         * @memberof Built.Location
         * @return {Built.Promise} returns Built.Promise
         */
        Built.Location.getCurrentLocation =function(callback){
            callback=callback||{};
            var promise=buildPromise(callback);
            callback=promise.__options;
            if(typeof navigator!=='undefined' && typeof navigator.geolocation !=='undefined'){
                navigator.geolocation.getCurrentPosition(function(location) {
                        if(typeof callback.onSuccess=='function'){
                            callback.onSuccess(
                                new Built.Location({
                                    latitude: location.coords.latitude,
                                    longitude: location.coords.longitude
                                })
                            );
                        }
                    },
                    function(error) {
                        if(typeof callback.onError=='function'){
                            callback.onError({
                                error_message:error.message,
                                code:error.code,
                                object:error
                            });
                        }
                    });
            }else{
                if(typeof callback.onError=='function'){
                    callback.onError({error_message:"Geo functionality is not supported by the platform"})
                }
            }
            return promise;
        }

    })(Built);

////////////////////////////////////////////////        Built.Role               ///////////////////////////////////////////////////
    (function(root){
        var Built = root;
        /**
        * Get new instance of Built.Role
        * @class
        * @memberof Built
        * @name Built.Role
        * @see Built.Object
        * @mixes Built.Object
        * @return {Built.Role} returns Built.Role instance.
        */
        Built.Role={
            class_uid:'built_io_application_user_role',

            /**
             * set name of role
             * @param {String} RoleName role name.
             * @name setName
             * @memberOf Built.Role
             * @function
             * @instance
             * @return {Built.Role} returns the same object for chaining
             */
             setName:function(name){
                if(typeof name=="string" && name!=""){
                    return this.set('name',name);
                }
                return this;
             },

             /**
             * get name of role
             * @name getName
             * @memberOf Built.Role
             * @function
             * @instance
             * @return {String} RoleName
             */
             getName:function(){
                return this.get('name');
             },

             /**
             * set uid of role
             * @param {String} RoleUid role name.
             * @name setRoleUid
             * @memberOf Built.Role
             * @function
             * @instance
             * @return {Built.Role} returns the same object for chaining
             */
             setRoleUid:function(uid){
                if(typeof uid=="string" && uid!=""){
                    return this.set('uid',uid);
                }
                return this;
             },

             /**
             * get uid of role
             * @name getRoleUid
             * @memberOf Built.Role
             * @function
             * @instance
             * @return {String} RoleUid
             */
             getRoleUid:function(uid){
                return this.get('uid');
             },

            /**
             * adds a user to a Built.Role object
             * @param {String} userUid User’s uid that needs to be added to role.
             * @name addUser
             * @memberOf Built.Role
             * @function
             * @instance
             * @return {Built.Role} returns the same object for chaining
             */
            addUser:function(user_uid){
                var uid;
                if(typeof user_uid=='object' && typeof user_uid.uid=="string"){
                    uid=user_uid.uid;
                }else if(typeof user_uid=='string'){
                    uid=user_uid;
                }
                if(uid){
                    var users=(this.get('users')||[]);
                    for(var i=0;i<users.length;i++){
                        if(uid == users[i]){
                            return this;
                        }
                    }
                    users.push(uid);
                    this.set('users',users);
                }
                return this;
            },

            /**
             * removes a user from Built.Role object
             * @param {String} userUid removes a user from a role
             * @name removeUser
             * @memberOf Built.Role
             * @function
             * @instance
             * @return {Built.Role} returns the same object for chaining
             */
            removeUser:function(user){
                var uid;
                if(typeof user=='object'){
                    if(user.uid){
                        uid=user.uid;
                    }
                }else if(typeof user=='string'){
                    uid=user;
                }
                if(uid){
                    var users=(this.get('users')||[]);
                    for(var i=0;i<users.length;i++){
                        if(uid == users[i]){
                            users.splice(i,1);
                            this.set('users',users);
                        }
                    }
                }
                return this;
            },

            /**
             * adds a subrole to current Built.Role object.
             * @param {String} roleUid Role uid that has to be added as a subrole.
             * @name addRole
             * @memberOf Built.Role
             * @function
             * @instance
             * @return {Built.Role} returns the same object for chaining
             */
            addRole:function(role_uid){
                var uid;
                if(typeof role_uid=='object' && typeof role_uid.uid=="string"){
                    uid=role_uid.uid;
                }else if(typeof role_uid=='string'){
                    uid=role_uid;
                }
                if(uid){
                    var roles=(this.get('roles')||[]);
                    for(var i=0;i<roles.length;i++){
                        if(uid == roles[i]){
                            return this;
                        }
                    }
                    roles.push(uid);
                    this.set('roles',roles);
                }
                return this;
            },

            /**
             * removes a subrole from current Built.Role object if it exists.
             * @param {String} roleUid Role uid that has to be added as a subrole.
             * @name removeRole
             * @memberOf Built.Role
             * @function
             * @instance
             * @return {Built.Role} returns the same object for chaining
             */
            removeRole:function(role_uid){
                var uid;
                if(typeof role_uid=='object' && typeof role_uid.uid =="string"){
                    uid=role_uid.uid;
                }else if(typeof user=='string'){
                    uid=role_uid;
                }
                if(uid){
                    var roles=(this.get('roles')||[]);
                    for(var i=0;i<roles.length;i++){
                        if(uid == roles[i]){
                            roles.splice(i,1);
                            this.set('roles',roles);
                        }
                    }
                }
                return this;
            },

            /**
             * checks whether a user with user uid exists in Built.Role.
             * @param {String} userUid User uid to check for existence in role.
             * @name hasUser
             * @memberOf Built.Role
             * @function
             * @instance
             * @return {Boolean} returns whether the user in role exists or not.
             */
            hasUser:function(user_uid){
                if(user_uid){
                    var users=(this.get('users')||[]);
                    if(users.indexOf(user_uid)>=0){
                        return true;
                    }
                }
                return false;
            },

            /**
             * checks whether a role with specified uid exists in Built.Role.
             * @param {String} roleUid Role uid of a sub role to check for existence in role.
             * @name hasRole
             * @memberOf Built.Role
             * @function
             * @instance
             * @return {Boolean} returns whether the role exists or not.
             */
            hasRole:function(role_uid){
                if(role_uid){
                    var roles=(this.get('roles')||[]);
                    if(roles.indexOf(role_uid)>=0){
                        return true;
                    }
                }
                return false;
            },

            /**
             * get the users contained in a role.
             * @name getUsers
             * @memberOf Built.Role
             * @function
             * @instance
             * @return {Array} Array of users of RoleObject.
             */
            getUsers:function(){
                return (this.get('users')||[]);
            },

            /**
             * get the subroles contained in a role. Subroles are a subset of Built.Role object.
             * @name getRoles
             * @memberOf Built.Role
             * @function
             * @instance
             * @return {Array} Array of Sub roles of RoleObject.
             */
            getRoles:function(){
                return (this.get('roles')||[]);
            }

        }
        Built.Role=extend.call(Built.Object, Built.Role);

        /**
         * get Built.Query object for application role's class
         * @example
         * var roles=Built.Role.getRoleQuery();
         * roles.where('name','admin')
         * .exec()
         * .success(function(rolesArray, responseObject){
         *    //callback logic
         * });
         * @memberOf Built.Role
         * @function
         * @name Built.Role.getRoleQuery
         * @static
         * @return {Built.Query} returns Built.Query to get application role's object.
         */
        Built.Role.getRoleQuery=function(){
            return (new Built.Query('built_io_application_user_role'));
        }

    })(Built);

////////////////////////////////////////////////        Built.Promise            //////////////////////////////////////////////////
    (function(root){
        var Built = root;
        /**
         * create new instance of Built.Promise.
         * @name Built.Promise
         * @return Built.Promise object instance.
         * @class
         */
        Built.Promise=function(){
            var doneCb=[],
                failCb=[],
                alwaysCb=[],
                isFail=false,
                isDone=false,
                args=[],
                funcReturn,
                preserveCallback=false,
                isErrorReturned=false;

            /** add success callbacks
             * @param {Function} Callback function.
             * @param {Object} [Context] context for callbacks (optional).
             * @name success
             * @memberOf Built.Promise
             * @function
             * @instance
             * @return {Built.Promise} returns the same object for chaining
             */
            this.success=function(callback,context){
                if(typeof callback=='function'){

                    context=context||this;
                    if(isDone){
                        funcReturn=callback.apply(context,args);
                        doneCb=[];
                    }
                    doneCb.push({
                        callback:callback,
                        context:context
                    });
                }

                return this;
            }
            /** add error callbacks
             * @param {Function} Callback function.
             * @param {Object} [Context] context for callbacks (optional).
             * @name error
             * @memberOf Built.Promise
             * @function
             * @instance
             * @return {Built.Promise} returns the same object for chaining
             */
            this.error=function(callback,context){

                if(typeof callback=='function'){
                    context=context||this;
                    if(isFail){
                        funcReturn= callback.apply(context,args);
                        failCb=[];
                    };
                    failCb.push({
                        callback:callback,
                        context:context
                    });
                }
                return this;
            }


            /** add always callbacks
             * @param {Function} Callback function.
             * @param {Object} [Context] context for callbacks (optional).
             * @name always
             * @memberOf Built.Promise
             * @function
             * @instance
             * @return {Built.Promise} returns the same object for chaining
             */
            this.always=function(callback,context){
                if(typeof callback=='function'){
                    context=context||this;
                    if(isFail || isDone){
                        callback.apply(context,args);
                        alwaysCb=[];
                    }
                    alwaysCb.push({
                        callback:callback,
                        context:context
                    });
                }
                return this;
            }
            /** resolve promise
             * @param {Object|String|Number} Arguments for success Callback function.
             * @name resolve
             * @memberOf Built.Promise
             * @function
             * @instance
             * @return {Built.Promise} returns the same object for chaining
             */
            this.resolve=function(){
                if((isDone || isFail) &&  preserveCallback===false){return this;}
                isDone=true;
                args=Array.prototype.slice.call(arguments);
                for(var i =0,j=doneCb.length;i<j;i++){
                    var item=doneCb[i];
                    if(item){
                        try{
                            funcReturn= item.callback.apply(item.context,args);
                        }catch(e){
                            isErrorReturned=true;
                            funcReturn=e;
                        }
                    }
                }
                if(!preserveCallback){
                    doneCb=[];
                }

                _callAlways();
                return this;
            }

            /** reject promise
             * @param {Object|String|Number} Arguments for error Callbacks function.
             * @name reject
             * @memberOf Built.Promise
             * @function
             * @instance
             * @return {Built.Promise} returns the same object for chaining
             */
            this.reject=function(){
                if((isFail || isDone) && preserveCallback===false){return this;}
                isFail=true;
                args=Array.prototype.slice.call(arguments);
                for(var i =0,j=failCb.length;i<j;i++){
                    var item=failCb[i];
                    if(item){
                        try{
                            funcReturn= item.callback.apply(item.context,args);
                        }catch(e){
                            isErrorReturned = true;
                            funcReturn = e;
                        }
                    }
                }
                if(!preserveCallback){
                    failCb=[];
                }
                _callAlways();

                return this;
            }

            /** check whether promise is fulfilled or not.
             * @name isFulfilled
             * @memberOf Built.Promise
             * @function
             * @instance
             * @return {Boolean} whether promise is fulfilled or not.
             */
            this.isFulfilled=function(){
                return(isDone || isFail);
            }

            /**
             * adds callbacks to be called when this Built.Promise is fulfilled. Returns a new Built.Promise that will be fulfilled when the callback is complete. It allows chaining. If the callback itself returns a Built.Promise, then the one returned by "then" will not be fulfilled until that one returned by the callback is fulfilled.
             * @param {Function} successCallback function that is called when this Promise is resolved. Once the callback is complete, then the Promise returned by "then" will also be fulfilled.
             * @param {Function} errorCallback function that is called when this Promise is rejected with an error. Once the callback is complete, then the Promise returned by "then" with be resolved successfully. If errorCallback is null, or it returns a rejected Promise, then the Promise returned by "then" will be rejected with that error.
             * @name then
             * @function
             * @memberOf Built.Promise
             * @instance
             * @return {Built.Promise} A new Promise that will be fulfilled after this Promise is fulfilled and either callback has completed. If the callback returned a Promise, then this Promise will not be fulfilled until that one is fulfilled.
             */
            this.then=function(resolvedCb, rejectedCb) {
                var promise = new Built.Promise();
                if(typeof resolvedCb!=="function" &&
                    doneCb.length>0 &&
                    typeof doneCb[0]=="object"){
                        resolvedCb=doneCb.shift().callback;
                }
                if(typeof rejectedCb!=="function" &&
                    failCb.length>0 &&
                    typeof doneCb[0]=="object"){
                        rejectedCb=failCb.shift().callback;
                }
                var invokeIt=function(result,isError){
                    if (result && Built.Promise.isPromise(result)) {
                        result.then(function() {
                            promise.resolve.apply(promise, arguments);
                        }, function() {
                            promise.reject.apply(promise,arguments);
                        });
                    } else {
                        if(!result || Built.Util.dataType(result) !== "array"){
                            if(!result){
                                result = "";
                            }
                            result = [result];   
                        }
                        if(isError || isErrorReturned){
                            try{
                                promise.reject.apply(promise, result);   
                            }catch(e){
                                promise.reject.call(promise, (result.length ? result[0]:result)); 
                            }                 
                        }else{
                            try{
                                promise.resolve.apply(promise, result);    
                            }catch(e){
                                promise.resolve.call(promise, (result.length ? result[0]:result)); 
                            }                 
                        }
                    }
                }
                var _resolveWrap = function() {
                    var result = arguments;
                    /*if(result && result[0] === false){
                        return invokeIt(result, true);
                    }*/
                    if (typeof resolvedCb === "function") {
                        try{
                            invokeIt(resolvedCb.apply(this, result));
                        }catch(e){
                            invokeIt(e,true);
                        }
                    }else{
                        invokeIt((funcReturn || result));
                    }
                }
                var _rejectWrap = function() {
                    var result = arguments;
                    if (typeof rejectedCb === "function") {
                        try{
                            invokeIt(rejectedCb.apply(this, result));
                        }catch(e){
                            invokeIt(e,true);
                        }
                    }else{
                        invokeIt((funcReturn || result), true);
                    }
                }
                this.success(_resolveWrap);
                this.error(_rejectWrap);
                return promise;
            }

            var _callAlways= function() {
                for(var i =0,j=alwaysCb.length;i<j;i++){
                    var item=alwaysCb[i];
                    if(item){
                        item.callback.apply(item.context,args);
                    }
                }
                if(!preserveCallback){
                    alwaysCb=[];
                }
            }

            /** @private */
            this.__preserve=function(flag){
                if(typeof flag === "boolean"){
                    preserveCallback = flag;
                }
            }

        }

        /**
         * returns a new promise that is fulfilled when all of the input promises are resolved. If any promise in the list fails, then the returned promise will fail with the last error. If they all succeed, then the returned promise will succeed, with the result being an array with the results of all the input promises.
         * @param {Array} promises a list of Built.Promise to wait for.
         * @static
         * @memberof Built.Promise
         * @return {Built.Promise} new Built.Promise.
         */
        Built.Promise.when=function(){
            var promises = [];
            for(var i in arguments){
                if(Built.Util.dataType(arguments[i]) === "array"){
                    promises = promises.concat(arguments[i]);
                }else if(typeof arguments[i] === "object"){
                    promises.push(arguments[i]);
                }
            }
            var totalPromises = promises.length,
                retPromise = new Built.Promise();
            if(totalPromises === 0){
                retPromise.resolve();
                return retPromise;
            }

            var leftPromises = totalPromises,
                rejectPromises = [],
                fulfilledPromises = [],
                errorFaced = false;


            var onCompleted = function() {
                --leftPromises;
                if (leftPromises === 0) {
                    if (errorFaced) {
                        retPromise.reject(rejectPromises,fulfilledPromises);
                    } else {
                        retPromise.resolve(fulfilledPromises);
                    }
                }
            };
            Built.Util.each(promises, function(item,index){
                if(Built.Promise.isPromise(item)){
                    item.then(function(result) {
                        fulfilledPromises[index]=result;
                        onCompleted();
                    }, function(error) {
                        rejectPromises[index] = error;
                        fulfilledPromises[index]=error;
                        errorFaced = true;
                        onCompleted();
                    });
                } else {
                    fulfilledPromises[index] = item;
                    onCompleted();
                }
            });
            return retPromise;
        }

        /**
         * Check whether object is a promise.
         * @param {Object} promise promise to check.
         * @static
         * @memberof Built.Promise
         * @return {Boolean} Boolean value.
         */
        Built.Promise.isPromise=function(prom){
            return (typeof prom==="object" && typeof prom.then==="function");
        }
    
    })(Built);

////////////////////////////////////////////////        Built.Application        //////////////////////////////////////////////////
    (function(root){
        var Built = root;
        /**
         * Built.Application - application Settings, Users and Roles
         * @name Built.Application
         * @return Built.Application object instance.
         * @namespace
         * @static
         * @memberof Built
         */
        Built.Application = {
        }

        /**
         * fetch application details viz. app name, uid, apikey, account name and application variables
         * @param {Object} [callback] object containing callbacks. eg: {onSuccess:function(data){}, onError: function(err){}}
         * @name Built.Application.fetchSettings
         * @function
         * @static
         * @memberof Built.Application
         * @return {Built.Promise} returns Built.Promise
         */
        Built.Application.fetchSettings= function (callback) {
            callback=callback||{};
            var promise=buildPromise(callback);
            callback=promise.__options;
            var cb=function(data,res){
                try{data=JSON.parse(data)}catch(e){}
                if(typeof data=="object" && typeof data.application !=="undefined"){
                    if(typeof callback.onSuccess =="function"){
                        callback.onSuccess(data, res);
                    }
                }else{
                    if(typeof callback.onError =="function"){
                        callback.onError(data, res);
                    }
                }
            }
            var rets= REST.APP_SETTINGS.fetch(Headers,{include_application_variables:true},cb);
            promise._XHR=rets._XHR;
            promise.abort=rets.abort;
            return promise;
        }
        /**
         * get Built.Query object for application user's class
         * @example
         * var users=Built.Application.getUserQuery();
         * users.greaterThan('age','17')
         * .exec()
         * .success(function(usersArray, responseObject){
         *    //callback logic
         * });
         * @name Built.Application.getUserQuery
         * @function
         * @memberof Built.Application
         * @static
         * @return {Built.Query} returns Built.Query to get application user's object.
         */
        Built.Application.getUserQuery= function (){
            return (new Built.Query('built_io_application_user'));
        }

        /**
         * get Built.Query object for application role's class
         * @example
         * var roles=Built.Application.getRoleQuery();
         * roles.where('name','admin')
         * .exec()
         * .success(function(rolesArray, responseObject){
         *    //callback logic
         * });
         * @memberOf Built.Application
         * @function
         * @name Built.Application.getRoleQuery
         * @static
         * @return {Built.Query} returns Built.Query to get application role's object.
         */
        Built.Application.getRoleQuery=function () {
            return (new Built.Query('built_io_application_user_role'));
        }

    })(Built);

////////////////////////////////////////////////        Built.Extension          ///////////////////////////////////////////////////
    (function(root){
        var Built = root;
        /**
         * execute a code snippet in extension
         * @name Built.Extension
         * @return Built.Extension Object.
         * @namespace
         * @static
         * @memberof Built
         */
        Built.Extension = {}

        /**
         * makes a call to an extension function
         * @param {String} functionName the name of the function that you want to execute
         * @param {Object} RequestBody JSON to send as a request body (send empty {} if not required).         
         * @param {Object} RequestHeaders JSON to send as a request headers (send empty {} if not required).
         * @param {Object} [callback] object containing callbacks. eg: {onSuccess:function(data){}, onError: function(err){}}
         * @static
         * @memberof Built.Extension
         * @return {Built.Promise} returns Built.Promise
         */
        Built.Extension.execute = function (logicId, reqBody, reqHeaders, callback){
            var appId = Headers['application_api_key'];
            callback = callback || {};
            if(reqHeaders && 
               (reqHeaders.success || 
                reqHeaders.error || 
                reqHeaders.onSuccess || 
                reqHeaders.onError)){
                    callback = reqHeaders;
                    reqHeaders = {};
            }
            var promise = buildPromise(callback);
            callback = promise.__options;
            if(typeof appId =='string' &&
              appId !== "" &&
              typeof logicId ==='string'){
                if(!reqBody || typeof reqBody !== "object"){
                    reqBody = {};
                }
                if(!reqHeaders || typeof reqHeaders !== "object"){
                    reqHeaders = {};
                }
                var url = serializeURL(urls.Base + urls.extensionURL + logicId);
                if(!reqHeaders.application_api_key){
                    reqHeaders.application_api_key = appId;    
                }
                var cb = function(data,res){
                    if(res.status==200){
                        try{
                           data=JSON.parse(data);
                        }catch(e){}
                        if(typeof callback.onSuccess=='function'){
                            callback.onSuccess(data,res);
                        }
                    }else if(typeof callback.onError=='function'){
                        callback.onError(data,res);
                    }
                }
                var rets = httpPost(url, reqHeaders, reqBody, cb);
                promise._XHR = rets._XHR;
                promise.abort = rets.abort;
            }else{
                if(typeof callback === "function"){
                    callback({error_message:"parameter required (function_name, application_api_key)"},null);
                }
            }
            return promise;
        }
        /**
         * define the logic(function) in the extension (only in nodejs).
         * @param {String} functionName define the unique name for the function. It will be used to execute the logic later on.
         * @param {Function} function eg: function(req,res){res.success("hello world")}.
         * @static
         * @memberof Built.Extension
         * @return {Built.Extension} returns the same object for chaining
         */
        Built.Extension.define= function (id,logic) {
            return this;
        }

        /**
         * the logic to be executed before saving the data. It is used to handle custom validation on the object (only in nodejs).
         * @param {String} classUid String classUid of built.io application.
         * @param {Function} function function(req,res){}.
         * @static
         * @memberof Built.Extension
         * @return {Built.Extension} returns the same object for chaining
         */
        Built.Extension.beforeSave= function (class_id,func){
            return this;
        }


        /**
         * the logic to be executed after saving the data (only in nodejs).
         * @param {String} classUid classUid of built.io application.
         * @param {Function} function function(req,res){}.
         * @static
         * @memberof Built.Extension
         * @return {Built.Extension} returns the same object for chaining
         */
        Built.Extension.afterSave= function (class_id,func){
            return this;
        }

        /**
         * http Request Module for Built Extension (only in nodejs).
         * @namespace
         * @static
         * @memberof Built.Extension
         * @return {Object} HTTP Request Module.
         */
        Built.Extension.http= {
            /**
             * send http GET request.
             * @param {Object} Options  Object containing url, data, headers, success and error callback.
             * @static
             * @memberof Built.Extension.http
             * @return {Built.Promise} returns Built.Promise
             */
            get:function(){

            },

            /**
             * send http PUT request.
             * @param {Object} Options  Object containing url, data, headers, success and error callback.
             * @static
             * @memberof Built.Extension.http
             * @return {Built.Promise} returns Built.Promise
             */
            put:function(){

            },

            /**
             * send http DEL request.
             * @param {Object} Options  Object containing url, data, headers, success and error callback.
             * @static
             * @memberof Built.Extension.http
             * @return {Built.Promise} returns Built.Promise
             */
            del:function(){

            },

            /**
             * send http POST request.
             * @param {Object} Options   Object containing url, data, headers, success and error callback.
             * @static
             * @memberof Built.Extension.http
             * @return {Built.Promise} returns Built.Promise
             */
            post:function(){

            }
        }

    })(Built);

////////////////////////////////////////////////        Built.Analytics          //////////////////////////////////////////////////
    (function(root){
        var Built = root;
        /**
         * class for integrating Built.Analytics support for apps. Use Built.Analytics class to track an event to analyse the datapoints, the use case and usage behaviour throughout the app.
         * @name Built.Analytics
         * @return Built.Analytics object instance.
         * memberOf Built
         * @namespace
         * @static
         */
        Built.Analytics={} ;

        /**
         * Get new instance of Built.Analytics.Event.
         * Event class object that you will pass to Built.Analytics for tracking.
         * @name Built.Analytics.Event
         * @param {String} [eventUid] uid of the event
         * @return {Built.Analytics.Event} returns Built.Analytics.Event object.
         * @class
         */
        Built.Analytics.Event=function(euid){
            var uid = euid || "" ;
            var properties = {
                properties : {}
            };
            var additionalEvents = {};

             /**
             * set previous event uid of an event.
             * @param {String} previousEventUid uid of the previous event. Useful for funneling.
             * @memberOf Built.Analytics.Event
             * @name setPreviousEventUid
             * @function
             * @instance
             * @return {Built.Analytics.Event} returns the same object for chaining
             */
             this.setPreviousEventUid = function(prevEvent){
                if(typeof prevEvent === 'string'){
                    properties['previous_event_uid'] = prevEvent;
                }
                return this;
             },

             /**
             * set created at of an event.
             * @param {Date} date specify date to the event
             * @memberOf Built.Analytics.Event
             * @name setCreatedAt
             * @function
             * @instance
             * @return {Built.Analytics.Event} returns the same object for chaining
             */
             this.setCreatedAt = function(createdAt){
                if(createdAt instanceof Date && typeof createdAt.toISOString == 'function'){
                    properties['created_at'] = createdAt.toISOString();
                }
                return this;
             }

             /**
             * set properties in event.
             * @param {Object} properties properties will allow you to segment your events in your Built.Analytics reports.
             * @memberOf Built.Analytics.Event
             * @name setProperties
             * @function
             * @instance
             * @return {Built.Analytics.Event} returns the same object for chaining
             */
            this.setProperties= function(prop) {
                if(prop && typeof prop == 'object'){                 
                    properties.properties = Built.Util.mix(properties.properties, prop);
                    return this;
                }
                throw new Error("object required");
            }
            /** @private */
            this.addAttributes = this.setProperties;

            /**
             * set uid of event.
             * @param {String} eventUid uid of the event
             * @memberOf Built.Analytics.Event
             * @name setUid
             * @function
             * @instance
             * @return {Built.Analytics.Event} returns the same object for chaining
             */
            this.setUid=function (euid) {
                if(typeof euid=='string'){
                    uid=euid;
                }
                return this;
            }

            /**
             * send event to built.io.
             * @param {Object} [callback] object containing callbacks. eg: {onSuccess:function(data){}, onError: function(err){}}
             * @memberOf Built.Analytics.Event
             * @name trigger
             * @function
             * @instance
             * @return {Built.Promise} returns Built.Promise
             */
            this.trigger= function (callback) {
                if(uid != ""){
                    callback=callback||{};
                    var data = this.toJSON();
                    var promise = buildPromise(callback);
                    callback=promise.__options;
                    var cb = function(data,res){
                        try{
                            data = JSON.parse(data);
                        }catch(e){}
                        if(typeof data.notice !== "undefined"){
                            properties = {};
                            additionalEvents = {};
                            if(typeof callback.onSuccess=='function'){
                                callback.onSuccess(data,res);
                            }
                        }else{
                            if(typeof callback.onError=='function'){
                                callback.onError(data,res);
                            }
                        }
                    }
                    var rets= REST.AS.trigger(Headers,data,cb);
                    promise._XHR=rets._XHR;
                    promise.abort=rets.abort;
                    return promise;

                }
                throw new Error("event uid required, use setUid method to set event uid");
            }

            /**
             * append event to send multiple events.
             * @param {Built.Analytics.Event} Event add the Built.Event object.
             * @memberOf Built.Analytics.Event
             * @name appendEvent
             * @function
             * @instance
             * @return {Built.Analytics.Event} returns the same object for chaining
             */
            this.appendEvent = function (BuiltEvents) {
                if(BuiltEvents instanceof  Built.Analytics.Event && typeof BuiltEvents.toJSON === 'function'){
                    var json = BuiltEvents.toJSON();
                    if(json.events){
                        for(var i in json.events){
                            if(additionalEvents[i] && additionalEvents[i].length){
                                additionalEvents[i] = additionalEvents[i].concat(json.events[i]);
                            }else{
                                additionalEvents[i] = json.events[i];
                            }
                        }
                    }
                }else{throw new Error("Built.Analytics.Event object required");}
                return this;
            }

            /**
             * get JSON representation of Built.Analytics.Event Object.
             * @memberOf Built.Analytics.Event
             * @name toJSON
             * @function
             * @instance
             * @return {Object} returns JSON.
             */
            this.toJSON = function () {
                if(uid || Object.keys(additionalEvents).length){
                    var retData = {};
                    if(uid){
                        retData[uid] = [properties];    
                    }
                    retData = Built.Util.mix(retData , additionalEvents);
                    return {events:retData};
                }
                throw new Error("Event UID required");
            }

        }

    })(Built);

////////////////////////////////////////////////        Built.Notification       ///////////////////////////////////////////////////
    (function(root){
        var Built = root;
        /**
         * Get instance of Built.Notification.
         * Notification class for sending notifications
         * @name Built.Notification
         * @return returns Built.Notification object instance.
         * @class
         */
        Built.Notification = function () {
            var note = {
                msg:"",
                time:"",
                users:[],
                local:false
            }

            /**
             * set message.
             * @param {String} message notification message to send.
             * @name setMessage
             * @memberOf Built.Notification
             * @function
             * @instance
             * @return {Built.Notification} returns the same object for chaining
             */
            this.setMessage = function (text){
                if(typeof text ==='string'){
                    note.msg = text;
                }else{
                    throw new Error("invalid message type");
                }
                return this;
            }

            /**
             * set future time for message being send.
             * @param {DateObject} sendat date time at which to send the notification
             * @name atTime
             * @memberOf Built.Notification
             * @function
             * @instance
             * @return {Built.Notification} returns the same object for chaining
             */
            this.atTime = function (dateObj){
                if(dateObj instanceof Date){
                    note.time = dateObj.toISOString();
                }else{
                    throw new Error("JavaScript date object required");
                }
                return this;
            }

            /**
             * add users to send notification.
             * @param {String|Array} users array or String of user uid.
             * @name addUsers
             * @memberOf Built.Notification
             * @function
             * @instance
             * @return {Built.Notification} Built.Notification object to chain the call.
             */
            this.addUsers = function (users) {
                if(typeof users === 'string'){
                    note.users.push(users);
                }else if(Built.Util.dataType(users) === 'array'){
                    note.users = note.users.concat(users);
                }
                return this;
            }

            /**
             * notification send in receivers local time zone (used with atTime API).
             * @param {Boolean} localPush set this property to true to send the notification local to the users' timezones. Useful only with the sendAt property. defaults to false.
             * @name inLocalTime
             * @memberOf Built.Notification
             * @function
             * @instance
             * @return {Built.Notification} returns the same object for chaining
             */
            this.inLocalTime = function (bool) {
                if(typeof bool === 'boolean'){
                    note.local = bool;
                }
            }

            /**
             * send Notification.
             * @param {Object} [callback] object containing callbacks. eg: {onSuccess:function(data){}, onError: function(err){}}
             * @name send
             * @memberOf Built.Notification
             * @function
             * @instance
             * @return {Built.Promise} returns Built.Promise
             */
            this.send = function (callback){
                if(note.msg !== "" && note.users.length > 0){
                    callback = callback || {};
                    var promise = buildPromise(callback);
                    callback = promise.__options;
                    var sendJSON = {
                        push:{
                            message:note.msg
                        }
                    }
                    if(note.time !== ""){
                        sendJSON.push.send_at = note.time;
                        sendJSON.push.local_push = note.local;
                    }
                    if(note.users.length>0){
                        sendJSON.push.user_uids = note.users;
                    }
                    /**@private*/
                    var cb = function(data,res){
                        try{data = JSON.parse(data)}catch(e){}
                        if(typeof data.notice !== "undefined"){
                            note.time = "";
                            note.msg = "";
                            note.local = false;
                            note.users = [];
                            if(typeof callback.onSuccess === 'function'){
                                callback.onSuccess(data,res);
                            }
                        }else{
                            if(typeof callback.onError === 'function'){
                                callback.onError(data,res);
                            }
                        }
                    }
                    var rets = REST.NOTIFICATION.send(Headers,sendJSON,cb);
                    promise._XHR = rets._XHR;
                    promise.abort = rets.abort;
                    return promise;

                }else{
                    throw new Error("message is not set or receivers not added");
                }
            }

        }

    })(Built);

////////////////////////////////////////////////        Built.Installation       ///////////////////////////////////////////////////
    (function(root){
        var Built = root;
        /**
         * Get instance of Built.Installation.
         * @name Built.Installation
         * @return returns Built.Installation object.
         * @class
         */
        Built.Installation=function () {
            var _object= new Built.Object("built_io_installation_data", {});

            /**
             * create or update installation in built.io.
             * @param {Object} [callback] object containing callbacks. eg: {onSuccess:function(data){}, onError: function(err){}}
             * @memberOf Built.Installation
             * @name save
             * @function
             * @instance
             * @return {Built.Promise} returns Built.Promise
             */
            this.save=function(){
                if(!this.getDeviceToken()){
                    return this;
                }
                if(!_object.get("uid")){
                    _object.upsert("device_token",this.getDeviceToken());
                }
                return _object.save.apply(_object,arguments);
            }

            /**
             * destroy installation from built.io.
             * @param {Object} [callback] object containing callbacks. eg: {onSuccess:function(data){}, onError: function(err){}}
             * @memberOf Built.Installation
             * @name destroy
             * @function
             * @instance
             * @return {Built.Promise} returns Built.Promise
             */
            this.destroy=function(){
                return _object.destroy.apply(_object,arguments);
            }

            /**
             * fetch installation data from built.io.
             * @param {Object} [callback] object containing callbacks. eg: {onSuccess:function(data){}, onError: function(err){}}
             * @memberOf Built.Installation
             * @name fetch
             * @function
             * @instance
             * @return {Built.Promise} returns Built.Promise
             */
            this.fetch=function(){
                try{
                    return _object.fetch.apply(_object,arguments);
                }catch(e){
                    throw new Error("installation uid required");
                }
            }

            /**
             * set extra property.
             * @param {String|Object} Key|JSON Key attribute name or JSON containing key and value.
             * @param {String} [Value] set the value for the key.
             * @name set
             * @memberOf Built.Installation
             * @function
             * @instance
             * @return {Built.Installation} returns the same object for chaining
             */
            this.set=function(){
                _object.set.apply(_object,arguments);
                return this;
            }

            /**
             * get particular key in installation data.
             * @param {String} key Key for which to get its value
             * @name get
             * @memberOf Built.Installation
             * @function
             * @instance
             * @return {Object|String} returns the key value
             */
            this.get=function(key){
                return _object.get(key);
            }

            /**
             * set timezone of your device in built.io.
             * @memberOf Built.Installation
             * @name setTimeZone
             * @function
             * @instance
             * @return {Built.Installation} returns the same object for chaining
             */
            this.setTimeZone=function(){
                var z=(new Date()).getTimezoneOffset();
                var timezone=(Math.abs(z)<60?((z<0?"+":"-")+("0:")+Math.abs(z)):(z<0?"+":"-")+(Math.floor((Math.abs(z)/60))+":"+(Math.abs(z)%60)));
                _object.set("timezone",timezone);
                return this;
            }

            /**
             * set location of your device in built.io.
             * @memberOf Built.Installation
             * @name setLocation
             * @function
             * @instance
             * @return {Built.Installation} returns the same object for chaining
             */
            this.setLocation=function(){
                _object.setLocation.apply(_object,arguments);
                return this;
            }

            /**
             * set device token.
             * @param {String} deviceToken set the Device token.
             * @memberOf Built.Installation
             * @name setDeviceToken
             * @function
             * @instance
             * @return {Built.Installation} returns the same object for chaining
             */
            this.setDeviceToken=function(token){
                _object.set("device_token",token);
                return this;
            }

            /**
             * set installation uid.
             * @param {String} installationId set the installation id.
             * @memberOf Built.Installation
             * @name setInstallationId
             * @function
             * @instance
             * @return {Built.Installation} returns the same object for chaining
             */
            this.setInstallationId=function(id){
                _object.set("uid",id);
                return this;
            }

            /**
             * set device type.
             * @param {String} deviceType set the device type.(ios | android).
             * @memberOf Built.Installation
             * @name setDeviceType
             * @function
             * @instance
             * @return {Built.Installation} returns the same object for chaining
             */
            this.setDeviceType=function(type){
                _object.set("device_type",type);
                return this;
            }

            /**
             * subscribe channels.
             * @param {Array} channelList An array of channel list to subscribe.
             * @memberOf Built.Installation
             * @name subscribeChannels
             * @function
             * @instance
             * @return {Built.Installation} returns the same object for chaining
             */
            this.subscribeChannels=function(channels){
                if((typeof channels=="string" && channels !="") || Built.Util.dataType(channels)=="array" ){
                    _object.pushValue("subscribed_to_channels",channels);

                }
                return this;
            }

            /**
             * unsubscribe channels.
             * @param {Array} channelList An array of channel list to unsubscribe.
             * @memberOf Built.Installation
             * @name unsubscribeChannels
             * @function
             * @instance
             * @return {Built.Installation} returns the same object for chaining
             */
            this.unsubscribeChannels=function(channels){
                if((typeof channels=="string" && channels !="") || Built.Util.dataType(channels)=="array" ){
                    _object.pullValue("subscribed_to_channels",channels);

                }
                return this;
            }

            /**
             * get device token.
             * @memberOf Built.Installation
             * @name getDeviceToken
             * @function
             * @instance
             * @return {String} returns the device token.
             */
            this.getDeviceToken=function(){
                return _object.get("device_token");
            }

            /**
             * get device type.
             * @memberOf Built.Installation
             * @name getDeviceType
             * @function
             * @instance
             * @return {String} returns the device type.
             */
            this.getDeviceType=function(){
                return _object.get("device_type");
            }

            /**
             * get channel list already subscribed.
             * @memberOf Built.Installation
             * @name getSubscribedChannelList
             * @function
             * @instance
             * @return {Array} returns the array of channel list.
             */
            this.getSubscribedChannelList=function(){
                 return (_object.oldJSON()['subscribed_to_channels'] ||[]);
            }

            /**
             * returns JSON representation of object attributes.
             * @name toJSON
             * @memberOf Built.Installation
             * @function
             * @instance
             * @return {Object} returns JSON.
             */
            this.toJSON=function(){
                return _object.toJSON();
            }


            /**
             * returns JSON representation of newly/changed set attributes.
             * @name dirtyJSON
             * @memberOf Built.Installation
             * @function
             * @instance
             * @return {Object} returns JSON.
             */
            this.dirtyJSON=function(){
                return _object.dirtyJSON() ;
            }


            /**
             * returns JSON representation of data synced with the server or instantiated with.
             * @name oldJSON
             * @memberOf Built.Installation
             * @function
             * @instance
             * @return {Object} returns JSON.
             */
            this.oldJSON=function(){
                return _object.oldJSON();
            }

        }
    
    })(Built) ;

////////////////////////////////////////////////        Built REST api           ///////////////////////////////////////////////////
    var REST = {
        VALIDATE : function(headers, callback){
            headers = headers || {};
            if( typeof headers.application_api_key !== "string" ||
                typeof headers.application_uid !== "string"){
                    var err = "First initialize built sdk with your application key, eg: Built.initialize('your_application_api_key', 'your_application_uid')";
                    if(typeof callback == "function"){
                        callback({error_message: err});
                    }
                    return err;
            }
            return null ;
        },
        OBJECT: {
            create: function (headers, data, callback, option) {
                option = option || {};
                if(REST.VALIDATE(headers, callback)){
                    return {};
                }
                if (option.class_uid && headers.application_api_key && headers.application_uid) {
                    var url = urls.Base + urls.classes + option.class_uid + urls.objects;
                    url = serializeURL(url);
                    return httpPost(url, headers, data, callback);
                }else if(typeof callback == 'function') {
                    callback({
                        error_message: 'provide all parameters'
                    });
                }
                return this;
            },
            fetch: function (headers, data, callback, option) {
                if(REST.VALIDATE(headers, callback)){
                    return {};
                }
                option = option || {};
                if (option.class_uid && headers.application_api_key && headers.application_uid) {
                    var url = urls.Base + urls.classes + option.class_uid + urls.objects + (option.object_uid ? option.object_uid : "");
                    url = serializeURL(url);
                    return httpGet(url, headers, data, callback);
                }else if(typeof callback == 'function') {
                    callback({
                        error_message: 'provide all parameters'
                    });
                }
                return this;
            },
            update: function (headers, data, callback, option) {
                option = option || {};
                if(REST.VALIDATE(headers, callback)){
                    return {};
                }
                if (option.class_uid && option.object_uid && headers.application_api_key && headers.application_uid) {
                    var url = urls.Base + urls.classes + option.class_uid + urls.objects + option.object_uid;
                    url = serializeURL(url);
                    return httpPut(url, headers, data, callback);
                }else if(typeof callback == 'function') {
                    callback({
                        error_message: 'provide all parameters'
                    });
                }
                return this;
            },
            destroy: function (headers, data, callback, option) {
                option = option || {};
                if(REST.VALIDATE(headers, callback)){
                    return {};
                }
                if (option.class_uid && option.object_uid && headers.application_api_key && headers.application_uid) {
                    var url = urls.Base + urls.classes + option.class_uid + urls.objects + option.object_uid;
                    url = serializeURL(url);
                    return httpDelete(url, headers, data, callback);
                }else if(typeof callback == 'function') {
                    callback({
                        error_message: 'provide all parameters'
                    });
                }
                return this;
            }
        },
        CLASS: {
            fetch: function (headers, data, callback, option) {
                option = option || {};
                if(REST.VALIDATE(headers, callback)){
                    return {};
                }
                if (option.class_uid && headers.application_api_key && headers.application_uid) {
                    var url = urls.Base + urls.classes + option.class_uid;
                    url = serializeURL(url);
                    return httpGet(url, headers, data, callback);
                }else if(typeof callback == 'function') {
                    callback({
                        error_message: 'provide all parameters'
                    });
                }
                return this;
            }
        },
        USER: {
            login: function (headers, data, callback, option) {
                if(REST.VALIDATE(headers, callback)){
                    return {};
                }
                if (headers.application_api_key && headers.application_uid) {
                    var url = urls.Base + '/' + urls.login;
                    url = serializeURL(url);
                    return httpPost(url, headers, data, callback);
                }else if(typeof callback === 'function') {
                    callback({
                        error_message: 'provide all parameters'
                    });
                }
                return this;
            },
            logout: function (headers, data, callback, option) {
                if(REST.VALIDATE(headers, callback)){
                    return {};
                }
                if (headers.application_api_key && headers.application_uid && headers.authtoken) {
                    var url = urls.Base + '/' + urls.logout;
                    url = serializeURL(url);
                    return httpDelete(url, headers, data, callback);
                }else if(typeof callback == 'function') {
                    callback({
                        error_message: 'provide all parameters'
                    });
                }
                return this;
            },
            fetchUserInfo: function (headers, data, callback, option) {
                if(REST.VALIDATE(headers, callback)){
                    return {};
                }
                if (headers.application_api_key && headers.application_uid && headers.authtoken) {
                    var url = urls.Base + '/' + urls.getUserInfo;
                    url = serializeURL(url);
                    return httpGet(url, headers, {}, callback);
                }else if(typeof callback === 'function') {
                    callback({
                        error_message: 'provide all parameters'
                    });
                }
                return this;
            },
            register: function (headers, data, callback, option) {
                if(REST.VALIDATE(headers, callback)){
                    return {};
                }
                if (headers.application_api_key && headers.application_uid) {
                    var url = urls.Base + '/' + urls.user;
                    url = serializeURL(url);
                    return httpPost(url, headers, data, callback);
                }else if(typeof callback == 'function') {
                    callback({
                        error_message: 'provide all parameters'
                    });
                }
                return this;
            },
            forgotPassword: function (headers, data, callback, option) {
                data = data || {};
                if(REST.VALIDATE(headers, callback)){
                    return {};
                }
                if (headers.application_api_key && headers.application_uid && data.application_user && data.application_user.email) {
                    var url = urls.Base + urls.forgotPassword;
                    url = serializeURL(url);
                    return httpPost(url, headers, data, callback);
                }else if(typeof callback == 'function') {
                    callback({
                        error_message: 'provide all parameters'
                    });
                }
                return this;
            },
            generateAuthtoken: function (data, callback) {
                if (Headers.application_api_key && Headers.master_key) {
                    var url = serializeURL(urls.Base + urls.user + urls.genAuth);
                    return httpPost(url, Headers, data, callback);
                }else if(typeof callback == 'function') {
                    callback({
                        error_message: 'provide application_api_key and master_key'
                    });
                }
                return this;
            },
            activate: function (headers, data, callback, option) {
                data = data || {};
                option=option||{};
                if(REST.VALIDATE(headers, callback)){
                    return {};
                }
                if (headers.application_api_key && headers.application_uid && option.userId && option.activationToken) {
                    var url = urls.Base + "/application/users/"+option.userId+"/activate/"+option.activationToken ;
                    url = serializeURL(url);
                    return httpGet(url, headers, data, callback);
                }else if(typeof callback == 'function') {
                    callback({
                        error_message: 'provide all parameters'
                    });
                }
                return this;
            },
            deactivate: function (headers, data, callback, option) {
                data = data || {};
                option=option||{};
                if(REST.VALIDATE(headers, callback)){
                    return {};
                }
                if (headers.application_api_key && headers.application_uid && headers.authtoken && option.userId) {
                    var url = urls.Base + "/application/users/"+option.userId ;
                    url = serializeURL(url);
                    return httpDelete(url, headers, data, callback);
                }else if(typeof callback == 'function') {
                    callback({
                        error_message: 'provide all parameters'
                    });
                }
                return this;
            },
            fetchUidByEmail: function (headers, data, callback){
                data = data || {};
                if(REST.VALIDATE(headers, callback)){
                    return {};
                }
                if (headers.application_api_key && headers.application_uid) {
                    var url = urls.Base + "/application/users/retrieve_user_uid" ;
                    url = serializeURL(url);
                    return httpPost(url, headers, data, callback);
                }else if(typeof callback == 'function') {
                    callback({
                        error_message: 'provide all parameters'
                    });
                }
                return this;
            },
            update:function (headers, data, callback,option) {
                option=option||{};
                if(REST.VALIDATE(headers, callback)){
                    return {};
                }
                if (headers.application_api_key && headers.application_uid && headers.authtoken && option.uid) {
                    var url = urls.Base + '/' + urls.user + option.uid;
                    url = serializeURL(url);
                    data={application_user:data};
                    return httpPut(url, headers, data, callback);
                }else if(typeof callback == 'function') {
                    callback({
                        error_message: 'provide all parameters'
                    });
                }
                return this;
            },
        },
        AS:{
            trigger:function(headers,data,callback){
                var url =  serializeURL(urls.Base + '/events/trigger_multiple');
                data=data||{};
                if(REST.VALIDATE(headers, callback)){
                    return {};
                }
                if (headers.application_api_key && headers.application_uid) {
                    return httpPost(url, headers, data, callback);
                }else if(typeof callback == 'function') {
                    callback({
                        error_message: 'provide all parameters'
                    });
                }
                return this;
            }
        },
        APP_SETTINGS:{
            fetch: function (headers, data, callback) {
                if(REST.VALIDATE(headers, callback)){
                    return {};
                }
                if (headers.application_api_key && headers.application_uid) {
                    var url = urls.Base + '/applications/'+headers.application_uid
                    url = serializeURL(url);
                    return httpGet(url, headers, data, callback);
                }else if(typeof callback == 'function') {
                    callback({
                        error_message: 'provide all parameters'
                    });
                }
                return this;
            }
        },
        UPLOAD:{
            fetch: function (headers, data, callback, option) {
                option = option || {};
                if(REST.VALIDATE(headers, callback)){
                    return {};
                }
                if (headers.application_api_key && headers.application_uid && option.uid) {
                    var url = urls.Base + urls.upload + option.uid ;
                    url = serializeURL(url);
                    return httpGet(url, headers, data, callback);
                }else if(typeof callback == 'function') {
                    callback({
                        error_message: 'provide all parameters'
                    });
                }
                return this;
            },
            destroy: function (headers, data, callback, option) {
                option = option || {};
                if(REST.VALIDATE(headers, callback)){
                    return {};
                }
                if (headers.application_api_key && headers.application_uid && option.uid) {
                    var url = urls.Base + urls.upload + option.uid;
                    url = serializeURL(url);
                    return httpDelete(url, headers, data, callback);
                }else if(typeof callback == 'function') {
                    callback({
                        error_message: 'provide all parameters'
                    });
                }
                return this;
            },
            save: function (headers, data, callback, option) {
                option = option || {};
                if(REST.VALIDATE(headers, callback)){
                    return {};
                }
                if (headers.application_api_key && headers.application_uid && option.uid) {
                    var url = urls.Base + urls.upload + option.uid ;
                    url = serializeURL(url);
                    return httpPost(url, headers, data, callback);
                }else if(typeof callback == 'function') {
                    callback({
                        error_message: 'provide all parameters'
                    });
                }
                return this;
            },
        },
        NOTIFICATION:{
            send:function (headers, data, callback) {
                if(REST.VALIDATE(headers, callback)){
                    return {};
                }
                if (headers.application_api_key && headers.application_uid) {
                    var url = urls.Base + urls.notification;
                    url = serializeURL(url);
                    return httpPost(url, headers, data, callback);
                }else if(typeof callback == 'function') {
                    callback({
                        error_message: 'provide all parameters'
                    });
                }
            }

        }
    }

////////////////////////////////////////////////        HTTP Request         ///////////////////////////////////////////////////

    var httpPost = function (url, headers, data, callback) {
        return httpRequest(url, headers, data, 'POST', callback);
    }
    var httpGet = function (url, headers, data, callback) {
        return httpRequest(url, headers, data, 'GET', callback);
    }
    var httpDelete = function (url, headers, data, callback) {
        return httpRequest(url, headers, data, 'DELETE', callback);
    }
    var httpPut = function (url, headers, data, callback) {
        return httpRequest(url, headers, data, 'PUT', callback);
    }
    var browserHTTPRequest = function (url, headers, data, method, callback) {
        headers = headers || {};
        if(urls.host =="" || typeof urls.host !=="string" || urls.host.length<=0){
            throw new Error("set host for built.io server. eg: Built.setURL('api.built.io')");
            return;
        }
        if (typeof callback != 'function') { callback = function () { } }
        try{
            method = method.toUpperCase();
        }catch(e){}
        data = data || {};
        if(typeof XDomainRequest !== "undefined"){
            return fallbackHTTPRequest(url,headers,data,method,callback);
        }

        try{
            var http = new XMLHttpRequest();
            if (method != 'POST') {
                data['_method'] = method;
                method = 'POST';
            }
            http.open(method, url, true);
            http.setRequestHeader('Content-Type', 'application/json');
            if (Built.Util.dataType(headers) == 'object') {
                for (var k in headers) {
                    http.setRequestHeader(k, headers[k]);
                }
            }
            data = JSON.stringify(data);
            /**@private*/
            http.onreadystatechange = function (e) {
                if(http.readyState==4){
                    if (http.status != 0) {
                        callback(http.responseText, http);
                    } else if (http['__aborted__'] == false && fallbackOnCORS) {
                        try{data=JSON.parse(data)}catch(e){}
                        var _method=data['_method'];
                        try{delete data._method}catch(e){}
                        _fallback=true;
                        fallbackHTTPRequest(url, headers, data, _method, callback);
                    }else if(http['__aborted__']){
                        var ret = { error_message: 'request aborted', http: http};
                        callback(ret, http);
                    }
                    Built.Events.trigger('http:end');
                }
            }
            /**@private*/
            http.ontimeout = http.onerror= function (e) {
                Built.Events.trigger('http:end');
                var ret = { error_message: 'http client error', http: http, event: e };
                callback(ret, http);
                callback=function(){};
            }
            http.__aborted__=false;
            http.send(data);
            Built.Events.trigger('http:start');
            return {
                _XHR:true,
                abort:function(){
                    Built.Events.trigger('http:end');
                    http.__aborted__=true;
                    http.abort()
                }
            }
        }catch(e){
            _fallback=true;
            return fallbackHTTPRequest(url, headers, data, method, callback);
        }
    }

    var fallbackHTTPRequest=function(url, headers, data, method, callback){
        headers = headers || {};
        if( typeof headers.application_api_key !== "string" ||
            typeof headers.application_uid !== "string"){
                throw new Error("First initialize built sdk with your application key, eg: Built.initialize('your_application_api_key', 'your_application_uid')")
        }
        try{data=JSON.parse(data)}catch(e){}
        try{delete data._method}catch(e){}
        var randNum=random().toString();
        if(typeof Built.cbTray !="object"){Built.cbTray={}}
        Built.cbTray[randNum]=callback;
        var frame=createIFrame(url, headers, data, method,randNum);
        var mdf=createDataForm(url, headers, data, method,randNum);
        mdf.submit();
        Built.Events.trigger('http:start');
        return (function(id){
            return  {
                _XHR:false,
                abort:function(){
                    if(typeof Built.cbTray[id] === 'function'){
                        Built.Events.trigger('http:end');
                        Built.cbTray[id]=function(){
                            try{delete Built.cbTray[id];}catch(e){}
                        }
                        try{
                            var ele = document.getElementById("frame_"+id);
                            ele.parentNode.removeChild(ele);
                        }catch(e){}
                        try{
                            var elem = document.getElementById("form_"+id);
                            elem.parentNode.removeChild(elem);
                        }catch(e){}
                    }
                }
            }
        })(randNum);
    }
    var createIFrame=function(url, headers, data, method,rand){
        if(urls.host =="" || typeof urls.host !=="string" || urls.host.length<=0){
            throw new Error("set host for built.io server. eg: Built.setURL('built.io')");
            return;
        }
        try{method = method.toUpperCase()}
        catch(e){method="POST"};
        var callFrame=createIframeElement('frame_'+rand);
        callFrame.setAttribute("width", "0");
        callFrame.setAttribute("height", "0");
        callFrame.setAttribute("style", "display:none");
        document.body.appendChild(callFrame);
        return callFrame;
    }
    var createDataForm=function(url, headers, data, method,rand){
        if(urls.host =="" || typeof urls.host !=="string" || urls.host.length<=0){
            throw new Error("set host for built.io server. eg: Built.setURL('built.io')");
            return;
        }
        try{method = method.toUpperCase();}
        catch(e){method = "POST"}
        var form = document.createElement('form');
        form.setAttribute('id','form_'+rand);
        form.setAttribute("target", 'frame_'+rand);
        form.setAttribute("method", "post");
        if(url.charAt(url.length-1)=='/'){url=url.substring(0,url.length-1)}
        url = url + '.postmessage';
        form.setAttribute("action",url);
        for(var i in headers){
            try{
                form.appendChild(createInputElement(i.toString().toUpperCase(),headers[i]));
            }catch(e){}
        }
        data = data || {};
        var d = (typeof data == 'object' ? JSON.stringify(data) : data);
        form.appendChild(createInputElement("PARAM",d));
        form.appendChild(createInputElement("postmessage_payload",rand));
        form.appendChild(createInputElement("_method",method));
        form.appendChild(createInputElement("host",(document.location.origin?document.location.origin:(document.location.protocol+"//"+document.location.host))));
        document.body.appendChild(form);
        return form;
    }
    var createIframeElement=function( name) {
        var frame;
        try {
            frame = document.createElement('<iframe name="' + name + '" id="' + name + '" />');
        } catch(e) {
            frame = document.createElement("iframe");
            frame.id=name;
            frame.name = name;
        }
        return frame;
    }
    var createInputElement=function( name, val ) {
        var inp;
        try {
            inp = document.createElement('<input type="hidden" name="' + name + '" />');
        } catch(e) {
            inp = document.createElement("input");
            inp.type = "hidden";
            inp.name = name;
        }
        inp.value = val;
        return inp;
    }
    var postMessageListener=function(){
        var listener=function(e){
            var data=(e.data?e.data:e.message);
            try{
                data=JSON.parse(data);
            }catch(e){}
            if(typeof data=='object' && data.postmessage_payload){
                var cid=data.postmessage_payload;
                try {delete data['postmessage_payload']}catch(e){}
                Built.Events.trigger('http:end');
                if(typeof Built.cbTray[cid]=='function'){
                    Built.cbTray[cid](data,{type:"NETWORK"});
                    try{delete Built.cbTray[cid]}catch(e){}
                    try{
                        var ele = document.getElementById("frame_"+cid);
                        ele.parentNode.removeChild(ele);
                    }catch(e){}
                    try{
                        var elem = document.getElementById("form_"+cid);
                        elem.parentNode.removeChild(elem);
                    }catch(e){}
                }else{}
            }else{}
        }
        if (typeof window.addEventListener !== "undefined"){
            window.addEventListener("message", listener, false);
        }else{
            window.attachEvent("onmessage", listener);
        }

    }
    if(!isNode){postMessageListener()}

    //////////////////////////////////////////////          Node HTTP Module        ////////////////////////////////////////////////////
    var nodeHTTPRequest = function (url, headers, data, method, callback) {
        headers = headers || {};
        if(urls.host =="" || typeof urls.host !=="string" || urls.host.length<=0){
            throw new Error("set host for built.io server. eg: Built.setURL('built.io')");
            return;
        }
        try{
            method = method.toUpperCase();
        }catch(e){}
        data = data || {};
        if (isEmptyJSON(queryString) == false) {
            var qS = Built.Util.param(queryString);
            url += '?' + qS;
        }
        if (method != 'POST') {
            data['_method'] = method;
            method = 'POST';
        }
        headers['Content-Type'] = "application/json";
        return httpModule.post({
                url:url,
                headers: headers,
                body: data,
                json:true,
                strictSSL:false
            },
            function (error, response, body) {
                Built.Events.trigger('http:end');
                if(error){
                   return callback(error, response);
                }
                return callback(body, response);
            }
        );
        Built.Events.trigger('http:start');
    }
    if (isNode) { httpRequest = nodeHTTPRequest }
    else { httpRequest = browserHTTPRequest }

    var Base64={
        _keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
        encode:function(a){var c,d,e,f,g,h,i,b="",j=0;for(a=Base64._utf8_encode(a);a.length>j;)c=a.charCodeAt(j++),d=a.charCodeAt(j++),e=a.charCodeAt(j++),f=c>>2,g=(3&c)<<4|d>>4,h=(15&d)<<2|e>>6,i=63&e,isNaN(d)?h=i=64:isNaN(e)&&(i=64),b=b+this._keyStr.charAt(f)+this._keyStr.charAt(g)+this._keyStr.charAt(h)+this._keyStr.charAt(i);return b},
        decode:function(a){var c,d,e,f,g,h,i,b="",j=0;for(a=a.replace(/[^A-Za-z0-9\+\/\=]/g,"");a.length>j;)f=this._keyStr.indexOf(a.charAt(j++)),g=this._keyStr.indexOf(a.charAt(j++)),h=this._keyStr.indexOf(a.charAt(j++)),i=this._keyStr.indexOf(a.charAt(j++)),c=f<<2|g>>4,d=(15&g)<<4|h>>2,e=(3&h)<<6|i,b+=String.fromCharCode(c),64!=h&&(b+=String.fromCharCode(d)),64!=i&&(b+=String.fromCharCode(e));return b=Base64._utf8_decode(b)},
        _utf8_encode:function(a){a=a.replace(/\r\n/g,"\n");for(var b="",c=0;a.length>c;c++){var d=a.charCodeAt(c);128>d?b+=String.fromCharCode(d):d>127&&2048>d?(b+=String.fromCharCode(192|d>>6),b+=String.fromCharCode(128|63&d)):(b+=String.fromCharCode(224|d>>12),b+=String.fromCharCode(128|63&d>>6),b+=String.fromCharCode(128|63&d))}return b},
        _utf8_decode:function(a){for(var b="",c=0,d=c1=c2=0;a.length>c;)d=a.charCodeAt(c),128>d?(b+=String.fromCharCode(d),c++):d>191&&224>d?(c2=a.charCodeAt(c+1),b+=String.fromCharCode((31&d)<<6|63&c2),c+=2):(c2=a.charCodeAt(c+1),c3=a.charCodeAt(c+2),b+=String.fromCharCode((15&d)<<12|(63&c2)<<6|63&c3),c+=3);return b}
    };

    var Store={
        get:function(id){
            if(typeof localStorage !=='undefined'){
                return localStorage.getItem(id) || null;
            }
            return null;
        },
        set:function(id,value){
            if(typeof localStorage !=='undefined' && id ){
                return localStorage.setItem(id,value)
            }
            return null;
        }
    }
    
}

var methods = new Built;
for(var i in methods){
  Built[i] = methods[i];
}
if(isNode){
    module.exports = Built;
}else{
    scope.Built = Built;    
}
if ( typeof define === "function" && define.amd) {
    define( "Built", function () {
        return Built;
    });
}