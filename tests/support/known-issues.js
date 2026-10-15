const KNOWN_ISSUES = Object.freeze([
  {
    id: 'BUG-001',
    title: 'Poppins Regular não carregada',
    pathname: '/FONTS/Poppins-Regular.otf',
  },
  {
    id: 'BUG-002',
    title: 'Poppins Medium não carregada',
    pathname: '/FONTS/Poppins-Medium.otf',
  },
  {
    id: 'BUG-003',
    title: 'Imagem de fundo dos depoimentos não carregada',
    pathname: '/img',
  },
]);

function knownIssueForUrl(url) {
  const pathname = new URL(url).pathname;
  return KNOWN_ISSUES.find((issue) => issue.pathname === pathname);
}

function collectHttpResponses(page) {
  const responses = [];
  const seenRequests = new WeakSet();

  page.on('response', (response) => {
    const request = response.request();
    if (seenRequests.has(request)) return;
    seenRequests.add(request);

    responses.push({
      method: request.method(),
      url: response.url(),
      status: response.status(),
      resourceType: request.resourceType(),
    });
  });

  return responses;
}

async function attachJson(testInfo, name, value) {
  await testInfo.attach(name, {
    body: Buffer.from(JSON.stringify(value, null, 2)),
    contentType: 'application/json',
  });
}

module.exports = { KNOWN_ISSUES, knownIssueForUrl, collectHttpResponses, attachJson };
