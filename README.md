# KINGSAMTECH PRO — Modern Tech Blog & In-Browser Web Playground

An ultra-modern, zero-dependency tech blog and developer web sandbox engineered for **100% free hosting on GitHub Pages**.

---

## ⚡ Key Features

1. **Rich Modern Aesthetics**: Deep midnight palette, electric cyber blue and neon cyan accents, subtle glassmorphism (`backdrop-filter: blur`), and smooth radial glowing orbs.
2. **Interactive In-Browser Web Sandbox ("Web Browser")**:
   - Split-pane code editor for HTML, modern CSS, and JavaScript.
   - Isolated live-preview iframe with desktop, tablet (768px), and mobile (375px) viewport toggles.
   - Built-in presets: 3D Glassmorphic Card, Neon Glow Button, and Real-Time HUD Digital Clock.
   - Live console output drawer capturing runtime logs.
3. **Universal Command Palette (`Cmd + K` / `Ctrl + K`)**:
   - Keyboard-driven spotlight search across articles and quick actions.
4. **Native In-Browser Audio Reader (TTS)**:
   - Play/pause audio player reading articles aloud using the native Web Speech API with speed adjustment (1.0x, 1.25x, 1.5x, 2.0x).
5. **Real-time Instant Search & Category Filter**:
   - Live debounced keyword search across titles, excerpts, and full text.
   - Topic category pills: *Cybersecurity & VPN*, *AI & ML*, *Android & Apps*, *Hardware Reviews*, *Tutorials*.
6. **Dynamic Table of Contents**:
   - Automatically indexes `<h2>` and `<h3>` headings with smooth jump navigation.
7. **Code Block Copy Button**:
   - 1-click clipboard copy with animated checkmark feedback.
8. **Local Bookmarks ("Read Later")**:
   - Save articles locally with a slide-over drawer manager powered by `localStorage`.
9. **Native Google AdSense Integration**:
   - Pre-configured responsive slots (`header`, `in-feed`, `in-article`, `sticky-sidebar`) for publisher `ca-pub-6694858954651374`.
10. **Full Legal Compliance & SEO**:
    - Includes `privacy.html`, `terms.html`, `disclaimer.html`, `ads.txt`, `sitemap.xml`, and `robots.txt`.

---

## 🚀 How to Deploy Live to GitHub Pages (In 2 Minutes)

### Step 1: Initialize Git in the Project Folder
Open your Terminal and run:

```bash
cd "/Users/kingsamdekl/Desktop/blog enhancement/github-blog"
git init
git add .
git commit -m "feat: initial release of KINGSAMTECH PRO modern tech blog"
```

### Step 2: Create a New Repository on GitHub
1. Go to [github.com/new](https://github.com/new).
2. Set the repository name:
   - For a custom sub-path: `kingsamtech-blog` (will be live at `https://<your-username>.github.io/kingsamtech-blog/`)
   - OR for your root user site: `<your-username>.github.io` (will be live at `https://<your-username>.github.io/`)
3. Set visibility to **Public**.
4. Leave "Add a README" **unchecked** (we already have one).
5. Click **Create repository**.

### Step 3: Push Your Code to GitHub
Copy the remote URL provided by GitHub and run:

```bash
# Example (replace YOUR_USERNAME with your actual GitHub username):
git remote add origin https://github.com/YOUR_USERNAME/kingsamtech-blog.git
git branch -M main
git push -u origin main
```

### Step 4: Enable GitHub Pages in Repository Settings
1. On your GitHub repository page, click **Settings** (top tab).
2. In the left menu, click **Pages**.
3. Under **Build and deployment** &gt; **Source**:
   - Select **GitHub Actions** (recommended — uses our `.github/workflows/deploy.yml` automatically)
   - OR select **Deploy from a branch** &gt; choose `main` branch &gt; root `/` folder &gt; click **Save**.
4. Wait 60 seconds. Your blog is now **LIVE on the internet** with free global HTTPS!

---

## 📝 How to Add New Articles

Open `assets/js/articles-data.js` and add a new object to the `TECH_ARTICLES` array:

```javascript
{
  id: "my-new-post-slug",
  slug: "my-new-post-slug",
  title: "Your Engaging Article Title",
  category: "AI & Machine Learning",
  categorySlug: "ai",
  featured: false,
  trending: true,
  author: {
    name: "Kingsam",
    role: "Lead Tech Editor",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
  },
  date: "September 18, 2026",
  readTime: "4 min read",
  coverImage: "https://images.unsplash.com/...",
  excerpt: "Brief summary of the article.",
  content: `
    <p class="lead">Article introduction...</p>
    <h2>First Heading</h2>
    <p>Body text...</p>
  `
}
```

Save the file and run:
```bash
git commit -am "Add new article"
git push
```
GitHub Pages will automatically update in seconds!

---

## 💻 Local Testing
To test the site locally on your Mac:
```bash
cd "/Users/kingsamdekl/Desktop/blog enhancement/github-blog"
python3 -m http.server 8080
```
Then open `http://localhost:8080` in your web browser.
