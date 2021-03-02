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

    process() {
        return ['XXXXX','11111'];
    }
}