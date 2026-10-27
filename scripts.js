// Add divider line in nav texts menu
function navDivider(itemNumber) {
    if (document.getElementById('the-texts')) {
        const targetDesktop = document.getElementById('the-texts').children[itemNumber - 1];
        const hr = document.createElement('hr');
        hr.style.width = '100%';
        targetDesktop.after(hr);

        const targetMobile = document.querySelector('header [data-folder="/the-texts-1"] .header-menu-nav-folder-content').children[itemNumber];
        const hrMobile = document.createElement('hr');
        const hrContMobile = document.createElement('div');
        hrContMobile.classList.add('container', 'header-menu-nav-item', 'hr-container');
        hrContMobile.append(hrMobile);
        targetMobile.after(hrContMobile);
    }
}

//Script for Substack embed
const postCount = 3;
const feedUrl = 'https://faith250-feed.littleplasticbrick.workers.dev/'
const clusterWords = ["Cluster", "Association", "Institute", "Coalition", "Clergy and Faith Leaders"]

async function substackEmbed() {
    if (!document.querySelector(".embed-frame")) return;

    // --- HELPER FUNCTIONS ---
    function decodeHTMLEntities(text = '') {
        if (!text) return '';
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        return doc.body.textContent || '';
    }

    function escapeHTML(str = '') {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function buildCard(link, imageUrl, title, subtitle = 'No Subtitle Provided') {
        const safeTitle = escapeHTML(decodeHTMLEntities(title));
        const safeSubtitle = escapeHTML(decodeHTMLEntities(subtitle));
        const safeLink = escapeHTML(link);
        const safeImg = escapeHTML(imageUrl);

        return `
            <div class="post">
              <a href="${safeLink}" class="link-with-image" target="_blank" rel="noopener noreferrer">
                <div class="post-image-wrapper">
                  ${safeImg ? `<img src="${safeImg}" alt="${safeTitle}" class="featured-image">` : ''}
                </div>
                <div class="post-meta-data">
                  <h3>${safeTitle}</h3>
                  <p><strong>${safeSubtitle}</strong></p>
                </div>
              </a>
            </div>
        `;
    }

    // Consolidated filtering logic using enclosureUrl
    function filterPosts(items) {
        if (!Array.isArray(items) || items.length === 0) return [];

        const PREFERRED_DIMENSIONS = ["8000x2500"];
        const BLOCKED_DIMENSIONS = ["1080x1350"];
        const BLOCKED_IMAGES = [
            "798d06d1-5eae-41bc-b275-3db65abe2b4c_256x256",
            "9daa1d33-4cbe-4b7d-b459-1c00b28b8fdd_1742x1742"
        ];

        const SUBSTACK_CDN_PREFIX = "https://substackcdn.com/image/fetch/";

        // 1. Process items sequentially to preserve feed order
        const validCandidates = items
            .filter(item => {
                const title = item.title || '';
                return !clusterWords.some(word => title.endsWith(word));
            })
            .map(item => {
                const imgUrl = item.enclosureUrl || '';
                const isImage = Boolean(imgUrl);
                return { ...item, _imgUrl: imgUrl, _isImage: isImage };
            })
            .filter(item => {
                if (!item._isImage || !item._imgUrl) return false;

                // Must start with CDN prefix
                if (!item._imgUrl.startsWith(SUBSTACK_CDN_PREFIX)) return false;

                // Reject blocked dimensions or specific blocked URLs
                const hasBlockedDimension = BLOCKED_DIMENSIONS.some(dim => item._imgUrl.includes(dim));
                const isBlockedUrl = BLOCKED_IMAGES.some(blocked => item._imgUrl.includes(blocked));

                return !hasBlockedDimension && !isBlockedUrl;
            });

        // 2. Check if we have enough items with preferred dimensions
        const preferredMatches = validCandidates.filter(item =>
            PREFERRED_DIMENSIONS.some(dim => item._imgUrl.includes(dim))
        );

        if (preferredMatches.length >= postCount) {
            return preferredMatches.slice(0, postCount);
        }

        return validCandidates.slice(0, postCount);
    }

    // UI state updates
    const statusEl = document.getElementById('posts-status');
    const containerEl = document.getElementById('latest-posts');

    function renderPosts(items) {
        const html = items.map(item => buildCard(
            item.url,
            item._imgUrl,
            item.title,
            item.description
        )).join('');

        if (statusEl) statusEl.style.display = 'none';
        if (containerEl) {
            containerEl.style.display = 'flex';
            containerEl.innerHTML = html;
        }
    }

    function renderError(message) {
        if (statusEl) {
            statusEl.style.display = 'block';
            statusEl.textContent = message;
        }
        if (containerEl) containerEl.style.display = 'none';
    }

    try {
        const response = await fetch(feedUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        const posts = filterPosts(data.items);

        if (posts.length > 0) {
            renderPosts(posts);
        } else {
            renderError('No posts available.');
        }
    } catch (err) {
        console.error('Feed error:', err);
        renderError('Failed to load the latest posts.');
    }
}

function runAll() {
    navDivider(8);
    navDivider(4);
    substackEmbed();
}

if (document.readyState === 'complete') {
    runAll();
} else {
    window.addEventListener('load', runAll);
}
window.addEventListener('mercury:load', runAll);