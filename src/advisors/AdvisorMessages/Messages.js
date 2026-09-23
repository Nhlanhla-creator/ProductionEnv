import React from 'react';
import MessagesComponent from 'components/Messages/MessagesComponent';

const AdvisorMessages = () => {
  const config = { showSidebarOffset: false,
  supportAttachments: true,   // was false
  showSearchIcon: true,
  hasRecipientDropdown: true}
  return (
    <MessagesComponent config={config} />
  );
};

export default AdvisorMessages;