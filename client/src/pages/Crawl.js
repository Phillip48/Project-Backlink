import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect } from "react";
import Spinner from "../Spinner";
import {
  createLink,
  crawlLink,
  deleteLinks,
} from "../../src/features/links/linksSlice";

function CrawlPage() {
  const { isLoading, isError, message } = useSelector((state) => state.links);

  const dispatch = useDispatch();
  const [formState, setFormState] = useState({});

  const { file } = formState;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormState({
      ...formState,
      [name]: value,
    });
  };

  // submit form
  const handleFormSubmit = async (event) => {
    event.preventDefault();
    const userData = {
      file,
    };
    dispatch(crawlLink(userData));
    // clear
    setFormState({});
    window.location.reload();
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

      {/* <div class="topnav">
        <div class="search-container">
          <form>
            <span>Link:</span>
            <br></br>
            <input type="text" placeholder="Search.." />
            <button type="submit">
              <i class="fa fa-search"></i>
            </button>
          </form>
        </div>
      </div> */}

      <div className="topnav">
        <div className="search-container">
          <form className="crawl-form">
            <span>CSV file:</span>
            <br></br>
            <input
              type="file"
              id="user-input-file1"
              name="user-input-file1"
              accept=".csv"
              value={formState.file}
              onChange={handleChange}
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

export default CrawlPage;
