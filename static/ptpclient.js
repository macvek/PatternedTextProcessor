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
    let [sampler, samplerCtl] = ui.namedInput('Sampler');
    root.appendChild(sampler);

    let [sendSample, sendSampleCtl] = ui.submitButton('Check sample', samplerCtl.input);
    sendSampleCtl.put('click', async () => {
        const payload = samplerCtl.value();
        const resp = await Comm.send('sample', {sample:payload})
        if (resp.failed) {
            rawDisplayCtl.show(`Failed: ${resp.failed}`);
        }
        else {
            rawDisplayCtl.show('Success', resp);
        }
    })
    root.appendChild(sendSample);

    let [rawDisplay, rawDisplayCtl] = ui.rawDisplay();
    root.appendChild(rawDisplay);

    let [jsonInput, jsonInputCtl] = ui.jsonInput('PTP for Evaluation');
    root.appendChild(jsonInput);
    jsonInputCtl.textarea.value = JSON.stringify([
        {call: 'arraySplit', key:' '},
        {call: 'store', key:'${key1}', source: {call:'arrayPick', idx:0}},
        {call: 'store', key:'${key2}', source: {call:'arrayPick', idx:1}},
        {call: 'store', key:'${key3}', source: {call:'arrayPick', idx:2}},
        {call: 'array', array:['Fixed Prefix', '${key3}', '${key2}', '${key1}', 'Fixed Suffix']},
        {call: 'arrayJoin', 'key': ' > '}
      ]);

    let [evaluateBox, evaluateCtl] = ui.submitButton("Evaluate", jsonInputCtl.textarea);
    root.appendChild(evaluateBox);
    evaluateCtl.put('click', async () => {
        const ptp = jsonInputCtl.asJson();
        const source = samplerCtl.value();
        const result = await Comm.send('evaluate', {ptp, source});
        rawDisplayCtl.show('Success', result);
    });
    
}

class UI {


    jsonInput(name) {
        let box = document.createElement('div');
        let label = document.createElement('span');
        let textarea = document.createElement('textarea');

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
        return new Promise( (resolve, reject) => {
            let ajax = new XMLHttpRequest();

            ajax.onreadystatechange = e => {
                if (ajax.readyState == 1 /* OPEN */) {
                    ajax.setRequestHeader('Content-Type','application/json');
                    ajax.send(JSON.stringify(payload));
                }
                else if (ajax.readyState == 4) {
                    if (ajax.status == 200) {
                        try {
                            resolve(JSON.parse(ajax.responseText));
                        }
                        catch(e) {
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