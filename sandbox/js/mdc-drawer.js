import {MDCList} from "@material/list/dist/mdc.list";
const list = MDCList.attachTo(document.querySelector('.mdc-list'));
list.wrapFocus = true;