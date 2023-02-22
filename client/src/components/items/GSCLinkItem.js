import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect } from "react";
import Spinner from "../Spinner";
import linksService from "../../features/links/linksService";

function GSCLinkItem({ gscLink }) {
  // console.log('Inside gscLink item', gscLink)
  //   const dispatch = useDispatch();
  // const { isLoading, isError, message } = useSelector((state) => state.links);

  // useEffect(() => {
  //   // Check if theres an error from redux
  //   if (isError) {
  //     console.log(message);
  //   }
  // }, [isError, message]);

  // if (isLoading) {
  //   return <Spinner />;
  // }
  return (
    <section className="links_item_div">
      <p className="links_item">
        urlFrom: <b>{gscLink.URLFrom}</b>
      </p>
      <p className="links_item">
        link to: <b>{gscLink.link}</b>
      </p>
      <p className="links_item">
        text: <b>{gscLink.text}</b>
      </p>
    </section>
  );
}

export default GSCLinkItem;
