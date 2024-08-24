import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect } from "react";
import { Label, Input, Row, Col, FormGroup } from "reactstrap";
import Spinner from "../components/Spinner";
import {
  getClient,
  createClient,
  deleteClient,
  reset,
} from "../../src/features/clients/clientSlice";
// import ClientItem from "../components/items/clientItem";

const ClientPage = () => {
  let clientCount = 0;
  const { isLoading, isError, message } = useSelector((state) => state.client);
  const { client } = useSelector((state) => state.client);
  const dispatch = useDispatch();

  const [formState, setFormState] = useState("");
  const [clientState, setClientState] = useState({
    clientName: "",
    clientWebsite: "",
  });
  const { clientName, clientWebsite } = clientState;

  const clientStatCounter = () => {
    if (client) {
      client.forEach((client) => {
        clientCount++;
      });
      return clientCount;
    } else {
      return "No clients";
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setClientState({
      ...clientState,
      [name]: value,
    });
  };

  // submit form
  const handleFormSubmit = async (event) => {
    event.preventDefault();
    const clientData = {
      clientName: clientState.clientName,
      clientWebsite: clientState.clientWebsite,
    };
    console.log("Before dispatch", clientData);
    dispatch(createClient(clientData));
  };

  useEffect(() => {
    // Check if theres an error from redux
    if (isError) {
      console.log(message);
    }

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
        <h3>All Clients:</h3>
        <h3>Total Clients:{clientStatCounter()}</h3>
      </div>
      <div>
        <form onSubmit={handleFormSubmit} className="holds-log-forms">
          <Col md={12} className="user-grades-inputs-col">
            <FormGroup>
              <Label className="" for="clientName">
                Client Name:
              </Label>
              <Input
                id="clientName"
                name="clientName"
                placeholder={"Law Firm"}
                type="text"
                required
                value={clientState.clientName}
                onChange={handleChange}
              />
            </FormGroup>
            <FormGroup>
              <Label className="" for="clientWebsite">
                Client Website Url:
              </Label>
              <Input
                id="clientURL"
                name="clientWebsite"
                placeholder={"https://lawfirm.com/"}
                type="text"
                required
                value={clientState.clientWebsite}
                onChange={handleChange}
              />
            </FormGroup>
          </Col>
        </form>
        <div className="form-center-button">
          <button type="submit" className="" onClick={handleFormSubmit}>
            Create Client
          </button>
        </div>
      </div>
    </section>
  );
};

export default ClientPage;
