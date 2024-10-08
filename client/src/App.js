import logo from "./logo.svg";
import "./App.css";
import CrawlPage from "../src/pages/Crawl";
import GscCrawlPage from "../src/pages/gscCrawl";
import LinksPage from "../src/pages/Links";
import ClientPage from "../src/pages/Client";

// import NotFoundPage from "../src/pages/404Page";
import Nav from "../src/components/nav/index";

// Needed for react router
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <>
      <BrowserRouter>
        {/* The Navbar is added here to be added to every page that renders */}
        <Nav />
        <main>
          {/* Routing to render different pages when needed */}
          <Routes>
            <Route path="/crawl" element={<CrawlPage />} />
            <Route path="/Links" element={<LinksPage />} />
            <Route path="/client" element={<ClientPage />} />
            <Route path="/gscLinks" element={<GscCrawlPage />} />
          </Routes>
          {/* Renders the footer to the bottom of each page */}
          {/* <Footer /> */}
        </main>
      </BrowserRouter>
    </>
  );
}

export default App;
