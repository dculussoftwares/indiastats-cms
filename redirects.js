const redirects = async () => {
  const internetExplorerRedirect = {
    destination: '/ie-incompatible.html',
    has: [
      {
        type: 'header',
        key: 'user-agent',
        value: '(.*Trident.*)', // all ie browsers
      },
    ],
    permanent: false,
    source: '/:path((?!ie-incompatible.html$).*)', // all pages except the incompatibility page
  }

  const legacyFixes = [
    {
      source: '/tamil-nadu/district/chennai-north',
      destination: '/tamil-nadu/district/chennai',
      permanent: true,
    },
    {
      source: '/last-election-analysis/lost-at-lowest-vote',
      destination: '/tamil-nadu/election-analysis/2021',
      permanent: true,
    },
    {
      source: '/tamil-nadu/election-',
      destination: '/tamil-nadu/election-results',
      permanent: true,
    },
    {
      source: '/tamil-nadu/assembly/undefined/ac204/booths',
      destination: '/tamil-nadu/assembly/virudhunagar/sattur/booths',
      permanent: true,
    },
    {
      source: '/cdn-cgi/l/email-protection',
      destination: '/',
      permanent: true,
    },
    {
      source: '/&',
      destination: '/',
      permanent: true,
    },
  ]

  const redirects = [internetExplorerRedirect, ...legacyFixes]

  return redirects
}

export default redirects
