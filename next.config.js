/** @type {import('next').NextConfig} */
// Static export for GitHub Pages. With a custom domain the site lives at "/".
// Without one it is served from /<repo-name>/ — set NEXT_PUBLIC_BASE_PATH in that case.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

module.exports = {
    output: 'export',
    basePath,
    assetPrefix: basePath || undefined,
    images: { unoptimized: true },
    trailingSlash: true,
    webpack: (config) => {
        // `import code from './app.R'` gives the file contents as a string
        config.module.rules.push({ test: /\.R$/, type: 'asset/source' });
        return config;
    },
};
