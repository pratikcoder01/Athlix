const safeLocalMongoUri = input => {
  const uri = new URL(input);
  if (uri.protocol !== 'mongodb:' || !['127.0.0.1', 'localhost', '[::1]'].includes(uri.hostname) ||
      uri.username || uri.password || (uri.pathname && uri.pathname !== '/')) {
    throw new Error('TEST_MONGO_URI must use a loopback MongoDB seed with no credentials or database path');
  }
  // Keep the opt-in fixture connection local even if a copied URI contains
  // proxy/TLS-file/auth options. The suite needs only its replica-set name.
  for (const key of uri.searchParams.keys()) {
    if (!['replicaSet', 'directConnection'].includes(key) || uri.searchParams.getAll(key).length !== 1) {
      throw new Error('TEST_MONGO_URI accepts only replicaSet and directConnection options');
    }
  }
  const replicaSet = uri.searchParams.get('replicaSet');
  if (replicaSet !== null && !/^[a-zA-Z0-9_-]{1,64}$/.test(replicaSet)) {
    throw new Error('TEST_MONGO_URI contains an invalid replica-set name');
  }
  // Prevent replica discovery from connecting to hosts beyond this local seed.
  uri.searchParams.set('directConnection', 'true');
  return uri.toString();
};

const safeTestDbName = name => {
  if (!/^athlix_booking_test_[a-f\d]{32}$/.test(name)) throw new Error('Refusing a database outside the generated booking test namespace');
  return name;
};

module.exports = { safeLocalMongoUri, safeTestDbName };
