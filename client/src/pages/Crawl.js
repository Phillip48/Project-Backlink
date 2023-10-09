import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect } from "react";
import Spinner from "../components/Spinner";
import {
  createLink,
  crawlLink,
  recheckLinks,
  deleteLinks,
} from "../../src/features/links/linksSlice";

let csv = "";
let link;
let excel;

function CrawlPage() {
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
    formData.append("csvFile", inputFile);
    event.preventDefault();
    dispatch(crawlLink(formData))
      .then(async (res) => {
        let newData = res.payload.data;
        // let clientData = newData[1];
        // let otherData = newData[0];
        // Puts both files together
        // const allData = clientData.concat(otherData);
        let clientData = newData;
        console.log("client links", clientData);
        // console.log("other links", otherData);
        if (clientData == "No links found") {
          return alert("No links found");
        }
        downloadCSV(clientData);
        setFormState({});
      })
      .catch((error) => console.log(error));
    // setFormState({});
  };
  // function createCSV(array) {
  //   console.log(array);
  //   // let keys = Object.keys(array[0]); //Collects Table Headers
  //   const keys = [
  //     "urlFrom",
  //     "urlTo",
  //     "text",
  //     "linkStatus",
  //     "statusText",
  //     "linkFollow",
  //   ];
  //   console.log(keys);

  //   let result = ""; //CSV Contents
  //   result += keys.join(","); //Comma Seperates Headers
  //   result += "\n"; //New Row

  //   // Might need to change this as its an object not an array
  //   array.forEach(function (item) {
  //     //Goes Through Each Array Object
  //     keys.forEach(function (key) {
  //       //Goes Through Each Object value
  //       result += item[key] + ","; //Comma Seperates Each Key Value in a Row
  //     });
  //     result += "\n"; //Creates New Row
  //   });
  //   return result;
  // }
  function createCSV(array) {
    console.log(array);
    const csvRows = [];
    // const headers = Object.keys(data[0]);
    // let keys = Object.keys(array[0]); //Collects Table Headers
    const headers = [
      "urlFrom",
      "urlTo",
      "text",
      "linkStatus",
      "statusText",
      "linkFollow",
    ];

    /* Using push() method we push fetched
           data into csvRows[] array */
    csvRows.push(headers.join(","));

    // Loop to get value of each objects key
    for (const row of array) {
      const values = headers.map((header) => {
        const val = row[header];
        return `"${val}"`;
      });

      // To add, separator between each value
      csvRows.push(values.join(","));
    }

    /* To add new line for each objects values
           and this return statement array csvRows
           to this function.*/
    return csvRows.join("\n");
  }

  const downloadCSV = (newData) => {
    // let payloadData = newData;
    // let header = Object.keys(payloadData[0]).join(",");
    // let values = payloadData.map((o) => Object.values(o).join(",")).join("\n");
    // csv += header + "\n" + values;
    console.log(newData);
    csv = "data:text/csv;charset=utf-8," + createCSV(newData);
    excel = encodeURI(csv); //Links to CSV
    link = document.createElement("a");
    link.setAttribute("href", excel); //Links to CSV File
    link.setAttribute("download", "output.csv"); //Filename that CSV is saved as
    link.click();
  };

  const handleFormSubmitRecheck = async (event) => {
    event.preventDefault();
    dispatch(recheckLinks());
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
      {/* <div className="crawl_link_links">
        <a href="/gscLinks">Upload a GSC CSV File</a>
      </div>
      <div className="crawl_link_links">
        <a href="/links">Crawled Links - Click Here!</a>
      </div>
      <div className="crawl_link_links">
        <button onClick={handleFormSubmitRecheck}>Recheck DB Links</button>
      </div> */}

      {/* <div className="crawl_link_links">
        <button
          // onclick={downloadCSV()}
          id="download-csv"
        >
          Download
        </button>
      </div> */}
    </section>
  );
}

export default CrawlPage;
