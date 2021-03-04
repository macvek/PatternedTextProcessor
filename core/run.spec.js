module.exports = ops => {
    const GREEN = "\x1b[32m";
    const RESET = "\x1b[0m";
    const RED = "\x1b[31m";
    let counter = 0;
    for (each of ops) {
        let name;
        try {
            name = toFunctionName(each);

            each((failOrCheck) => { 
                if (typeof failOrCheck === 'string') { throw `Failed with message ${failOrCheck}`} 
                else { callCheck(failOrCheck) } ;
            },
                (giveMeName) => {name = giveMeName},
            );
            if (!name) {
                console.trace(`TEST at idx ${counter} has no name provided, please execute first test argument to provide such`);
            }
            console.log(`${GREEN}[PASSED]${RESET} ${name}`)
            counter++;
        }
        catch(e) {
            console.log(`${RED}[FAILED]${RESET} ${name} with error:`, e);
        }
    }

    const result = counter === ops.length ? ' \u2705' : '\u274c'
    console.log(`${result} Executed ${ops.length}, succeed: ${counter}, failed: ${ops.length-counter}`);

    function callCheck(check) {
        if (check.assertEquals) {
            let expected = check.assertEquals[0];
            let got = check.assertEquals[1];
            if (expected !== got) {
                throw `check.assertEquals failed expected:\`${expected}\`, given: \`${got}\``
            }
        }
        else {
            throw 'Cannot parse {check} object';
        }
    }

    function toFunctionName(each) {
        let asStr = ''+each;
        const endOfName = asStr.indexOf('(');
        if (endOfName > 0) {
            const firstSpace = asStr.indexOf(' ');
            if (firstSpace > -1) {
                return asStr.substr(firstSpace+1, endOfName-(firstSpace+1));
            }
        }
    }
}