// Import custom styles
function importCSS() {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/gh/LPB8479/faith250-website-custom-code@main/custom_styles.css?v=' + Date.now();
    document.head.appendChild(link);
};

// Add divider line in nav texts menu
function navDivider() {
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

function runAll() {
    importCSS();
    navDivider();
}

// Run on initial load
if (document.readyState === 'complete') {
    runAll();
} else {
    window.addEventListener('load', runAll);
}

// Squarespace-specific fix: Run again if Ajax swaps the page
window.addEventListener('mercury:load', runAll);