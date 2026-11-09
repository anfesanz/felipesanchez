// Single source of truth for personal details used across the desktop.
// Anything marked TODO is a placeholder — replace it with your own text.

const site = {
    // Show or hide parts of the desktop: true = show, false = hide. Rebuild/redeploy after changing.
    show: {
        cv: false,        // the CV document: CV folder item, About Me > Resume tab, cv.md in the terminal
        aboutMe: false,   // the About Me app: dock, app grid, CV folder item, terminal 'about' command
    },

    name: "Felipe Sanchez",
    shortName: "felipe",             // used for the terminal prompt: felipe@lshtm
    host: "lshtm",
    role: "Research Fellow in Computational Social Science",
    affiliation: "London School of Hygiene & Tropical Medicine",
    email: "felipe.sanchez@lshtm.ac.uk",
    url: "https://felipe.example",     // TODO: set once the custom domain is bought
    github: "https://github.com/anfesanz",
    repo: "https://github.com/anfesanz/felipesanchez",
    // VS Code app: opens this repo in github1s.com (a VS Code UI for GitHub). Must be a PUBLIC repo.
    vscode: { repo: "https://github.com/anfesanz/felipesanchez", file: "components/ubuntu.js" },
    linkedin: "",                      // TODO: LinkedIn URL (leave empty to hide)
    scholar: "https://scholar.google.com/citations?user=7wymWWEAAAAJ",
    profile: "https://www.lshtm.ac.uk/aboutus/people/sanchez.felipe",   // LSHTM staff page
    orcid: "",                         // TODO: ORCID URL (leave empty to hide)
    description:
        "Personal website of Felipe Sanchez — data scientist, social statistician and R user. An Ubuntu 20.04 desktop in the browser with live R (webR) and Shiny apps.",

    // Short version of the CV summary (full CV: content/cv.md, shown in the CV folder).
    bio: [
        "I'm a data scientist and Research Fellow in Computational Social Science at the London School of Hygiene & Tropical Medicine, working on harmonised cause-of-death data, spatial analysis of mortality and dashboards for policymakers.",
        "Before that I did a PhD in Social Statistics at the University of Manchester on coherent Bayesian forecasting of mortality and fertility, consulted for the OECD, and spent seven years as a policy researcher at Colombia's National Planning Department working on health, pensions and demography.",
        "I mostly work in R, plus Python, SQL, Stata, Julia and JavaScript. Open the CV folder on the desktop for the full story, or Projects to see what I'm building.",
    ],

    education: [
        { institution: "University of Manchester, UK", years: "", degree: "PhD in Social Statistics · North West Social Science DTP Scholarship" },
        { institution: "University of Manchester, UK", years: "", degree: "MSc in Social Research Methods and Statistics, with Merit · North West Social Science DTP Scholarship" },
        { institution: "Universidad del Cauca, Colombia", years: "", degree: "Diploma in Computer Science and Mathematics" },
        { institution: "National University of Colombia, Bogotá", years: "", degree: "BSc in Economics, First Class" },
    ],

    skills: {
        languages: ["R", "Python", "SQL", "Stata", "Julia", "JavaScript"],
        r: ["tidyverse", "survival", "data.table", "Shiny", "Quarto", "targets", "brms", "ggplot2"],   // not in the CV: check this list
        methods: ["Bayesian demography", "Mortality & fertility forecasting", "Econometric modelling", "Microdata analysis", "Spatial analysis", "Causal inference", "Web scraping", "Dashboards"],
    },

    projects: [
        {
            name: "OpenCOD",
            icon: "./themes/Yaru/projects/opencod.svg",
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
            icon: "./themes/Yaru/projects/heal-ai.svg",
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
            shortName: "Thesis: Mortality & Fertility",
            icon: "./themes/Yaru/projects/thesis.svg",
            date: "2024",
            link: "https://github.com/anfesanz/Thesis_Coherent_Forecasting_Mortality_Fertility_Rates",
            description: [
                "Thesis code: reconstructing population dynamics and forecasting mortality and fertility by age, sex and education under severe data constraints, with Colombia as the case study.",
                "Multistate Holt-filter population reconstruction, Bayesian hierarchical coherent Lee–Carter models (HMC), and CRPS forecast evaluation.",
            ],
            tags: ["R", "Bayesian", "Lee–Carter", "demography"],
        },
    ],

    resumePdf: "", // optional PDF in public/files/; when empty, About > Resume shows the CV from content/cv.md
};

export default site;
