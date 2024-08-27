import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect } from "react";
import Spinner from "../Spinner";
import clientService from "../../features/clients/clientService";
// import { getLinks } from '../../features/links/linksSlice';

function ClientItem({ client, links }) {
  //   const dispatch = useDispatch();
  const { isLoading, isError, message } = useSelector((state) => state.client);

  const [formState, setFormState] = useState({
    clientName: client.clientName,
    clientWebsite: client.clientWebsite,
    clientLink: client.clientLink,
  });

  const getLinkFromClients = (client, links) => {
    // let linkFromID = links._id; // Gives you link ID from link model
    let linkArray = links; // Array of Links pulled from parent
    let clientLinkID = client.clientLink;
    // client.clientLink - Gives you link ID stored in client model

    // clientLinkID.forEach((links) => {
    //   if(clientLinkID.includes(linkFromID)){
    //     return <span>{links.urlFrom}</span>
    //   } else {
    //     return 
    //   }
    // })

    // const clientMap = clientLinkID.map((client) => (
      
    //   <p className="links_item">
    //     <b>{clientLinkID.includes(linkFromID)}</b>
    //   </p>
    // ))

    return client.clientLink
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
  // console.log(client);
  return (
    <section className="links_item_div">
      <p className="links_item">
        Client Name: <b>{client.clientName}</b>
      </p>
      <p className="links_item">
        Client Website: <b>{client.clientWebsite}</b>
      </p>
      <p className="links_item">Links:{getLinkFromClients(client)} </p>
    </section>
  );
}

export default ClientItem;
