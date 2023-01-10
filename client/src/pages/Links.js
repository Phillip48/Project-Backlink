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

  const mapLinks = () => {
    if (links) {
      return links.map((links) => <LinkItem key={links.id} links={links} />);
    } else {
      return "No links";
    }
  };
  
  const linkStatCounter = () => {
    if (links) {
      links.forEach((links) => {
        linksCount++;
      });
      return linksCount;
    } else {
      return "No links";
    }
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
        <h3>Search for links:</h3>
        <h3>Total links:{linkStatCounter()}</h3>
      </div>
      <div className="links_results">{mapLinks()}</div>
    </section>
  );
};

export default LinkPage;
