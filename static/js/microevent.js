/**
 * MicroEvent.js, a minimal EventEmitter class.
 * Copyright (c) 2011 Jerome Etienne, http://jetienne.com
 */
var MicroEvent=function(){};MicroEvent.prototype={bind:function(e,t){this._events=this._events||{};this._events[e]=this._events[e]||[];this._events[e].push(t);return this;},unbind:function(e,t){this._events=this._events||{};if(e in this._events===false)return;this._events[e].splice(this._events[e].indexOf(t),1)},trigger:function(e){this._events=this._events||{};if(e in this._events===false)return;for(var t=0;t<this._events[e].length;t++){this._events[e][t].apply(this,Array.prototype.slice.call(arguments,1))}}};MicroEvent.mixin=function(e){var t=["bind","unbind","trigger"];for(var n=0;n<t.length;n++){if(typeof e==="function"){e.prototype[t[n]]=MicroEvent.prototype[t[n]]}else{e[t[n]]=MicroEvent.prototype[t[n]]}}};if(typeof module!=="undefined"&&"exports"in module){module.exports=MicroEvent}
