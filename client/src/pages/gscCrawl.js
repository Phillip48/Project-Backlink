import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect } from "react";
import Spinner from "../components/Spinner";
import { gscCrawlLink } from "../../src/features/gscLinks/gscLinksSlice";
import GSCLinkItem from "../components/items/gscLinkItem";

function GscCrawlPage() {
  let dataLinksLength;
  const { isLoading, isError, message } = useSelector((state) => state.links);
  const { gscLinks } = useSelector((state) => state.gscLinks);

  const dispatch = useDispatch();

  const [inputFile, setInputFile] = useState("");
  const [formState, setFormState] = useState("");
  const [active, setActive] = useState("none");

  const ifLinks = () => {
    let dataLinks = gscLinks.data;
    if (active === "all-links") {
      if (dataLinks != undefined) {
        dataLinksLength = dataLinks.length;
        console.log(dataLinks);
        const getLinks = dataLinks.map((gscLinks) => (
          <GSCLinkItem key={gscLinks.id} gscLink={gscLinks} />
        ));
        return getLinks;
      }
    } else {
      return <></>;
    }
  };

  const handleChange = (event) => {
    setInputFile(event.target.files[0]);
    setFormState({ ...formState, [event.target.name]: event.target.value });
  };

  // submit form
  const handleFormSubmit = async (event) => {
    setActive("all-links");
    let formData = new FormData();
    formData.append("csvFile", inputFile);
    event.preventDefault();
    dispatch(gscCrawlLink(formData));
    // clear
    setFormState({});
    // window.location.reload();
  };

  useEffect(() => {
    // Check if theres an error from redux
    if (isError) {
      console.log(message);
    }
  }, [isError, message]);

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <section className="crawl-page-wrapper">
      <h3>
        Insert CSV file to crawl. The websites need to be using the
        protocol/scheme, sub-domain, domain and the top level domain
      </h3>
      <div className="topnav">
        <div className="search-container">
          <form
            enctype="multipart/form-data"
            className="crawl-form"
            id="csvFile_upload"
          >
            <span>CSV file:</span>
            <br></br>
            <input
              type="file"
              id="csvFile_input"
              // name="csvFile"
              accept=".csv"
              value={formState.csvFile}
              onChange={handleChange}
              webkitdirectory
              multiple
            />
            <button type="submit" onClick={handleFormSubmit}>
              Submit
            </button>
          </form>
        </div>
      </div>
      <div>{ifLinks()}</div>
    </section>
  );
}

export default GscCrawlPage;
