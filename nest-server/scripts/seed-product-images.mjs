// One-off script: uploads the images in Product_images/ to Cloudinary and
// registers them in the product_images table, matched to existing products
// by normalized filename <-> product name.
//
// Mirrors the app's own conventions so these rows are indistinguishable from
// ones created through the real API:
//   - storage key format: products/<productId>/<uuid>-<sanitized-filename>
//     (see CloudinaryStorageStrategy.buildProductImageKey)
//   - uploaded via the Cloudinary Admin SDK (equivalent end state to the
//     signed-upload flow the app uses for browser clients — this is a
//     trusted server-side script, so there's no need for a signed POST)
//   - one row per image, is_primary = true, sort_order = 0 (each product
//     gets exactly one image here)
//
// Usage:
//   node scripts/seed-product-images.mjs            (dry run, no writes)
//   node scripts/seed-product-images.mjs --apply     (uploads + inserts)
//
// Reads Cloudinary credentials from the same env vars as the app
// (CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET in .env) and the Postgres
// connection from DATABASE_URL (set it in the shell before running against
// a remote DB — never hardcode a connection string with credentials here).

import { randomUUID } from 'node:crypto';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.join(__dirname, '..', '.env') });

const IMAGES_DIR = path.join(__dirname, '..', '..', 'Product_images');
const APPLY = process.argv.includes('--apply');

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

async function main() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET must be set (nest-server/.env).',
    );
  }
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      'Set DATABASE_URL to the target Postgres connection string before running this script.',
    );
  }

  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });
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

      console.log(`Uploading ${file} -> ${key} ...`);
      await cloudinary.uploader.upload(filePath, {
        public_id: key,
        resource_type: 'image',
        overwrite: false,
      });

      await client.query(
        `INSERT INTO product_images (id, product_id, s3_object_key, alt_text, is_primary, sort_order, created_at)
         VALUES (gen_random_uuid(), $1, $2, $3, true, 0, now())`,
        [product.id, key, product.name],
      );
      console.log(`  Inserted product_images row for ${product.name}.`);
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
