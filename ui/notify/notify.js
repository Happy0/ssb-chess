module.exports = () => {

  function displayNotification(text, onclick) {
    var options = {
      body: text
    }

    var n = new Notification("Scuttlebutt Chess", options);
    
    if (onclick) {
        n.onclick = onclick;
    }

    setTimeout(n.close.bind(n), 10000);
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
