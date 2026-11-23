import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatCleanUniversityName,
  formatCleanRankDisplay,
  splitTuitionDisplay,
  formatCompactMilestoneLabel,
  getDiamondMicroCopy,
  getLocalizedShardCopy,
  getUniversalMicroCopy,
} from '../displayCopy';
import { COSMIC_SECTIONS } from '../../components/cosmic-diamond/cosmicSections';

describe('displayCopy presentation sanitization (zero dataset mutation)', () => {
  it('strips parenthetical university aliases cleanly', () => {
    assert.equal(
      formatCleanUniversityName('Institute of Science Tokyo (formerly Tokyo Tech)'),
      'Institute of Science Tokyo'
    );
    assert.equal(
      formatCleanUniversityName('University of Tokyo'),
      'University of Tokyo'
    );
  });

  it('strips parenthetical notes from ranking badges', () => {
    assert.equal(formatCleanRankDisplay('#84 (as Tokyo Tech)'), '#84');
    assert.equal(formatCleanRankDisplay('#32'), '#32');
  });

  it('splits tuition fee fine-print into primary value and tooltip note', () => {
    const res1 = splitTuitionDisplay('¥535,800–¥642,960/yr (verify program fee)');
    assert.equal(res1.primary, '¥535,800–¥642,960/yr');
    assert.equal(res1.note, 'verify program fee');

    const res2 = splitTuitionDisplay('¥635,400/yr (undergraduate standard)');
    assert.equal(res2.primary, '¥635,400/yr');
    assert.equal(res2.note, 'undergraduate standard');

    const res3 = splitTuitionDisplay('$59,750/yr');
    assert.equal(res3.primary, '$59,750/yr');
    assert.equal(res3.note, null);
  });

  it('formats ultra-short planetary milestone labels across UZ, EN, RU', () => {
    assert.equal(formatCompactMilestoneLabel(1, 'Academic Baseline & Profile Audit', 'uz'), '01. Baza');
    assert.equal(formatCompactMilestoneLabel(2, 'IELTS / TOEFL Language Readiness', 'uz'), '02. Til');
    assert.equal(formatCompactMilestoneLabel(3, 'SAT & Entrance Exam Preparation', 'uz'), '03. Imtihon');
    assert.equal(formatCompactMilestoneLabel(4, 'University Application Submission', 'uz'), '04. Ariza');
    assert.equal(formatCompactMilestoneLabel(5, 'Student Visa & Embassy Processing', 'uz'), '05. Viza');

    assert.equal(formatCompactMilestoneLabel(2, 'Language Proficiency', 'en'), '02. Language');
    assert.equal(formatCompactMilestoneLabel(2, 'Language Proficiency', 'ru'), '02. Язык');
  });

  it('enforces strict UZ/EN/RU parity on Diamond micro-copy and Universal Dictionary', () => {
    const uzD = getDiamondMicroCopy('uz');
    const enD = getDiamondMicroCopy('en');
    const ruD = getDiamondMicroCopy('ru');

    assert.equal(uzD.idleTooltip, 'Ikki marta bosing ✨');
    assert.equal(uzD.coreHint, 'Yadroni bosing');
    assert.equal(uzD.selectFacet, 'Qirrani tanlang');
    assert.equal(uzD.reassemble, 'Qayta yig‘ish');
    assert.equal(enD.reassemble, 'Reassemble');
    assert.equal(ruD.reassemble, 'Собрать');

    for (const lang of ['uz', 'en', 'ru'] as const) {
      const micro = getUniversalMicroCopy(lang);
      assert.equal(micro.advisorChips.length, 3);
      assert.equal(micro.pricingCards.length, 3);
      assert.equal(micro.pricingCards[0].priceMonthlyUsd, 0);
      assert.equal(micro.pricingCards[1].priceMonthlyUsd, 9);
      assert.equal(micro.pricingCards[2].priceMonthlyUsd, 24);
      assert.ok(micro.about.creatorName.includes('Abror Hidoyatov'));
    }
  });

  it('provides concise 1-sentence value and 3 bullets for every cosmic shard in UZ/EN/RU', () => {
    for (const section of COSMIC_SECTIONS) {
      for (const lang of ['uz', 'en', 'ru'] as const) {
        const copy = getLocalizedShardCopy(section.id, lang, section.title);
        assert.ok(copy.title.length > 0);
        assert.ok(copy.valueLine.split(/\s+/).length <= 14, `Too long valueLine for ${section.id} (${lang})`);
        assert.equal(copy.bullets.length, 3);
      }
    }
  });
});
