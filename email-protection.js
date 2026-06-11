/**
 * Email Protection - Prevents email scraping bots
 * Obfuscates email address using JavaScript injection
 */

const EmailProtection = (() => {
    // Email parts (split to prevent scraping)
    const user = 'fyzedwin';
    const domain = 'gmail.com';

    // Reconstruct email
    const getEmail = () => `${user}@${domain}`;
    const getMailto = () => `mailto:${getEmail()}`;

    // Inject email into all protected elements
    const init = () => {
        const email = getEmail();
        const mailto = getMailto();

        // Protect all elements with data-email-protect attribute
        document.querySelectorAll('[data-email-protect]').forEach(el => {
            const type = el.getAttribute('data-email-protect');

            switch(type) {
                case 'mailto':
                    // For <a> tags - set href only, preserve inner HTML (icon + text)
                    el.href = mailto;
                    break;

                case 'text':
                    // For <span> or text elements - set text only
                    el.textContent = email;
                    break;

                case 'link':
                    // For <a> tags - set href only (text already set)
                    el.href = mailto;
                    break;
            }
        });

        // Legacy support: elements with specific IDs
        const emailLink = document.getElementById('emailLink');
        const emailDisplay = document.getElementById('emailDisplay');
        const emailBtn = document.getElementById('emailBtn');

        if (emailLink) {
            emailLink.href = mailto;
        }
        if (emailDisplay) {
            emailDisplay.textContent = email;
        }
        if (emailBtn) {
            emailBtn.href = mailto;
        }
    };

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return { getEmail, getMailto, init };
})();
