// /api/view.js
import db from './_db.js';
import bcrypt from 'bcryptjs';
import { marked } from 'marked';

export default async function handler(req, res) {
  if (!db) {
    return res.status(500).send('Server configuration error.');
  }

  const { slug } = req.query;

  if (!slug) {
    return res.status(404).send('Not Found');
  }

  try {
    const result = await db.execute({
      sql: "SELECT content, password, expires_at FROM pastes WHERE slug = ?",
      args: [slug]
    });

    if (result.rows.length === 0) {
      return res.status(404).send('Paste not found.');
    }

    const paste = result.rows[0];

    // Check for expiration
    if (paste.expires_at && new Date(paste.expires_at) < new Date()) {
      // Optionally, delete the expired paste
      await db.execute({ sql: "DELETE FROM pastes WHERE slug = ?", args: [slug] });
      return res.status(410).send('This paste has expired and has been deleted.');
    }

    // Check for password
    if (paste.password) {
      const providedPassword = req.query.password;
      if (providedPassword && bcrypt.compareSync(providedPassword, paste.password)) {
        // Password matches, proceed to rendering content
      } else {
        return res.redirect(302, `/password?slug=${slug}`);
      }
    }
    
    // Render the markdown content to HTML
    const htmlContent = marked(paste.content);

    const htmlPage = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>View Paste</title>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.1.0/github-markdown.min.css">
          <style>
              body {
                  display: flex;
                  justify-content: center;
                  padding: 2rem;
                  background-color: #f6f8fa;
              }
              .markdown-body {
                  box-sizing: border-box;
                  min-width: 200px;
                  max-width: 980px;
                  margin: 0 auto;
                  padding: 45px;
                  background-color: #fff;
                  border: 1px solid #d0d7de;
                  border-radius: 6px;
              }
          </style>
      </head>
      <body>
          <article class="markdown-body">
              ${htmlContent}
          </article>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(htmlPage);

  } catch (error) {
    console.error("[FATAL][View Paste] An unhandled error occurred:", error);
    return res.status(500).send('Internal Server Error.');
  }
}