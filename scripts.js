// Add divider line in nav texts menu
function navDivider() {
    if (document.getElementById('the-texts')) {
        const doc4 = document.getElementById('the-texts').children[3];
        const doc4Mobile = document.querySelector('header [data-folder="/the-texts-1"] .header-menu-nav-folder-content').children[4];

        const hr = document.createElement('hr');
        hr.style.width = '100%';
        doc4.after(hr);

        const hrMobile = document.createElement('hr');
        const hrContMobile = document.createElement('div');
        hrContMobile.classList.add('container', 'header-menu-nav-item', 'hr-container');
        hrContMobile.append(hrMobile);
        doc4Mobile.after(hrContMobile);
    }
}

//Script for Substack embed
const postCount = 3;
const primaryFeedUrl = 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.joinfaith250.org%2Ffeed';
const secondaryFeedUrl = 'https://toptalproxy.littleplasticbrick.workers.dev/'
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

    function extractImageFromHTML(htmlContent) {
        if (!htmlContent) return null;
        const match = htmlContent.match(/<a[^>]+href=["']([^"']+)["']/i);
        return match ? match[1] : null;
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

    // Consolidated filtering logic for both feeds
    function filterPosts(items, isSecondary = false) {
        if (!Array.isArray(items) || items.length === 0) return [];

        const PREFERRED_DIMENSIONS = ["8000x2500"];
        const BLOCKED_DIMENSIONS = ["1080x1350"];
        const BLOCKED_IMAGES = [
            "798d06d1-5eae-41bc-b275-3db65abe2b4c_256x256",
            "9daa1d33-4cbe-4b7d-b459-1c00b28b8fdd_1742x1742"
        ];

        const SUBSTACK_CDN_PREFIX = "https://substackcdn.com/image/fetch/";

        const getImgUrl = (item) => {
            if (isSecondary) {
                return extractImageFromHTML(item.content_html);
            }
            return item.enclosure?.link;
        };

        // 1. Process items sequentially to preserve feed order
        const validCandidates = items
            .filter(item => {
                const title = item.title || '';
                return !clusterWords.some(word => title.endsWith(word));
            })
            .map(item => {
                const imgUrl = getImgUrl(item);
                const isImage = isSecondary ? Boolean(imgUrl) : item.enclosure?.type?.includes("image");
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

        // If preferred matches alone hit the target count, take them in their original feed order
        if (preferredMatches.length >= postCount) {
            return preferredMatches.slice(0, postCount);
        }

        // Otherwise, fallback to the top valid items in original feed order to fill postCount
        return validCandidates.slice(0, postCount);
    }

    // UI state updates
    const statusEl = document.getElementById('posts-status');
    const containerEl = document.getElementById('latest-posts');

    function renderPosts(items, isSecondary = false) {
        const html = items.map(item => buildCard(
            isSecondary ? item.url : item.link,
            item._imgUrl,
            item.title,
            isSecondary ? item.summary : item.description
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


    // 1. Try Primary Feed
    try {
        const response = await fetch(primaryFeedUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        const posts = filterPosts(data.items, false);

        if (posts.length === 0) throw new Error('No valid posts from primary feed');

        renderPosts(posts, false);
        return;
    } catch (err) {
        console.warn('Primary API failed, trying backup...', err.message);
    }

    // 2. Try Secondary Feed
    try {
        const response = await fetch(secondaryFeedUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        const posts = filterPosts(data.items, true);

        if (posts.length > 0) {
            renderPosts(posts, true);
        } else {
            renderError('No posts available.');
        }
    } catch (err) {
        console.error('Secondary feed error:', err);
        renderError('Failed to load the latest posts.');
    }
}

function runAll() {
    navDivider();
    substackEmbed();
}

if (document.readyState === 'complete') {
    runAll();
} else {
    window.addEventListener('load', runAll);
}
window.addEventListener('mercury:load', runAll);