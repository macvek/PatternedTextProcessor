module.exports = class PTP {
    version = 0.1
    
    constructor(flowSpec) {
        this.flowSpec = flowSpec;
    }

    parseInput(input) {
        const walker = this.flowWalker();
        const ret = walker.process(input);
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
        let self = this;
        let flow = this.flow;
        let stepInput = input;
        let trace = [traceDump()];
        this.trace = trace;
        for (let each of flow) {
            stepInput = this.callCmd(each, stepInput);
            trace.push(traceDump());
        }

        return stepInput;

        function traceDump() {
            return {input: stepInput, vars: self.variablesSnapshot()};
        }
    }

    callCmd(op, input) {
        if (!op) {
            throw 'op evaluated to false';
        }

        switch(op.call) {
            case 'pad': return this.opPad(op, input);
            case 'upper': return this.opUpper(op, input);
            case 'lower': return this.opLower(op, input);
            case 'trim': return this.opTrim(op, input);
            case 'format': return this.opFormat(op, input);
            case 'return': return this.opReturn(op, input);
            case 'passInput': return this.opPassInput(op, input);
            case 'store': return this.opStore(op, input);
            case 'storeInput': return this.opStoreInput(op, input);
            case 'indexOf' : return this.opIndexOf(op, input);
            case 'indexedSplit' : return this.opIndexedSplit(op, input);
            case 'arraySplit' : return this.opArraySplit(op, input);
            case 'arrayJoin' : return this.opArrayJoin(op, input);
            case 'iterateArrayValues': return this.opIterateArrayValues(op, input);
            case 'arrayPick': return this.opArrayPick(op,input);
            case 'array': return this.opArray(op, input);
            default:
                throw `Unsupported operation ${op.call}`
        }
    }

    opArray(op) {
        const inputArray = this.resolveRaw(op, 'array');
        if (!Array.isArray(inputArray)) {
            throw `Expected mapOf to be array, got ${typeof inputArray}`;
        }

        const ret = [];
        for (let each of inputArray) {
            if (each.indexOf('$') == 0) {
                ret.push(this.pickFromStore(each));
            }
            else {
                ret.push(each);
            }
        }

        return ret;
    }

    opArrayJoin(op, input) {
        if (!Array.isArray(input)) {
            throw `Expected input to be array, got ${typeof input}`;
        }

        const key = this.resolve(op, 'key');
        return input.join(key);
    }

    opPad(op, input) {
        const key = this.resolve(op, 'key');
        const length = this.resolve(op, 'length');
        const align = this.resolve(op,'align');

        if (input.lenght == length) {
            return input;
        }

        if (input.length < length) {
            const missing = length - input.length;
            
            let [left,right] = calcMissingSplit(missing, align);
            
            return times(left, key) + input + times(right,key);
        }
        else {
            const overlap = input.length - length;
            let [left,right] = calcMissingSplit(overlap, align);
            return input.substr(left, input.length-left-right);
        }

        function calcMissingSplit(missing, align) {
            switch (align) {
                case 'left': return [0,missing];
                case 'right': return [missing, 0];
                case 'center': return [ Math.floor(missing/2), Math.ceil(missing/2)];
                default:
                    throw `Unsupported align ${align}`;
            }
        }

        function times(n, v) {
            let r = '';
            for (let i=0;i<n;i++) r+=v;
            return r;
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

    opPassInput(op, input) {
        return input;
    }

    opTrim(op, input) {
        return input.trim();
    }

    opUpper(op, input) {
        return input.toUpperCase();
    }

    opLower(op, input) {
        return input.toLowerCase();
    }

    opStore(op, input) {
        let key = this.resolveRaw(op, 'key');
        let source = this.resolve(op, 'source');

        let result = this.callCmd(source, input);
        this.store(key, result);

        return input;
    }

    opStoreInput(op, input) {
        let key = this.resolveRaw(op, 'key');
        this.store(key, input);

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

    variablesSnapshot() {
        let mapped = {}
        this.variablesStore.forEach( (v,k) => {
            mapped[''+k] = v;
        });

        return mapped;
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