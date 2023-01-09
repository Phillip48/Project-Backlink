import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect } from "react";
import Spinner from "../components/Spinner";
import { getLinks, deleteLinks } from "../../src/features/links/linksSlice";

const LinkPage = () => {
  const { isLoading, isError, message } = useSelector((state) => state.links);

  const dispatch = useDispatch();

  useEffect(() => {
    // Check if theres an error from redux
    if (isError) {
      console.log(message);
    }

    dispatch(getLinks());

    return () => {
      dispatch(reset());
    };
  });

  if (isLoading) {
    return <Spinner />;
  }
  return (
    <section className="main_links_section">
      <div className="links_title">
        <h3>Search for links:</h3>
      </div>
      <div className="links_results">
        {/* Render results here */}
      </div>
    </section>
  );
};

export default LinkPage;
