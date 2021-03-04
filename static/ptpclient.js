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
            console.log(`Failed: ${resp.failed}`);
        }
        else {
            console.log(Success, resp.parsed);
        }
    })
    root.appendChild(sendSample);
}

class UI {
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