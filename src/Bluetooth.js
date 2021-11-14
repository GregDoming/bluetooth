import React, { useState } from 'react';

const Bluetooth = () => {
    let deviceCache = null;
    let characteristicCache = "0x03";
    let characteristic = "greg"
    let readBuffer = '';
    const [input, setInput] = useState("")
    const [characteristicSet, setCharacteristicSet] = useState("");

    const connect = async () => {
        console.log("connecting")
        if (deviceCache) {
            try {
                const cache = await deviceCache
                return cache
            } catch (err) {
                console.log(err)
            }
        } else {
            try {
                const device = await requestBluetoothDevice();
                const characteristic = await connectDeviceAndCacheCharacteristic(device);
                const cache = await startNotifications(characteristic)
                return cache
            } catch (err) {
                console.log(err)
            }
        }
    }

    const receive = (data) => {
        console.log(data, 'in')
    }

    const send = (event) => {
        event.preventDefault()
        // data = String(data);
        console.log(characteristicSet)
        // console.log(data)

        // if (!data || !characteristicCache) {
        //     return;
        // }

        // writeToCharacteristic(characteristicCache, data);
        // characteristic.writeValueWithoutResponse(new TextEncoder().encode(data))
        // console.log(data, 'out');
    }

    const writeToCharacteristic = (characteristic, data) => {
        characteristic.writeValue(new TextEncoder().encode(data));

    }

    const handleDisconnection = async (event) => {
        let device = event.target;
        console.log('"' + device.name + '" bluetooth device disconnected, trying to reconnect...')
        try {
            const characteristic = connectDeviceAndCacheCharacteristic(device)
            const returnValue = startNotifications(characteristic)
            return returnValue
        } catch (err) {
            console.log(err)
        }
    }

    const disconnect = () => {
        if (deviceCache) {
            console.log('Disconnecting from "' + deviceCache.name + '" bluetooth device...')
            deviceCache.removeEventListener('gattserverdisconnected', handleDisconnection);
            if (deviceCache.gatt.connected) {
                deviceCache.gatt.disconnect();
                console.log('"' + deviceCache.name + '" bluetooth device disconnected');
            } else {
                console.log('"' + deviceCache.name + '" bluetooth device is already disconnected')
            }
        }
        // Added condition
        if (characteristicCache) {
            characteristicCache.removeEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);
            characteristicCache = null;
        }
        deviceCache = null;
    }

    const handleCharacteristicValueChanged = (event) => {
        let value = new TextDecoder().decode(event.target.value);
        for (let c of value) {
            if (c === '\n') {
                let data = readBuffer.trim();
                readBuffer = '';

                if (data) {
                    receive(data);
                }
            }
            else {
                readBuffer += c;
            }
        }
    }

    const startNotifications = async (characteristic) => {
        console.log("Starting Notifications")
        const characteristicReturn = await characteristic.startNotifications()
        console.log("notifications started")
        characteristic.addEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);
        return characteristicReturn
    }

    const handleFormChange = (event) => {
        setInput(event.target.value)
        console.log(input)
    }

    // const handleFormSubmit = (event) => {
        
    //     event.preventDefault(); // Prevent form sending
    //     send(input)
    //     setInput('')
    //     // send(inputField.value); 
    //     // inputField.value = '';  
    //     // inputField.focus(); 
    // }

    const requestBluetoothDevice = async () => {
        console.log("requesting device...")
        try {
            const device = await navigator.bluetooth.requestDevice({
                filters: [{ services: ['battery_service'] }],
            })
            console.log("" + device.name + "bluetooth device selected")
            deviceCache = device;
            // Added line
            deviceCache.addEventListener('gattserverdisconnected', handleDisconnection);
            return deviceCache
        } catch (err) {
            console.log(err)
        }
    }

    const connectDeviceAndCacheCharacteristic = async (device) => {
        if (device.gatt.connected && characteristicCache) {
            return Promise.resolve(characteristicCache);
        }

        console.log("Connecting to Gatt server...")
        const server = await device.gatt.connect()
        console.log('GATT server connected, getting service...')
        const service = await server.getPrimaryService('battery_service')
        console.log('Service found, getting characteristic...')
        characteristic = await service.getCharacteristic('battery_level')
        setCharacteristicSet(characteristic)
        console.log(characteristicSet)
        console.log(characteristic)
        console.log('Characteristic found');
        return characteristic
    }

    // const log = (data, type = '') => {
    //     terminalContainer.insertAdjacentHTML('beforeend',
    //         '<div' + (type ? ' class="' + type + '"' : '') + '>' + data + '</div>');
    // }
    return (
        <div>
            <button id="connect" onClick={() => connect()}>Connect</button>
            <button id="disconnect" onClick={disconnect}>Disconnect</button>
            <button id="terminal">terminal</button>
            <form onSubmit={(event) => send(event)}>
                <input onChange={event => handleFormChange(event)} id="input" type="text" value={input}/>
                <button type="submit">Send form</button>
            </form>
        </div>
    )
}

export default Bluetooth

// let connectButton = document.getElementById('connect');
// let disconnectButton = document.getElementById('disconnect');
// let terminalContainer = document.getElementById('terminal');
// let sendForm = document.getElementById('send-form');
// let inputField = document.getElementById('input');

// Connect to the device on Connect button click
// connectButton.addEventListener('click', function () {
//     connect();
// });

// Disconnect from the device on Disconnect button click
// disconnectButton.addEventListener('click', function () {
//     disconnect();
// });

// Handle form submit event
// sendForm.addEventListener('submit', function (event) {
//     event.preventDefault(); // Prevent form sending
//     send(inputField.value); // Send text field contents
//     inputField.value = '';  // Zero text field
//     inputField.focus();     // Focus on text field
// });


// let deviceCache = null;

// Enable the characteristic changes notification
// function startNotifications(characteristic) {
//     log('Starting notifications...');

//     return characteristic.startNotifications().
//         then(() => {
//             log('Notifications started');
//             // Added line
//             characteristic.addEventListener('characteristicvaluechanged',
//                 handleCharacteristicValueChanged);
//         });
// }



// Connect to the device specified, get service and characteristic
// function connectDeviceAndCacheCharacteristic(device) {
//     if (device.gatt.connected && characteristicCache) {
//         return Promise.resolve(characteristicCache);
//     }

//     log('Connecting to GATT server...');

//     return device.gatt.connect().
//         then(server => {
//             log('GATT server connected, getting service...');

//             return server.getPrimaryService(0xFFE0);
//         }).
//         then(service => {
//             log('Service found, getting characteristic...');

//             return service.getCharacteristic(0xFFE1);
//         }).
//         then(characteristic => {
//             log('Characteristic found');
//             characteristicCache = characteristic;

//             return characteristicCache;
//         });
// }



// Connect to the device specified, get service and characteristic
// Characteristic object cache
// let characteristicCache = "0x03";



// Output to terminal
// function log(data, type = '') {
//     terminalContainer.insertAdjacentHTML('beforeend',
//         '<div' + (type ? ' class="' + type + '"' : '') + '>' + data + '</div>');
// }

// function handleDisconnection(event) {
//     let device = event.target;

//     log('"' + device.name +
//         '" bluetooth device disconnected, trying to reconnect...');

//     connectDeviceAndCacheCharacteristic(device).
//         then(characteristic => startNotifications(characteristic)).
//         catch(error => log(error));
// }

// async function requestBluetoothDevice() {
//     log('Requesting bluetooth device...');

//     return navigator.bluetooth.requestDevice({
//         filters: [{ services: [0xFFE0] }],
//     }).
//         then(device => {
//             log('"' + device.name + '" bluetooth device selected');
//             deviceCache = device;

//             // Added line
//             deviceCache.addEventListener('gattserverdisconnected',
//                 handleDisconnection);

//             return deviceCache;
//         });
// }

// Launch Bluetooth device chooser and connect to the selected
// function connect() {
//     return (deviceCache ? Promise.resolve(deviceCache) :
//         requestBluetoothDevice()).
//         then(device => connectDeviceAndCacheCharacteristic(device)).
//         then(characteristic => startNotifications(characteristic)).
//         catch(error => log(error));
// }







    // Intermediate buffer for incoming data
    // let readBuffer = '';

    // // Data receiving
    // function handleCharacteristicValueChanged(event) {
    //     let value = new TextDecoder().decode(event.target.value);

    //     for (let c of value) {
    //         if (c === '\n') {
    //             let data = readBuffer.trim();
    //             readBuffer = '';

    //             if (data) {
    //                 receive(data);
    //             }
    //         }
    //         else {
    //             readBuffer += c;
    //         }
    //     }
    // }

    // function disconnect() {
    //     if (deviceCache) {
    //         log('Disconnecting from "' + deviceCache.name + '" bluetooth device...');
    //         deviceCache.removeEventListener('gattserverdisconnected',
    //             handleDisconnection);

    //         if (deviceCache.gatt.connected) {
    //             deviceCache.gatt.disconnect();
    //             log('"' + deviceCache.name + '" bluetooth device disconnected');
    //         }
    //         else {
    //             log('"' + deviceCache.name +
    //                 '" bluetooth device is already disconnected');
    //         }
    //     }

    //     // Added condition
    //     if (characteristicCache) {
    //         characteristicCache.removeEventListener('characteristicvaluechanged',
    //             handleCharacteristicValueChanged);
    //         characteristicCache = null;
    //     }

    //     deviceCache = null;
    // }

    // Received data handling
    // function receive(data) {
    //     log(data, 'in');
    // }

    // function send(data) {
    //     data = String(data);

    //     if (!data || !characteristicCache) {
    //         return;
    //     }

    //     writeToCharacteristic(characteristicCache, data);
    //     log(data, 'out');
    // }

    // function writeToCharacteristic(characteristic, data) {
    //     characteristic.writeValue(new TextEncoder().encode(data));
    // }