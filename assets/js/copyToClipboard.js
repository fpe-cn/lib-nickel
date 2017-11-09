var dom = require('../../assets/js/dom');

module.exports.init = function () {
    dom('[data-role="copy-to-clipboard"]').on('click', (e) => {
        let copy = dom(e.target).parent('.input-group').select('input')[0].select();
        document.execCommand('copy');
        return false;
    });
};