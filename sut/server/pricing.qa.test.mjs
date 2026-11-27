import assert from 'node:assert/strict';
import test from 'node:test';
import { orderTotals, unitCents } from '../shared/pricing.ts';

const cases = [
  ['WB-01', 0, '', 0, 0, 0, 0],
  ['WB-02', 1, '', 0, 899, 0, 900],
  ['WB-03', 14999, '', 0, 899, 1200, 17098],
  ['WB-04', 15000, '', 0, 0, 1200, 16200],
  ['WB-05', 15001, '', 0, 0, 1200, 16201],
  ['WB-06', 10000, 'CONCIERGE', 0, 0, 800, 10800],
  ['WB-07', 10000, 'VIP15', 1500, 899, 680, 10079],
  ['WB-08', 15000, 'VIP15', 2250, 0, 1020, 13770],
  ['WB-09', 8499, 'VIP15', 1275, 899, 578, 8701],
  ['WB-10', 10000, 'UNKNOWN', 0, 899, 800, 11699]
];

for (const [id, subtotal, voucher, discount, shipping, tax, total] of cases) {
  test(id + ' verifies every total component', () => {
    assert.deepEqual(orderTotals(subtotal, voucher), { subtotal, discount, shipping, tax, total });
  });
}

test('WB-11 rounds the unit discount to the nearest cent', () => {
  assert.equal(unitCents(19.99, 15), 1699);
  assert.equal(unitCents(19.99, 0), 1999);
});
