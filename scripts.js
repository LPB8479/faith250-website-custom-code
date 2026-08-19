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

function substackEmbed() {
    function buildCard(link, imageUrl, title, subtitle = 'No Subtitle Provided') {
        return `
          <div class="post">
            <a href="${link}" class="link-with-image" target="_blank">
              <div class="post-image-wrapper">
                ${imageUrl ? `<img src="${imageUrl}" alt="${title}" class="featured-image">` : ''}
              </div>
              <div class="post-meta-data">
                <h3>${title}</h3>
                <p><strong>${subtitle}</strong></p>
              </div>
            </a>
          </div>
        `;
    }

    async function fetchLatestPosts() {
        const statusEl = document.getElementById('posts-status');
        const containerEl = document.getElementById('latest-posts');

        try {
            console.log("attempting primary API");
            const response = await fetch(primaryFeedUrl);
            const data = await response.json();

            // // Filter items based on your conditions
            let filteredItems = (data.items || []).filter(item =>
                item.enclosure.type.includes("image") &&
                (item.enclosure.link.includes("8000x2500") || item.enclosure.link.includes("1920x1080")) &&
                !clusterWords.some(word => item.title.endsWith(word))
            );

            // Limit to sized imges unless needed to fill the post count
            if (filteredItems.length < postCount) {
                filteredItems = (data.items || []).filter(item =>
                    item.enclosure.type.includes("image") &&
                    !item.enclosure.link.includes("798d06d1-5eae-41bc-b275-3db65abe2b4c_256x256") &&
                    !clusterWords.some(word => item.title.endsWith(word))
                );
            }

            // Get up to a number of matching items
            const latestItems = filteredItems.slice(0, postCount);
            console.log(latestItems)

            if (latestItems.length > 0) {
                const postsHTML = latestItems.map(item => {
                    return buildCard(item.link, item.enclosure.link, item.title, item.description)
                }).join('');

                statusEl.style.display = 'none';
                containerEl.style.display = 'flex';
                containerEl.innerHTML = postsHTML;
            } else {
                throw new Error('Primary API error')
            }
        } catch (primaryError) {
            console.warn('Primary API failed. Trying backup...', primaryError.message)
            try {
                console.log("attempting secondary API");
                const response = await fetch(secondaryFeedUrl);
                const data = await response.json();

                function parseSecondaryHTML(item) {
                    const htmlContent = item.content_html;
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(htmlContent, 'text/html');
                    const firstAnchor = doc.querySelector('a');
                    const href = firstAnchor ? firstAnchor.getAttribute('href') : null;
                    return href;
                }

                // // Filter items based on your conditions
                let filteredItems = (data.items || []).filter(item => {
                    const imageURL = parseSecondaryHTML(item);
                    return imageURL != null && (imageURL.includes("8000x2500") || imageURL.includes("1920x1080")) && !clusterWords.some(word => item.title.endsWith(word))
                });

                // Limit to sized imges unless needed to fill the post count
                if (filteredItems.length < postCount) {
                    filteredItems = (data.items || []).filter(item => {
                        const imageURL = parseSecondaryHTML(item);
                        return imageURL != null && imageURL.includes("798d06d1-5eae-41bc-b275-3db65abe2b4c_256x256") &&
                            !clusterWords.some(word => item.title.endsWith(word))
                    });
                }

                // Get up to a number of matching items
                const latestItems = filteredItems.slice(0, postCount);
                console.log(latestItems)

                if (latestItems.length > 0) {
                    const postsHTML = latestItems.map(item => {
                        return buildCard(item.url, parseSecondaryHTML(item), item.title, item.summary);
                    }).join('');

                    statusEl.style.display = 'none';
                    containerEl.style.display = 'flex';
                    containerEl.innerHTML = postsHTML;
                } else {
                    statusEl.style.display = 'block';
                    statusEl.textContent = 'No posts available.';
                    containerEl.style.display = 'none';
                    console.log(data.items[0])
                }
            } catch (secondaryError) {
                statusEl.style.display = 'block';
                statusEl.textContent = 'Failed to load the latest posts.';
                containerEl.style.display = 'none';
                console.error('Error fetching the secondary RSS feed:', secondaryError);
            }
        }
    }

    if (document.querySelector(".embed-frame")) {
        fetchLatestPosts();
    } else {
        return
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