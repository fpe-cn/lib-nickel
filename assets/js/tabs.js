let $ = require('../../assets/js/dom');

module.exports.init = () => {
    $('[data-toggle="tab"]').forEach( tab => {
        tab.onclick = () => {
            $('[data-toggle="tab"]').removeClass('active');
            $(tab).addClass('active');
            $('.cn-tab-panel').removeClass('active');
            const tabContentId = $(tab).attr('data-id');
            const tabContent = $(tab).parent().parent().parent().select('.cn-tab-content').select(`[data-id="${tabContentId}"]`);
            tabContent.addClass('active');
        };
    })
}