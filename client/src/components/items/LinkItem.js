import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect } from "react";
import Spinner from "../Spinner";
import linksService from "../../features/links/linksService";

function LinkItem({ links }) {
  //   const dispatch = useDispatch();
  const { isLoading, isError, message } = useSelector((state) => state.links);

  const [formState, setFormState] = useState({
    urlFrom: links.urlFrom,
    urlTo: links.urlTo,
    text: links.text,
    linkStatus: links.linkStatus,
    statusText: links.statusText,
    linkFollow: links.linkFollow,
    dateFound: links.dateFound,
    dateLastChecked: links.dateLastChecked,
  });

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
    <section className="links_item_div">
      <p className="links_item">urlFrom: <b>{links.urlFrom}</b></p>
      <p className="links_item">urlTo: <b>{links.urlTo}</b></p>
      <p className="links_item">text: <b>{links.text}</b></p>
      <p className="links_item">linkStatus: <b>{links.linkStatus}</b></p>
      <p className="links_item">statusText: <b>{links.statusText}</b></p>
      <p className="links_item">linkFollow: <b>{links.linkFollow}</b></p>
      <p className="links_item">dateFound: <b>{links.dateFound}</b></p>
      <p className="links_item">dateLastChecked: <b>{links.dateLastChecked}</b></p>
    </section>
  );
}

export default LinkItem;
