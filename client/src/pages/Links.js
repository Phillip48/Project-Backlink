import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect } from "react";
import Spinner from "../components/Spinner";
import {
  getLinks,
  deleteLinks,
  reset,
} from "../../src/features/links/linksSlice";
import LinkItem from "../components/items/LinkItem";

const LinkPage = () => {
  let linksCount = 0;
  const { isLoading, isError, message } = useSelector((state) => state.links);
  const { links } = useSelector((state) => state.links);
  const dispatch = useDispatch();

  const [formState, setFormState] = useState("");
  const [active, setActive] = useState("all-links");

  const isActive = () => {
    if (active === "all-links") {
      if (links) {
        return links.map((links) => <LinkItem key={links.id} links={links} />);
      } else {
        return "No links";
      }
    } else if (active === "filter-links") {
      if (links) {
        const getLinks = links.map((links) => (
          <LinkItem key={links.id} links={links} />
        ));
        const filteredLinks = getLinks.filter((links) => {
          console.log(links)
          return links.urlFrom == formState;
        });
        return filteredLinks;
      } else {
        return "No links";
      }
    }
  };

  const isActiveButton = () => {
    if (active === "filter-links") {
      return (
        <button
          onClick={() => {
            setActive("all-links");
          }}
        >
          See All
        </button>
      );
    } else if (active === "all-links") {
      return (
        <button
          onClick={() => {
            setActive("filter-links");
          }}
        >
          Filter Links
        </button>
      );
    }
  };

  const linkStatCounter = () => {
    if (links) {
      links.forEach((link) => {
        linksCount++;
      });
      return linksCount;
    } else {
      return "No links";
    }
  };

  const handleChange = (event) => {
    const { value } = event.target;

    setFormState(value);
    console.log(formState);
    // const getLinks = links.map((links) => (
    //   <LinkItem key={links.id} links={links} />
    // ));
    // const filteredLinks = getLinks.filter((links) => {
    //   return links.urlFrom == formState;
    // });
    // return filteredLinks;
  };

  // submit form
  const handleFormSubmit = async (event) => {
    event.preventDefault();

    // links.filter((links)=>{return links.includes(formState)})
    console.log(formState);
  };

  useEffect(() => {
    // Check if theres an error from redux
    if (isError) {
      console.log(message);
    }
    dispatch(getLinks());

    return () => {
      dispatch(reset());
    };
  }, [isError, message, dispatch]);

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <section className="main_links_section">
      <div className="links_title">
        <h3>All Links:</h3>
        <h3>Total links:{linkStatCounter()}</h3>
        {isActiveButton()}
      </div>
      {active === "filter-links" ? (
        <div className="links_filter">
          <form>
            <input type="text" value={formState} onChange={handleChange} />
            <button
              onClick={() => {
                handleFormSubmit();
              }}
            >
              Submit
            </button>
          </form>
        </div>
      ) : (
        <></>
      )}
      <div className="links_results">{isActive()}</div>
    </section>
  );
};

export default LinkPage;
