window.addEventListener('DOMContentLoaded', function() {
  var actionLock = false,
      enableImeiActions = (Wallace.getSystemProperty('ro.product.brand') === 'Nokia'),
      enableSim2Actions = (Wallace.getSystemProperty('persist.radio.multisim.config') === 'dsds'),
      enableQualcommActions = (Wallace.getSystemProperty('ro.hardware') === 'qcom'),
      currentKaiosVersion = Wallace.getSystemPreference('b2g.version'),
      enableCallRecordingActions = (parseInt(currentKaiosVersion.replace(/[^\d]/g,'')) >= 25)
  
  if(!enableImeiActions)
    [].forEach.call(document.querySelectorAll('.nokiaonly'), function(el) {
      el.classList.remove('danger')
      el.classList.add('disabled')
    })

  if(!enableSim2Actions)
    [].forEach.call(document.querySelectorAll('.sim2only'), function(el) {
      el.classList.remove('danger')
      el.classList.add('disabled')
    })

  if(!enableQualcommActions)
    [].forEach.call(document.querySelectorAll('.qualcommonly'), function(el) {
      el.classList.remove('danger')
      el.classList.add('disabled')
    })

  if(!enableCallRecordingActions)
    document.querySelector('.callrec').classList.add('enabled')
  
  var overclockScript = [
    'echo 96 > /sys/devices/system/cpu/cpufreq/interactive/target_loads',
    'echo 1094400 > /sys/devices/system/cpu/cpufreq/interactive/hispeed_freq',
    'echo 24 > /sys/devices/system/cpu/cpufreq/interactive/go_hispeed_load',
    'echo 0 > /sys/module/msm_thermal/core_control/enabled'
  ].join(' && ')
  
  var rootingScript = [
    'mount -o remount,rw /',
    'sleep 0.5',
    'stop adbd',
    'mv /sbin/adbd /sbin/adbd.orig',
    'mv /data/local/tmp/adbd /sbin/adbd',
    'chown root:root /sbin/adbd && chmod 750 /sbin/adbd',
    'mount -o remount,ro /',
    'sleep 0.5',
    'start adbd'
  ].join(' && ')
  
  window.addEventListener('keydown', function(e) {
    if(!actionLock) {
      switch(e.key) {
        case '1': //enable ADB root access until reboot
          Wallace.extractAppAsset('wallace-toolbox.bananahackers.net', 'rsrc/adbd.bin', '/data/local/tmp/adbd', function() {  
            Wallace.runCmd(rootingScript, function() {
              window.alert('Rooted ADB access until reboot')
            }, function() {
              window.alert('Something went wrong: ' + this.error.name)
            })
          })
          break
        case '#': //call recording AUTO/ON/OFF
          if(enableCallRecordingActions) {
            Wallace.getSystemSetting('callrecording.mode', function(curMode) {
              var nextMode = 'on'
              if(curMode === 'auto') nextMode = 'off'
              else if(curMode === 'on') nextMode = 'auto'
              Wallace.enableCallRecording(nextMode, 'mp3', function() {
                var msgs = {
                  'on': 'set to manual',
                  'auto': 'set to automatic',
                  'off': 'disabled'
                }
                window.alert('Call recording ' + msgs[nextMode])
              }, function(e) {
                window.alert('Error: ' + e)
              })
            }, function(e) {
              window.alert('Error: ' + e)
            })
          } else window.alert('Sorry, call recording is implemented in KaiOS 2.5. and above, but you have ' + currentKaiosVersion)
          break
        case '3': //install app package
          actionLock = true
          var pickPackage = new MozActivity({name: "pick"})
          pickPackage.onsuccess = function() {
            Wallace.installPkg(this.result.blob, function() {
              window.alert('App ' + pickPackage.result.blob.name + ' successfully installed')
              actionLock = false
            }, function(e) {
              if(e.toString() === 'InvalidPrivilegeLevel')
                window.alert('Insufficient privileges. You must perform developer factory reset (#) before trying to install packages.')
              else
                window.alert('Error installing the package file: ' + e)
              actionLock = false
            })
          }
          pickPackage.onerror = function(e) {
            window.alert('Error picking the package file: ' + e.name)
            actionLock = false
          }
          break
        case '2': //override TTL
          actionLock = true
          var newTTL = parseInt(window.prompt('New TTL value', 64))
          if(newTTL && newTTL < 256) {
            Wallace.fixTTL(newTTL, function() {
              window.alert('TTL fixed at the value ' + newTTL + ' until reboot')
              actionLock = false
            }, function(e) {
              window.alert('Error: ' + e)
              actionLock = false
            })
          }
          else {
            window.alert('Invalid TTL value')
            actionLock = false
          }
          break
        case '5': //Edit IMEI1
          if(enableImeiActions) {
            if(window.confirm('Are you sure you really want to change IMEI1?')) {
              var newIMEI = window.prompt('New IMEI1', Wallace.generateRandomIMEI())
              actionLock = true
              Wallace.setJiophoneIMEI(1, newIMEI, function() {
                if(window.confirm('IMEI1 changed to ' + newIMEI + '. Reboot to apply?'))
                  Wallace.reboot()
                actionLock = true
              }, function(e) {
                window.alert('Error: invalid IMEI')
                actionLock = false
              })
            }
          } else window.alert('Error: IMEI editor is implemented for Jiophone handsets only')
          break
        case '6': //Edit IMEI2
          if(enableImeiActions) {
            if(enableSim2Actions) {
              if(window.confirm('Are you sure you really want to change IMEI2?')) {
                var newIMEI = window.prompt('New IMEI2', Wallace.generateRandomIMEI())
                actionLock = true
                Wallace.setNokiaIMEI(2, newIMEI, function() {
                  if(window.confirm('IMEI2 changed to ' + newIMEI + '. Reboot to apply?'))
                    Wallace.reboot()
                  actionLock = false
                }, function(e) {
                  window.alert('Error: invalid IMEI')
                  actionLock = false
                })
              }
            } else window.alert('Error: trying to change IMEI2 on a single-SIM configuration')
          } else window.alert('Error: IMEI editor is implemented for Nokia handsets only')
          break
        case '7': //Proxy on/off
          Wallace.getSystemSetting('browser.proxy.enabled', function(res) {
            var newVal = !(res === true)
            Wallace.setSystemSetting('browser.proxy.enabled', newVal, function() {
              window.alert('Proxy ' + (newVal ? 'enabled' : 'disabled') + ' successfully')
            }, function(e) {
              window.alert('Error ' + (newVal ? 'enabling' : 'disabling') + ' proxy: ' + e)
            })
          }, function(e) {
            window.alert('Error: ' + e)
          })
          break
        case '8': //Set proxy host/port
          actionLock = true
          Wallace.getSystemSetting('browser.proxy.host', function(oldHost) {
            Wallace.getSystemSetting('browser.proxy.port', function(oldPort) {
              var newHost = window.prompt('Proxy host', oldHost || '')
              var newPort = Number(window.prompt('Proxy port', oldPort || ''))
              if(newHost && newPort) {
                Wallace.setSystemSetting('browser.proxy.host', newHost, function() {
                  Wallace.setSystemSetting('browser.proxy.port', newPort, function() {
                    window.alert('Proxy set successfully')
                    actionLock = false
                  }, function(e) {
                    window.alert('Error setting proxy port: ' + e)
                    actionLock = false
                  })
                }, function(e) {
                  window.alert('Error setting proxy host: ' + e)
                  actionLock = false
                })
              }
              else {
                window.alert('Error: Cannot set empty values for host or port')
                actionLock = false
              }
            }, function(e) {
              window.alert('Error: ' + e)
              actionLock = false
            })
          }, function(e) {
            window.alert('Error: ' + e)
            actionLock = false
          })
          break
        case '9': //override the user agent
          if(window.confirm('Do you want to change the user agent? You will not be able to revert it without WebIDE or factory reset!')) {
            actionLock = true
            var newUA = window.prompt('User agent', navigator.userAgent)
            if(newUA === '') newUA = navigator.userAgent
            Wallace.setUserAgent(newUA)
            actionLock = true
          }
          break
        case '*': //run overclock script
           actionLock = true
           Wallace.runCmd(overclockScript, function() {
             window.alert('Overclocking until reboot')
             actionLock = false
           }, function(e) {
             window.alert('Error: ' + e)
             actionLock = false
           })
          break
        case '0': //toggle diag port
          if(enableQualcommActions) {
            Wallace.toggleDiagPort(function() {
              window.alert('Diagnostics port enabled')
            }, function() {
              window.alert('Diagnostics port disabled')
            }, function(e) {
              window.alert('Error toggling diag port: ' + e)
            })
          }
          else window.alert('Error: DIAG port can be used on Qualcomm platform only')
          break
        case '4': //developer reset
          if(window.confirm('Perform a privileged factory reset? All data will be lost!'))
            Wallace.privilegedFactoryReset()
          break
        default:
          break
      }
    }
  })
}, true)
