import React from "react";

function Nav() {
    return(
        <header className="main-header">
            <div className="header-home-page">
                <a className="header-nav-a-tag" href="/links">Home</a>
            </div>

            <div className="header-links">
                <a className="header-nav-a-tag" href="/client">Create Client</a>
                <a style={{marginLeft: '12px;'}} className="header-nav-a-tag" href="/crawl">Crawl</a>
            </div>
        </header>
    );
}

export default Nav;