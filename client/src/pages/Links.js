import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect } from "react";
import Spinner from "../components/Spinner";
import {
  getLinks,
  getSingleLink,
  deleteLinks,
  reset,
} from "../../src/features/links/linksSlice";
import { getClient } from "../../src/features/clients/clientSlice";
import LinkItem from "../components/items/LinkItem";
import ClientItem from "../components/items/clientItem";

const LinkPage = () => {
  let linksCount = 0;
  let clientCount = 0;
  const { isLoading, isError, message } = useSelector((state) => state.links);
  const { links } = useSelector((state) => state.links);
  const { client } = useSelector((state) => state.client);
  const dispatch = useDispatch();

  const [formState, setFormState] = useState("");
  const [active, setActive] = useState("all-links");

  const clientStatCounter = () => {
    if (client) {
      client.forEach((client) => {
        clientCount++;
      });
      return <p>Total Clients: {clientCount}</p>;
    } else {
      return <p>No clients</p>;
    }
  };

  const clientCheck = () => {
    // let forEachCounter = 0;
    // console.log("links checker", links);  // Gives an array iof objects that has the link data
    // console.log("client checker", client);
    // const returnLinkArray = links.forEach((link) => {
    //   forEachCounter ++;
    //   let indClient = client[forEachCounter].clientLink; // Inside array of objects that is link ID
    //   if(indClient[forEachCounter].includes(link._id)){
    //     return (
    //     <span>
    //       {link.urlFrom},<br/>
    //       {link.urlTo}
    //      </span>
    //   )
    //   } else {
    //     forEachCounter ++;
    //     return 
    //   }
    // })

    if (client) {
      // console.log('links', links);
      // [ {CLIENT OBJECT, _id}, ... ETC ]
      // console.log('clients', client)
      // [ {CLIENT OBJECT, [ {link ids} ] }... ETC ]
      // for (let i = 0; i < links.length; i++) {
      //   const element = links[i]._id;
      //   console.log('ID', element);

      // }

      // for (let i = 0; i < client.length; i++) {
      //   const element = client[i];
      //   // console.log(element.clientLink);
      //   let clientLink= element.clientLink;
      //   if(clientLink.length > 0){
      //     for (let i = 0; i < clientLink.length; i++) {
      //       const element2 = clientLink[i];
      //       // console.log('Link ID from client', element2)
      //     }
      //   }
      // }
      return client.map((client) => (
        <ClientItem key={client.id} client={client} links={links}/>
      ));
    } else {
      return <p>No clients!</p>;
    }
  };

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
          console.log(links);
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
    // console.log(formState);
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
    // console.log(formState);
  };

  useEffect(() => {
    // Check if theres an error from redux
    if (isError) {
      console.log(message);
    }
    dispatch(getLinks());
    dispatch(getClient());

    return () => {
      dispatch(reset());
    };
  }, [isError, message, dispatch]);

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <section className="main_links_section">
      <div className="hold_info_wrapper">
        <div className="links_title">
          <h2>All Links:</h2>
          <h3>Total links:{linkStatCounter()}</h3>
          {isActiveButton()}
          <div className="links_results">{isActive()}</div>
        </div>
        <div className="clients_title">
          <h2>All Clients:</h2>
          <h3>Total clients:{clientStatCounter()}</h3>
          {clientCheck()}
        </div>
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
    </section>
  );
};

export default LinkPage;
