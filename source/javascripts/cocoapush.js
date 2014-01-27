//singleton representing the CocoaPush webservice.
//If push notifications are not supported, returns 'NOT SUPPORTED'
//If push notifications have been requested and denied, returns 'NOT ALLOWED'
//Consumer of this singleton is responsible for updating UI in response to the former two cases
var CocoaPush = new function () {
    //param: callback taking permission data as parameter
    //return: null
    this.permissionData = function(cb) {
      var permissionData = ('safari' in window && 'pushNotification' in window.safari) ? window.safari.pushNotification.permission('web.org.cocoapods.push') : { permission: 'denied', deviceToken: null };
      if (permissionData.permission === 'default') {
          // This is a new web service URL and its validity is unknown.
          window.safari.pushNotification.requestPermission(
              'https://localhost:3000/push', // The web service URL.
              'web.org.cocoapods.push',     // The Website Push ID.
              {}, // Data that you choose to send to your server to help you identify the user.
              function (permission) { // The callback function.
                  permissionData = permission; //update the object var with new info to fall through to bottom two cases
                  cb(permission);
              }
          );
      } else {
          cb(permissionData);
      }
      return;
    };

    this.pods = [];
    var podsInitialized = false;
    // get pods. takes a callback which has one parameter, the array of pods
    this.getPods = function (cb) {
      if (!podsInitialized) {
        this.permissionData(function(permission) {
          $.get("https://localhost:3000/push/v1/settingsForDeviceToken/" + permission.deviceToken, null, null, 'JSON')
          .done(function(settings) {
            CocoaPush.pods = settings["pods"];
            podsInitialized = true;
            cb(CocoaPush.pods);
          })
          .fail(function() {
            cb(CocoaPush.pods);
          });
        });
      } else {
        cb(this.pods);
      }
    };

  //function to upload new pod settings array, and keep state of CocoaPush consistent
  //takes the array to upload, the array to store in case it fails, and a callback that is supplied with true or false depending on success or fail
  function uploadPodSettings(cb, newPodArray, oldPodArray) {
    CocoaPush.permissionData(function (permission) {
      $.ajax("https://localhost:3000/push/v1/settingsForDeviceToken/" + permission.deviceToken, //send up and
        {
          data: JSON.stringify({"pods": newPodArray}),
          type: 'POST',
          processData: false,
          error: function () {
            CocoaPush.pods = oldPodArray;
            cb(false);
          },
          success: function () {
            CocoaPush.pods = newPodArray;
            cb(true);
          }
        }
      )
    });
  }

  // add pod to remote webservice, update local cache
  // takes the pod name as a string, and a callback receiving a boolean value indicating whether it was successfully stored
  this.addPod = function (pod, cb) {
    this.getPods(function(pods) {
      if (pods.indexOf(pod) != -1) { //already present locally, so no worries
          cb(true);
      } else {
        var newPodArray = CocoaPush.pods.slice(0);
        newPodArray.push(pod);
        uploadPodSettings(cb, newPodArray, CocoaPush.pods.slice(0));
      }
      })
    };

    // remove pod from CocoaPush, update local cache
    // takes the pod name as a string, and a callback receiving a boolean value indicating whether it was successfully removed
    this.removePod = function (pod, cb) {
      this.getPods(function(pods) {
        if (pods.indexOf(pod) == -1) {
          cb(true);
        } else {
          var oldPodArray = CocoaPush.pods.slice(0);
          var newPodArray = oldPodArray.filter(function (obj) { return (obj !== pod); });
          uploadPodSettings(cb, newPodArray, oldPodArray);
        }
      })
    }

};
