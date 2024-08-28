import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect } from "react";
import Spinner from "../Spinner";
import clientService from "../../features/clients/clientService";
import { getLinks, getSingleLink } from "../../features/links/linksSlice";

function ClientItem({ client, links }) {
  let finalClientItem;
  // console.log(links); - working
  // const linksNew = links;
  // let clientLinkDone = false;
  const dispatch = useDispatch();
  const { isLoading, isError, message } = useSelector((state) => state.client);

  const [formState, setFormState] = useState({
    clientName: client.clientName,
    clientWebsite: client.clientWebsite,
    clientLink: client.clientLink,
  });

  const getLinkFromClients = (client) => {
    for (let i = 0; i < links.length; i++) {
      const element = links[i]._id;
      if (client.clientLink.length <= 0) {
        return <p>No links</p>;
      } else {
        for (let i = 0; i < client.clientLink.length; i++) {
          const element = client.clientLink[i];
          console.log(element);
          if (element == client.clientLink[i]) {
            // Return breaks the loop so only 1 item displays, maybe push into an array and display array?
            return (
              <section className="links_item_div">
                <p className="links_item">
                  urlFrom: <b>{links[i].urlFrom}</b>
                </p>
                <p className="links_item">
                  urlTo: <b>{links[i].urlTo}</b>
                </p>
                <p className="links_item">
                  text: <b>{links[i].text}</b>
                </p>
                <p className="links_item">
                  linkStatus: <b>{links[i].linkStatus}</b>
                </p>
                <p className="links_item">
                  statusText: <b>{links[i].statusText}</b>
                </p>
                <p className="links_item">
                  linkFollow: <b>{links[i].linkFollow}</b>
                </p>
                <p className="links_item">
                  dateFound: <b>{links[i].dateFound}</b>
                </p>
                <p className="links_item">
                  dateLastChecked: <b>{links[i].dateLastChecked}</b>
                </p>
              </section>
            );
          }
        }
      }
    }
  };

  useEffect(() => {
    // Check if theres an error from redux
    if (isError) {
      console.log(message);
    }
  }, [isError, message]);
  // dispatch(getSingleLink(clientIDArray));
  if (isLoading) {
    return <Spinner />;
  }
  // console.log(client);
  return (
    <section className="links_item_div">
      <p className="links_item">
        Client Name: <b>{client.clientName}</b>
      </p>
      <p className="links_item">
        Client Website: <b>{client.clientWebsite}</b>
      </p>
      {getLinkFromClients(client)}
    </section>
  );
}

export default ClientItem;
