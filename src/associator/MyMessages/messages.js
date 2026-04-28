import React from 'react';
import MessagesComponent from "../../components/Messages/MessagesComponent"
const AssociatorMessages = () => {
  const config = {
    // Set to true if you want to show search icon
    showSearchIcon: true,
    // Set to true if you want recipient dropdown functionality
    hasRecipientDropdown: false,
    // If hasRecipientDropdown is true, provide a loader function
    recipientsLoader: null,
    // Set to true if you want attachment support
    supportAttachments: true,
  };

  return (
    <MessagesComponent config={config} />
  );
};

export default AssociatorMessages;