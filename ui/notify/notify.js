module.exports = () => {
  function displayNotification(text, onclick) {
    const options = {
      body: text,
      requireInteraction: true,
    };

    const n = new Notification('Scuttlebutt Chess', options);

    if (onclick) {
      n.onclick = onclick;
    }
  }

  function showNotification(text, onclick) {
    const { permission } = Notification;
    if (permission === 'default') {
      Notification.requestPermission().then((result) => {
        if (result === 'granted') {
          displayNotification(text);
        }
      });
    } else if (permission === 'granted') {
      displayNotification(text, onclick);
    }
  }

  return {
    showNotification,
  };
};
