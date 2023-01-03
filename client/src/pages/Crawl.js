import React from "react";

function CrawlPage() {
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
            <input type="file" id="user-input-file1" name="user-input-file1" accept=".csv" />
            <button type="submit">
              Submit
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default CrawlPage;
