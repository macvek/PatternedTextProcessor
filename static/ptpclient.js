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
    
    let [wizardBox, wizardCtl] = components.wizardBox()
    let [devBox] = components.developerBox(wizardCtl);
    devBox.classList.add('devbox');
    root.appendChild(devBox);

    root.appendChild(wizardBox);



}

class UI {

    toolkitBox() {
        let box = document.createElement('div');
        box.classList.add('toolkit-box');
        box.style.pointerEvents = 'none';
        let control = {
            surround(items) {
                if (items.length == 0) {
                    box.style.display = 'none';
                }
                else {
                    box.style.display = 'block';
                    box.style.position = 'absolute';
                  
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
                    box.style.width = `${width}px`;
                    box.style.height = `${height}px`;
                    
                }
            }
        }

        return [box, control];
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

    wizardBox() {
        let ui = this.ui;
        let [wizardBox, wizardBoxCtl] = ui.box();

        let selection = new SelectionHandler();

        wizardBox.classList.add('wizard');
        let [execButton, execCtl] = ui.submitButton('Execute');

        execCtl.put('click', () => {console.log('execute clicked');});

        let control = {
            load(ptpInput) {
                wizardBoxCtl.clear();
                let [toolkitBox, toolkitCtl] = ui.toolkitBox();
                wizardBoxCtl.add(toolkitBox);
                toolkitCtl.surround([]);

                for (let step of ptpInput) {
                    wizardBoxCtl.add(boxForCall(step, toolkitCtl));
                }
                wizardBoxCtl.add(execButton);

            }
        }

        wizardBox.style.position = 'relative';
        
        return [wizardBox, control];

        function boxForCall(step, toolkitCtl, level = 0) {
            let stepBox = document.createElement('div');
            if (level > 0) {
                stepBox.style.marginLeft = 10 * level + 'px';
            }
            let callBox = document.createElement('div');
            let label = document.createElement('div');
            callBox.appendChild(label);
            let callLabel = stepDetails(step);

            label.innerText = callLabel;
            label.classList.add('callbox-label');
            callBox.classList.add('callbox');
            callBox.addEventListener('click',clickHandler);
            selection.whenSelected(callBox, (flag) => {
                if (flag) {
                    callBox.classList.add('callbox-selected');
                }
                else {
                    callBox.classList.remove('callbox-selected');
                }
            });

            selection.postSelection( () => {
                toolkitCtl.surround(Array.from(selection.loadSelected()));
            });

            stepBox.appendChild(callBox);

            if (step.call === 'store') {
                let source = step.source;
                let sourceBox = boxForCall(source, toolkitCtl, level + 1);
                stepBox.appendChild(sourceBox);
            }

            function clickHandler(e) {
                selection.clickedOn(callBox,e);
            }

            return stepBox;
        }

        function stepDetails(step) {
            let details;
            switch (step.call) {
                case 'arraySplit': details = `key=${showArg(step.key)}`; break;
                case 'store': details = `key=${showArg(step.key)}`; break;
                case 'arrayPick': details = `idx=${showArg(step.idx)}`; break;
                case 'array': details = `array=${showArg(step.array)}`; break;
                case 'arrayJoin': details = `key=${showArg(step.key)}`; break;
                default:
                    details = `UNKNOWN STEP ${step.call}`
            }
            return `${step.call}; ${details}`;
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
        sendSampleCtl.put('click', async () => {
            const payload = samplerCtl.value();
            const resp = await Comm.send('sample', { sample: payload })
            if (resp.failed) {
                rawDisplayCtl.show(`Failed: ${resp.failed}`);
            }
            else {
                rawDisplayCtl.show('Success', resp);
            }
        })
        boxCtl.add(sendSample);

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

        let [evaluateBox, evaluateCtl] = ui.submitButton("Evaluate", jsonInputCtl.textarea);
        boxCtl.add(evaluateBox);
        evaluateCtl.put('click', async () => {
            const ptp = jsonInputCtl.asJson();
            if (wizardCtl) {
                wizardCtl.load(ptp);
            }
            const source = samplerCtl.value();
            const result = await Comm.send('evaluate', { ptp, source });
            rawDisplayCtl.show('Success', result);
        });

        return [box];
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
                throw 'missng handler; detail in log';
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