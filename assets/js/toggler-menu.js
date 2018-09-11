let $ = require('./dom');

module.exports.init = function () {
    const toggler = $('[data-role="toggler-main-nav"]');
    toggler.on('click', (e) => {
        e.preventDefault();
        const toggle = $('[data-role="nav-toggle"]');
        if (toggle.hasClass('show')) {
            toggler.removeClass('open');
            toggle.removeClass('show');
            $('body').css('position', 'static');
        } else {
            toggler.addClass('open');
            toggle.addClass('show');
            $('body').css('position', 'fixed');
        }
        return false;
    });
};
