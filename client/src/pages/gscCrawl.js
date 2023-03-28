import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect } from "react";
import Spinner from "../components/Spinner";
import { gscCrawlLink } from "../../src/features/gscLinks/gscLinksSlice";
import GSCLinkItem from "../components/items/gscLinkItem";
// import { upload } from "../../../server/controllers/gscController";

function GscCrawlPage() {
  let dataLinksLength;
  const MAX_COUNT = 2;
  const { isLoading, isError, message } = useSelector((state) => state.links);
  const { gscLinks } = useSelector((state) => state.gscLinks);

  const dispatch = useDispatch();

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [fileLimit, setFileLimit] = useState(false);
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

  const handleFileEvent =  (e) => {
    const chosenFiles = Array.prototype.slice.call(e.target.files)
    handleUploadFiles(chosenFiles);
  }

  // submit form
  const handleUploadFiles = async files => {
    const formData = new FormData();
    const uploaded = [...uploadedFiles];
    let limitExceeded = false;
    await files.some((file) => {
        if (uploaded.findIndex((f) => f.name === file.name) === -1) {
          for (let i = 0; i < file.length; i++) {
            formData.append('monfichier', file[i]);
          }
            uploaded.push(file);
            if (uploaded.length === MAX_COUNT) setFileLimit(true);
            if (uploaded.length > MAX_COUNT) {
                alert(`You can only add a maximum of ${MAX_COUNT} files`);
                setFileLimit(false);
                limitExceeded = true;
                return true;
            }
        }
    })
    if (!limitExceeded) setUploadedFiles(uploaded)
    callDispatch(formData);
  };


  const callDispatch =  (formData) => {
    console.log(formData);
    dispatch(gscCrawlLink(formData));
  }

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
              onChange={handleFileEvent}
              disabled={fileLimit}
              webkitdirectory
              multiple
            />
            <button type="submit" onClick={handleUploadFiles}>
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
