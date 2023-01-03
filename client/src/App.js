import logo from "./logo.svg";
import "./App.css";
import CrawlPage from "../src/pages/Crawl";
import Nav from "../src/components/nav/index";

// Needed for react router
import {
  HashRouter,
  Routes,
  Route
} from "react-router-dom";

function App() {
  return (
    <HashRouter>
      {/* The Navbar is added here to be added to every page that renders */}
      <Nav />
      <main>
        {/* Routing to render different pages when needed */}
        <Routes>
          <Route
            path="/"
            element={<CrawlPage />}
          />
        </Routes>
        {/* Renders the footer to the bottom of each page */}
        {/* <Footer /> */}
      </main>
    </HashRouter>
  );
}

export default App;
