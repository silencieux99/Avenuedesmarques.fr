export default async function sitemap() {
    const baseUrl = 'https://avenuedesmarques.fr';

    // Pages statiques principales
    const routes = [
        '',
        '/nouveautes',
        '/products',
        '/contact',
        '/track-order', // Important pour le SEO (rassure google)
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: route === '' ? 1 : 0.8,
    }));

    // Collections principales (à adapter selon vos catégories réelles)
    const categories = [
        'sacs',
        'accessoires',
        'vetements',
        'chaussures',
    ].map((cat) => ({
        url: `${baseUrl}/category/${cat}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
    }));

    return [...routes, ...categories];
}
