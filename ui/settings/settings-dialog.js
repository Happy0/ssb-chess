const m = require('mithril');

module.exports = (settingsCtrl, onCloseDialog) => {

  function labelCheckbox(label, getSetting, onSelect) {
    var checkboxSettings = {type: 'checkbox', 'class': 'ssb-chess-dialog-checkbox', checked: getSetting(),
    onchange: (cb) => {
      onSelect(cb.srcElement.checked)
    }
  };

  if (getSetting() === true) {
    checkboxSettings['checked'] = true;
  }

    return m('div', {
      id: 'ssb-chess-dialog-checkbox-container'
    }, [
      m('span', {'class': 'ssb-chess-dialog-label'}, label),
      m('input', checkboxSettings)
    ])
  }

  function closeButton() {
    return m('button', {href: '#', 'id': 'ssb-chess-settings-dialog-close', onclick: onCloseDialog}, 'Close');
  }
9
  return {
    view: () => {
      return m('div', [
        m('div', {class: 'ssb-chess-dialog-title'}, ''),
        labelCheckbox('Move confirmation',
         settingsCtrl.getMoveConfirmation,
          (selected) => settingsCtrl.setMoveConfirmation(selected)),
        closeButton()
      ])
    }
  }

}
