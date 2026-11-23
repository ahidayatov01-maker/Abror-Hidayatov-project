import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseFullName,
  formatUserDisplayName,
  computeUserInitials,
  validateOnboardingProfile,
  getCitySuggestionsForCountry,
} from './userProfileHelpers.ts';

test('parseFullName splits Google displayName into firstName and lastName', () => {
  const res = parseFullName('Abror Hidayatov', 'ahidayatov01@gmail.com');
  assert.equal(res.firstName, 'Abror');
  assert.equal(res.lastName, 'Hidayatov');
  assert.equal(res.fullName, 'Abror Hidayatov');
});

test('parseFullName falls back to email local part when displayName is empty', () => {
  const res = parseFullName('', 'abror.hidayatov01@gmail.com');
  assert.equal(res.firstName, 'Abror');
  assert.equal(res.lastName, 'Hidayatov');
});

test('computeUserInitials returns AH for Abror Hidayatov and FE for Guest', () => {
  assert.equal(
    computeUserInitials({ firstName: 'Abror', lastName: 'Hidayatov' }, false),
    'AH'
  );
  assert.equal(
    computeUserInitials({ displayName: 'Abror Hidayatov' }, false),
    'AH'
  );
  assert.equal(computeUserInitials({ displayName: 'Free Explorer' }, true), 'FE');
});

test('formatUserDisplayName formats full name and guest Free Explorer', () => {
  assert.equal(
    formatUserDisplayName({ firstName: 'Abror', lastName: 'Hidayatov' }, false),
    'Abror Hidayatov'
  );
  assert.equal(formatUserDisplayName({ displayName: 'Guest Scholar' }, true), 'Free Explorer');
});

test('validateOnboardingProfile enforces non-empty firstName and normalizes fields', () => {
  const invalid = validateOnboardingProfile({ firstName: '   ', lastName: 'Hidayatov' });
  assert.equal(invalid.valid, false);
  assert.equal(invalid.errorField, 'firstName');

  const valid = validateOnboardingProfile({
    firstName: ' Abror ',
    lastName: ' Hidayatov ',
    country: 'Uzbekistan',
    city: 'Tashkent',
    targetDegree: 'Master',
    targetCountries: ['JP', 'DE', 'JP'],
    targetDisciplines: ['Computer Science', 'Artificial Intelligence'],
  });
  assert.equal(valid.valid, true);
  assert.equal(valid.sanitized.firstName, 'Abror');
  assert.equal(valid.sanitized.lastName, 'Hidayatov');
  assert.equal(valid.sanitized.displayName, 'Abror Hidayatov');
  assert.equal(valid.sanitized.country, 'Uzbekistan');
  assert.equal(valid.sanitized.city, 'Tashkent');
  assert.equal(valid.sanitized.targetDegree, 'Master');
  assert.deepEqual(valid.sanitized.targetCountries, ['JP', 'DE']);
});

test('getCitySuggestionsForCountry returns country-specific academic cities', () => {
  const uzCities = getCitySuggestionsForCountry('Uzbekistan');
  assert.ok(uzCities.includes('Tashkent'));
  assert.ok(uzCities.includes('Samarkand'));

  const jpCities = getCitySuggestionsForCountry('JP');
  assert.ok(jpCities.includes('Tokyo'));
  assert.ok(jpCities.includes('Kyoto'));
});
