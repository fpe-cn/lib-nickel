$ = require('jquery')
global.jQuery = $
global.Tether = require('tether')
global.Popper = require('popper.js/dist/umd/popper')
require('bootstrap')
require('prismjs')

jQuery('#cn-logo-tab a').on('click', function (e) {
    e.preventDefault()
    jQuery(this).tab('show')
})

require('../../assets/js/copyToClipboard').init()
