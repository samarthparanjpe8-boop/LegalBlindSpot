const chalk = require('chalk');

function getTrustBadge(score) {
  if (score >= 85) {
    return { label: 'Elite', colorFn: chalk.green.bold };
  }
  if (score >= 70) {
    return { label: 'Trusted', colorFn: chalk.cyan.bold };
  }
  if (score >= 50) {
    return { label: 'Established', colorFn: chalk.yellow.bold };
  }
  if (score >= 30) {
    return { label: 'Unverified', colorFn: chalk.magenta.bold };
  }
  return { label: 'Incomplete', colorFn: chalk.red.bold };
}

function formatBadge(score) {
  const { label, colorFn } = getTrustBadge(score);
  return colorFn(`[${label}]`);
}

module.exports = { getTrustBadge, formatBadge };
