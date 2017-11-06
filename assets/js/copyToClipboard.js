var $ = require('../../assets/js/dom');

module.exports.init = function () {
    $('[data-role="copy-to-clipboard"]').on('click', (e) => {
        let copy = $(e.target).parent('.input-group').select('input')[0].select();
        console.log(copy);
        document.execCommand('copy');
        return false;
    });
};