let PTP = require('./ptp')
let runSpec = require('./run.spec.js')

if (require.main == module) {
    runSpec([
        checkIndexedSplit,
        checkArraySplit,
        applyFlow,
    ]);
}

function applyFlow(iAm, fail) {
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

function checkArraySplit(iAm, fail) {
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

function checkIndexedSplit(iAm, fail) {
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