const { test, expect } = require('@playwright/test');
const {
  KNOWN_ISSUES,
  knownIssueForUrl,
  collectHttpResponses,
  attachJson,
} = require('../support/known-issues');

const expectedFonts = [
  { filename: 'Poppins-Regular.otf', family: 'PoppinsRegular' },
  { filename: 'Poppins-Medium.otf', family: 'PoppinsMedium' },
];

test('CT-002 acceptance: Poppins Regular e Medium carregam sem erro', async ({ page }, testInfo) => {
  const responses = collectHttpResponses(page);
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);

  const fontResponses = responses.filter((response) =>
    expectedFonts.some((font) =>
      new URL(response.url).pathname.toLowerCase().endsWith(`/${font.filename.toLowerCase()}`),
    ),
  );
  const fontFaces = await page.evaluate((families) =>
    [...document.fonts]
      .filter((font) => families.includes(font.family))
      .map((font) => ({ family: font.family, status: font.status })),
  expectedFonts.map((font) => font.family));
  const observations = expectedFonts.map((font) => {
    const response = fontResponses.find((entry) =>
      new URL(entry.url).pathname.toLowerCase().endsWith(`/${font.filename.toLowerCase()}`),
    );
    const issue = response && knownIssueForUrl(response.url);
    return {
      filename: font.filename,
      url: response?.url,
      status: response?.status,
      knownIssue: issue?.id,
    };
  });
  const acceptanceFailures = [
    ...observations
      .filter((observation) => !observation.status || observation.status >= 400)
      .map((observation) => ({
        kind: 'http',
        filename: observation.filename,
        status: observation.status,
        knownIssue: observation.knownIssue,
      })),
    ...expectedFonts
      .map((font) => font.family)
      .filter((family) => fontFaces.find((font) => font.family === family)?.status !== 'loaded')
      .map((family) => ({
        kind: 'font-face',
        family,
        status: fontFaces.find((font) => font.family === family)?.status || 'missing',
      })),
  ];

  await attachJson(testInfo, 'ct-002-font-baseline.json', {
    observations,
    fontFaces,
    acceptanceFailures,
    documentedKnownIssues: KNOWN_ISSUES.filter((issue) => issue.id === 'BUG-001' || issue.id === 'BUG-002'),
  });

  expect(acceptanceFailures, 'fontes esperadas precisam responder sem erro e carregar').toEqual([]);
});
