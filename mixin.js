/*-----------------------------------------------------------------------------
 * An attempt at multiple inheritance in JavaScript via mixins 
 * Zach Carter http://zaa.ch 
 *
 * Works analogous to injecting an object into another's prototype chain,
 * except new properties aren't inherited :(
 * ( JS would need a catchall for properties, though we could use __noSuchMethod__
 * for methods... )
-----------------------------------------------------------------------------*/

// Mixin module

var Mixin = (function(){

  // define interfaces so unenumerable properties can be mixed
  // https://developer.mozilla.org/En/Core_JavaScript_1.5_Reference/Global_Objects/Array#Generic_methods
  var ARRAY_INTERFACE = ['concat','join','pop','push','reverse','shift',
                         'slice','sort','splice','toSource','toString',
                         'unshift','every','filter','forEach','indexOf',
                         'lastIndexOf','map','some'];

  // essentially, creates a proxy object using getters/setters
  // and injects it atop the prototype chain
  // used internally as: mixin.call(myObj, module [, keys])
  function mixin(obj, keys)
  {
    // proxy stores reference to the real mixed in object 
    var proxy = { get __mixin__() { return obj } }; 

    // grab props ( even if doesn't have own )
    // ignores props that start with __mix
    // if keys is defined, use only those props
    for(var prop in obj)
    {
      if( !/^__mix/.test(prop) && (!keys || keys.indexOf && keys.indexOf(prop) >= 0 ) )
      {
        _mixProp(proxy, obj, prop); // proxy the property
      }
    }

    function pushProto(pt, o)
    {
      if ( pt.__proto__ === Object.prototype )
        pt.__proto__ = o;
      else
        pushProto(pt.__proto__, o);
    }
    
    // push our prototype onto the end of the proxy's chain
    pushProto(proxy, this.__proto__); 
    
    // set the proxy as our current prototype to complete the chain
    this.__proto__ = proxy; 

    if(obj.__mixedin__)
      obj.__mixedin__.call(this);

    return this;
  };

  // helper function that proxies a property
  function _mixProp(proxyObj, obj, prop) {

    var k = prop; // capture property key 
    var v;        // stores a shadowing value

    if(obj.__lookupGetter__(k)) 
    {
      proxyObj.__defineGetter__(k, function() {
         return v === undefined ? obj.__lookupGetter__(k).call(this) : v; 
       });

      if(obj.__lookupSetter__(k))
      {
       proxyObj.__defineSetter__(k, function(val) {
           return obj.__lookupSetter__(k).call(this, val); 
         }); 
      }
    }
    else 
    {
      proxyObj.__defineGetter__(k, function() { return v === undefined ? obj[k] : v}); 
      proxyObj.__defineSetter__(k, function(val) { return v = val }); 
    }

  };

  // removes the object from the inheritance chain
  function mixout(obj)
  {


    // look for obj in our proto chain so we can unlink it there
    function unlinkProto(pt, obj)
    {
      if (pt.__proto__ && pt.__proto__.__mixin__ === obj )
      {
        if(obj.__mixedout__)
          obj.__mixedout__.call(this);
        pt.__proto__ = pt.__proto__.__proto__ || null; 
      }
      else if ( pt.__proto__ !== null )
        unlinkProto(pt.__proto__, obj);
    }

    unlinkProto(this, obj); 

    return this;
  };

  // First argument will have remaining arguments mixed into it
  // i.e. Object.mix(myObj, module1, module2, module3)
  function mix(){
    var args = Array.prototype.slice.call(arguments);
    var obj = args.shift();
    for(var i = 0; i < args.length; ++i)
      mixin.call(obj, args[i]);
  }

  // First argument will have remaining arguments mixed out of it
  // i.e. Object.unmix(myObj, module1, module2, module3)
  function unmix(){
    var args = Array.prototype.slice.call(arguments);
    var obj = args.shift();
    for(var i = 0; i < args.length; ++i)
      mixout.call(obj, args[i]);
  }


  // *Could* also be used like this:
  //Object.prototype.mixin = mixin;
  //Object.prototype.mixout = mixout;

  return {
    mix: mix,
    unmix: unmix
  };

})();

// lets us call Object.mix
Mixin.mix(Object, Mixin);

