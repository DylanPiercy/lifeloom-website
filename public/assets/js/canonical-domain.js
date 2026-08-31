(() => {
  const canonicalHost = "lifeloom.co.uk";
  const redirectHosts = new Set(["www.lifeloom.co.uk","lifeloom-website.web.app","lifeloom-website.firebaseapp.com"]);
  const currentHost = window.location.hostname.toLowerCase();

  if (!redirectHosts.has(currentHost) || currentHost === canonicalHost) return;

  const target = new URL(window.location.href);
  target.protocol = 'https:';
  target.hostname = canonicalHost;
  target.port = '';
  window.location.replace(target.toString());
})();
