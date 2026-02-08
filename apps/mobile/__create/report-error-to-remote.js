
async function reportErrorToRemote(err, meta = {}) {
  try {
    const { serializeError } = await import('serialize-error');
    const payload = {
      error: serializeError(err),
      meta,
      timestamp: Date.now(),
    };

    if (typeof fetch === 'function') {
      return fetch('https://example.com/report-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => Promise.resolve());
    }

    // eslint-disable-next-line no-console
    console.error('reportErrorToRemote (fallback):', payload);
    return Promise.resolve();
  } catch (e) {
    return Promise.resolve();
  }
}

module.exports = { reportErrorToRemote };
