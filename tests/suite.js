with(jsUnity.assertions){

// Need tests for
//  - deleting object properties
//  - deleting mixin properties
//  - partial mixins/mixouts
//  - unenumerable interfaces (like array)

var mixinTestSuite = {
  suiteName : "Mixin test suite",

  setUp : function() {
    this.mixme = { foo: 'bar' };
    this.obj = {};
  },

  tearDown : function() { },

  "test: object should inherit property from mixin" : function() {
    Object.mix(this.obj, this.mixme);

    assertEquals(this.obj.foo, 'bar');
  },

  "test: object should inherit method from mixin" : function() {
    this.mixme.fun = function(){ return 'babar' };
    Object.mix(this.obj, this.mixme);

    assertEquals(this.obj.fun(), 'babar');
  },

  "test: predefined object property should shadow mixed in property" : function() {
    this.obj.foo = 'soap';
    Object.mix(this.obj, this.mixme);

    assertEquals(this.obj.foo, 'soap');
  },

  "test: postdefined object property should shadow mixed in property" : function() {
    Object.mix(this.obj, this.mixme);
    this.obj.foo = 'boo';

    assertEquals(this.obj.foo, 'boo');
  },

  "test: object should inherit from multiple mixins" : function() {
    var m2 = { hello:'world' };
    Object.mix(this.obj, this.mixme, m2);

    assertEquals(this.obj.foo, 'bar');
    assertEquals(this.obj.hello, 'world');
  },

  "test: latest mixin should overshadow properties of previous mixins" : function() {
    var m2 = { foo:'bar2' };
    Object.mix(this.obj, this.mixme, m2);

    assertEquals(this.obj.foo, 'bar2');
  },

  "test: object should retain previous values after mixin is mixed out" : function() {
    this.obj.hello = 'world';
    this.mixme.hello = 'Sphen';

    Object.mix(this.obj, this.mixme);
    Object.unmix(this.obj, this.mixme);

    assertUndefined(this.obj.foo);
    assertEquals(this.obj.hello, 'world');
  },

  "test: object should retain previous values after multiple mixins are mixed out" : function() {
    var m2 = { hello:'world' };

    Object.mix(this.obj, this.mixme, m2);

    Object.unmix(this.obj, this.mixme);
    assertUndefined(this.obj.foo);

    assertEquals(this.obj.hello, 'world');

    Object.unmix(this.obj, m2);
    assertUndefined(this.obj.hello);
  },

  "test: object should inherit new value when mixin value changes" : function() {
    Object.mix(this.obj, this.mixme);

    this.mixme.foo = 'boo';

    assertEquals(this.obj.foo, 'boo');
  },

  "test: object should mix in to Object.prototype": function () {
    Object.mix(Object.prototype, this.mixme);

    assertNotUndefined( ({}).foo );
  },

  "test: object should mix in and out of Object.prototype": function () {
    Object.mix(Object.prototype, this.mixme);
    Object.unmix(Object.prototype, this.mixme);

    assertUndefined( ({}).foo );
  }
};

var mixinTests = {
  context: "An object",
  setUp: function(){
    this.obj = {}; 
  },
  tearDown: function () { },
  "context: with a mixin": {
    setUp: function(){
      this.mix = { foo: 'bar' }; 
      this.obj.mixin(this.mix);
    },
    tearDown: function (){
      this.obj.mixout(this.mix);
    },

    "should inherit from another mixin": function (){
      var m = { hello: 'world' };
      this.obj.mixin(m);
    }
  }
};

} //end assertion binding

function unify(obj)
{
  var suite = {};
  var lastk = '';

  for(var k in obj){
    if( !obj.hasOwnProperty(k) ) continue;

    if(k.match(/^should/)) {
      suite['test: '+obj.context+" "+k] = obj[k];

    } else if(k.match(/^context:/)) {
      (function(){

      var nested = obj[k];
      nested.context = obj.context + ' ' + k.replace(/^context: /, '');
      var newcontext = unify(nested);

      var upfn = suite.setUp,
          dnfn = suite.tearDown;

      var lastkfn = suite[lastk];
      suite[lastk] = function(){
                      lastkfn.call(this);
                        print('new call');
                      this.setUp = function(){
                        print('new setup');
                        upfn.call(this); // call old setup
                        newcontext.setUp.call(this); // call new context setup
                        this.tearDown = function(){
                        print('new tearDown');
                          dnfn.call(this);
                          newcontext.tearDown.call(this)
                        };
                      }
                    }


      var resetfn, resk;
      for(var j in newcontext){
        if( newcontext.hasOwnProperty(j) && !j.match(/^setUp|tearDown/) ) {
          suite[j] = newcontext[j];
          if(j.match(/^test/)){ resk = j;
            resetfn = newcontext[j];}
        }
      } 
      suite[resk] = function(){
        resetfn.call(this);
        this.setUp = upfn;
        var lastdn = this.tearDown;
        this.tearDown = function(){
          lastdn.call(this);
          this.tearDown = dnfn;
        }
      }
      print(lastk);


      })();
    } else {
      suite[k] = obj[k];
    }
      lastk = k;
  }
  pp(suite);
  return suite;
}


function should2unit(obj)
{
  var suite = {};

  for(var k in obj){
    if( !obj.hasOwnProperty(k) ) continue;

    if(k.match(/^should/)) {
      suite['test: '+obj.context+" "+k] = obj[k];
    } else {
      suite[k] = obj[k];
    }
  }

  return suite;
}

