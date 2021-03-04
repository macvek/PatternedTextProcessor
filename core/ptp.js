const e = require("express");

module.exports = class PTP {
    version = 0.1
    
    constructor(flowSpec) {
        this.flowSpec = flowSpec;
    }

    parseInput(textInput) {
        const walker = this.flowWalker();
        const ret = walker.process(textInput);
        this.lastWalker = walker;
        return ret;
    }

    flowWalker() {
        return new FlowWalker(this.flowSpec);
    }
}

class FlowWalker {
    
    constructor(flow) {
        this.flow = flow;
        this.pointer = 0;
        this.variablesStore = new Map();
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
            case 'format': return this.opFormat(op, input);
            case 'return': return this.opReturn(op, input);
            case 'store': return this.opStore(op, input);
            case 'indexOf' : return this.opIndexOf(op, input);
            case 'indexedSplit' : return this.opIndexedSplit(op, input);
            case 'arraySplit' : return this.opArraySplit(op, input);
            case 'iterateArrayValues': return this.opIterateArrayValues(op, input);
            case 'arrayPick': return this.opArrayPick(op,input);
            default:
                throw `Unsupported operation ${op.call}`
        }
    }

    opFormat(op) {
        const formatKey = this.resolveRaw(op, 'key');
        const chunks = this.splitByMany(formatKey, [' ', '$']);
        
        const processed = [];
        let escape = false;
        for (var each of chunks) {
            if (!escape && each.indexOf('$') === 0) {
                if (each === '$') {
                    escape = true;
                    continue;
                }
                let expectedString = this.pickFromStore(each);
                if (typeof expectedString !== 'string') {
                    throw `Expected variable ${each} to be a string, but give ${typeof each}`;
                }
                processed.push(expectedString);
            }
            else {
                escape = false;
                processed.push(each);
            }
        }
        if (escape) {
            throw `Left unescaped $ at the end of the string, it should be either $$ or variable`;
        }
        return processed.join('');
    }

    opReturn(op) {
        return this.resolve(op, 'key');
    }

    opStore(op, input) {
        let key = this.resolveRaw(op, 'key');
        let source = this.resolve(op, 'source');

        let result = this.callCmd(source, input);
        this.store(key, result);

        return input;
    }

    opIndexOf(op, input) {
        let arg = this.resolve(op, 'key');
        return input.indexOf(arg);
    }

    opIterateArrayValues(op, input) {
        return this.iterateArray(op, input, false);
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

    opIndexedSplit(op, input) {
        if (typeof input !== 'string') {
            throw `indexedSplit expected string, but got ${typeof input}`
        }
        let arg = this.resolve(op, 'idx');
        return [input.substr(0,arg), input.substr(arg)];
    }

    opArraySplit(op, input) {
        let arg = this.resolve(op, 'key');
        return input.split(arg);
    }

    opArrayPick(op, input) {
        let arg = this.resolve(op, 'idx');
        return input[arg];
    }

    store(key, value) {
        this.variablesStore.set(key, value);
    }

    resolve(op, argName) {
        let value = this.resolveRaw(op, argName);

        if (typeof value === 'string' && value.indexOf('$') === 0) {
            return this.pickFromStore(value);
        }
        else {
            return value;
        }
    }

    pickFromStore(value) {
        if (!this.variablesStore.has(value)) {
            throw `Expected variable ${value} in storage`;
        }
        return this.variablesStore.get(value);
    }

    resolveRaw(op, argName) {
        let argValue = op[argName];
        if (undefined === argValue) {
            throw `Resolved arg: ${argName} to be undefined`;
        }
        return argValue;
    }

    splitByMany(entry, separators) {
        const chunks = [];
        let afterLastPick = 0;
        while(afterLastPick < entry.length) {
            let nextIdx = findNextStop(entry, separators, afterLastPick+1);
            chunks.push(entry.substr(afterLastPick,nextIdx-afterLastPick));
            afterLastPick = nextIdx;
        }

        return chunks;

        function findNextStop(input, terminators, lastIdx) {
            let min = input.length;
            for (let each of terminators) {
                let next = input.indexOf(each, lastIdx);
                if (next > -1 && next < min) {
                    min = next;
                }
            }

            return min;
        }
    }
    
}