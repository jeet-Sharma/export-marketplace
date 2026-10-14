// One-off script: uploads the images in Product_images/ to the target
// deployment's active storage provider and registers them in the
// product_images table, matched to existing products by normalized
// filename <-> product name.
//
// Mirrors the app's own conventions so these rows are indistinguishable from
// ones created through the real API:
//   - storage key format: products/<productId>/<uuid>-<sanitized-filename>
//     (see StorageStrategy.buildProductImageKey — identical for both providers)
//   - one row per image, is_primary = true, sort_order = 0 (each product
//     gets exactly one image here)
//
// The storage provider is selected by STORAGE_PROVIDER (same env var the
// app reads). Supported values:
//
//   s3         — uploads to AWS S3 / LocalStack via PutObjectCommand.
//                Requires: AWS_REGION, AWS_S3_BUCKET (and optionally
//                AWS_ENDPOINT for LocalStack / AWS_ACCESS_KEY_ID /
//                AWS_SECRET_ACCESS_KEY).
//
//   cloudinary — uploads to Cloudinary via the Admin SDK.
//                Requires: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY,
//                CLOUDINARY_API_SECRET.
//
// The script fails fast if the required credentials for the selected
// provider are absent, or if STORAGE_PROVIDER names an unsupported value.
//
// Usage:
//   node scripts/seed-product-images.mjs            (dry run, no writes)
//   node scripts/seed-product-images.mjs --apply     (uploads + inserts)
//
// Reads credentials from the same env vars as the app (nest-server/.env)
// and the Postgres connection from DATABASE_URL (set it in the shell before
// running against a remote DB — never hardcode a connection string with
// credentials here).

import { randomUUID } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.join(__dirname, '..', '.env') });

const IMAGES_DIR = path.join(__dirname, '..', '..', 'Product_images');
const APPLY = process.argv.includes('--apply');

// Supported storage providers — must match the app's STORAGE_PROVIDERS constant
// (nest-server/src/storage/storage-strategy.interface.ts).
const SUPPORTED_PROVIDERS = ['s3', 'cloudinary'];

// Read STORAGE_PROVIDER with the same default the app uses (storage.module.ts
// line 21: `process.env.STORAGE_PROVIDER?.trim() || 's3'`).
const STORAGE_PROVIDER = (process.env.STORAGE_PROVIDER?.trim() || 's3');

// Explicit filename -> product-slug overrides for cases the automatic
// word-matching below cannot resolve safely (apostrophe normalization
// collapsing "Men's" differently than "Mens", and a truncated filename
// typo "...Bedsheet_Se.jpg" for "...Bedsheet Set"). Verified by hand
// against the actual products table before this script is run with
// --apply — see the mapping table shown in the dry run.
const FILENAME_OVERRIDES = {
  'Mens_Bifold_Leather_Wallet.jpg': 'leather-wallet-mens',
  'Mens_Embroidered_Cotton_Kurta.jpg': 'mens-cotton-kurta',
  'Pure_Cotton_Queen_Size_Bedsheet_Se.jpg': 'cotton-bedsheet-queen',
};

function normalize(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function sanitizeFilename(filename) {
  const withoutExtension = filename.replace(/\.[^./]+$/, '');
  return withoutExtension.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function buildProductImageKey(productId, originalFilename) {
  return `products/${productId}/${randomUUID()}-${sanitizeFilename(originalFilename)}`;
}

// ─── Provider-specific upload functions ──────────────────────────────────────

/**
 * Validates that all required Cloudinary credentials are present and
 * configures the SDK. Throws early with a clear message if any are missing,
 * matching the app's own "fail fast" approach in CloudinaryStorageStrategy.
 */
async function setupCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'STORAGE_PROVIDER=cloudinary requires CLOUDINARY_CLOUD_NAME, ' +
      'CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to be set (nest-server/.env).',
    );
  }
  // Dynamic import keeps the Cloudinary SDK out of the require graph when
  // STORAGE_PROVIDER=s3 — avoids a missing-module error for users who run
  // the script against an S3 deployment that never installed cloudinary.
  const { v2: cloudinary } = await import('cloudinary');
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  return cloudinary;
}

/**
 * Validates that all required AWS / S3 credentials are present and creates
 * an S3Client. Throws early with a clear message if the bucket is not
 * configured — AWS credentials fall back to the SDK's standard credential
 * chain (env vars, ~/.aws/credentials, IMDS) so they are optional here.
 */
async function setupS3() {
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) {
    throw new Error(
      'STORAGE_PROVIDER=s3 requires AWS_S3_BUCKET to be set (nest-server/.env).',
    );
  }
  const region = process.env.AWS_REGION || 'us-east-1';
  const endpoint = process.env.AWS_ENDPOINT?.trim() || undefined;

  // Dynamic import — avoids requiring @aws-sdk/client-s3 when STORAGE_PROVIDER=cloudinary.
  const { S3Client, PutObjectCommand, DeleteObjectCommand } = await import('@aws-sdk/client-s3');

  const client = new S3Client({
    region,
    // endpoint is only set for LocalStack / non-AWS S3-compatible stores.
    ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
    // Explicit credentials override the SDK's credential chain when set —
    // matches the app's AwsModule configuration in aws.module.ts.
    ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          },
        }
      : {}),
  });

  return { client, bucket, PutObjectCommand, DeleteObjectCommand };
}

/**
 * Uploads a local file to Cloudinary using its public_id as the storage key.
 * Equivalent end-state to the signed-upload flow the app uses for browser
 * clients — this is a trusted server-side script so a direct Admin SDK
 * upload is appropriate.
 */
async function uploadToCloudinary(cloudinary, filePath, key) {
  await cloudinary.uploader.upload(filePath, {
    public_id: key,
    resource_type: 'image',
    overwrite: false,
  });
}

/**
 * Uploads a local file to S3 using PutObjectCommand. This is the server-side
 * equivalent of the browser client uploading directly to S3 via a presigned
 * POST URL — the end state in the bucket is identical.
 */
async function uploadToS3({ client, bucket, PutObjectCommand }, filePath, key) {
  const body = readFileSync(filePath);
  // Derive a basic Content-Type from the extension so S3 stores it correctly.
  const ext = path.extname(filePath).toLowerCase();
  const contentType =
    ext === '.jpg' || ext === '.jpeg'
      ? 'image/jpeg'
      : ext === '.png'
        ? 'image/png'
        : ext === '.webp'
          ? 'image/webp'
          : 'application/octet-stream';

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

/**
 * Deletes an uploaded image from Cloudinary if the database insert fails.
 */
async function deleteFromCloudinary(cloudinary, key) {
  await cloudinary.uploader.destroy(key, { resource_type: 'image' });
}

/**
 * Deletes an uploaded object from S3 if the database insert fails.
 */
async function deleteFromS3({ client, bucket, DeleteObjectCommand }, key) {
  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Fail fast on an unrecognised provider before touching the DB or any
  // remote service — mirrors storage.module.ts's own validation.
  if (!SUPPORTED_PROVIDERS.includes(STORAGE_PROVIDER)) {
    throw new Error(
      `Unsupported STORAGE_PROVIDER "${STORAGE_PROVIDER}". ` +
      `Supported values: ${SUPPORTED_PROVIDERS.join(', ')}.`,
    );
  }

  console.log(`Storage provider: ${STORAGE_PROVIDER}`);

  // Set up the chosen provider eagerly (before any DB work) so credential
  // problems surface immediately rather than after the matching step.
  let cloudinary = null;
  let s3Context = null;

  if (STORAGE_PROVIDER === 'cloudinary') {
    cloudinary = await setupCloudinary();
  } else {
    s3Context = await setupS3();
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      'Set DATABASE_URL to the target Postgres connection string before running this script.',
    );
  }

  const clientConfig = {
    connectionString: databaseUrl,
  };

  if (process.env.PGSSLROOTCERT) {
    clientConfig.ssl = {
      rejectUnauthorized: true,
      ca: readFileSync(process.env.PGSSLROOTCERT, 'utf8'),
    };
  }

  const client = new pg.Client(clientConfig);
  await client.connect();

  try {
    const { rows: products } = await client.query(
      'SELECT id, slug, name FROM products',
    );
    const productsByNormalizedName = new Map(
      products.map((p) => [normalize(p.name), p]),
    );

    const files = readdirSync(IMAGES_DIR).filter((f) =>
      /\.(jpe?g|png|webp)$/i.test(f),
    );

    const matches = [];
    const unmatched = [];

    const productsBySlug = new Map(products.map((p) => [p.slug, p]));

    for (const file of files) {
      const base = file.replace(/\.[^./]+$/, '').replace(/[-_]/g, ' ');
      const normalizedBase = normalize(base);

      // Explicit override first — see FILENAME_OVERRIDES's comment.
      let product = FILENAME_OVERRIDES[file]
        ? productsBySlug.get(FILENAME_OVERRIDES[file])
        : undefined;

      // Exact match next (fast path for filenames with no parenthetical
      // suffix / apostrophe / truncation differences).
      if (!product) {
        product = productsByNormalizedName.get(normalizedBase);
      }

      // Fallback: fuzzy containment match. Product names often carry a
      // parenthetical suffix the filename omits (e.g. "(25kg Bag)",
      // "(Chrome Steel)") and apostrophes ("Men's") that normalize()
      // strips differently than the filename's underscore. Match if every
      // word in the filename appears in the product's normalized name, or
      // vice versa — whichever is the shorter/core string.
      if (!product) {
        const fileWords = normalizedBase.split(' ').filter(Boolean);
        const candidates = products.filter((p) => {
          const nameWords = normalize(p.name).split(' ').filter(Boolean);
          return fileWords.every((w) => nameWords.includes(w));
        });
        if (candidates.length === 1) {
          product = candidates[0];
        } else if (candidates.length > 1) {
          throw new Error(
            `Ambiguous match for "${file}": matches ${candidates.map((c) => c.name).join(', ')}`,
          );
        }
      }

      if (product) {
        matches.push({ file, product });
      } else {
        unmatched.push(file);
      }
    }

    console.log('Matched files -> products:');
    for (const { file, product } of matches) {
      console.log(`  ${file}  ->  ${product.name}  (${product.slug})`);
    }
    if (unmatched.length) {
      console.log('\nUNMATCHED files (will be skipped):');
      for (const file of unmatched) {
        console.log(`  ${file}`);
      }
    }

    if (!APPLY) {
      console.log(
        '\nDry run only — no uploads or DB writes performed. Re-run with --apply to execute.',
      );
      return;
    }

    for (const { file, product } of matches) {
      const existing = await client.query(
        'SELECT id FROM product_images WHERE product_id = $1 AND is_primary = true',
        [product.id],
      );
      if (existing.rows.length > 0) {
        console.log(`Skipping ${product.name} — already has a primary image.`);
        continue;
      }

      const key = buildProductImageKey(product.id, file);
      const filePath = path.join(IMAGES_DIR, file);

      console.log(`Uploading ${file} -> ${key} (${STORAGE_PROVIDER}) ...`);

      if (STORAGE_PROVIDER === 'cloudinary') {
        await uploadToCloudinary(cloudinary, filePath, key);
      } else {
        await uploadToS3(s3Context, filePath, key);
      }

      try {
        await client.query(
          `INSERT INTO product_images (id, product_id, s3_object_key, alt_text, is_primary, sort_order, created_at)
           VALUES (gen_random_uuid(), $1, $2, $3, true, 0, now())`,
          [product.id, key, product.name],
        );
        console.log(`  Inserted product_images row for ${product.name}.`);
      } catch (insertError) {
        console.error(
          `  Failed to insert product_images row for ${product.name}. Cleaning up uploaded object ${key}...`,
        );
        try {
          if (STORAGE_PROVIDER === 'cloudinary') {
            await deleteFromCloudinary(cloudinary, key);
          } else {
            await deleteFromS3(s3Context, key);
          }
          console.log(`  Cleaned up ${key} successfully.`);
        } catch (cleanupError) {
          console.error(
            `  Cleanup failed for ${key} after DB insert error:`,
            cleanupError,
          );
        }
        throw insertError;
      }
    }

    console.log('\nDone.');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
