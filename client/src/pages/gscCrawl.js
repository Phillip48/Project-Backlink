import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect } from "react";
import Spinner from "../components/Spinner";
import {
  gscCrawlLink,
} from "../../src/features/links/linksSlice";

function gscCrawlPage() {
  const { isLoading, isError, message } = useSelector((state) => state.links);

  const dispatch = useDispatch();

  const [inputFile, setInputFile] = useState("");
  const [inputFileName, setInputFileName] = useState("");
  const [formState, setFormState] = useState("");
  // const { csvFile } = formState;

  const handleChange = (event) => {
    setInputFile(event.target.files[0]);
    setInputFileName(event.target.files[0].name);
    setFormState({ ...formState, [event.target.name]: event.target.value });
  };

  // submit form
  const handleFormSubmit = async (event) => {
    let formData = new FormData();
    formData.append('csvFile', inputFile);
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
              webkitdirectory multiple
            />
            <button type="submit" onClick={handleFormSubmit}>
              Submit
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default gscCrawlPage;
