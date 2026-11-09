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
    repo: "https://github.com/anfesanz/felipesanchez",
    // VS Code app: opens this repo in github1s.com (a VS Code UI for GitHub). Must be a PUBLIC repo.
    vscode: { repo: "https://github.com/anfesanz/felipesanchez", file: "components/ubuntu.js" },
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

    projects: [
        {
            name: "OpenCOD",
            date: "2026",
            link: "https://github.com/anfesanz/OpenCOD",
            description: [
                "The Open Cause-of-Death Database: an interactive dashboard of harmonised mortality and population statistics from official national sources, piloted in Latin America.",
                "Explore deaths by age, sex, cause and geographic area, yearly trends and data availability. Live at anfesanz.github.io/OpenCOD.",
            ],
            tags: ["mortality", "cause of death", "dashboard", "JavaScript"],
        },
        {
            name: "HEAL-AI Eval",
            date: "2026",
            link: "https://github.com/anfesanz/heal-ai",
            description: [
                "Shows how average model performance can hide differences between demographic groups, predicting diabetes from public CDC NHANES 2017–2018 data.",
                "Logistic regression, random forest and XGBoost evaluated overall and by subgroup: discrimination, calibration, error rates and bootstrap confidence intervals.",
            ],
            tags: ["health AI", "fairness", "calibration", "Python"],
        },
        {
            name: "Coherent Forecasting of Mortality and Fertility",
            date: "2024",
            link: "https://github.com/anfesanz/Thesis_Coherent_Forecasting_Mortality_Fertility_Rates",
            description: [
                "Thesis code: reconstructing population dynamics and forecasting mortality and fertility by age, sex and education under severe data constraints, with Colombia as the case study.",
                "Multistate Holt-filter population reconstruction, Bayesian hierarchical coherent Lee–Carter models (HMC), and CRPS forecast evaluation.",
            ],
            tags: ["R", "Bayesian", "Lee–Carter", "demography"],
        },
    ],

    resumePdf: "", // TODO: e.g. "./files/Felipe-Sanchez-CV.pdf" (put the PDF in public/files/)
};

export default site;
