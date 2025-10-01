const { SitemapStream, streamToPromise } = require('sitemap');
const { createWriteStream } = require('fs');

const sitemap = new SitemapStream({ hostname: 'https://www.bigmarketplace.africa' });
const writeStream = createWriteStream('./public/sitemap.xml');

sitemap.pipe(writeStream);

// Add routes here
sitemap.write({ url: '/', changefreq: 'weekly', priority: 1.0 });
sitemap.write({ url: '/about', changefreq: 'monthly', priority: 0.7 });
sitemap.write({ url: '/contact', changefreq: 'monthly', priority: 0.7 });
// Add more if you have other routes4

sitemap.end();

streamToPromise(sitemap).then(() => {
  console.log('✅ Sitemap generated at public/sitemap.xml');
});
