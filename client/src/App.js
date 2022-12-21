import logo from "./logo.svg";
import "./App.css";
import CrawlPage from "../src/pages/Crawl";
import Nav from "../src/components/nav/index";

function App() {
  return (
    <>
      <Nav />
      <CrawlPage />
    </>
  );
}

export default App;
