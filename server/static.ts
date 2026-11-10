import express, { type Express } from "express";
import fs from "fs";
import path from "path";

const sharp = require("sharp");

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Existing catalog data contains image URLs with stable filenames. Return
  // resized WebP data at those same URLs, cached on disk after the first hit.
  app.get("/images/:filename", async (req, res, next) => {
    const filename = req.params.filename;
    if (path.basename(filename) !== filename || !/\.(?:jpe?g|png|webp)$/i.test(filename)) {
      return next();
    }

    // Hero banners are already optimized, full-resolution WebP assets. Avoid
    // shrinking them to the optimizer's 900px default before rendering them
    // in the 1200px-wide homepage carousel.
    if (/^hero-.*\.webp$/i.test(filename)) return next();

    const sourcePath = path.join(distPath, "images", filename);
    try {
      const sourceStat = await fs.promises.stat(sourcePath);
      if (!sourceStat.isFile()) return next();

      const requestedWidth = Number(req.query.w);
      const width = [320, 480, 640, 720, 900, 1200, 1600].includes(requestedWidth) ? requestedWidth : 900;
      const optimizedDir = path.join(distPath, ".optimized-images");
      await fs.promises.mkdir(optimizedDir, { recursive: true });
      const optimizedName = `${path.parse(filename).name}-${Math.trunc(sourceStat.mtimeMs)}-${sourceStat.size}-${width}.webp`;
      const optimizedPath = path.join(optimizedDir, optimizedName);
      try {
        await fs.promises.access(optimizedPath, fs.constants.R_OK);
      } catch {
        await sharp(sourcePath)
          .rotate()
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: 80, effort: 4 })
          .toFile(optimizedPath);
      }

      res.setHeader("Cache-Control", "public, max-age=2592000, stale-while-revalidate=86400");
      res.type("image/webp").sendFile(optimizedPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return next();
      console.error(`Static image optimization failed for ${filename}:`, error);
      return next();
    }
  });

  // Serve build-time Brotli variants for fingerprinted JavaScript and CSS.
  // These files are byte-for-byte tied to the hashed asset URL, so they remain
  // safe to cache for a year while cutting the transfer size substantially.
  app.use("/assets", (req, res, next) => {
    if (!/(^|,)\s*br(?:\s*;|,|$)/i.test(req.get("accept-encoding") || "")) {
      return next();
    }
    const assetName = path.basename(req.path);
    if (!/\.(?:css|js)$/.test(assetName)) return next();

    const compressedPath = path.join(distPath, "assets", `${assetName}.br`);
    if (!fs.existsSync(compressedPath)) return next();

    res.setHeader("Content-Type", assetName.endsWith(".css") ? "text/css; charset=utf-8" : "text/javascript; charset=utf-8");
    res.setHeader("Content-Encoding", "br");
    res.setHeader("Vary", "Accept-Encoding");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.sendFile(compressedPath);
  });

  // Serve uploads with NO long-term caching
  app.use("/uploads", express.static(path.join(distPath, "uploads"), {
    maxAge: 0,
    etag: true,
    lastModified: true,
  }));

  // Serve other static assets with caching
  app.use(
    express.static(distPath, {
      maxAge: "1d",
      immutable: false,
      etag: true,
      lastModified: true,
      setHeaders: (res, filePath) => {
        const relativePath = path.relative(distPath, filePath).replace(/\\/g, "/");

        // Vite fingerprints bundled assets, so they can be cached until their
        // content hash changes. Keep the HTML shell and other named files on
        // the default short cache; public images use the longer policy below.
        if (relativePath.startsWith("assets/")) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else if (
          relativePath.startsWith("images/") ||
          /^(?:ifix-logo|logo)\.(?:png|webp|svg)$/.test(relativePath)
        ) {
          // Public product and hero image URLs are stable names rather than
          // content hashes. A month-long cache substantially improves repeat
          // visits while still allowing changed catalog imagery to refresh.
          res.setHeader("Cache-Control", "public, max-age=2592000, stale-while-revalidate=86400");
        }
      },
    }),
  );

  app.use("*", (_req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
