import express from 'express';
import Post from '../models/Post.js';

const router = express.Router();

// ── Detect the frontend origin ──
// In production, this should be set via env var FRONTEND_URL (e.g. https://pattayapal.com)
// In development, it defaults to http://localhost:5173
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ── Helper: escape HTML to prevent XSS in meta tags ──
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * GET /api/share/posts/:id
 *
 * When a Facebook/Line/X bot hits this URL it will receive a minimal HTML page
 * containing proper Open Graph meta tags (title, description, image).
 * A human visitor will be immediately redirected to the real frontend page.
 */
router.get('/posts/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name username profileImage');

    if (!post) {
      return res.redirect(`${FRONTEND_URL}/community`);
    }

    // ── Build Open Graph values ──
    const authorName = post.author?.name || 'PattayaPal User';
    const title = escapeHtml(`โพสต์จาก ${authorName} — PattayaPal`);
    const description = escapeHtml(
      post.content
        ? post.content.substring(0, 200).replace(/\n/g, ' ')
        : post.sharedPackage?.title || 'ดูโพสต์นี้บน PattayaPal'
    );

    // ── Helpers: แปลงเป็น URL เต็ม และแยกวิดีโอ ──
    const SITE_URL = String(process.env.PUBLIC_SITE_URL || FRONTEND_URL).replace(/\/+$/, '');
    const videoExt = /\.(mp4|webm|mov|avi|mkv)(?:$|[?#])/i;

    const toFullUrl = (value) => {
      const raw = typeof value === 'string' ? value : value?.url;
      if (!raw || typeof raw !== 'string') return '';
      if (/^https?:\/\//i.test(raw)) return raw;
      return `${SITE_URL}/${raw.replace(/^\/+/, '')}`;
    };

    const isVideoItem = (item) => {
      const url = toFullUrl(item);
      const mime = typeof item === 'object' ? (item?.mimetype || item?.type || '') : '';
      return String(mime).startsWith('video') || videoExt.test(url);
    };

    // ── เลือกรูปที่ดีที่สุด: รูปแรกของโพสต์ → ปกแพ็กเกจ → รูปโปรไฟล์ → รูปค่าเริ่มต้น ──
    let imageUrl = '';
    if (Array.isArray(post.media)) {
      const firstImage = post.media.find((item) => !isVideoItem(item) && toFullUrl(item));
      if (firstImage) imageUrl = toFullUrl(firstImage);
    }
    if (!imageUrl && post.sharedPackage?.coverImages?.length > 0) {
      imageUrl = toFullUrl(post.sharedPackage.coverImages[0]);
    }
    if (!imageUrl && post.author?.profileImage?.url) {
      imageUrl = toFullUrl(post.author.profileImage.url);
    }
    if (!imageUrl) {
      imageUrl = `${SITE_URL}/og-image.jpg`;
    }

    const postUrl = `${FRONTEND_URL}/posts/${post._id}`;
    const safeImage = escapeHtml(imageUrl);
    const safePostUrl = escapeHtml(postUrl);

    // ── Return minimal HTML with OG tags + instant JS redirect for real users ──
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=60'); // cache for 1 minute
    return res.send(`<!DOCTYPE html>
<html lang="th" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>

  <!-- ── Open Graph (Facebook / Line / Messenger) ── -->
  <meta property="og:type"        content="article" />
  <meta property="og:url"         content="${safePostUrl}" />
  <meta property="og:title"       content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image"       content="${safeImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name"   content="PattayaPal" />
  <meta property="og:locale"      content="th_TH" />

  <!-- ── Twitter Card ── -->
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image"       content="${safeImage}" />

  <!-- ── Regular meta ── -->
  <meta name="description" content="${description}" />

  <!-- ── Redirect real users instantly ── -->
  <meta http-equiv="refresh" content="0;url=${safePostUrl}" />
</head>
<body>
  <p>กำลังนำคุณไปที่โพสต์... <a href="${safePostUrl}">คลิกที่นี่ถ้าหน้าเว็บไม่เปลี่ยน</a></p>
  <script>window.location.replace("${postUrl.replace(/"/g, '\\"')}");</script>
</body>
</html>`);

  } catch (err) {
    console.error('[shareRoutes] Error serving OG page:', err);
    return res.redirect(`${FRONTEND_URL}/community`);
  }
});

export default router;
