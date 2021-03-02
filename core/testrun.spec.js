let PTP = require('./ptp')
let runSpec = require('./run.spec.js')


if (require.main == module) {
    runSpec([
        lineSplitTest,
        iFail
    ]);
}

function lineSplitTest(iAm) {
    iAm('LineSplitTest');
}

function iFail(iAm, fail) {
    iAm('I fail sometimes');
    if (Math.random()>0.5) {
        fail('Often');
    }
}
