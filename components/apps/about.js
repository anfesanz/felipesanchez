import React, { Component } from 'react';
import ReactGA from 'react-ga4';
import site from '../../site.config';
import { CV } from './cv';

const SECTIONS = [
    { id: "about", label: "About Me", icon: "./themes/Yaru/status/about.svg" },
    { id: "research", label: "Research", icon: "./themes/Yaru/status/projects.svg" },
    { id: "publications", label: "Publications", icon: "./themes/Yaru/system/cv-document.svg" },
    { id: "education", label: "Education", icon: "./themes/Yaru/status/education.svg" },
    { id: "skills", label: "Skills", icon: "./themes/Yaru/status/skills.svg" },
    { id: "projects", label: "Projects", icon: "./themes/Yaru/status/projects.svg" },
    { id: "contact", label: "Contact", icon: "./themes/Yaru/status/contact.svg" },
    { id: "resume", label: "Resume", icon: "./themes/Yaru/status/download.svg" },
].filter(s => s.id !== "resume" || site.show.cv);

export class AboutMe extends Component {
    constructor() {
        super();
        this.state = { active_screen: "about", navbar: false };
    }

    componentDidMount() {
        let last = null;
        try { last = localStorage.getItem("about-section"); } catch (e) { }
        if (last && SECTIONS.some(s => s.id === last)) this.setState({ active_screen: last });
    }

    changeScreen = (e) => {
        const screen = e.currentTarget.id;
        try { localStorage.setItem("about-section", screen); } catch (e) { }
        ReactGA.send({ hitType: "pageview", page: `/${screen}`, title: screen });
        this.setState({ active_screen: screen });
    }

    renderNavLinks = () => SECTIONS.map(s => (
        <div key={s.id} id={s.id} tabIndex="0" onFocus={this.changeScreen} className={(this.state.active_screen === s.id ? " bg-ub-orange bg-opacity-100 hover:bg-opacity-95" : " hover:bg-gray-50 hover:bg-opacity-5 ") + " w-28 md:w-full md:rounded-none rounded-sm cursor-default outline-none py-1.5 focus:outline-none duration-100 my-0.5 flex justify-start items-center pl-2 md:pl-2.5"}>
            <img className=" w-3 md:w-4" alt="" src={s.icon} />
            <span className=" ml-1 md:ml-2 text-gray-50 ">{s.label}</span>
        </div>
    ));

    renderScreen = () => {
        switch (this.state.active_screen) {
            case "research": return <Research />;
            case "publications": return <Publications />;
            case "education": return <Education />;
            case "skills": return <Skills />;
            case "projects": return <Projects />;
            case "contact": return <Contact />;
            case "resume": return <Resume />;
            default: return <About />;
        }
    }

    render() {
        return (
            <div className="w-full h-full flex bg-ub-cool-grey text-white select-none relative">
                <div className="md:flex hidden flex-col w-1/4 md:w-1/5 text-sm overflow-y-auto windowMainScreen border-r border-black">
                    {this.renderNavLinks()}
                </div>
                <div onClick={() => this.setState({ navbar: !this.state.navbar })} className="md:hidden flex flex-col items-center justify-center absolute bg-ub-cool-grey rounded w-6 h-6 top-1 left-1">
                    <div className=" w-3.5 border-t border-white"></div>
                    <div className=" w-3.5 border-t border-white" style={{ marginTop: "2pt", marginBottom: "2pt" }}></div>
                    <div className=" w-3.5 border-t border-white"></div>
                    <div className={(this.state.navbar ? " visible animateShow z-30 " : " invisible ") + " md:hidden text-xs absolute bg-ub-cool-grey py-0.5 px-1 rounded-sm top-full mt-1 left-0 shadow border-black border border-opacity-20"}>
                        {this.renderNavLinks()}
                    </div>
                </div>
                <div className="flex flex-col w-3/4 md:w-4/5 justify-start items-center flex-grow bg-ub-grey overflow-y-auto windowMainScreen">
                    {this.renderScreen()}
                </div>
            </div>
        );
    }
}

export default AboutMe;

export const displayAboutMe = () => <AboutMe />;

function Heading({ children }) {
    return (
        <div className=" font-medium relative text-2xl mt-2 md:mt-4 mb-4">
            {children}
            <div className="absolute pt-px bg-white mt-px top-full w-full">
                <div className="bg-white absolute rounded-full p-0.5 md:p-1 top-0 transform -translate-y-1/2 left-full"></div>
                <div className="bg-white absolute rounded-full p-0.5 md:p-1 top-0 transform -translate-y-1/2 right-full"></div>
            </div>
        </div>
    );
}

function About() {
    const icons = ["list-pc", "list-building", "list-time", "list-star"];
    return (
        <>
            <div className="w-20 md:w-28 my-4 rounded-full overflow-hidden">
                <img className="w-full" src="./images/logos/avatar.svg" alt={site.name} />
            </div>
            <div className=" mt-4 md:mt-8 text-lg md:text-2xl text-center px-1">
                <div>my name is <span className="font-bold">{site.name}</span>,</div>
                <div className="font-normal ml-1">I'm a <span className="text-ubt-gedit-orange font-bold">{site.role}</span></div>
                <div className="text-sm md:text-base text-gray-300 mt-2">{site.department}</div>
                <div className="text-sm md:text-base text-gray-400">{site.affiliation}</div>
            </div>
            <div className=" mt-4 relative md:my-8 pt-px bg-white w-32 md:w-48">
                <div className="bg-white absolute rounded-full p-0.5 md:p-1 top-0 transform -translate-y-1/2 left-0"></div>
                <div className="bg-white absolute rounded-full p-0.5 md:p-1 top-0 transform -translate-y-1/2 right-0"></div>
            </div>
            <ul className=" mt-4 leading-tight tracking-tight text-sm md:text-base w-5/6 md:w-3/4 emoji-list">
                {site.bio.map((p, i) => <li key={i} className={(i ? " mt-3 " : "") + icons[i % icons.length]}>{p}</li>)}
            </ul>
            <div className="flex flex-wrap justify-center gap-2 mt-6 mb-6 px-4 text-sm">
                <a className="px-3 py-1 rounded border border-gray-400 hover:border-ubb-orange" href={site.url}>Home</a>
                <a className="px-3 py-1 rounded border border-gray-400 hover:border-ubb-orange" href={site.teachingMaterials} target="_blank" rel="noreferrer">Teaching Materials</a>
            </div>
        </>
    );
}

function Research() {
    return (
        <>
            <Heading>Research</Heading>
            <div className="w-10/12 text-sm md:text-base leading-relaxed mt-2">{site.researchFocus}</div>
            <div className="w-10/12 mt-7">
                <h3 className="text-lg font-bold text-ubt-gedit-orange">Work in Progress</h3>
                <ul className="ml-5 mt-2 text-sm md:text-base">
                    {site.workInProgress.map((item, i) => <li key={i} className="list-disc mt-3 leading-relaxed">{item}</li>)}
                </ul>
            </div>
        </>
    );
}

function Publications() {
    return (
        <>
            <Heading>Selected Publications</Heading>
            <ol className="w-10/12 mt-2 mb-6 ml-5 text-sm md:text-base">
                {site.publications.map((publication, i) => (
                    <li key={publication.link} className="list-decimal mt-4 leading-relaxed pl-1">
                        {publication.authors} ({publication.year}).{' '}
                        <a className="text-ubt-gedit-orange underline" href={publication.link} target="_blank" rel="noreferrer">
                            {publication.title}
                        </a>. <em>{publication.journal}</em>{publication.details ? `, ${publication.details}` : ''}.
                    </li>
                ))}
            </ol>
        </>
    );
}

function Contact() {
    const links = [
        ["LSHTM profile", site.profile],
        ["Google Scholar", site.scholar],
        ["GitHub", site.github],
        ["Teaching Materials", site.teachingMaterials],
    ].filter(([, link]) => link);
    return (
        <>
            <Heading>Contact</Heading>
            <div className="w-10/12 mt-3 text-sm md:text-base leading-relaxed">
                <div className="font-bold">{site.department}</div>
                <div>{site.affiliation}</div>
                {site.address.map(line => <div key={line}>{line}</div>)}
            </div>
            <div className="w-10/12 mt-7 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {links.map(([label, link]) => (
                    <a key={label} href={link} target="_blank" rel="noreferrer" className="px-3 py-2 rounded border border-gray-500 hover:border-ubb-orange hover:bg-white hover:bg-opacity-5">
                        {label} <span aria-hidden="true">↗</span>
                    </a>
                ))}
            </div>
        </>
    );
}

function Education() {
    return (
        <>
            <Heading>Education</Heading>
            <ul className=" w-10/12  mt-4 ml-4 px-0 md:px-1">
                {site.education.length === 0 && <li className="text-gray-400 text-sm">Coming soon.</li>}
                {site.education.map((e, i) => (
                    <li key={i} className={"list-disc" + (i ? " mt-4" : "")}>
                        <div className=" text-lg md:text-xl text-left font-bold leading-tight">{e.institution}</div>
                        {e.years && <div className=" text-sm text-gray-400 mt-0.5">{e.years}</div>}
                        <div className=" text-sm md:text-base">{e.degree}</div>
                    </li>
                ))}
            </ul>
        </>
    );
}

function Pill({ children, accent }) {
    return <span className={`px-2 py-0.5 m-1 rounded-full border text-sm ${accent ? "border-ubb-orange text-ubt-gedit-orange" : "border-gray-400 text-gray-200"}`}>{children}</span>;
}

function Skills() {
    const groups = [["Languages & tools", site.skills.languages], ["R ecosystem", site.skills.r], ["Methods", site.skills.methods]];
    return (
        <>
            <Heading>Skills</Heading>
            <ul className=" tracking-tight text-sm md:text-base w-10/12 emoji-list">
                <li className=" list-arrow mt-4 leading-tight">My main language is <strong className="text-ubt-gedit-orange">R</strong>, for everything from data wrangling to modelling and reporting.</li>
            </ul>
            {groups.map(([title, items]) => (
                <div key={title} className="w-10/12 mt-5">
                    <div className="font-bold mb-1">{title}</div>
                    <div className="flex flex-wrap -m-1">{items.map(s => <Pill key={s} accent={title === "R ecosystem"}>{s}</Pill>)}</div>
                </div>
            ))}
        </>
    );
}

function Projects() {
    return (
        <>
            <Heading>Projects</Heading>
            {site.projects.map((p, i) => (
                <a key={i} href={p.link} target="_blank" rel="noreferrer" className="flex w-full flex-col px-4">
                    <div className="w-full py-1 px-2 my-2 border border-gray-50 border-opacity-10 rounded hover:bg-gray-50 hover:bg-opacity-5 cursor-pointer">
                        <div className="flex flex-wrap justify-between items-center">
                            <div className=" text-base md:text-lg mr-2">{p.name.toLowerCase()}</div>
                            <div className="text-gray-300 font-light text-sm">{p.date}</div>
                        </div>
                        <ul className=" tracking-normal leading-tight text-sm font-light ml-4 mt-1">
                            {p.description.map((d, j) => <li key={j} className="list-disc mt-1 text-gray-100">{d}</li>)}
                        </ul>
                        <div className="flex flex-wrap items-start justify-start text-xs py-2">
                            {(p.tags || []).map(t => <span key={t} className="px-1.5 py-0.5 w-max border border-ubb-orange text-ubt-gedit-orange m-1 rounded-full">{t}</span>)}
                        </div>
                    </div>
                </a>
            ))}
        </>
    );
}

function Resume() {
    if (!site.resumePdf) return <CV />;
    return <iframe className="h-full w-full" src={site.resumePdf} title={`${site.name} CV`} frameBorder="0"></iframe>;
}
