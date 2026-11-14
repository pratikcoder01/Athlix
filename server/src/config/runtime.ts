export const hasMinimumSecretStrength = (secret: string) => secret.length >= 32 && new Set(secret).size >= 8;

export function validateRuntimeConfig(environment: NodeJS.ProcessEnv = process.env) {
  const production = environment.NODE_ENV === 'production';
  const portText = environment.PORT || '5000';
  if (!/^\d+$/.test(portText) || Number(portText) > 65535 || Number(portText) < (production ? 1 : 0)) {
    throw new Error('PORT must be a valid listening port');
  }
  if (!environment.JWT_SECRET) throw new Error('JWT_SECRET is required');
  if (production && !hasMinimumSecretStrength(environment.JWT_SECRET)) {
    throw new Error('Production JWT_SECRET requires at least 32 characters and a securely generated value');
  }
  const uri = environment.MONGO_URI || (production ? '' : 'mongodb://127.0.0.1:27017/athlix');
  if (!/^mongodb(?:\+srv)?:\/\/\S+$/.test(uri)) throw new Error('A valid MONGO_URI must explicitly identify the target database in production');
  const proxyHops = environment.TRUST_PROXY_HOPS || '0';
  if (!/^[0-3]$/.test(proxyHops)) throw new Error('TRUST_PROXY_HOPS must be an explicitly reviewed hop count from 0 to 3');
  return { port: Number(portText), mongoUri: uri, proxyHops: Number(proxyHops) };
}
