window.addEventListener('load', (e) => {
    startPTP();
})

async function startPTP() {
    const hello = await Comm.send('/hello', {});
    const root = document.getElementById('root');
    let versionBox = document.createElement('div');
    versionBox.classList.add('version-box');
    versionBox.innerText = `Got version ${hello.version}`;
    root.innerHTML = '';
    root.appendChild(versionBox);

    let ui = new UI();
    let components = new UIComponents(ui);
    
    let [wizardBox, wizardCtl] = components.wizardBox();
    let [stepEditBox, stepEditBoxCtl] = components.stepEditBox();
    stepEditBoxCtl.close();

    wizardCtl.setActionHandler( (name, steps) => {
        switch(name) {
            case 'edit': 
                return stepEditBoxCtl.open(steps);
            case 'delete':
                return wizardCtl.delete(steps);
            default:
                console.log(`not supported yet ${name}`);
        }
    });


    let [devBox, devCtl] = components.developerBox(wizardCtl);

    wizardCtl.setOnExec(ptpToEvaluate => {
        devCtl.fill(JSON.stringify(ptpToEvaluate));
    });

    devBox.classList.add('devbox');
    root.appendChild(devBox);
    root.appendChild(wizardBox);
    root.appendChild(stepEditBox);

    stepEditBoxCtl.onSave( (prev, saved) => {
        wizardCtl.replace(prev,saved);
    });
    wizardCtl.load([]);
}

class UI {

    label(text) {
        let span = document.createElement('span');
        span.classList.add('label');
        span.innerText = text;

        return [span];
    }

    labeledTextbox(caption) {
        let overlap = document.createElement('div');
        let label = document.createElement('label');
        label.innerHTML = caption;

        let input = document.createElement('input');
        input.classList.add('labeled-input');

        overlap.appendChild(label);
        overlap.appendChild(input);

        return [overlap, {
            input,
            getValue() {
                return input.value;
            },

            setValue(val) {
                input.value = val;
            }

        }];
    }

    labeledNumberbox(caption) {
        let [dom, ctl] = this.labeledTextbox(caption);
        ctl.input.setAttribute('type', 'number');
        let origGetValue = ctl.getValue;
        ctl.getValue = () => {
            let proxied = origGetValue.apply(this);
            return 1*proxied;
        }
        return [dom,ctl];
    }

    labeledArraybox(caption) {
        let [dom, ctl] = this.labeledTextbox(caption);
        let origGetValue = ctl.getValue;
        ctl.getValue = () => {
            let proxied = origGetValue.apply(this);
            return proxied.split(',');
        }
        return [dom,ctl];
    }

    labeledFixedListbox(caption, values) {
        let [listbox,listboxCtl] = this.labeledListbox(caption);
        
        for (let each of values) {
            listboxCtl.add(each, changed);
        }
        
        let currentVal;
        listboxCtl.triggerSelectCallback();


        let fixedCtl = {
            getValue() {
                return currentVal;
            },

            setValue(it) {
                listboxCtl.setValue(it);
            }
        }

        return [listbox, fixedCtl];

        function changed(newVal) {
            currentVal = newVal;
        }

    }
    
    labeledListbox(caption) {
        let overlap = document.createElement('div');
        let label = document.createElement('label');
        label.innerHTML = caption;

        let listbox = document.createElement('select');
        listbox.classList.add('labeled-select');

        overlap.appendChild(label);
        overlap.appendChild(listbox);

        listbox.addEventListener('change', onChange);

        function onChange() {
            let val = listbox.value;
            let callback = callbackMap.get(val);
            if (callback) {
                callback(val);
            }
        }

        let callbackMap = new Map();

        let ctl = {
            triggerSelectCallback() { 
                onChange();
            },

            add(name, onSelectCallback) {
                let sel = document.createElement('option');
                sel.innerText = name;

                listbox.appendChild(sel);
                callbackMap.set(name, onSelectCallback);
            },

            setValue(it) {
                listbox.value = it;
                onChange();
            }
        }

        return [overlap, ctl];
    }

    icon(name) {
        // sourced from https://graphemica.com/
        function htmlEntityCode() {
            switch(name) {
                case 'xsign': return "\u274c"; //https://graphemica.com/%E2%9D%8C
                case 'pencil' : return '&#x270F;'; // https://graphemica.com/%E2%9C%8F
                case 'floppydisk' : return '&#x1F4BE;';//https://graphemica.com/%F0%9F%92%BE
                default: return `NoCodeFor ${name}`
            }
            
        }

        let box = document.createElement('span');
        box.innerHTML = htmlEntityCode();
        box.classList.add('icon-character');
        return box;
    }

    toolkitBox() {
        let self = this;
        
        let box = document.createElement('div');
        box.style.position = 'absolute';

        let outlined = document.createElement('div');
        outlined.style.position = 'absolute';
        outlined.classList.add('toolkit-outline');
        outlined.style.pointerEvents = 'none';

        box.appendChild(outlined);
        
        let onControlCallback;
        
        let toolButtons = document.createElement('div');
        toolButtons.classList.add('toolkit-toolButtons');
        toolButtons.style.position = 'absolute';
        

        let editBtn = buttonIcon('pencil',editAction);
        let deleteBtn = buttonIcon('xsign', deleteAction);

        toolButtons.appendChild(editBtn);
        toolButtons.appendChild(deleteBtn);

        function buttonIcon(name, clickAction) {
            let box = self.icon(name);
            box.classList.add('toolkit-button');
            box.addEventListener('click', clickAction);
            return box;
        }

        box.appendChild(toolButtons);
        
        
        let control = {
            onControl(callback) {
                onControlCallback = callback;
            },
            
            showControls( whichToShow ) {
                
            },

            surround(items) {
                if (items.length == 0) {
                    box.style.display = 'none';
                }
                else {
                    box.style.display = 'block';
                  
                    let boxRect = box.parentNode.getBoundingClientRect();

                    let rect = {
                        top:9999999999,left:99999999999,bottom:0,right:0
                    }

                    for (let each of items) {
                        let eachRect = each.getBoundingClientRect();
                        rect.top = Math.min(rect.top, eachRect.top);
                        rect.left = Math.min(rect.left, eachRect.left);
                        rect.bottom = Math.max(rect.bottom, eachRect.bottom);
                        rect.right = Math.max(rect.right, eachRect.right);
                    }

                    let width = rect.right - rect.left;
                    let height = rect.bottom - rect.top;

                    box.style.left = `${rect.left - boxRect.left}px`;
                    box.style.top  = `${rect.top - boxRect.top}px`;
                    outlined.style.width = `${width}px`;
                    outlined.style.height = `${height}px`;

                    toolButtons.style.left = `${width + 5}px`;
                }
            }
        }

        return [box, control];

        function editAction() {
            if (onControlCallback) {
                onControlCallback('edit');
            }
        }

        function deleteAction() {
            if (onControlCallback) {
                onControlCallback('delete');
            }
        }
    }

    box() {
        let box = document.createElement('div');
        let control = {
            add(it) {
                box.appendChild(it);
            },
            clear() {
                box.innerHTML='';
            }
        }

        return [box, control];
    }

    jsonInput(name) {
        let box = document.createElement('div');
        let label = document.createElement('span');
        let textarea = document.createElement('textarea');
        textarea.classList.add('jsoninput-textarea')
        box.appendChild(label);
        box.appendChild(textarea);


        let control = {
            setName(newName) {
                label.innerText = name;
            },

            asJson() {
                return JSON.parse(textarea.value);
            },

            textarea
        }


        control.setName(name);
        return [box, control];
    }

    rawDisplay() {
        let box = document.createElement('div');
        let pre = document.createElement('pre');
        let titleBlock = document.createElement('strong');

        box.appendChild(titleBlock);
        box.appendChild(pre);

        let control = {
            show(title, payload) {
                titleBlock.innerText = title;
                if (payload) {
                    pre.innerText = JSON.stringify(payload, null, 4);
                }
            }
        }

        return [box, control];

    }

    submitButton(name, triggerFromInput) {
        let button = document.createElement('button');
        button.innerText = name;

        let control = new EventConsumer();

        const triggeredAction = () => control.trigger('click');

        button.onclick = triggeredAction;
        if (triggerFromInput) {
            this.bindToEnterPress(triggerFromInput, triggeredAction);
        }

        return [button, control];
    }

    namedInput(name) {
        let box = document.createElement('span');
        let label = document.createElement('label');
        label.innerText = name;
        box.appendChild(label);

        let input = document.createElement('input');
        box.appendChild(input);

        let control = {
            value() { return input.value; },
            input
        }
        return [box, control];
    }

    bindToEnterPress(what, callback) {
        what.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                callback(e);
            }
        })
    }

}

class UIComponents {
    constructor(ui) {
        this.ui = ui;
    }

    stepEditBox() {
        let ui = this.ui;
        let self = this;

        let [editBox,editBoxCtl] = ui.box();

        editBox.classList.add('step-edit');

        let [listbox,listboxCtl] = ui.labeledListbox('Step type');
        editBoxCtl.add(listbox);

        listboxCtl.add('pad', formForType);
        listboxCtl.add('upper', formForType);
        listboxCtl.add('lower', formForType);
        listboxCtl.add('trim', formForType);
        listboxCtl.add('format', formForType);
        listboxCtl.add('return', formForType);
        listboxCtl.add('passInput', formForType);
        listboxCtl.add('store', formForType);
        listboxCtl.add('storeInput', formForType);
        listboxCtl.add('indexOf', formForType);
        listboxCtl.add('indexedSplit', formForType);
        listboxCtl.add('arraySplit', formForType);
        listboxCtl.add('arrayJoin', formForType);
        listboxCtl.add('iterateArrayValues', formForType);
        listboxCtl.add('arrayPick', formForType);
        listboxCtl.add('array', formForType);

        let [detailsBox, detailsBoxCtl] = ui.box();
        editBoxCtl.add(detailsBox);

        detailsBoxCtl.clear();

        let stepOnOpen;
        let detailsFormCtl;

        let [saveButton,saveButtonCtl] = ui.submitButton('Save');
        saveButtonCtl.put('click', () => {
            if (saveCallback) {
                let copied = CopyObject.viaJson(detailsFormCtl.getValue());
                saveCallback(stepOnOpen, copied);
                stepEditBoxCtl.close();
            }
        })
        
        editBoxCtl.add(saveButton);

        let saveCallback;
        let stepEditBoxCtl = {
            close() {
                editBox.style.display = 'none';
            },

            open(steps) {
                stepOnOpen = steps[0];
                if (steps.length != 1) {
                    console.log("STEP EDITOR SUPPORTS SINGLE SELECTION YET");
                }
                listboxCtl.setValue(stepOnOpen.call);
                if (detailsFormCtl) {
                    detailsFormCtl.setValue(stepOnOpen);
                }
                else {
                    console.log('Expected detailsFormCtl to be filled for', stepOnOpen);
                }
            
                editBox.style.display = 'block';
            },

            onSave(callback) {
                saveCallback = callback;
            }


        }

        function formForType(type) {
            detailsBoxCtl.clear();
            let [formDOM, formCtl] = self.dynamicForm(loadModel(type)); 
            detailsFormCtl = formCtl;
            detailsFormCtl.setValue({call:type});

            detailsBoxCtl.add(formDOM);
        }

        function loadModel(type) {
            switch(type) {
                case 'pad': return { key:'string', length:'number', align: {complex:'list', values:['left','right','center']} };
                
                case 'iterateArrayValues': 
                    return { 
                        '@base': {
                            'array':[],
                        },
                        'Fill steps in wizard': 'label',};
                case 'array': 
                    return { array: 'array'};
                
                case 'upper':
                case 'lower':
                case 'trim':
                case 'passInput':
                    return {'No properties' : 'label'};
                
                case 'format': 
                case 'return':
                case 'arrayJoin':
                case 'arraySplit':
                case 'indexOf':
                    return { key:'string'}

                case 'storeInput': 
                    return { key:'string'}

                case 'store': 
                    return { key: 'string', source:'pass'};
                
                case 'arrayPick':
                case 'indexedSplit' : 
                    return { idx: 'number'};
                
                default:
                    let ret = {};
                    ret['unknown '+type] = 'string';    
                    return ret;
            }
        }

        listboxCtl.triggerSelectCallback();
        return [editBox, stepEditBoxCtl];
    }

    dynamicForm(meta) {
        let ui = this.ui;

        let inputs = [];
        let inputsToKey = {};

        meta.call = 'pass';

        for (let key in meta) {
            if (key.startsWith('@')) {continue;}
            let inputPair = inputByType(key, meta[key]);
            inputs.push(inputPair);
            inputsToKey[key] = inputPair;
        }

        let baseValue = {};
        if (meta['@base']) {
            baseValue = meta['@base'];
        }

        let [box, boxCtl] = ui.box();
        
        for (let each of inputs) {
            let [inputDom] = each;
            if (inputDom) {
                boxCtl.add(inputDom);    
            }
        }

        function inputByType(title, type) {
            if (typeof type == 'object') {
                let complex = type.complex;
                if (!complex) {
                    log.error('type as object must have have .complex', type);
                    throw 'failed, error in log';
                }

                if (complex === 'list') {
                    let values = type.values;
                    return ui.labeledFixedListbox(title, values);
                }

                throw `Failed, unsupported complex type ${complex}`;
            }
            
            switch(type) {
                case 'pass': return passCtl();
                case 'string': return ui.labeledTextbox(title);
                case 'number': return ui.labeledNumberbox(title);
                case 'array': return ui.labeledArraybox(title);
                case 'list': return ui.labeledTextbox(title);
                case 'label': return ui.label(title);
                default:
                    console.log(`Missing implementation for ${type}, for field ${title}, rolling back to text, marking it with [def]`);
                    return ui.labeledTextbox(title + '[def]');
            }   

            function passCtl() {
                return [null, {
                    setValue(x) {
                        this.val = x;
                    },
                    getValue() {
                        return this.val;
                    }
                }];
            }
        }

        let formCtl = {
            setValue(inputObj) {
                for (let key in inputObj) {
                    let fieldPair = inputsToKey[key];
                    if (!fieldPair) {
                        console.log(`Failed to set value for field ${key}`, inputObj);
                        continue;
                    }
                    let [_, fieldCtl] = fieldPair;
                    let value = inputObj[key];
                    fieldCtl.setValue(value);
                }
            },
            getValue() {
                let ret = CopyObject.viaJson(baseValue);
                for (let key in inputsToKey) {
                    let [_, fieldCtl] = inputsToKey[key];
                    if (fieldCtl) {
                        // writable control only has fieldCtl
                        ret[key] = fieldCtl.getValue();
                    }
                }

                return ret;
            }
        }

        return [box, formCtl];
    }

    wizardBox() {
        let ui = this.ui;
        let [box, boxCtl] = ui.box();

        let selection = new SelectionHandler();
        let selectedSteps;

        box.classList.add('wizard');
        let [execButton, execCtl] = ui.submitButton('Execute');

        let currentPtp;
        let actionHandler;

        let onExec;
        execCtl.put('click', () => { if (onExec) onExec(currentPtp) });


        let control = {
            setActionHandler(x) {
                actionHandler = x;
            }, 

            setOnExec(x) {
                onExec = x;
            },
            
            load(ptpInput) {
                currentPtp = ptpInput;
                selectedSteps = new Set();
                boxCtl.clear();
                let [toolkitBox, toolkitCtl] = ui.toolkitBox();
                boxCtl.add(toolkitBox);
                toolkitCtl.surround([]);
                toolkitCtl.onControl( actionName => {
                    if (actionHandler) {
                        actionHandler(actionName, Array.from(selectedSteps));
                    }
                })

                
                let boxes = extendableListOfBoxes(ptpInput, toolkitCtl)
                for (let box of boxes) {
                    boxCtl.add(box);
                }
            
                boxCtl.add(execButton);

            },

            replace(prev,saved) {
                if (prev === currentPtp) {
                    this.load(saved);
                }
                else {
                    let withReplacement = CopyObject.replaceLeaf(currentPtp, prev,saved);
                    this.load(withReplacement);
                }
            },

            updateKey(box,key,newValue) {
                let withNewLeaf = CopyObject.putLeafAsKey(currentPtp, box, key, newValue);
                this.load(withNewLeaf);

            },

            delete(steps) {
                let withDeleted = currentPtp;
                for (let each of steps) {
                    withDeleted = CopyObject.deleteLeaf(withDeleted, each);
                }
                
                this.load(withDeleted);
            }
        }

        box.style.position = 'relative';
        
        return [box, control];

        function extendableListOfBoxes(parent, toolkitCtl, level=0) {
            let boxes = [];
            for (let step of parent) {
                boxes.push(boxForCall(step, toolkitCtl, level));
            }

            boxes.push(boxWithNewButton(
                (newStep) => {
                    let parentCopy = CopyObject.viaJson(parent);
                    parentCopy.push(newStep);
                    control.replace(parent, parentCopy);
                }
            , level));
            return boxes;
        }

        function boxWithNewButton(boxModifyCallback, level = 0) {
            let stepBox = makeStepBox(level);

            let newBtnBox = document.createElement('div');
            let clickMe = document.createElement('button');
            newBtnBox.appendChild(clickMe);
            let callLabel = "+";

            clickMe.innerText = callLabel;
            clickMe.classList.add('callbox-label');
            clickMe.addEventListener('click', () => {
                let newCall =  {'call': 'return', 'key':`I'm a new block`}
                boxModifyCallback(newCall);
            });
            newBtnBox.classList.add('callbox', 'callbox-newbtn');

            stepBox.appendChild(newBtnBox);
            return stepBox;
        }

        function boxForCall(step, toolkitCtl, level = 0) {
            let stepBox = makeStepBox(level);

            let callBox = makeCallBox(step);
            
            callBox.addEventListener('click',clickHandler);
            stepBox.appendChild(callBox);

            selection.whenSelected(callBox, (flag) => {
                if (flag) {
                    callBox.classList.add('callbox-selected');
                    selectedSteps.add(step);
                }
                else {
                    callBox.classList.remove('callbox-selected');
                    selectedSteps.delete(step);
                }
            });

            selection.postSelection( () => {
                toolkitCtl.surround(Array.from(selection.loadSelected()));
            });

            

            if (step.call === 'store') {
                let source = step.source;
                let sourceBox;
                if (source != null) {
                    sourceBox = boxForCall(source, toolkitCtl, level + 1);
                }
                else {
                    sourceBox = boxWithNewButton(
                        (newStep) => control.updateKey(step,'source',newStep),
                        level+1
                    );
                }
                stepBox.appendChild(sourceBox);
            }
            else if (step.call =='iterateArrayValues') {
                let childBoxes = extendableListOfBoxes(step.array, toolkitCtl, level+1);
                for (let each of childBoxes) {
                    stepBox.appendChild(each);
                }
            }

            function clickHandler(e) {
                selection.clickedOn(callBox,e);
            }

            return stepBox;
        }

        function makeStepBox(level) {
            let stepBox = document.createElement('div');
            if (level > 0) {
                stepBox.style.marginLeft = 10 * level + 'px';
            }
            return stepBox;
        }

        function makeCallBox(step) {
            let callBox = document.createElement('div');
            let label = document.createElement('div');
            callBox.appendChild(label);
            let callLabel = stepDetails(step);

            label.innerText = callLabel;
            label.classList.add('callbox-label');
            callBox.classList.add('callbox');
            
            return callBox;
        }

        function stepDetails(step) {
            let details = detailsText();
            return `${step.call}; ${details}`;

            function detailsText() {
                switch (step.call) {
                    case 'pad': return `key=${showArg(step.key)} length=${showArg(step.length)} align=${showArg(step.align)}`;
                    
                    case 'array': 
                        return `array=${showArg(step.array)}`;

                    case 'iterateArrayValues': 
                    case 'upper':
                    case 'lower':
                    case 'trim':
                    case 'passInput':
                        return '';
                    
                    case 'format': 
                    case 'return':
                    case 'arrayJoin':
                    case 'arraySplit':
                    case 'indexOf':
                        return `key=${showArg(step.key)}`;

                    case 'storeInput': 
                    case 'store': 
                        return `key=${showArg(step.key)}`;
                    
                    case 'arrayPick':
                    case 'indexedSplit' : 
                        return `key=${showArg(step.idx)}`;
                
                    default:
                        return `UNKNOWN STEP ${step.call}`
                }
            }
        }

        function showArg(it) {
            if (typeof it === 'string') {
                return `"${it}"`;
            }
            if (typeof it === 'number') {
                return `${it}`;
            }
            if (Array.isArray(it)) {
                let escaped = [];
                for (let each of it) {
                    escaped.push(showArg(each));
                }

                return escaped.join(' ,');
            }
        }
    }

    developerBox(wizardCtl) {
        let ui = this.ui;
        let [box, boxCtl] = ui.box();
        let [sampler, samplerCtl] = ui.namedInput('Sampler');
        boxCtl.add(sampler);

        let [sendSample, sendSampleCtl] = ui.submitButton('Check sample', samplerCtl.input);
        sendSampleCtl.put('click', evaluateSampler);
        boxCtl.add(sendSample);

        let resultBox = document.createElement("pre")
        resultBox.style.color='red';
        boxCtl.add(resultBox);
        function showResult(text) {
            resultBox.innerText = text;
        }

        let [rawDisplay, rawDisplayCtl] = ui.rawDisplay();
        boxCtl.add(rawDisplay);

        
        let [jsonInput, jsonInputCtl] = ui.jsonInput('PTP for Evaluation');
        boxCtl.add(jsonInput);
        jsonInputCtl.textarea.value = JSON.stringify([
            { call: 'arraySplit', key: ' ' },
            { call: 'store', key: '${key1}', source: { call: 'arrayPick', idx: 0 } },
            { call: 'store', key: '${key2}', source: { call: 'arrayPick', idx: 1 } },
            { call: 'store', key: '${key3}', source: { call: 'arrayPick', idx: 2 } },
            { call: 'array', array: ['Fixed Prefix', '${key3}', '${key2}', '${key1}', 'Fixed Suffix'] },
            { call: 'arrayJoin', 'key': ' > ' }
        ]);

        async function evaluateSampler() {
            const ptp = jsonInputCtl.asJson();
            if (wizardCtl) {
                wizardCtl.load(ptp);
            }
            const source = samplerCtl.value();
            const result = await Comm.send('evaluate', { ptp, source });
            rawDisplayCtl.show('Success', result);
            showResult(result.result);
        }

        let devCtl = {
            async fill(src) {
                jsonInputCtl.textarea.value = src;
                evaluateSampler();
            }
        }

        return [box, devCtl];
    }
}

class SelectionHandler {
    constructor() {
        this.handlers = new Map();
        this.selected = new Set();
    }

    loadSelected() {
        return this.selected;
    }

    clickedOn(subject,event) {
        let singleSelect = !event.ctrlKey;

        let unselect = [];

        let alreadySelected = false;
        for (let each of this.selected) {
            if (each === subject) {
                alreadySelected = true;
                unselect.push(each);
            }

            if (singleSelect) {
                unselect.push(each);
            }
        }

        if (!alreadySelected) {
            let handler = this.handlers.get(subject);
            if (!handler) {
                log.error('missing handler', subject);
                throw 'missing handler; detail in log';
            }

            this.selected.add(subject);
            handler(true);
        }

        for (let each of unselect) {
            let handler = this.handlers.get(each);
            this.selected.delete(each);
            handler(false);
        }

        if (this.postSelectionHandler) {
            this.postSelectionHandler();
        }
        
    }

    whenSelected(what, handler) {
        this.handlers.set(what, handler);
    }

    postSelection(handler) {
        this.postSelectionHandler = handler;
    }
}

class EventConsumer {
    constructor() {
        this.events = new Map();
    }

    put(eventName, callback) {
        this.events.set(eventName, callback);
    }

    trigger(eventName) {
        let handler = this.events.get(eventName);
        if (handler) {
            handler();
        }
    }
}

class Comm {
    static async send(endpoint, payload) {
        return new Promise((resolve, reject) => {
            let ajax = new XMLHttpRequest();

            ajax.onreadystatechange = e => {
                if (ajax.readyState == 1 /* OPEN */) {
                    ajax.setRequestHeader('Content-Type', 'application/json');
                    ajax.send(JSON.stringify(payload));
                }
                else if (ajax.readyState == 4) {
                    if (ajax.status == 200) {
                        try {
                            resolve(JSON.parse(ajax.responseText));
                        }
                        catch (e) {
                            reject(generalError(`Failed to parse json as response to endpoint ${endpoint}`, e));
                        }
                    }
                    else {
                        reject(generalError(`Failed, expected status 200 got ${ajax.status} for endpoint ${endpoint}`))
                    }
                }

                function generalError(msg, payload) {
                    console.log([msg, payload]);
                    return [msg];
                }
            };

            ajax.open('POST', endpoint, true);
        });

    }

}

class CopyObject {
    static viaJson(src) {
        return JSON.parse(JSON.stringify(src));
    }

    static replaceLeaf(root, toRepl, replWith) {
        if (deepCandidate(root)) {
            return deepReplace(root);
        }
        else {
            return CopyObject.viaJson(root);
        }

        function deepReplace(curr) {
            for (let eachKey in curr) {
                let value = curr[eachKey];
                if (value === toRepl) {
                    curr[eachKey] = replWith;
                    // root now has replaced key, so copy it
                    let retVal = CopyObject.viaJson(root);
                    // rollback to previous state of root
                    curr[eachKey] = toRepl;
                    
                    // return json copied structure
                    return retVal;
                }
                else if (deepCandidate(value)) {
                    let ret = deepReplace(value);
                    if (ret) {
                        return ret;
                    }
                }
            }
        }

        function deepCandidate(it) {
            return Array.isArray(it) || typeof it === 'object';
        }
       
    }

    static putLeafAsKey(root, keyParent, key, value) {
        return CopyObject.deepMapStructure(root, keyParent, 
            (host, hostKey, _) => {
                let foundRoot = host[hostKey];
                let copied = CopyObject.viaJson(foundRoot);
                copied[key] = value;

                host[hostKey] = copied;
            },
            (host, key, prevValue) => {
                host[key] = prevValue;
            }
        );
    }

    static deleteLeaf(root, toDelete) {
        return CopyObject.deepMapStructure(root, toDelete, 
            (host, key, _) => {
                if (Array.isArray(host)) {
                    host.splice(key,1);
                }
                else {
                    delete host[key];
                }
            },
            (host, key, prevValue) => {
                if (Array.isArray(host)) {
                    host.splice(key,0,prevValue);
                }
                else {
                    host[key] = prevValue;
                }
            });
    }

    static deepMapStructure(root, valueToMap, applyMap, revertMap) {
        if (deepCandidate(root)) {
            return deepMap(root);
        }
        else {
            return CopyObject.viaJson(root);
        }

        function deepMap(curr) {
            for (let eachKey in curr) {
                let value = curr[eachKey];
                if (value === valueToMap) {
                    applyMap(curr, eachKey, valueToMap);
                    let retVal = CopyObject.viaJson(root);
                    revertMap(curr, eachKey, valueToMap);
                    return retVal;
                }
                else if (deepCandidate(value)) {
                    let ret = deepMap(value);
                    if (ret) {
                        return ret;
                    }
                }
            }
        }

        function deepCandidate(it) {
            return Array.isArray(it) || typeof it === 'object';
        }
       
    }
}