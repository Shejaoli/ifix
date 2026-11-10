#!/bin/bash

echo "Fixing image serving + frontend paths..."

# 1. Fix Express static uploads (backend)
grep -q "express.static" server/index.ts || sed -i '/app.use/a app.use("/uploads", require("express").static("uploads"));' server/index.ts

# 2. Force frontend safe image fallback
find client/src -type f -name "*.tsx" -exec sed -i 's/src={product.imageUrl}/src={product.imageUrl?.startsWith("http") ? product.imageUrl : (import.meta.env.VITE_API_URL || "") + product.imageUrl}/g' {} +

# 3. Fix broken image loop protection
find client/src -type f -name "*.tsx" -exec sed -i 's/onError={(e) => { e.currentTarget.src = "\/placeholder.png"; }}/onError={(e) => { const img=e.currentTarget; if(!img.src.includes("placeholder.png")) img.src="\/placeholder.png"; }}/g' {} +

echo "Done. Now rebuilding..."

npm run build
pm2 restart all --update-env

echo "FIX COMPLETE"
