const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  connectionString:
    'postgresql://ifix-user:iFix-Electronics-12@localhost:5432/ifix-db',
});

const UPLOADS_DIR = path.join(
  process.env.HOME,
  'apps',
  'ifix-electronics',
  'ifix-electronics (1)',
  'public',
  'uploads',
  'products'
);

function checkFile(imagePath) {
  if (!imagePath) return false;

  const filename = path.basename(imagePath);
  const fullPath = path.join(UPLOADS_DIR, filename);

  return {
    filename,
    exists: fs.existsSync(fullPath),
  };
}

async function main() {
  await client.connect();

  const result = await client.query(`
    SELECT
      id,
      name,
      image_url,
      additional_images
    FROM products
    ORDER BY id
  `);

  const missing = [];

  for (const product of result.rows) {

    const mainImage = checkFile(product.image_url);

    if (mainImage && !mainImage.exists) {
      missing.push({
        product_id: product.id,
        product_name: product.name,
        type: 'MAIN',
        file: mainImage.filename,
      });
    }

    if (product.additional_images) {
      for (const image of product.additional_images) {
        const extraImage = checkFile(image);

        if (extraImage && !extraImage.exists) {
          missing.push({
            product_id: product.id,
            product_name: product.name,
            type: 'ADDITIONAL',
            file: extraImage.filename,
          });
        }
      }
    }
  }

  console.log('\n============================');
  console.log('MISSING PRODUCT IMAGES');
  console.log('============================\n');

  missing.forEach(item => {
    console.log(
      `[${item.type}] Product #${item.product_id} - ${item.product_name}`
    );
    console.log(`Missing File: ${item.file}`);
    console.log('');
  });

  console.log(`TOTAL MISSING FILES: ${missing.length}`);

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
