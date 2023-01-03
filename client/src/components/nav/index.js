import React from "react";

function Nav() {
    return(
        <header className="main-header">
            <div className="header-home-page">
                <a className="header-nav-a-tag" href="/">Home</a>
            </div>

            <div className="header-links">
                <a className="header-nav-a-tag" href="/">Crawled Links</a>
            </div>
        </header>
    );
}

export default Nav;