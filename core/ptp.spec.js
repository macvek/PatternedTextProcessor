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
        checkFormat,
        checkTrim,
        checkUpper,
        checkLower,
        checkPad,
        checkJoin,
        checkArray,
    ]);
}

function checkArray(fail) {
    let ptp = new PTP([
        {call: 'arraySplit', key:' '},
        {call: 'store', key:'${key1}', source: {call:'arrayPick', idx:0}},
        {call: 'store', key:'${key2}', source: {call:'arrayPick', idx:1}},
        {call: 'store', key:'${key3}', source: {call:'arrayPick', idx:2}},
        {call: 'array', array:['Fixed Prefix', '${key3}', '${key2}', '${key1}', 'Fixed Suffix']},
        {call: 'arrayJoin', 'key': ' > '}
    ]);

    if ("Fixed Prefix > Last > Middle > First > Fixed Suffix" !== ptp.parseInput("First Middle Last")) {
        fail('Check array creator failed');
    }
}

function checkJoin(fail) {
    let ptp = new PTP([
        {call: 'arraySplit', key:' '},
        {call: 'arrayJoin', key:','}
    ])

    if ("A,B,C" !== ptp.parseInput("A B C")) {
        fail("join failed");
    }
}

function checkPad(check) {
    let ptpLeft = new PTP([{call:'pad', key:' ', length:10, align:'left'}]);
    let ptpRight = new PTP([{call:'pad', key:'X', length:10, align:'right'}]);
    let ptpCenter = new PTP([{call:'pad', key:' ', length:10, align:'center'}]);
    let ptpShortLeft = new PTP([{call:'pad', key:' ', length:3, align:'left'}]);
    let ptpShortRight = new PTP([{call:'pad', key:' ', length:3, align:'right'}]);
    let ptpShortCenter = new PTP([{call:'pad', key:' ', length:3, align:'center'}]);

    check({assertEquals: ['Hello     ', ptpLeft.parseInput('Hello')]});
    check({assertEquals: ['XXXXXHello', ptpRight.parseInput('Hello')]});
    check({assertEquals: ['  Hello   ', ptpCenter.parseInput('Hello')]});
    check({assertEquals: ['   Hell   ', ptpCenter.parseInput('Hell')]});
    check({assertEquals: ['Hel', ptpShortLeft.parseInput('Hello')]});
    check({assertEquals: ['llo', ptpShortRight.parseInput('Hello')]});
    check({assertEquals: ['Hel', ptpShortCenter.parseInput('Hell')]});
    check({assertEquals: ['ell', ptpShortCenter.parseInput('Hello')]});

}


function checkUpper(fail) {
    let ptp = new PTP([{'call':'upper'}]);
    if ('UPPERCASE' !== ptp.parseInput('uppercase')) {
        fail('Failed to upper');
    }
}

function checkLower(fail) {
    let ptp = new PTP([{'call':'lower'}]);
    if ('lowercase' !== ptp.parseInput('LowerCase')) {
        fail('Failed to lower');
    }
}

function checkTrim(fail) {
    let ptp = new PTP([{'call':'trim'}]);
    if ('Trim Me' !== ptp.parseInput(' Trim Me ')) {
        fail('Failed to trim');
    }
}

function checkFormat(check) {
    let ptp = new PTP([
        {'call':'store', 'key': '$first', 'source': {'call': 'return', 'key':'Hello'}},
        {'call':'store', 'key': '$snd', 'source': {'call': 'return', 'key':'World'}},
        {'call':'format', 'key': '$first $snd'}
    ]);

    check({'assertEquals':['Hello World', ptp.parseInput('discarded')]});

    ptp = new PTP([
        {'call':'store', 'key': '$first', 'source': {'call': 'return', 'key':'Hello'}},
        {'call':'store', 'key': '$snd', 'source': {'call': 'return', 'key':'World'}},
        {'call':'format', 'key': '$first$snd'}
    ]);

    check({'assertEquals':['HelloWorld', ptp.parseInput('discarded')]});

    ptp = new PTP([
        {'call':'store', 'key': '$first', 'source': {'call': 'return', 'key':'Hello'}},
        {'call':'store', 'key': '$snd', 'source': {'call': 'return', 'key':'World'}},
        {'call':'format', 'key': ' $snd$first '}
    ]);

    check({'assertEquals':[' WorldHello ', ptp.parseInput('discarded')]});

    ptp = new PTP([{'call':'format', 'key': 'No variables'}]);
    check({'assertEquals':['No variables', ptp.parseInput('discarded')]});

    ptp = new PTP([{'call':'format', 'key': '$$'}]);
    check({'assertEquals':['$', ptp.parseInput('discarded')]});

    ptp = new PTP([{'call':'format', 'key': '$$$$'}]);
    check({'assertEquals':['$$', ptp.parseInput('discarded')]});

    ptp = new PTP([{'call':'format', 'key': '$$ $$'}]);
    check({'assertEquals':['$ $', ptp.parseInput('discarded')]});

    ptp = new PTP([{'call':'format', 'key': '$$variable'}]);
    check({'assertEquals':['$variable', ptp.parseInput('discarded')]});

    ptp = new PTP([{'call':'format', 'key': 'Var$$'}]);
    check({'assertEquals':['Var$', ptp.parseInput('discarded')]});

    ptp = new PTP([{'call':'format', 'key': 'Var $$'}]);
    check({'assertEquals':['Var $', ptp.parseInput('discarded')]});

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