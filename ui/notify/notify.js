module.exports = () => {

  function displayNotification(text, onclick) {
    var options = {
      body: text,
      requireInteraction: true
    }

    var n = new Notification("Scuttlebutt Chess", options);

    if (onclick) {
        n.onclick = onclick;
    }
  }

  function showNotification(text, onclick) {
    var permission = Notification.permission;
    if (permission === "default") {

      Notification.requestPermission().then(result => {
        if (result === "granted") {
          displayNotification(text);
        }
      });

    } else if (permission === "granted") {
      displayNotification(text, onclick);
    }
  }

  return {
    showNotification: showNotification
  }
}
