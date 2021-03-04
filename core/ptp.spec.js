let PTP = require('./ptp')
let runSpec = require('./run.spec.js')

if (require.main == module) {
    runSpec([
        checkIndexedSplit,
        checkArraySplit,
        applyFlow,
        checkIndexOf,
        checkReturn,
        checkStorePassesInput,
        checkStoreReturnsArg,
        checkPassingArg,
    ]);
}


function checkPassingArg(fail) {
    let ptp = new PTP([
        {'call':'store', 'key' : '$myVar1', 'source': {'call' : 'indexOf', 'key': 'hello'}},
        {'call':'indexedSplit', 'idx':'$myVar1'}
    ]);

    const [welcomeAnd,helloFriend] = ptp.parseInput('Welcome and hello friend');
    if ('Welcome and ' !== welcomeAnd || 'hello friend' !== helloFriend) {
        fail(`expected splitted values to match but found 0:${welcomeAnd} & 1:[${helloFriend}`);
    }
}


function checkStoreReturnsArg(check) {
    let ptp = new PTP([
        {'call':'store', 'key' : '$myVar1', 'source': {'call' : 'return', 'key': 'Passed value'}},
        {'call':'return', 'key' : '$myVar1'}
    ]);

    check({'assertEquals': ['Passed value', ptp.parseInput('Discarded input')]});
}

function checkStorePassesInput(check) {
    let ptp = new PTP([
        {'call':'store', 'key' : '$myVar1', 'source': {'call' : 'return', 'key': 'Variable value'}},
    ]);

    check({'assertEquals': ['shouldPass', ptp.parseInput('shouldPass')]});
    check({'assertEquals': ['Variable value', ptp.lastWalker.variablesStore.get('$myVar1')]});
}


function checkReturn(fail) {
    let ptp = new PTP([
        {'call':'return', 'key' : 'This value is returned'},
    ]);

    const result = ptp.parseInput('This value is discarded');
    if ('This value is returned' !== result) {
        fail(`Got ${result}`);
    }
}

function checkIndexOf(fail) {
    let ptp = new PTP([
        {'call':'indexOf', 'key' : 'hello'}
    ]);

    const res = ptp.parseInput('hello');
    if (0 !== res) {
        fail(`Expected 0 got ${res}`);
    }
}

function applyFlow(fail,iAm) {
    iAm('applyFlow');
    let ptp = new PTP([
        {'call':'arraySplit', 'key' : '\n'},
        {'call':'iterateArrayValues', 'array': [
                {'call':'indexedSplit', 'idx' : 1},
                {'call':'arrayPick', 'idx' : 1},
                {'call':'indexedSplit', 'idx' : 1},
                {'call':'arrayPick', 'idx' : 0}
            ]
        }
        
    ]);

    let [a,b,c] = ptp.parseInput("XAXX\nXBXX\nXCXX");
    if ('A' != a, 'B' != b, 'C' != c) {
        fail(`Failed, expected [A,B,C], but got [${a},${b},${c}]`);
    }
}

function checkArraySplit(fail,iAm) {
    iAm('checkArraySplit');
    let ptp = new PTP([
        {'call':'arraySplit',
         'key' : '\n'}
    ]);

    let [a,b,c] = ptp.parseInput("A\nB\nC");
    
    if ('A' != a, 'B' != b, 'C' != c) {
        fail(`Failed, expected [A,B,C], but got [${a},${b},${c}]`);
    }
}

function checkIndexedSplit(fail,iAm) {
    iAm('checkIndexedSplit');
    let ptp = new PTP([
        {'call':'indexedSplit',
         'idx': 5}
    ]);

    let output = ptp.parseInput("XXXXX11111");
    if (!output) {
        fail('parseInput evaluated to false');
    }
    
    if (output.length != 2) {
        fail(`expected output to have 2 entries, found: ${output.length} in [${output}]`);
    }
    let [pre, post] = output;
    if ('XXXXX' !== pre || '11111' !== post) {
        fail(`expected XXXXX and 11111 but found ${pre} AND ${post}`);
    }
}