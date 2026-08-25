import assert from 'node:assert/strict';
import { createHmac } from 'crypto';
import { test } from 'node:test';
import {
  chapaTxRefFrom,
  isChapaConfigured,
  isChapaTestKey,
  isLiveChapa,
  isPlaceholderChapaKey,
  stringifyChapaError,
  timingSafeEqualHex,
  toChapaEmail,
  toChapaPhone,
  verifyChapaWebhook,
} from './chapa';


const secret = 'whsec_test_secret';
const body = '{"tx_ref":"etm-1","status":"success"}';

test('timingSafeEqualHex accepts matching hex', () => {
  const hex = createHmac('sha256', secret).update(body).digest('hex');
  assert.equal(timingSafeEqualHex(hex, hex), true);
});

test('timingSafeEqualHex rejects mismatched hex', () => {
  const a = createHmac('sha256', secret).update(body).digest('hex');
  const b = createHmac('sha256', secret).update('other').digest('hex');
  assert.equal(timingSafeEqualHex(a, b), false);
});

test('verifyChapaWebhook accepts x-chapa-signature of raw body', () => {
  const sig = createHmac('sha256', secret).update(body).digest('hex');
  assert.equal(
    verifyChapaWebhook({
      rawBody: body,
      headers: { 'x-chapa-signature': sig },
      webhookSecret: secret,
    }),
    true
  );
});

test('verifyChapaWebhook rejects missing secret', () => {
  const sig = createHmac('sha256', secret).update(body).digest('hex');
  assert.equal(
    verifyChapaWebhook({
      rawBody: body,
      headers: { 'x-chapa-signature': sig },
      webhookSecret: undefined,
    }),
    false
  );
});

test('verifyChapaWebhook rejects HMAC of the secret alone', () => {
  const sig = createHmac('sha256', secret).update(secret).digest('hex');
  assert.equal(
    verifyChapaWebhook({
      rawBody: body,
      headers: { 'x-chapa-signature': sig },
      webhookSecret: secret,
    }),
    false
  );
});

test('verifyChapaWebhook rejects tampered body', () => {
  const sig = createHmac('sha256', secret).update(body).digest('hex');
  assert.equal(
    verifyChapaWebhook({
      rawBody: '{"tx_ref":"etm-1","status":"success","evil":1}',
      headers: { 'x-chapa-signature': sig },
      webhookSecret: secret,
    }),
    false
  );
});

test('isPlaceholderChapaKey treats xxx and short keys as placeholders', () => {
  assert.equal(isPlaceholderChapaKey('CHASECK_TEST_xxx'), true);
  assert.equal(isPlaceholderChapaKey('CHASECK_TEST-xxx'), true);
  assert.equal(isPlaceholderChapaKey(''), true);
  assert.equal(isPlaceholderChapaKey('CHASECK_TEST_'), true);
  assert.equal(
    isPlaceholderChapaKey('CHASECK_TEST_BbsIL9E0NillGIZ4beEuU9HNCXxlJ8dR'),
    false
  );
  assert.equal(
    isPlaceholderChapaKey('CHASECK_TEST-BbsIL9E0NillGIZ4beEuU9HNCXxlJ8dR'),
    false
  );
});

test('isChapaTestKey accepts hyphen and underscore TEST prefixes', () => {
  assert.equal(isChapaTestKey('CHASECK_TEST-BbsIL9E0NillGIZ4beEuU9HNCXxlJ8dR'), true);
  assert.equal(isChapaTestKey('CHASECK_TEST_BbsIL9E0NillGIZ4beEuU9HNCXxlJ8dR'), true);
  assert.equal(isChapaTestKey('CHASECK_TEST_xxx'), false);
  assert.equal(isChapaTestKey('CHASECK-BbsIL9E0NillGIZ4beEuU9HNCXxlJ8dRlive'), false);
});

test('isLiveChapa is the opposite of isChapaTestKey for configured keys', () => {
  assert.equal(isLiveChapa('CHASECK_TEST-BbsIL9E0NillGIZ4beEuU9HNCXxlJ8dR'), false);
  assert.equal(isLiveChapa('CHASECK-BbsIL9E0NillGIZ4beEuU9HNCXxlJ8dRlivek'), true);
  assert.equal(isChapaConfigured('CHASECK_TEST-BbsIL9E0NillGIZ4beEuU9HNCXxlJ8dR'), true);
  assert.equal(isChapaConfigured('CHASECK_TEST_xxx'), false);
});

test('stringifyChapaError flattens object messages instead of [object Object]', () => {
  assert.equal(
    stringifyChapaError({
      message: { phone_number: ['The phone number is invalid.'] },
      status: 'failed',
    }),
    'phone_number: The phone number is invalid.'
  );
  assert.equal(
    stringifyChapaError({
      message: 'Validation Error',
      data: { email: ['The email must be a valid email address.'] },
    }),
    'Validation Error; email: The email must be a valid email address.'
  );
  assert.equal(stringifyChapaError('[object Object]'), 'Chapa request failed');
});

test('toChapaPhone normalizes Ethiopian numbers to 10 digits', () => {
  assert.equal(toChapaPhone('0900123456'), '0900123456');
  assert.equal(toChapaPhone('+251900123456'), '0900123456');
  assert.equal(toChapaPhone('251911000001'), '0911000001');
  assert.equal(toChapaPhone('00251911000001'), '0911000001');
  assert.equal(toChapaPhone('0700123456'), '0700123456');
  assert.equal(toChapaPhone('not-a-phone'), undefined);
});

test('chapaTxRefFrom reads trx_ref from Chapa callbacks', () => {
  assert.equal(chapaTxRefFrom({ trx_ref: 'etm-1', status: 'success' }), 'etm-1');
  assert.equal(chapaTxRefFrom({ tx_ref: 'etm-2' }), 'etm-2');
  assert.equal(chapaTxRefFrom({}), '');
});

test('toChapaEmail maps seed demo hosts Chapa rejects', () => {
  assert.equal(toChapaEmail('sara@buyer.et'), 'sara@gmail.com');
  assert.equal(toChapaEmail('abebe@seller.et'), 'abebe@gmail.com');
  assert.equal(toChapaEmail('real.user@gmail.com'), 'real.user@gmail.com');
});
