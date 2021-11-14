import React, { useState } from 'react';

/*Pair*/
let iveeBroseBLEDeviceName = 'IVEE'

/*Discover*/
let iveeBleErrUrl

/*Connect*/
let iveeBroseBLEServer
let iveeBroseBLEPrimaryService
let iveeBroseBLECharacteristic
let iveeBroseBLECharacteristicUuid = parseInt(0xFFE1);
let iveeBroseBLEServiceUuid = parseInt(0xFFE0);

/*Page Checking*/
let iveeAppHomeUrl
let iveeCurrentURL
let iveeBroseHomeUrl
let bleDevice
let bleConnection

/*Local Storage*/
let broseLocalStorageLabel

/*Handle Inactivity*/
let timeoutId
let timeoutInMiliseconds




const BluetoothPair = () => {

  /** 
 * 1 - Bluetooth 
 */

  // Check if Browser supports required experimental chrome bluetooth features
  function iveeBrowserHasBluetooth(quiet = true) {
    if (navigator.bluetooth) {
      if (!quiet) {
        console.log(`[Ivee Kiosk App] Web Bluetooth API is available!`);
      }
      return true;
    } else {
      if (!quiet) {
        console.log(`[Ivee Kiosk App] Web Bluetooth API is not available.\n Please make sure the "Experimental Web Platform features" flag is enabled.`);
      }
      return false;
    }
  }

  /**
  * Pair - Display a Chooser to pair with the Ivee BLE device
  */

  async function iveePairBluetooth(quiet = false) {
console.log("pairing")
    try {
      const bleServices = [0xFFE0];

      if (!quiet) {
        console.log(`[Ivee Kiosk App] Requesting bluetooth devices...`);
      }

      if (iveeBroseBLEDeviceName === 'My BLE Tester') { // iOS App
        const device = await navigator.bluetooth.requestDevice({
          filters: [
            { name: iveeBroseBLEDeviceName },
          ],
          acceptAllDevices: false,
        });
        if (!quiet) {
          console.log(`[Ivee Kiosk App] Paired with device: ${device.name}`);
        }
        return device;
      } else {
        const device = await navigator.bluetooth.requestDevice({
          filters: [
            { services: bleServices },
          ],
          acceptAllDevices: false,
        });
        if (!quiet) {
          console.log(`[Ivee Kiosk App] Paired with device: ${device.name}`);
        }
        return device;
      }

    } catch (error) {
      if (!quiet) {
        console.log(`[Ivee Kiosk App] ${error}`);
      }
      return false;
    }

  }

  /** 
  * Discover - Look for an existing BLE Device
  */

  async function iveeGetBLEDevice(quiet = false) {

    try {
      if (!quiet) {
        console.log(`[Ivee Kiosk App] Looking for existing BLE device like "${iveeBroseBLEDeviceName}".`);
      }

      let bluetoothDevices = await navigator.bluetooth.getDevices();
      let bluetoothDeviceFound = false;

      for (const device of bluetoothDevices) {
        let deviceToUpper = device.name.toUpperCase();
        if (deviceToUpper.includes(iveeBroseBLEDeviceName.toUpperCase())) {
          if (!quiet) {
            console.log(`[Ivee Kiosk App] BLE device like "${iveeBroseBLEDeviceName}" was found.`);
          }
          bluetoothDeviceFound = true;
          return device;
        }
      }

      if (!bluetoothDeviceFound) {
        // window.location.replace(iveeBleErrUrl);
        throw new Error(`[Ivee Kiosk App] BLE device like "${iveeBroseBLEDeviceName}" was not found.`);
      }

    } catch (error) {
      if (!quiet) {
        console.log(`[Ivee Kiosk App] Argh! ` + error);
      }
      // window.location.replace(iveeBleErrUrl);
    }
  }

  /** 
  * Connect - Connect to a BLE Device
  */

  async function iveeConnectBLEDevice(device, broseDelayVal, broseModeVal, broseIntensityVal, broseTimeoutVal, broseRedirectVal, quiet = true) {

    const abortController = new AbortController();

    device.addEventListener('advertisementreceived', async (event) => {

      if (!quiet) {
        console.log(`[Ivee Kiosk App] Received advertisement from ${device.name}`);
      }
      abortController.abort(); // Stop watching advertisements to conserve battery life.
      if (!quiet) {
        console.log(`[Ivee Kiosk App] Trying to connect to GATT server from ${device.name}`);
      }
      try {
        iveeBroseBLEServer = await device.gatt.connect();
        if (!quiet) {
          console.log(`[Ivee Kiosk App] Connect to ${device.name}`);
        }

        iveeBroseBLEPrimaryService = await iveeBroseBLEServer.getPrimaryService(iveeBroseBLEServiceUuid);
        if (!quiet) {
          console.log(`[Ivee Kiosk App] Primary Service: ${iveeBroseBLEPrimaryService}`);
        }

        iveeBroseBLECharacteristic = await iveeBroseBLEPrimaryService.getCharacteristic(iveeBroseBLECharacteristicUuid);
        if (!quiet) {
          console.log(`[Ivee Kiosk App] Char: ${iveeBroseBLECharacteristic}`);
        }

        await iveeBroseCommand(iveeBroseBLECharacteristic, broseDelayVal, broseModeVal, broseIntensityVal, broseTimeoutVal, broseRedirectVal);

        return iveeBroseBLECharacteristic;

      } catch (error) {
        console.log(`[Ivee Kiosk App] Error: ${error}`);
      }
    }, { once: true });


    try {
      await device.watchAdvertisements({ signal: abortController.signal });
      if (!quiet) {
        console.log(`[Ivee Kiosk App] Watching advertisements from: ${device.name}`);
      }
    } catch (error) {
      if (!quiet) {
        console.log(`[Ivee Kiosk App] Could not watch advertisements: ${error}`);
      }

    }
  }

  async function iveeConnectExistingBLEDevice(device, broseDelayVal, broseModeVal, broseIntensityVal, broseTimeoutVal, broseRedirectVal, quiet = true) {

    try {
      iveeBroseBLEServer = await device.gatt.connect();
      if (!quiet) {
        console.log(`[Ivee Kiosk App] Connect to ${device.name}`);
      }

      iveeBroseBLEPrimaryService = await iveeBroseBLEServer.getPrimaryService(iveeBroseBLEServiceUuid);
      if (!quiet) {
        console.log(`[Ivee Kiosk App] Primary Service: ${iveeBroseBLEPrimaryService}`);
      }

      iveeBroseBLECharacteristic = await iveeBroseBLEPrimaryService.getCharacteristic(iveeBroseBLECharacteristicUuid);
      if (!quiet) {
        console.log(`[Ivee Kiosk App] Char: ${iveeBroseBLECharacteristic}`);
      }

      await iveeBroseCommand(iveeBroseBLECharacteristic, broseDelayVal, broseModeVal, broseIntensityVal, broseTimeoutVal, broseRedirectVal, quiet = false);
      return iveeBroseBLECharacteristic;

    } catch (error) {
      if (!quiet) {
        console.log(`${error}`);
        // window.location.replace(iveeBleErrUrl);
      }
    }
  }

  /** 
  * 2 - Page Checking
  */

  function iveeIsOnAppHome(quiet = true) {
    let response = false;
    if (iveeCurrentURL === iveeAppHomeUrl) {
      response = true;
    }
    if (!quiet) {
      console.log('[Ivee Kiosk App] On App Home Page? ' + response);
    }
    return response;
  }

  function iveeIsOnBroseHome(quiet = true) {
    let response = false;
    if (iveeBroseHomeUrl == iveeCurrentURL) {
      response = true;
    }
    if (!quiet) {
      console.log('[Ivee Kiosk App] On Brose Control Page? ' + response);
    }
    return response;
  }

  function iveeIsOnAdmin(quiet = true) {
    let response = false;
    if (iveeCurrentURL.includes('ivee-kiosk-admin')) {
      response = true;
    }
    if (!quiet) {
      console.log('[Ivee Kiosk App] In kiosk admin section? ' + response);
    }
    return response;
  }

  /** 
  * 3 - Progressive Web App PWA
  */

  // Progressive Web App - Service Worker
  async function iveeSetupPWAServiceWorker(iveeSiteUrl, quiet = true) {

    const serviceWorkerJsUrl = iveeSiteUrl + '/ivee-kiosk-app-service-worker.js';

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(serviceWorkerJsUrl, {
        scope: `/`
      })
        .then(function (registration) {
          if (!quiet) {
            console.log('[Ivee Kiosk App] PWA Registration successful, scope is:', registration.scope);
          }
        })
        .catch(function (error) {
          if (!quiet) {
            console.log('[Ivee Kiosk App] Service worker registration failed, error:', error);
          }
        });
    }
  }

  /** 
  * 4 - Local Storage 
  */

  // Get keep alive interval id from local storage
  function broseGetLocalStorageIntervalID() {
    let broseStatusIntervalID = localStorage.getItem(broseLocalStorageLabel);
    console.log(`[Ivee Kiosk App] Get Local storage is : ${broseStatusIntervalID}`);
    return broseStatusIntervalID;
  }

  // Set local storage to the keep alive interval id
  function broseSetLocalStorageIntervalID(setIntervalID) {
    let broseStatusIntervalID = broseGetLocalStorageIntervalID();
    if (broseStatusIntervalID === null) {
      const setItem = localStorage.setItem(broseLocalStorageLabel, setIntervalID);
      console.log(`[Ivee Kiosk App] Setting local storage (undefined expected): ${setItem}`);
      broseStatusIntervalID = broseGetLocalStorageIntervalID();
      console.log(`[Ivee Kiosk App] Local storage has been set to: ${broseStatusIntervalID}`);
    } else {
      console.log(`[Ivee Kiosk App] Local storage is already set to: ${broseStatusIntervalID}`);
    }
  }

  // Stop the keep alive function and unset local storage
  function broseUnsetLocalStorageIntervalID() {
    let broseStatusIntervalID = broseGetLocalStorageIntervalID();
    if (broseStatusIntervalID === null) {
      console.log(`[Ivee Kiosk App] Nothing to delete. Local storage is set to: ${broseStatusIntervalID}`);
    }
    if (broseStatusIntervalID !== null) {
      console.log(`[Ivee Kiosk App] Local storage interval id is set to: ${broseStatusIntervalID}`);
      const interval = window.clearInterval(broseStatusIntervalID);
      console.log(`[Ivee Kiosk App] Interval cleared (undefined expected): ${interval}`);
      const removeItem = localStorage.removeItem(broseLocalStorageLabel);
      console.log(`[Ivee Kiosk App] Local storage interval id has been unset (undefined expected): ${removeItem}`);
    }
  }

  /** 
  * 5 - Brose 
  */

  /**  
  * Brose Make Commands
  */

  async function iveeBroseCommand(broseDelayVal, broseModeVal, broseIntensityVal, broseTimeoutVal, broseRedirectVal, quiet = false) {

    // Brose settings varibales
    let broseModeArrKeyVal = false;
    let broseIntensityArrKeyVal = false;
    let broseDelayArrKeyVal = 0;

    // DO Command Word - Mode
    // 0x00 - Turn off system
    // 0x01 - Turn on system
    // 0x03 - Turn on with Snake
    // 0x05 - Turn on with Wave
    // 0x07 - Turn on with Haptic Feedback
    // 0x09 - Turn on with Audio Indirect

    switch (broseModeVal) {
      case 'turn-off':
        broseModeArrKeyVal = 0x00;
        break;
      case 'turn-on':
        broseModeArrKeyVal = 0x01;
        break;
      case 'turn-on-snake':
        broseModeArrKeyVal = 0x03;
        break;
      case 'turn-on-wave':
        broseModeArrKeyVal = 0x05;
        break;
      case 'turn-on-haptic':
        broseModeArrKeyVal = 0x07;
        break;
      case 'turn-on-audio-indir':
        broseModeArrKeyVal = 0x09;
        break;
      default:
        broseModeArrKeyVal = false;
    }

    // D1 Command Word - Delay
    broseDelayArrKeyVal = parseInt(broseDelayVal).toString(16);

    // D5 Command Word - Intensity
    // 0x00 - Level 0 Intensity
    // 0x01 - Level 1 Intensity
    // 0x02 - Level 2 Intensity
    // 0x03 - Level 3 Intensity
    // 0x04 - Level 4 Intensity
    // 0x05 - Level 5 Intensity
    // 0x06 - Level 6 Intensity
    // 0x07 - Level 7 Intensity
    // 0x08 - Level 8 Intensity
    // 0x09 - Level 9 Intensity

    switch (broseIntensityVal) {
      case 'level-0':
        broseIntensityArrKeyVal = 0x00;
        break;
      case 'level-1':
        broseIntensityArrKeyVal = 0x01;
        break;
      case 'level-haptic':
        broseIntensityArrKeyVal = 0x02;
        break;
      case 'level-3':
        broseIntensityArrKeyVal = 0x03;
        break;
      case 'level-4':
        broseIntensityArrKeyVal = 0x04;
        break;
      case 'level-5':
        broseIntensityArrKeyVal = 0x05;
        break;
      case 'level-6':
        broseIntensityArrKeyVal = 0x06;
        break;
      case 'level-7':
        broseIntensityArrKeyVal = 0x07;
        break;
      case 'level-8':
        broseIntensityArrKeyVal = 0x08;
        break;
      case 'level-9':
        broseIntensityArrKeyVal = 0x09;
        break;
      default:
        broseIntensityArrKeyVal = false;
    }

    const encoder = new TextEncoder('utf-8');

    // Encode LIN Break Signal Controls
    const resetShifter = encoder.encode('AT+PIOB0');
    const resetClock = encoder.encode('5');
    const armShifter = encoder.encode('AT+PIOB1');

    // Define LIN 10 byte command array
    const linComm = new ArrayBuffer(13);
    const commView = new Uint8Array(linComm);

    // Populate LIN 10 byte command array
    commView[0] = 0x55;  // Break signal clocking
    commView[1] = 0x05;  // Break signal clocking
    commView[2] = 0x55;  // Sync signal 
    commView[3] = 0xa8;  // PID - Command 40 Command Slave Device
    commView[4] = broseModeArrKeyVal; // DO - On/Off + Mode
    commView[5] = broseDelayArrKeyVal;  // D1 - Fixed was 0xff;
    commView[6] = 0xff;  // D2 - Fixed
    commView[7] = 0xff;  // D3 - Fixed
    commView[8] = 0xff;  // D4 - Fixed
    commView[9] = broseIntensityArrKeyVal; // D5 - Intensity
    commView[10] = 0xff; // D6 - Fixed
    commView[11] = 0xff; // D7 - Fixed
    commView[12] = broseLinChecksum(commView.slice(3, 12)); // Checksum - Calculated (commView[3] to commView[11] (inclusive))

    try {
      if (!iveeBroseBLECharacteristic) {
        throw new Error('No characteristic has been set.');
      }
      if (!quiet) {
        console.log(`[Ivee Kiosk App] Trying to send command... ${broseModeVal}, ${broseIntensityVal}, intensity: ${broseDelayVal}`);
        console.log('[Ivee Kiosk App] Initializing LIN Break Signal...');
        console.log('[Ivee Kiosk App] Checksum: ' + commView[12]);
      }

      // Run each of the following functions sequentially

      // Reset Shifter
      setTimeout(() => {
        iveeBroseBLECharacteristic.writeValueWithoutResponse(resetShifter);
        if (!quiet) {
          console.log('[Ivee Kiosk App] Reset Shifter... ');
        }
      }, 100);

      // Reset Clock
      setTimeout(() => {
        iveeBroseBLECharacteristic.writeValueWithoutResponse(resetClock);
        if (!quiet) {
          console.log('[Ivee Kiosk App] Reset Clock... ');
        }
      }, 200);

      // Arm Shifter
      setTimeout(() => {
        iveeBroseBLECharacteristic.writeValueWithoutResponse(armShifter);
        if (!quiet) {
          console.log('[Ivee Kiosk App] Arm Shifter... ');
        }
      }, 300);

      // Send command
      setTimeout(() => {
        iveeBroseBLECharacteristic.writeValueWithoutResponse(commView);
        if (!quiet) {
          console.log('[Ivee Kiosk App] Sending command ' + commView);
        }
      }, 400);

      // Keep alive

      /*
      console.log('[Ivee Kiosk App] Starting keep alive... ');
      setTimeout(() => {
        const commandPID = commView[3]; // 0xa8
        iveeBroseKeepAlive(commandPID, iveeBroseBLECharacteristic);
        iveeBroseKeepAlive(broseKeepAliveInterval = 10000, broseKeepAliveQuitInterval = 5 * 6000, checkExistingLocalStorage = true, iveeBroseBLECharacteristic);
      }, 500);
      */

      /*
      if( broseRedirectVal != 'false' ) {
        setTimeout(() => {
          window.location.href = broseRedirectVal;
        }, broseTimeoutVal);
      }
      */

      return true;

    } catch (error) {
      console.log(`[Ivee Kiosk App] ${error}`);
      return false;
    }
  }

  //  Brose Keep Alive Intervals
  //  broseKeepAliveInterval = 1000; // How often the keep alive command is sent
  //  broseKeepAliveQuitInterval = 5 * 60000; // Stop the keep alive command after this amount of time

  async function iveeBroseKeepAlive(broseKeepAliveInterval = 10000, broseKeepAliveQuitInterval = 5 * 6000, checkExistingLocalStorage = true, iveeBroseBLECharacteristic) {

    // Get Out if local storage keep alive is not set
    const localStorageIntervalID = broseGetLocalStorageIntervalID();
    if (localStorageIntervalID === null && checkExistingLocalStorage) {
      // return;
    }

    const startTime = new Date().getTime();
    const setIntervalID = window.setInterval(function () {
      let timeCalc = new Date().getTime() - startTime;
      if (timeCalc > broseKeepAliveQuitInterval) {
        broseUnsetLocalStorageIntervalID();
        return;
      } else {
        broseKeepAliveCommand(timeCalc, broseKeepAliveQuitInterval, iveeBroseBLECharacteristic);
      }
    }, broseKeepAliveInterval);

    if (setIntervalID !== null) {
      // Set local storage to monitor keep alive function
      broseUnsetLocalStorageIntervalID(); // Unset local storage if it exists
      broseSetLocalStorageIntervalID(setIntervalID); // Set local storage to the current setIntervalID
      console.log('[Ivee Kiosk App] Keep alive process id... ' + setIntervalID);
    } else {
      console.log('[Ivee Kiosk App] There was a problem initiating the Keep Alive function.');
    }
  }

  // Brose Keep Alive Command
  function broseKeepAliveCommand(timeCalc, broseKeepAliveQuitInterval, iveeBroseBLECharacteristic) {
    // Read & keep alive signal Array
    const broseKADataBufferArr = new ArrayBuffer(4);
    const broseKAUint8Arr = new Uint8Array(broseKADataBufferArr);
    broseKAUint8Arr[0] = 0x55; // Break signal clocking
    broseKAUint8Arr[1] = 0x05; // Break signal clocking
    broseKAUint8Arr[2] = 0x55; // Sync signal 
    broseKAUint8Arr[3] = 0xa8; // PID - Command 41 Read from Slave 0xa8

    // Encode LIN Break Signal Controls
    const encoder = new TextEncoder('utf-8');
    const resetShifter = encoder.encode('AT+PIOB0');
    const resetClock = encoder.encode('5');
    const armShifter = encoder.encode('AT+PIOB1');

    console.log('[Ivee Kiosk App] Keeping alive... Press Stop button to end this.');

    // Reset Shifter
    setTimeout(() => {
      console.log('[Ivee Kiosk App] > Timer: ' + timeCalc + ' of ' + broseKeepAliveQuitInterval);
      console.log('[Ivee Kiosk App] > Reset Shifter (Keep Alive)...');
      iveeBroseBLECharacteristic.writeValueWithoutResponse(resetShifter);
    }, 100);

    // Reset Clock
    setTimeout(() => {
      console.log('[Ivee Kiosk App] > Reset Clock (Keep Alive)...');
      iveeBroseBLECharacteristic.writeValueWithoutResponse(resetClock);
    }, 200);

    // Arm Shifter
    setTimeout(() => {
      console.log('[Ivee Kiosk App] > Arm Shifter (Keep Alive)... ');
      iveeBroseBLECharacteristic.writeValueWithoutResponse(armShifter);
    }, 300);

    setTimeout(() => {
      console.log('[Ivee Kiosk App] > Main Keep Alive Command... ');
      console.log('[Ivee Kiosk App] > Sending command ' + broseKAUint8Arr);
      iveeBroseBLECharacteristic.writeValueWithoutResponse(broseKAUint8Arr);
    }, 400);
  }

  // Brose LIN Checksum
  function broseLinChecksum(data) {
    var sum = 0x0000;
    var check = new ArrayBuffer(1);
    const checksum = new Uint8Array(check);
    checksum[0] = 0x00;
    for (var i = 0; i < data.length; i++) {
      sum += data[i];
      if (sum >= 0x0100) {
        sum = sum + 1;
        sum = (sum & 0x00FF);
      }
    }
    checksum[0] = (sum ^ 0xFF)
    return checksum[0];
  }

  // Get Brose Shortcode Params

  function iveeGetCommandVals(broseDataEl) {
    let commandVals = [];
    commandVals['broseDelayVal'] = broseDataEl.dataset.delay;
    commandVals['broseModeVal'] = broseDataEl.dataset.mode;
    commandVals['broseInitModeVal'] = broseDataEl.dataset.initmode;
    commandVals['broseIntensityVal'] = broseDataEl.dataset.intensity;
    commandVals['broseTimeoutVal'] = broseDataEl.dataset.timeout;
    commandVals['broseRedirectVal'] = broseDataEl.dataset.redirect;
    commandVals['broseYouTubeVidID'] = broseDataEl.dataset.ytvidid;

    // Set local storage values
    localStorage.setItem("ivee-ls-brose-delay-val", broseDataEl.dataset.delay);
    localStorage.setItem("ivee-ls-brose-mode-val", broseDataEl.dataset.mode);
    localStorage.setItem("ivee-ls-brose-int-val", broseDataEl.dataset.intensity);

    return commandVals;
  }

  /** 
  * 6 - console.log stuff on screen
  */

  // const ChromeDebug = document.querySelector('#chrome-debug-output');

  // if (ChromeDebug !== null) {
  //   var ChromeSamples = {
  //     console.log: function () {
  //       let line = Array.prototype.slice.call(arguments).map(function (argument) {
  //         return typeof argument === 'string' ? argument : JSON.stringify(argument);
  //       }).join(' ');

  //       document.querySelector('#console.log').textContent += line + '\n';
  //     },

  //     clearconsole.log: function () {
  //       document.querySelector('#console.log').textContent = '';
  //     },

  //     setStatus: function (status) {
  //       document.querySelector('#status').textContent = status;
  //     },

  //     setContent: function (newContent) {
  //       const content = document.querySelector('#content');
  //       while (content.hasChildNodes()) {
  //         content.removeChild(content.lastChild);
  //       }
  //       content.appendChild(newContent);
  //     }
  //   };
  //   console.log = ChromeSamples.console.log;
  //   clearconsole.log = ChromeSamples.clearconsole.log;
  // } else {
  //   var ChromeSamples = {
  //     console.log: function () {
  //       return;
  //     },
  //     clearconsole.log: function () {
  //       return;
  //     }
  //   }
  //   console.log = ChromeSamples.console.log;
  //   clearconsole.log = ChromeSamples.clearconsole.log;
  // }

  /** 
  * 7 - Global Functions
  */

  /** 
  * Generic set timeout function
  */
  function iveeKioskAppWait(ms = 0) {
    return new Promise(function (resolve, reject) {
      setTimeout(resolve, reject, ms);
    });
  }

  /** 
  * Generic get location function
  */
  function iveeKioskAppGetLocation() {
    let options = {
      enableHighAccuracy: true,
      timeout: 1000,
      maximumAge: 0
    };

    return new Promise(function (resolve, reject) {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
  }

  /** 
  * Handle Inactivity
  */

  // function iveeStartTimer() {
  //   // window.setTimeout returns an Id that can be used to start and stop a timer
  //   timeoutId = window.setTimeout(iveeDoInactive, timeoutInMiliseconds)
  // }

  // function iveeResetTimer() {
  //   window.clearTimeout(timeoutId);
  //   iveeStartTimer();
  // }



  const pair = async () => {
    console.log("connecting")

    try {
      bleDevice = await iveePairBluetooth()
      // bleConnection = await iveeConnectBLEDevice(bleDevice, '0', 'turn-on', 'level-1', '0', true)
      return true
    } catch (err) {
      console.log(err)
      return false
    }

  }

  const connect = async () => {
    console.log("connecting")

    try {
      bleDevice = await iveeGetBLEDevice()
      bleConnection = await iveeConnectBLEDevice(bleDevice, '0', 'turn-on', 'level-1', '0', true)
      return true
    } catch (err) {
      console.log(err)
      return false
    }

  }


  return (
    <div style={{ hieght: '100px', width: '100px' }}>
      <button onPointerUp={(event) => connect(event)}> Connect </button>
      <button onPointerUp={(event) => pair(event)}> Pair </button>
    </div>
  )
};

export default BluetoothPair;