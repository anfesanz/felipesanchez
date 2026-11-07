import React from 'react'
import Head from 'next/head';
import site from '../../site.config';

export default function Meta() {
    const title = `${site.name} | ${site.role}`;
    return (
        <Head>
            <title>{title}</title>
            <meta charSet="utf-8" />
            <meta name="title" content={title} />
            <meta name="description" content={site.description} />
            <meta name="author" content={site.name} />
            <meta name="keywords" content={`${site.name}, data scientist, R, webR, Shiny, survival analysis, ${site.affiliation}, ubuntu portfolio`} />
            <meta name="robots" content="index, follow" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <meta name="theme-color" content="#E95420" />
            <meta itemProp="name" content={title} />
            <meta itemProp="description" content={site.description} />
            <meta name="twitter:card" content="summary" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={site.description} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={site.description} />
            <meta property="og:url" content={site.url} />
            <meta property="og:site_name" content={site.name} />
            <meta property="og:locale" content="en_GB" />
            <meta property="og:type" content="website" />
            <link rel="icon" href="images/logos/fevicon.svg" />
            <link rel="preload" href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&family=Ubuntu+Mono&display=swap" as="style" />
            <link href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&family=Ubuntu+Mono&display=swap" rel="stylesheet"></link>
        </Head>
    )
}
