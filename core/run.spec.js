module.exports = ops => {
    const GREEN = "\x1b[32m";
    const RESET = "\x1b[0m";
    const RED = "\x1b[31m";
    let counter = 0;
    for (each of ops) {
        let name;
        try {
            each((giveMeName) => {name = giveMeName},
                (failMessage) => {throw `Failed with message ${failMessage}`}
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
}