let $ = require('./dom');

module.exports.init = () => {
    $("input[type='date']").on('click', (e) => {
        $('[data-role="date"]').addClass('active');
    });
    $("input[type='date']").on('blur', () => {
        $('[data-role="date"]').removeClass('active');
    });
}
