var chain = function(tests, delay) {
    if (tests instanceof Array) {
        if (tests.length > 0) {
            if (typeof delay != 'undefined') {
                setTimeout(function() {
                    tests.shift()();
                    chain(tests, delay);
                }, delay);
            } else {
                return function() {
                    tests.shift().apply({
                        next:function() {
                            return chain(tests);
                        }
                    }, arguments);
                }
            }
        } else QUnit.start();
    }
};

module('Lawnchair', {
    setup:function() {
        // I like to make all my variables globals. Starting a new trend.
        me = {name:'brian', age:30};
        store.nuke();
    },
    teardown:function() {
        me = null;
    }
});
    test('ctor', function() {
        QUnit.stop();
        expect(3);
        // raise exception if no ctor callback is supplied
        try {
            var lc2 = new Lawnchair({adaptor:store.adapter});    
        } catch(e) {
            ok(true, 'exception raised if no callback supplied to init');
            // should init and call callback
            console.log(store);
            var lc = new Lawnchair({adaptor:adapter}, function() {
                ok(true, 'should call passed in callback');
                var elsee = this;
                setTimeout(function() {
                    // need to timeout here because ctor doesnt return until after callback is called.
                    equals(elsee, lc, '"this"" is bound to the instance');
                    QUnit.start(); 
                }, 250);
            });
        }
    });
	test( 'all()', function() {
        QUnit.stop();
        expect(3);
        store.all(chain([function(r) {
            ok(true, 'calls callback');
            ok(r instanceof Array, 'should provide array as parameter');
            store.save(me, this.next());
        }, function(r) {
            store.all(this.next());    
        }, function(r) {
            equals(r.length, 1, 'array parameter after save has length 1');
            QUnit.start();
        }]));
    });
    test( 'nuke()', function() {
		QUnit.stop();
        expect(4);
		store.nuke(function() {
		    ok(true, "should call callback in nuke");
		    same(store.nuke(), store, "should be chainable on nuke");
		    store.all(chain([function(r) {
                    equals(r.length, 0, "all should return 0 length following a nuke.");
                    store.save(me);
                    var self = this;
                    store.nuke(function() {
                        store.all(self.next());
                    });
                },function(r) {
                    equals(r.length, 0, "should have 0 length after saving, then nuking");
                    store.all(this.next());
                    QUnit.start();
                }
            ]));
		});
	});
    
    test( 'save()', function() {
        QUnit.stop();
        expect(4);
        store.save(me, chain([function(one) {
            ok(true, 'should call passed in callback');
        }, function(two) {
            
        }, function(three) {
        }]));
    });
    

    
    test( 'get()', function() {
        QUnit.stop();
        expect(3);
		store.save({key:'xyz123', name:'tim'}, function(){
    		store.get('xyz123', function(r) {
    			equals(r.name, 'tim', 'should return proper object when calling get with a key');
    			start();
    		});		    
		});
        store.get('doesntexist', function(r) {
            ok(true, 'should call callback even for non-existent key');
            equals(r, null, 'should return null for non-existent key');
        });
    });

test( 'find()', function() {
    QUnit.stop();
    expect(5);
    store.save({dummy:'data'}, function() {
        store.save(me, function() {
            store.save({test:'something'}, function() {
                store.find('r.name == "brian"', function(r, i) {
                equals(r.name, me.name, 'should return same record that was saved, matching the condition, using shorthand condition and full callback');
                equals(i, 1, 'should return proper index in callback function');
                store.find(function(rec) {
                    return rec.name == 'brian';
                }, function(re, ind) {
                    equals(re.name, me.name, 'should return same record that was saved, matching the condition, using full condition and full callback');
                    store.find(function(reco) {
                        return reco.name == 'brian';
                    }, function(r) {
                        equals(r.name, me.name, "should return same record that was saved, matching the condition, using full condition and shorthand callback");
                        store.find(
                            'r.name == "brian"',
                            function(recor){
                                // change my age
                                recor.age = 31;
                                store.save(recor, function() {
                                    store.find('r.name == "brian"', function(record) {
                                        equals(record.age, 31, "should return updated record data after finding, changing something, saving, and finding the same record");
                                        start();
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

test( 'remove()', function() {
    QUnit.stop();
    expect(4);
    store.save({name:'joni'});
    store.find(
        "r.name == 'joni'",
        function(r){
            furtherassertions = function() {
                var callback = function() {
                    store.all(function(r) {
                        equals(r.length, 0, "should have length 0 after saving, finding and removing a record and using a callback");
                        store.save({key:'die', name:'dudeman'});
                        store.remove('die');
                        store.all(function(rec) {
                            equals(r.length, 0, "should have length 0 after saving and removing by key");
                            var cb = function() {
                                store.all('equals(r.length, 0, "should have length 0 after saving and removing by key when using a callback"); start();');
                            };
                            store.save({key:'die', name:'dudeman'});
                            store.remove('die', cb);
                        });
                    });
                };
                store.save({name:'joni'});
                store.find(
                    "r.name == 'joni'",
                    function(r){
                        store.remove(r, callback);
                });
            };
            store.remove(r);
            store.all('equals(r.length, 0, "should have length 0 after saving, finding, and removing a record"); furtherassertions();');
    });
});

test( 'Lawnchair helpers', function() {
    equals(store.adaptor.uuid().length, 36, "uuid() function should create a 36 character string (is this a test, really?)");
});
/*	

should( 'get 10 items in a page.', function() {
    store.nuke();
    for (var i = 0; i < 300; i++) {
        store.save({key: i, value: "test" + i});
    }
    store.paged(1,'equals(r.length, 10); start();');
});

// ---

});


context('Lawnchair with multiple collections', function(){

var dba = new Lawnchair({table: 'a'});
var dbb = new Lawnchair({table: 'b'});

should( 'be empty.', function(){
    QUnit.stop();
    dba.nuke();
    dbb.nuke();
    dba.all(function(rs){
        equals(rs.length, 0);
        dbb.all('equals(r.length, 0); start();');
    });
});

should( 'save one key in each store.', function(){
    QUnit.stop();
    dba.save({key:'a'}, function() {
        dbb.save({key:'b'}, function() {
            dba.all( function(rs){
                equals(rs.length, 1);
                dbb.all('equals(r.length, 1); start();');
            });
        });
    });
});
/// ---
});
*/
