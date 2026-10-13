require('./helpers/env');

const test = require('node:test');
const assert = require('node:assert/strict');

const { now, convertTimeToCron } = require('../routes/lib/date');

test('now returns a Date instance', () => {
  assert.ok(now() instanceof Date);
});

test('convertTimeToCron rejects non-positive durations', () => {
  assert.throws(() => convertTimeToCron(0), /greater than 0/);
  assert.throws(() => convertTimeToCron(-10), /greater than 0/);
});

test('convertTimeToCron uses minute precision under an hour', () => {
  assert.equal(convertTimeToCron(30), '*/30 * * * *');
  assert.equal(convertTimeToCron(59), '*/59 * * * *');
});

test('convertTimeToCron uses hours when the duration is under a day', () => {
  assert.equal(convertTimeToCron(60), '0 */1 * * *');
  assert.equal(convertTimeToCron(120), '0 */2 * * *');
});

test('convertTimeToCron adds an offset expression for leftover minutes', () => {
  assert.equal(convertTimeToCron(90), '0 */1 * * *\n30 */1 * * *');
});

test('convertTimeToCron uses days when the duration is under a week', () => {
  assert.equal(convertTimeToCron(1440), '0 0 */1 * *');
  assert.equal(convertTimeToCron(2880), '0 0 */2 * *');
});

test('convertTimeToCron uses weeks when the duration is under a month', () => {
  assert.equal(convertTimeToCron(10080), '0 0 * */1 *');
});

test('convertTimeToCron uses months for long durations', () => {
  assert.equal(convertTimeToCron(43200), '0 0 1 */1 *');
});
