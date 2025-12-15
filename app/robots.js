export default function robots() {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/account/', '/checkout/', '/cart/'],
        },
        sitemap: 'https://avenuedesmarques.fr/sitemap.xml',
    }
}
