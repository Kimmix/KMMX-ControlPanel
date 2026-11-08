const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');

test('audio sliders render the fill from their displayed values', () => {
    const source = readFileSync(resolve(__dirname, '../src/core/viseme-ui.js'), 'utf8');
    const start = source.indexOf("  for (const id of ['noiseRejection', 'mouthSize']) {");
    const end = source.indexOf('  let message =', start);
    const sliders = {
        noiseRejection: { value: '13', style: {} },
        mouthSize: { value: '50', style: {} },
    };
    vm.runInNewContext(source.slice(start, end), { visemeElement: id => sliders[id] });
    assert.match(sliders.noiseRejection.style.backgroundImage, /white 13%/);
    assert.match(sliders.mouthSize.style.backgroundImage, /white 50%/);
});

test('fan fill follows speed, including the endpoints', () => {
    const source = readFileSync(resolve(__dirname, '../src/core/control.js'), 'utf8');
    const start = source.indexOf('function renderFan()');
    const end = source.indexOf('// Set fan speed from slider', start);
    const slider = { style: {} };
    const context = {
        fanSpeed: 0,
        document: {
            querySelector: () => null,
            getElementById: id => id === 'fanSpeedSlider' ? slider : null,
        },
    };
    vm.createContext(context);
    vm.runInContext(source.slice(start, end), context);
    for (const speed of [0, 37, 100]) {
        context.fanSpeed = speed;
        context.renderFan();
        assert.ok(slider.style.backgroundImage.includes(`white ${speed}%`));
    }
});

for (const max of [100, 255]) {
    test(`brightness renders percentages and keeps raw 0–${max} device values`, () => {
        const slider = {
            min: '0', max: String(max), value: '0', style: {}, attributes: {},
            addEventListener(_, handler) { this.input = handler; },
            setAttribute(name, value) { this.attributes[name] = value; },
        };
        const output = {};
        const writes = [];
        const source = readFileSync(resolve(__dirname, '../src/core/control.js'), 'utf8');
        const context = {
            document: { getElementById: id => id === 'slider' ? slider : output },
            vibrateDevice() {},
        };
        vm.createContext(context);
        vm.runInContext(source.slice(source.indexOf('function bindSlider('), source.indexOf('\nfunction applyColor(')), context);
        const binding = context.bindSlider({
            sliderId: 'slider', valueDisplayId: 'output', maxValue: max,
            convertToPercentage: true, valueSuffix: '%', onChange: value => writes.push(value),
        });
        assert.equal(output.textContent, '0%');
        assert.match(slider.style.backgroundImage, /white 0%/);
        binding.setValue(max);
        assert.equal(output.textContent, '100%');
        assert.equal(slider.attributes['aria-valuetext'], '100%');
        assert.deepEqual(writes, []);
        const value = Math.round(max * 0.6);
        slider.input({ target: { value: String(value) } });
        assert.equal(output.textContent, '60%');
        assert.equal(slider.attributes['aria-valuetext'], '60%');
        assert.deepEqual(writes, [value]);
        assert.match(slider.style.backgroundImage, /linear-gradient/);
    });
}
