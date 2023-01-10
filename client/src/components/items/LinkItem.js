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
    <section className="links_item">
      <p>test: {links.urlFrom}</p>
    </section>
  );
}

export default LinkItem;
