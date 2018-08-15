const m = require('mithril');

module.exports = (settingsCtrl, onCloseDialog) => {
  function labelCheckbox(label, getSetting, onSelect) {
    const checkboxSettings = {
      type: 'checkbox',
      class: 'ssb-chess-dialog-checkbox',
      checked: getSetting(),
      onchange: (cb) => {
        onSelect(cb.srcElement.checked);
      },
    };

    if (getSetting() === true) {
      checkboxSettings.checked = true;
    }

    return m('div', {
      id: 'ssb-chess-dialog-checkbox-container',
    }, [
      m('span', { class: 'ssb-chess-dialog-label' }, label),
      m('input', checkboxSettings),
    ]);
  }

  function closeDialog() {
    document.removeEventListener('click', windowClickListener, true);
    onCloseDialog();
  }

  function windowClickListener(event) {
    const dialogElement = document.getElementById('ssb-chess-settings-dialog');
    if (!dialogElement) {
      return;
    }

    if ((event.target != dialogElement) && !dialogElement.contains(event.target)) {
      closeDialog();
    }
  }

  function closeButton() {
    return m('button', { href: '#', id: 'ssb-chess-settings-dialog-close', onclick: closeDialog }, 'Close');
  }

  return {
    view: () => m('div', [
      m('div', { class: 'ssb-chess-dialog-title' }, ''),
      labelCheckbox('Move confirmation',
        settingsCtrl.getMoveConfirmation,
        selected => settingsCtrl.setMoveConfirmation(selected)),
      labelCheckbox('Game sounds', settingsCtrl.getPlaySounds, settingsCtrl.setPlaySounds),
      closeButton(),
    ]),
    oncreate: () => {
      document.addEventListener('click', windowClickListener, true);
    },
  };
};
