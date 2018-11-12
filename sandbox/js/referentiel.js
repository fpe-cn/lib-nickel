import {MDCTabBar} from '@material/tab-bar/dist/mdc.tabBar';
import {MDCFormField} from '@material/form-field/dist/mdc.formField';
import {MDCRadio} from '@material/radio/dist/mdc.radio';
import {MDCCheckbox} from '@material/checkbox/dist/mdc.checkbox';
import {MDCSwitch} from '@material/switch/dist/mdc.switch';

require('../../assets/js/date').init();
require('../../assets/js/tabs').init();
let $ = require('../../assets/js/dom');

const formField = new MDCFormField(document.querySelector('.mdc-form-field'));
$('.mdc-tab-bar').forEach(tabBar => {
    new MDCTabBar(tabBar);
});
$('.mdc-switch').forEach(element => {
    new MDCSwitch(element);
    formField.input = element;
});
$('.mdc-radio').forEach(radio => {
    new MDCRadio(radio);
    formField.input = radio;
});
$('.mdc-checkbox').forEach(checkbox => {
    new MDCCheckbox(checkbox);
    formField.input = checkbox;
});

$('.mdc-tab').forEach(tab  => {
    tab.onclick = (e) => {
        const element = e.target.parentElement;
        // Get section name
        const nameSection = element.getAttribute('data-section');
        // Get type of tab
        let type = element.getAttribute('data-type');
        // Active the tab content of type
        $(`[role="tabpanel"][data-section="${nameSection}"][data-type="${type}"]`).addClass('active');
        // document.querySelector(`#cn-${nameSection}-${type}-panel`).classList.add("active");
        // And hide the other section
        type === 'html' ? type = 'css' : type = 'html';
        $(`[role="tabpanel"][data-section="${nameSection}"][data-type="${type}"]`).removeClass('active');
    }
})
