import React from 'react'
import site from '../../site.config'

// Same approach as the original Ubuntu portfolio: an iframe of github1s.com,
// which renders a GitHub repo in a read-only VS Code UI. It only works for public repos.
export default function VsCode() {
    const { repo, file } = site.vscode;
    return (
        <iframe src={repo.replace("github.com", "github1s.com") + "/blob/HEAD/" + file} frameBorder="0" title="VsCode" className="h-full w-full bg-ub-cool-grey"></iframe>
    )
}

export const displayVsCode = () => <VsCode />;
