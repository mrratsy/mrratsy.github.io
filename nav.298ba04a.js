(function () {
    'use strict';

    // ---------- Mobile nav toggle ----------
    var toggle = document.getElementById('nav-toggle');
    var nav = document.querySelector('.primary-nav');
    if (toggle && nav) {
        toggle.addEventListener('click', function () {
            var open = nav.classList.toggle('open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        nav.addEventListener('click', function (e) {
            if (e.target.tagName === 'A') {
                nav.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // ---------- Analytics helpers ----------
    function ga(eventName, params) {
        if (typeof window.gtag === 'function') {
            try { window.gtag('event', eventName, params || {}); } catch (_) { /* swallow */ }
        }
    }
    function fb(eventName, params) {
        if (typeof window.fbq === 'function') {
            try { window.fbq('track', eventName, params || {}); } catch (_) { /* swallow */ }
        }
    }

    function classify(el, href) {
        if (el.classList.contains('lang-toggle')) return 'lang_toggle';
        if (el.classList.contains('btn-primary')) return 'btn_primary';
        if (el.classList.contains('btn-secondary')) return 'btn_secondary';
        if (el.classList.contains('btn-ghost')) return 'btn_ghost';
        if (el.classList.contains('btn')) return 'btn';
        if (href && href.indexOf('mailto:') === 0) return 'mailto';
        return 'link';
    }

    function amazonProduct(href) {
        // ASIN → product-name mapping. Add more as more editions go live.
        if (/B0GZNQCR7Y/i.test(href)) return 'paperback';
        return 'amazon';
    }

    function newTxnId(product) {
        return 'amz-' + product + '-' + Date.now() + '-'
            + Math.random().toString(36).slice(2, 8);
    }

    // ---------- CTA click tracking ----------
    document.addEventListener('click', function (e) {
        var el = e.target && e.target.closest
            ? e.target.closest('.btn, .lang-toggle')
            : null;
        if (!el) return;

        var href = el.getAttribute('href') || '';
        var label = (el.textContent || '').trim().replace(/\s+/g, ' ');
        var category = classify(el, href);
        var isAmazon = /(^|\/\/)([a-z0-9-]+\.)*amazon\.[a-z.]+/i.test(href);
        var isPdf = /\.pdf(\?|$)/i.test(href);
        var pagePath = window.location.pathname + window.location.search;

        var ctaKind = isAmazon ? 'amazon'
            : isPdf ? 'pdf_download'
            : el.classList.contains('lang-toggle') ? 'lang_toggle'
            : href.indexOf('/sample') >= 0 ? 'read_sample'
            : 'other';

        ga('cta_click', {
            cta_label: label,
            cta_category: category,
            cta_destination: href,
            cta_external: isAmazon || (/^https?:\/\//i.test(href)
                && href.indexOf(window.location.origin) !== 0),
            cta_kind: ctaKind,
            page_path: pagePath
        });

        if (ctaKind === 'read_sample') {
            fb('ViewContent', {
                content_name: 'Excerpts',
                content_category: 'sample',
                content_type: 'article'
            });
        }

        if (isPdf) {
            ga('file_download', {
                link_url: href,
                file_extension: 'pdf',
                file_name: href.split('/').pop(),
                link_text: label
            });
            fb('ViewContent', {
                content_name: 'Promo PDF',
                content_category: 'promo_download',
                content_type: 'product'
            });
        }

        if (isAmazon) {
            var product = amazonProduct(href);
            ga('purchase', {
                transaction_id: newTxnId(product),
                value: 1.00,
                currency: 'EUR',
                affiliation: 'Amazon',
                items: [{
                    item_id: 'amz-' + product,
                    item_name: 'mrratsy — ' + product,
                    item_brand: 'mrratsy',
                    item_category: 'amazon-click',
                    price: 1.00,
                    quantity: 1
                }]
            });
            ga('select_promotion', {
                creative_name: 'amazon-cta',
                creative_slot: category,
                promotion_id: product,
                promotion_name: label
            });
            fb('Purchase', {
                value: 1.00,
                currency: 'EUR',
                content_ids: ['amz-' + product],
                content_name: 'mrratsy — ' + product,
                content_type: 'product',
                content_category: 'amazon-click',
                num_items: 1
            });
            fb('InitiateCheckout', {
                value: 1.00,
                currency: 'EUR',
                content_ids: ['amz-' + product],
                content_name: 'mrratsy — ' + product,
                content_category: 'amazon-click',
                num_items: 1
            });
        }
    }, true);

    // ---------- Newsletter form ----------
    var form = document.querySelector('.newsletter-form');
    var status = document.querySelector('.newsletter-status');
    if (form) {
        form.addEventListener('submit', function (e) {
            var endpoint = form.getAttribute('data-endpoint') || '';
            ga('generate_lead', {
                form_endpoint: endpoint || 'mailto_fallback',
                page_path: window.location.pathname
            });
            fb('Lead', {
                content_name: 'newsletter_signup',
                content_category: endpoint ? 'form' : 'mailto_fallback'
            });
            if (!endpoint) {
                e.preventDefault();
                var emailField = form.querySelector('input[type="email"]');
                var email = emailField ? emailField.value.trim() : '';
                if (!email) return;
                var mailto = form.getAttribute('data-mailto');
                if (mailto) {
                    var url = mailto + (mailto.indexOf('?') === -1 ? '?' : '&')
                        + 'body=' + encodeURIComponent('email: ' + email);
                    window.location.href = url;
                }
                if (status) status.textContent = form.getAttribute('data-thanks') || '';
                form.reset();
            }
        });
    }
})();
