// $ js runner.js

load('jsunity.js');
load('../mixin.js');

load('suite.js');

jsUnity.log = function(s){ print(s) };

jsUnity.run( mixinTestSuite );
