import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect } from "react";
import Spinner from "../Spinner";
import clientService from "../../features/clients/clientService";

function ClientItem({ client }) {
  //   const dispatch = useDispatch();
  const { isLoading, isError, message } = useSelector((state) => state.client);

  const [formState, setFormState] = useState({
    clientName: client.clientName,
    clientWebsite: client.clientWebsite,
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
      <p className="links_item">Client Name: <b>{client.clientName}</b></p>
      <p className="links_item">Client Website: <b>{client.clientWebsite}</b></p>
    </section>
  );
}

export default ClientItem;
