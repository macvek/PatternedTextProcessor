let PTP = require('./ptp')
let runSpec = require('./run.spec.js')

if (require.main == module) {
    runSpec([
        checkIndexedSplit
    ]);
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