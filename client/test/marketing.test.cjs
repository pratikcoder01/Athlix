const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { buildContactMailto, getContactEmail } = require('../src/lib/contact.ts');

const source = (file) => fs.readFileSync(path.join(__dirname, '../src', file), 'utf8');

test('published marketing cannot regress to unsupported traction, endorsements, billing, or certifications', () => {
  const pages = ['app/page.tsx', 'app/pricing/page.tsx', 'app/features/page.tsx', 'app/about/page.tsx', 'app/contact/page.tsx', 'app/blog/page.tsx', 'app/(auth)/login/page.tsx', 'app/(auth)/signup/page.tsx', 'components/shared/Footer.tsx', 'components/shared/StatsBar.tsx'];
  const unsupported = /50,?000|50k\+|Identity-verified athletes|2,?400\+|4\.9\/5|SOC\s?2 compliant|Stripe-powered|powered by Stripe|14-day (free )?trial|UFC|Bellator|Team USA|MOST POPULAR|All systems operational|forever free|within 24 hours/i;
  for (const file of pages) assert.doesNotMatch(source(file), unsupported, file);
  assert.match(source('app/pricing/page.tsx'), /checkout, and automatic billing are not available/);
  assert.match(source('app/features/page.tsx'), /Illustrative mockup · sample content/);
});

test('contact drafts safely encode user fields and do not treat submission as delivery', () => {
  const draft = buildContactMailto('pilot@example.org', { name: 'A & B', email: 'athlete@example.org', subject: 'Pilot? &bcc=evil@example.org', message: 'Line one\n&subject=changed' });
  const parameters = new URLSearchParams(draft.split('?')[1]);
  assert.equal(draft.split('?')[0], 'mailto:pilot%40example.org');
  assert.equal(parameters.get('subject'), 'Pilot? &bcc=evil@example.org');
  assert.equal(parameters.has('bcc'), false);
  assert.equal(parameters.get('body'), 'Name: A & B\nReply email: athlete@example.org\n\nLine one\n&subject=changed');
  const contact = source('app/contact/page.tsx');
  assert.match(contact, /ATHLIX has not sent a message/);
  assert.match(contact, /disabled=\{!recipient\}/);
  assert.doesNotMatch(contact, /alert\(|fetch\(/);
});

test('unconfigured or malformed email configuration fails closed', () => {
  const previous = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  try {
    for (const email of ['', 'not-an-email', 'name@example.org?bcc=other@example.org', 'name@example.org\r\nbcc:evil@example.org']) {
      process.env.NEXT_PUBLIC_CONTACT_EMAIL = email;
      assert.equal(getContactEmail(), null);
    }
    process.env.NEXT_PUBLIC_CONTACT_EMAIL = ' pilot@example.org ';
    assert.equal(getContactEmail(), 'pilot@example.org');
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_CONTACT_EMAIL;
    else process.env.NEXT_PUBLIC_CONTACT_EMAIL = previous;
  }
});

test('legal destinations disclose pending review and organizer metrics contain no fake revenue', () => {
  for (const file of ['app/privacy/page.tsx', 'app/terms/page.tsx']) assert.match(source(file), /Legal review pending/);
  const organizer = source('app/organizer/page.tsx');
  assert.doesNotMatch(organizer, /totalRevenue|bookingRevenue|tournamentRevenue|fillRate|124\.50/);
  assert.match(organizer, /Payment collection is unavailable/);
});
