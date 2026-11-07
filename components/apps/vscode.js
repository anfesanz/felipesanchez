import React from 'react'
import site from '../../site.config'

export default function VsCode() {
    return (
        <iframe src={site.repo.replace("github.com", "github1s.com") + "/blob/HEAD/shiny-apps/survival-explorer/app.R"} frameBorder="0" title="VsCode" className="h-full w-full bg-ub-cool-grey"></iframe>
        // this is not my work, but it's amazing!
        // Here is the link to the original repo: https://github.com/conwnet/github1s
    )
}

export const displayVsCode = () => {
    <VsCode> </VsCode>
}
