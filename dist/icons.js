export function siteIconUrl(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('无效网址');
  return `${url.origin}/favicon.ico`;
}
