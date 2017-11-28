let $ = require('./dom');

module.exports.init = function () {
    $('[data-role="copy-to-clipboard"]').on('click', (e) => {
        let copy = $(e.target).parent('.input-group').select('input')[0].select();
        document.execCommand('copy');
        return false;
    });
};