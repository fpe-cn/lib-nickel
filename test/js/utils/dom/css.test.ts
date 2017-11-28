// ..
// Imports
//

import * as $css from '../../../../assets/js/dom/css.js';
import * as $ from '../../../../assets/js/dom.js';

// ..
// Unit Tests
//

describe('css.js', () => {
    describe('getCss', () => {
        test('should value is good', () => {
            document.body.innerHTML = '<div id="a" style="margin-top:10px; display:block;"></div>';

            expect($css.getCss($('#a')[0], 'margin-top')).toBe(10);
            expect($css.getCss($('#a')[0], 'display')).toBe('block');
        })
    });

    describe('setCss', () => {
        test('should add one prop', () => {
            document.body.innerHTML = '<div id="a"></div>';
            $('#a').forEach($css.setCss({'margin-top': 10}));

            expect(document.getElementById('a').style.marginTop).toBe('10px')
        });

        test('should add many props', () => {
            document.body.innerHTML = '<div id="a"></div>';
            $('#a').forEach($css.setCss({'margin-top': 10, 'opacity': 0.8, 'color': '#F4F4F4'}));

            expect(document.getElementById('a').style.marginTop).toBe('10px');
            expect(document.getElementById('a').style.opacity).toBe('0.8');
            expect(document.getElementById('a').style.color).toBe('rgb(244, 244, 244)');
        });
    })
});