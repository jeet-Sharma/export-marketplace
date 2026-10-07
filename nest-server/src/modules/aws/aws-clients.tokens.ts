// DI token for the shared S3Client instance. Using a Symbol (not a
// string) avoids collisions with other tokens and keeps the provider
// un-mockable-by-typo in tests.
export const S3_CLIENT = Symbol('S3_CLIENT');
