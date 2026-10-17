const crypto = require('crypto');
const AccountToken = require('../models/AccountToken');
const User = require('../models/User');
const { hashToken } = require('./authService');

async function issueAccountToken(user, type, ttlMinutes) {
  const token = crypto.randomBytes(32).toString('base64url');
  let version;

  if (type === 'email_verification') {
    // Atomic versioning leaves only the newest verification link valid, even
    // when resend requests overlap. Old records are removed later by TTL.
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $inc: { emailVerificationVersion: 1 } },
      { new: true }
    ).select('+emailVerificationVersion');
    if (!updatedUser) throw new Error('Cannot issue a token for a missing user');
    version = updatedUser.emailVerificationVersion;
  } else {
    await AccountToken.deleteMany({ user: user._id, type, usedAt: null });
  }

  await AccountToken.create({
    user: user._id,
    type,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
    ...(version === undefined ? {} : { version })
  });
  return token;
}

function matchesCurrentEmailVerificationVersion(accountToken, user) {
  const currentVersion = Number(user.emailVerificationVersion || 0);
  // Preserve a valid link issued before this version field was deployed. A
  // resend increments the counter and immediately invalidates legacy links.
  if (accountToken.version === undefined || accountToken.version === null) return currentVersion === 0;
  return accountToken.version === currentVersion;
}

module.exports = { issueAccountToken, matchesCurrentEmailVerificationVersion };
