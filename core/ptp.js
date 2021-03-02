module.exports = class PTP {
    version = 0.1
    
    constructor(flowSpec) {
        this.flowSpec = flowSpec;
    }

    parseInput(textInput) {
        const walker = this.flowWalker();
        return walker.process(textInput);
    }

    flowWalker() {
        return new FlowWalker(this.flowSpec);
    }
}

class FlowWalker {
    
    constructor(flow) {
        this.flow = flow;
        this.pointer = 0;
    }

    process(input) {
        let flow = this.flow;
        let stepInput = input;
        let trace = [];
        for (each of flow) {
            trace.push(stepInput);
            stepInput = this.callCmd(each, stepInput);
        }

        return stepInput;
    }

    callCmd(op, input) {
        if (!op) {
            throw 'op evaluated to false';
        }

        switch(op.call) {
            case 'indexedSplit' : return this.indexedSplit(op, input);
            case 'arraySplit' : return this.arraySplit(op, input);
            case 'iterateArrayValues': return this.iterateArray(op, input, false);
            case 'arrayPick': return this.arrayPick(op,input);
            default:
                throw `Unsupported operation ${op.call}`
        }
    }

    iterateArray(op, input, toIndexAndValue) {
        if (!Array.isArray(input)) {
            throw `Expected input as Array, but got ${input}`;
        }

        const subject = this.resolve(op, 'array');
        const ret = [];
        for (let i=0;i<input.length;i++) {
            let inputMidvalue = input[i];
            const trace = [inputMidvalue];
            for (let subOp of subject) {
                inputMidvalue = this.callCmd(subOp, inputMidvalue);
                trace.push(inputMidvalue);
            }

            ret.push(inputMidvalue);
        }

        return ret;
    }

    indexedSplit(op, input) {
        if (typeof input !== 'string') {
            throw `indexedSplit expected string, but got ${typeof input}`
        }
        let arg = this.resolve(op, 'idx');
        return [input.substr(0,arg), input.substr(arg)];
    }

    arraySplit(op, input) {
        let arg = this.resolve(op, 'key');
        return input.split(arg);
    }

    arrayPick(op, input) {
        let arg = this.resolve(op, 'idx');
        return input[arg];
    }

    resolve(op, argName) {
        let argValue = op[argName];
        if (undefined === argValue) {
            throw `Resolved arg: ${argName} to be undefined`;
        }
        return argValue;
    }
}