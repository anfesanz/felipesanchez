// Single source of truth for personal details used across the desktop.
// Anything marked TODO is a placeholder — replace it with your own text.

const site = {
    name: "Felipe Sanchez",
    shortName: "felipe",             // used for the terminal prompt: felipe@lshtm
    host: "lshtm",
    role: "Data Scientist",            // TODO: confirm exact job title
    affiliation: "London School of Hygiene & Tropical Medicine",
    email: "felipe.sanchez@lshtm.ac.uk",
    url: "https://felipe.example",     // TODO: set once the custom domain is bought
    github: "https://github.com/anfesanz",
    repo: "https://github.com/anfesanz/felipesanchez.github.io",
    linkedin: "",                      // TODO: LinkedIn URL (leave empty to hide)
    scholar: "",                       // TODO: Google Scholar URL (leave empty to hide)
    orcid: "",                         // TODO: ORCID URL (leave empty to hide)
    description:
        "Personal website of Felipe Sanchez — data scientist and R user. An Ubuntu 20.04 desktop in the browser with live R (webR) and Shiny apps.",

    // TODO: replace with your own bio paragraphs.
    bio: [
        "I'm a data scientist at the London School of Hygiene & Tropical Medicine.",
        "I work mostly in R, with a focus on survival analysis and time-to-event models.",
        "This site is an Ubuntu desktop running in your browser — open the Survival Explorer to run a real Shiny app powered by webR.",
    ],

    // TODO: fill in your education.
    education: [
        // { institution: "University name", years: "2018 – 2022", degree: "PhD in ..." },
    ],

    skills: {
        languages: ["R", "SQL", "Python", "Stata", "Git", "Bash"],
        r: ["tidyverse", "survival", "data.table", "Shiny", "Quarto", "targets", "brms", "ggplot2"],
        methods: ["Survival analysis", "Cox models", "Competing risks", "Multilevel models", "Causal inference"],
    },

    // TODO: replace with your own projects.
    projects: [
        {
            name: "Survival Explorer",
            date: "2026",
            link: "https://github.com/anfesanz/felipesanchez.github.io/tree/cv/shiny-apps/survival-explorer",
            description: ["Kaplan–Meier curves, log-rank tests and Cox models on the NCCTG lung data — a Shiny app running fully in the browser via Shinylive/webR."],
            tags: ["R", "Shiny", "webR", "survival"],
        },
    ],

    resumePdf: "", // TODO: e.g. "./files/Felipe-Sanchez-CV.pdf" (put the PDF in public/files/)
};

export default site;
