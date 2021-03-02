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
            case'indexedSplit' : {
                let arg = this.resolve(op, 'idx');
                return [input.substr(0,arg), input.substr(arg)];
            }
            default:
                throw `Unsupported operation ${op.call}`
        }
    }

    resolve(op, argName) {
        let argValue = op[argName];
        if (undefined === argValue) {
            throw `Resolved arg: ${argName} to be undefined`;
        }
        return argValue;
    }
}